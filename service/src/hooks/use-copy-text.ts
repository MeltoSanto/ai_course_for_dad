"use client";

import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type CopyState = "idle" | "copied" | "failed";

export function useCopyText(content: string) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimerRef = useRef<number | null>(null);
  const skipNextClickRef = useRef(false);

  const copy = useCallback(async () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    const copied = await copyTextToClipboard(content);

    setCopyState(copied ? "copied" : "failed");
    resetTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
      resetTimerRef.current = null;
    }, 2200);
  }, [content]);

  const copyFromPointer = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      skipNextClickRef.current = true;
      void copy();
    },
    [copy],
  );

  const copyFromKeyboard = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      skipNextClickRef.current = true;
      void copy();
    },
    [copy],
  );

  const copyFromClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (skipNextClickRef.current) {
        skipNextClickRef.current = false;
        return;
      }

      void copy();
    },
    [copy],
  );

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return {
    copied: copyState === "copied",
    copyFromClick,
    copyFromKeyboard,
    copyFromPointer,
    copyState,
  };
}
