-- AlterTable
ALTER TABLE "UserBlockProgress" ADD COLUMN "firstOpenedAt" DATETIME;
ALTER TABLE "UserBlockProgress" ADD COLUMN "lastOpenedAt" DATETIME;
ALTER TABLE "UserBlockProgress" ADD COLUMN "activeSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserBlockProgress" ADD COLUMN "reviewSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserBlockProgress" ADD COLUMN "visitCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserAccessSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "signedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedOutAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "operatingSystem" TEXT,
    "browser" TEXT,
    "lastPath" TEXT,
    "lastLessonId" TEXT,
    CONSTRAINT "UserAccessSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserAccessSession_lastLessonId_fkey" FOREIGN KEY ("lastLessonId") REFERENCES "Lesson" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserActivityDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "firstActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserActivityDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserAccessSession_userId_signedInAt_idx" ON "UserAccessSession"("userId", "signedInAt");
CREATE INDEX "UserAccessSession_userId_lastActiveAt_idx" ON "UserAccessSession"("userId", "lastActiveAt");
CREATE INDEX "UserAccessSession_lastLessonId_idx" ON "UserAccessSession"("lastLessonId");
CREATE UNIQUE INDEX "UserActivityDay_userId_dayKey_key" ON "UserActivityDay"("userId", "dayKey");
CREATE INDEX "UserActivityDay_dayKey_idx" ON "UserActivityDay"("dayKey");
