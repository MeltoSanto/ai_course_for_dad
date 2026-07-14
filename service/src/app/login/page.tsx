import { BrainCircuit, CheckCircle2, Database, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser } from "@/lib/session";

const features = [
  {
    title: "Серверный прогресс",
    text: "Место остановки не пропадёт",
    icon: Database,
  },
  {
    title: "Практика и тесты",
    text: "Результаты сохраняются",
    icon: CheckCircle2,
  },
  {
    title: "Закрытый доступ",
    text: "Разные роли ученика и автора",
    icon: ShieldCheck,
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="tech-canvas grid min-h-screen place-items-center bg-[var(--background)] px-5 py-10 text-[var(--foreground)]">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <section className="cockpit-panel p-6 sm:p-8">
          <div className="mb-10 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl border border-emerald-300/25 bg-[var(--sidebar)] text-emerald-300">
              <BrainCircuit size={28} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--signal-green)]">
                Персональный учебный портал
              </p>
              <p className="text-lg font-bold">AI Учебник</p>
            </div>
          </div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-black sm:text-6xl">
            Управление ИИ в сложных рабочих задачах
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Уроки, практика, тесты, справочник, сценарии и прогресс хранятся в
            личном профиле. После входа сервис вернёт ученика к последнему месту
            обучения.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {features.map(({ title, text, icon: Icon }) => (
              <div
                className="rounded-xl border border-[var(--line)] bg-white/82 p-4"
                key={title}
              >
                <Icon className="mb-3 text-[var(--signal-green)]" size={22} />
                <p className="font-bold">{title}</p>
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
