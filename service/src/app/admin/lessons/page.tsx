import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { ArrowLeft, BookOpen, FilePlus2, Pencil } from "lucide-react";
import Link from "next/link";
import { createLessonAction } from "@/app/admin/actions";
import { CockpitShell } from "@/components/cockpit-shell";
import { getAdminDashboard, kindLabels, statusLabels } from "@/lib/course";
import { requireAdmin } from "@/lib/session";

const inputClass =
  "mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--signal-green)] focus:ring-2 focus:ring-emerald-100";
const textareaClass = `${inputClass} min-h-24 resize-y leading-6`;

export default async function AdminLessonsPage() {
  const user = await requireAdmin();
  const dashboard = await getAdminDashboard();

  return (
    <CockpitShell active="admin" continueHref="/admin" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                <BookOpen size={15} />
                Материалы курса
              </Chip>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Управление уроками</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Создавайте уроки и переходите к редактированию блоков, практики и тестов.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin">
                <Button variant="outline">
                  <ArrowLeft size={16} />
                  К пульту
                </Button>
              </Link>
              <a href="#new-lesson">
                <Button variant="primary">
                  <FilePlus2 size={16} />
                  Новый урок
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Уроки", dashboard.totals.lessons],
              ["Блоки", dashboard.totals.blocks],
              ["Практика", dashboard.totals.assignments],
              ["Тесты", dashboard.totals.tests],
            ].map(([label, value]) => (
              <div className="rounded-xl border border-[var(--line)] bg-white/82 p-4" key={String(label)}>
                <p className="text-sm text-[var(--muted)]">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="cockpit-panel p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Все уроки</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {dashboard.statusCounts.PUBLISHED ?? 0} опубликовано · {dashboard.statusCounts.DRAFT ?? 0} черновиков
              </p>
            </div>
            <div className="grid gap-3">
              {dashboard.lessons.map((lesson) => (
                <article
                  className="grid gap-4 rounded-xl border border-[var(--line)] bg-white/82 p-4 lg:grid-cols-[56px_minmax(0,1fr)_280px] lg:items-center"
                  key={lesson.id}
                >
                  <div className="grid size-12 place-items-center rounded-xl bg-[var(--sidebar)] font-bold text-white">
                    {lesson.order}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Chip variant="soft" color="default">{kindLabels[lesson.kind]}</Chip>
                      <Chip variant="soft" color={lesson.status === "PUBLISHED" ? "success" : "warning"}>
                        {statusLabels[lesson.status]}
                      </Chip>
                    </div>
                    <h3 className="font-bold">{lesson.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{lesson.subtitle}</p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                      {[
                        ["Блоки", lesson._count.blocks],
                        ["Практ.", lesson._count.assignments],
                        ["Тесты", lesson._count.tests],
                        ["Прогр.", lesson._count.progresses],
                      ].map(([label, value]) => (
                        <div className="rounded-lg bg-[var(--surface-muted)] px-1 py-2" key={String(label)}>
                          <strong className="block">{value}</strong>
                          <span className="text-[var(--muted)]">{label}</span>
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
                </article>
              ))}
            </div>
          </div>

          <aside className="cockpit-panel h-fit p-5 xl:sticky xl:top-24" id="new-lesson">
            <h2 className="text-xl font-bold">Новый урок</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Сначала создайте оболочку, затем наполните её материалами.</p>
            <form action={createLessonAction} className="mt-4 grid gap-3">
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
                  <input className={inputClass} defaultValue={dashboard.totals.lessons + 1} min="1" name="order" type="number" />
                </label>
                <label className="text-sm font-semibold">
                  Минуты
                  <input className={inputClass} defaultValue="30" min="1" name="durationMinutes" type="number" />
                </label>
              </div>
              <Button type="submit" variant="primary">Создать и открыть</Button>
            </form>
          </aside>
        </section>
      </div>
    </CockpitShell>
  );
}
