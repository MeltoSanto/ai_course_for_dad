import { Chip } from "@heroui/react/chip";
import { PublicationStatus } from "@prisma/client";
import {
  BookOpen,
  BookOpenText,
  ChevronRight,
  ClipboardCheck,
  Code2,
  FileText,
  Languages,
  LayoutGrid,
  Search,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import { markdownToPlainText } from "@/components/markdown-content";
import { db } from "@/lib/db";
import { glossaryDisplayName } from "@/lib/glossary";
import {
  localizedReferenceTitle,
  localizeReferenceContent,
  referenceTopicFor,
} from "@/lib/reference-catalog";
import { requireUser } from "@/lib/session";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

type ResultKind =
  | "Разделы сайта"
  | "Уроки"
  | "Практические задания"
  | "Тесты"
  | "Справочник"
  | "Словарь терминов"
  | "Сценарии";

type SearchResult = {
  description: string;
  href: string;
  kind: ResultKind;
  searchText: string;
  title: string;
};

const GROUPS: Array<{ icon: LucideIcon; kind: ResultKind }> = [
  { icon: LayoutGrid, kind: "Разделы сайта" },
  { icon: BookOpen, kind: "Уроки" },
  { icon: Code2, kind: "Практические задания" },
  { icon: ClipboardCheck, kind: "Тесты" },
  { icon: BookOpenText, kind: "Справочник" },
  { icon: Languages, kind: "Словарь терминов" },
  { icon: FileText, kind: "Сценарии" },
];

const SITE_SECTIONS: SearchResult[] = [
  { description: "Учебный маршрут и продолжение обучения.", href: "/", kind: "Разделы сайта", searchText: "главная маршрут продолжить обучение", title: "Главная" },
  { description: "Все основные и дополнительные уроки курса.", href: "/lessons", kind: "Разделы сайта", searchText: "уроки курс обучение", title: "Уроки" },
  { description: "Практические задания из всех уроков.", href: "/practice", kind: "Разделы сайта", searchText: "практика задания упражнения", title: "Практика" },
  { description: "Все проверки знаний и история попыток.", href: "/tests", kind: "Разделы сайта", searchText: "тесты вопросы проверка знаний", title: "Тесты" },
  { description: "Памятки, инструкции и проверенные источники.", href: "/reference", kind: "Разделы сайта", searchText: "справочник материалы инструкции памятки источники", title: "Справочник" },
  { description: "Понятные объяснения профессиональных терминов.", href: "/glossary", kind: "Разделы сайта", searchText: "словарь термины определения слова", title: "Словарь терминов" },
  { description: "Сохранённые результаты и пройденные уроки.", href: "/progress", kind: "Разделы сайта", searchText: "прогресс история результаты", title: "История прогресса" },
];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replaceAll("ё", "е")
    .replace(/[_–—-]+/g, " ")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchable(result: SearchResult, query: string) {
  const haystack = normalize(`${result.title} ${result.description} ${result.searchText}`);
  return normalize(query).split(" ").filter(Boolean).every((token) => haystack.includes(token));
}

function resultRank(result: SearchResult, query: string) {
  const title = normalize(result.title);
  const normalizedQuery = normalize(query);
  if (title === normalizedQuery) return 0;
  if (title.startsWith(normalizedQuery)) return 1;
  if (title.includes(normalizedQuery)) return 2;
  return 3;
}

function shortText(value: string, maxLength = 220) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength).trimEnd()}…` : clean;
}

function resultWord(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "результатов";
  if (last === 1) return "результат";
  if (last >= 2 && last <= 4) return "результата";
  return "результатов";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 120);

  const [lessons, assignments, tests, references, terms, scenarios] = await Promise.all([
    db.lesson.findMany({
      where: { status: PublicationStatus.PUBLISHED },
      include: { blocks: { where: { isPublished: true }, select: { contentMd: true, title: true } } },
      orderBy: { order: "asc" },
    }),
    db.assignment.findMany({
      where: { status: PublicationStatus.PUBLISHED, lesson: { status: PublicationStatus.PUBLISHED } },
      include: { lesson: { select: { order: true, slug: true, title: true } } },
      orderBy: { order: "asc" },
    }),
    db.lessonTest.findMany({
      where: { status: PublicationStatus.PUBLISHED, lesson: { status: PublicationStatus.PUBLISHED } },
      include: {
        lesson: { select: { order: true, slug: true, title: true } },
        questions: { select: { prompt: true } },
      },
      orderBy: { order: "asc" },
    }),
    db.referenceItem.findMany({ where: { status: PublicationStatus.PUBLISHED }, orderBy: { order: "asc" } }),
    db.glossaryTerm.findMany({ where: { status: PublicationStatus.PUBLISHED }, orderBy: { order: "asc" } }),
    db.scenario.findMany({ where: { status: PublicationStatus.PUBLISHED }, orderBy: { order: "asc" } }),
  ]);

  const dynamicResults: SearchResult[] = [
    ...lessons.map((lesson) => ({
      description: shortText(lesson.description ?? lesson.subtitle ?? `Урок ${lesson.order}`),
      href: `/lessons/${lesson.slug}`,
      kind: "Уроки" as const,
      searchText: [lesson.subtitle, lesson.description, ...lesson.blocks.flatMap((block) => [block.title, markdownToPlainText(block.contentMd)])].filter(Boolean).join(" "),
      title: `Урок ${lesson.order}: ${lesson.title}`,
    })),
    ...assignments.map((assignment) => ({
      description: shortText(markdownToPlainText(assignment.instructionsMd)),
      href: `/lessons/${assignment.lesson.slug}#practice`,
      kind: "Практические задания" as const,
      searchText: `${assignment.lesson.title} ${assignment.expectedProcessMd ?? ""} ${assignment.checklistMd ?? ""}`,
      title: assignment.title,
    })),
    ...tests.map((test) => ({
      description: shortText(test.description ?? `Проверка знаний к уроку «${test.lesson.title}».`),
      href: `/lessons/${test.lesson.slug}#tests`,
      kind: "Тесты" as const,
      searchText: `${test.lesson.title} ${test.questions.map((question) => question.prompt).join(" ")}`,
      title: test.title,
    })),
    ...references.map((item) => {
      const title = localizedReferenceTitle(item.slug, item.title);
      const content = markdownToPlainText(localizeReferenceContent(item.contentMd));
      return {
        description: shortText(content),
        href: `/reference?search=${encodeURIComponent(query || title)}`,
        kind: "Справочник" as const,
        searchText: `${referenceTopicFor(item.slug)} ${item.category} ${content}`,
        title,
      };
    }),
    ...terms.map((term) => ({
      description: shortText(`${term.definition} ${term.contentMd ? markdownToPlainText(term.contentMd) : ""}`),
      href: `/glossary?search=${encodeURIComponent(query || term.term)}`,
      kind: "Словарь терминов" as const,
      searchText: `${term.term} ${term.definition} ${term.contentMd ?? ""}`,
      title: glossaryDisplayName(term.term),
    })),
    ...scenarios.map((scenario) => ({
      description: shortText(scenario.summary ?? markdownToPlainText(scenario.contentMd)),
      href: "/scenarios",
      kind: "Сценарии" as const,
      searchText: markdownToPlainText(scenario.contentMd),
      title: scenario.title,
    })),
  ];

  const results = query
    ? [...SITE_SECTIONS, ...dynamicResults]
        .filter((result) => searchable(result, query))
        .sort((left, right) => resultRank(left, query) - resultRank(right, query) || left.title.localeCompare(right.title, "ru"))
        .slice(0, 80)
    : [];

  return (
    <CockpitShell active="search" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <Chip variant="soft" color="accent">Общий поиск</Chip>
          <h1 className="mt-4 text-3xl font-bold text-black sm:text-5xl">Поиск по всему сайту</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
            Ищите обычными словами: поиск проверит уроки, задания, тесты, справочник,
            словарь терминов и рабочие сценарии.
          </p>
          <form action="/search" className="site-search-form mt-6" method="get">
            <Search aria-hidden="true" size={23} />
            <input
              aria-label="Что найти на сайте"
              autoFocus
              defaultValue={query}
              name="q"
              placeholder="Например: как проверить факты в ответе ИИ"
              type="search"
            />
            <button type="submit">Найти</button>
          </form>
        </section>

        {!query ? (
          <section className="cockpit-panel mt-5 p-6 text-center">
            <Search aria-hidden="true" className="mx-auto text-[var(--signal-green)]" size={34} />
            <h2 className="mt-3 text-2xl font-bold">Введите слово или фразу</h2>
            <p className="mt-2 text-base text-[var(--muted)]">Например: «обезличивание», «цитаты» или «длинный документ».</p>
          </section>
        ) : results.length ? (
          <div className="mt-5 grid gap-5">
            <p aria-live="polite" className="text-base font-bold">Найдено {results.length} {resultWord(results.length)} по запросу «{query}»</p>
            {GROUPS.map(({ icon: Icon, kind }) => {
              const groupResults = results.filter((result) => result.kind === kind);
              if (!groupResults.length) return null;
              return (
                <section className="site-search-group cockpit-panel" key={kind}>
                  <div className="site-search-group-title">
                    <Icon aria-hidden="true" size={21} />
                    <h2>{kind}</h2>
                    <span>{groupResults.length}</span>
                  </div>
                  <div>
                    {groupResults.map((result) => (
                      <Link className="site-search-result" href={result.href} key={`${result.kind}-${result.href}-${result.title}`}>
                        <div>
                          <h3>{result.title}</h3>
                          <p>{result.description}</p>
                        </div>
                        <ChevronRight aria-hidden="true" size={22} />
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="cockpit-panel mt-5 grid justify-items-center gap-3 p-8 text-center" role="status">
            <Search aria-hidden="true" className="text-[var(--signal-green)]" size={34} />
            <h2 className="text-2xl font-bold">Ничего не найдено</h2>
            <p className="max-w-xl text-base leading-7 text-[var(--muted)]">Попробуйте убрать лишние слова или написать запрос проще.</p>
          </section>
        )}
      </div>
    </CockpitShell>
  );
}
