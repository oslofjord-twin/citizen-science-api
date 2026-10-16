DROP TABLE IF EXISTS achievements, users CASCADE;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    firstname VARCHAR(50),
    lastname VARCHAR(50)
);

CREATE TABLE achievements (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50),
    icon_id INTEGER
);