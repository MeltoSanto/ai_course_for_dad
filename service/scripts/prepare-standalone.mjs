import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");

await cp(path.join(projectRoot, "public"), path.join(standaloneRoot, "public"), {
  recursive: true,
  force: true,
});

await mkdir(path.join(standaloneRoot, ".next"), { recursive: true });
await cp(
  path.join(projectRoot, ".next", "static"),
  path.join(standaloneRoot, ".next", "static"),
  { recursive: true, force: true },
);

console.log("Standalone runtime prepared with public and static assets.");
