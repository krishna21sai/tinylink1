-- backend/db/init.sql
-- Creates the url_shortener1 table used by the app.
-- Run this against your Postgres/Neon database to initialize the schema.

CREATE TABLE IF NOT EXISTS url_shortener1 (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(8) NOT NULL,
  target_url TEXT NOT NULL,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure codes are unique
CREATE UNIQUE INDEX IF NOT EXISTS url_shortener1_code_idx ON url_shortener1 (code);

-- Optional trigger to keep updated_at current on UPDATE
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_updated_at ON url_shortener1;
CREATE TRIGGER trg_touch_updated_at
BEFORE UPDATE ON url_shortener1
FOR EACH ROW
EXECUTE PROCEDURE touch_updated_at();
