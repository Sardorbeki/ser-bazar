const { spawn } = require("child_process");
const path = require("path");

async function runMigration() {
  return new Promise((resolve, reject) => {
    console.log("🔧 Running database migration...");
    const proc = spawn("npx", ["tsx", "server/migrate.ts"], {
      stdio: "inherit",
      env: process.env,
    });
    proc.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Migration done");
        resolve();
      } else {
        console.warn("⚠️  Migration exited with code", code, "— continuing anyway");
        resolve();
      }
    });
    proc.on("error", (err) => {
      console.warn("⚠️  Migration error:", err.message, "— continuing anyway");
      resolve();
    });
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, "..", "server_dist", "index.js");
    console.log("🚀 Starting production server...");
    const proc = spawn("node", [serverPath], {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error("Server exited with code " + code));
    });
  });
}

(async () => {
  try {
    await runMigration();
    await startServer();
  } catch (e) {
    console.error("❌ Startup error:", e.message);
    process.exit(1);
  }
})();
