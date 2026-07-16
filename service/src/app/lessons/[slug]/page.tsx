import { Button, Chip } from "@heroui/react";
import {
  AssignmentStatus,
  ProgressStatus,
} from "@prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { submitAssignmentAction } from "@/app/actions/learning";
import { LessonModeTabs } from "@/app/lessons/[slug]/lesson-mode-tabs";
import { TestForm } from "@/app/lessons/[slug]/test-form";
import { CockpitShell } from "@/components/cockpit-shell";
import { TimelineRail, type TimelineStep } from "@/components/cockpit-ui";
import {
  blockTypeLabels,
  LessonBlockCard,
} from "@/components/course/lesson-block-card";
import { MarkdownContent } from "@/components/markdown-content";
import {
  getLessonWorkspace,
  kindLabels,
  progressLabels,
  statusLabels,
} from "@/lib/course";
import { requireUser } from "@/lib/session";

const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  NOT_STARTED: "Не начато",
  IN_PROGRESS: "В процессе",
  SUBMITTED: "Сохранено",
  COMPLETED: "Выполнено",
};

const inputClass =
  "mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--signal-green)] focus:ring-2 focus:ring-emerald-100";
const textareaClass = `${inputClass} min-h-28 resize-y leading-6`;

type LessonPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const user = await requireUser();
  const workspace = await getLessonWorkspace(user.id, slug);

  if (!workspace) {
    notFound();
  }

  const { lesson, progress, completedBlockIds, previousLesson, nextLesson } =
    workspace;
  const percent = progress?.percent ?? 0;
  const firstIncompleteBlock = lesson.blocks.find(
    (block) => !completedBlockIds.has(block.id),
  );
  const continueBlock = firstIncompleteBlock ?? null;
  const continueHref = continueBlock
    ? `/lessons/${lesson.slug}#block-${continueBlock.id}`
    : `/lessons/${lesson.slug}#practice`;
  const blockSteps: TimelineStep[] = lesson.blocks.slice(0, 8).map((block) => ({
    href: `#block-${block.id}`,
    id: block.id,
    label: block.title,
    meta: blockTypeLabels[block.type],
    state:
      completedBlockIds.has(block.id)
        ? "done"
        : block.id === continueBlock?.id
          ? "active"
          : "todo",
  }));

  return (
    <CockpitShell active="lessons" continueHref={continueHref} user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] min-w-0 max-w-[calc(100%+2.5rem)] px-5 py-5 sm:-mx-6 sm:max-w-[calc(100%+3rem)] sm:px-6 lg:-mx-8 lg:max-w-[calc(100%+4rem)] lg:px-8">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="cockpit-panel min-w-0 p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <Link
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--signal-green)]"
                  href="/"
                >
                  <ChevronLeft size={16} />
                  К маршруту
                </Link>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Chip variant="soft" color="accent">
                    Урок {lesson.order}
                  </Chip>
                  <Chip variant="soft" color="success">
                    {kindLabels[lesson.kind]}
                  </Chip>
                  {lesson.durationMinutes ? (
                    <Chip variant="soft" color="default">
                      <Clock3 size={14} />
                      {lesson.durationMinutes} мин
                    </Chip>
                  ) : null}
                </div>
                <h1 className="mt-4 text-3xl font-bold leading-tight text-black sm:text-5xl">
                  {lesson.title}
                </h1>
                {lesson.description ? (
                  <p className="mt-4 max-w-4xl text-sm leading-6 text-[var(--muted)]">
                    {lesson.description}
                  </p>
                ) : null}
              </div>

              <div className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-white/82 p-4 sm:w-auto sm:min-w-56">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Прогресс урока</span>
                  <strong>{percent}%</strong>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--signal-green)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip variant="soft" color="default">
                    {statusLabels[lesson.status]}
                  </Chip>
                  <Chip variant="soft" color="success">
                    {progressLabels[progress?.status ?? ProgressStatus.NOT_STARTED]}
                  </Chip>
                </div>
              </div>
            </div>

            {blockSteps.length > 0 ? (
              <div className="mt-8">
                <TimelineRail steps={blockSteps} />
              </div>
            ) : null}
          </section>

          <aside className="grid min-w-0 content-start gap-4 xl:sticky xl:top-24">
            <section className="cockpit-panel p-5">
              <h2 className="text-lg font-bold">Режим прохождения</h2>
              {continueBlock ? (
                <div className="mt-4 rounded-xl border border-[var(--line)] bg-white/82 p-4">
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Следующая точка
                  </p>
                  <p className="mt-2 font-bold">{continueBlock.title}</p>
                  <a className="mt-4 block" href={`#block-${continueBlock.id}`}>
                    <Button fullWidth variant="primary">
                      Продолжить блок
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-[var(--line)] bg-white/82 p-4">
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Материал
                  </p>
                  <p className="mt-2 font-bold">Все блоки отмечены готовыми</p>
                  <a className="mt-4 block" href="#practice">
                    <Button fullWidth variant="primary">
                      Перейти к практике
                    </Button>
                  </a>
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {previousLesson ? (
                  <Link href={`/lessons/${previousLesson.slug}`}>
                    <Button fullWidth variant="outline">
                      Назад
                    </Button>
                  </Link>
                ) : (
                  <Link href="/">
                    <Button fullWidth variant="outline">
                      Маршрут
                    </Button>
                  </Link>
                )}
                {nextLesson ? (
                  <Link href={`/lessons/${nextLesson.slug}`}>
                    <Button fullWidth variant="secondary">
                      Дальше
                    </Button>
                  </Link>
                ) : (
                  <Link href="/progress">
                    <Button fullWidth variant="secondary">
                      Итоги
                    </Button>
                  </Link>
                )}
              </div>
            </section>

            <section className="cockpit-panel p-5">
              <h2 className="text-lg font-bold">Практика и проверка</h2>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-[var(--surface-muted)] px-3 py-3">
                  <span>Задания</span>
                  <strong>{lesson.assignments.length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--surface-muted)] px-3 py-3">
                  <span>Тесты</span>
                  <strong>{lesson.tests.length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--surface-muted)] px-3 py-3">
                  <span>Вопросы</span>
                  <strong>
                    {lesson.tests.reduce(
                      (sum, test) => sum + test.questions.length,
                      0,
                    )}
                  </strong>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-5">
          <LessonModeTabs
            tabs={[
              {
                href: "#materials",
                label: "Материал",
                meta: `${lesson.blocks.length}`,
              },
              {
                href: "#practice",
                label: "Практика",
                meta: `${lesson.assignments.length}`,
              },
              {
                href: "#tests",
                label: "Проверка",
                meta: `${lesson.tests.length}`,
              },
            ]}
          />
        </div>

        <section className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] scroll-mt-28 gap-4" id="materials">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Материал урока</h2>
              <p className="text-sm text-[var(--muted)]">
                Читайте по блокам и отмечайте готовность после изучения.
              </p>
            </div>
            <Chip variant="soft" color="accent">
              {lesson.blocks.length} блоков
            </Chip>
          </div>

          {lesson.blocks.map((block, index) => {
            const isCompleted = completedBlockIds.has(block.id);
            const isLastBlock = index === lesson.blocks.length - 1;

            return (
              <LessonBlockCard
                block={block}
                isCompleted={isCompleted}
                isLastBlock={isLastBlock}
                key={block.id}
                lessonId={lesson.id}
                lessonSlug={lesson.slug}
              />
            );
          })}
        </section>

        <section className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] scroll-mt-28 gap-4" id="practice">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Практика</h2>
              <p className="text-sm text-[var(--muted)]">
                Сохраните итоговый артефакт и отметьте задание выполненным.
              </p>
            </div>
            <a href="#tests">
              <Button variant="outline">
                К проверке
                <ChevronRight size={16} />
              </Button>
            </a>
          </div>

          {lesson.assignments.map((assignment) => {
            const assignmentProgress = assignment.progresses[0];
            const assignmentStatus =
              assignmentProgress?.status ?? AssignmentStatus.NOT_STARTED;

            return (
              <article className="cockpit-panel min-w-0 p-5" key={assignment.id}>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="soft" color="accent">
                    <ListChecks size={14} />
                    Практика
                  </Chip>
                  <Chip
                    variant="soft"
                    color={
                      assignmentStatus === AssignmentStatus.COMPLETED
                        ? "success"
                        : "default"
                    }
                  >
                    {assignmentStatusLabels[assignmentStatus]}
                  </Chip>
                </div>
                <h3 className="mt-3 text-xl font-bold">{assignment.title}</h3>
                {assignmentProgress?.submittedAt ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Последнее сохранение:{" "}
                    {assignmentProgress.submittedAt.toLocaleString("ru-RU")}
                  </p>
                ) : null}

                <div className="mt-4 grid min-w-0 gap-4 text-sm leading-7 text-[#383f3b] lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
                  <div className="min-w-0">
                    <div className="cockpit-muted-panel p-4">
                      <MarkdownContent content={assignment.instructionsMd} />
                    </div>
                    {assignment.expectedProcessMd ? (
                      <div className="cockpit-muted-panel mt-3 p-4">
                        <p className="mb-1 font-bold text-[var(--foreground)]">
                          Ожидаемый процесс
                        </p>
                        <MarkdownContent
                          compact
                          content={assignment.expectedProcessMd}
                        />
                      </div>
                    ) : null}
                    {assignment.checklistMd ? (
                      <div className="cockpit-muted-panel mt-3 p-4">
                        <p className="mb-1 font-bold text-[var(--foreground)]">
                          Чек-лист
                        </p>
                        <MarkdownContent compact content={assignment.checklistMd} />
                      </div>
                    ) : null}
                  </div>

                  <form
                    action={submitAssignmentAction.bind(
                      null,
                      lesson.id,
                      assignment.id,
                      lesson.slug,
                    )}
                    className="min-w-0 rounded-xl border border-[var(--line)] bg-white/86 p-4"
                  >
                    <label className="block text-sm font-semibold text-[var(--foreground)]">
                      Ответ ученика / итоговый артефакт
                      <textarea
                        className={textareaClass}
                        defaultValue={assignmentProgress?.submissionMd ?? ""}
                        name="submissionMd"
                        placeholder="Опишите, что получилось, какие шаги выполнены и что нужно проверить вручную."
                      />
                    </label>
                    <label className="mt-3 flex items-center gap-2 text-sm text-[var(--foreground)]">
                      <input
                        defaultChecked={
                          assignmentStatus !== AssignmentStatus.SUBMITTED
                        }
                        name="isCompleted"
                        type="checkbox"
                      />
                      Отметить практику выполненной
                    </label>
                    <Button className="mt-4" type="submit" variant="primary">
                      Сохранить практику
                    </Button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] scroll-mt-28 gap-4" id="tests">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Проверка</h2>
              <p className="text-sm text-[var(--muted)]">
                Результат сохранится на сервере и попадёт в историю прогресса.
              </p>
            </div>
            <Link href="/progress">
              <Button variant="outline">
                История прогресса
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>

          {lesson.tests.map((test) => {
            const latestAttempt = test.attempts[0];
            const maxScore = test.questions.reduce(
              (sum, question) => sum + question.points,
              0,
            );
            const hasPassed = test.attempts.some((attempt) => attempt.isPassed);

            return (
              <article className="cockpit-panel min-w-0 p-5" key={test.id}>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="soft" color="success">
                    <ClipboardCheck size={14} />
                    Проверка
                  </Chip>
                  <Chip variant="soft" color="default">
                    Проходной балл: {test.passingScore}
                  </Chip>
                  <Chip variant="soft" color={hasPassed ? "success" : "default"}>
                    {hasPassed ? "Зачёт получен" : "Зачёта пока нет"}
                  </Chip>
                  {latestAttempt ? (
                    <Chip
                      variant="soft"
                      color={latestAttempt.isPassed ? "success" : "danger"}
                    >
                      {latestAttempt.score}/{latestAttempt.maxScore}
                    </Chip>
                  ) : null}
                </div>
                <h3 className="mt-3 text-xl font-bold">{test.title}</h3>
                {test.description ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {test.description}
                  </p>
                ) : null}

                {latestAttempt ? (
                  <div className="cockpit-muted-panel mt-4 p-4 text-sm">
                    <p className="font-bold">
                      Последняя попытка:{" "}
                      {latestAttempt.createdAt.toLocaleString("ru-RU")}
                    </p>
                    <p className="mt-1 text-[var(--muted)]">
                      Результат сохранён на сервере. Новая попытка добавится в
                      историю.
                    </p>
                  </div>
                ) : null}

                <TestForm
                  hasPassed={hasPassed}
                  latestAttempt={
                    latestAttempt
                      ? {
                          score: latestAttempt.score,
                          maxScore: latestAttempt.maxScore,
                          isPassed: latestAttempt.isPassed,
                          createdAt: latestAttempt.createdAt.toISOString(),
                          answers: latestAttempt.answers ?? "[]",
                        }
                      : null
                  }
                  lessonId={lesson.id}
                  lessonSlug={lesson.slug}
                  test={{
                    id: test.id,
                    title: test.title,
                    passingScore: test.passingScore,
                    maxScore,
                    questions: test.questions.map((question) => ({
                      id: question.id,
                      type: question.type,
                      prompt: question.prompt,
                      explanation: question.explanation,
                      points: question.points,
                      correctText: question.correctText,
                      correctOrder: question.correctOrder,
                      options: question.options.map((option) => ({
                        id: option.id,
                        text: option.text,
                        isCorrect: option.isCorrect,
                      })),
                    })),
                  }}
                />
              </article>
            );
          })}

          <div className="cockpit-panel p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">После проверки</p>
                <h2 className="mt-1 text-xl font-bold">
                  {nextLesson
                    ? `Следующий урок: ${nextLesson.title}`
                    : "Маршрут завершён"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/progress">
                  <Button variant="outline">Открыть прогресс</Button>
                </Link>
                {nextLesson ? (
                  <Link href={`/lessons/${nextLesson.slug}`}>
                    <Button variant="primary">
                      Перейти дальше
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/">
                    <Button variant="primary">К маршруту</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </CockpitShell>
  );
}
