import { getRequestDeviceInfo, moscowDayKey } from "@/lib/activity";
import { db } from "@/lib/db";
import { createSession, getSession } from "@/lib/session";

type ActivityPayload = {
  path?: unknown;
  lessonId?: unknown;
  blockId?: unknown;
  activeSeconds?: unknown;
  blockOpened?: unknown;
};

function optionalString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength
    ? value
    : null;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function POST(request: Request) {
  const auth = await getSession();

  if (!auth) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, role: true, isActive: true, sessionVersion: true },
  });

  if (
    !user?.isActive ||
    (auth.sessionVersion ?? 1) !== user.sessionVersion
  ) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let payload: ActivityPayload;

  try {
    payload = (await request.json()) as ActivityPayload;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const submittedPath = optionalString(payload.path, 500);
  const path = submittedPath?.startsWith("/") ? submittedPath : null;
  const lessonId = optionalString(payload.lessonId, 64);
  const blockId = optionalString(payload.blockId, 64);
  const activeSeconds = Math.max(
    0,
    Math.min(30, Math.round(Number(payload.activeSeconds) || 0)),
  );
  const blockOpened = payload.blockOpened === true;
  const now = new Date();
  const device = getRequestDeviceInfo(request.headers);

  const lessonSlug = path?.match(/^\/lessons\/([^/?#]+)/)?.[1];
  const lesson = lessonId
    ? await db.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true },
      })
    : lessonSlug
      ? await db.lesson.findUnique({
          where: { slug: safeDecode(lessonSlug) },
          select: { id: true },
        })
      : null;
  const block =
    blockId && lesson
      ? await db.lessonBlock.findFirst({
          where: {
            id: blockId,
            lessonId: lesson.id,
          },
          select: { id: true },
        })
      : null;

  let accessSessionId = auth.accessSessionId;

  if (accessSessionId) {
    const existing = await db.userAccessSession.findFirst({
      where: {
        id: accessSessionId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!existing) accessSessionId = undefined;
  }

  if (!accessSessionId) {
    const recentCutoff = new Date(now.getTime() - 2 * 60 * 1000);
    const recentSession = await db.userAccessSession.findFirst({
      where: {
        userId: user.id,
        signedOutAt: null,
        lastActiveAt: { gte: recentCutoff },
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
      },
      orderBy: { lastActiveAt: "desc" },
    });
    const accessSession =
      recentSession ??
      (await db.userAccessSession.create({
        data: {
          userId: user.id,
          signedInAt: now,
          lastActiveAt: now,
          lastPath: path,
          lastLessonId: lesson?.id,
          ...device,
        },
      }));
    accessSessionId = accessSession.id;
    await createSession(user, accessSessionId);

    if (recentSession) {
      await db.userAccessSession.update({
        where: { id: accessSessionId },
        data: {
          lastActiveAt: now,
          lastPath: path ?? undefined,
          lastLessonId: lesson?.id ?? undefined,
        },
      });
    }
  } else {
    await db.userAccessSession.update({
      where: { id: accessSessionId },
      data: {
        lastActiveAt: now,
        lastPath: path ?? undefined,
        lastLessonId: lesson?.id ?? undefined,
      },
    });
  }

  const dayKey = moscowDayKey(now);
  await db.userActivityDay.upsert({
    where: {
      userId_dayKey: {
        userId: user.id,
        dayKey,
      },
    },
    update: {
      lastActiveAt: now,
    },
    create: {
      userId: user.id,
      dayKey,
      firstActiveAt: now,
      lastActiveAt: now,
    },
  });

  if (block) {
    const currentProgress = await db.userBlockProgress.findUnique({
      where: {
        userId_blockId: {
          userId: user.id,
          blockId: block.id,
        },
      },
      select: {
        completedAt: true,
        firstOpenedAt: true,
      },
    });
    const timingIncrement = currentProgress?.completedAt
      ? { reviewSeconds: { increment: activeSeconds } }
      : { activeSeconds: { increment: activeSeconds } };

    await db.userBlockProgress.upsert({
      where: {
        userId_blockId: {
          userId: user.id,
          blockId: block.id,
        },
      },
      update: {
        ...(activeSeconds > 0 ? timingIncrement : {}),
        ...(blockOpened
          ? {
              firstOpenedAt: currentProgress?.firstOpenedAt ? undefined : now,
              lastOpenedAt: now,
              visitCount: { increment: 1 },
            }
          : {}),
      },
      create: {
        userId: user.id,
        blockId: block.id,
        firstOpenedAt: now,
        lastOpenedAt: now,
        visitCount: blockOpened ? 1 : 0,
        activeSeconds: currentProgress?.completedAt ? 0 : activeSeconds,
        reviewSeconds: currentProgress?.completedAt ? activeSeconds : 0,
      },
    });
  }

  return Response.json({ ok: true });
}
