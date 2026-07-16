import {
  AssignmentStatus,
  LessonKind,
  ProgressStatus,
  PublicationStatus,
} from "@prisma/client";
import { db } from "@/lib/db";

export const statusLabels: Record<PublicationStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  ARCHIVED: "Архив",
};

export const kindLabels: Record<LessonKind, string> = {
  CORE: "Основной",
  EXTRA: "Дополнительный",
};

export const progressLabels: Record<ProgressStatus, string> = {
  NOT_STARTED: "Не начат",
  IN_PROGRESS: "В процессе",
  COMPLETED: "Завершен",
};

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

const lessonKindRank: Record<LessonKind, number> = {
  CORE: 0,
  EXTRA: 1,
};

const placeholderBlockMarker =
  "Этот блок будет наполнен исследовательской моделью";

function lessonHasReadyContent(lesson: {
  kind: LessonKind;
  blocks: Array<{ contentMd: string }>;
}) {
  if (lesson.kind === LessonKind.CORE) {
    return true;
  }

  return (
    lesson.blocks.length > 0 &&
    lesson.blocks.every(
      (block) => !block.contentMd.includes(placeholderBlockMarker),
    )
  );
}

export async function getStudentDashboard(userId: string) {
  const [
    lessons,
    achievements,
    glossaryCount,
    referenceCount,
    scenarioCount,
    latestTestAttempt,
  ] = await Promise.all([
      db.lesson.findMany({
        where: {
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
        orderBy: [{ kind: "asc" }, { order: "asc" }],
        include: {
          blocks: {
            where: {
              isPublished: true,
            },
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              title: true,
              contentMd: true,
              blockProgresses: {
                where: {
                  userId,
                },
                select: {
                  completedAt: true,
                },
                take: 1,
              },
            },
          },
          assignments: {
            where: {
              status: {
                not: PublicationStatus.ARCHIVED,
              },
            },
            select: {
              id: true,
            },
          },
          tests: {
            where: {
              status: {
                not: PublicationStatus.ARCHIVED,
              },
            },
            select: {
              id: true,
            },
          },
          progresses: {
            where: {
              userId,
            },
            include: {
              lastBlock: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
            take: 1,
          },
        },
      }),
      db.userAchievement.findMany({
        where: {
          userId,
        },
        include: {
          achievement: true,
        },
        orderBy: {
          awardedAt: "desc",
        },
        take: 4,
      }),
      db.glossaryTerm.count({
        where: {
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
      }),
      db.referenceItem.count({
        where: {
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
      }),
      db.scenario.count({
        where: {
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
      }),
      db.userTestAttempt.findFirst({
        where: {
          userId,
        },
        include: {
          test: {
            include: {
              lesson: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  const dashboardLessons = lessons.map((lesson) => {
    const progress = lesson.progresses[0];
    const resumeBlock =
      lesson.blocks.find(
        (block) => !block.blockProgresses.some((item) => item.completedAt),
      ) ?? null;

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      subtitle: lesson.subtitle,
      description: lesson.description,
      kind: lesson.kind,
      status: lesson.status,
      order: lesson.order,
      durationMinutes: lesson.durationMinutes,
      blockCount: lesson.blocks.length,
      assignmentCount: lesson.assignments.length,
      testCount: lesson.tests.length,
      isContentReady: lessonHasReadyContent(lesson),
      progress: {
        status: progress?.status ?? ProgressStatus.NOT_STARTED,
        percent: progress?.percent ?? 0,
        lastVisitedAt: progress?.lastVisitedAt,
        lastBlock: progress?.lastBlock,
        resumeBlock: resumeBlock
          ? {
              id: resumeBlock.id,
              title: resumeBlock.title,
            }
          : null,
      },
    };
  });

  const coreLessons = dashboardLessons.filter((lesson) => lesson.kind === LessonKind.CORE);
  const extraLessons = dashboardLessons.filter((lesson) => lesson.kind === LessonKind.EXTRA);
  const completedCoreCount = coreLessons.filter(
    (lesson) => lesson.progress.status === ProgressStatus.COMPLETED,
  ).length;
  const coreCourseCompleted =
    coreLessons.length > 0 && completedCoreCount >= coreLessons.length;
  const coursePercent = average(coreLessons.map((lesson) => lesson.progress.percent));
  const availableLessons = dashboardLessons.filter(
    (lesson) =>
      lesson.kind === LessonKind.CORE ||
      (coreCourseCompleted && lesson.isContentReady),
  );
  const continueLesson =
    availableLessons
      .filter((lesson) => lesson.progress.lastVisitedAt)
      .sort(
        (left, right) =>
          Number(right.progress.lastVisitedAt) - Number(left.progress.lastVisitedAt),
      )[0] ??
    coreLessons.find((lesson) => lesson.progress.status !== ProgressStatus.COMPLETED) ??
    coreLessons[0] ??
    dashboardLessons[0];

  return {
    lessons: dashboardLessons,
    coreLessons,
    extraLessons,
    completedCoreCount,
    coreCourseCompleted,
    coursePercent,
    continueLesson,
    achievements,
    latestTestAttempt,
    library: {
      glossaryCount,
      referenceCount,
      scenarioCount,
    },
  };
}

export async function getLessonWorkspace(userId: string, slug: string) {
  const lesson = await db.lesson.findUnique({
    where: {
      slug,
    },
    include: {
      blocks: {
        orderBy: {
          order: "asc",
        },
      },
      assignments: {
        where: {
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
        orderBy: {
          order: "asc",
        },
        include: {
          progresses: {
            where: {
              userId,
            },
            take: 1,
          },
        },
      },
      tests: {
        where: {
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
        orderBy: {
          order: "asc",
        },
        include: {
          questions: {
            orderBy: {
              order: "asc",
            },
            include: {
              options: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
          attempts: {
            where: {
              userId,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 8,
          },
        },
      },
      progresses: {
        where: {
          userId,
        },
        include: {
          lastBlock: true,
        },
        take: 1,
      },
    },
  });

  if (!lesson) {
    return null;
  }

  const [
    blockProgresses,
    previousLesson,
    nextLesson,
    coreLessonCount,
    completedCoreLessonCount,
  ] = await Promise.all([
    db.userBlockProgress.findMany({
      where: {
        userId,
        block: {
          lessonId: lesson.id,
        },
      },
      select: {
        blockId: true,
        completedAt: true,
      },
    }),
    db.lesson.findFirst({
      where: {
        status: {
          not: PublicationStatus.ARCHIVED,
        },
        order: {
          lt: lesson.order,
        },
      },
      orderBy: {
        order: "desc",
      },
      select: {
        slug: true,
        title: true,
        order: true,
      },
    }),
    db.lesson.findFirst({
      where: {
        status: {
          not: PublicationStatus.ARCHIVED,
        },
        order: {
          gt: lesson.order,
        },
      },
      orderBy: {
        order: "asc",
      },
      select: {
        slug: true,
        title: true,
        order: true,
      },
    }),
    db.lesson.count({
      where: {
        kind: LessonKind.CORE,
        status: {
          not: PublicationStatus.ARCHIVED,
        },
      },
    }),
    db.userLessonProgress.count({
      where: {
        userId,
        status: ProgressStatus.COMPLETED,
        lesson: {
          kind: LessonKind.CORE,
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
      },
    }),
  ]);

  return {
    lesson,
    progress: lesson.progresses[0],
    previousLesson,
    nextLesson,
    isContentReady: lessonHasReadyContent(lesson),
    coreCourseCompleted:
      coreLessonCount > 0 && completedCoreLessonCount >= coreLessonCount,
    completedBlockIds: new Set(
      blockProgresses
        .filter((progress) => progress.completedAt)
        .map((progress) => progress.blockId),
    ),
  };
}

export async function getAdminDashboard() {
  const [
    lessons,
    lessonStatuses,
    blockCount,
    assignmentCount,
    testCount,
    questionCount,
    glossaryCount,
    referenceCount,
    scenarioCount,
    achievementCount,
    studentCount,
  ] = await Promise.all([
    db.lesson.findMany({
      orderBy: [{ kind: "asc" }, { order: "asc" }],
      include: {
        _count: {
          select: {
            blocks: true,
            assignments: true,
            tests: true,
            progresses: true,
          },
        },
      },
    }),
    db.lesson.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    db.lessonBlock.count(),
    db.assignment.count(),
    db.lessonTest.count(),
    db.question.count(),
    db.glossaryTerm.count(),
    db.referenceItem.count(),
    db.scenario.count(),
    db.achievement.count(),
    db.user.count({
      where: {
        role: "STUDENT",
      },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    lessonStatuses.map((item) => [item.status, item._count._all]),
  ) as Partial<Record<PublicationStatus, number>>;

  return {
    lessons,
    statusCounts,
    totals: {
      lessons: lessons.length,
      blocks: blockCount,
      assignments: assignmentCount,
      tests: testCount,
      questions: questionCount,
      glossary: glossaryCount,
      references: referenceCount,
      scenarios: scenarioCount,
      achievements: achievementCount,
      students: studentCount,
    },
  };
}

export async function getAdminProgressManager() {
  const [students, lessons] = await Promise.all([
    db.user.findMany({
      where: {
        role: "STUDENT",
      },
      orderBy: [{ displayName: "asc" }, { username: "asc" }],
      select: {
        id: true,
        username: true,
        displayName: true,
        _count: {
          select: {
            lessonProgresses: true,
            blockProgresses: true,
            assignmentProgresses: true,
            testAttempts: true,
            achievements: true,
          },
        },
      },
    }),
    db.lesson.findMany({
      where: {
        status: {
          not: PublicationStatus.ARCHIVED,
        },
      },
      orderBy: [{ kind: "asc" }, { order: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        kind: true,
        order: true,
      },
    }),
  ]);

  return {
    students,
    lessons,
  };
}

export async function getAdminLessonEditor(lessonId: string) {
  return db.lesson.findUnique({
    where: {
      id: lessonId,
    },
    include: {
      blocks: {
        orderBy: {
          order: "asc",
        },
      },
      assignments: {
        orderBy: {
          order: "asc",
        },
      },
      tests: {
        orderBy: {
          order: "asc",
        },
        include: {
          questions: {
            orderBy: {
              order: "asc",
            },
            include: {
              options: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getStudentProgressCenter(userId: string) {
  const [
    lessons,
    userAchievements,
    allAchievements,
    recentTestAttempts,
    recentAssignments,
  ] = await Promise.all([
    db.lesson.findMany({
      where: {
        status: {
          not: PublicationStatus.ARCHIVED,
        },
      },
      orderBy: [{ kind: "asc" }, { order: "asc" }],
      include: {
        blocks: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            blockProgresses: {
              where: {
                userId,
              },
              select: {
                completedAt: true,
              },
            },
          },
        },
        assignments: {
          where: {
            status: {
              not: PublicationStatus.ARCHIVED,
            },
          },
          select: {
            id: true,
            title: true,
            progresses: {
              where: {
                userId,
              },
              take: 1,
            },
          },
        },
        tests: {
          where: {
            status: {
              not: PublicationStatus.ARCHIVED,
            },
          },
          select: {
            id: true,
            title: true,
            attempts: {
              where: {
                userId,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
        progresses: {
          where: {
            userId,
          },
          take: 1,
        },
      },
    }),
    db.userAchievement.findMany({
      where: {
        userId,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        awardedAt: "desc",
      },
    }),
    db.achievement.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    db.userTestAttempt.findMany({
      where: {
        userId,
      },
      include: {
        test: {
          include: {
            lesson: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
    db.userAssignmentProgress.findMany({
      where: {
        userId,
      },
      include: {
        assignment: {
          include: {
            lesson: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    }),
  ]);

  const lessonRows = lessons.map((lesson) => {
    const progress = lesson.progresses[0];
    const completedBlocks = lesson.blocks.filter((block) =>
      block.blockProgresses.some((item) => item.completedAt),
    ).length;
    const completedAssignments = lesson.assignments.filter(
      (assignment) => assignment.progresses[0]?.status === "COMPLETED",
    ).length;
    const passedTests = lesson.tests.filter((test) =>
      test.attempts.some((attempt) => attempt.isPassed),
    ).length;

    return {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      kind: lesson.kind,
      order: lesson.order,
      progress: {
        percent: progress?.percent ?? 0,
        status: progress?.status ?? ProgressStatus.NOT_STARTED,
        completedAt: progress?.completedAt,
        lastVisitedAt: progress?.lastVisitedAt,
      },
      blocks: {
        total: lesson.blocks.length,
        completed: completedBlocks,
      },
      assignments: {
        total: lesson.assignments.length,
        completed: completedAssignments,
      },
      tests: {
        total: lesson.tests.length,
        passed: passedTests,
      },
    };
  });

  const coreLessons = lessonRows.filter((lesson) => lesson.kind === LessonKind.CORE);
  const unlockedAchievementIds = new Set(
    userAchievements.map((item) => item.achievementId),
  );

  return {
    lessons: lessonRows,
    coreLessons,
    extraLessons: lessonRows.filter((lesson) => lesson.kind === LessonKind.EXTRA),
    coursePercent: average(coreLessons.map((lesson) => lesson.progress.percent)),
    completedCoreCount: coreLessons.filter(
      (lesson) => lesson.progress.status === ProgressStatus.COMPLETED,
    ).length,
    userAchievements,
    achievementCatalog: allAchievements.map((achievement) => ({
      ...achievement,
      isUnlocked: unlockedAchievementIds.has(achievement.id),
    })),
    recentTestAttempts,
    recentAssignments,
  };
}

export async function getStudentPracticeCenter(userId: string) {
  const assignments = await db.assignment.findMany({
    where: {
      status: {
        not: PublicationStatus.ARCHIVED,
      },
      lesson: {
        status: {
          not: PublicationStatus.ARCHIVED,
        },
      },
    },
    include: {
      lesson: {
        select: {
          id: true,
          slug: true,
          title: true,
          kind: true,
          order: true,
          durationMinutes: true,
        },
      },
      progresses: {
        where: {
          userId,
        },
        take: 1,
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  const practiceItems = assignments
    .sort(
      (left, right) =>
        lessonKindRank[left.lesson.kind] - lessonKindRank[right.lesson.kind] ||
        left.lesson.order - right.lesson.order ||
        left.order - right.order,
    )
    .map((assignment) => {
      const progress = assignment.progresses[0];

      return {
        id: assignment.id,
        title: assignment.title,
        instructionsMd: assignment.instructionsMd,
        order: assignment.order,
        status: assignment.status,
        lesson: assignment.lesson,
        progress: {
          status: progress?.status ?? AssignmentStatus.NOT_STARTED,
          submittedAt: progress?.submittedAt,
          completedAt: progress?.completedAt,
          updatedAt: progress?.updatedAt,
        },
      };
    });

  return {
    assignments: practiceItems,
    totals: {
      total: practiceItems.length,
      completed: practiceItems.filter(
        (assignment) => assignment.progress.status === AssignmentStatus.COMPLETED,
      ).length,
      submitted: practiceItems.filter(
        (assignment) => assignment.progress.status === AssignmentStatus.SUBMITTED,
      ).length,
      inProgress: practiceItems.filter(
        (assignment) => assignment.progress.status === AssignmentStatus.IN_PROGRESS,
      ).length,
    },
  };
}

export async function getStudentTestCenter(userId: string) {
  const [tests, recentAttempts] = await Promise.all([
    db.lessonTest.findMany({
      where: {
        status: {
          not: PublicationStatus.ARCHIVED,
        },
        lesson: {
          status: {
            not: PublicationStatus.ARCHIVED,
          },
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            slug: true,
            title: true,
            kind: true,
            order: true,
          },
        },
        questions: {
          select: {
            id: true,
            points: true,
          },
        },
        attempts: {
          where: {
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 8,
        },
      },
      orderBy: {
        order: "asc",
      },
    }),
    db.userTestAttempt.findMany({
      where: {
        userId,
      },
      include: {
        test: {
          include: {
            lesson: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    }),
  ]);

  const testItems = tests
    .sort(
      (left, right) =>
        lessonKindRank[left.lesson.kind] - lessonKindRank[right.lesson.kind] ||
        left.lesson.order - right.lesson.order ||
        left.order - right.order,
    )
    .map((test) => {
      const maxScore = test.questions.reduce(
        (sum, question) => sum + question.points,
        0,
      );
      const latestAttempt = test.attempts[0];
      const bestAttempt =
        test.attempts.length > 0
          ? [...test.attempts].sort(
              (left, right) =>
                right.score / Math.max(1, right.maxScore) -
                  left.score / Math.max(1, left.maxScore) ||
                right.score - left.score ||
                Number(right.createdAt) - Number(left.createdAt),
            )[0]
          : null;
      const hasPassed = test.attempts.some((attempt) => attempt.isPassed);

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        passingScore: test.passingScore,
        order: test.order,
        status: test.status,
        lesson: test.lesson,
        questionCount: test.questions.length,
        maxScore,
        latestAttempt,
        bestAttempt,
        hasPassed,
      };
    });

  return {
    tests: testItems,
    recentAttempts,
    totals: {
      total: testItems.length,
      attempted: testItems.filter((test) => test.latestAttempt).length,
      passed: testItems.filter((test) => test.hasPassed).length,
      questionCount: testItems.reduce((sum, test) => sum + test.questionCount, 0),
      maxScore: testItems.reduce((sum, test) => sum + test.maxScore, 0),
    },
  };
}

export async function getStudentAchievementCenter(userId: string) {
  const [userAchievements, achievements] = await Promise.all([
    db.userAchievement.findMany({
      where: {
        userId,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        awardedAt: "desc",
      },
    }),
    db.achievement.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ triggerType: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const unlockedMap = new Map(
    userAchievements.map((item) => [item.achievementId, item.awardedAt]),
  );
  const achievementCatalog = achievements.map((achievement) => ({
    ...achievement,
    awardedAt: unlockedMap.get(achievement.id) ?? null,
    isUnlocked: unlockedMap.has(achievement.id),
  }));

  return {
    achievements: achievementCatalog,
    userAchievements,
    totals: {
      total: achievementCatalog.length,
      unlocked: achievementCatalog.filter((achievement) => achievement.isUnlocked)
        .length,
      locked: achievementCatalog.filter((achievement) => !achievement.isUnlocked)
        .length,
    },
  };
}

export async function getAdminLibraryEditor() {
  const [references, glossaryTerms, scenarios, achievements] = await Promise.all([
    db.referenceItem.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }, { title: "asc" }],
    }),
    db.glossaryTerm.findMany({
      orderBy: [{ order: "asc" }, { term: "asc" }],
    }),
    db.scenario.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
    }),
    db.achievement.findMany({
      orderBy: [{ triggerType: "asc" }, { title: "asc" }],
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    }),
  ]);

  return {
    references,
    glossaryTerms,
    scenarios,
    achievements,
  };
}

export type StudentDashboard = Awaited<ReturnType<typeof getStudentDashboard>>;
export type StudentPracticeCenter = Awaited<
  ReturnType<typeof getStudentPracticeCenter>
>;
export type StudentTestCenter = Awaited<ReturnType<typeof getStudentTestCenter>>;
export type StudentAchievementCenter = Awaited<
  ReturnType<typeof getStudentAchievementCenter>
>;
