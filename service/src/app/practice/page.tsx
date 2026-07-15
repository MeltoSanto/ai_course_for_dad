import { Button, Chip } from "@heroui/react";
import { AssignmentStatus } from "@prisma/client";
import { CheckCircle2, ChevronRight, ClipboardList, Clock3 } from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import { formatFullDate } from "@/components/course/course-utils";
import { MetricCard } from "@/components/course/metric-card";
import { markdownToPlainText } from "@/components/markdown-content";
import { getStudentDashboard, getStudentPracticeCenter } from "@/lib/course";
import { requireUser } from "@/lib/session";

const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  NOT_STARTED: "Не начато",
  IN_PROGRESS: "В процессе",
  SUBMITTED: "Сохранено",
  COMPLETED: "Выполнено",
};

function assignmentTone(status: AssignmentStatus) {
  if (status === AssignmentStatus.COMPLETED) {
    return "success" as const;
  }

  if (status === AssignmentStatus.SUBMITTED || status === AssignmentStatus.IN_PROGRESS) {
    return "accent" as const;
  }

  return "default" as const;
}

export default async function PracticePage() {
  const user = await requireUser();
  const [dashboard, practice] = await Promise.all([
    getStudentDashboard(user.id),
    getStudentPracticeCenter(user.id),
  ]);
  const continueLesson = dashboard.continueLesson;
  const continueHref = continueLesson ? `/lessons/${continueLesson.slug}#practice` : "/lessons";

  return (
    <CockpitShell active="practice" continueHref={continueHref} user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                Практические задания
              </Chip>
              <h1 className="mt-5 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                Практика
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Отдельный рабочий список всех практик. Карточка ведёт в нужный урок
                сразу к блоку практического задания, а результат сохраняется на сервере.
              </p>
            </div>
            <Link href={continueHref}>
              <Button variant="primary">
                Перейти к практике
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={ClipboardList}
              label="Всего практик"
              meta="Во всех опубликованных уроках"
              value={practice.totals.total}
            />
            <MetricCard
              icon={CheckCircle2}
              label="Выполнено"
              meta="Отмечено учеником как завершённое"
              tone="slate"
              value={practice.totals.completed}
            />
            <MetricCard
              icon={Clock3}
              label="В работе"
              meta="Сохранено или начато"
              tone="amber"
              value={practice.totals.submitted + practice.totals.inProgress}
            />
          </div>
        </section>

        <section className="mt-5 cockpit-panel p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Все практические задания</h2>
              <p className="text-sm text-[var(--muted)]">
                Статус берётся из серверного профиля ученика.
              </p>
            </div>
            <Chip variant="soft" color="success">
              {practice.totals.completed} / {practice.totals.total}
            </Chip>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {practice.assignments.map((assignment) => (
              <Link
                className="group rounded-xl border border-[var(--line)] bg-white/82 p-4 transition hover:-translate-y-0.5 hover:border-[var(--signal-green)] hover:shadow-[0_16px_36px_rgba(28,35,29,0.08)]"
                href={`/lessons/${assignment.lesson.slug}#practice`}
                key={assignment.id}
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <Chip variant="soft" color={assignmentTone(assignment.progress.status)}>
                    {assignmentStatusLabels[assignment.progress.status]}
                  </Chip>
                  <Chip variant="soft" color="default">
                    Урок {assignment.lesson.order}
                  </Chip>
                </div>
                <h3 className="text-lg font-bold leading-tight">{assignment.title}</h3>
                <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                  {assignment.lesson.title}
                </p>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--muted)]">
                  {markdownToPlainText(assignment.instructionsMd)}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-sm">
                  <span className="text-[var(--muted)]">
                    Обновлено: {formatFullDate(assignment.progress.updatedAt)}
                  </span>
                  <ChevronRight
                    className="text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--signal-green)]"
                    size={18}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </CockpitShell>
  );
}
