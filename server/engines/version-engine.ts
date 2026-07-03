/**
 * Covelligent Version Engine
 * Manages versioning, feature flags, changelogs, and roadmap progression.
 * Uses raw SQL helpers (no Drizzle ORM).
 */
import { run, get, all } from "../db";

const now = () => new Date().toISOString();

async function log(level: string, message: string) {
  await run(
    `INSERT INTO system_logs (level, source, message, created_at) VALUES (?, ?, ?, ?)`,
    [level, "version_engine", message, now()]
  );
}

/** Get the current live version */
export async function getCurrentVersion() {
  return get("SELECT * FROM versions WHERE status = 'live' ORDER BY created_at DESC LIMIT 1");
}

/** List all versions */
export async function getAllVersions() {
  return all("SELECT * FROM versions ORDER BY created_at DESC");
}

/** Get all feature flags */
export async function getFeatureFlags() {
  return all("SELECT * FROM feature_flags");
}

/** Toggle a feature flag */
export async function toggleFeatureFlag(key: string, enabled: boolean) {
  await run(
    `UPDATE feature_flags SET enabled = ?, updated_at = ? WHERE key = ?`,
    [enabled ? 1 : 0, now(), key]
  );
  log("info", `Feature flag '${key}' set to ${enabled ? "ON" : "OFF"}`);
}

/** Update rollout percentage */
export async function setRolloutPct(key: string, pct: number) {
  await run(
    `UPDATE feature_flags SET rollout_pct = ?, updated_at = ? WHERE key = ?`,
    [pct, now(), key]
  );
  log("info", `Feature flag '${key}' rollout set to ${pct}%`);
}

/** Get all roadmap items */
export async function getRoadmap() {
  return all("SELECT * FROM roadmap_items ORDER BY votes DESC, priority ASC");
}

/** Advance a roadmap item's status */
export async function advanceRoadmapItem(id: number, status: string) {
  await run(
    `UPDATE roadmap_items SET status = ? WHERE id = ?`,
    [status, id]
  );
  log("info", `Roadmap item #${id} advanced to status: ${status}`);
}

/** Vote on a roadmap item */
export async function voteRoadmapItem(id: number) {
  await run(
    `UPDATE roadmap_items SET votes = votes + 1 WHERE id = ?`,
    [id]
  );
}

/** Auto-version bump: detects shipped roadmap items and generates a new version draft */
export async function autoVersionBump() {
  // No shipped_at column in simplified schema — just check for "shipped" status
  const recentlyShipped = await all(
    `SELECT * FROM roadmap_items WHERE status = 'shipped' LIMIT 10`
  );

  if (recentlyShipped.length === 0) return null;

  const current = await getCurrentVersion();
  if (!current) return null;

  const [major, minor, patch] = (current.version as string).split(".").map(Number);
  const newVersion = `${major}.${minor + 1}.0`;

  // Check if this version draft already exists
  const exists = await get(`SELECT id FROM versions WHERE version = ?`, [newVersion]);
  if (exists) return null;

  const codenames = ["Inlet", "Crest", "Tide", "Shoal", "Reef", "Atoll", "Bight", "Sound"];
  const codename = codenames[Math.floor(Math.random() * codenames.length)];

  const changelog = JSON.stringify(
    recentlyShipped.map((item: any) => ({ type: "feature", text: item.title }))
  );

  await run(
    `INSERT INTO versions (version, codename, status, changelog, created_at) VALUES (?, ?, ?, ?, ?)`,
    [newVersion, codename, "draft", changelog, now()]
  );

  const draft = await get(`SELECT * FROM versions WHERE version = ?`, [newVersion]);
  log("success", `Auto-generated version draft ${newVersion} '${codename}' with ${recentlyShipped.length} changes`);
  return draft;
}

/** Promote a draft version to live */
export async function promoteVersion(id: number) {
  // Archive current live
  await run(`UPDATE versions SET status = 'staging' WHERE status = 'live'`, []);
  // Set new live
  await run(
    `UPDATE versions SET status = 'live', deployed_at = ? WHERE id = ?`,
    [now(), id]
  );
  log("success", `Version #${id} promoted to live`);
}
