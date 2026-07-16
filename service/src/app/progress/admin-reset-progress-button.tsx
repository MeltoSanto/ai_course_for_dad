"use client";

import { Button } from "@heroui/react/button";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  resetAdminProgressAction,
  type ResetAdminProgressState,
} from "@/app/actions/progress";

const initialState: ResetAdminProgressState = {
  status: "idle",
};

export function AdminResetProgressButton() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    resetAdminProgressAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const isConfirmed = window.confirm(
      "Сбросить весь тестовый прогресс текущего администратора? Будут удалены отмеченные блоки, практика, попытки тестов и полученные ачивки. Материалы курса не изменятся.",
    );

    if (!isConfirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className="mt-4" onSubmit={handleSubmit}>
      <Button isDisabled={isPending} type="submit" variant="danger">
        <RotateCcw aria-hidden="true" size={16} />
        {isPending ? "Сбрасываю..." : "Сбросить тестовый прогресс"}
      </Button>
      {state.message ? (
        <p
          className={`mt-3 text-sm font-medium ${
            state.status === "success" ? "text-emerald-700" : "text-red-700"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
