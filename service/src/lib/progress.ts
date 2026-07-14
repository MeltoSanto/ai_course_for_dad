import {
  AssignmentStatus,
  ProgressStatus,
  PublicationStatus,
} from "@prisma/client";
import { awardLessonAchievements } from "@/lib/achievements";
import { db } from "@/lib/db";

export async function calculateLessonProgress(userId: string, lessonId: string) {
  const [
    totalBlocks,
    completedBlocks,
    totalAssignments,
    completedAssignments,
    totalTests,
    passedTestIds,
  ] = await Promise.all([
    db.lessonBlock.count({
      where: {
        lessonId,
        isPublished: true,
      },
    }),
    db.userBlockProgress.count({
      where: {
        userId,
        completedAt: {
          not: null,
        },
        block: {
          lessonId,
          isPublished: true,
        },
      },
    }),
    db.assignment.count({
      where: {
        lessonId,
        status: {
          not: PublicationStatus.ARCHIVED,
        },
      },
    }),
    db.userAssignmentProgress.count({
      where: {
        userId,
        status: AssignmentStatus.COMPLETED,
        assignment: {
          lessonId,
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
      },
    }),
    db.lessonTest.count({
      where: {
        lessonId,
        status: {
          not: PublicationStatus.ARCHIVED,
        },
      },
    }),
    db.userTestAttempt.groupBy({
      by: ["testId"],
      where: {
        userId,
        isPassed: true,
        test: {
          lessonId,
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
      },
    }),
  ]);

  const totalUnits = totalBlocks + totalAssignments + totalTests;
  const completedUnits =
    completedBlocks + completedAssignments + passedTestIds.length;

  if (totalUnits === 0) {
    return {
      percent: 0,
      status: ProgressStatus.IN_PROGRESS,
      completedAt: null,
    };
  }

  const percent = Math.round((completedUnits / totalUnits) * 100);
  const isCompleted = completedUnits >= totalUnits;

  return {
    percent,
    status: isCompleted ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
    completedAt: isCompleted ? new Date() : null,
  };
}

export async function refreshLessonProgress({
  userId,
  lessonId,
  lastBlockId,
}: {
  userId: string;
  lessonId: string;
  lastBlockId?: string | null;
}) {
  const currentProgress = await calculateLessonProgress(userId, lessonId);

  await db.userLessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      ...(lastBlockId === undefined ? {} : { lastBlockId }),
      lastVisitedAt: new Date(),
      status: currentProgress.status,
      percent: currentProgress.percent,
      completedAt: currentProgress.completedAt,
    },
    create: {
      userId,
      lessonId,
      lastBlockId: lastBlockId ?? null,
      lastVisitedAt: new Date(),
      status: currentProgress.status,
      percent: currentProgress.percent,
      completedAt: currentProgress.completedAt,
    },
  });

  if (currentProgress.status === ProgressStatus.COMPLETED) {
    await awardLessonAchievements(userId, lessonId);
  }
}
