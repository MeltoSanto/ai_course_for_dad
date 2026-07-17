"use client";

import { Button } from "@heroui/react/button";
import {
  ChevronDown,
  Clock3,
  LogIn,
  MonitorSmartphone,
  RotateCcw,
  UserRound,
  UsersRound,
} from "lucide-react";
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
  access: {
    lastLoginAt: string | null;
    lastActiveAt: string | null;
    isOnline: boolean;
    ipAddress: string | null;
    deviceType: string | null;
    operatingSystem: string | null;
    browser: string | null;
    loginCount: number;
    activeDays30: number;
    lastLesson: {
      title: string;
      order: number;
    } | null;
    sessions: Array<{
      id: string;
      signedInAt: string;
      lastActiveAt: string;
      signedOutAt: string | null;
      ipAddress: string | null;
      deviceType: string | null;
      operatingSystem: string | null;
      browser: string | null;
      lastPath: string | null;
      lastLessonTitle: string | null;
    }>;
  };
  timing: {
    activeSeconds: number;
    reviewSeconds: number;
    lessons: Array<{
      id: string;
      title: string;
      order: number;
      activeSeconds: number;
      reviewSeconds: number;
      blocks: Array<{
        id: string;
        title: string;
        order: number;
        activeSeconds: number;
        reviewSeconds: number;
        visitCount: number;
        completedAt: string | null;
      }>;
    }>;
  };
};

const initialState: AdminProgressResetState = {
  status: "idle",
};

const selectClass =
  "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--signal-green)] focus:ring-2 focus:ring-emerald-100";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Пока нет данных";
}

function formatRelative(value: string | null) {
  if (!value) return "активности ещё не было";
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (elapsedSeconds < 60) return "только что";
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return "0 мин";
  if (seconds < 60) return "< 1 мин";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function deviceLabel(access: StudentOption["access"]) {
  return [access.operatingSystem, access.browser, access.deviceType]
    .filter(Boolean)
    .join(" · ") || "Пока не определено";
}

function StudentAccessStats({ student }: { student: StudentOption }) {
  const { access, timing } = student;

  return (
    <div className="my-4 grid gap-3">
      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 font-bold">
            <LogIn aria-hidden="true" size={17} />
            Посещения
          </h4>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              access.isOnline
                ? "bg-emerald-100 text-emerald-800"
                : "bg-stone-200 text-stone-700"
            }`}
          >
            {access.isOnline ? "Сейчас на сайте" : `Был ${formatRelative(access.lastActiveAt)}`}
          </span>
        </div>

        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--muted)]">Последний вход</dt>
            <dd className="mt-1 font-semibold">{formatDate(access.lastLoginAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">Последняя активность</dt>
            <dd className="mt-1 font-semibold">{formatDate(access.lastActiveAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">IP-адрес</dt>
            <dd className="mt-1 break-all font-mono text-xs font-semibold">
              {access.ipAddress ?? "Пока не определён"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">Устройство</dt>
            <dd className="mt-1 flex items-start gap-1.5 font-semibold">
              <MonitorSmartphone aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
              {deviceLabel(access)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">Количество входов</dt>
            <dd className="mt-1 font-semibold">{access.loginCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">Активных дней за 30 дней</dt>
            <dd className="mt-1 font-semibold">{access.activeDays30}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[var(--muted)]">Последний открытый урок</dt>
            <dd className="mt-1 font-semibold">
              {access.lastLesson
                ? `${access.lastLesson.order}. ${access.lastLesson.title}`
                : "Пока не открывал уроки"}
            </dd>
          </div>
        </dl>

        {access.sessions.length > 0 ? (
          <details className="group mt-4 border-t border-[var(--line)] pt-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
              История последних входов
              <ChevronDown className="transition group-open:rotate-180" size={17} />
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="text-[var(--muted)]">
                  <tr>
                    <th className="pb-2 pr-3 font-semibold">Вход</th>
                    <th className="pb-2 pr-3 font-semibold">Активность</th>
                    <th className="pb-2 pr-3 font-semibold">IP</th>
                    <th className="pb-2 font-semibold">Устройство</th>
                  </tr>
                </thead>
                <tbody>
                  {access.sessions.map((session) => (
                    <tr className="border-t border-[var(--line)] align-top" key={session.id}>
                      <td className="py-2 pr-3">{formatDate(session.signedInAt)}</td>
                      <td className="py-2 pr-3">{formatDate(session.lastActiveAt)}</td>
                      <td className="py-2 pr-3 font-mono">{session.ipAddress ?? "—"}</td>
                      <td className="py-2">
                        {[session.operatingSystem, session.browser, session.deviceType]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 font-bold">
            <Clock3 aria-hidden="true" size={17} />
            Время обучения
          </h4>
          <strong className="text-sm">{formatDuration(timing.activeSeconds)}</strong>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Активное время до нажатия «Готово»; повторение учитывается отдельно.
        </p>

        {timing.lessons.length > 0 ? (
          <details className="group mt-3 border-t border-[var(--line)] pt-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
              Время по урокам и блокам
              <ChevronDown className="transition group-open:rotate-180" size={17} />
            </summary>
            <div className="mt-3 grid gap-3">
              {timing.lessons.map((lesson) => (
                <div className="rounded-lg bg-[var(--surface-muted)] p-3" key={lesson.id}>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <strong>
                      {lesson.order}. {lesson.title}
                    </strong>
                    <span className="shrink-0 font-bold">
                      {formatDuration(lesson.activeSeconds)}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1.5">
                    {lesson.blocks.map((block) => (
                      <div
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-xs"
                        key={block.id}
                      >
                        <span className="min-w-0 text-[var(--muted)]">
                          {block.order}. {block.title}
                          {block.visitCount > 1 ? ` · заходов: ${block.visitCount}` : ""}
                        </span>
                        <span className="font-semibold">
                          {formatDuration(block.activeSeconds)}
                          {block.reviewSeconds > 0
                            ? ` + ${formatDuration(block.reviewSeconds)} повторение`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">Замеров времени пока нет.</p>
        )}
      </section>
    </div>
  );
}

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

                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-5">
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

                <StudentAccessStats student={student} />

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
