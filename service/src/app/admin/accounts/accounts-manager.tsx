"use client";

import { Button } from "@heroui/react/button";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import {
  changeAccountPasswordAction,
  createAccountAction,
  deleteAccountAction,
  toggleAccountStatusAction,
  updateAccountAction,
  type AccountActionState,
} from "@/app/admin/accounts/actions";

type AccountRow = {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "STUDENT";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  counts: {
    lessons: number;
    sessions: number;
  };
};

const initialState: AccountActionState = { status: "idle" };
const inputClass =
  "mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--signal-green)] focus:ring-2 focus:ring-emerald-100";
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Ещё не входил";
}

function ActionMessage({ state }: { state: AccountActionState }) {
  if (!state.message) return null;

  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm font-medium ${
        state.status === "success"
          ? "bg-emerald-50 text-emerald-800"
          : "bg-red-50 text-red-700"
      }`}
      role="status"
    >
      {state.message}
    </p>
  );
}

function CreateAccountForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createAccountAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="grid gap-4" ref={formRef}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Имя пользователя
          <input className={inputClass} name="displayName" placeholder="Роман" required />
        </label>
        <label className="text-sm font-semibold">
          Логин
          <input
            autoComplete="off"
            className={inputClass}
            name="username"
            placeholder="roman"
            required
          />
        </label>
        <label className="text-sm font-semibold">
          Начальный пароль
          <input
            autoComplete="new-password"
            className={inputClass}
            minLength={4}
            name="password"
            placeholder="Можно простой пароль"
            required
            type="password"
          />
        </label>
        <label className="text-sm font-semibold">
          Роль
          <select className={inputClass} defaultValue="STUDENT" name="role">
            <option value="STUDENT">Ученик</option>
            <option value="ADMIN">Администратор</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Минимум 4 символа. Требований к цифрам, регистру и специальным символам нет.
      </p>
      <ActionMessage state={state} />
      <Button isDisabled={isPending} type="submit" variant="primary">
        <UserPlus size={17} />
        {isPending ? "Создаю..." : "Создать аккаунт"}
      </Button>
    </form>
  );
}

function AccountEditor({
  account,
  isCurrent,
}: {
  account: AccountRow;
  isCurrent: boolean;
}) {
  const router = useRouter();
  const [updateState, updateAction, isUpdating] = useActionState(
    updateAccountAction,
    initialState,
  );
  const [passwordState, passwordAction, isChangingPassword] = useActionState(
    changeAccountPasswordAction,
    initialState,
  );
  const [statusState, statusAction, isChangingStatus] = useActionState(
    toggleAccountStatusAction,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteAccountAction,
    initialState,
  );

  useEffect(() => {
    if (
      [updateState, passwordState, statusState, deleteState].some(
        (state) => state.status === "success",
      )
    ) {
      router.refresh();
    }
  }, [deleteState, passwordState, router, statusState, updateState]);

  function confirmDelete(event: React.FormEvent<HTMLFormElement>) {
    if (
      !window.confirm(
        `Удалить аккаунт ${account.displayName}? Будут удалены его прогресс, история входов и статистика.`,
      )
    ) {
      event.preventDefault();
    }
  }

  function confirmStatus(event: React.FormEvent<HTMLFormElement>) {
    const action = account.isActive ? "Заблокировать" : "Разблокировать";
    if (!window.confirm(`${action} аккаунт ${account.displayName}?`)) {
      event.preventDefault();
    }
  }

  return (
    <article className="cockpit-panel min-w-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[var(--signal-green)]">
            {account.role === "ADMIN" ? <ShieldCheck size={21} /> : <UserRound size={21} />}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{account.displayName}</h2>
            <p className="truncate text-sm text-[var(--muted)]">@{account.username}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            account.isActive
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-100 text-red-700"
          }`}
        >
          {account.isActive ? "Активен" : "Заблокирован"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-[var(--surface-muted)] p-3">
          <span className="text-[var(--muted)]">Роль</span>
          <strong className="mt-1 block">
            {account.role === "ADMIN" ? "Администратор" : "Ученик"}
          </strong>
        </div>
        <div className="rounded-lg bg-[var(--surface-muted)] p-3">
          <span className="text-[var(--muted)]">Последний вход</span>
          <strong className="mt-1 block">{formatDate(account.lastLoginAt)}</strong>
        </div>
        <div className="rounded-lg bg-[var(--surface-muted)] p-3">
          <span className="text-[var(--muted)]">Входов</span>
          <strong className="mt-1 block">{account.counts.sessions}</strong>
        </div>
        <div className="rounded-lg bg-[var(--surface-muted)] p-3">
          <span className="text-[var(--muted)]">Уроков в прогрессе</span>
          <strong className="mt-1 block">{account.counts.lessons}</strong>
        </div>
      </div>

      <details className="group mt-4 rounded-xl border border-[var(--line)] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-sm font-bold">
          Данные аккаунта
          <ChevronDown className="transition group-open:rotate-180" size={17} />
        </summary>
        <form action={updateAction} className="grid gap-3 border-t border-[var(--line)] p-3">
          <input name="userId" type="hidden" value={account.id} />
          <label className="text-sm font-semibold">
            Имя
            <input className={inputClass} defaultValue={account.displayName} name="displayName" required />
          </label>
          <label className="text-sm font-semibold">
            Логин
            <input className={inputClass} defaultValue={account.username} name="username" required />
          </label>
          <label className="text-sm font-semibold">
            Роль
            <select
              className={inputClass}
              defaultValue={account.role}
              disabled={isCurrent}
              name="role"
            >
              <option value="STUDENT">Ученик</option>
              <option value="ADMIN">Администратор</option>
            </select>
            {isCurrent ? <input name="role" type="hidden" value="ADMIN" /> : null}
          </label>
          <ActionMessage state={updateState} />
          <Button isDisabled={isUpdating} type="submit" variant="secondary">
            <Save size={16} />
            {isUpdating ? "Сохраняю..." : "Сохранить данные"}
          </Button>
        </form>
      </details>

      <details className="group mt-3 rounded-xl border border-[var(--line)] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-sm font-bold">
          Изменить пароль
          <ChevronDown className="transition group-open:rotate-180" size={17} />
        </summary>
        <form action={passwordAction} className="grid gap-3 border-t border-[var(--line)] p-3">
          <input name="userId" type="hidden" value={account.id} />
          <label className="text-sm font-semibold">
            Новый пароль
            <input
              autoComplete="new-password"
              className={inputClass}
              minLength={4}
              name="password"
              required
              type="password"
            />
          </label>
          <p className="text-xs text-[var(--muted)]">
            После смены пароля все активные входы этого пользователя завершатся.
          </p>
          <ActionMessage state={passwordState} />
          <Button isDisabled={isChangingPassword} type="submit" variant="secondary">
            <KeyRound size={16} />
            {isChangingPassword ? "Меняю..." : "Сменить пароль"}
          </Button>
        </form>
      </details>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <form action={statusAction} onSubmit={confirmStatus}>
          <input name="userId" type="hidden" value={account.id} />
          <Button
            fullWidth
            isDisabled={isCurrent || isChangingStatus}
            type="submit"
            variant={account.isActive ? "outline" : "secondary"}
          >
            {account.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
            {account.isActive ? "Заблокировать" : "Разблокировать"}
          </Button>
        </form>
        <form action={deleteAction} onSubmit={confirmDelete}>
          <input name="userId" type="hidden" value={account.id} />
          <Button
            fullWidth
            isDisabled={isCurrent || isDeleting}
            type="submit"
            variant="danger"
          >
            <Trash2 size={16} />
            Удалить
          </Button>
        </form>
      </div>
      <ActionMessage state={statusState.status !== "idle" ? statusState : deleteState} />
      {isCurrent ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          Собственный аккаунт нельзя заблокировать, удалить или лишить роли администратора.
        </p>
      ) : null}
    </article>
  );
}

export function AccountsManager({
  accounts,
  currentUserId,
}: {
  accounts: AccountRow[];
  currentUserId: string;
}) {
  return (
    <div className="grid gap-5">
      <section className="cockpit-panel p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-[var(--signal-green)]">
            <UserPlus size={21} />
          </span>
          <div>
            <h2 className="text-xl font-bold">Новый аккаунт</h2>
            <p className="text-sm text-[var(--muted)]">Создайте ученика или ещё одного администратора.</p>
          </div>
        </div>
        <CreateAccountForm />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Все аккаунты</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Всего: {accounts.length}</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {accounts.map((account) => (
            <AccountEditor
              account={account}
              isCurrent={account.id === currentUserId}
              key={account.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
