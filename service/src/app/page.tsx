import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Play,
  Route,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import { ProgressDonut, StatusRow } from "@/components/cockpit-ui";
import { AchievementCard } from "@/components/course/achievement-card";
import { CourseRouteMap } from "@/components/course/course-route-map";
import {
  formatShortDate,
  lessonHref,
  testPercent,
} from "@/components/course/course-utils";
import { MetricCard } from "@/components/course/metric-card";
import { getStudentDashboard, kindLabels } from "@/lib/course";
import { requireUser } from "@/lib/session";

function QuickLink({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <Link
      className="group rounded-xl border border-[var(--line)] bg-white/82 p-4 transition hover:-translate-y-0.5 hover:border-[var(--signal-green)] hover:shadow-[0_16px_36px_rgba(28,35,29,0.08)]"
      href={href}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-[var(--surface-muted)] text-[var(--signal-green)]">
          <Icon size={22} />
        </span>
        <ChevronRight
          className="text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--signal-green)]"
          size={18}
        />
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{description}</p>
    </Link>
  );
}

export default async function Home() {
  const user = await requireUser();
  const dashboard = await getStudentDashboard(user.id);
  const continueLesson = dashboard.continueLesson;
  const continueHref = continueLesson
    ? lessonHref(continueLesson.slug, continueLesson.progress.resumeBlock?.id)
    : "/lessons";
  const latestAchievement = dashboard.achievements[0];
  const latestTest = dashboard.latestTestAttempt;

  return (
    <CockpitShell active="route" continueHref={continueHref} user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="cockpit-panel p-5 sm:p-7">
            <div className="flex flex-wrap gap-2">
              <Chip variant="soft" color="success">
                {dashboard.completedCoreCount} из {dashboard.coreLessons.length} основных уроков
                </Chip>
                <Chip variant="soft" color="accent">
                  Продолжение по готовности блоков
                </Chip>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-normal text-black sm:text-5xl">
              Главная панель обучения
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Здесь видна общая статистика, текущая точка маршрута, последние
              результаты и открытые ачивки. Сами уроки, практика и тесты вынесены в
              отдельные рабочие страницы.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={continueHref}>
                <Button variant="primary">
                  <Play fill="currentColor" size={16} />
                  Продолжить обучение
                </Button>
              </Link>
              <Link href="/lessons">
                <Button variant="outline">
                  <BookOpen size={16} />
                  Все уроки
                </Button>
              </Link>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <MetricCard
                icon={Route}
                label="Маршрут"
                meta={`${dashboard.coreLessons.length} основных уроков`}
                value={`${dashboard.coursePercent}%`}
              />
              <MetricCard
                icon={CheckCircle2}
                label="Завершено"
                meta="Закрытые основные уроки"
                tone="slate"
                value={dashboard.completedCoreCount}
              />
              <MetricCard
                icon={Trophy}
                label="Ачивки"
                meta="Последние достижения ученика"
                tone="amber"
                value={dashboard.achievements.length}
              />
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <section className="cockpit-panel p-5">
              <h2 className="mb-5 text-xl font-bold">Ваш прогресс</h2>
              <ProgressDonut value={dashboard.coursePercent} />
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--signal-green)]"
                href="/progress"
              >
                Открыть историю
                <ChevronRight size={16} />
              </Link>
            </section>

            <section className="cockpit-panel p-5">
              <h2 className="mb-3 text-xl font-bold">Точка продолжения</h2>
              {continueLesson ? (
                <Link
                  className="block rounded-xl border border-[var(--line)] bg-white/82 p-4 transition hover:border-[var(--signal-green)]"
                  href={continueHref}
                >
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    {kindLabels[continueLesson.kind]} урок {continueLesson.order}
                  </p>
                  <p className="mt-2 font-bold">{continueLesson.title}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Прогресс: {continueLesson.progress.percent}%
                  </p>
                </Link>
              ) : (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Уроки появятся после наполнения программы.
                </p>
              )}
            </section>
          </aside>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <CourseRouteMap
            activeLessonId={continueLesson?.id}
            lessons={dashboard.coreLessons}
            title="Общая карта уроков"
          />

          <aside className="grid content-start gap-4">
            <section className="cockpit-panel p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold">Последний тест</h2>
                <ClipboardCheck className="text-[var(--foreground)]" size={20} />
              </div>
              {latestTest ? (
                <>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm">{latestTest.test.title}</p>
                    <Chip
                      variant="soft"
                      color={latestTest.isPassed ? "success" : "danger"}
                    >
                      {latestTest.isPassed ? "Пройден" : "Повторить"}
                    </Chip>
                  </div>
                  <p className="text-3xl font-bold">
                    {testPercent(latestTest.score, latestTest.maxScore)}%
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {latestTest.score} из {latestTest.maxScore} баллов
                  </p>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {formatShortDate(latestTest.createdAt)}
                  </p>
                </>
              ) : (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  После первой проверки здесь появится последний результат.
                </p>
              )}
            </section>

            <section className="cockpit-panel p-5">
              <h2 className="mb-3 text-xl font-bold">Быстрый справочник</h2>
              <StatusRow
                href="/reference"
                label="Справочник"
                meta={`${dashboard.library.referenceCount} материалов`}
              />
              <StatusRow
                href="/glossary"
                label="Глоссарий"
                meta={`${dashboard.library.glossaryCount} терминов`}
              />
              <StatusRow
                href="/scenarios"
                label="Сценарии"
                meta={`${dashboard.library.scenarioCount} шаблонов`}
              />
            </section>
          </aside>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-4">
          <QuickLink
            description="Плитки уроков, основной трек и дополнительные материалы."
            href="/lessons"
            icon={BookOpen}
            title="Уроки"
          />
          <QuickLink
            description="Все практические задания и статус выполнения."
            href="/practice"
            icon={Award}
            title="Практика"
          />
          <QuickLink
            description="Список тестов, проходной балл и последние попытки."
            href="/tests"
            icon={ClipboardCheck}
            title="Тесты"
          />
          <QuickLink
            description="Открытые и будущие достижения ученика."
            href="/achievements"
            icon={Trophy}
            title="Ачивки"
          />
        </section>

        {latestAchievement ? (
          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <AchievementCard
              awardedAt={latestAchievement.awardedAt}
              code={latestAchievement.achievement.code}
              description={latestAchievement.achievement.description}
              isUnlocked
              title={latestAchievement.achievement.title}
            />
            <Link href="/achievements">
              <Button fullWidth variant="outline">
                Открыть все ачивки
                <ChevronRight size={16} />
              </Button>
            </Link>
          </section>
        ) : null}
      </div>
    </CockpitShell>
  );
}
