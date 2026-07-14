import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AchievementTriggerType,
  LessonBlockType,
  LessonKind,
  PrismaClient,
  PublicationStatus,
  QuestionType,
  UserRole,
} from "@prisma/client";

function loadDotEnv() {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
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

loadDotEnv();

const prisma = new PrismaClient();
const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "1234";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "1234";
const qaPassword = process.env.SEED_QA_PASSWORD ?? "1234";

const coreLessons = [
  {
    slug: "data-safety",
    title: "Безопасность и обезличивание данных",
    subtitle: "Что можно отдавать ИИ, а что нужно заменить",
    description:
      "Учимся видеть чувствительные данные и готовить безопасную версию рабочего текста.",
    skill: "обезличивать данные перед работой с ИИ",
    order: 1,
    durationMinutes: 35,
  },
  {
    slug: "managed-ai-brief",
    title: "Управляемое ТЗ для ИИ",
    subtitle: "Роль, задача, контекст, ограничения и формат ответа",
    description:
      "Переходим от просьбы «проверь договор» к управляемой постановке задачи.",
    skill: "собирать точное техническое задание для ИИ",
    order: 2,
    durationMinutes: 40,
  },
  {
    slug: "task-decomposition",
    title: "Декомпозиция сложной задачи",
    subtitle: "Как превратить большой запрос в рабочий конвейер",
    description:
      "Разбиваем анализ документа на этапы: извлечение, проверку, выводы и сборку.",
    skill: "разбивать сложную задачу на последовательные шаги",
    order: 3,
    durationMinutes: 40,
  },
  {
    slug: "citation-control",
    title: "Цитатный контроль",
    subtitle: "Нет цитаты - нет вывода",
    description:
      "Требуем опору каждого вывода в пункте документа, цитате или явной пометке «проверить».",
    skill: "отделять факты, выводы и предположения",
    order: 4,
    durationMinutes: 35,
  },
  {
    slug: "long-documents",
    title: "Длинные документы и контекстное окно",
    subtitle: "Как не потерять середину документа",
    description:
      "Работаем с длинным текстом частями и собираем итог только после накопительной таблицы.",
    skill: "управлять длинным контекстом",
    order: 5,
    durationMinutes: 40,
  },
  {
    slug: "rf-legal-check",
    title: "Проверка норм и дисциплина юрисдикции РФ",
    subtitle: "Юридические выводы только через проверочный контур",
    description:
      "Не даем модели выдавать непроверенные нормы за факт и отделяем текст документа от правовой квалификации.",
    skill: "задавать осторожный контур проверки норм РФ",
    order: 6,
    durationMinutes: 40,
  },
  {
    slug: "agent-roles",
    title: "Агентные роли",
    subtitle: "ИИ как команда специалистов",
    description:
      "Разводим роли планировщика, извлекателя фактов, критика, проверяющего и редактора.",
    skill: "строить многошаговый процесс с ролями",
    order: 7,
    durationMinutes: 35,
  },
  {
    slug: "personal-ai-system",
    title: "Личная система работы с ИИ",
    subtitle: "Сценарии, таблица выбора модели и журнал ошибок",
    description:
      "Превращаем удачные запросы в повторяемую рабочую систему.",
    skill: "вести личную библиотеку сценариев",
    order: 8,
    durationMinutes: 40,
  },
];

const extraLessons = [
  ["structured-outputs", "Структурированные ответы: таблицы и JSON"],
  ["personal-evals", "Личные evals: как проверять промпты и модели"],
  ["guardrails-red-teaming", "Guardrails и red teaming для личной работы"],
  ["rag-knowledge-base", "RAG и личная база знаний"],
  ["tool-calling-mcp", "Tool calling, MCP и ИИ как управляющий слой"],
  ["multimodal-ai", "Мультимодальный ИИ: PDF, сканы, таблицы"],
  ["browser-agents", "Browser agents и human-in-the-loop"],
  ["ai-operating-system", "Память, наблюдаемость и личная AI Operating System"],
].map(([slug, title], index) => ({
  slug,
  title,
  subtitle: "Дополнительный трек",
  description:
    "Материал второго уровня для развития личной рабочей системы с ИИ.",
  skill: "расширять практику работы с ИИ",
  order: index + 9,
  durationMinutes: 30,
}));

const glossaryTerms = [
  ["ИИ-модель", "Система, которая отвечает на запросы на основе обученных закономерностей."],
  ["Промпт", "Инструкция для ИИ: роль, задача, контекст, ограничения и формат ответа."],
  ["Контекстное окно", "Объем информации, который модель удерживает в текущем диалоге."],
  ["Галлюцинация", "Уверенный ответ модели, который не подтвержден данными или источниками."],
  ["Цитатный контроль", "Правило: каждый вывод должен иметь опору в цитате или явную пометку проверки."],
  ["Декомпозиция", "Разделение большой задачи на последовательные проверяемые шаги."],
  ["Агентная роль", "Узкая роль ИИ в процессе: планировщик, критик, проверяющий, редактор."],
  ["Обезличивание", "Замена чувствительных данных безопасными эквивалентами без потери смысла."],
];

const references = [
  {
    slug: "safe-data-rules",
    title: "Безопасная работа с данными",
    category: "Безопасность",
    contentMd:
      "Перед отправкой в ИИ замените ФИО, адреса, телефоны, реквизиты, суммы и коммерческие условия на вымышленные значения.",
  },
  {
    slug: "good-prompt-structure",
    title: "Структура хорошего запроса",
    category: "Промпты",
    contentMd:
      "Хороший запрос содержит роль, цель, контекст, ограничения, критерии качества и ожидаемый формат ответа.",
  },
  {
    slug: "citation-check",
    title: "Цитатный контроль",
    category: "Проверка",
    contentMd:
      "Просите таблицу: пункт документа, дословная цитата, факт, вывод, что проверить вручную.",
  },
  {
    slug: "long-document-protocol",
    title: "Протокол длинного документа",
    category: "Документы",
    contentMd:
      "Загружайте текст частями, ведите накопительную таблицу и запрещайте финальный вывод до команды ФИНАЛ.",
  },
];

const scenarios = [
  {
    slug: "lease-agreement-review",
    title: "Анализ договора аренды",
    summary: "Многошаговая проверка условий, рисков и вопросов контрагенту.",
  },
  {
    slug: "addendum-check",
    title: "Проверка допсоглашения",
    summary: "Сравнение изменений, цитатный контроль и список ручных проверок.",
  },
  {
    slug: "business-letter",
    title: "Подготовка делового письма",
    summary: "Сбор фактов, тональность, структура и финальная редактура человеком.",
  },
];

const achievements = [
  [
    "safe-start",
    "Безопасный старт",
    "Пройден урок по обезличиванию.",
    "LESSON_COMPLETED",
  ],
  [
    "task-architect",
    "Архитектор задачи",
    "Собрано управляемое ТЗ для ИИ.",
    "PRACTICE_COMPLETED",
  ],
  [
    "step-by-step",
    "Разбил на шаги",
    "Завершен урок по декомпозиции сложной задачи.",
    "LESSON_COMPLETED",
  ],
  [
    "citation-discipline",
    "Нет цитаты - нет вывода",
    "Выполнено задание с цитатным контролем.",
    "PRACTICE_COMPLETED",
  ],
  [
    "long-doc-tamer",
    "Длинный документ приручен",
    "Завершен урок по длинным документам и контекстному окну.",
    "LESSON_COMPLETED",
  ],
  [
    "jurisdiction-control",
    "Юрисдикция под контролем",
    "Успешно пройден тест по проверке норм и дисциплине РФ.",
    "TEST_PASSED",
  ],
  [
    "ai-team",
    "Собрал ИИ-команду",
    "Завершен урок по агентным ролям.",
    "LESSON_COMPLETED",
  ],
  [
    "personal-system",
    "Личная система запущена",
    "Завершен урок по личной системе работы с ИИ.",
    "LESSON_COMPLETED",
  ],
  [
    "first-test",
    "Проверочный контур",
    "Успешно пройден первый тест.",
    "TEST_PASSED",
  ],
  [
    "practice-track",
    "Практик",
    "Завершены все основные практические задания.",
    "PRACTICE_COMPLETED",
  ],
  [
    "course-finish",
    "Финал курса",
    "Завершены все основные уроки.",
    "LESSON_COMPLETED",
  ],
];

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");

  return `scrypt$${salt}$${hash}`;
}

