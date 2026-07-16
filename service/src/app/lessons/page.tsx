import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import { CourseRouteMap } from "@/components/course/course-route-map";
import { lessonHref } from "@/components/course/course-utils";
import { LessonCard } from "@/components/course/lesson-card";
import { getStudentDashboard } from "@/lib/course";
import { requireUser } from "@/lib/session";

export default async function LessonsPage() {
  const user = await requireUser();
  const dashboard = await getStudentDashboard(user.id);
  const continueLesson = dashboard.continueLesson;
  const continueHref = continueLesson
    ? lessonHref(continueLesson.slug, continueLesson.progress.resumeBlock?.id)
    : "/lessons";

  return (
    <CockpitShell active="lessons" continueHref={continueHref} user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Chip variant="soft" color="success">
                  Основной трек
                </Chip>
                <Chip variant="soft" color="accent">
                  {dashboard.coreLessons.length + dashboard.extraLessons.length} уроков
                </Chip>
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                Уроки
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Здесь ученик выбирает конкретный урок. Нажатие по плитке открывает
                урок целиком: материалы, практику и проверку.
              </p>
            </div>
            {continueLesson ? (
              <Link href={continueHref}>
                <Button variant="primary">
                  Продолжить текущий урок
                  <ChevronRight size={16} />
                </Button>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="mt-5">
          <CourseRouteMap
            activeLessonId={continueLesson?.id}
            lessons={dashboard.coreLessons}
            title="Карта основного трека"
          />
        </div>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="cockpit-panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="text-[var(--signal-green)]" size={22} />
              <h2 className="text-xl font-bold">Основные уроки</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.coreLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <section className="cockpit-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="text-[var(--signal-amber)]" size={22} />
                <h2 className="text-xl font-bold">Дополнительные уроки</h2>
              </div>
              <div className="grid gap-3">
                {dashboard.extraLessons.length > 0 ? (
                  dashboard.extraLessons.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-[var(--line-strong)] bg-white/60 p-4 text-sm leading-6 text-[var(--muted)]">
                    Дополнительные уроки можно будет добавить после наполнения
                    программы.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </CockpitShell>
  );
}
