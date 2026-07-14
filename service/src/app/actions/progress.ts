"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { refreshLessonProgress } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export async function saveLessonPlaceAction(
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
    },
  });

  if (!block) {
    return;
  }

  await refreshLessonProgress({
    userId: user.id,
    lessonId,
    lastBlockId: block.id,
  });

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath(`/lessons/${slug}`);
}

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

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath(`/lessons/${slug}`);
}
