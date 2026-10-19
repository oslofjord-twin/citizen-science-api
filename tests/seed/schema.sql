DROP TABLE IF EXISTS avatars, badges, achievements, "user", measurements, temperature_data, user_achievements CASCADE;


CREATE TABLE avatars (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE badges (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    level_required INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE achievements (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    trigger_event TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    avatar_id INTEGER,
    badge_id INTEGER DEFAULT 1,
    failed_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMP,

    CONSTRAINT user_avatar_fkey
        FOREIGN KEY (avatar_id)
        REFERENCES avatars(id)
        ON DELETE SET NULL,
    
    CONSTRAINT user_badge_fkey
        FOREIGN KEY (badge_id)
        REFERENCES badges(id)
        ON DELETE SET NULL
);

CREATE TABLE measurements (
    id TEXT PRIMARY KEY,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    data_type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    notes TEXT,
    quality_flag TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT measurement_latitude_check
        CHECK (latitude >= -90 AND latitude <= 90),

    CONSTRAINT measurement_longitude_check
        CHECK (longitude >= -180 AND longitude <= 180),

    CONSTRAINT measurement_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE CASCADE
);

CREATE TABLE temperature_data (
    id TEXT PRIMARY KEY,
    value_celsius NUMERIC NOT NULL,
    depth_meters NUMERIC,
    instrument_type TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT temperature_depth_check
        CHECK (depth_meters >= 0 AND depth_meters <= 260),

    CONSTRAINT temperature_data_measurements_fkey
        FOREIGN KEY (id)
        REFERENCES measurements(id)
        ON DELETE CASCADE
);

CREATE TABLE user_achievements (
    user_id TEXT NOT NULL,
    achievement_id INTEGER NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT user_achievements_pkey
        PRIMARY KEY (user_id, achievement_id),

    CONSTRAINT user_achievements_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE CASCADE,
    
    CONSTRAINT user_achievements_achievement_id_fkey
        FOREIGN KEY (achievement_id)
        REFERENCES achievements(id)
        ON DELETE CASCADE
);