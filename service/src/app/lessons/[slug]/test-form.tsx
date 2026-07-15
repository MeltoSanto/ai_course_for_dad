"use client";

import {
  submitTestAction,
  type SubmitTestState,
} from "@/app/actions/learning";
import { Chip } from "@heroui/react";
import {
  AlertCircle,
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

type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "SORT_STEPS"
  | "FIND_PROMPT_ERROR"
  | "FILL_BLANK";

type StoredAnswer = NonNullable<SubmitTestState["attempt"]>["answers"][number];

type TestQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  explanation: string | null;
  points: number;
  correctText: string | null;
  correctOrder: string | null;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
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

function testPercent(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100);
}

function formatAttemptDate(value: string) {
  return new Date(value).toLocaleString("ru-RU");
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
  const missingQuestionIds = new Set(state.missingQuestionIds ?? []);
  const effectiveHasPassed = hasPassed || state.attempt?.isPassed === true;

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
    setFormKey((current) => current + 1);
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
                {activeAttempt.score}/{activeAttempt.maxScore} баллов,{" "}
                {testPercent(activeAttempt.score, activeAttempt.maxScore)}%.
                Нужно: {test.passingScore}. Последняя попытка:{" "}
                {formatAttemptDate(activeAttempt.createdAt)}.
              </p>
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
            Попробовать ещё раз
          </button>
          <Link className="test-secondary-button" href="/progress">
            Открыть прогресс
          </Link>
        </div>
      ) : null}

      <form action={formAction} className="mt-4 flex flex-col gap-4" key={formKey}>
        {test.questions.map((question, index) => {
          const storedAnswer = answerMap.get(question.id);
          const selectedValues = storedAnswerValues(storedAnswer);
          const isMissing = missingQuestionIds.has(question.id);
          const isAnswered = Boolean(storedAnswer);

          return (
            <fieldset
              aria-describedby={`question-${question.id}-meta ${
                isMissing ? `question-${question.id}-error` : ""
              }`}
              className={`test-question-card ${isMissing ? "is-missing" : ""}`}
              id={`question-${question.id}`}
              key={question.id}
            >
              <legend className="test-question-legend">
                {index + 1}. {question.prompt}
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
                    {storedAnswer.pointsAwarded}/{storedAnswer.maxPoints}
                  </Chip>
                ) : null}
              </div>

              {question.type === "SINGLE_CHOICE" ? (
                <div className="mt-3 flex flex-col gap-2">
                  {question.options.map((option) => (
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
                  {question.options.map((option) => (
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
                <label className="mt-3 block text-sm font-semibold">
                  Ответ по строкам в правильном порядке
                  <span className="mt-1 block text-xs font-medium text-[var(--muted)]">
                    Каждый шаг пишите с новой строки. Номера можно ставить или не
                    ставить.
                  </span>
                  <textarea
                    className="test-textarea"
                    defaultValue={storedAnswerText(storedAnswer)}
                    name={`question_${question.id}`}
                  />
                </label>
              ) : null}

              {question.type === "FIND_PROMPT_ERROR" ? (
                <label className="mt-3 block text-sm font-semibold">
                  Найденная ошибка и исправление
                  <textarea
                    className="test-textarea"
                    defaultValue={storedAnswerText(storedAnswer)}
                    name={`question_${question.id}`}
                  />
                </label>
              ) : null}

              {question.type === "FILL_BLANK" ? (
                <label className="mt-3 block text-sm font-semibold">
                  Ответ
                  <input
                    className="test-input"
                    defaultValue={storedAnswerText(storedAnswer)}
                    name={`question_${question.id}`}
                  />
                </label>
              ) : null}

              {isMissing ? (
                <p className="test-question-error" id={`question-${question.id}-error`}>
                  Ответьте на этот вопрос перед завершением теста.
                </p>
              ) : null}

              {isAnswered && !storedAnswer?.isCorrect ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Пока не зачтено. Можно исправить ответ и попробовать ещё раз.
                </p>
              ) : null}

              {isAnswered && question.explanation ? (
                <p className="mt-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
                  {question.explanation}
                </p>
              ) : null}
            </fieldset>
          );
        })}

        <SubmitButton isPending={isPending} />
      </form>
    </>
  );
}
