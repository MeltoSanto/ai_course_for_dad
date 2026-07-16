import { Chip } from "@heroui/react/chip";
import { Lock } from "lucide-react";
import { AchievementArtwork } from "./achievement-artwork";
import { formatShortDate } from "./course-utils";

export function AchievementCard({
  awardedAt,
  code,
  description,
  isUnlocked,
  title,
}: {
  awardedAt?: Date | null;
  code: string;
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
        <div className="relative size-20 shrink-0 sm:size-24">
          <AchievementArtwork code={code} isLocked={!isUnlocked} />
          {!isUnlocked ? (
            <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full border-2 border-white bg-[var(--sidebar)] text-white shadow-lg">
              <Lock size={15} />
            </span>
          ) : null}
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
