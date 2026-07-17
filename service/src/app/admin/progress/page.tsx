import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ProgressResetPanel } from "@/app/admin/progress/progress-reset-panel";
import { CockpitShell } from "@/components/cockpit-shell";
import { getAdminProgressManager, kindLabels } from "@/lib/course";
import { requireAdmin } from "@/lib/session";
import { isOnline } from "@/lib/activity";

export default async function AdminProgressPage() {
  const user = await requireAdmin();
  const manager = await getAdminProgressManager();
  const lessons = manager.lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    meta: `${kindLabels[lesson.kind]} ${lesson.order}`,
  }));
  const students = manager.students.map((student) => {
    const latestLogin = student.accessSessions[0] ?? null;
    const latestActivity = [...student.accessSessions].sort(
      (left, right) => right.lastActiveAt.getTime() - left.lastActiveAt.getTime(),
    )[0] ?? null;
    const lessonTimings = new Map<
      string,
      {
        id: string;
        title: string;
        order: number;
        activeSeconds: number;
        reviewSeconds: number;
        blocks: Array<{
          id: string;
          title: string;
          order: number;
          activeSeconds: number;
          reviewSeconds: number;
          visitCount: number;
          completedAt: string | null;
        }>;
      }
    >();

    for (const progress of student.blockProgresses) {
      const lesson = progress.block.lesson;
      const timing = lessonTimings.get(lesson.id) ?? {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        activeSeconds: 0,
        reviewSeconds: 0,
        blocks: [],
      };
      timing.activeSeconds += progress.activeSeconds;
      timing.reviewSeconds += progress.reviewSeconds;
      timing.blocks.push({
        id: progress.blockId,
        title: progress.block.title,
        order: progress.block.order,
        activeSeconds: progress.activeSeconds,
        reviewSeconds: progress.reviewSeconds,
        visitCount: progress.visitCount,
        completedAt: progress.completedAt?.toISOString() ?? null,
      });
      lessonTimings.set(lesson.id, timing);
    }

    const timings = [...lessonTimings.values()]
      .map((timing) => ({
        ...timing,
        blocks: timing.blocks.sort((left, right) => left.order - right.order),
      }))
      .sort((left, right) => left.order - right.order);

    return {
      id: student.id,
      username: student.username,
      displayName: student.displayName,
      counts: {
        lessons: student._count.lessonProgresses,
        blocks: student._count.blockProgresses,
        assignments: student._count.assignmentProgresses,
        attempts: student._count.testAttempts,
        achievements: student._count.achievements,
      },
      access: {
        lastLoginAt: latestLogin?.signedInAt.toISOString() ?? null,
        lastActiveAt: latestActivity?.lastActiveAt.toISOString() ?? null,
        isOnline: isOnline(latestActivity?.lastActiveAt),
        ipAddress: latestLogin?.ipAddress ?? null,
        deviceType: latestLogin?.deviceType ?? null,
        operatingSystem: latestLogin?.operatingSystem ?? null,
        browser: latestLogin?.browser ?? null,
        loginCount: student._count.accessSessions,
        activeDays30: student.activityDays.length,
        lastLesson: latestActivity?.lastLesson
          ? {
              title: latestActivity.lastLesson.title,
              order: latestActivity.lastLesson.order,
            }
          : null,
        sessions: student.accessSessions.map((session) => ({
          id: session.id,
          signedInAt: session.signedInAt.toISOString(),
          lastActiveAt: session.lastActiveAt.toISOString(),
          signedOutAt: session.signedOutAt?.toISOString() ?? null,
          ipAddress: session.ipAddress,
          deviceType: session.deviceType,
          operatingSystem: session.operatingSystem,
          browser: session.browser,
          lastPath: session.lastPath,
          lastLessonTitle: session.lastLesson?.title ?? null,
        })),
      },
      timing: {
        activeSeconds: timings.reduce((sum, lesson) => sum + lesson.activeSeconds, 0),
        reviewSeconds: timings.reduce((sum, lesson) => sum + lesson.reviewSeconds, 0),
        lessons: timings,
      },
    };
  });

  return (
    <CockpitShell active="admin" continueHref="/admin" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                <ShieldCheck aria-hidden="true" size={15} />
                Только для администратора
              </Chip>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
                Управление прогрессом учеников
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Следите за посещениями и временем прохождения блоков, сбрасывайте весь
                учебный прогресс или данные отдельного урока. Аккаунты, логины, пароли и
                материалы курса сохраняются.
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">
                <ArrowLeft aria-hidden="true" size={16} />
                Вернуться в админку
              </Button>
            </Link>
          </div>
        </section>

        <div className="mt-5">
          <ProgressResetPanel lessons={lessons} students={students} />
        </div>
      </div>
    </CockpitShell>
  );
}
