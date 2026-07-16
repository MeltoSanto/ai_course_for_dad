import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ProgressResetPanel } from "@/app/admin/progress/progress-reset-panel";
import { CockpitShell } from "@/components/cockpit-shell";
import { getAdminProgressManager, kindLabels } from "@/lib/course";
import { requireAdmin } from "@/lib/session";

export default async function AdminProgressPage() {
  const user = await requireAdmin();
  const manager = await getAdminProgressManager();
  const lessons = manager.lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    meta: `${kindLabels[lesson.kind]} ${lesson.order}`,
  }));
  const students = manager.students.map((student) => ({
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
  }));

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
                Сбрасывайте весь учебный прогресс или данные отдельного урока. Аккаунты,
                логины, пароли и материалы курса сохраняются.
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
