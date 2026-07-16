import {
  AssignmentStatus,
  LessonKind,
  ProgressStatus,
  PublicationStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

const lessonAchievements: Record<string, string> = {
  "data-safety": "safe-start",
  "task-decomposition": "step-by-step",
  "long-documents": "long-doc-tamer",
  "agent-roles": "ai-team",
  "personal-ai-system": "personal-system",
};

const practiceAchievements: Record<string, string> = {
  "managed-ai-brief": "task-architect",
  "citation-control": "citation-discipline",
};

const testAchievements: Record<string, string> = {
  "rf-legal-check": "jurisdiction-control",
};

export function achievementCodesForLessonReset(slug: string) {
  return [
    lessonAchievements[slug],
    practiceAchievements[slug],
    testAchievements[slug],
  ].filter((code): code is string => Boolean(code));
}

export async function awardAchievementByCode(userId: string, code: string) {
  const achievement = await db.achievement.findFirst({
    where: {
      code,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!achievement) {
    return;
  }

  await db.userAchievement.upsert({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
    update: {},
    create: {
      userId,
      achievementId: achievement.id,
    },
  });
}

export async function awardLessonAchievements(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      slug: true,
    },
  });

  if (!lesson) {
    return;
  }

  const code = lessonAchievements[lesson.slug];

  if (code) {
    await awardAchievementByCode(userId, code);
  }

  const unfinishedCoreLessons = await db.lesson.count({
    where: {
      kind: LessonKind.CORE,
      progresses: {
        none: {
          userId,
          status: ProgressStatus.COMPLETED,
        },
      },
    },
  });

  if (unfinishedCoreLessons === 0) {
    await awardAchievementByCode(userId, "course-finish");
  }
}

export async function awardPracticeAchievements(
  userId: string,
  lessonId: string,
) {
  const lesson = await db.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      slug: true,
    },
  });

  if (!lesson) {
    return;
  }

  const code = practiceAchievements[lesson.slug];

  if (code) {
    await awardAchievementByCode(userId, code);
  }

  const coreAssignmentCount = await db.assignment.count({
    where: {
      status: {
        not: PublicationStatus.ARCHIVED,
      },
      lesson: {
        kind: LessonKind.CORE,
      },
    },
  });
  const completedCoreAssignmentCount = await db.userAssignmentProgress.count({
    where: {
      userId,
      status: AssignmentStatus.COMPLETED,
      assignment: {
        status: {
          not: PublicationStatus.ARCHIVED,
        },
        lesson: {
          kind: LessonKind.CORE,
        },
      },
    },
  });

  if (
    coreAssignmentCount > 0 &&
    completedCoreAssignmentCount >= coreAssignmentCount
  ) {
    await awardAchievementByCode(userId, "practice-track");
  }
}

export async function awardTestAchievements(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      slug: true,
    },
  });

  if (!lesson) {
    return;
  }

  await awardAchievementByCode(userId, "first-test");

  const lessonCode = lessonAchievements[lesson.slug];

  if (lessonCode) {
    await awardAchievementByCode(userId, lessonCode);
  }

  const code = testAchievements[lesson.slug];

  if (code) {
    await awardAchievementByCode(userId, code);
  }
}
