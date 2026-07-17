"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { sendUserActivity } from "@/components/user-activity-tracker";

const HEARTBEAT_MS = 15_000;
const IDLE_AFTER_MS = 5 * 60_000;

type LessonActivityContextValue = {
  flushBlock: (blockId: string) => Promise<void>;
};

const LessonActivityContext = createContext<LessonActivityContextValue>({
  flushBlock: async () => undefined,
});

export function useLessonActivity() {
  return useContext(LessonActivityContext);
}

export function LessonActivityProvider({
  blockIds,
  children,
  lessonId,
}: {
  blockIds: string[];
  children: ReactNode;
  lessonId: string;
}) {
  const pathname = usePathname();
  const activeBlockRef = useRef<string | null>(null);
  const lastInteractionAtRef = useRef(0);
  const lastTickAtRef = useRef(0);

  const postBlockActivity = useCallback(
    async (blockId: string, activeSeconds: number, blockOpened = false) => {
      await sendUserActivity({
        path: pathname,
        lessonId,
        blockId,
        activeSeconds,
        blockOpened,
      });
    },
    [lessonId, pathname],
  );

  const flushBlock = useCallback(
    async (blockId: string) => {
      const now = Date.now();
      const isActive =
        activeBlockRef.current === blockId &&
        document.visibilityState === "visible" &&
        now - lastInteractionAtRef.current <= IDLE_AFTER_MS;
      const elapsedSeconds = isActive
        ? Math.max(0, Math.min(30, Math.round((now - lastTickAtRef.current) / 1000)))
        : 0;

      lastTickAtRef.current = now;

      if (elapsedSeconds > 0) {
        await postBlockActivity(blockId, elapsedSeconds);
      }
    },
    [postBlockActivity],
  );

  useEffect(() => {
    lastInteractionAtRef.current = Date.now();
    lastTickAtRef.current = Date.now();

    const ratios = new Map<string, number>();

    function selectActiveBlock() {
      let nextBlock: string | null = null;
      let bestRatio = 0;

      for (const blockId of blockIds) {
        const ratio = ratios.get(blockId) ?? 0;
        if (ratio > bestRatio) {
          nextBlock = blockId;
          bestRatio = ratio;
        }
      }

      if (!nextBlock || nextBlock === activeBlockRef.current) return;

      const previousBlock = activeBlockRef.current;
      if (previousBlock) void flushBlock(previousBlock);

      activeBlockRef.current = nextBlock;
      lastTickAtRef.current = Date.now();
      void postBlockActivity(nextBlock, 0, true);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const blockId = (entry.target as HTMLElement).dataset.lessonBlockId;
          if (blockId) ratios.set(blockId, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        selectActiveBlock();
      },
      {
        rootMargin: "-96px 0px -18% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const blockId of blockIds) {
      const element = document.querySelector<HTMLElement>(
        `[data-lesson-block-id="${CSS.escape(blockId)}"]`,
      );
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [blockIds, flushBlock, postBlockActivity]);

  useEffect(() => {
    function noteInteraction() {
      lastInteractionAtRef.current = Date.now();
    }

    function heartbeat() {
      const blockId = activeBlockRef.current;
      if (blockId) void flushBlock(blockId);
    }

    function handleVisibilityChange() {
      const blockId = activeBlockRef.current;
      if (document.visibilityState === "hidden" && blockId) {
        void flushBlock(blockId);
      } else {
        noteInteraction();
        lastTickAtRef.current = Date.now();
      }
    }

    const interactionEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, noteInteraction, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = window.setInterval(heartbeat, HEARTBEAT_MS);

    return () => {
      window.clearInterval(interval);
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, noteInteraction),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      const blockId = activeBlockRef.current;
      if (blockId) void flushBlock(blockId);
    };
  }, [flushBlock]);

  const value = useMemo(
    () => ({ flushBlock }),
    [flushBlock],
  );

  return (
    <LessonActivityContext.Provider value={value}>
      {children}
    </LessonActivityContext.Provider>
  );
}
