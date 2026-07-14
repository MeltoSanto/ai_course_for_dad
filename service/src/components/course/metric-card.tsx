import type { LucideIcon } from "lucide-react";

const toneClasses = {
  amber: "border-amber-200/80 bg-amber-50/80 text-amber-700",
  green: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
  slate: "border-[var(--line)] bg-white/82 text-[var(--foreground)]",
};

export function MetricCard({
  icon: Icon,
  label,
  meta,
  tone = "green",
  value,
}: {
  icon: LucideIcon;
  label: string;
  meta?: string;
  tone?: keyof typeof toneClasses;
  value: string | number;
}) {
  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
        <Icon size={20} />
      </div>
      <p className="text-3xl font-bold text-[var(--foreground)]">{value}</p>
      {meta ? <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{meta}</p> : null}
    </div>
  );
}
