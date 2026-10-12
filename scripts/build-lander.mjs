import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  [
    "artifacts/studio-three/node_modules/vite/bin/vite.js",
    "build",
    "--config",
    "artifacts/studio-three/vite.config.ts",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, PORT: "5173", BASE_PATH: "/" },
  },
);
process.exit(result.status ?? 1);
