-- Application schema migration
-- Run after schema.sql (Better Auth tables must exist first)
-- Matches production DB structure exactly.

-- ─── Dev bypass user (only for local development with DISABLE_AUTH=true) ─────
INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
VALUES ('dev-user-123', 'Dev User', 'dev@example.com', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── Extend user table ───────────────────────────────────────────────────────
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level        INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS badge_id     INTEGER,
  ADD COLUMN IF NOT EXISTS avatar_id    INTEGER;

-- ─── Avatars ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avatars (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT NOT NULL
);

INSERT INTO avatars (name, description, image_url) VALUES
  ('Diver',     'A diver exploring the fjord', '/avatars/diver.png'),
  ('Sailor',    'An experienced sailor',        '/avatars/sailor.png'),
  ('Scientist', 'A marine scientist',           '/avatars/scientist.png'),
  ('Fish',      'A friendly fjord fish',        '/avatars/fish.png')
ON CONFLICT DO NOTHING;

-- ─── Badges (badge_id tracks level) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  image_url TEXT NOT NULL
);

INSERT INTO badges (name, image_url) VALUES
  ('Beginner',   '/badges/level1.png'),
  ('Explorer',   '/badges/level2.png'),
  ('Researcher', '/badges/level3.png'),
  ('Expert',     '/badges/level4.png'),
  ('Master',     '/badges/level5.png')
ON CONFLICT DO NOTHING;

-- ─── Achievements catalog ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT
);

INSERT INTO achievements (name, description, image_url) VALUES
  ('First Measurement', 'Submitted your first measurement', '/achievements/first.png'),
  ('Dedicated Citizen', 'Submitted 10 measurements',        '/achievements/tenth.png')
ON CONFLICT DO NOTHING;

-- ─── User achievements ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ─── Measurements (matches production exactly) ───────────────────────────────
CREATE TABLE IF NOT EXISTS measurements (
  id            TEXT    PRIMARY KEY,
  latitude      NUMERIC NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude     NUMERIC NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  "timestamp"   TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  data_type     TEXT    NOT NULL,
  user_id       TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  notes         TEXT,
  quality_flag  TEXT,
  created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  points_earned INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS measurements_user_id_idx     ON measurements (user_id);
CREATE INDEX IF NOT EXISTS measurements_timestamp_idx   ON measurements ("timestamp");
CREATE INDEX IF NOT EXISTS measurements_data_type_idx   ON measurements (data_type);
CREATE INDEX IF NOT EXISTS measurements_created_at_idx  ON measurements (created_at);
CREATE INDEX IF NOT EXISTS measurements_coordinates_idx ON measurements (latitude, longitude);

-- ─── Secchi data ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secchi_data (
  id           TEXT PRIMARY KEY REFERENCES measurements(id) ON DELETE CASCADE,
  secchi_depth NUMERIC NOT NULL,
  image_key    TEXT,
  notes        TEXT,
  created_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Temperature data (matches production exactly) ───────────────────────────
CREATE TABLE IF NOT EXISTS temperature_data (
  id              TEXT    PRIMARY KEY REFERENCES measurements(id) ON DELETE CASCADE,
  value_celsius   NUMERIC NOT NULL,
  depth_meters    NUMERIC CHECK (depth_meters BETWEEN 0 AND 260),
  instrument_type TEXT,
  notes           TEXT,
  created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
