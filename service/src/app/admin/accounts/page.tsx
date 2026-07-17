import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { ArrowLeft, UsersRound } from "lucide-react";
import Link from "next/link";
import { AccountsManager } from "@/app/admin/accounts/accounts-manager";
import { CockpitShell } from "@/components/cockpit-shell";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function AdminAccountsPage() {
  const user = await requireAdmin();
  const accounts = await db.user.findMany({
    orderBy: [{ role: "asc" }, { displayName: "asc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
      accessSessions: {
        orderBy: { signedInAt: "desc" },
        take: 1,
        select: { signedInAt: true },
      },
      _count: {
        select: {
          lessonProgresses: true,
          accessSessions: true,
        },
      },
    },
  });

  return (
    <CockpitShell active="admin" continueHref="/admin" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Chip variant="soft" color="accent">
                <UsersRound size={15} />
                Доступ к курсу
              </Chip>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Управление аккаунтами</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Создавайте пользователей, меняйте их данные и пароли, блокируйте или удаляйте доступ.
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">
                <ArrowLeft size={16} />
                К пульту админки
              </Button>
            </Link>
          </div>
        </section>

        <div className="mt-5">
          <AccountsManager
            accounts={accounts.map((account) => ({
              id: account.id,
              username: account.username,
              displayName: account.displayName,
              role: account.role,
              isActive: account.isActive,
              createdAt: account.createdAt.toISOString(),
              lastLoginAt: account.accessSessions[0]?.signedInAt.toISOString() ?? null,
              counts: {
                lessons: account._count.lessonProgresses,
                sessions: account._count.accessSessions,
              },
            }))}
            currentUserId={user.id}
          />
        </div>
      </div>
    </CockpitShell>
  );
}
