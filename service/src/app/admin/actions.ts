"use server";

import {
  AchievementTriggerType,
  LessonBlockType,
  LessonKind,
  PublicationStatus,
  QuestionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

const lessonKinds = Object.values(LessonKind);
const publicationStatuses = Object.values(PublicationStatus);
const blockTypes = Object.values(LessonBlockType);
const questionTypes = Object.values(QuestionType);
const achievementTriggerTypes = Object.values(AchievementTriggerType);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function intValue(formData: FormData, key: string, fallback: number) {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function enumValue<T extends string>(
  formData: FormData,
  key: string,
  values: readonly T[],
  fallback: T,
) {
  const value = text(formData, key);
  return values.includes(value as T) ? (value as T) : fallback;
}

function slugify(value: string, fallbackPrefix = "item") {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `${fallbackPrefix}-${Date.now()}`;
}

async function uniqueSlug({
  baseSlug,
  currentId,
  findExisting,
}: {
  baseSlug: string;
  currentId?: string;
  findExisting: (slug: string, currentId?: string) => Promise<{ id: string } | null>;
}) {
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await findExisting(candidate, currentId);

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function uniqueLessonSlug(baseSlug: string, currentLessonId?: string) {
  return uniqueSlug({
    baseSlug,
    currentId: currentLessonId,
    findExisting: (slug, currentId) =>
      db.lesson.findFirst({
        where: currentId
          ? {
              slug,
              id: {
                not: currentId,
              },
            }
          : {
              slug,
            },
        select: {
          id: true,
        },
      }),
  });
}

async function uniqueReferenceSlug(baseSlug: string, currentId?: string) {
  return uniqueSlug({
    baseSlug,
    currentId,
    findExisting: (slug, currentId) =>
      db.referenceItem.findFirst({
        where: currentId
          ? {
              slug,
              id: {
                not: currentId,
              },
            }
          : {
              slug,
            },
        select: {
          id: true,
        },
      }),
  });
}

async function uniqueScenarioSlug(baseSlug: string, currentId?: string) {
  return uniqueSlug({
    baseSlug,
    currentId,
    findExisting: (slug, currentId) =>
      db.scenario.findFirst({
        where: currentId
          ? {
              slug,
              id: {
                not: currentId,
              },
            }
          : {
              slug,
            },
        select: {
          id: true,
        },
      }),
  });
}

async function uniqueAchievementCode(baseCode: string, currentId?: string) {
  return uniqueSlug({
    baseSlug: baseCode,
    currentId,
    findExisting: (code, currentId) =>
      db.achievement.findFirst({
        where: currentId
          ? {
              code,
              id: {
                not: currentId,
              },
            }
          : {
              code,
            },
        select: {
          id: true,
        },
      }),
  });
}

async function getLessonPathById(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      slug: true,
    },
  });

  return lesson ? `/lessons/${lesson.slug}` : "/";
}

async function revalidateLessonAdmin(lessonId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/lessons/${lessonId}`);
  revalidatePath(await getLessonPathById(lessonId));
  revalidatePath("/");
}

export async function createLessonAction(formData: FormData) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  const lesson = await db.lesson.create({
    data: {
      slug: await uniqueLessonSlug(slugify(text(formData, "slug") || title, "lesson")),
      title,
      subtitle: optionalText(formData, "subtitle"),
      description: optionalText(formData, "description"),
      kind: enumValue(formData, "kind", lessonKinds, LessonKind.CORE),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
      durationMinutes: intValue(formData, "durationMinutes", 30),
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/lessons/${lesson.id}`);
}

