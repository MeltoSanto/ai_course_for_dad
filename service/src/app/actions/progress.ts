"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { refreshLessonProgress } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export type ResetQaProgressState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function completeBlockAction(
  lessonId: string,
  blockId: string,
  slug: string,
) {
  const user = await requireUser();
  const block = await db.lessonBlock.findFirst({
    where: {
      id: blockId,
      lessonId,
    },
    select: {
      id: true,
      order: true,
    },
  });

  if (!block) {
    return;
  }

  await db.userBlockProgress.upsert({
    where: {
      userId_blockId: {
        userId: user.id,
        blockId: block.id,
      },
    },
    update: {
      completedAt: new Date(),
    },
    create: {
      userId: user.id,
      blockId: block.id,
      completedAt: new Date(),
    },
  });

  await refreshLessonProgress({
    userId: user.id,
    lessonId,
    lastBlockId: block.id,
  });

  const incompleteBlockFilter = {
    lessonId,
    isPublished: true,
    NOT: {
      blockProgresses: {
        some: {
          userId: user.id,
          completedAt: {
            not: null,
          },
        },
      },
    },
  };

  const nextIncompleteBlock = await db.lessonBlock.findFirst({
    where: {
      ...incompleteBlockFilter,
      order: {
        gt: block.order,
      },
    },
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
    },
  });

  const firstIncompleteBlock =
    nextIncompleteBlock ??
    (await db.lessonBlock.findFirst({
      where: incompleteBlockFilter,
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
      },
    }));

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath(`/lessons/${slug}`);

  return {
    completedBlockId: block.id,
    targetHash: firstIncompleteBlock
      ? `#block-${firstIncompleteBlock.id}`
      : "#practice",
  };
}

export async function resetQaProgressAction(): Promise<ResetQaProgressState> {
  const user = await requireUser();

  if (user.username !== "qa") {
    return {
      status: "error",
      message: "Сброс прогресса доступен только QA-пользователю.",
    };
  }

  await db.$transaction([
    db.userLessonProgress.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    db.userBlockProgress.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    db.userAssignmentProgress.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    db.userTestAttempt.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    db.userAchievement.deleteMany({
      where: {
        userId: user.id,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/lessons");
  revalidatePath("/practice");
  revalidatePath("/tests");
  revalidatePath("/achievements");

  return {
    status: "success",
    message: "QA-прогресс сброшен. Можно начинать проверку с чистого состояния.",
  };
}
