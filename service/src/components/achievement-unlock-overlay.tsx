"use client";

import { Button } from "@heroui/react";
import { Sparkles, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AchievementArtwork } from "@/components/course/achievement-artwork";

type UnlockAchievement = {
  awardedAt: string;
  code: string;
  description: string;
  id: string;
  title: string;
};

export function AchievementUnlockOverlay({
  achievement,
  userId,
}: {
  achievement: UnlockAchievement | null;
  userId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const eventId = useMemo(
    () =>
      achievement
        ? `${achievement.id}:${achievement.awardedAt}`
        : null,
    [achievement],
  );

  useEffect(() => {
    if (!eventId) {
      return;
    }

    const storageKey = `achievement-celebrated:${userId}`;
    const seenEvent = window.localStorage.getItem(storageKey);

    if (seenEvent !== eventId) {
      window.localStorage.setItem(storageKey, eventId);
      const openTimer = window.setTimeout(() => setIsOpen(true), 0);
      return () => window.clearTimeout(openTimer);
    }
  }, [eventId, userId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!achievement || !isOpen) {
    return null;
  }

  return (
    <div
      aria-label={`Получено достижение: ${achievement.title}`}
      aria-modal="true"
      className="achievement-unlock-backdrop"
      role="dialog"
    >
      <button
        aria-label="Закрыть"
        className="achievement-unlock-close"
        onClick={() => setIsOpen(false)}
        type="button"
      >
        <X size={22} />
      </button>

      <div className="achievement-unlock-spark achievement-unlock-spark-one">
        <Sparkles size={38} />
      </div>
      <div className="achievement-unlock-spark achievement-unlock-spark-two">
        <Sparkles size={28} />
      </div>
      <div className="achievement-unlock-spark achievement-unlock-spark-three">
        <Sparkles size={32} />
      </div>

      <div className="achievement-unlock-dialog">
        <div className="achievement-unlock-kicker">
          <Trophy size={18} />
          Новое достижение
        </div>

        <AchievementArtwork
          className="achievement-unlock-image"
          code={achievement.code}
          variant="celebration"
        />

        <h2>{achievement.title}</h2>
        <p>{achievement.description}</p>

        <div className="achievement-unlock-actions">
          <Button onPress={() => setIsOpen(false)} variant="primary">
            Отлично!
          </Button>
          <Link href="/achievements" onClick={() => setIsOpen(false)}>
            <Button variant="outline">Все достижения</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