export async function updateLessonAction(lessonId: string, formData: FormData) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.lesson.update({
    where: {
      id: lessonId,
    },
    data: {
        slug: await uniqueLessonSlug(
        slugify(text(formData, "slug") || title, "lesson"),
        lessonId,
      ),
      title,
      subtitle: optionalText(formData, "subtitle"),
      description: optionalText(formData, "description"),
      kind: enumValue(formData, "kind", lessonKinds, LessonKind.CORE),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
      durationMinutes: intValue(formData, "durationMinutes", 30),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function createBlockAction(lessonId: string, formData: FormData) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.lessonBlock.create({
    data: {
      lessonId,
      type: enumValue(formData, "type", blockTypes, LessonBlockType.MARKDOWN),
      title,
      contentMd: text(formData, "contentMd"),
      order: intValue(formData, "order", 1),
      isPublished: checkbox(formData, "isPublished"),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function updateBlockAction(
  lessonId: string,
  blockId: string,
  formData: FormData,
) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.lessonBlock.update({
    where: {
      id: blockId,
    },
    data: {
      type: enumValue(formData, "type", blockTypes, LessonBlockType.MARKDOWN),
      title,
      contentMd: text(formData, "contentMd"),
      order: intValue(formData, "order", 1),
      isPublished: checkbox(formData, "isPublished"),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function createAssignmentAction(
  lessonId: string,
  formData: FormData,
) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.assignment.create({
    data: {
      lessonId,
      title,
      instructionsMd: text(formData, "instructionsMd"),
      expectedProcessMd: optionalText(formData, "expectedProcessMd"),
      checklistMd: optionalText(formData, "checklistMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function updateAssignmentAction(
  lessonId: string,
  assignmentId: string,
  formData: FormData,
) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.assignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      title,
      instructionsMd: text(formData, "instructionsMd"),
      expectedProcessMd: optionalText(formData, "expectedProcessMd"),
      checklistMd: optionalText(formData, "checklistMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function createTestAction(lessonId: string, formData: FormData) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.lessonTest.create({
    data: {
      lessonId,
      title,
      description: optionalText(formData, "description"),
      passingScore: intValue(formData, "passingScore", 1),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function updateTestAction(
  lessonId: string,
  testId: string,
  formData: FormData,
) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.lessonTest.update({
    where: {
      id: testId,
    },
    data: {
      title,
      description: optionalText(formData, "description"),
      passingScore: intValue(formData, "passingScore", 1),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function createQuestionAction(
  lessonId: string,
  testId: string,
  formData: FormData,
) {
  await requireAdmin();

  const prompt = text(formData, "prompt");

  if (!prompt) {
    return;
  }

  await db.question.create({
    data: {
      testId,
      type: enumValue(formData, "type", questionTypes, QuestionType.SINGLE_CHOICE),
      prompt,
      explanation: optionalText(formData, "explanation"),
      points: intValue(formData, "points", 1),
      correctText: optionalText(formData, "correctText"),
      correctOrder: optionalText(formData, "correctOrder"),
      order: intValue(formData, "order", 1),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function updateQuestionAction(
  lessonId: string,
  questionId: string,
  formData: FormData,
) {
  await requireAdmin();

  const prompt = text(formData, "prompt");

  if (!prompt) {
    return;
  }

  await db.question.update({
    where: {
      id: questionId,
    },
    data: {
      type: enumValue(formData, "type", questionTypes, QuestionType.SINGLE_CHOICE),
      prompt,
      explanation: optionalText(formData, "explanation"),
      points: intValue(formData, "points", 1),
      correctText: optionalText(formData, "correctText"),
      correctOrder: optionalText(formData, "correctOrder"),
      order: intValue(formData, "order", 1),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function createQuestionOptionAction(
  lessonId: string,
  questionId: string,
  formData: FormData,
) {
  await requireAdmin();

  const optionText = text(formData, "text");

  if (!optionText) {
    return;
  }

  await db.questionOption.create({
    data: {
      questionId,
      text: optionText,
      isCorrect: checkbox(formData, "isCorrect"),
      order: intValue(formData, "order", 1),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

export async function updateQuestionOptionAction(
  lessonId: string,
  optionId: string,
  formData: FormData,
) {
  await requireAdmin();

  const optionText = text(formData, "text");

  if (!optionText) {
    return;
  }

  await db.questionOption.update({
    where: {
      id: optionId,
    },
    data: {
      text: optionText,
      isCorrect: checkbox(formData, "isCorrect"),
      order: intValue(formData, "order", 1),
    },
  });

  await revalidateLessonAdmin(lessonId);
}

function revalidateLibraryAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/library");
  revalidatePath("/reference");
  revalidatePath("/glossary");
  revalidatePath("/scenarios");
  revalidatePath("/progress");
  revalidatePath("/");
}

export async function createReferenceItemAction(formData: FormData) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.referenceItem.create({
    data: {
      slug: await uniqueReferenceSlug(
        slugify(text(formData, "slug") || title, "reference"),
      ),
      title,
      category: text(formData, "category") || "Общее",
      contentMd: text(formData, "contentMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  revalidateLibraryAdmin();
}

export async function updateReferenceItemAction(
  itemId: string,
  formData: FormData,
) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.referenceItem.update({
    where: {
      id: itemId,
    },
    data: {
      slug: await uniqueReferenceSlug(
        slugify(text(formData, "slug") || title, "reference"),
        itemId,
      ),
      title,
      category: text(formData, "category") || "Общее",
      contentMd: text(formData, "contentMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  revalidateLibraryAdmin();
}

export async function createGlossaryTermAction(formData: FormData) {
  await requireAdmin();

  const term = text(formData, "term");

  if (!term) {
    return;
  }

  await db.glossaryTerm.upsert({
    where: {
      term,
    },
    update: {
      definition: text(formData, "definition"),
      contentMd: optionalText(formData, "contentMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
    create: {
      term,
      definition: text(formData, "definition"),
      contentMd: optionalText(formData, "contentMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  revalidateLibraryAdmin();
}

export async function updateGlossaryTermAction(
  termId: string,
  formData: FormData,
) {
  await requireAdmin();

  const term = text(formData, "term");

  if (!term) {
    return;
  }

  await db.glossaryTerm.update({
    where: {
      id: termId,
    },
    data: {
      term,
      definition: text(formData, "definition"),
      contentMd: optionalText(formData, "contentMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  revalidateLibraryAdmin();
}

export async function createScenarioAction(formData: FormData) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.scenario.create({
    data: {
      slug: await uniqueScenarioSlug(
        slugify(text(formData, "slug") || title, "scenario"),
      ),
      title,
      summary: optionalText(formData, "summary"),
      contentMd: text(formData, "contentMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  revalidateLibraryAdmin();
}

export async function updateScenarioAction(
  scenarioId: string,
  formData: FormData,
) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.scenario.update({
    where: {
      id: scenarioId,
    },
    data: {
      slug: await uniqueScenarioSlug(
        slugify(text(formData, "slug") || title, "scenario"),
        scenarioId,
      ),
      title,
      summary: optionalText(formData, "summary"),
      contentMd: text(formData, "contentMd"),
      status: enumValue(
        formData,
        "status",
        publicationStatuses,
        PublicationStatus.DRAFT,
      ),
      order: intValue(formData, "order", 1),
    },
  });

  revalidateLibraryAdmin();
}

export async function createAchievementAction(formData: FormData) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.achievement.create({
    data: {
      code: await uniqueAchievementCode(
        slugify(text(formData, "code") || title, "achievement"),
      ),
      title,
      description: text(formData, "description"),
      icon: optionalText(formData, "icon"),
      triggerType: enumValue(
        formData,
        "triggerType",
        achievementTriggerTypes,
        AchievementTriggerType.MANUAL,
      ),
      isActive: checkbox(formData, "isActive"),
    },
  });

  revalidateLibraryAdmin();
}

export async function updateAchievementAction(
  achievementId: string,
  formData: FormData,
) {
  await requireAdmin();

  const title = text(formData, "title");

  if (!title) {
    return;
  }

  await db.achievement.update({
    where: {
      id: achievementId,
    },
    data: {
      code: await uniqueAchievementCode(
        slugify(text(formData, "code") || title, "achievement"),
        achievementId,
      ),
      title,
      description: text(formData, "description"),
      icon: optionalText(formData, "icon"),
      triggerType: enumValue(
        formData,
        "triggerType",
        achievementTriggerTypes,
        AchievementTriggerType.MANUAL,
      ),
      isActive: checkbox(formData, "isActive"),
    },
  });

  revalidateLibraryAdmin();
}
