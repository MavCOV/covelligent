// Build script: only builds the frontend with Vite.
// Server runs directly via tsx (no bundling needed).
import { rm } from "node:fs/promises";

async function buildAll() {
  console.log("Cleaning dist...");
  await rm("dist", { recursive: true, force: true });

  console.log("Building client with Vite...");
  const vite = await import("vite");
  await vite.build();

  console.log("Build complete! Frontend in dist/public/");
}

buildAll().catch(err => {
  console.error("Build failed:", err.message);
  process.exit(1);
});
