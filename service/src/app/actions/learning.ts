"use server";

import {
  AssignmentStatus,
  PublicationStatus,
  QuestionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  awardPracticeAchievements,
  awardTestAchievements,
} from "@/lib/achievements";
import { refreshLessonProgress } from "@/lib/progress";
import { requireUser } from "@/lib/session";

type StoredAnswer = {
  questionId: string;
  type: QuestionType;
  answer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
};

export type SubmitTestState = {
  status: "idle" | "error" | "success";
  message?: string;
  missingQuestionIds?: string[];
  attempt?: {
    score: number;
    maxScore: number;
    passingScore: number;
    isPassed: boolean;
    createdAt: string;
    answers: StoredAnswer[];
  };
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

function sorted(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function sameSet(left: string[], right: string[]) {
  const first = sorted(left);
  const second = sorted(right);

  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

function normalizeStep(value: string) {
  return normalize(value.replace(/^\s*\d+[.)]\s+/, ""));
}

function parseStepOrder(value: string | null | undefined) {
  const source = String(value ?? "").trim();

  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    }
  } catch {
    // Plain newline text is also accepted.
  }

  return source
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\s*\d+[.)]\s+/, "").trim())
    .filter(Boolean);
}

function sameStepOrder(answer: string, correctOrder: string | null) {
  const answerSteps = parseStepOrder(answer);
  const correctSteps = parseStepOrder(correctOrder);

  if (
    answerSteps.length === 0 ||
    correctSteps.length === 0 ||
    answerSteps.length !== correctSteps.length
  ) {
    return false;
  }

  return answerSteps.every(
    (step, index) => normalizeStep(step) === normalizeStep(correctSteps[index]),
  );
}

function textMatches({
  answer,
  correctText,
  type,
}: {
  answer: string;
  correctText: string | null;
  type: QuestionType;
}) {
  const normalizedAnswer = normalize(answer);
  const accepted = String(correctText ?? "")
    .split("|")
    .map(normalize)
    .filter(Boolean);

  if (!normalizedAnswer || accepted.length === 0) {
    return false;
  }

  return accepted.some((expected) =>
    type === QuestionType.FIND_PROMPT_ERROR
      ? normalizedAnswer.includes(expected)
      : normalizedAnswer === expected,
  );
}

export async function submitAssignmentAction(
  lessonId: string,
  assignmentId: string,
  slug: string,
  formData: FormData,
) {
  const user = await requireUser();
  const assignment = await db.assignment.findFirst({
    where: {
      id: assignmentId,
      lessonId,
      status: {
        not: PublicationStatus.ARCHIVED,
      },
    },
    select: {
      id: true,
    },
  });

  if (!assignment) {
    return;
  }

  const submissionMd = text(formData, "submissionMd");
  const isCompleted = checkbox(formData, "isCompleted");
  const status = isCompleted
    ? AssignmentStatus.COMPLETED
    : AssignmentStatus.SUBMITTED;

  await db.userAssignmentProgress.upsert({
    where: {
      userId_assignmentId: {
        userId: user.id,
        assignmentId,
      },
    },
    update: {
      submissionMd,
      submittedAt: new Date(),
      status,
      completedAt: isCompleted ? new Date() : null,
    },
    create: {
      userId: user.id,
      assignmentId,
      submissionMd,
      submittedAt: new Date(),
      status,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  if (isCompleted) {
    await awardPracticeAchievements(user.id, lessonId);
  }

  await refreshLessonProgress({
    userId: user.id,
    lessonId,
  });

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/tests");
  revalidatePath("/achievements");
  revalidatePath(`/lessons/${slug}`);
}

export async function submitTestAction(
  lessonId: string,
  testId: string,
  slug: string,
  _state: SubmitTestState,
  formData: FormData,
): Promise<SubmitTestState> {
  const user = await requireUser();
  const test = await db.lessonTest.findFirst({
    where: {
      id: testId,
      lessonId,
      status: {
        not: PublicationStatus.ARCHIVED,
      },
    },
    include: {
      questions: {
        orderBy: {
          order: "asc",
        },
        include: {
          options: {
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
  });

  if (!test) {
    return {
      status: "error",
      message: "Тест не найден или больше недоступен.",
    };
  }

  let score = 0;
  const missingQuestionIds: string[] = [];
  const maxScore = test.questions.reduce(
    (sum, question) => sum + question.points,
    0,
  );

  const answers: StoredAnswer[] = test.questions.map((question) => {
    let answer: string | string[] = "";
    let correctAnswer: string | string[] = "";
    let isCorrect = false;

    if (
      question.type === QuestionType.SINGLE_CHOICE ||
      question.type === QuestionType.MULTIPLE_CHOICE
    ) {
      const selectedOptionIds = formData
        .getAll(`question_${question.id}`)
        .map(String)
        .filter(Boolean);
      const correctOptionIds = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id);

      answer = selectedOptionIds;
      correctAnswer = correctOptionIds;

      if (selectedOptionIds.length === 0) {
        missingQuestionIds.push(question.id);
      }

      isCorrect =
        selectedOptionIds.length > 0 &&
        correctOptionIds.length > 0 &&
        sameSet(selectedOptionIds, correctOptionIds);
    }

    if (question.type === QuestionType.SORT_STEPS) {
      const userAnswer = text(formData, `question_${question.id}`);
      const correctSteps = parseStepOrder(question.correctOrder);

      answer = userAnswer;
      correctAnswer = correctSteps;

      if (normalize(userAnswer) === "") {
        missingQuestionIds.push(question.id);
      }

      isCorrect = sameStepOrder(userAnswer, question.correctOrder);
    }

    if (
      question.type === QuestionType.FIND_PROMPT_ERROR ||
      question.type === QuestionType.FILL_BLANK
    ) {
      const userAnswer = text(formData, `question_${question.id}`);
      answer = userAnswer;
      correctAnswer = question.correctText ?? "";

      if (normalize(userAnswer) === "") {
        missingQuestionIds.push(question.id);
      }

      isCorrect = textMatches({
        answer: userAnswer,
        correctText: question.correctText,
        type: question.type,
      });
    }

    const pointsAwarded = isCorrect ? question.points : 0;
    score += pointsAwarded;

    return {
      questionId: question.id,
      type: question.type,
      answer,
      correctAnswer,
      isCorrect,
      pointsAwarded,
      maxPoints: question.points,
    };
  });

  if (missingQuestionIds.length > 0) {
    return {
      status: "error",
      message:
        missingQuestionIds.length === test.questions.length
          ? "Тест пока пустой. Ответьте на вопросы перед завершением."
          : "Заполните все вопросы перед завершением теста.",
      missingQuestionIds,
    };
  }

  const isPassed = maxScore > 0 && score >= test.passingScore;

  const attempt = await db.userTestAttempt.create({
    data: {
      userId: user.id,
      testId,
      score,
      maxScore,
      isPassed,
      answers: JSON.stringify(answers),
    },
  });

  if (isPassed) {
    await awardTestAchievements(user.id, lessonId);
  }

  await refreshLessonProgress({
    userId: user.id,
    lessonId,
  });

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath(`/lessons/${slug}`);

  return {
    status: "success",
    message: isPassed
      ? "Тест пройден. Зачёт сохранён."
      : "Пока не пройдено. Можно исправить ответы и попробовать ещё раз.",
    attempt: {
      score,
      maxScore,
      passingScore: test.passingScore,
      isPassed,
      createdAt: attempt.createdAt.toISOString(),
      answers,
    },
  };
}
