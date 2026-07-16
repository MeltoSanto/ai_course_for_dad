import { Chip } from "@heroui/react/chip";
import { PublicationStatus } from "@prisma/client";
import { ClipboardList, Code2, Workflow } from "lucide-react";
import { CockpitShell } from "@/components/cockpit-shell";
import { MarkdownContent } from "@/components/markdown-content";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function ScenariosPage() {
  const user = await requireUser();
  const scenarios = await db.scenario.findMany({
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
    <CockpitShell active="practice" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                Рабочие сценарии
              </Chip>
              <h1 className="mt-4 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                Сценарии
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Готовые схемы работы с ИИ: можно брать как шаблон для практики,
                адаптировать под задачу и проверять результат.
              </p>
            </div>
            <div className="grid min-w-48 rounded-xl border border-[var(--line)] bg-white/82 p-4">
              <Workflow className="mb-3 text-[var(--signal-green)]" size={24} />
              <p className="text-3xl font-bold">{scenarios.length}</p>
              <p className="text-sm text-[var(--muted)]">сценариев</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <article className="cockpit-panel p-5" key={scenario.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <Chip variant="soft" color="accent">
                  Сценарий {scenario.order}
                </Chip>
                <ClipboardList className="text-[var(--signal-green)]" size={20} />
              </div>
              <h2 className="text-xl font-bold">{scenario.title}</h2>
              {scenario.summary ? (
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {scenario.summary}
                </p>
              ) : null}
              <div className="prompt-console mt-4 p-4 text-sm leading-7 text-[#383f3b]">
                <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--signal-green)]">
                  <Code2 size={16} />
                  Шаблон
                </div>
                <MarkdownContent compact content={scenario.contentMd} tone="prompt" />
              </div>
            </article>
          ))}
        </section>
      </div>
    </CockpitShell>
  );
}
