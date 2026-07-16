import { Chip } from "@heroui/react/chip";
import type { LessonKind, ProgressStatus, PublicationStatus } from "@prisma/client";
import { ArrowRight, Clock3 } from "lucide-react";
import Link from "next/link";
import { kindLabels, progressLabels, statusLabels } from "@/lib/course";
import { lessonHref, progressTone } from "./course-utils";

export type LessonCardLesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: LessonKind;
  status: PublicationStatus;
  order: number;
  durationMinutes: number | null;
  blockCount: number;
  assignmentCount: number;
  testCount: number;
  progress: {
    status: ProgressStatus;
    percent: number;
    resumeBlock?: {
      id: string;
      title: string;
    } | null;
  };
};

export function LessonCard({ lesson }: { lesson: LessonCardLesson }) {
  return (
    <Link
      className="group rounded-xl border border-[var(--line)] bg-white/82 p-4 transition hover:-translate-y-0.5 hover:border-[var(--signal-green)] hover:shadow-[0_16px_36px_rgba(28,35,29,0.08)]"
      href={lessonHref(lesson.slug, lesson.progress.resumeBlock?.id)}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="grid size-14 place-items-center rounded-xl bg-[var(--sidebar)] text-base font-bold text-white">
          {lesson.order}
        </div>
        <ArrowRight
          className="mt-2 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--signal-green)]"
          size={18}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Chip variant="soft" color="default">
          {kindLabels[lesson.kind]}
        </Chip>
        <Chip variant="soft" color={progressTone(lesson.progress.percent)}>
          {progressLabels[lesson.progress.status]}
        </Chip>
        <Chip variant="soft" color="default">
          {statusLabels[lesson.status]}
        </Chip>
      </div>

      <h3 className="text-lg font-bold leading-tight">{lesson.title}</h3>
      {lesson.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
          {lesson.description}
        </p>
      ) : null}

      <div className="mt-5">
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

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
        <span>{lesson.blockCount} блоков</span>
        <span>{lesson.assignmentCount} практик</span>
        <span>{lesson.testCount} тестов</span>
        {lesson.durationMinutes ? (
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} />
            {lesson.durationMinutes} мин
          </span>
        ) : null}
      </div>
    </Link>
  );
}
