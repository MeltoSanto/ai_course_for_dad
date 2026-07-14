import { Chip } from "@heroui/react";
import { PublicationStatus } from "@prisma/client";
import { BookOpen, FolderOpen, Library } from "lucide-react";
import { CockpitShell } from "@/components/cockpit-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function ReferencePage() {
  const user = await requireUser();
  const items = await db.referenceItem.findMany({
    where: {
      status: {
        not: PublicationStatus.ARCHIVED,
      },
    },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });
  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <CockpitShell active="reference" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                База знаний
              </Chip>
              <h1 className="mt-4 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                Справочник
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Короткие прикладные материалы для повторения: правила, рабочие
                схемы, ограничения и подсказки к урокам.
              </p>
            </div>
            <div className="grid min-w-48 rounded-xl border border-[var(--line)] bg-white/82 p-4">
              <Library className="mb-3 text-[var(--signal-green)]" size={24} />
              <p className="text-3xl font-bold">{items.length}</p>
              <p className="text-sm text-[var(--muted)]">материалов</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="cockpit-panel h-max p-4 lg:sticky lg:top-24">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <FolderOpen size={19} />
              Категории
            </h2>
            <div className="grid gap-2">
              {categories.map((category) => (
                <a
                  className="rounded-xl border border-[var(--line)] bg-white/82 px-3 py-3 text-sm font-semibold transition hover:border-[var(--signal-green)] hover:text-[var(--signal-green)]"
                  href={`#${category}`}
                  key={category}
                >
                  {category}
                </a>
              ))}
            </div>
          </aside>

          <div className="grid gap-5">
            {categories.map((category) => {
              const categoryItems = items.filter((item) => item.category === category);

              return (
                <section className="cockpit-panel scroll-mt-28 p-5" id={category} key={category}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold">{category}</h2>
                      <p className="text-sm text-[var(--muted)]">
                        {categoryItems.length} материалов в разделе
                      </p>
                    </div>
                    <Chip variant="soft" color="accent">
                      {categoryItems.length}
                    </Chip>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {categoryItems.map((item) => (
                      <article
                        className="rounded-xl border border-[var(--line)] bg-white/84 p-4"
                        key={item.id}
                      >
                        <div className="mb-3 flex items-start gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e3f5eb] text-[var(--signal-green)]">
                            <BookOpen size={18} />
                          </span>
                          <h3 className="text-lg font-bold">{item.title}</h3>
                        </div>
                        <p className="whitespace-pre-line text-sm leading-7 text-[#383f3b]">
                          {item.contentMd}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </CockpitShell>
  );
}
