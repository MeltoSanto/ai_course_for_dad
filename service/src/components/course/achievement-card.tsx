import { Chip } from "@heroui/react";
import { Lock, Sparkles } from "lucide-react";
import { formatShortDate } from "./course-utils";

export function AchievementCard({
  awardedAt,
  description,
  isUnlocked,
  title,
}: {
  awardedAt?: Date | null;
  description: string;
  isUnlocked: boolean;
  title: string;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        isUnlocked
          ? "border-[var(--signal-green)] bg-white shadow-[0_16px_36px_rgba(28,35,29,0.06)]"
          : "border-[var(--line)] bg-[var(--surface-muted)] opacity-75"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`grid size-14 shrink-0 place-items-center rounded-2xl ${
            isUnlocked
              ? "bg-[linear-gradient(135deg,#0a7a48,#064f31)] text-[var(--signal-amber)]"
              : "bg-white text-[var(--muted)]"
          }`}
        >
          {isUnlocked ? <Sparkles size={24} /> : <Lock size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-bold">{title}</h3>
            <Chip variant="soft" color={isUnlocked ? "success" : "default"}>
              {isUnlocked ? "Открыта" : "Закрыта"}
            </Chip>
          </div>
          <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{description}</p>
          {isUnlocked ? (
            <p className="mt-2 text-sm font-semibold text-[var(--signal-green)]">
              Получено: {formatShortDate(awardedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
