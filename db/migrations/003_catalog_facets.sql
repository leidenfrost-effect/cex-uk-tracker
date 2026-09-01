ALTER TABLE games ADD COLUMN IF NOT EXISTS in_stock_store boolean NOT NULL DEFAULT false;
ALTER TABLE games ADD COLUMN IF NOT EXISTS in_stock_online boolean NOT NULL DEFAULT false;
ALTER TABLE games ADD COLUMN IF NOT EXISTS age_rating text;
ALTER TABLE games ADD COLUMN IF NOT EXISTS developer text;
ALTER TABLE games ADD COLUMN IF NOT EXISTS genres text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS stores text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE games ADD COLUMN IF NOT EXISTS popularity_score numeric(12, 4);

CREATE INDEX IF NOT EXISTS games_category_idx ON games (is_active, category_name);
CREATE INDEX IF NOT EXISTS games_developer_idx ON games (is_active, developer);
CREATE INDEX IF NOT EXISTS games_age_rating_idx ON games (is_active, age_rating);
CREATE INDEX IF NOT EXISTS games_condition_idx ON games (is_active, condition);
CREATE INDEX IF NOT EXISTS games_popularity_idx ON games (is_active, popularity_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS games_genres_gin_idx ON games USING gin (genres);
CREATE INDEX IF NOT EXISTS games_stores_gin_idx ON games USING gin (stores);
