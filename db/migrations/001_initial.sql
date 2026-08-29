CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_run_id text UNIQUE,
  trigger text NOT NULL CHECK (trigger IN ('schedule', 'manual', 'local')),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'partial', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  platform_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  games_seen integer NOT NULL DEFAULT 0,
  games_changed integer NOT NULL DEFAULT 0,
  exchange_rate_updated boolean NOT NULL DEFAULT false,
  error_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sync_runs_started_at_idx ON sync_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS games (
  box_id text PRIMARY KEY,
  title text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('PS5', 'PS4', 'XBOX_SX', 'XBOX_ONE', 'XBOX_360')),
  category_name text NOT NULL,
  sell_price numeric(10, 2) NOT NULL CHECK (sell_price > 0),
  previous_sell_price numeric(10, 2),
  cash_price numeric(10, 2),
  exchange_price numeric(10, 2),
  image_url text NOT NULL DEFAULT '',
  in_stock boolean NOT NULL DEFAULT false,
  stock_count integer,
  condition text,
  rating numeric(3, 2),
  genre text,
  cex_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_changed_at timestamptz NOT NULL DEFAULT now(),
  last_sync_id uuid REFERENCES sync_runs(id) ON DELETE SET NULL,
  CONSTRAINT non_negative_stock CHECK (stock_count IS NULL OR stock_count >= 0)
);
CREATE INDEX IF NOT EXISTS games_catalog_idx ON games (is_active, platform, title);
CREATE INDEX IF NOT EXISTS games_price_idx ON games (is_active, sell_price);
CREATE INDEX IF NOT EXISTS games_stock_idx ON games (is_active, in_stock);

CREATE TABLE IF NOT EXISTS game_state_changes (
  id bigserial PRIMARY KEY,
  game_id text NOT NULL REFERENCES games(box_id) ON DELETE CASCADE,
  observed_date date NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  sell_price numeric(10, 2) NOT NULL CHECK (sell_price > 0),
  cash_price numeric(10, 2),
  exchange_price numeric(10, 2),
  in_stock boolean NOT NULL,
  stock_count integer,
  sync_id uuid REFERENCES sync_runs(id) ON DELETE SET NULL,
  UNIQUE (game_id, observed_date)
);
CREATE INDEX IF NOT EXISTS game_state_changes_game_date_idx
  ON game_state_changes (game_id, observed_date DESC);

CREATE TABLE IF NOT EXISTS exchange_rates (
  source_date date PRIMARY KEY,
  observed_at timestamptz NOT NULL DEFAULT now(),
  base_currency char(3) NOT NULL DEFAULT 'GBP',
  target_currency char(3) NOT NULL DEFAULT 'TRY',
  rate numeric(14, 6) NOT NULL CHECK (rate > 0),
  source text NOT NULL DEFAULT 'TCMB',
  sync_id uuid REFERENCES sync_runs(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS exchange_rates_observed_at_idx ON exchange_rates (observed_at DESC);
