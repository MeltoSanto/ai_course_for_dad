import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LessonBlockType,
  LessonKind,
  PrismaClient,
  PublicationStatus,
  QuestionType,
} from "@prisma/client";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serviceRoot = resolve(scriptDir, "..");
const defaultPackagePath = resolve(serviceRoot, "..", "lesson-1-data-safety.md");

function loadDotEnv() {
  const candidates = [join(serviceRoot, ".env"), join(process.cwd(), ".env")];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function clean(value) {
  return value.replace(/[ \t]+$/gm, "").trim();
}

function dedent(value) {
  const lines = value.replace(/^\r?\n/, "").replace(/\r?\n$/, "").split(/\r?\n/);
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;

  return lines.map((line) => line.slice(minIndent)).join("\n");
}

function parseTopSections(markdown) {
  const sections = new Map();
  const matches = [...markdown.matchAll(/^# ([^\r\n]+)\s*$/gm)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const next = matches[index + 1];
    const name = clean(match[1]);
    const start = match.index + match[0].length;
    const end = next?.index ?? markdown.length;

    sections.set(name, clean(markdown.slice(start, end)));
  }

  return sections;
}

function parseSubsections(section, headingPrefix) {
  const matches = [...section.matchAll(/^## ([^\r\n]+)\s*$/gm)];

  return matches
    .filter((match) => clean(match[1]).startsWith(headingPrefix))
    .map((match, index) => {
      const next = matches[index + 1];
      const start = match.index + match[0].length;
      const end = next?.index ?? section.length;

      return {
        heading: clean(match[1]),
        body: clean(section.slice(start, end)),
      };
    });
}

function parseFieldBlocks(body, fieldNames) {
  const allowed = new Set(fieldNames);
  const matches = [...body.matchAll(/^\s*([A-Za-z][A-Za-z0-9]*):\s*(.*)$/gm)].filter(
    (match) => allowed.has(match[1]),
  );
  const result = {};

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const next = matches[index + 1];
    const name = match[1];
    const inlineValue = clean(match[2]);
    const start = match.index + match[0].length;
    const end = next?.index ?? body.length;
    let value = body.slice(start, end);

    if (inlineValue === "|") {
      value = dedent(value);
    } else if (inlineValue) {
      value = `${inlineValue}\n${value}`;
    }

    result[name] = clean(value);
  }

  return result;
}

function requireField(fields, name, context) {
  const value = fields[name];

  if (!value) {
    throw new Error(`Missing "${name}" in ${context}.`);
  }

  return value;
}

function parseInteger(value, fallback, context) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Expected integer in ${context}, got "${value}".`);
  }

  return parsed;
}

function parseBlock(section, order) {
  const fields = parseFieldBlocks(section.body, ["type", "title", "content"]);
  const type = requireField(fields, "type", section.heading);

  if (!Object.values(LessonBlockType).includes(type)) {
    throw new Error(`Unknown block type "${type}" in ${section.heading}.`);
  }

  return {
    type,
    title: requireField(fields, "title", section.heading),
    contentMd: requireField(fields, "content", section.heading),
    order,
    isPublished: true,
  };
}

function parseOptions(optionsMd, context) {
  const options = optionsMd
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^-\s+\[(x|X| )\]\s+(.+)$/);

      if (!match) {
        return null;
      }

      return {
        text: clean(match[2]),
        isCorrect: match[1].toLowerCase() === "x",
      };
    })
    .filter(Boolean);

  if (options.length === 0) {
    throw new Error(`Missing options in ${context}.`);
  }

  return options.map((option, index) => ({
    ...option,
    order: index + 1,
  }));
}

function parseCorrectOrder(value) {
  return value
    .split(/\r?\n/)
    .map((line) => clean(line.replace(/^\d+\.\s*/, "")))
    .filter(Boolean);
}

function parseQuestion(section, order) {
  const fields = parseFieldBlocks(section.body, [
    "type",
    "prompt",
    "points",
    "options",
    "correctOrder",
    "correctText",
    "explanation",
  ]);
  const type = requireField(fields, "type", section.heading);

  if (!Object.values(QuestionType).includes(type)) {
    throw new Error(`Unknown question type "${type}" in ${section.heading}.`);
  }

  const question = {
    type,
    prompt: requireField(fields, "prompt", section.heading),
    explanation: fields.explanation || null,
    points: parseInteger(fields.points, 1, `${section.heading}.points`),
    correctText: fields.correctText || null,
    correctOrder: null,
    order,
    options: [],
  };

  if (type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE) {
    question.options = parseOptions(requireField(fields, "options", section.heading), section.heading);
    const correctCount = question.options.filter((option) => option.isCorrect).length;

    if (type === QuestionType.SINGLE_CHOICE && correctCount !== 1) {
      throw new Error(`${section.heading} must have exactly one correct option.`);
    }

    if (type === QuestionType.MULTIPLE_CHOICE && correctCount < 1) {
      throw new Error(`${section.heading} must have at least one correct option.`);
    }
  }

  if (type === QuestionType.SORT_STEPS) {
    const steps = parseCorrectOrder(requireField(fields, "correctOrder", section.heading));

    if (steps.length < 2) {
      throw new Error(`${section.heading} must have at least two ordered steps.`);
    }

    question.correctOrder = JSON.stringify(steps);
  }

  if (type === QuestionType.FIND_PROMPT_ERROR || type === QuestionType.FILL_BLANK) {
    requireField(fields, "correctText", section.heading);
  }

  return question;
}

function parseListItems(section, marker) {
  const matches = [...section.matchAll(new RegExp(`^- ${marker}:\\s*(.+)$`, "gm"))];

  return matches.map((match, index) => {
    const next = matches[index + 1];
    const start = match.index + match[0].length;
    const end = next?.index ?? section.length;
    const body = `${marker}: ${match[1]}\n${section.slice(start, end)}`;

    return parseFieldBlocks(body, ["term", "definition", "content", "slug", "title", "category"]);
  });
}

function parsePackage(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const sections = parseTopSections(normalized);
  const requiredSections = ["lesson", "blocks", "assignment", "test", "glossary", "referenceItems", "scenario"];

  for (const sectionName of requiredSections) {
    if (!sections.has(sectionName)) {
      throw new Error(`Missing "# ${sectionName}" section.`);
    }
  }

  const lessonFields = parseFieldBlocks(sections.get("lesson"), [
    "slug",
    "title",
    "subtitle",
    "description",
    "durationMinutes",
    "mainSkill",
    "order",
  ]);
  const blockSections = parseSubsections(sections.get("blocks"), "block");
  const questionSections = parseSubsections(sections.get("test"), "question");
  const assignmentFields = parseFieldBlocks(sections.get("assignment"), [
    "title",
    "instructions",
    "expectedProcess",
    "checklist",
  ]);
  const testFields = parseFieldBlocks(sections.get("test"), [
    "title",
    "description",
    "passingScore",
  ]);
  const scenarioFields = parseFieldBlocks(sections.get("scenario"), ["slug", "title", "summary", "content"]);
  const glossaryItems = parseListItems(sections.get("glossary"), "term");
  const referenceItems = parseListItems(sections.get("referenceItems"), "slug");

  if (blockSections.length === 0) {
    throw new Error("Lesson package must include at least one block.");
  }

  if (questionSections.length === 0) {
    throw new Error("Lesson package must include at least one question.");
  }

  return {
    lesson: {
      slug: requireField(lessonFields, "slug", "lesson"),
      title: requireField(lessonFields, "title", "lesson"),
      subtitle: lessonFields.subtitle || lessonFields.mainSkill || null,
      description: lessonFields.description || null,
      durationMinutes: parseInteger(lessonFields.durationMinutes, null, "lesson.durationMinutes"),
      order: parseInteger(lessonFields.order, null, "lesson.order"),
    },
    blocks: blockSections.map((section, index) => parseBlock(section, index + 1)),
    assignment: {
      title: requireField(assignmentFields, "title", "assignment"),
      instructionsMd: requireField(assignmentFields, "instructions", "assignment"),
      expectedProcessMd: assignmentFields.expectedProcess || null,
      checklistMd: assignmentFields.checklist || null,
      order: 1,
    },
    test: {
      title: requireField(testFields, "title", "test"),
      description: testFields.description || null,
      passingScore: parseInteger(testFields.passingScore, 1, "test.passingScore"),
      order: 1,
      questions: questionSections.map((section, index) => parseQuestion(section, index + 1)),
    },
    glossaryItems: glossaryItems.map((item, index) => ({
      term: requireField(item, "term", `glossary item ${index + 1}`),
      definition: requireField(item, "definition", `glossary item ${index + 1}`),
      contentMd: item.content || null,
      order: index + 1,
    })),
    referenceItems: referenceItems.map((item, index) => ({
      slug: requireField(item, "slug", `reference item ${index + 1}`),
      title: requireField(item, "title", `reference item ${index + 1}`),
      category: requireField(item, "category", `reference item ${index + 1}`),
      contentMd: requireField(item, "content", `reference item ${index + 1}`),
      order: index + 1,
    })),
    scenario: {
      slug: requireField(scenarioFields, "slug", "scenario"),
      title: requireField(scenarioFields, "title", "scenario"),
      summary: scenarioFields.summary || null,
      contentMd: requireField(scenarioFields, "content", "scenario"),
      order: 1,
    },
  };
}

async function nextLessonOrder(prisma) {
  const lastLesson = await prisma.lesson.findFirst({
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });

  return (lastLesson?.order ?? 0) + 1;
}

async function importPackage(prisma, lessonPackage) {
  await prisma.$transaction(async (tx) => {
    const existingLesson = await tx.lesson.findUnique({
      where: {
        slug: lessonPackage.lesson.slug,
      },
      select: {
        id: true,
        order: true,
      },
    });
    const order = lessonPackage.lesson.order ?? existingLesson?.order ?? (await nextLessonOrder(tx));

    const lesson = await tx.lesson.upsert({
      where: {
        slug: lessonPackage.lesson.slug,
      },
      update: {
        title: lessonPackage.lesson.title,
        subtitle: lessonPackage.lesson.subtitle,
        description: lessonPackage.lesson.description,
        durationMinutes: lessonPackage.lesson.durationMinutes,
        kind: LessonKind.CORE,
        status: PublicationStatus.PUBLISHED,
        order,
      },
      create: {
        slug: lessonPackage.lesson.slug,
        title: lessonPackage.lesson.title,
        subtitle: lessonPackage.lesson.subtitle,
        description: lessonPackage.lesson.description,
        durationMinutes: lessonPackage.lesson.durationMinutes,
        kind: LessonKind.CORE,
        status: PublicationStatus.PUBLISHED,
        order,
      },
    });

    await tx.lessonBlock.deleteMany({
      where: {
        lessonId: lesson.id,
      },
    });
    await tx.assignment.deleteMany({
      where: {
        lessonId: lesson.id,
      },
    });
    await tx.lessonTest.deleteMany({
      where: {
        lessonId: lesson.id,
      },
    });

    await tx.lessonBlock.createMany({
      data: lessonPackage.blocks.map((block) => ({
        lessonId: lesson.id,
        type: block.type,
        title: block.title,
        contentMd: block.contentMd,
        order: block.order,
        isPublished: block.isPublished,
      })),
    });

    await tx.assignment.create({
      data: {
        lessonId: lesson.id,
        title: lessonPackage.assignment.title,
        instructionsMd: lessonPackage.assignment.instructionsMd,
        expectedProcessMd: lessonPackage.assignment.expectedProcessMd,
        checklistMd: lessonPackage.assignment.checklistMd,
        status: PublicationStatus.PUBLISHED,
        order: lessonPackage.assignment.order,
      },
    });

    await tx.lessonTest.create({
      data: {
        lessonId: lesson.id,
        title: lessonPackage.test.title,
        description: lessonPackage.test.description,
        passingScore: lessonPackage.test.passingScore,
        status: PublicationStatus.PUBLISHED,
        order: lessonPackage.test.order,
        questions: {
          create: lessonPackage.test.questions.map((question) => ({
            type: question.type,
            prompt: question.prompt,
            explanation: question.explanation,
            points: question.points,
            correctText: question.correctText,
            correctOrder: question.correctOrder,
            order: question.order,
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: option.order,
              })),
            },
          })),
        },
      },
    });

    for (const item of lessonPackage.glossaryItems) {
      await tx.glossaryTerm.upsert({
        where: {
          term: item.term,
        },
        update: {
          definition: item.definition,
          contentMd: item.contentMd,
          status: PublicationStatus.PUBLISHED,
          order: item.order,
        },
        create: {
          term: item.term,
          definition: item.definition,
          contentMd: item.contentMd,
          status: PublicationStatus.PUBLISHED,
          order: item.order,
        },
      });
    }

    for (const item of lessonPackage.referenceItems) {
      await tx.referenceItem.upsert({
        where: {
          slug: item.slug,
        },
        update: {
          title: item.title,
          category: item.category,
          contentMd: item.contentMd,
          status: PublicationStatus.PUBLISHED,
          order: item.order,
        },
        create: {
          slug: item.slug,
          title: item.title,
          category: item.category,
          contentMd: item.contentMd,
          status: PublicationStatus.PUBLISHED,
          order: item.order,
        },
      });
    }

    await tx.scenario.upsert({
      where: {
        slug: lessonPackage.scenario.slug,
      },
      update: {
        title: lessonPackage.scenario.title,
        summary: lessonPackage.scenario.summary,
        contentMd: lessonPackage.scenario.contentMd,
        status: PublicationStatus.PUBLISHED,
        order: lessonPackage.scenario.order,
      },
      create: {
        slug: lessonPackage.scenario.slug,
        title: lessonPackage.scenario.title,
        summary: lessonPackage.scenario.summary,
        contentMd: lessonPackage.scenario.contentMd,
        status: PublicationStatus.PUBLISHED,
        order: lessonPackage.scenario.order,
      },
    });
  });
}

async function main() {
  loadDotEnv();

  const requestedPaths = process.argv.slice(2);
  const inputPaths = (requestedPaths.length > 0 ? requestedPaths : [defaultPackagePath]).map(
    (inputPath) => resolve(process.cwd(), inputPath),
  );

  for (const inputPath of inputPaths) {
    if (!existsSync(inputPath)) {
      throw new Error(`Lesson package not found: ${inputPath}`);
    }
  }

  const lessonPackages = inputPaths.map((inputPath) =>
    parsePackage(readFileSync(inputPath, "utf8")),
  );
  const prisma = new PrismaClient();

  try {
    for (const lessonPackage of lessonPackages) {
      await importPackage(prisma, lessonPackage);

      const maxScore = lessonPackage.test.questions.reduce(
        (sum, question) => sum + question.points,
        0,
      );

      console.log(`Imported lesson: ${lessonPackage.lesson.slug}`);
      console.log(`Blocks: ${lessonPackage.blocks.length}`);
      console.log(`Assignment: 1`);
      console.log(`Questions: ${lessonPackage.test.questions.length}, max score: ${maxScore}`);
      console.log(`Glossary terms: ${lessonPackage.glossaryItems.length}`);
      console.log(`Reference items: ${lessonPackage.referenceItems.length}`);
      console.log(`Scenario: ${lessonPackage.scenario.slug}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
