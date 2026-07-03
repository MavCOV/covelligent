// Plain JavaScript build script — works on any Node version, no tsx needed
import { build as esbuild } from "esbuild";
import { readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";

// We'll use vite programmatically but import it only after install
async function buildAll() {
  console.log("Cleaning dist...");
  await rm("dist", { recursive: true, force: true });

  console.log("Building client with Vite...");
  const vite = await import("vite");
  await vite.build();

  console.log("Building server with esbuild...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  const allowlist = [
    "better-sqlite3", "drizzle-orm", "drizzle-zod",
    "express", "express-rate-limit", "stripe",
    "bcryptjs", "jsonwebtoken", "multer",
    "cors", "zod", "nanoid", "ws",
  ];

  const externals = allDeps.filter(dep => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: false,
    external: externals,
    logLevel: "info",
  });

  console.log("Build complete!");
}

buildAll().catch(err => {
  console.error("Build failed:", err.message);
  process.exit(1);
});
