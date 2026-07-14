import { Button, Card, Chip } from "@heroui/react";
import {
  LessonBlockType,
  LessonKind,
  PublicationStatus,
  QuestionType,
} from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createAssignmentAction,
  createBlockAction,
  createQuestionAction,
  createQuestionOptionAction,
  createTestAction,
  updateAssignmentAction,
  updateBlockAction,
  updateLessonAction,
  updateQuestionAction,
  updateQuestionOptionAction,
  updateTestAction,
} from "@/app/admin/actions";
import { logoutAction } from "@/app/actions/auth";
import { CockpitShell } from "@/components/cockpit-shell";
import {
  getAdminLessonEditor,
  kindLabels,
  statusLabels,
} from "@/lib/course";
import { requireAdmin } from "@/lib/session";

const inputClass =
  "cockpit-input mt-2 text-sm";
const textareaClass = "textarea mt-2 min-h-28 resize-y text-sm leading-6";
const compactTextareaClass = "textarea mt-2 min-h-20 resize-y text-sm leading-6";

const blockTypeLabels: Record<LessonBlockType, string> = {
  OBJECTIVE: "Цель",
  EXPLANATION: "Объяснение",
  DEMONSTRATION: "Демонстрация",
  PRACTICE: "Практика",
  PROMPTS: "Промпты",
  CHECK: "Проверка",
  ARTIFACT: "Артефакт",
  MARKDOWN: "Markdown",
  CALLOUT: "Акцент",
};

const questionTypeLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Один ответ",
  MULTIPLE_CHOICE: "Несколько ответов",
  SORT_STEPS: "Сортировка шагов",
  FIND_PROMPT_ERROR: "Найти ошибку",
  FILL_BLANK: "Вставить слово",
};

type AdminLessonPageProps = {
  params: Promise<{
    lessonId: string;
  }>;
};

function StatusSelect({
  defaultValue,
  name = "status",
}: {
  defaultValue: PublicationStatus;
  name?: string;
}) {
  return (
    <select className={inputClass} defaultValue={defaultValue} name={name}>
      {Object.values(PublicationStatus).map((status) => (
        <option key={status} value={status}>
          {statusLabels[status]}
        </option>
      ))}
    </select>
  );
}

function KindSelect({ defaultValue }: { defaultValue: LessonKind }) {
  return (
    <select className={inputClass} defaultValue={defaultValue} name="kind">
      {Object.values(LessonKind).map((kind) => (
        <option key={kind} value={kind}>
          {kindLabels[kind]}
        </option>
      ))}
    </select>
  );
}

function BlockTypeSelect({ defaultValue }: { defaultValue: LessonBlockType }) {
  return (
    <select className={inputClass} defaultValue={defaultValue} name="type">
      {Object.values(LessonBlockType).map((type) => (
        <option key={type} value={type}>
          {blockTypeLabels[type]}
        </option>
      ))}
    </select>
  );
}

