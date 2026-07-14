import { Chip } from "@heroui/react";
import { PublicationStatus } from "@prisma/client";
import { BookMarked, Hash, Tags } from "lucide-react";
import { CockpitShell } from "@/components/cockpit-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function GlossaryPage() {
  const user = await requireUser();
  const terms = await db.glossaryTerm.findMany({
    where: {
      status: {
        not: PublicationStatus.ARCHIVED,
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return (
    <CockpitShell active="reference" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                Термины курса
              </Chip>
              <h1 className="mt-4 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                Глоссарий
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Быстрые определения и контекст к понятиям, которые встречаются в
                уроках, практике и проверках.
              </p>
            </div>
            <div className="grid min-w-48 rounded-xl border border-[var(--line)] bg-white/82 p-4">
              <Tags className="mb-3 text-[var(--signal-green)]" size={24} />
              <p className="text-3xl font-bold">{terms.length}</p>
              <p className="text-sm text-[var(--muted)]">терминов</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {terms.map((term) => (
            <article className="cockpit-panel p-5" key={term.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e3f4f1] text-[var(--signal-teal)]">
                    <BookMarked size={18} />
                  </span>
                  <h2 className="text-xl font-bold">{term.term}</h2>
                </div>
                <Chip variant="soft" color="default">
                  <Hash size={13} />
                  {term.order}
                </Chip>
              </div>
              <div className="text-sm leading-7 text-[#383f3b]">
                <p>{term.definition}</p>
                {term.contentMd ? <p className="mt-3">{term.contentMd}</p> : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </CockpitShell>
  );
}
