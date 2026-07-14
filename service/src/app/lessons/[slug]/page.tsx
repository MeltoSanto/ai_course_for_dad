import { Button, Chip } from "@heroui/react";
import {
  AssignmentStatus,
  LessonBlockType,
  ProgressStatus,
  QuestionType,
} from "@prisma/client";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Flag,
  ListChecks,
  Save,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  submitAssignmentAction,
  submitTestAction,
} from "@/app/actions/learning";
import {
  completeBlockAction,
  saveLessonPlaceAction,
} from "@/app/actions/progress";
import { LessonModeTabs } from "@/app/lessons/[slug]/lesson-mode-tabs";
import { CopyPromptButton } from "@/app/lessons/[slug]/copy-prompt-button";
import { CockpitShell } from "@/components/cockpit-shell";
import { TimelineRail, type TimelineStep } from "@/components/cockpit-ui";
import {
  getLessonWorkspace,
  kindLabels,
  progressLabels,
  statusLabels,
} from "@/lib/course";
import { requireUser } from "@/lib/session";

const blockTypeLabels: Record<LessonBlockType, string> = {
  OBJECTIVE: "Цель",
  EXPLANATION: "Объяснение",
  DEMONSTRATION: "Демонстрация",
  PRACTICE: "Практика",
  PROMPTS: "Промпты",
  CHECK: "Проверка",
  ARTIFACT: "Артефакт",
  MARKDOWN: "Материал",
  CALLOUT: "Акцент",
};

const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  NOT_STARTED: "Не начато",
  IN_PROGRESS: "В процессе",
  SUBMITTED: "Сохранено",
  COMPLETED: "Выполнено",
};

const questionTypeLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Один правильный ответ",
  MULTIPLE_CHOICE: "Несколько правильных ответов",
  SORT_STEPS: "Сортировка шагов",
  FIND_PROMPT_ERROR: "Найти ошибку в промпте",
  FILL_BLANK: "Вставить правильное слово",
};

const inputClass =
  "mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--signal-green)] focus:ring-2 focus:ring-emerald-100";
const textareaClass = `${inputClass} min-h-28 resize-y leading-6`;

type StoredAnswer = {
  questionId: string;
  answer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
};

type LessonPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function parseStoredAnswers(answers: string | null | undefined) {
  if (!answers) {
    return new Map<string, StoredAnswer>();
  }

  try {
    const parsed = JSON.parse(answers) as StoredAnswer[];
    return new Map(parsed.map((answer) => [answer.questionId, answer]));
  } catch {
    return new Map<string, StoredAnswer>();
  }
}

function storedAnswerText(answer: StoredAnswer | undefined) {
  if (!answer) {
    return "";
  }

  return Array.isArray(answer.answer) ? answer.answer.join("\n") : answer.answer;
}

