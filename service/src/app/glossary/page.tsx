import { Chip } from "@heroui/react";
import { PublicationStatus } from "@prisma/client";
import { BookOpenText, Languages, Tags } from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import { db } from "@/lib/db";
import { glossaryDisplayName } from "@/lib/glossary";
import { requireUser } from "@/lib/session";
import { GlossaryCatalog } from "./glossary-catalog";

const GLOSSARY_TOPICS = [
  "Основы работы с ИИ",
  "Запросы и формат ответа",
  "Документы, факты и источники",
  "ИИ-агенты и роли",
  "Проверка качества",
  "Безопасность данных",
] as const;

function glossaryTopicFor(term: string) {
  if (/данн|идентифик|аноним|псевдоним|обезлич|суррогат|метадан|коммерчески|минимизация/i.test(term)) return GLOSSARY_TOPICS[5];
  if (/агент|оркестратор|планировщик|оппонент|извлекатель|проверяющий|handoff|human-in|reflection|роль модели/i.test(term)) return GLOSSARY_TOPICS[3];
  if (/документ|цитат|источник|норм|правов|факт|потеря середины|grounding|привязка|проект НПА/i.test(term)) return GLOSSARY_TOPICS[2];
  if (/промпт|ТЗ|контекст|огранич|формат|сценарий|few-shot|граница задачи|команда ФИНАЛ|роль$/i.test(term)) return GLOSSARY_TOPICS[1];
  if (/критери|провер|оцен|качест|галлюцин|hallucination|статус|ошиб|недостаточно|противореч|покрытие/i.test(term)) return GLOSSARY_TOPICS[4];
  return GLOSSARY_TOPICS[0];
}

type GlossaryPageProps = {
  searchParams: Promise<{ search?: string | string[] }>;
};

export default async function GlossaryPage({ searchParams }: GlossaryPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const initialQuery = typeof params.search === "string" ? params.search.slice(0, 120) : "";
  const terms = await db.glossaryTerm.findMany({
    where: {
      status: PublicationStatus.PUBLISHED,
    },
    orderBy: {
      order: "asc",
    },
  });
  const catalogItems = terms.map((term) => ({
    content: term.contentMd,
    definition: term.definition,
    id: term.id,
    order: term.order,
    term: glossaryDisplayName(term.term),
    topic: glossaryTopicFor(term.term),
  }));

  return (
    <CockpitShell active="reference" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                Термины без сложных формулировок
              </Chip>
              <h1 className="mt-4 text-3xl font-bold tracking-normal text-black sm:text-5xl">
                Словарь терминов простыми словами
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                Здесь объясняются слова, которые встречаются в уроках. Сначала дан понятный русский
                смысл, а профессиональное название указано в скобках.
              </p>
            </div>
            <div className="grid min-w-48 rounded-xl border border-[var(--line)] bg-white/82 p-4">
              <Tags className="mb-3 text-[var(--signal-green)]" size={24} />
              <p className="text-3xl font-bold">{terms.length}</p>
              <p className="text-sm text-[var(--muted)]">терминов</p>
            </div>
          </div>

          <nav aria-label="Разделы базы знаний" className="reference-section-nav mt-6">
            <Link href="/reference">
              <BookOpenText aria-hidden="true" size={20} />
              Практические материалы
            </Link>
            <Link aria-current="page" className="is-active" href="/glossary">
              <Languages aria-hidden="true" size={20} />
              Словарь терминов
            </Link>
          </nav>
        </section>

        <GlossaryCatalog initialQuery={initialQuery} items={catalogItems} topics={GLOSSARY_TOPICS} />
      </div>
    </CockpitShell>
  );
}
