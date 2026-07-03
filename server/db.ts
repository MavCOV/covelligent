import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dbPath = path.join(process.cwd(), "data.db");
const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// ─── Bootstrap all tables ────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free',
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    codename TEXT,
    release_notes TEXT NOT NULL,
    changes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    deployed_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feature_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    enabled INTEGER NOT NULL DEFAULT 0,
    rollout_pct INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS roadmap_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    priority INTEGER NOT NULL DEFAULT 2,
    votes INTEGER NOT NULL DEFAULT 0,
    quarter TEXT,
    created_at TEXT NOT NULL,
    shipped_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ad_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    channel TEXT NOT NULL,
    headline TEXT NOT NULL,
    body TEXT NOT NULL,
    cta TEXT NOT NULL,
    target_audience TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    variant_group TEXT,
    created_at TEXT NOT NULL,
    scheduled_for TEXT
  );

  CREATE TABLE IF NOT EXISTS email_sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    delay_days INTEGER NOT NULL DEFAULT 0,
    subject TEXT NOT NULL,
    preheader TEXT,
    body TEXT NOT NULL,
    cta_text TEXT,
    cta_url TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    sent_count INTEGER NOT NULL DEFAULT 0,
    open_rate REAL NOT NULL DEFAULT 0,
    click_rate REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    content TEXT NOT NULL,
    hashtags TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    scheduled_for TEXT,
    posted_at TEXT,
    engagement TEXT,
    generated_by TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    page TEXT,
    user_id INTEGER,
    session_id TEXT,
    referrer TEXT,
    properties TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ab_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,
    metric TEXT NOT NULL,
    variants TEXT NOT NULL,
    results TEXT,
    status TEXT NOT NULL DEFAULT 'running',
    winner TEXT,
    started_at TEXT NOT NULL,
    concluded_at TEXT
  );

  CREATE TABLE IF NOT EXISTS growth_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    dau INTEGER NOT NULL DEFAULT 0,
    mau INTEGER NOT NULL DEFAULT 0,
    new_signups INTEGER NOT NULL DEFAULT 0,
    pro_upgrades INTEGER NOT NULL DEFAULT 0,
    churned INTEGER NOT NULL DEFAULT 0,
    total_searches INTEGER NOT NULL DEFAULT 0,
    avg_session_min REAL NOT NULL DEFAULT 0,
    revenue REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    plan TEXT NOT NULL DEFAULT 'free',
    current_period_end TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saved_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    collection_id INTEGER,
    conversation_id INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL DEFAULT 'info',
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    created_at TEXT NOT NULL
  );
`);
