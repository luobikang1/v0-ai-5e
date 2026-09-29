-- Cloudflare D1 Database Schema for WhiteFox AI Image Generator

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_data TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model TEXT,
  width INTEGER,
  height INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User settings and data sync table
CREATE TABLE IF NOT EXISTS user_sync (
  user_id TEXT PRIMARY KEY,
  history_data TEXT,
  notes_data TEXT,
  albums_data TEXT,
  spells_data TEXT,
  models_data TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
