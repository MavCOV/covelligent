/**
 * Covelligent Version Engine
 * Manages versioning, feature flags, changelogs, and roadmap progression.
 * Runs automatically on a schedule and can be triggered manually via admin.
 */
import { db } from "../db";
import {
  versions, featureFlags, roadmapItems, systemLogs
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

const now = () => new Date().toISOString();

function log(level: string, message: string, data?: object) {
  db.insert(systemLogs).values({
    level, source: "version_engine", message,
    data: data ? JSON.stringify(data) : null,
    createdAt: now(),
  }).run();
}

/** Get the current live version */
export function getCurrentVersion() {
  return db.select().from(versions)
    .where(eq(versions.status, "live"))
    .orderBy(desc(versions.createdAt))
    .get();
}

/** List all versions */
export function getAllVersions() {
  return db.select().from(versions).orderBy(desc(versions.createdAt)).all();
}

/** Get all feature flags */
export function getFeatureFlags() {
  return db.select().from(featureFlags).all();
}

/** Toggle a feature flag */
export function toggleFeatureFlag(key: string, enabled: boolean) {
  db.update(featureFlags)
    .set({ enabled: enabled ? 1 : 0, updatedAt: now() })
    .where(eq(featureFlags.key, key))
    .run();
  log("info", `Feature flag '${key}' set to ${enabled ? "ON" : "OFF"}`);
}

/** Update rollout percentage */
export function setRolloutPct(key: string, pct: number) {
  db.update(featureFlags)
    .set({ rolloutPct: pct, updatedAt: now() })
    .where(eq(featureFlags.key, key))
    .run();
  log("info", `Feature flag '${key}' rollout set to ${pct}%`);
}

/** Get all roadmap items */
export function getRoadmap() {
  return db.select().from(roadmapItems)
    .orderBy(roadmapItems.priority, desc(roadmapItems.votes))
    .all();
}

/** Advance a roadmap item's status */
export function advanceRoadmapItem(id: number, status: string) {
  const updates: Record<string, string | null> = { status };
  if (status === "shipped") updates.shippedAt = now();
  db.update(roadmapItems).set(updates).where(eq(roadmapItems.id, id)).run();
  log("info", `Roadmap item #${id} advanced to status: ${status}`);
}

/** Vote on a roadmap item */
export function voteRoadmapItem(id: number) {
  const item = db.select().from(roadmapItems).where(eq(roadmapItems.id, id)).get();
  if (!item) return;
  db.update(roadmapItems)
    .set({ votes: item.votes + 1 })
    .where(eq(roadmapItems.id, id))
    .run();
}

/** Auto-version bump: detects shipped roadmap items and generates a new version draft */
export function autoVersionBump() {
  const recentlyShipped = db.select().from(roadmapItems)
    .where(and(
      eq(roadmapItems.status, "shipped"),
    ))
    .all()
    .filter(item => {
      if (!item.shippedAt) return false;
      const age = Date.now() - new Date(item.shippedAt).getTime();
      return age < 7 * 86400000; // shipped in last 7 days
    });

  if (recentlyShipped.length === 0) return null;

  const current = getCurrentVersion();
  if (!current) return null;

  const [major, minor, patch] = current.version.split(".").map(Number);
  const newVersion = `${major}.${minor + 1}.0`;

  // Check if this version draft already exists
  const exists = db.select().from(versions)
    .where(eq(versions.version, newVersion))
    .get();
  if (exists) return null;

  const changes = recentlyShipped.map(item => ({
    type: item.category,
    text: item.title,
  }));

  const codenames = ["Inlet", "Crest", "Tide", "Shoal", "Reef", "Atoll", "Bight", "Sound"];
  const codename = codenames[Math.floor(Math.random() * codenames.length)];

  const draft = db.insert(versions).values({
    version: newVersion,
    codename,
    releaseNotes: `${newVersion} '${codename}' includes ${recentlyShipped.length} shipped item(s) from the roadmap: ${recentlyShipped.map(i => i.title).join(", ")}.`,
    changes: JSON.stringify(changes),
    status: "draft",
    createdAt: now(),
  }).returning().get();

  log("success", `Auto-generated version draft ${newVersion} '${codename}' with ${changes.length} changes`, { versionId: draft.id });
  return draft;
}

/** Promote a draft version to live */
export function promoteVersion(id: number) {
  // Archive current live
  const current = getCurrentVersion();
  if (current) {
    db.update(versions).set({ status: "staging" }).where(eq(versions.id, current.id)).run();
  }
  // Set new live
  db.update(versions).set({ status: "live", deployedAt: now() }).where(eq(versions.id, id)).run();
  log("success", `Version #${id} promoted to live`);
}
