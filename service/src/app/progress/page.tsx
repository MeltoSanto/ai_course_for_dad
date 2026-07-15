import { Button, Chip } from "@heroui/react";
import { AssignmentStatus } from "@prisma/client";
import { Award, CheckCircle2, ClipboardCheck, History, Trophy } from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import {
  ProgressDonut,
  TimelineRail,
  type TimelineStep,
} from "@/components/cockpit-ui";
import { QaResetProgressButton } from "@/app/progress/qa-reset-progress-button";
import {
  getStudentProgressCenter,
  kindLabels,
  progressLabels,
} from "@/lib/course";
import { requireUser } from "@/lib/session";

const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  NOT_STARTED: "Не начато",
  IN_PROGRESS: "В процессе",
  SUBMITTED: "Сохранено",
  COMPLETED: "Выполнено",
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Пока нет";
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function progressTone(percent: number) {
  if (percent >= 100) {
    return "success";
  }

  if (percent > 0) {
    return "accent";
  }

  return "default";
}

export default async function ProgressPage() {
  const user = await requireUser();
  const progress = await getStudentProgressCenter(user.id);
  const nextLesson =
    progress.coreLessons.find((lesson) => lesson.progress.percent < 100) ??
    progress.coreLessons[0] ??
    progress.lessons[0];
  const continueHref = nextLesson ? `/lessons/${nextLesson.slug}` : "/";
  const routeSteps: TimelineStep[] = progress.coreLessons.slice(0, 8).map((lesson) => ({
    href: `/lessons/${lesson.slug}`,
    id: lesson.id,
    label: lesson.title,
    meta: `${lesson.progress.percent}%`,
    state:
      lesson.progress.percent >= 100
        ? "done"
        : lesson.id === nextLesson?.id
          ? "active"
          : "todo",
  }));

  return (
    <CockpitShell active="route" continueHref={continueHref} user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <Chip variant="soft" color="accent">
                  {progress.completedCoreCount} из {progress.coreLessons.length} основных уроков
                </Chip>
                <Chip variant="soft" color="success">
                  {progress.userAchievements.length}/{progress.achievementCatalog.length} ачивок
                </Chip>
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                Прогресс и достижения
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Здесь видно, где ученик остановился, какие тесты уже сдавал,
                какие практики сохранены и какие достижения открыты.
              </p>
              <div className="mt-6">
                <Link href={continueHref}>
                  <Button variant="primary">Продолжить обучение</Button>
                </Link>
              </div>
              {user.username === "qa" ? (
                <div className="mt-5 max-w-xl rounded-xl border border-red-200 bg-red-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-red-700">
                    QA-режим
                  </p>
                  <p className="mt-2 text-sm leading-6 text-red-900">
                    Сброс возвращает тестового ученика в стартовую точку:
                    удаляет отмеченные блоки, практику, попытки тестов и ачивки
                    только для пользователя `qa`.
                  </p>
                  <QaResetProgressButton />
                </div>
              ) : null}
            </div>
            <ProgressDonut value={progress.coursePercent} />
          </div>

          {routeSteps.length > 0 ? (
            <div className="mt-8 border-t border-[var(--line)] pt-5">
              <TimelineRail steps={routeSteps} />
            </div>
          ) : null}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="grid content-start gap-5">
            <section className="cockpit-panel p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Уроки</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Чтение, практика и тесты учитываются в общем проценте.
                  </p>
                </div>
                <CheckCircle2 className="text-[var(--signal-green)]" size={22} />
              </div>

              <div className="grid gap-3">
                {progress.lessons.map((lesson) => (
                  <Link
                    className="grid gap-4 rounded-xl border border-[var(--line)] bg-white/82 p-4 transition hover:-translate-y-0.5 hover:border-[var(--signal-green)] hover:shadow-[0_16px_36px_rgba(28,35,29,0.08)] lg:grid-cols-[56px_1fr_220px] lg:items-center"
                    href={`/lessons/${lesson.slug}`}
                    key={lesson.id}
                  >
                    <div className="grid size-14 place-items-center rounded-xl bg-[var(--sidebar)] text-base font-bold text-white">
                      {lesson.order}
                    </div>
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Chip variant="soft" color="default">
                          {kindLabels[lesson.kind]}
                        </Chip>
                        <Chip
                          variant="soft"
                          color={progressTone(lesson.progress.percent)}
                        >
                          {progressLabels[lesson.progress.status]}
                        </Chip>
                      </div>
                      <h3 className="font-bold">{lesson.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Последняя активность: {formatDate(lesson.progress.lastVisitedAt)}
                      </p>
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-[var(--muted)]">Прогресс</span>
                          <strong>{lesson.progress.percent}%</strong>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--surface-muted)]">
                          <div
                            className="h-full rounded-full bg-[var(--signal-green)]"
                            style={{ width: `${lesson.progress.percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-[var(--surface-muted)] px-2 py-2">
                          <strong>
                            {lesson.blocks.completed}/{lesson.blocks.total}
                          </strong>
                          <p className="text-[var(--muted)]">блоки</p>
                        </div>
                        <div className="rounded-lg bg-[var(--surface-muted)] px-2 py-2">
                          <strong>
                            {lesson.assignments.completed}/{lesson.assignments.total}
                          </strong>
                          <p className="text-[var(--muted)]">практика</p>
                        </div>
                        <div className="rounded-lg bg-[var(--surface-muted)] px-2 py-2">
                          <strong>
                            {lesson.tests.passed}/{lesson.tests.total}
                          </strong>
                          <p className="text-[var(--muted)]">тесты</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="cockpit-panel p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardCheck className="text-[var(--signal-green)]" size={20} />
                  <h2 className="text-xl font-bold">Тесты</h2>
                </div>
                <div className="grid gap-3">
                  {progress.recentTestAttempts.length > 0 ? (
                    progress.recentTestAttempts.map((attempt) => (
                      <div
                        className="rounded-xl border border-[var(--line)] bg-white/82 p-3"
                        key={attempt.id}
                      >
                        <div className="flex flex-wrap gap-2">
                          <Chip
                            variant="soft"
                            color={attempt.isPassed ? "success" : "danger"}
                          >
                            {attempt.score}/{attempt.maxScore}
                          </Chip>
                          <Chip variant="soft" color="default">
                            {formatDate(attempt.createdAt)}
                          </Chip>
                        </div>
                        <p className="mt-2 font-bold">{attempt.test.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {attempt.test.lesson.title}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-[var(--line-strong)] bg-white/60 p-3 text-sm text-[var(--muted)]">
                      Попыток тестов пока нет.
                    </p>
                  )}
                </div>
              </div>

              <div className="cockpit-panel p-5">
                <div className="mb-4 flex items-center gap-2">
                  <History className="text-[var(--signal-green)]" size={20} />
                  <h2 className="text-xl font-bold">Практика</h2>
                </div>
                <div className="grid gap-3">
                  {progress.recentAssignments.length > 0 ? (
                    progress.recentAssignments.map((item) => (
                      <div
                        className="rounded-xl border border-[var(--line)] bg-white/82 p-3"
                        key={item.id}
                      >
                        <div className="flex flex-wrap gap-2">
                          <Chip
                            variant="soft"
                            color={
                              item.status === AssignmentStatus.COMPLETED
                                ? "success"
                                : "default"
                            }
                          >
                            {assignmentStatusLabels[item.status]}
                          </Chip>
                          <Chip variant="soft" color="default">
                            {formatDate(item.updatedAt)}
                          </Chip>
                        </div>
                        <p className="mt-2 font-bold">{item.assignment.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {item.assignment.lesson.title}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-[var(--line-strong)] bg-white/60 p-3 text-sm text-[var(--muted)]">
                      Сохранённых практик пока нет.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="grid content-start gap-4">
            <section className="cockpit-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <Award className="text-[var(--signal-amber)]" size={22} />
                <h2 className="text-xl font-bold">Ачивки</h2>
              </div>
              <div className="grid gap-3">
                {progress.achievementCatalog.map((achievement) => (
                  <div
                    className={`rounded-xl border p-4 ${
                      achievement.isUnlocked
                        ? "border-[var(--signal-green)] bg-white"
                        : "border-[var(--line)] bg-[var(--surface-muted)] opacity-75"
                    }`}
                    key={achievement.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold">{achievement.title}</p>
                      <Chip
                        variant="soft"
                        color={achievement.isUnlocked ? "success" : "default"}
                      >
                        {achievement.isUnlocked ? "Открыта" : "Закрыта"}
                      </Chip>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-[var(--muted)]">
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="cockpit-panel p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0a7a48,#064f31)] text-white">
                  <Trophy className="text-[var(--signal-amber)]" size={30} />
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">Открыто</p>
                  <p className="text-2xl font-bold">
                    {progress.userAchievements.length}/
                    {progress.achievementCatalog.length}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </CockpitShell>
  );
}
