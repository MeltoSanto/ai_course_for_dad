import { Check, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";

export type TimelineStep = {
  href?: string;
  id: string;
  label: string;
  meta?: string;
  state: "done" | "active" | "todo";
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function ProgressDonut({
  label = "маршрута пройдено",
  value,
}: {
  label?: string;
  value: number;
}) {
  const percent = clampPercent(value);
  const inProgress = percent >= 100 ? 0 : Math.min(22, 100 - percent);
  const inProgressEnd = Math.min(100, percent + inProgress);
  const remaining = Math.max(0, 100 - percent - inProgress);

  return (
    <div className="flex items-center gap-5">
      <div
        aria-label={`Прогресс ${percent}%`}
        className="relative grid size-36 place-items-center rounded-full"
        role="img"
        style={{
          background: `conic-gradient(var(--signal-green) 0 ${percent}%, var(--signal-amber) ${percent}% ${inProgressEnd}%, #dedbd2 ${inProgressEnd}% 100%)`,
        }}
      >
        <div className="grid size-[104px] place-items-center rounded-full bg-white text-center shadow-inner">
          <div>
            <p className="text-3xl font-bold leading-none">{percent}%</p>
            <p className="mt-1 text-xs leading-4 text-[var(--muted)]">{label}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[var(--signal-green)]" />
          <span className="text-[var(--muted)]">Пройдено</span>
          <strong>{percent}%</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[var(--signal-amber)]" />
          <span className="text-[var(--muted)]">В процессе</span>
          <strong>{inProgress}%</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#d7d3c8]" />
          <span className="text-[var(--muted)]">Осталось</span>
          <strong>{remaining}%</strong>
        </div>
      </div>
    </div>
  );
}

function markerClass(state: TimelineStep["state"]) {
  if (state === "done") {
    return "border-[var(--signal-green)] bg-[var(--signal-green)] text-white";
  }

  if (state === "active") {
    return "border-[var(--signal-green)] bg-white text-[var(--signal-green)] shadow-[0_0_0_6px_rgba(7,108,62,0.08)]";
  }

  return "border-[var(--line-strong)] bg-white text-[var(--foreground)]";
}

export function TimelineRail({
  steps,
}: {
  steps: TimelineStep[];
}) {
  return (
    <ol className="flex overflow-x-auto px-2 py-2">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const marker = (
          <span
            className={`relative z-10 grid size-10 place-items-center rounded-full border text-sm font-bold ${markerClass(
              step.state,
            )}`}
          >
            {step.state === "done" ? (
              <Check size={18} />
            ) : step.state === "todo" ? (
              index + 1
            ) : (
              <span>{index + 1}</span>
            )}
          </span>
        );

        return (
          <li className="relative min-w-[124px] flex-1 text-center" key={step.id}>
            {!isLast ? (
              <span
                className={`absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-[26px] h-px ${
                  step.state === "done"
                    ? "bg-[var(--signal-green)]"
                    : "bg-[var(--line-strong)]"
                }`}
              />
            ) : null}
            <div className="flex flex-col items-center gap-2">
              {step.href ? <Link href={step.href}>{marker}</Link> : marker}
              <div className="max-w-[112px]">
                <p
                  className={`text-xs font-semibold leading-4 ${
                    step.state === "active"
                      ? "text-[var(--signal-green)]"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {step.label}
                </p>
                {step.meta ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">{step.meta}</p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusRow({
  href,
  label,
  meta,
}: {
  href?: string;
  label: string;
  meta: string;
}) {
  const content = (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-3 last:border-b-0">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs leading-4 text-[var(--muted)]">{meta}</p>
      </div>
      {href ? (
        <ChevronRight className="shrink-0 text-[var(--muted)]" size={18} />
      ) : (
        <Lock className="shrink-0 text-[var(--muted)]" size={17} />
      )}
    </div>
  );

  return href ? (
    <Link className="block transition hover:text-[var(--signal-green)]" href={href}>
      {content}
    </Link>
  ) : (
    content
  );
}
