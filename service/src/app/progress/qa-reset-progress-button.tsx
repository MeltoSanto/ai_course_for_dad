"use client";

import { Button } from "@heroui/react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  resetQaProgressAction,
  type ResetQaProgressState,
} from "@/app/actions/progress";

const initialState: ResetQaProgressState = {
  status: "idle",
};

export function QaResetProgressButton() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    resetQaProgressAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const isConfirmed = window.confirm(
      "Сбросить весь QA-прогресс? Будут удалены отмеченные блоки, практика, попытки тестов и ачивки только пользователя qa.",
    );

    if (!isConfirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className="mt-4" onSubmit={handleSubmit}>
      <Button
        isDisabled={isPending}
        type="submit"
        variant="danger"
      >
        <RotateCcw aria-hidden="true" size={16} />
        {isPending ? "Сбрасываю..." : "Сбросить QA-прогресс"}
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
