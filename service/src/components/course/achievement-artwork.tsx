import Image from "next/image";

const artworkCells: Record<string, readonly [number, number]> = {
  "safe-start": [0, 0],
  "course-finish": [1, 0],
  "step-by-step": [2, 0],
  "long-doc-tamer": [3, 0],
  "ai-team": [0, 1],
  "personal-system": [1, 1],
  "citation-discipline": [2, 1],
  "task-architect": [3, 1],
  "practice-track": [0, 2],
  "jurisdiction-control": [1, 2],
  "first-test": [2, 2],
};

export function AchievementArtwork({
  className = "",
  code,
  isLocked = false,
  variant = "badge",
}: {
  className?: string;
  code: string;
  isLocked?: boolean;
  variant?: "badge" | "celebration";
}) {
  const [column, row] = artworkCells[code] ?? artworkCells["safe-start"];
  const source =
    variant === "badge"
      ? "/achievements/achievement-badges.png"
      : "/achievements/achievement-celebrations.png";
  const rowOffsetPercent = variant === "celebration" ? -84.75 : -100;

  return (
    <span
      aria-hidden="true"
      className={`achievement-artwork achievement-artwork-${variant} ${
        isLocked ? "achievement-artwork-locked" : ""
      } ${className}`}
    >
      <Image
        alt=""
        className="achievement-artwork-sheet"
        height={1152}
        priority={variant === "celebration"}
        src={source}
        style={{
          left: `${column * -100}%`,
          top: `${row * rowOffsetPercent}%`,
        }}
        unoptimized
        width={1536}
      />
    </span>
  );
}
