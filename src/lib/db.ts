import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { Pool } from 'pg';
import { GameItem, Platform, PriceHistoryEntry, SyncRunSummary } from '@/types/game';

type SqlClient = {
  query: (queryWithPlaceholders: string, params?: unknown[]) => Promise<unknown[]>;
};

let neonClient: NeonQueryFunction<false, false> | null = null;
let postgresPool: Pool | null = null;
export class DatabaseConfigurationError extends Error {}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new DatabaseConfigurationError('DATABASE_URL is not configured.');
  return databaseUrl;
}

function getNeonSql(databaseUrl: string): SqlClient {
  if (!neonClient) neonClient = neon(databaseUrl);
  return {
    query: (queryWithPlaceholders, params) => neonClient!.query(queryWithPlaceholders, params),
  };
}

function getPostgresSql(databaseUrl: string): SqlClient {
  if (!postgresPool) postgresPool = new Pool({ connectionString: databaseUrl });
  return {
    query: async (queryWithPlaceholders, params) => {
      const result = await postgresPool!.query(queryWithPlaceholders, params);
      return result.rows;
    },
  };
}

export function getSql(): SqlClient {
  const databaseUrl = getDatabaseUrl();
  return process.env.DB_DRIVER === 'postgres'
    ? getPostgresSql(databaseUrl)
    : getNeonSql(databaseUrl);
}

type DbRow = Record<string, unknown>;

export interface GameQuery {
  page: number;
  pageSize: number;
  platform?: Platform;
  query?: string;
  maxPrice?: number;
  inStock?: boolean;
  priceDrops?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'discount' | 'title' | 'rating';
  ids?: string[];
}

function nullableNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isoDate(value: unknown): string {
  if (!(value instanceof Date)) return String(value).slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rowToGame(row: DbRow): GameItem {
  return {
    id: String(row.box_id), title: String(row.title), platform: row.platform as Platform,
    categoryName: String(row.category_name), sellPrice: Number(row.sell_price),
    originalPrice: nullableNumber(row.previous_sell_price), cashPrice: nullableNumber(row.cash_price),
    exchangePrice: nullableNumber(row.exchange_price), imageUrl: String(row.image_url || ''),
    inStock: Boolean(row.in_stock), stockCount: nullableNumber(row.stock_count),
    condition: (row.condition as GameItem['condition']) || undefined, rating: nullableNumber(row.rating),
    genre: row.genre ? String(row.genre) : undefined, cexUrl: String(row.cex_url), priceHistory: [],
    lastUpdated: new Date(String(row.last_seen_at)).toISOString(), popular: false,
  };
}

const SORT_SQL: Record<NonNullable<GameQuery['sort']>, string> = {
  price_asc: 'g.sell_price ASC, g.title ASC',
  price_desc: 'g.sell_price DESC, g.title ASC',
  discount: '(g.previous_sell_price - g.sell_price) DESC NULLS LAST, g.sell_price ASC',
  title: 'g.title ASC',
  rating: 'g.rating DESC NULLS LAST, g.title ASC',
};

export async function listGames(query: GameQuery) {
  const sql = getSql();
  const clauses = ['g.is_active = true'];
  const values: unknown[] = [];
  const bind = (value: unknown) => { values.push(value); return `$${values.length}`; };
  if (query.platform) clauses.push(`g.platform = ${bind(query.platform)}`);
  if (query.query) {
    const titleParam = bind(`%${query.query}%`);
    const genreParam = bind(`%${query.query}%`);
    clauses.push(`(g.title ILIKE ${titleParam} OR COALESCE(g.genre, '') ILIKE ${genreParam})`);
  }
  if (query.maxPrice !== undefined) clauses.push(`g.sell_price <= ${bind(query.maxPrice)}`);
  if (query.inStock) clauses.push('g.in_stock = true');
  if (query.priceDrops) clauses.push('g.previous_sell_price > g.sell_price');
  if (query.ids?.length) clauses.push(`g.box_id = ANY(${bind(query.ids)}::text[])`);
  const where = clauses.join(' AND ');
  const filterValues = [...values];
  const order = SORT_SQL[query.sort || 'discount'];
  const offset = (query.page - 1) * query.pageSize;
  const rows = await sql.query(
    `SELECT g.* FROM games g WHERE ${where} ORDER BY ${order} LIMIT ${bind(query.pageSize)} OFFSET ${bind(offset)}`,
    values
  );
  const countRows = await sql.query(`SELECT count(*)::int AS total FROM games g WHERE ${where}`, filterValues);
  const platformRows = await sql.query(
    `SELECT platform, count(*)::int AS count FROM games WHERE is_active = true GROUP BY platform ORDER BY platform`
  );
  const syncRows = await sql.query(
    `SELECT finished_at FROM sync_runs WHERE status IN ('succeeded', 'partial') ORDER BY finished_at DESC NULLS LAST LIMIT 1`
  );
  return {
    games: (rows as DbRow[]).map(rowToGame), total: Number((countRows as DbRow[])[0]?.total || 0),
    countsByPlatform: Object.fromEntries((platformRows as DbRow[]).map((row) => [String(row.platform), Number(row.count)])),
    lastSuccessfulSyncAt: (syncRows as DbRow[])[0]?.finished_at
      ? new Date(String((syncRows as DbRow[])[0].finished_at)).toISOString() : null,
  };
}

export async function getGameHistory(gameId: string, limit = 365): Promise<PriceHistoryEntry[]> {
  const rows = await getSql().query(
    `SELECT observed_date, sell_price, cash_price, exchange_price, in_stock, stock_count
     FROM game_state_changes WHERE game_id = $1 ORDER BY observed_date ASC LIMIT $2`, [gameId, limit]
  );
  return (rows as DbRow[]).map((row) => ({
    date: isoDate(row.observed_date), price: Number(row.sell_price),
    cashPrice: nullableNumber(row.cash_price), exchangePrice: nullableNumber(row.exchange_price),
    inStock: Boolean(row.in_stock), stockCount: nullableNumber(row.stock_count),
  }));
}

export async function getLatestExchangeRate() {
  const rows = await getSql().query(
    `SELECT source_date, observed_at, base_currency, target_currency, rate, source
     FROM exchange_rates ORDER BY source_date DESC LIMIT 1`
  );
  const row = (rows as DbRow[])[0];
  if (!row) return null;
  const sourceDate = isoDate(row.source_date);
  const ageMs = Date.now() - new Date(`${sourceDate}T00:00:00+03:00`).getTime();
  return { rate: Number(row.rate), base: String(row.base_currency).trim(), target: String(row.target_currency).trim(),
    source: String(row.source), sourceDate, fetchedAt: new Date(String(row.observed_at)).toISOString(),
    isStale: ageMs > 4 * 24 * 60 * 60 * 1000 };
}

function rowToSyncRun(row: DbRow): SyncRunSummary {
  return { id: String(row.id), externalRunId: row.external_run_id ? String(row.external_run_id) : null,
    trigger: row.trigger as SyncRunSummary['trigger'], status: row.status as SyncRunSummary['status'],
    startedAt: new Date(String(row.started_at)).toISOString(),
    finishedAt: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null,
    platformCounts: (row.platform_counts || {}) as Record<string, number>, gamesSeen: Number(row.games_seen || 0),
    gamesChanged: Number(row.games_changed || 0), exchangeRateUpdated: Boolean(row.exchange_rate_updated),
    errorSummary: row.error_summary ? String(row.error_summary) : null };
}

export async function getLatestSyncRun(runId?: string): Promise<SyncRunSummary | null> {
  const rows = runId
    ? await getSql().query(`SELECT * FROM sync_runs WHERE id::text = $1 OR external_run_id = $1 LIMIT 1`, [runId])
    : await getSql().query(`SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1`);
  const row = (rows as DbRow[])[0];
  return row ? rowToSyncRun(row) : null;
}

export async function hasRunningSync(): Promise<boolean> {
  const rows = await getSql().query(
    `SELECT EXISTS(SELECT 1 FROM sync_runs WHERE status IN ('queued', 'running')
     AND started_at > now() - interval '2 hours') AS running`
  );
  return Boolean((rows as DbRow[])[0]?.running);
}

export async function getTrends(limit = 12) {
  const sql = getSql();
  const select = `SELECT g.* FROM games g WHERE g.is_active = true AND g.in_stock = true`;
  const [drops, under10, under20, totalRows] = await Promise.all([
    sql.query(`${select} AND g.previous_sell_price > g.sell_price
      ORDER BY ((g.previous_sell_price - g.sell_price) / g.previous_sell_price) DESC LIMIT $1`, [limit]),
    sql.query(`${select} AND g.sell_price <= 10 ORDER BY g.sell_price ASC, g.title ASC LIMIT $1`, [limit]),
    sql.query(`${select} AND g.sell_price > 10 AND g.sell_price <= 20
      ORDER BY g.rating DESC NULLS LAST, g.sell_price ASC LIMIT $1`, [limit]),
    sql.query(`SELECT count(*)::int AS total FROM games WHERE is_active = true`),
  ]);
  return {
    priceDrops: (drops as DbRow[]).map(rowToGame),
    under10: (under10 as DbRow[]).map(rowToGame),
    under20: (under20 as DbRow[]).map(rowToGame),
    totalTracked: Number((totalRows as DbRow[])[0]?.total || 0),
  };
}