function QuestionTypeSelect({ defaultValue }: { defaultValue: QuestionType }) {
  return (
    <select className={inputClass} defaultValue={defaultValue} name="type">
      {Object.values(QuestionType).map((type) => (
        <option key={type} value={type}>
          {questionTypeLabels[type]}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  defaultValue,
  name,
  min = 0,
}: {
  defaultValue: number | null;
  name: string;
  min?: number;
}) {
  return (
    <input
      className={inputClass}
      defaultValue={defaultValue ?? ""}
      min={min}
      name={name}
      type="number"
    />
  );
}

export default async function AdminLessonPage({ params }: AdminLessonPageProps) {
  const { lessonId } = await params;
  const user = await requireAdmin();
  const lesson = await getAdminLessonEditor(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <CockpitShell
      active="admin"
      continueHref={`/lessons/${lesson.slug}`}
      user={user}
    >
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <header className="hidden">
          <div>
            <Link
              className="text-sm font-medium text-[#56766e] hover:text-[#1e2528]"
              href="/admin"
            >
              ← К админке
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
              {lesson.title}
            </h1>
            <p className="mt-2 text-sm text-[#66736f]">
              Редактирование урока, блоков, практики, тестов и вариантов ответа.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="soft" color="success">
              {user.displayName}
            </Chip>
            <Link href={`/lessons/${lesson.slug}`}>
              <Button size="sm" variant="outline">
                Открыть урок
              </Button>
            </Link>
            <form action={logoutAction}>
              <Button size="sm" type="submit" variant="outline">
                Выйти
              </Button>
            </form>
          </div>
        </header>

        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                Редактор урока
              </Chip>
              <h1 className="mt-4 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                {lesson.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Управление настройками урока, блоками, практикой, тестами и
                вариантами ответов.
              </p>
            </div>
            <Link href={`/lessons/${lesson.slug}`}>
              <Button variant="primary">Открыть урок</Button>
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <Card variant="default" className="border border-black/10">
              <Card.Header>
                <Card.Title>Структура</Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                  {[
                    ["Блоки", lesson.blocks.length],
                    ["Практика", lesson.assignments.length],
                    ["Тесты", lesson.tests.length],
                    [
                      "Вопросы",
                      lesson.tests.reduce(
                        (sum, test) => sum + test.questions.length,
                        0,
                      ),
                    ],
                  ].map(([label, value]) => (
                    <div className="rounded-md bg-white p-3" key={String(label)}>
                      <p className="font-semibold">{value}</p>
                      <p className="text-xs text-[#66736f]">{label}</p>
                    </div>
                  ))}
                </div>
                {[
                  ["Параметры", "#lesson-settings"],
                  ["Блоки", "#blocks"],
                  ["Практика", "#assignments"],
                  ["Тесты", "#tests"],
                ].map(([label, href]) => (
                  <a
                    className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm transition hover:border-[#6f8f85]"
                    href={href}
                    key={label}
                  >
                    {label}
                  </a>
                ))}
              </Card.Content>
            </Card>
          </aside>

          <div className="flex flex-col gap-6">
            <Card
              variant="default"
              className="border border-black/10"
              id="lesson-settings"
            >
              <Card.Header>
                <Card.Title>Параметры урока</Card.Title>
                <Card.Description>
                  Эти поля определяют карточку урока, адрес и публикацию.
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <form
                  action={updateLessonAction.bind(null, lesson.id)}
                  className="grid gap-4"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-medium">
                      Название
                      <input
                        className={inputClass}
                        defaultValue={lesson.title}
                        name="title"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Slug
                      <input
                        className={inputClass}
                        defaultValue={lesson.slug}
                        name="slug"
                        required
                      />
                    </label>
                  </div>
                  <label className="text-sm font-medium">
                    Подзаголовок
                    <input
                      className={inputClass}
                      defaultValue={lesson.subtitle ?? ""}
                      name="subtitle"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Описание
                    <textarea
                      className={textareaClass}
                      defaultValue={lesson.description ?? ""}
                      name="description"
                    />
                  </label>
                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="text-sm font-medium">
                      Тип
                      <KindSelect defaultValue={lesson.kind} />
                    </label>
                    <label className="text-sm font-medium">
                      Статус
                      <StatusSelect defaultValue={lesson.status} />
                    </label>
                    <label className="text-sm font-medium">
                      Порядок
                      <NumberInput defaultValue={lesson.order} min={1} name="order" />
                    </label>
                    <label className="text-sm font-medium">
                      Минуты
                      <NumberInput
                        defaultValue={lesson.durationMinutes}
                        min={1}
                        name="durationMinutes"
                      />
                    </label>
                  </div>
                  <div>
                    <Button type="submit" variant="primary">
                      Сохранить урок
                    </Button>
                  </div>
                </form>
              </Card.Content>
            </Card>

            <Card variant="default" className="border border-black/10" id="blocks">
              <Card.Header>
                <Card.Title>Блоки урока</Card.Title>
                <Card.Description>
                  Это смысловые вкладки урока: цель, объяснение, демонстрация,
                  практика, промпты, проверка и артефакт.
                </Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-col gap-4">
                <form
                  action={createBlockAction.bind(null, lesson.id)}
                  className="rounded-md border border-dashed border-black/20 bg-[#fbfbf8] p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
                    <label className="text-sm font-medium">
                      Новый блок
                      <input className={inputClass} name="title" required />
                    </label>
                    <label className="text-sm font-medium">
                      Тип
                      <BlockTypeSelect defaultValue={LessonBlockType.MARKDOWN} />
                    </label>
                    <label className="text-sm font-medium">
                      Порядок
                      <NumberInput
                        defaultValue={lesson.blocks.length + 1}
                        min={1}
                        name="order"
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm font-medium">
                    Markdown / текст
                    <textarea className={textareaClass} name="contentMd" />
                  </label>
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input name="isPublished" type="checkbox" />
                    Опубликовать блок для ученика
                  </label>
                  <Button className="mt-3" type="submit" variant="primary">
                    Добавить блок
                  </Button>
                </form>

                {lesson.blocks.map((block) => (
                  <form
                    action={updateBlockAction.bind(null, lesson.id, block.id)}
                    className="rounded-md border border-black/10 bg-white p-4"
                    key={block.id}
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
                      <label className="text-sm font-medium">
                        Заголовок
                        <input
                          className={inputClass}
                          defaultValue={block.title}
                          name="title"
                          required
                        />
                      </label>
                      <label className="text-sm font-medium">
                        Тип
                        <BlockTypeSelect defaultValue={block.type} />
                      </label>
                      <label className="text-sm font-medium">
                        Порядок
                        <NumberInput defaultValue={block.order} min={1} name="order" />
                      </label>
                    </div>
                    <label className="mt-3 block text-sm font-medium">
                      Markdown / текст
                      <textarea
                        className={textareaClass}
                        defaultValue={block.contentMd}
                        name="contentMd"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          defaultChecked={block.isPublished}
                          name="isPublished"
                          type="checkbox"
                        />
                        Опубликован
                      </label>
                      <Button type="submit" variant="secondary">
                        Сохранить блок
                      </Button>
                    </div>
                  </form>
                ))}
              </Card.Content>
            </Card>

            <Card
              variant="default"
              className="border border-black/10"
              id="assignments"
            >
              <Card.Header>
                <Card.Title>Практические задания</Card.Title>
                <Card.Description>
                  Здесь задается инструкция, ожидаемый процесс и чек-лист проверки.
                </Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-col gap-4">
                <form
                  action={createAssignmentAction.bind(null, lesson.id)}
                  className="rounded-md border border-dashed border-black/20 bg-[#fbfbf8] p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_170px_120px]">
                    <label className="text-sm font-medium">
                      Новое задание
                      <input className={inputClass} name="title" required />
                    </label>
                    <label className="text-sm font-medium">
                      Статус
                      <StatusSelect defaultValue={PublicationStatus.DRAFT} />
                    </label>
                    <label className="text-sm font-medium">
                      Порядок
                      <NumberInput
                        defaultValue={lesson.assignments.length + 1}
                        min={1}
                        name="order"
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm font-medium">
                    Инструкция
                    <textarea className={textareaClass} name="instructionsMd" />
                  </label>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-medium">
                      Ожидаемый процесс
                      <textarea
                        className={compactTextareaClass}
                        name="expectedProcessMd"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Чек-лист
                      <textarea className={compactTextareaClass} name="checklistMd" />
                    </label>
                  </div>
                  <Button className="mt-3" type="submit" variant="primary">
                    Добавить задание
                  </Button>
                </form>

                {lesson.assignments.map((assignment) => (
                  <form
                    action={updateAssignmentAction.bind(
                      null,
                      lesson.id,
                      assignment.id,
                    )}
                    className="rounded-md border border-black/10 bg-white p-4"
                    key={assignment.id}
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_170px_120px]">
                      <label className="text-sm font-medium">
                        Название
                        <input
                          className={inputClass}
                          defaultValue={assignment.title}
                          name="title"
                          required
                        />
                      </label>
                      <label className="text-sm font-medium">
                        Статус
                        <StatusSelect defaultValue={assignment.status} />
                      </label>
                      <label className="text-sm font-medium">
                        Порядок
                        <NumberInput
                          defaultValue={assignment.order}
                          min={1}
                          name="order"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block text-sm font-medium">
                      Инструкция
                      <textarea
                        className={textareaClass}
                        defaultValue={assignment.instructionsMd}
                        name="instructionsMd"
                      />
                    </label>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="text-sm font-medium">
                        Ожидаемый процесс
                        <textarea
                          className={compactTextareaClass}
                          defaultValue={assignment.expectedProcessMd ?? ""}
                          name="expectedProcessMd"
                        />
                      </label>
                      <label className="text-sm font-medium">
                        Чек-лист
                        <textarea
                          className={compactTextareaClass}
                          defaultValue={assignment.checklistMd ?? ""}
                          name="checklistMd"
                        />
                      </label>
                    </div>
                    <Button className="mt-3" type="submit" variant="secondary">
                      Сохранить задание
                    </Button>
                  </form>
                ))}
              </Card.Content>
            </Card>

            <Card variant="default" className="border border-black/10" id="tests">
              <Card.Header>
                <Card.Title>Тесты и вопросы</Card.Title>
                <Card.Description>
                  Поддержаны типы MVP: один ответ, несколько ответов, сортировка,
                  поиск ошибки и вставка слова.
                </Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-col gap-4">
                <form
                  action={createTestAction.bind(null, lesson.id)}
                  className="rounded-md border border-dashed border-black/20 bg-[#fbfbf8] p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_170px_120px_120px]">
                    <label className="text-sm font-medium">
                      Новый тест
                      <input className={inputClass} name="title" required />
                    </label>
                    <label className="text-sm font-medium">
                      Статус
                      <StatusSelect defaultValue={PublicationStatus.DRAFT} />
                    </label>
                    <label className="text-sm font-medium">
                      Проходной
                      <NumberInput defaultValue={1} min={1} name="passingScore" />
                    </label>
                    <label className="text-sm font-medium">
                      Порядок
                      <NumberInput
                        defaultValue={lesson.tests.length + 1}
                        min={1}
                        name="order"
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm font-medium">
                    Описание
                    <textarea className={compactTextareaClass} name="description" />
                  </label>
                  <Button className="mt-3" type="submit" variant="primary">
                    Добавить тест
                  </Button>
                </form>

                {lesson.tests.map((test) => (
                  <section
                    className="rounded-md border border-black/10 bg-white p-4"
                    key={test.id}
                  >
                    <form action={updateTestAction.bind(null, lesson.id, test.id)}>
                      <div className="grid gap-3 md:grid-cols-[1fr_170px_120px_120px]">
                        <label className="text-sm font-medium">
                          Название теста
                          <input
                            className={inputClass}
                            defaultValue={test.title}
                            name="title"
                            required
                          />
                        </label>
                        <label className="text-sm font-medium">
                          Статус
                          <StatusSelect defaultValue={test.status} />
                        </label>
                        <label className="text-sm font-medium">
                          Проходной
                          <NumberInput
                            defaultValue={test.passingScore}
                            min={1}
                            name="passingScore"
                          />
                        </label>
                        <label className="text-sm font-medium">
                          Порядок
                          <NumberInput defaultValue={test.order} min={1} name="order" />
                        </label>
                      </div>
                      <label className="mt-3 block text-sm font-medium">
                        Описание
                        <textarea
                          className={compactTextareaClass}
                          defaultValue={test.description ?? ""}
                          name="description"
                        />
                      </label>
                      <Button className="mt-3" type="submit" variant="secondary">
                        Сохранить тест
                      </Button>
                    </form>

                    <div className="mt-5 flex flex-col gap-3 border-t border-black/10 pt-4">
                      <form
                        action={createQuestionAction.bind(null, lesson.id, test.id)}
                        className="rounded-md bg-[#f4f4f1] p-3"
                      >
                        <div className="grid gap-3 md:grid-cols-[1fr_180px_100px_100px]">
                          <label className="text-sm font-medium">
                            Новый вопрос
                            <input className={inputClass} name="prompt" required />
                          </label>
                          <label className="text-sm font-medium">
                            Тип
                            <QuestionTypeSelect
                              defaultValue={QuestionType.SINGLE_CHOICE}
                            />
                          </label>
                          <label className="text-sm font-medium">
                            Баллы
                            <NumberInput defaultValue={1} min={1} name="points" />
                          </label>
                          <label className="text-sm font-medium">
                            Порядок
                            <NumberInput
                              defaultValue={test.questions.length + 1}
                              min={1}
                              name="order"
                            />
                          </label>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <label className="text-sm font-medium">
                            Пояснение
                            <textarea
                              className={compactTextareaClass}
                              name="explanation"
                            />
                          </label>
                          <label className="text-sm font-medium">
                            Правильный текст
                            <textarea
                              className={compactTextareaClass}
                              name="correctText"
                            />
                          </label>
                          <label className="text-sm font-medium">
                            Правильный порядок
                            <textarea
                              className={compactTextareaClass}
                              name="correctOrder"
                            />
                          </label>
                        </div>
                        <Button className="mt-3" type="submit" variant="primary">
                          Добавить вопрос
                        </Button>
                      </form>

                      {test.questions.map((question) => (
                        <div
                          className="rounded-md border border-black/10 bg-[#fbfbf8] p-3"
                          key={question.id}
                        >
                          <form
                            action={updateQuestionAction.bind(
                              null,
                              lesson.id,
                              question.id,
                            )}
                          >
                            <div className="grid gap-3 md:grid-cols-[1fr_180px_100px_100px]">
                              <label className="text-sm font-medium">
                                Вопрос
                                <input
                                  className={inputClass}
                                  defaultValue={question.prompt}
                                  name="prompt"
                                  required
                                />
                              </label>
                              <label className="text-sm font-medium">
                                Тип
                                <QuestionTypeSelect defaultValue={question.type} />
                              </label>
                              <label className="text-sm font-medium">
                                Баллы
                                <NumberInput
                                  defaultValue={question.points}
                                  min={1}
                                  name="points"
                                />
                              </label>
                              <label className="text-sm font-medium">
                                Порядок
                                <NumberInput
                                  defaultValue={question.order}
                                  min={1}
                                  name="order"
                                />
                              </label>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                              <label className="text-sm font-medium">
                                Пояснение
                                <textarea
                                  className={compactTextareaClass}
                                  defaultValue={question.explanation ?? ""}
                                  name="explanation"
                                />
                              </label>
                              <label className="text-sm font-medium">
                                Правильный текст
                                <textarea
                                  className={compactTextareaClass}
                                  defaultValue={question.correctText ?? ""}
                                  name="correctText"
                                />
                              </label>
                              <label className="text-sm font-medium">
                                Правильный порядок
                                <textarea
                                  className={compactTextareaClass}
                                  defaultValue={question.correctOrder ?? ""}
                                  name="correctOrder"
                                />
                              </label>
                            </div>
                            <Button className="mt-3" type="submit" variant="secondary">
                              Сохранить вопрос
                            </Button>
                          </form>

                          <div className="mt-4 grid gap-2">
                            <p className="text-sm font-semibold">Варианты ответа</p>
                            {question.options.map((option) => (
                              <form
                                action={updateQuestionOptionAction.bind(
                                  null,
                                  lesson.id,
                                  option.id,
                                )}
                                className="grid gap-2 rounded-md border border-black/10 bg-white p-2 md:grid-cols-[1fr_90px_130px_120px] md:items-end"
                                key={option.id}
                              >
                                <label className="text-sm font-medium">
                                  Текст
                                  <input
                                    className={inputClass}
                                    defaultValue={option.text}
                                    name="text"
                                    required
                                  />
                                </label>
                                <label className="text-sm font-medium">
                                  Порядок
                                  <NumberInput
                                    defaultValue={option.order}
                                    min={1}
                                    name="order"
                                  />
                                </label>
                                <label className="flex items-center gap-2 pb-2 text-sm">
                                  <input
                                    defaultChecked={option.isCorrect}
                                    name="isCorrect"
                                    type="checkbox"
                                  />
                                  Правильный
                                </label>
                                <Button type="submit" variant="secondary">
                                  Сохранить
                                </Button>
                              </form>
                            ))}
                            <form
                              action={createQuestionOptionAction.bind(
                                null,
                                lesson.id,
                                question.id,
                              )}
                              className="grid gap-2 rounded-md border border-dashed border-black/20 bg-white p-2 md:grid-cols-[1fr_90px_130px_120px] md:items-end"
                            >
                              <label className="text-sm font-medium">
                                Новый вариант
                                <input className={inputClass} name="text" required />
                              </label>
                              <label className="text-sm font-medium">
                                Порядок
                                <NumberInput
                                  defaultValue={question.options.length + 1}
                                  min={1}
                                  name="order"
                                />
                              </label>
                              <label className="flex items-center gap-2 pb-2 text-sm">
                                <input name="isCorrect" type="checkbox" />
                                Правильный
                              </label>
                              <Button type="submit" variant="primary">
                                Добавить
                              </Button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </Card.Content>
            </Card>
          </div>
        </section>
      </div>
    </CockpitShell>
  );
}
