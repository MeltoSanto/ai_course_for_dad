import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serviceRoot = resolve(scriptDir, "..");

function loadDotEnv() {
  const candidates = [join(serviceRoot, ".env"), join(process.cwd(), ".env")];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }

    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

async function main() {
  loadDotEnv();

  const username = String(process.argv[2] ?? "").trim();

  if (!username) {
    throw new Error("Usage: npm run progress:reset -- <username>");
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new Error(`User not found: ${username}`);
    }

    const [lessons, blocks, assignments, attempts, achievements] = await prisma.$transaction([
      prisma.userLessonProgress.deleteMany({ where: { userId: user.id } }),
      prisma.userBlockProgress.deleteMany({ where: { userId: user.id } }),
      prisma.userAssignmentProgress.deleteMany({ where: { userId: user.id } }),
      prisma.userTestAttempt.deleteMany({ where: { userId: user.id } }),
      prisma.userAchievement.deleteMany({ where: { userId: user.id } }),
    ]);

    console.log(`Reset progress for user: ${user.username}`);
    console.log(
      `Deleted lessons=${lessons.count}, blocks=${blocks.count}, assignments=${assignments.count}, attempts=${attempts.count}, achievements=${achievements.count}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
