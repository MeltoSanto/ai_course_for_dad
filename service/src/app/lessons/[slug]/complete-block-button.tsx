"use client";

import { completeBlockAction } from "@/app/actions/progress";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CompleteBlockButtonProps = {
  blockId: string;
  isCompleted: boolean;
  lessonId: string;
  slug: string;
};

const SCROLL_OFFSET = 112;
const MIN_SCROLL_DURATION = 1800;
const MAX_SCROLL_DURATION = 3200;

function easeInOutSine(progress: number) {
  return 0.5 - Math.cos(Math.PI * progress) / 2;
}

function getScrollDuration(distance: number) {
  return Math.min(
    MAX_SCROLL_DURATION,
    Math.max(MIN_SCROLL_DURATION, Math.round(Math.abs(distance) * 1.05)),
  );
}

function scrollToHash(targetHash: string) {
  const targetId = targetHash.replace(/^#/, "");
  const target = document.getElementById(targetId);

  if (!target) {
    return Promise.resolve();
  }

  const startY = window.scrollY;
  const targetY = Math.max(
    0,
    startY + target.getBoundingClientRect().top - SCROLL_OFFSET,
  );
  const distance = targetY - startY;

  if (Math.abs(distance) < 4) {
    window.scrollTo(0, targetY);
    return Promise.resolve();
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion) {
    window.scrollTo(0, targetY);
    return Promise.resolve();
  }

  const duration = getScrollDuration(distance);

  return new Promise<void>((resolve) => {
    const startedAt = performance.now();

    function frame(now: number) {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutSine(progress);

      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        window.requestAnimationFrame(frame);
        return;
      }

      window.scrollTo(0, targetY);
      resolve();
    }

    window.requestAnimationFrame(frame);
  });
}

function replaceHash(targetHash: string) {
  const url = new URL(window.location.href);
  url.hash = targetHash;
  window.history.replaceState(null, "", url);
}

export function CompleteBlockButton({
  blockId,
  isCompleted,
  lessonId,
  slug,
}: CompleteBlockButtonProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const [failed, setFailed] = useState(false);
  const disabled = isSaving || completed;

  async function completeBlock() {
    if (disabled) {
      return;
    }

    setFailed(false);
    setIsSaving(true);

    try {
      const result = await completeBlockAction(lessonId, blockId, slug);

      if (!result?.targetHash) {
        setFailed(true);
        return;
      }

      setCompleted(true);
      setIsSaving(false);
      await scrollToHash(result.targetHash);
      replaceHash(result.targetHash);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      aria-label={
        completed
          ? "Блок уже отмечен готовым"
          : isSaving
            ? "Сохраняю готовность блока"
            : failed
              ? "Не удалось отметить блок готовым"
            : "Отметить блок готовым"
      }
      className="lesson-submit-button"
      disabled={disabled}
      type="button"
      onClick={completeBlock}
    >
      {isSaving ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
      ) : (
        <Check aria-hidden="true" size={16} />
      )}
      {completed
        ? "Готово отмечено"
        : isSaving
          ? "Сохраняю..."
          : failed
            ? "Не сохранилось"
            : "Готово"}
    </button>
  );
}
