import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, UserRole } from "@prisma/client";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serviceRoot = resolve(scriptDir, "..");
const defaultUsername = "qa";
const defaultPassword = "1234";

function loadDotEnv() {
  const envPath = join(serviceRoot, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
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

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");

  return `scrypt$${salt}$${hash}`;
}

async function resetQaUser(prisma, username, password) {
  const user = await prisma.user.upsert({
    where: {
      username,
    },
    update: {
      passwordHash: hashPassword(password),
      displayName: "QA Tester",
      role: UserRole.STUDENT,
    },
    create: {
      username,
      passwordHash: hashPassword(password),
      displayName: "QA Tester",
      role: UserRole.STUDENT,
    },
  });

  await prisma.$transaction([
    prisma.userLessonProgress.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    prisma.userBlockProgress.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    prisma.userAssignmentProgress.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    prisma.userTestAttempt.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    prisma.userAchievement.deleteMany({
      where: {
        userId: user.id,
      },
    }),
  ]);

  return user;
}

async function main() {
  loadDotEnv();

  const prisma = new PrismaClient();
  const username = process.env.QA_USERNAME ?? defaultUsername;
  const password = process.env.QA_PASSWORD ?? defaultPassword;

  try {
    const user = await resetQaUser(prisma, username, password);

    console.log(`Reset QA user: ${user.username}`);
    console.log("Progress rows removed for QA user only.");
    console.log(`Login: ${username}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
