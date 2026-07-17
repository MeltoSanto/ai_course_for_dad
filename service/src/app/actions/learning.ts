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
import {
  buildSortQuestionModel,
  isCorrectSortSelection,
  normalizeSortSelection,
} from "@/lib/sort-question";

type StoredAnswer = {
  questionId: string;
  type: QuestionType;
  answer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  shuffleSeed?: string;
};

export type DraftTestAnswer = Pick<
  StoredAnswer,
  "questionId" | "answer" | "shuffleSeed"
>;

export type SubmitTestState = {
  status: "idle" | "error" | "success";
  message?: string;
  missingQuestionIds?: string[];
  draftAnswers?: DraftTestAnswer[];
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
    let pointsAwarded = 0;
    const shuffleSeed = text(
      formData,
      `question_${question.id}_shuffle_seed`,
    ).slice(0, 128);

    if (
      question.type === QuestionType.SINGLE_CHOICE ||
      question.type === QuestionType.MULTIPLE_CHOICE
    ) {
      const selectedOptionIds = Array.from(
        new Set(
          formData
            .getAll(`question_${question.id}`)
            .map(String)
            .filter(Boolean),
        ),
      );
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

      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        const correctIds = new Set(correctOptionIds);
        const correctSelected = selectedOptionIds.filter((id) =>
          correctIds.has(id),
        ).length;
        const incorrectSelected = selectedOptionIds.length - correctSelected;
        const earnedShare =
          correctOptionIds.length > 0
            ? Math.max(
                0,
                (correctSelected - incorrectSelected) /
                  correctOptionIds.length,
              )
            : 0;

        pointsAwarded = Math.round(question.points * earnedShare * 100) / 100;
      }
    }

    if (question.type === QuestionType.SORT_STEPS) {
      const model = buildSortQuestionModel({
        correctOrder: question.correctOrder,
        prompt: question.prompt,
        shuffleSeed,
      });
      const selectedKeys = normalizeSortSelection(
        formData.getAll(`question_${question.id}`).map(String),
        model,
      );

      answer = selectedKeys;
      correctAnswer = model.correctKeys;

      if (
        selectedKeys.length !== model.variants.length ||
        selectedKeys.some((key) => key === "")
      ) {
        missingQuestionIds.push(question.id);
      }

      isCorrect = isCorrectSortSelection(selectedKeys, model);
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

    if (question.type !== QuestionType.MULTIPLE_CHOICE) {
      pointsAwarded = isCorrect ? question.points : 0;
    }

    score += pointsAwarded;

    return {
      questionId: question.id,
      type: question.type,
      answer,
      correctAnswer,
      isCorrect,
      pointsAwarded,
      maxPoints: question.points,
      ...(shuffleSeed ? { shuffleSeed } : {}),
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
      draftAnswers: answers.map(({ questionId, answer, shuffleSeed }) => ({
        questionId,
        answer,
        ...(shuffleSeed ? { shuffleSeed } : {}),
      })),
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
      : "Пока не пройдено. Разберите ошибки и начните новую попытку.",
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
