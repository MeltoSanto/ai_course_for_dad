export function lessonHref(slug: string, lastBlockId?: string | null) {
  return `/lessons/${slug}${lastBlockId ? `#block-${lastBlockId}` : ""}`;
}

export function progressTone(percent: number) {
  if (percent >= 100) {
    return "success" as const;
  }

  if (percent > 0) {
    return "accent" as const;
  }

  return "default" as const;
}

export function testPercent(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100);
}

export function formatShortDate(date: Date | null | undefined) {
  if (!date) {
    return "Пока нет";
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}

export function formatFullDate(date: Date | null | undefined) {
  if (!date) {
    return "Пока нет";
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}
