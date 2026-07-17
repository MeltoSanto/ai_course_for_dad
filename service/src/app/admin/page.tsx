import { Chip } from "@heroui/react/chip";
import {
  ArrowRight,
  BookOpen,
  Library,
  Settings2,
  Trophy,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { CockpitShell } from "@/components/cockpit-shell";
import { getAdminDashboard } from "@/lib/course";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

type AdminActionCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  metrics: Array<[string, number]>;
};

export default async function AdminPage() {
  const user = await requireAdmin();
  const [dashboard, accountCount, activeAccountCount] = await Promise.all([
    getAdminDashboard(),
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
  ]);

  const cards: AdminActionCard[] = [
    {
      title: "Уроки и содержание",
      description: "Создание уроков, блоков, практики и тестов.",
      href: "/admin/lessons",
      icon: BookOpen,
      metrics: [["Уроков", dashboard.totals.lessons], ["Блоков", dashboard.totals.blocks]],
    },
    {
      title: "Аккаунты",
      description: "Пользователи, роли, пароли и блокировка доступа.",
      href: "/admin/accounts",
      icon: UserCog,
      metrics: [["Всего", accountCount], ["Активно", activeAccountCount]],
    },
    {
      title: "Прогресс и посещения",
      description: "Статистика учеников, время обучения и сброс прогресса.",
      href: "/admin/progress",
      icon: UsersRound,
      metrics: [["Учеников", dashboard.totals.students], ["Ачивок", dashboard.totals.achievements]],
    },
    {
      title: "Справочник и библиотека",
      description: "Справочные материалы, глоссарий и сценарии.",
      href: "/admin/library",
      icon: Library,
      metrics: [["Статей", dashboard.totals.references], ["Терминов", dashboard.totals.glossary]],
    },
    {
      title: "Достижения",
      description: "Настройка ачивок и проверка их выдачи.",
      href: "/admin/library#achievements",
      icon: Trophy,
      metrics: [["Ачивок", dashboard.totals.achievements], ["Сценариев", dashboard.totals.scenarios]],
    },
  ];

  return (
    <CockpitShell active="admin" continueHref="/" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <Chip variant="soft" color="accent">
            <Settings2 size={15} />
            Пульт администратора
          </Chip>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Что нужно сделать?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Выберите раздел. Длинные списки и формы открываются только после перехода в нужный инструмент.
          </p>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ title, description, href, icon: Icon, metrics }) => (
            <Link
              className="group cockpit-panel flex min-h-52 flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:border-[var(--signal-green)] hover:shadow-lg"
              href={href}
              key={title}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-[var(--signal-green)]">
                    <Icon size={23} />
                  </span>
                  <ArrowRight className="text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--signal-green)]" size={20} />
                </div>
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {metrics.map(([label, value]) => (
                  <div className="rounded-lg bg-[var(--surface-muted)] px-3 py-2" key={label}>
                    <strong className="block text-lg">{value}</strong>
                    <span className="text-xs text-[var(--muted)]">{label}</span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </CockpitShell>
  );
}