function storedAnswerValues(answer: StoredAnswer | undefined) {
  if (!answer || !Array.isArray(answer.answer)) {
    return new Set<string>();
  }

  return new Set(answer.answer);
}

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
  const firstIncompleteBlock =
    lesson.blocks.find((block) => !completedBlockIds.has(block.id)) ??
    lesson.blocks[0];
  const continueBlock = progress?.lastBlock ?? firstIncompleteBlock;
  const continueHref = continueBlock
    ? `/lessons/${lesson.slug}#block-${continueBlock.id}`
    : `/lessons/${lesson.slug}`;
  const blockSteps: TimelineStep[] = lesson.blocks.slice(0, 8).map((block) => ({
    href: `#block-${block.id}`,
    id: block.id,
    label: block.title,
    meta: blockTypeLabels[block.type],
    state:
      block.id === continueBlock?.id
        ? "active"
        : completedBlockIds.has(block.id)
          ? "done"
          : "todo",
  }));

  return (
    <CockpitShell active="lessons" continueHref={continueHref} user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="cockpit-panel min-w-0 p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
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

              <div className="min-w-56 rounded-xl border border-[var(--line)] bg-white/82 p-4">
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
              ) : null}
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

        <section className="mt-5 grid scroll-mt-28 gap-4" id="materials">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Материал урока</h2>
              <p className="text-sm text-[var(--muted)]">
                Читайте по блокам, сохраняйте место и отмечайте готовность.
              </p>
            </div>
            <Chip variant="soft" color="accent">
              {lesson.blocks.length} блоков
            </Chip>
          </div>

          {lesson.blocks.map((block, index) => {
            const isCompleted = completedBlockIds.has(block.id);
            const previousBlock = lesson.blocks[index - 1];
            const nextBlock = lesson.blocks[index + 1];

            return (
              <article
                className="cockpit-panel scroll-mt-28 p-5"
                id={`block-${block.id}`}
                key={block.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Chip variant="soft" color="accent">
                        {blockTypeLabels[block.type]}
                      </Chip>
                      {isCompleted ? (
                        <Chip variant="soft" color="success">
                          Готово
                        </Chip>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-xl font-bold">
                      {block.order}. {block.title}
                    </h3>
                  </div>
                  {block.type === LessonBlockType.PROMPTS ? (
                    <CopyPromptButton content={block.contentMd} />
                  ) : null}
                </div>

                <div
                  className={`mt-4 whitespace-pre-line p-4 text-sm leading-7 text-[#383f3b] ${
                    block.type === LessonBlockType.PROMPTS
                      ? "prompt-console font-mono"
                      : "cockpit-muted-panel"
                  }`}
                >
                  {block.contentMd}
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {previousBlock ? (
                      <a href={`#block-${previousBlock.id}`}>
                        <Button variant="outline">
                          <ChevronLeft size={16} />
                          Предыдущий блок
                        </Button>
                      </a>
                    ) : previousLesson ? (
                      <Link href={`/lessons/${previousLesson.slug}`}>
                        <Button variant="outline">
                          <ChevronLeft size={16} />
                          Предыдущий урок
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form
                      action={saveLessonPlaceAction.bind(
                        null,
                        lesson.id,
                        block.id,
                        lesson.slug,
                      )}
                    >
                      <Button type="submit" variant="outline">
                        <Save size={16} />
                        Сохранить место
                      </Button>
                    </form>
                    <form
                      action={completeBlockAction.bind(
                        null,
                        lesson.id,
                        block.id,
                        lesson.slug,
                      )}
                    >
                      <Button type="submit" variant="primary">
                        <Check size={16} />
                        Готово
                      </Button>
                    </form>
                    {nextBlock ? (
                      <a href={`#block-${nextBlock.id}`}>
                        <Button variant="secondary">
                          Следующий блок
                          <ChevronRight size={16} />
                        </Button>
                      </a>
                    ) : (
                      <a href="#practice">
                        <Button variant="secondary">
                          К практике
                          <ChevronRight size={16} />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid scroll-mt-28 gap-4" id="practice">
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
              <article className="cockpit-panel p-5" key={assignment.id}>
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

                <div className="mt-4 grid gap-4 text-sm leading-7 text-[#383f3b] lg:grid-cols-[1fr_420px]">
                  <div>
                    <div className="cockpit-muted-panel p-4">
                      {assignment.instructionsMd}
                    </div>
                    {assignment.expectedProcessMd ? (
                      <div className="cockpit-muted-panel mt-3 p-4">
                        <p className="mb-1 font-bold text-[var(--foreground)]">
                          Ожидаемый процесс
                        </p>
                        {assignment.expectedProcessMd}
                      </div>
                    ) : null}
                    {assignment.checklistMd ? (
                      <div className="cockpit-muted-panel mt-3 p-4">
                        <p className="mb-1 font-bold text-[var(--foreground)]">
                          Чек-лист
                        </p>
                        {assignment.checklistMd}
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
                    className="rounded-xl border border-[var(--line)] bg-white/86 p-4"
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

        <section className="mt-6 grid scroll-mt-28 gap-4" id="tests">
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
            const answerMap = parseStoredAnswers(latestAttempt?.answers);

            return (
              <article className="cockpit-panel p-5" key={test.id}>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="soft" color="success">
                    <ClipboardCheck size={14} />
                    Проверка
                  </Chip>
                  <Chip variant="soft" color="default">
                    Проходной балл: {test.passingScore}
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

                <form
                  action={submitTestAction.bind(
                    null,
                    lesson.id,
                    test.id,
                    lesson.slug,
                  )}
                  className="mt-4 flex flex-col gap-4"
                >
                  {test.questions.map((question) => {
                    const storedAnswer = answerMap.get(question.id);
                    const selectedValues = storedAnswerValues(storedAnswer);

                    return (
                      <fieldset
                        className="rounded-xl border border-[var(--line)] bg-white/86 p-4"
                        key={question.id}
                      >
                        <div className="flex flex-wrap gap-2">
                          <Chip variant="soft" color="accent">
                            {questionTypeLabels[question.type]}
                          </Chip>
                          <Chip variant="soft" color="default">
                            {question.points} балл
                          </Chip>
                          {storedAnswer ? (
                            <Chip
                              variant="soft"
                              color={storedAnswer.isCorrect ? "success" : "danger"}
                            >
                              {storedAnswer.pointsAwarded}/{storedAnswer.maxPoints}
                            </Chip>
                          ) : null}
                        </div>
                        <legend className="mt-3 font-bold">
                          {question.prompt}
                        </legend>

                        {question.type === QuestionType.SINGLE_CHOICE ? (
                          <div className="mt-3 flex flex-col gap-2">
                            {question.options.map((option) => (
                              <label
                                className="flex items-start gap-2 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm"
                                key={option.id}
                              >
                                <input
                                  defaultChecked={selectedValues.has(option.id)}
                                  name={`question_${question.id}`}
                                  type="radio"
                                  value={option.id}
                                />
                                <span>{option.text}</span>
                              </label>
                            ))}
                          </div>
                        ) : null}

                        {question.type === QuestionType.MULTIPLE_CHOICE ? (
                          <div className="mt-3 flex flex-col gap-2">
                            {question.options.map((option) => (
                              <label
                                className="flex items-start gap-2 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm"
                                key={option.id}
                              >
                                <input
                                  defaultChecked={selectedValues.has(option.id)}
                                  name={`question_${question.id}`}
                                  type="checkbox"
                                  value={option.id}
                                />
                                <span>{option.text}</span>
                              </label>
                            ))}
                          </div>
                        ) : null}

                        {question.type === QuestionType.SORT_STEPS ? (
                          <label className="mt-3 block text-sm font-semibold">
                            Ответ по строкам в правильном порядке
                            <textarea
                              className={textareaClass}
                              defaultValue={storedAnswerText(storedAnswer)}
                              name={`question_${question.id}`}
                            />
                          </label>
                        ) : null}

                        {question.type === QuestionType.FIND_PROMPT_ERROR ? (
                          <label className="mt-3 block text-sm font-semibold">
                            Найденная ошибка и исправление
                            <textarea
                              className={textareaClass}
                              defaultValue={storedAnswerText(storedAnswer)}
                              name={`question_${question.id}`}
                            />
                          </label>
                        ) : null}

                        {question.type === QuestionType.FILL_BLANK ? (
                          <label className="mt-3 block text-sm font-semibold">
                            Ответ
                            <input
                              className={inputClass}
                              defaultValue={storedAnswerText(storedAnswer)}
                              name={`question_${question.id}`}
                            />
                          </label>
                        ) : null}

                        {storedAnswer && !storedAnswer.isCorrect ? (
                          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            Ответ сохранён, но не совпал с эталоном. Проверьте
                            формулировку и попробуйте ещё раз.
                          </p>
                        ) : null}
                      </fieldset>
                    );
                  })}

                  <Button type="submit" variant="primary">
                    <Flag size={16} />
                    Завершить тест
                  </Button>
                </form>
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
