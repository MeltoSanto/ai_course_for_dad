"use client";

import { Button } from "@heroui/react/button";
import { RotateCcw, UserRound, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  resetStudentProgressAction,
  type AdminProgressResetState,
} from "@/app/admin/actions";

type LessonOption = {
  id: string;
  title: string;
  meta: string;
};

type StudentOption = {
  id: string;
  username: string;
  displayName: string;
  counts: {
    lessons: number;
    blocks: number;
    assignments: number;
    attempts: number;
    achievements: number;
  };
};

const initialState: AdminProgressResetState = {
  status: "idle",
};

const selectClass =
  "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--signal-green)] focus:ring-2 focus:ring-emerald-100";

function ProgressResetForm({
  lessons,
  targetId,
  targetLabel,
}: {
  lessons: LessonOption[];
  targetId: string;
  targetLabel: string;
}) {
  const router = useRouter();
  const [lessonId, setLessonId] = useState("all");
  const [state, formAction, isPending] = useActionState(
    resetStudentProgressAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const selectedLesson = lessons.find((lesson) => lesson.id === lessonId);
    const scope = selectedLesson
      ? `урок «${selectedLesson.title}»`
      : "весь учебный прогресс, попытки тестов и достижения";
    const confirmed = window.confirm(
      `Сбросить ${scope} для ${targetLabel}? Учебные материалы, аккаунты и пароли не изменятся.`,
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className="grid gap-3" onSubmit={handleSubmit}>
      <input name="targetUserId" type="hidden" value={targetId} />
      <label className="text-sm font-semibold">
        Область сброса
        <select
          className={`${selectClass} mt-2`}
          name="lessonId"
          onChange={(event) => setLessonId(event.target.value)}
          value={lessonId}
        >
          <option value="all">Весь прогресс</option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.meta}. {lesson.title}
            </option>
          ))}
        </select>
      </label>

      <Button fullWidth isDisabled={isPending} type="submit" variant="danger">
        <RotateCcw aria-hidden="true" size={16} />
        {isPending
          ? "Сбрасываю..."
          : lessonId === "all"
            ? "Сбросить весь прогресс"
            : "Сбросить выбранный урок"}
      </Button>

      {state.message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            state.status === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function ProgressResetPanel({
  lessons,
  students,
}: {
  lessons: LessonOption[];
  students: StudentOption[];
}) {
  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-red-200 bg-red-50/70 p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-red-100 text-red-700">
                <UsersRound aria-hidden="true" size={22} />
              </span>
              <div>
                <h2 className="text-xl font-bold">Все ученики</h2>
                <p className="text-sm text-red-900/70">
                  Одно действие применится к {students.length} ученик(ам).
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-red-950/75">
              Используйте общий сброс только перед новым запуском курса или если нужно
              обнулить выбранный урок сразу у всех учеников.
            </p>
          </div>
          <ProgressResetForm
            lessons={lessons}
            targetId="all"
            targetLabel="всех учеников"
          />
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-bold">Отдельные ученики</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Можно обнулить весь профиль обучения или только один урок.
          </p>
        </div>

        {students.length === 0 ? (
          <div className="cockpit-panel p-5 text-sm text-[var(--muted)]">
            Учеников пока нет.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {students.map((student) => (
              <article className="cockpit-panel p-5" key={student.id}>
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[var(--signal-green)]">
                    <UserRound aria-hidden="true" size={22} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold">{student.displayName}</h3>
                    <p className="text-sm text-[var(--muted)]">Логин: {student.username}</p>
                  </div>
                </div>

                <div className="my-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-5">
                  {[
                    ["Уроки", student.counts.lessons],
                    ["Блоки", student.counts.blocks],
                    ["Практика", student.counts.assignments],
                    ["Тесты", student.counts.attempts],
                    ["Ачивки", student.counts.achievements],
                  ].map(([label, value]) => (
                    <div
                      className="rounded-lg bg-[var(--surface-muted)] px-2 py-2"
                      key={String(label)}
                    >
                      <strong className="block text-base">{value}</strong>
                      <span className="text-[var(--muted)]">{label}</span>
                    </div>
                  ))}
                </div>

                <ProgressResetForm
                  lessons={lessons}
                  targetId={student.id}
                  targetLabel={`ученика ${student.displayName}`}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
