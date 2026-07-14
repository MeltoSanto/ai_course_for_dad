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
  revalidatePath(`/lessons/${slug}`);
}

export async function submitTestAction(
  lessonId: string,
  testId: string,
  slug: string,
  formData: FormData,
) {
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
    return;
  }

  let score = 0;
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
      isCorrect = sameSet(selectedOptionIds, correctOptionIds);
    }

    if (question.type === QuestionType.SORT_STEPS) {
      const userAnswer = text(formData, `question_${question.id}`);
      answer = userAnswer;
      correctAnswer = question.correctOrder ?? "";
      isCorrect =
        normalize(userAnswer) !== "" &&
        normalize(userAnswer) === normalize(question.correctOrder);
    }

    if (
      question.type === QuestionType.FIND_PROMPT_ERROR ||
      question.type === QuestionType.FILL_BLANK
    ) {
      const userAnswer = text(formData, `question_${question.id}`);
      answer = userAnswer;
      correctAnswer = question.correctText ?? "";
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

  const isPassed = maxScore > 0 && score >= test.passingScore;

  await db.userTestAttempt.create({
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
}
