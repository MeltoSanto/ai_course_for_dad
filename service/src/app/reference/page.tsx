import { Chip } from "@heroui/react";
import { PublicationStatus } from "@prisma/client";
import { BookOpenText, Languages, Library, Shapes } from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import {
  localizedReferenceTitle,
  localizeReferenceContent,
  referenceMaterialType,
  referenceTopicFor,
  referenceUseCase,
  REFERENCE_TOPICS,
} from "@/lib/reference-catalog";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ReferenceCatalog } from "./reference-catalog";

type ReferencePageProps = {
  searchParams: Promise<{ search?: string | string[] }>;
};

export default async function ReferencePage({ searchParams }: ReferencePageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const initialQuery = typeof params.search === "string" ? params.search.slice(0, 120) : "";
  const sourceItems = await db.referenceItem.findMany({
    where: {
      status: PublicationStatus.PUBLISHED,
    },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });
  const items = sourceItems.map((item) => {
    const topic = referenceTopicFor(item.slug);

    return {
      content: localizeReferenceContent(item.contentMd),
      id: item.id,
      order: item.order,
      title: localizedReferenceTitle(item.slug, item.title),
      topic,
      type: referenceMaterialType(item.category, item.slug),
      whenUseful: referenceUseCase(topic),
    };
  });

  return (
    <CockpitShell active="reference" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                База знаний простыми словами
              </Chip>
              <h1 className="mt-4 text-3xl font-bold tracking-normal text-black sm:text-5xl">
                Справочник по работе с ИИ
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                Здесь собраны практические памятки, понятные объяснения и проверенные источники.
                Найдите нужную тему по обычным словам — технические названия знать не нужно.
              </p>
            </div>
            <div className="grid min-w-56 grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--line)] bg-white/82 p-4">
                <Library className="mb-3 text-[var(--signal-green)]" size={24} />
                <p className="text-3xl font-bold">{items.length}</p>
                <p className="text-sm text-[var(--muted)]">материала</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white/82 p-4">
                <Shapes className="mb-3 text-[var(--signal-teal)]" size={24} />
                <p className="text-3xl font-bold">{REFERENCE_TOPICS.length}</p>
                <p className="text-sm text-[var(--muted)]">понятных тем</p>
              </div>
            </div>
          </div>

          <nav aria-label="Разделы базы знаний" className="reference-section-nav mt-6">
            <Link aria-current="page" className="is-active" href="/reference">
              <BookOpenText aria-hidden="true" size={20} />
              Практические материалы
            </Link>
            <Link href="/glossary">
              <Languages aria-hidden="true" size={20} />
              Словарь терминов
            </Link>
          </nav>
        </section>

        <ReferenceCatalog initialQuery={initialQuery} items={items} topics={REFERENCE_TOPICS} />
      </div>
    </CockpitShell>
  );
}