async function upsertUser({ username, password, displayName, role }) {
  await prisma.user.upsert({
    where: { username },
    update: {
      displayName,
      role,
    },
    create: {
      username,
      passwordHash: hashPassword(password),
      displayName,
      role,
    },
  });
}

function lessonBlocks(lesson) {
  return [
    {
      type: LessonBlockType.OBJECTIVE,
      title: "Цель урока",
      contentMd: `После урока ученик умеет ${lesson.skill} и понимает, где нужна ручная проверка.`,
    },
    {
      type: LessonBlockType.EXPLANATION,
      title: "Короткое объяснение",
      contentMd:
        "Основная идея, ключевые правила и границы применения. Этот блок будет наполнен исследовательской моделью.",
    },
    {
      type: LessonBlockType.DEMONSTRATION,
      title: "Демонстрация",
      contentMd:
        "Пример слабого запроса, усиленного запроса и разбор отличий между ними.",
    },
    {
      type: LessonBlockType.PRACTICE,
      title: "Практика",
      contentMd:
        "Рабочее задание на вымышленном материале: ученик должен получить проверяемый результат, а не просто красивый ответ.",
    },
    {
      type: LessonBlockType.PROMPTS,
      title: "Промпты",
      contentMd:
        "Базовый промпт, усиленный промпт и промпт для самопроверки результата.",
    },
    {
      type: LessonBlockType.CHECK,
      title: "Проверка",
      contentMd:
        "Чек-лист качества процесса: что подтверждено, что требует ручной проверки, где возможна ошибка ИИ.",
    },
    {
      type: LessonBlockType.ARTIFACT,
      title: "Итоговый артефакт",
      contentMd:
        "Шаблон, сценарий, чек-лист или таблица, которые ученик сохраняет в личную систему.",
    },
  ];
}

