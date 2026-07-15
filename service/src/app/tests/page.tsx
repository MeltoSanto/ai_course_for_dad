import { Button, Chip } from "@heroui/react";
import { CheckCircle2, ChevronRight, ClipboardCheck, History, ListChecks } from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import {
  formatFullDate,
  testPercent,
} from "@/components/course/course-utils";
import { MetricCard } from "@/components/course/metric-card";
import { getStudentDashboard, getStudentTestCenter } from "@/lib/course";
import { requireUser } from "@/lib/session";

export default async function TestsPage() {
  const user = await requireUser();
  const [dashboard, testCenter] = await Promise.all([
    getStudentDashboard(user.id),
    getStudentTestCenter(user.id),
  ]);
  const continueLesson = dashboard.continueLesson;
  const continueHref = continueLesson ? `/lessons/${continueLesson.slug}#tests` : "/lessons";

  return (
    <CockpitShell active="tests" continueHref={continueHref} user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Chip variant="soft" color="success">
                Проверка знаний
              </Chip>
              <h1 className="mt-5 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                Тесты
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Отдельная страница для всех проверок: видно количество вопросов,
                проходной балл, последнюю попытку и быстрый переход к тесту внутри урока.
              </p>
            </div>
            <Link href={continueHref}>
              <Button variant="primary">
                Перейти к проверке
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={ClipboardCheck}
              label="Всего тестов"
              meta={`${testCenter.totals.questionCount} вопросов`}
              value={testCenter.totals.total}
            />
            <MetricCard
              icon={CheckCircle2}
              label="Зачтено"
              meta="Хотя бы одна успешная попытка"
              tone="slate"
              value={testCenter.totals.passed}
            />
            <MetricCard
              icon={History}
              label="Попытки"
              meta="Последние сохранённые результаты"
              tone="amber"
              value={testCenter.recentAttempts.length}
            />
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="cockpit-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="text-[var(--signal-green)]" size={22} />
              <h2 className="text-xl font-bold">Все тесты</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {testCenter.tests.map((test) => {
                const latestAttempt = test.latestAttempt;
                const bestAttempt = test.bestAttempt;

                return (
                  <Link
                    className="group rounded-xl border border-[var(--line)] bg-white/82 p-4 transition hover:-translate-y-0.5 hover:border-[var(--signal-green)] hover:shadow-[0_16px_36px_rgba(28,35,29,0.08)] focus-visible:border-[var(--signal-green)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
                    href={`/lessons/${test.lesson.slug}#tests`}
                    key={test.id}
                  >
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Chip
                        variant="soft"
                        color={test.hasPassed ? "success" : "default"}
                      >
                        {test.hasPassed
                          ? "Зачтён"
                          : latestAttempt
                            ? "Повторить"
                            : "Не начат"}
                      </Chip>
                      <Chip variant="soft" color="default">
                        {test.questionCount} вопросов
                      </Chip>
                    </div>
                    <h3 className="text-lg font-bold leading-tight">{test.title}</h3>
                    <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                      Урок {test.lesson.order}: {test.lesson.title}
                    </p>
                    {test.description ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                        {test.description}
                      </p>
                    ) : null}
                    <div className="mt-4 rounded-xl bg-[var(--surface-muted)] p-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-[var(--muted)]">Проходной балл</span>
                        <strong>{test.passingScore}</strong>
                      </div>
                      <div className="mt-2 flex justify-between gap-3">
                        <span className="text-[var(--muted)]">Последняя попытка</span>
                        <strong>
                          {latestAttempt
                            ? `${testPercent(latestAttempt.score, latestAttempt.maxScore)}%`
                            : "Пока нет"}
                        </strong>
                      </div>
                      <div className="mt-2 flex justify-between gap-3">
                        <span className="text-[var(--muted)]">Лучший результат</span>
                        <strong>
                          {bestAttempt
                            ? `${testPercent(bestAttempt.score, bestAttempt.maxScore)}%`
                            : "Пока нет"}
                        </strong>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end text-sm font-bold text-[var(--signal-green)]">
                      <span className="inline-flex items-center gap-1">
                        {latestAttempt ? "Открыть / повторить" : "Начать"}
                        <ChevronRight
                          className="transition group-hover:translate-x-1"
                          size={18}
                        />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <aside className="cockpit-panel p-5">
            <h2 className="mb-4 text-xl font-bold">История попыток</h2>
            <div className="grid gap-3">
              {testCenter.recentAttempts.length > 0 ? (
                testCenter.recentAttempts.map((attempt) => (
                  <Link
                    className="rounded-xl border border-[var(--line)] bg-white/82 p-3 transition hover:border-[var(--signal-green)] focus-visible:border-[var(--signal-green)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
                    href={`/lessons/${attempt.test.lesson.slug}#tests`}
                    key={attempt.id}
                  >
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Chip variant="soft" color={attempt.isPassed ? "success" : "danger"}>
                        {attempt.score}/{attempt.maxScore}
                      </Chip>
                      <Chip variant="soft" color="default">
                        {formatFullDate(attempt.createdAt)}
                      </Chip>
                    </div>
                    <p className="font-bold">{attempt.test.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {attempt.test.lesson.title}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--line-strong)] bg-white/60 p-4 text-sm text-[var(--muted)]">
                  Попыток тестов пока нет.
                </p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </CockpitShell>
  );
}
