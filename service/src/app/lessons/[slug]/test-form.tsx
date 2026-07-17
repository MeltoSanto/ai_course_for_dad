"use client";

import {
  submitTestAction,
  type SubmitTestState,
} from "@/app/actions/learning";
import { Chip } from "@heroui/react/chip";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Flag,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildSortQuestionModel,
  normalizeSortSelection,
  shuffleBySeed,
  type SortQuestionModel,
} from "@/lib/sort-question";

type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "SORT_STEPS"
  | "FIND_PROMPT_ERROR"
  | "FILL_BLANK";

type StoredAnswer = NonNullable<SubmitTestState["attempt"]>["answers"][number];
type DraftAnswer = NonNullable<SubmitTestState["draftAnswers"]>[number];
type AnswerValue = Pick<StoredAnswer, "answer">;

type TestQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  explanation: string | null;
  incorrectExplanation: string | null;
  sourceBlock: {
    id: string;
    order: number;
    title: string;
  } | null;
  points: number;
  correctText: string | null;
  correctOrder: string | null;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string | null;
  }[];
};

type TestAttempt = {
  score: number;
  maxScore: number;
  isPassed: boolean;
  createdAt: string;
  answers: string | StoredAnswer[];
};

type TestFormProps = {
  hasPassed: boolean;
  latestAttempt: TestAttempt | null;
  lessonId: string;
  lessonSlug: string;
  test: {
    id: string;
    title: string;
    passingScore: number;
    maxScore: number;
    questions: TestQuestion[];
  };
};

const questionTypeLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Один правильный ответ",
  MULTIPLE_CHOICE: "Несколько правильных ответов",
  SORT_STEPS: "Сортировка шагов",
  FIND_PROMPT_ERROR: "Найти ошибку в промпте",
  FILL_BLANK: "Вставить правильное слово",
};

const promptErrorPlaceholder = "Проблема: …\nКак исправить: …";
const fillBlankPlaceholder = "Только пропущенное слово или короткая фраза";