async function ensureLesson(definition, kind) {
  const lesson = await prisma.lesson.upsert({
    where: {
      slug: definition.slug,
    },
    update: {
      title: definition.title,
      subtitle: definition.subtitle,
      description: definition.description,
      kind,
      order: definition.order,
      durationMinutes: definition.durationMinutes,
    },
    create: {
      slug: definition.slug,
      title: definition.title,
      subtitle: definition.subtitle,
      description: definition.description,
      kind,
      status: PublicationStatus.PUBLISHED,
      order: definition.order,
      durationMinutes: definition.durationMinutes,
    },
  });

  const blockCount = await prisma.lessonBlock.count({
    where: {
      lessonId: lesson.id,
    },
  });

  if (blockCount === 0) {
    await prisma.lessonBlock.createMany({
      data: lessonBlocks(definition).map((block, index) => ({
        lessonId: lesson.id,
        type: block.type,
        title: block.title,
        contentMd: block.contentMd,
        order: index + 1,
        isPublished: true,
      })),
    });
  }

  const assignmentCount = await prisma.assignment.count({
    where: {
      lessonId: lesson.id,
    },
  });

  if (assignmentCount === 0) {
    await prisma.assignment.create({
      data: {
        lessonId: lesson.id,
        title: `Практика: ${definition.title}`,
        instructionsMd:
          "Выполните задание на вымышленном материале и сохраните результат для проверки процесса.",
        expectedProcessMd:
          "В результате должны быть видны входные данные, шаги, проверочные вопросы и итоговый артефакт.",
        checklistMd:
          "Данные обезличены; задача задана явно; выводы отделены от фактов; спорные места помечены для проверки.",
        status: PublicationStatus.PUBLISHED,
        order: 1,
      },
    });
  }

  const testCount = await prisma.lessonTest.count({
    where: {
      lessonId: lesson.id,
    },
  });

  if (testCount === 0) {
    await prisma.lessonTest.create({
      data: {
        lessonId: lesson.id,
        title: `Проверка: ${definition.title}`,
        description:
          "Короткая проверка понимания процесса. Содержание вопросов будет расширено при наполнении урока.",
        passingScore: 1,
        status: PublicationStatus.PUBLISHED,
        order: 1,
        questions: {
          create: [
            {
              type: QuestionType.SINGLE_CHOICE,
              prompt: "Что важнее всего перед доверием ответу ИИ?",
              points: 1,
              order: 1,
              options: {
                create: [
                  {
                    text: "Проверить основания, ограничения и спорные места",
                    isCorrect: true,
                    order: 1,
                  },
                  {
                    text: "Оценить, насколько уверенно написан ответ",
                    order: 2,
                  },
                  {
                    text: "Сразу использовать самый подробный ответ",
                    order: 3,
                  },
                  {
                    text: "Попросить модель отвечать короче",
                    order: 4,
                  },
                ],
              },
            },
          ],
        },
      },
    });
  }
}

