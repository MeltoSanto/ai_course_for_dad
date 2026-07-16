import { Button } from "@heroui/react";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  ClipboardCheck,
  Code2,
  Gauge,
  Library,
  LogOut,
  Map,
  Play,
  Search,
  Settings2,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { AchievementUnlockOverlay } from "@/components/achievement-unlock-overlay";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";

export type CockpitNavKey =
  | "search"
  | "progress"
  | "route"
  | "lessons"
  | "practice"
  | "tests"
  | "reference"
  | "achievements"
  | "admin";

type NavItem = {
  key: CockpitNavKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { key: "route", label: "Главная", href: "/", icon: Map },
  { key: "lessons", label: "Уроки", href: "/lessons", icon: BookOpen },
  { key: "practice", label: "Практика", href: "/practice", icon: Code2 },
  { key: "tests", label: "Тесты", href: "/tests", icon: ClipboardCheck },
  { key: "reference", label: "Справочник", href: "/reference", icon: Library },
  { key: "achievements", label: "Ачивки", href: "/achievements", icon: Trophy },
  { key: "admin", label: "Админка", href: "/admin", icon: Settings2 },
];

function navItemClass(isActive: boolean) {
  return [
    "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition",
    isActive
      ? "bg-[linear-gradient(135deg,#0f7b47,#075c35)] text-white shadow-[0_12px_30px_rgba(7,92,53,0.32)]"
      : "text-white/78 hover:bg-white/8 hover:text-white",
  ].join(" ");
}

function initials(displayName: string) {
  return displayName.trim().slice(0, 1).toUpperCase() || "U";
}

export async function CockpitShell({
  active,
  children,
  continueHref = "/",
  user,
}: {
  active: CockpitNavKey;
  children: React.ReactNode;
  continueHref?: string;
  user: CurrentUser;
}) {
  const latestAchievement = await db.userAchievement.findFirst({
    where: {
      userId: user.id,
      achievement: {
        isActive: true,
      },
    },
    include: {
      achievement: true,
    },
    orderBy: {
      awardedAt: "desc",
    },
  });
  const visibleNavItems =
    user.role === "ADMIN"
      ? navItems
      : navItems.filter((item) => item.key !== "admin");

  return (
    <main className="min-h-screen min-w-0 max-w-full bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="cockpit-sidebar flex min-w-0 max-w-full flex-col justify-between px-4 py-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <div>
            <Link className="mb-8 flex items-center gap-3 px-3" href="/">
              <span className="flex size-10 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-300">
                <BrainCircuit size={24} />
              </span>
              <span className="text-base font-bold tracking-normal">AI Учебник</span>
            </Link>

            <nav className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={navItemClass(isActive)}
                    href={item.href}
                    key={item.key}
                  >
                    <Icon
                      className={isActive ? "text-white" : "text-white/82"}
                      size={22}
                      strokeWidth={2}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70 lg:block">
            <div className="mb-2 flex items-center gap-2 text-white">
              <Gauge size={16} />
              <span className="font-semibold">Учебный cockpit</span>
            </div>
            <p className="leading-5">
              Сервер хранит прогресс, тесты и место остановки ученика.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 min-w-0 max-w-full border-b border-[var(--line)] bg-[rgba(248,247,242,0.82)] px-5 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex min-w-0 max-w-[1520px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div
                aria-label={`Текущий пользователь: ${user.displayName}`}
                className="flex min-w-0 items-center gap-3"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-[var(--signal-green)] text-sm font-bold text-white shadow-[0_10px_24px_rgba(7,108,62,0.22)]">
                  {initials(user.displayName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user.displayName}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {user.role === "ADMIN" ? "Автор курса" : "Ученик"}
                  </p>
                </div>
              </div>

              <form
                action="/search"
                className="flex min-h-12 w-full min-w-0 max-w-2xl items-center gap-3 rounded-xl border border-[var(--line)] bg-white/92 px-4 text-sm font-semibold text-[var(--muted)] shadow-[0_12px_30px_rgba(28,35,29,0.04)] transition hover:border-[var(--signal-green)] hover:text-[var(--signal-green-strong)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(7,108,62,0.28)]"
                method="get"
              >
                <Search className="text-[var(--muted)]" size={20} />
                <input
                  aria-label="Поиск по всему сайту"
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[var(--foreground)] outline-none placeholder:font-medium placeholder:text-[var(--muted)]"
                  name="q"
                  placeholder="Поиск по всему сайту"
                  type="search"
                />
                <button
                  className="hidden min-h-9 items-center rounded-lg bg-[var(--surface-muted)] px-3 font-bold text-[var(--signal-green-strong)] transition hover:bg-[#e3f5eb] sm:inline-flex"
                  type="submit"
                >
                  Найти
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/progress">
                  <Button className="font-bold" variant="outline">
                    <BarChart3 size={18} />
                    Мой прогресс
                  </Button>
                </Link>
                <Link href={continueHref}>
                  <Button
                    className="min-w-40 bg-[var(--signal-green)] font-semibold text-white shadow-[0_14px_30px_rgba(7,108,62,0.24)]"
                    variant="primary"
                  >
                    Продолжить
                    <Play fill="currentColor" size={16} />
                  </Button>
                </Link>
                <form action={logoutAction}>
                  <Button isIconOnly aria-label="Выйти" type="submit" variant="outline">
                    <LogOut size={18} />
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <div className="mx-auto min-w-0 max-w-[1520px] px-5 py-5 sm:px-6 lg:px-8">
            {children}
          </div>
        </section>
      </div>
      <AchievementUnlockOverlay
        achievement={
          latestAchievement
            ? {
                awardedAt: latestAchievement.awardedAt.toISOString(),
                code: latestAchievement.achievement.code,
                description: latestAchievement.achievement.description,
                id: latestAchievement.achievement.id,
                title: latestAchievement.achievement.title,
              }
            : null
        }
        userId={user.id}
      />
    </main>
  );
}
