/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("node:path");

process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(path.join(__dirname, ".env"));
}

require("./.next/standalone/server.js");
