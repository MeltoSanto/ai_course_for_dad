PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_UserTestAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "answers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "LessonTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_UserTestAttempt" ("answers", "createdAt", "id", "isPassed", "maxScore", "score", "testId", "userId")
SELECT "answers", "createdAt", "id", "isPassed", "maxScore", "score", "testId", "userId" FROM "UserTestAttempt";

DROP TABLE "UserTestAttempt";
ALTER TABLE "new_UserTestAttempt" RENAME TO "UserTestAttempt";

CREATE INDEX "UserTestAttempt_userId_testId_idx" ON "UserTestAttempt"("userId", "testId");
CREATE INDEX "UserTestAttempt_testId_idx" ON "UserTestAttempt"("testId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