function parseStoredAnswers(answers: TestAttempt["answers"] | undefined) {
  if (!answers) {
    return [];
  }

  if (Array.isArray(answers)) {
    return answers;
  }

  try {
    const parsed = JSON.parse(answers) as StoredAnswer[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storedAnswerText(answer: AnswerValue | undefined) {
  if (!answer) {
    return "";
  }

  return Array.isArray(answer.answer) ? answer.answer.join("\n") : answer.answer;
}

function storedAnswerValues(answer: AnswerValue | undefined) {
  if (!answer || !Array.isArray(answer.answer)) {
    return new Set<string>();
  }

  return new Set(answer.answer);
}

function testPercent(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100);
}

function formatScore(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAttemptDate(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}

function textAnswer(value: string | string[]) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value;
}

function canonicalCorrectText(value: string | string[]) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value.split("|")[0]?.trim() ?? value;
}

function choiceText(question: TestQuestion, optionIds: string | string[]) {
  const ids = new Set(Array.isArray(optionIds) ? optionIds : [optionIds]);
  const values = question.options
    .filter((option) => ids.has(option.id))
    .map((option) => option.text);

  return values.length > 0 ? values.join("; ") : "Ответ не найден";
}

function sortAnswerText(value: string | string[], model: SortQuestionModel) {
  const keys = normalizeSortSelection(value, model);

  return keys
    .map((key, index) => {
      const variant = model.variants.find((item) => item.key === key);
      return `${index + 1}. ${key}${variant ? ` — ${variant.text}` : ""}`;
    })
    .join("\n");
}

function answerText({
  answer,
  question,
  sortModel,
  useCorrectAnswer = false,
}: {
  answer: StoredAnswer;
  question: TestQuestion;
  sortModel: SortQuestionModel | null;
  useCorrectAnswer?: boolean;
}) {
  const value = useCorrectAnswer ? answer.correctAnswer : answer.answer;

  if (
    question.type === "SINGLE_CHOICE" ||
    question.type === "MULTIPLE_CHOICE"
  ) {
    return choiceText(question, value);
  }

  if (question.type === "SORT_STEPS" && sortModel) {
    return sortAnswerText(value, sortModel);
  }

  return useCorrectAnswer
    ? canonicalCorrectText(value)
    : textAnswer(value);
}

function QuestionReview({
  answer,
  lessonSlug,
  question,
  sortModel,
}: {
  answer: StoredAnswer;
  lessonSlug: string;
  question: TestQuestion;
  sortModel: SortQuestionModel | null;
}) {
  const selectedIds = new Set(
    Array.isArray(answer.answer) ? answer.answer : [answer.answer],
  );
  const correctIds = new Set(
    Array.isArray(answer.correctAnswer)
      ? answer.correctAnswer
      : [answer.correctAnswer],
  );
  const correctSelectedCount = [...selectedIds].filter((id) =>
    correctIds.has(id),
  ).length;
  const incorrectSelectedCount = [...selectedIds].filter(
    (id) => !correctIds.has(id),
  ).length;
  const explainedOptions = question.options.filter(
    (option) =>
      option.feedback &&
      (correctIds.has(option.id) ||
        (selectedIds.has(option.id) && !correctIds.has(option.id))),
  );

  return (
    <details
      className={`test-question-review ${answer.isCorrect ? "is-correct" : "is-wrong"}`}
      name="test-question-review"
    >
      <summary>
        <span>
          {answer.isCorrect ? "Посмотреть пояснение" : "Разбор ошибки"}
        </span>
        <span className="test-review-score">
          {formatScore(answer.pointsAwarded)} из {formatScore(answer.maxPoints)}
        </span>
      </summary>

      <div className="test-review-content">
        <div className="test-review-grid">
          <div className={`test-review-answer ${answer.isCorrect ? "is-correct" : "is-wrong"}`}>
            <p className="test-review-label">Ваш ответ</p>
            <p className="whitespace-pre-line">
              {answerText({ answer, question, sortModel })}
            </p>
          </div>
          <div className="test-review-answer is-correct">
            <p className="test-review-label">Правильный ответ</p>
            <p className="whitespace-pre-line">
              {answerText({
                answer,
                question,
                sortModel,
                useCorrectAnswer: true,
              })}
            </p>
          </div>
        </div>

        {question.type === "MULTIPLE_CHOICE" && !answer.isCorrect ? (
          <div className="test-partial-score-note">
            <p className="font-bold">
              Вы выбрали {correctSelectedCount} из {correctIds.size} правильных
              вариантов — {formatScore(answer.pointsAwarded)} из{" "}
              {formatScore(answer.maxPoints)} баллов.
            </p>
            {incorrectSelectedCount > 0 ? (
              <p className="mt-1">
                Ошибочно выбрано вариантов: {incorrectSelectedCount}. Они
                уменьшили результат.
              </p>
            ) : null}
          </div>
        ) : null}

        {!answer.isCorrect && question.incorrectExplanation ? (
          <div className="test-review-explanation is-wrong">
            <h4>Почему ваш ответ не подходит</h4>
            <p>{question.incorrectExplanation}</p>
          </div>
        ) : null}

        {explainedOptions.length > 0 ? (
          <div className="test-review-options">
            {explainedOptions.map((option) => {
              const isCorrectOption = correctIds.has(option.id);
              const wasSelected = selectedIds.has(option.id);
              const label = isCorrectOption
                ? wasSelected
                  ? "Правильно выбранный вариант"
                  : "Пропущенный правильный вариант"
                : "Ошибочно выбранный вариант";

              return (
                <div
                  className={isCorrectOption ? "is-correct" : "is-wrong"}
                  key={option.id}
                >
                  <p className="test-review-label">{label}</p>
                  <p className="font-bold">{option.text}</p>
                  <p className="mt-1">{option.feedback}</p>
                </div>
              );
            })}
          </div>
        ) : null}

        {question.explanation ? (
          <div className="test-review-explanation is-correct">
            <h4>Почему правильный ответ подходит</h4>
            <p>{question.explanation}</p>
          </div>
        ) : null}

        {question.sourceBlock ? (
          <div className="test-review-source">
            <div>
              <p className="test-review-label">Где это объясняется в уроке</p>
              <p className="font-bold">
                Блок {question.sourceBlock.order}. {question.sourceBlock.title}
              </p>
            </div>
            <Link
              className="test-secondary-button"
              href={`/lessons/${lessonSlug}#block-${question.sourceBlock.id}`}
            >
              <BookOpen aria-hidden="true" size={15} />
              Открыть материал
            </Link>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function SortStepsFields({
  model,
  questionId,
  answerValue,
}: {
  model: SortQuestionModel;
  questionId: string;
  answerValue: AnswerValue | undefined;
}) {
  const [selection, setSelection] = useState(() => {
    const storedSelection = normalizeSortSelection(
      answerValue?.answer ?? "",
      model,
    );

    return model.variants.map((_, index) => storedSelection[index] ?? "");
  });

  function updatePosition(index: number, value: string) {
    setSelection((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  return (
    <div className="mt-3">
      <div className="test-sort-variants">
        <p className="text-sm font-bold text-[var(--foreground)]">
          Варианты ответа
        </p>
        <div className="mt-2 grid gap-2">
          {model.variants.map((variant) => (
            <div className="test-sort-variant" key={variant.key}>
              <span className="test-sort-letter" aria-hidden="true">
                {variant.key}
              </span>
              <span>{variant.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold text-[var(--foreground)]">
          Укажите правильный порядок
        </p>
        <p className="mt-1 text-xs font-medium text-[var(--muted)]">
          Для каждой позиции выберите одну букву. Каждую букву можно использовать
          только один раз.
        </p>
        <div className="test-sort-slots mt-3">
          {model.variants.map((_, index) => (
            <label className="test-sort-slot" key={index}>
              <span className="test-sort-position">{index + 1}</span>
              <span className="sr-only">Позиция {index + 1}</span>
              <select
                aria-label={`Буква для позиции ${index + 1}`}
                className="test-sort-select"
                name={`question_${questionId}`}
                onChange={(event) => updatePosition(index, event.target.value)}
                value={selection[index]}
              >
                <option value="">Выберите букву</option>
                {model.variants.map((variant) => (
                  <option
                    disabled={selection.some(
                      (selectedKey, selectedIndex) =>
                        selectedIndex !== index && selectedKey === variant.key,
                    )}
                    key={variant.key}
                    value={variant.key}
                  >
                    {variant.key}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button className="test-submit-button" disabled={isPending} type="submit">
      <Flag aria-hidden="true" size={16} />
      {isPending ? "Проверяю..." : "Завершить тест"}
    </button>
  );
}

export function TestForm({
  hasPassed,
  latestAttempt,
  lessonId,
  lessonSlug,
  test,
}: TestFormProps) {
  const [formKey, setFormKey] = useState(0);
  const [validationRevision, setValidationRevision] = useState(0);
  const [attemptSeed, setAttemptSeed] = useState(`${test.id}:initial`);
  const [isReviewHidden, setIsReviewHidden] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const handleSubmit = useCallback(
    async (currentState: SubmitTestState, formData: FormData) => {
      const nextState = await submitTestAction(
        lessonId,
        test.id,
        lessonSlug,
        currentState,
        formData,
      );

      if (nextState.status === "success") {
        setIsReviewHidden(false);
      } else if (nextState.status === "error") {
        // React resets an action form after the action resolves. Remount on the
        // next frame, once that reset is complete, using the server draft.
        window.requestAnimationFrame(() => {
          setValidationRevision((current) => current + 1);
        });
      }

      return nextState;
    },
    [lessonId, lessonSlug, test.id],
  );
  const [state, formAction, isPending] = useActionState(handleSubmit, {
    status: "idle",
  } satisfies SubmitTestState);
  const activeAttempt = isReviewHidden ? null : state.attempt ?? latestAttempt;
  const activeAnswers = useMemo(
    () => parseStoredAnswers(activeAttempt?.answers),
    [activeAttempt],
  );
  const answerMap = useMemo(
    () => new Map(activeAnswers.map((answer) => [answer.questionId, answer])),
    [activeAnswers],
  );
  const draftAnswerMap = useMemo(
    () =>
      new Map<string, DraftAnswer>(
        state.status === "error"
          ? (state.draftAnswers ?? []).map((answer) => [
              answer.questionId,
              answer,
            ])
          : [],
      ),
    [state.draftAnswers, state.status],
  );
  const missingQuestionIds = new Set(state.missingQuestionIds ?? []);
  const effectiveHasPassed = hasPassed || state.attempt?.isPassed === true;
  const wrongAnswers = activeAnswers.filter((answer) => !answer.isCorrect);
  const firstWrongQuestionId = wrongAnswers[0]?.questionId;

  useEffect(() => {
    if (state.status === "idle") {
      return;
    }

    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [state.status]);

  function resetForm() {
    setIsReviewHidden(true);
    setAttemptSeed(crypto.randomUUID());
    setFormKey((current) => current + 1);
    window.requestAnimationFrame(() => {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <div
        className={`test-result-banner ${
          state.status === "error"
            ? "is-error"
            : activeAttempt?.isPassed
              ? "is-success"
              : activeAttempt
                ? "is-warning"
                : ""
        }`}
        ref={resultRef}
        role={state.status === "idle" ? undefined : "status"}
        tabIndex={-1}
      >
        {state.status === "error" ? (
          <>
            <AlertCircle aria-hidden="true" size={22} />
            <div>
              <p className="font-bold">{state.message}</p>
              <p className="mt-1 text-sm">
                Пропущено вопросов: {state.missingQuestionIds?.length ?? 0}.
                Попытка не сохранена.
              </p>
            </div>
          </>
        ) : activeAttempt ? (
          <>
            {activeAttempt.isPassed ? (
              <CheckCircle2 aria-hidden="true" size={22} />
            ) : (
              <XCircle aria-hidden="true" size={22} />
            )}
            <div>
              <p className="font-bold">
                {activeAttempt.isPassed
                  ? "Тест пройден"
                  : effectiveHasPassed
                    ? "Последняя попытка не зачтена, но зачёт уже получен"
                    : "Пока не пройдено"}
              </p>
              <p className="mt-1 text-sm">
                {formatScore(activeAttempt.score)}/{formatScore(activeAttempt.maxScore)} баллов,{" "}
                {testPercent(activeAttempt.score, activeAttempt.maxScore)}%.
                Нужно: {test.passingScore}. Последняя попытка:{" "}
                {formatAttemptDate(activeAttempt.createdAt)}.
              </p>
              {!activeAttempt.isPassed && firstWrongQuestionId ? (
                <a
                  className="mt-2 inline-flex font-bold underline underline-offset-4"
                  href={`#question-${firstWrongQuestionId}`}
                >
                  Разобрать ошибки: {wrongAnswers.length}
                </a>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <AlertCircle aria-hidden="true" size={22} />
            <div>
              <p className="font-bold">Перед завершением ответьте на все вопросы</p>
              <p className="mt-1 text-sm">
                В тесте {test.questions.length} вопросов. Нужно набрать{" "}
                {test.passingScore} из {test.maxScore} баллов. Можно проходить
                повторно.
              </p>
            </div>
          </>
        )}
      </div>

      {state.status === "error" ? (
        <div className="test-error-summary">
          <p className="font-bold">Что нужно сделать</p>
          <p className="mt-1 text-sm">
            Заполните подсвеченные вопросы и снова нажмите `Завершить тест`.
          </p>
        </div>
      ) : null}

      {activeAttempt ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="test-secondary-button" type="button" onClick={resetForm}>
            <RotateCcw aria-hidden="true" size={15} />
            Пройти тест заново
          </button>
          <Link className="test-secondary-button" href="/progress">
            Открыть прогресс
          </Link>
        </div>
      ) : null}

      <form
        action={formAction}
        className="mt-4 flex flex-col gap-4"
        key={`${formKey}-${validationRevision}`}
      >
        {test.questions.map((question, index) => {
          const storedAnswer = answerMap.get(question.id);
          const draftAnswer = draftAnswerMap.get(question.id);
          const answerValue = storedAnswer ?? draftAnswer;
          const selectedValues = storedAnswerValues(answerValue);
          const isMissing = missingQuestionIds.has(question.id);
          const isAnswered = Boolean(storedAnswer);
          const questionShuffleSeed =
            storedAnswer?.shuffleSeed ??
            draftAnswer?.shuffleSeed ??
            `${attemptSeed}:${question.id}`;
          const displayedOptions = questionShuffleSeed
            ? shuffleBySeed(question.options, questionShuffleSeed)
            : question.options;
          const sortModel =
            question.type === "SORT_STEPS"
              ? buildSortQuestionModel({
                  correctOrder: question.correctOrder,
                  prompt: question.prompt,
                  shuffleSeed: questionShuffleSeed,
                })
              : null;

          return (
            <fieldset
              aria-describedby={`question-${question.id}-meta ${
                isMissing ? `question-${question.id}-error` : ""
              }`}
              className={`test-question-card ${isMissing ? "is-missing" : ""}`}
              disabled={isAnswered}
              id={`question-${question.id}`}
              key={question.id}
            >
              <legend className="test-question-legend">
                {index + 1}. {sortModel?.instruction ?? question.prompt}
              </legend>

              <div
                className="mt-3 flex flex-wrap gap-2"
                id={`question-${question.id}-meta`}
              >
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
                    {storedAnswer.isCorrect ? "Верно" : "Пока ошибка"} ·{" "}
                    {formatScore(storedAnswer.pointsAwarded)}/{formatScore(storedAnswer.maxPoints)}
                  </Chip>
                ) : null}
              </div>

              {questionShuffleSeed &&
              (question.type === "SINGLE_CHOICE" ||
                question.type === "MULTIPLE_CHOICE" ||
                question.type === "SORT_STEPS") ? (
                <input
                  name={`question_${question.id}_shuffle_seed`}
                  type="hidden"
                  value={questionShuffleSeed}
                />
              ) : null}

              {question.type === "SINGLE_CHOICE" ? (
                <div className="mt-3 flex flex-col gap-2">
                  {displayedOptions.map((option) => (
                    <label className="test-option" key={option.id}>
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

              {question.type === "MULTIPLE_CHOICE" ? (
                <div className="mt-3 flex flex-col gap-2">
                  {displayedOptions.map((option) => (
                    <label className="test-option" key={option.id}>
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

              {question.type === "SORT_STEPS" ? (
                <SortStepsFields
                  key={`${question.id}-${storedAnswer ? "answered" : "editing"}-${validationRevision}`}
                  model={sortModel!}
                  questionId={question.id}
                  answerValue={answerValue}
                />
              ) : null}

              {question.type === "FIND_PROMPT_ERROR" ? (
                <label className="mt-3 block text-sm font-semibold">
                  Что именно не так
                  <span className="mt-1 block text-xs font-medium text-[var(--muted)]">
                    Назовите конкретную проблему. При желании кратко укажите,
                    как изменить инструкцию.
                  </span>
                  <textarea
                    className="test-textarea"
                    defaultValue={storedAnswerText(answerValue)}
                    name={`question_${question.id}`}
                    placeholder={promptErrorPlaceholder}
                  />
                </label>
              ) : null}

              {question.type === "FILL_BLANK" ? (
                <label className="mt-3 block text-sm font-semibold">
                  Ответ
                  <input
                    className="test-input"
                    defaultValue={storedAnswerText(answerValue)}
                    name={`question_${question.id}`}
                    placeholder={fillBlankPlaceholder}
                  />
                </label>
              ) : null}

              {isMissing ? (
                <p className="test-question-error" id={`question-${question.id}-error`}>
                  Ответьте на этот вопрос перед завершением теста.
                </p>
              ) : null}

              {isAnswered && storedAnswer ? (
                <QuestionReview
                  answer={storedAnswer}
                  lessonSlug={lessonSlug}
                  question={question}
                  sortModel={sortModel}
                />
              ) : null}
            </fieldset>
          );
        })}

        {activeAttempt ? (
          <div className="test-retry-panel">
            <div>
              <p className="font-bold">Хотите пройти тест ещё раз?</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Новая попытка будет пустой. Этот результат останется в истории.
              </p>
            </div>
            <button
              className="test-submit-button"
              onClick={resetForm}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={16} />
              Пройти тест заново
            </button>
          </div>
        ) : (
          <SubmitButton isPending={isPending} />
        )}
      </form>
    </>
  );
}
