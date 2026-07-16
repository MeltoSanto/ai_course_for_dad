"use client";

import { Button } from "@heroui/react";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      fullWidth
      isDisabled={pending}
      size="lg"
      type="submit"
      variant="primary"
    >
      <LogIn size={18} />
      {pending ? "Входим..." : "Войти"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <section className="cockpit-panel w-full p-6 sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-semibold text-[var(--signal-green)]">
          Доступ к курсу
        </p>
        <h2 className="mt-2 text-2xl font-bold">Вход в курс</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Введите своё имя и личный пароль. Регистр букв не имеет значения.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="text-sm font-semibold">
          Имя
          <input
            autoComplete="username"
            className="cockpit-input mt-2"
            name="username"
            placeholder="Введите своё имя"
            required
            type="text"
          />
        </label>

        <label className="text-sm font-semibold">
          Пароль
          <input
            autoComplete="current-password"
            className="cockpit-input mt-2"
            name="password"
            placeholder="Введите свой личный пароль"
            required
            type="password"
          />
        </label>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </section>
  );
}
