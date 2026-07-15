import { Chip } from "@heroui/react";
import { TimelineRail, type TimelineStep } from "@/components/cockpit-ui";
import { lessonHref } from "./course-utils";

export type RouteMapLesson = {
  id: string;
  slug: string;
  title: string;
  durationMinutes: number | null;
  progress: {
    percent: number;
    resumeBlock?: {
      id: string;
    } | null;
  };
};

export function CourseRouteMap({
  activeLessonId,
  description = "Общая карта показывает, какие уроки уже закрыты и где сейчас точка продолжения.",
  lessons,
  title = "Карта маршрута",
}: {
  activeLessonId?: string;
  description?: string;
  lessons: RouteMapLesson[];
  title?: string;
}) {
  const steps: TimelineStep[] = lessons.map((lesson) => ({
    href: lessonHref(lesson.slug, lesson.progress.resumeBlock?.id),
    id: lesson.id,
    label: lesson.title,
    meta: `${lesson.progress.percent}%`,
    state:
      lesson.progress.percent >= 100
        ? "done"
        : lesson.id === activeLessonId
          ? "active"
          : "todo",
  }));
  const completedCount = lessons.filter((lesson) => lesson.progress.percent >= 100).length;

  return (
    <section className="cockpit-panel p-5">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
        <Chip variant="soft" color="success">
          {completedCount} из {lessons.length}
        </Chip>
      </div>
      {steps.length > 0 ? (
        <TimelineRail steps={steps} />
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--line-strong)] bg-white/60 p-4 text-sm text-[var(--muted)]">
          Уроки появятся здесь после наполнения программы.
        </p>
      )}
    </section>
  );
}
