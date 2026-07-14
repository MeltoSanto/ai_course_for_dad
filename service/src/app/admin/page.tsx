import { Button, Chip } from "@heroui/react";
import {
  BookOpen,
  Boxes,
  ClipboardList,
  FilePlus2,
  Library,
  Pencil,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { createLessonAction } from "@/app/admin/actions";
import { CockpitShell } from "@/components/cockpit-shell";
import { getAdminDashboard, kindLabels, statusLabels } from "@/lib/course";
import { requireAdmin } from "@/lib/session";

const inputClass =
  "mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--signal-green)] focus:ring-2 focus:ring-emerald-100";
const textareaClass = `${inputClass} min-h-24 resize-y leading-6`;

const adminSections = [
  ["Уроки", "Маршрут, статусы, блоки", "/admin", BookOpen],
  ["Справочник", "ReferenceItem", "/admin/library#reference", Library],
  ["Глоссарий", "GlossaryTerm", "/admin/library#glossary", ClipboardList],
  ["Сценарии", "Scenario", "/admin/library#scenarios", Boxes],
  ["Ачивки", "Achievement", "/admin/library#achievements", Trophy],
] as const;

export default async function AdminPage() {
  const user = await requireAdmin();
  const dashboard = await getAdminDashboard();

  return (
    <CockpitShell active="admin" continueHref="/" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                Админка автора
              </Chip>
              <h1 className="mt-4 text-4xl font-bold tracking-normal text-black sm:text-5xl">
                Управление материалами курса
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Здесь создаются уроки, блоки, практика, тесты, справочник,
                сценарии и достижения.
              </p>
            </div>
            <a href="#new-lesson">
              <Button variant="primary">
                <FilePlus2 size={17} />
                Новый урок
              </Button>
            </a>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Уроки", dashboard.totals.lessons],
              ["Блоки", dashboard.totals.blocks],
              ["Практика", dashboard.totals.assignments],
              ["Тесты", dashboard.totals.tests],
              ["Вопросы", dashboard.totals.questions],
            ].map(([label, value]) => (
              <div
                className="rounded-xl border border-[var(--line)] bg-white/82 p-4"
                key={String(label)}
              >
                <p className="text-sm text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="cockpit-panel p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Материалы курса</h2>
                <p className="text-sm text-[var(--muted)]">
                  {dashboard.statusCounts.PUBLISHED ?? 0} опубликовано ·{" "}
                  {dashboard.statusCounts.DRAFT ?? 0} черновиков ·{" "}
                  {dashboard.statusCounts.ARCHIVED ?? 0} в архиве
                </p>
              </div>
              <Chip variant="soft" color="accent">
                {dashboard.totals.students} ученик
              </Chip>
            </div>

            <div className="grid gap-3">
              {dashboard.lessons.map((lesson) => (
                <div
                  className="grid gap-4 rounded-xl border border-[var(--line)] bg-white/82 p-4 lg:grid-cols-[64px_1fr_310px] lg:items-center"
                  key={lesson.id}
                >
                  <div className="grid size-14 place-items-center rounded-xl bg-[var(--sidebar)] text-base font-bold text-white">
                    {lesson.order}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Chip variant="soft" color="default">
                        {kindLabels[lesson.kind]}
                      </Chip>
                      <Chip
                        variant="soft"
                        color={lesson.status === "PUBLISHED" ? "success" : "warning"}
                      >
                        {statusLabels[lesson.status]}
                      </Chip>
                    </div>
                    <h3 className="font-bold">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {lesson.subtitle}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      {[
                        ["Блоки", lesson._count.blocks],
                        ["Практ.", lesson._count.assignments],
                        ["Тесты", lesson._count.tests],
                        ["Прогр.", lesson._count.progresses],
                      ].map(([label, value]) => (
                        <div
                          className="rounded-lg bg-[var(--surface-muted)] px-2 py-2"
                          key={String(label)}
                        >
                          <p className="font-bold">{value}</p>
                          <p className="text-xs text-[var(--muted)]">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Link className="flex-1" href={`/admin/lessons/${lesson.id}`}>
                        <Button fullWidth variant="secondary">
                          <Pencil size={16} />
                          Редактировать
                        </Button>
                      </Link>
                      <Link href={`/lessons/${lesson.slug}`}>
                        <Button variant="outline">Открыть</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <section className="cockpit-panel p-5" id="new-lesson">
              <h2 className="text-xl font-bold">Новый урок</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Создайте оболочку урока, затем заполните блоки, практику и тесты.
              </p>
              <form action={createLessonAction} className="mt-4 flex flex-col gap-3">
                <label className="text-sm font-semibold">
                  Название
                  <input className={inputClass} name="title" required />
                </label>
                <label className="text-sm font-semibold">
                  Slug
                  <input className={inputClass} name="slug" placeholder="new-lesson" />
                </label>
                <label className="text-sm font-semibold">
                  Подзаголовок
                  <input className={inputClass} name="subtitle" />
                </label>
                <label className="text-sm font-semibold">
                  Описание
                  <textarea className={textareaClass} name="description" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm font-semibold">
                    Тип
                    <select className={inputClass} name="kind">
                      <option value="CORE">Основной</option>
                      <option value="EXTRA">Дополнительный</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Статус
                    <select className={inputClass} name="status">
                      <option value="DRAFT">Черновик</option>
                      <option value="PUBLISHED">Опубликован</option>
                      <option value="ARCHIVED">Архив</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm font-semibold">
                    Порядок
                    <input
                      className={inputClass}
                      defaultValue={dashboard.totals.lessons + 1}
                      min="1"
                      name="order"
                      type="number"
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Минуты
                    <input
                      className={inputClass}
                      defaultValue="30"
                      min="1"
                      name="durationMinutes"
                      type="number"
                    />
                  </label>
                </div>
                <Button type="submit" variant="primary">
                  Создать и открыть
                </Button>
              </form>
            </section>

            <section className="cockpit-panel p-5">
              <h2 className="mb-3 text-xl font-bold">Разделы</h2>
              <div className="grid gap-2">
                {adminSections.map(([title, meta, href, Icon]) => (
                  <Link
                    className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white/82 p-3 transition hover:border-[var(--signal-green)]"
                    href={href}
                    key={title}
                  >
                    <Icon className="text-[var(--signal-green)]" size={20} />
                    <span>
                      <span className="block font-bold">{title}</span>
                      <span className="text-sm text-[var(--muted)]">{meta}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </CockpitShell>
  );
}