async function seedLibrary() {
  for (const [index, [term, definition]] of glossaryTerms.entries()) {
    await prisma.glossaryTerm.upsert({
      where: {
        term,
      },
      update: {
        definition,
        order: index + 1,
      },
      create: {
        term,
        definition,
        status: PublicationStatus.PUBLISHED,
        order: index + 1,
      },
    });
  }

  for (const [index, reference] of references.entries()) {
    await prisma.referenceItem.upsert({
      where: {
        slug: reference.slug,
      },
      update: {
        title: reference.title,
        category: reference.category,
        contentMd: reference.contentMd,
        order: index + 1,
      },
      create: {
        ...reference,
        status: PublicationStatus.PUBLISHED,
        order: index + 1,
      },
    });
  }

  for (const [index, scenario] of scenarios.entries()) {
    await prisma.scenario.upsert({
      where: {
        slug: scenario.slug,
      },
      update: {
        title: scenario.title,
        summary: scenario.summary,
        contentMd:
          "Когда использовать, входные данные, шаги, промпты, контрольные правила и итоговый формат результата.",
        order: index + 1,
      },
      create: {
        ...scenario,
        contentMd:
          "Когда использовать, входные данные, шаги, промпты, контрольные правила и итоговый формат результата.",
        status: PublicationStatus.PUBLISHED,
        order: index + 1,
      },
    });
  }
}

async function seedAchievements() {
  for (const [code, title, description, triggerType] of achievements) {
    await prisma.achievement.upsert({
      where: {
        code,
      },
      update: {
        title,
        description,
        triggerType: AchievementTriggerType[triggerType],
        isActive: true,
      },
      create: {
        code,
        title,
        description,
        triggerType: AchievementTriggerType[triggerType],
        isActive: true,
      },
    });
  }
}

async function main() {
  await upsertUser({
    username: "roman",
    password: studentPassword,
    displayName: "Роман",
    role: UserRole.STUDENT,
  });

  await upsertUser({
    username: "qa",
    password: qaPassword,
    displayName: "QA Tester",
    role: UserRole.STUDENT,
  });

  await upsertUser({
    username: "nikita",
    password: adminPassword,
    displayName: "Никита",
    role: UserRole.ADMIN,
  });

  for (const lesson of coreLessons) {
    await ensureLesson(lesson, LessonKind.CORE);
  }

  for (const lesson of extraLessons) {
    await ensureLesson(lesson, LessonKind.EXTRA);
  }

  await seedLibrary();
  await seedAchievements();

  console.log("Seeded users, lessons, library items, tests, and achievements");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
