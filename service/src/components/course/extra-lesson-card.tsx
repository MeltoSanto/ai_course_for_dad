import { Chip } from "@heroui/react/chip";
import type { LessonKind } from "@prisma/client";
import { ArrowRight, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";

export type ExtraLessonCardLesson = {
  slug: string;
  title: string;
  kind: LessonKind;
  order: number;
  durationMinutes: number | null;
  isContentReady: boolean;
};

export function ExtraLessonCard({
  coreCourseCompleted,
  lesson,
}: {
  coreCourseCompleted: boolean;
  lesson: ExtraLessonCardLesson;
}) {
  const isAvailable = coreCourseCompleted && lesson.isContentReady;
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-[var(--signal-amber)]">
          {isAvailable ? (
            <Sparkles aria-hidden="true" size={18} />
          ) : (
            <LockKeyhole aria-hidden="true" size={17} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="soft" color="warning">
              Доп. урок {lesson.order}
            </Chip>
            {lesson.durationMinutes && isAvailable ? (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                <Clock3 aria-hidden="true" size={12} />
                {lesson.durationMinutes} мин
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-sm font-bold leading-5">{lesson.title}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {!coreCourseCompleted
              ? "Откроется после основного курса"
              : lesson.isContentReady
                ? "Дополнительный материал открыт"
                : "Материал готовится — пустые блоки скрыты"}
          </p>
        </div>
        {isAvailable ? (
          <ArrowRight
            aria-hidden="true"
            className="mt-2 shrink-0 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--signal-green)]"
            size={17}
          />
        ) : null}
      </div>
    </>
  );

  if (!isAvailable) {
    return (
      <article className="rounded-xl border border-[var(--line)] bg-white/62 p-3">
        {content}
      </article>
    );
  }

  return (
    <Link
      className="group rounded-xl border border-[var(--line)] bg-white/82 p-3 transition hover:border-[var(--signal-green)] hover:shadow-[0_12px_28px_rgba(28,35,29,0.07)]"
      href={`/lessons/${lesson.slug}`}
    >
      {content}
    </Link>
  );
}
