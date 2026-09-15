const path = require("path");
const fs = require("fs");
const os = require("os");
// Load configuration from all possible env locations in priority order
let userEnv = {};
const envCandidates = [
  path.join(os.homedir(), ".putmein", ".env"),
  path.join(__dirname, "ray", ".env"),
  path.join(__dirname, ".env"),
  path.join(__dirname, "..", ".env"),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const idx = trimmed.indexOf("=");
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!userEnv[key]) {
          userEnv[key] = val;
        }
      }
    }
  }
}
// Ensure DATABASE_URL is never undefined and configured for MySQL 8.0
if (!userEnv.DATABASE_URL) {
  userEnv.DATABASE_URL = process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/putmein";
}
userEnv.DATABASE_URL = userEnv.DATABASE_URL.replace("@localhost:", "@127.0.0.1:");
if (!userEnv.DATABASE_URL.includes("allowPublicKeyRetrieval")) {
  userEnv.DATABASE_URL += (userEnv.DATABASE_URL.includes("?") ? "&" : "?") + "allowPublicKeyRetrieval=true";
}
// Ensure JWT_SECRET is never undefined
if (!userEnv.JWT_SECRET) {
  userEnv.JWT_SECRET = process.env.JWT_SECRET || "putmein-jwt-secret-default-key-2024";
}
// Resolve paths for Brain binary
const isWindows = process.platform === "win32";
const brainBinaryName = isWindows ? "brain.exe" : "brain";
const archMap = { x64: "x64", arm64: "arm64" };
const normArch = archMap[process.arch] || process.arch;
const candidateBrainPaths = [
  path.join(__dirname, "dist", "brain", `brain-${process.platform}-${normArch}${isWindows ? ".exe" : ""}`),
  path.join(__dirname, "dist", "brain", brainBinaryName),
  path.join(__dirname, "brain", "bin", brainBinaryName),
  path.join(__dirname, "bin", brainBinaryName),
];
const brainScript = candidateBrainPaths.find((p) => fs.existsSync(p)) || candidateBrainPaths[1];
if (fs.existsSync(brainScript) && !isWindows) {
  try {
    fs.chmodSync(brainScript, 0o755);
  } catch (_) {}
}
// Resolve paths for Ray Next.js standalone server
const candidateRayPaths = [
  path.join(__dirname, "dist", "ray", "server.js"),
  path.join(__dirname, "ray", ".next", "standalone", "server.js"),
];
const rayScript = candidateRayPaths.find((p) => fs.existsSync(p)) || candidateRayPaths[0];
const rayCwd = path.dirname(rayScript);
const rayPort = process.env.RAY_PORT || userEnv.RAY_PORT || "4567";
const brainPort = process.env.BRAIN_PORT || userEnv.BRAIN_PORT || "4500";
const brainSecret = process.env.BRAIN_INTERNAL_SECRET || userEnv.BRAIN_INTERNAL_SECRET;`r`nif (!brainSecret) {`r`n  throw new Error("BRAIN_INTERNAL_SECRET environment variable is required");`r`n}
module.exports = {
  apps: [
    {
      name: "putmein-brain",
      script: brainScript,
      cwd: path.dirname(brainScript),
      interpreter: "none",
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        BRAIN_PORT: brainPort,
        RAY_URL: `http://localhost:${rayPort}`,
        BRAIN_INTERNAL_SECRET: brainSecret,
        AGENT_AUTONOMOUS: userEnv.AGENT_AUTONOMOUS || "false",
        ...userEnv,
      },
    },
    {
      name: "putmein-ray",
      script: rayScript,
      cwd: rayCwd,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        PORT: rayPort,
        NODE_ENV: "production",
        BRAIN_URL: `http://localhost:${brainPort}`,
        NEXT_PUBLIC_BRAIN_URL: `http://localhost:${brainPort}`,
        BRAIN_INTERNAL_SECRET: brainSecret,
        ...userEnv,
      },
    },
  ],
};
