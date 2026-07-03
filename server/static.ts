import express from 'express';
import type { Express } from 'express';
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname equivalent for ESM / tsx
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // When running via tsx from project root: server/ is one level up from dist/public
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Run 'npm run build' first.`
    );
  }

  app.use(express.static(distPath));

  // Catch-all: serve index.html for any unmatched route (SPA)
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
