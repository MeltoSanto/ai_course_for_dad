import { Chip } from "@heroui/react";
import type { AchievementTriggerType } from "@prisma/client";
import { Award, Lock, Sparkles, Trophy } from "lucide-react";
import { CockpitShell } from "@/components/cockpit-shell";
import { AchievementCard } from "@/components/course/achievement-card";
import { MetricCard } from "@/components/course/metric-card";
import {
  getStudentAchievementCenter,
  getStudentDashboard,
} from "@/lib/course";
import { requireUser } from "@/lib/session";

const triggerLabels: Record<AchievementTriggerType, string> = {
  LESSON_COMPLETED: "Урок",
  PRACTICE_COMPLETED: "Практика",
  TEST_PASSED: "Тест",
  SCENARIO_SAVED: "Сценарий",
  MANUAL: "Вручную",
};

export default async function AchievementsPage() {
  const user = await requireUser();
  const [dashboard, achievementCenter] = await Promise.all([
    getStudentDashboard(user.id),
    getStudentAchievementCenter(user.id),
  ]);
  const continueLesson = dashboard.continueLesson;
  const continueHref = continueLesson ? `/lessons/${continueLesson.slug}` : "/lessons";

  return (
    <CockpitShell active="achievements" continueHref={continueHref} user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <section className="cockpit-panel p-5 sm:p-7">
          <div className="flex flex-wrap gap-2">
            <Chip variant="soft" color="success">
              Достижения
            </Chip>
            <Chip variant="soft" color="accent">
              Механика готова к расширению
            </Chip>
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-normal text-black sm:text-5xl">
            Ачивки
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Здесь отдельный экран достижений: что уже открыто, что ещё закрыто и
            за какой тип действия будет выдаваться награда.
          </p>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={Trophy}
              label="Открыто"
              meta="Получено учеником"
              value={achievementCenter.totals.unlocked}
            />
            <MetricCard
              icon={Lock}
              label="Закрыто"
              meta="Осталось открыть"
              tone="slate"
              value={achievementCenter.totals.locked}
            />
            <MetricCard
              icon={Sparkles}
              label="Всего"
              meta="Активные достижения"
              tone="amber"
              value={achievementCenter.totals.total}
            />
          </div>
        </section>

        <section className="mt-5 cockpit-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Award className="text-[var(--signal-amber)]" size={22} />
            <h2 className="text-xl font-bold">Каталог достижений</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {achievementCenter.achievements.map((achievement) => (
              <div className="grid gap-2" key={achievement.id}>
                <AchievementCard
                  awardedAt={achievement.awardedAt}
                  description={achievement.description}
                  isUnlocked={achievement.isUnlocked}
                  title={achievement.title}
                />
                <p className="px-1 text-xs font-semibold uppercase text-[var(--muted)]">
                  Триггер: {triggerLabels[achievement.triggerType]}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CockpitShell>
  );
}
