-- Migration for production DB (ubuntu@database)
-- Adds everything missing from the existing production schema.
-- Safe to run: uses IF NOT EXISTS / IF EXISTS throughout.

-- ─── Extend user table ───────────────────────────────────────────────────────
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS badge_id  INTEGER,
  ADD COLUMN IF NOT EXISTS avatar_id INTEGER;

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

-- ─── Badges ──────────────────────────────────────────────────────────────────
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

-- ─── Achievements ─────────────────────────────────────────────────────────────
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

-- ─── Secchi data ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secchi_data (
  id           TEXT PRIMARY KEY REFERENCES measurements(id) ON DELETE CASCADE,
  secchi_depth NUMERIC NOT NULL,
  image_key    TEXT,
  notes        TEXT,
  created_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
