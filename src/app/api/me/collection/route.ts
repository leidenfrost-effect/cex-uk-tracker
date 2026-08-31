import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseConfigurationError, getUserCollection, saveUserCollection } from '@/lib/db';
import { BasketItem, GameItem, Platform, UserCollectionDraft } from '@/types/game';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLATFORMS = new Set<Platform>(['PS5', 'PS4', 'XBOX_SX', 'XBOX_ONE', 'XBOX_360']);
const PRIORITIES = new Set(['must_buy', 'high', 'nice_to_have', 'backup']);
const MAX_BASKET_ITEMS = 500;
const MAX_CUSTOM_GAMES = 100;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown, max: number, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

function numberValue(value: unknown, fallback: number | undefined = undefined): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function game(value: unknown): GameItem | null {
  const source = record(value);
  if (!source) return null;
  const id = text(source.id, 200);
  const title = text(source.title, 500);
  const platform = text(source.platform, 20) as Platform;
  const sellPrice = numberValue(source.sellPrice);
  if (!id || !title || !PLATFORMS.has(platform) || !sellPrice || sellPrice <= 0 || sellPrice > 10000) return null;
  const history = Array.isArray(source.priceHistory) ? source.priceHistory.slice(-100).flatMap((entry) => {
    const point = record(entry);
    const price = numberValue(point?.price);
    const date = text(point?.date, 30);
    return price && price > 0 && date ? [{
      date,
      price,
      cashPrice: numberValue(point?.cashPrice),
      exchangePrice: numberValue(point?.exchangePrice),
      inStock: typeof point?.inStock === 'boolean' ? point.inStock : undefined,
      stockCount: numberValue(point?.stockCount),
    }] : [];
  }) : [];
  const optionalNumber = (field: string) => numberValue(source[field]);
  return {
    id,
    title,
    platform,
    categoryName: text(source.categoryName, 200, `${platform} Software`),
    sellPrice,
    originalPrice: optionalNumber('originalPrice'),
    cashPrice: optionalNumber('cashPrice'),
    exchangePrice: optionalNumber('exchangePrice'),
    imageUrl: text(source.imageUrl, 2000),
    inStock: source.inStock !== false,
    stockCount: optionalNumber('stockCount'),
    condition: ['Mint', 'Boxed', 'Unboxed', 'Standard'].includes(text(source.condition, 20))
      ? text(source.condition, 20) as GameItem['condition'] : undefined,
    rating: optionalNumber('rating'),
    releaseYear: optionalNumber('releaseYear'),
    genre: text(source.genre, 200) || undefined,
    cexUrl: text(source.cexUrl, 2000) || undefined,
    priceHistory: history,
    lastUpdated: text(source.lastUpdated, 50, new Date().toISOString()),
    popular: typeof source.popular === 'boolean' ? source.popular : undefined,
  };
}

function basketItem(value: unknown): BasketItem | null {
  const source = record(value);
  const parsedGame = game(source?.game);
  const priority = text(source?.priority, 30, 'must_buy');
  const quantity = Math.min(Math.max(Math.floor(numberValue(source?.quantity, 1) || 1), 1), 99);
  if (!source || !parsedGame || !PRIORITIES.has(priority)) return null;
  return {
    game: parsedGame,
    addedAt: text(source.addedAt, 50, new Date().toISOString()),
    priority: priority as BasketItem['priority'],
    targetStore: text(source.targetStore, 300) || undefined,
    userNotes: text(source.userNotes, 2000) || undefined,
    purchased: source.purchased === true,
    quantity,
  };
}

function parseCollection(value: unknown): UserCollectionDraft | null {
  const source = record(value);
  if (!source || !Array.isArray(source.basket) || !Array.isArray(source.customGames)) return null;
  if (source.basket.length > MAX_BASKET_ITEMS || source.customGames.length > MAX_CUSTOM_GAMES) return null;
  const basket = source.basket.map(basketItem).filter((item): item is BasketItem => item !== null);
  const customGames = source.customGames.map(game).filter((item): item is GameItem => item !== null && item.id.startsWith('CUSTOM-'));
  if (basket.length !== source.basket.length || customGames.length !== source.customGames.length) return null;
  const budgetLimitGbp = numberValue(source.budgetLimitGbp, 300) || 300;
  const customExchangeRate = source.customExchangeRate === null || source.customExchangeRate === undefined
    ? null : numberValue(source.customExchangeRate);
  if (budgetLimitGbp <= 0 || budgetLimitGbp > 100000 || (customExchangeRate !== null && (!customExchangeRate || customExchangeRate <= 0 || customExchangeRate > 10000))) return null;
  return { basket, customGames, budgetLimitGbp, customExchangeRate: customExchangeRate ?? null };
}

async function userIdOrResponse() {
  if (!process.env.CLERK_SECRET_KEY) {
    return { response: NextResponse.json({ success: false, error: 'Hesap senkronizasyonu henüz yapılandırılmadı.' }, { status: 503 }) };
  }
  const { userId } = await auth();
  return userId ? { userId } : { response: NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor.' }, { status: 401 }) };
}

export async function GET() {
  try {
    const access = await userIdOrResponse();
    if ('response' in access) return access.response;
    const collection = await getUserCollection(access.userId);
    return NextResponse.json({ success: true, collection, exists: Boolean(collection) });
  } catch (error) {
    console.error('Collection read failed:', error);
    const message = error instanceof DatabaseConfigurationError ? 'Veritabanı henüz yapılandırılmadı.' : 'Koleksiyon okunamadı.';
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await userIdOrResponse();
    if ('response' in access) return access.response;
    const body: unknown = await request.json();
    const payload = record(body);
    const collection = parseCollection(payload?.collection);
    const expectedRevision = numberValue(payload?.expectedRevision);
    if (!collection || expectedRevision === undefined || expectedRevision < 0 || !Number.isInteger(expectedRevision)) {
      return NextResponse.json({ success: false, error: 'Geçersiz koleksiyon verisi.' }, { status: 400 });
    }
    const saved = await saveUserCollection(access.userId, collection, expectedRevision);
    if (!saved) {
      return NextResponse.json({ success: false, error: 'Koleksiyon başka bir cihazda güncellendi.', collection: await getUserCollection(access.userId) }, { status: 409 });
    }
    return NextResponse.json({ success: true, collection: saved });
  } catch (error) {
    console.error('Collection write failed:', error);
    return NextResponse.json({ success: false, error: 'Koleksiyon kaydedilemedi.' }, { status: 503 });
  }
}
