import { Button } from "@heroui/react";
import {
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronDown,
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
import type { CurrentUser } from "@/lib/session";

export type CockpitNavKey =
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

export function CockpitShell({
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
  const visibleNavItems =
    user.role === "ADMIN"
      ? navItems
      : navItems.filter((item) => item.key !== "admin");

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen lg:grid-cols-[220px_1fr]">
        <aside className="cockpit-sidebar flex flex-col justify-between px-4 py-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <div>
            <Link className="mb-8 flex items-center gap-3 px-3" href="/">
              <span className="flex size-10 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-300">
                <BrainCircuit size={24} />
              </span>
              <span className="text-base font-bold tracking-normal">AI Учебник</span>
            </Link>

            <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
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
          <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(248,247,242,0.82)] px-5 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1520px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[var(--signal-green)] text-sm font-bold text-white shadow-[0_10px_24px_rgba(7,108,62,0.22)]">
                  {initials(user.displayName)}
                </div>
                <button className="flex items-center gap-2 text-sm font-semibold">
                  {user.displayName}
                  <ChevronDown size={16} />
                </button>
              </div>

              <label className="flex min-h-12 w-full max-w-2xl items-center gap-3 rounded-xl border border-[var(--line)] bg-white/92 px-4 shadow-[0_12px_30px_rgba(28,35,29,0.04)]">
                <Search className="text-[var(--muted)]" size={20} />
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                  placeholder="Поиск по урокам, темам, справочнику..."
                  type="search"
                />
                <kbd className="hidden rounded-md border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-1 text-xs text-[var(--muted)] sm:block">
                  Ctrl K
                </kbd>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/progress">
                  <Button isIconOnly aria-label="Открыть историю прогресса" variant="outline">
                    <BarChart3 size={18} />
                  </Button>
                </Link>
                <Button isIconOnly aria-label="Уведомления" variant="outline">
                  <Bell size={18} />
                </Button>
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

          <div className="mx-auto max-w-[1520px] px-5 py-5 sm:px-6 lg:px-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
