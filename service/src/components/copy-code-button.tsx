"use client";

import { useCopyText } from "@/hooks/use-copy-text";
import { Check, Copy } from "lucide-react";

type CopyCodeButtonProps = {
  content: string;
};

export function CopyCodeButton({ content }: CopyCodeButtonProps) {
  const {
    copied,
    copyFromClick,
    copyFromKeyboard,
    copyFromPointer,
    copyState,
  } = useCopyText(content);
  const failed = copyState === "failed";

  return (
    <span className="copy-action">
      <button
        aria-label={
          copied
            ? "Промпт скопирован"
            : failed
              ? "Не удалось скопировать промпт"
              : "Скопировать промпт"
        }
        className="markdown-code-copy"
        type="button"
        onClick={copyFromClick}
        onKeyDown={copyFromKeyboard}
        onPointerDown={copyFromPointer}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Скопировано" : failed ? "Не скопировано" : "Копировать"}
      </button>
      <span
        aria-live="polite"
        className={`copy-action-status ${
          copied ? "is-visible is-success" : failed ? "is-visible is-error" : ""
        }`}
        role="status"
      >
        {copied ? "В буфере" : failed ? "Браузер заблокировал" : ""}
      </span>
    </span>
  );
}
