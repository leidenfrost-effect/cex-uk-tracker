CREATE TABLE IF NOT EXISTS user_collections (
  clerk_user_id text PRIMARY KEY,
  basket jsonb NOT NULL DEFAULT '[]'::jsonb,
  custom_games jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget_limit_gbp numeric(10, 2) NOT NULL DEFAULT 300 CHECK (budget_limit_gbp > 0),
  custom_exchange_rate numeric(14, 6) CHECK (custom_exchange_rate IS NULL OR custom_exchange_rate > 0),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  migrated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
