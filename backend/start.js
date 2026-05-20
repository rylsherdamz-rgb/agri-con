const { execSync } = require("child_process");

try {
  console.log("Pushing Prisma schema to database...");
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: { ...process.env },
  });
  console.log("Schema push complete.");
} catch (err) {
  console.error("prisma db push failed:", err.message);
  process.exit(1);
}

require("./server.js");