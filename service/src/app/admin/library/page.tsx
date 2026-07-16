import { Button, Card, Chip } from "@heroui/react";
import { AchievementTriggerType, PublicationStatus } from "@prisma/client";
import Link from "next/link";
import {
  createAchievementAction,
  createGlossaryTermAction,
  createReferenceItemAction,
  createScenarioAction,
  grantAchievementToCurrentAdminAction,
  updateAchievementAction,
  updateGlossaryTermAction,
  updateReferenceItemAction,
  updateScenarioAction,
} from "@/app/admin/actions";
import { logoutAction } from "@/app/actions/auth";
import { CockpitShell } from "@/components/cockpit-shell";
import { AchievementArtwork } from "@/components/course/achievement-artwork";
import { getAdminLibraryEditor, statusLabels } from "@/lib/course";
import { requireAdmin } from "@/lib/session";

const inputClass =
  "cockpit-input mt-2 text-sm";
const textareaClass = "textarea mt-2 min-h-28 resize-y text-sm leading-6";
const compactTextareaClass = "textarea mt-2 min-h-20 resize-y text-sm leading-6";

const triggerLabels: Record<AchievementTriggerType, string> = {
  LESSON_COMPLETED: "Урок завершен",
  PRACTICE_COMPLETED: "Практика выполнена",
  TEST_PASSED: "Тест пройден",
  SCENARIO_SAVED: "Сценарий сохранен",
  MANUAL: "Вручную",
};

function StatusSelect({ defaultValue }: { defaultValue: PublicationStatus }) {
  return (
    <select className={inputClass} defaultValue={defaultValue} name="status">
      {Object.values(PublicationStatus).map((status) => (
        <option key={status} value={status}>
          {statusLabels[status]}
        </option>
      ))}
    </select>
  );
}

function TriggerSelect({
  defaultValue,
}: {
  defaultValue: AchievementTriggerType;
}) {
  return (
    <select className={inputClass} defaultValue={defaultValue} name="triggerType">
      {Object.values(AchievementTriggerType).map((triggerType) => (
        <option key={triggerType} value={triggerType}>
          {triggerLabels[triggerType]}
        </option>
      ))}
    </select>
  );
}

function NumberInput({
  defaultValue,
  name = "order",
}: {
  defaultValue: number;
  name?: string;
}) {
  return (
    <input
      className={inputClass}
      defaultValue={defaultValue}
      min="1"
      name={name}
      type="number"
    />
  );
}

export default async function AdminLibraryPage() {
  const user = await requireAdmin();
  const library = await getAdminLibraryEditor();

  return (
    <CockpitShell active="admin" continueHref="/admin" user={user}>
      <div className="tech-canvas -mx-5 -my-5 min-h-[calc(100vh-84px)] px-5 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <header className="hidden">
          <div>
            <Link
              className="text-sm font-medium text-[#56766e] hover:text-[#1e2528]"
              href="/admin"
            >
              ← К админке
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
              Библиотека курса
            </h1>
            <p className="mt-2 text-sm text-[#66736f]">
              Справочник, глоссарий, сценарии и ачивки редактируются здесь.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="soft" color="success">
              {user.displayName}
            </Chip>
            <form action={logoutAction}>
              <Button size="sm" type="submit" variant="outline">
                Выйти
              </Button>
            </form>
          </div>
        </header>

        <section className="cockpit-panel p-5 sm:p-7">
          <Chip variant="soft" color="accent">
            Админская библиотека
          </Chip>
          <h1 className="mt-4 text-4xl font-bold tracking-normal text-black sm:text-5xl">
            Библиотека курса
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Справочник, глоссарий, сценарии и ачивки редактируются здесь.
          </p>
        </section>

        <nav className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["Справочник", "#reference", library.references.length],
            ["Глоссарий", "#glossary", library.glossaryTerms.length],
            ["Сценарии", "#scenarios", library.scenarios.length],
            ["Ачивки", "#achievements", library.achievements.length],
          ].map(([label, href, count]) => (
            <a
              className="rounded-xl border border-[var(--line)] bg-white/84 p-4 shadow-[0_18px_55px_rgba(28,35,29,0.04)] transition hover:-translate-y-0.5 hover:border-[var(--signal-green)]"
              href={String(href)}
              key={String(label)}
            >
              <span className="text-sm text-[var(--muted)]">{label}</span>
              <strong className="mt-2 block text-2xl font-bold">
                {count}
              </strong>
            </a>
          ))}
        </nav>

        <section className="grid gap-6" id="reference">
          <Card variant="default" className="border border-black/10">
            <Card.Header>
              <Card.Title>Справочник</Card.Title>
              <Card.Description>
                Короткие прикладные материалы, доступные ученику из отдельного раздела.
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <form
                action={createReferenceItemAction}
                className="rounded-md border border-dashed border-black/20 bg-[#fbfbf8] p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_180px_170px_100px]">
                  <label className="text-sm font-medium">
                    Заголовок
                    <input className={inputClass} name="title" required />
                  </label>
                  <label className="text-sm font-medium">
                    Slug
                    <input className={inputClass} name="slug" />
                  </label>
                  <label className="text-sm font-medium">
                    Категория
                    <input className={inputClass} name="category" />
                  </label>
                  <label className="text-sm font-medium">
                    Порядок
                    <NumberInput defaultValue={library.references.length + 1} />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
                  <label className="text-sm font-medium">
                    Статус
                    <StatusSelect defaultValue={PublicationStatus.DRAFT} />
                  </label>
                  <label className="text-sm font-medium">
                    Материал
                    <textarea className={textareaClass} name="contentMd" />
                  </label>
                </div>
                <Button className="mt-3" type="submit" variant="primary">
                  Добавить материал
                </Button>
              </form>

              {library.references.map((item) => (
                <form
                  action={updateReferenceItemAction.bind(null, item.id)}
                  className="rounded-md border border-black/10 bg-white p-4"
                  key={item.id}
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_180px_170px_100px]">
                    <label className="text-sm font-medium">
                      Заголовок
                      <input
                        className={inputClass}
                        defaultValue={item.title}
                        name="title"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Slug
                      <input
                        className={inputClass}
                        defaultValue={item.slug}
                        name="slug"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Категория
                      <input
                        className={inputClass}
                        defaultValue={item.category}
                        name="category"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Порядок
                      <NumberInput defaultValue={item.order} />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
                    <label className="text-sm font-medium">
                      Статус
                      <StatusSelect defaultValue={item.status} />
                    </label>
                    <label className="text-sm font-medium">
                      Материал
                      <textarea
                        className={textareaClass}
                        defaultValue={item.contentMd}
                        name="contentMd"
                      />
                    </label>
                  </div>
                  <Button className="mt-3" type="submit" variant="secondary">
                    Сохранить
                  </Button>
                </form>
              ))}
            </Card.Content>
          </Card>
        </section>

        <section className="grid gap-6" id="glossary">
          <Card variant="default" className="border border-black/10">
            <Card.Header>
              <Card.Title>Глоссарий</Card.Title>
              <Card.Description>
                Термины простым рабочим языком.
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <form
                action={createGlossaryTermAction}
                className="rounded-md border border-dashed border-black/20 bg-[#fbfbf8] p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_180px_100px]">
                  <label className="text-sm font-medium">
                    Термин
                    <input className={inputClass} name="term" required />
                  </label>
                  <label className="text-sm font-medium">
                    Статус
                    <StatusSelect defaultValue={PublicationStatus.DRAFT} />
                  </label>
                  <label className="text-sm font-medium">
                    Порядок
                    <NumberInput defaultValue={library.glossaryTerms.length + 1} />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-medium">
                    Короткое определение
                    <textarea className={compactTextareaClass} name="definition" />
                  </label>
                  <label className="text-sm font-medium">
                    Дополнительный текст
                    <textarea className={compactTextareaClass} name="contentMd" />
                  </label>
                </div>
                <Button className="mt-3" type="submit" variant="primary">
                  Добавить термин
                </Button>
              </form>

              {library.glossaryTerms.map((term) => (
                <form
                  action={updateGlossaryTermAction.bind(null, term.id)}
                  className="rounded-md border border-black/10 bg-white p-4"
                  key={term.id}
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_180px_100px]">
                    <label className="text-sm font-medium">
                      Термин
                      <input
                        className={inputClass}
                        defaultValue={term.term}
                        name="term"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Статус
                      <StatusSelect defaultValue={term.status} />
                    </label>
                    <label className="text-sm font-medium">
                      Порядок
                      <NumberInput defaultValue={term.order} />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-medium">
                      Короткое определение
                      <textarea
                        className={compactTextareaClass}
                        defaultValue={term.definition}
                        name="definition"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Дополнительный текст
                      <textarea
                        className={compactTextareaClass}
                        defaultValue={term.contentMd ?? ""}
                        name="contentMd"
                      />
                    </label>
                  </div>
                  <Button className="mt-3" type="submit" variant="secondary">
                    Сохранить
                  </Button>
                </form>
              ))}
            </Card.Content>
          </Card>
        </section>

        <section className="grid gap-6" id="scenarios">
          <Card variant="default" className="border border-black/10">
            <Card.Header>
              <Card.Title>Сценарии</Card.Title>
              <Card.Description>
                Рабочие процессы и промпт-сценарии для повторного применения.
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <form
                action={createScenarioAction}
                className="rounded-md border border-dashed border-black/20 bg-[#fbfbf8] p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_100px]">
                  <label className="text-sm font-medium">
                    Название
                    <input className={inputClass} name="title" required />
                  </label>
                  <label className="text-sm font-medium">
                    Slug
                    <input className={inputClass} name="slug" />
                  </label>
                  <label className="text-sm font-medium">
                    Статус
                    <StatusSelect defaultValue={PublicationStatus.DRAFT} />
                  </label>
                  <label className="text-sm font-medium">
                    Порядок
                    <NumberInput defaultValue={library.scenarios.length + 1} />
                  </label>
                </div>
                <label className="mt-3 block text-sm font-medium">
                  Краткое описание
                  <input className={inputClass} name="summary" />
                </label>
                <label className="mt-3 block text-sm font-medium">
                  Содержание сценария
                  <textarea className={textareaClass} name="contentMd" />
                </label>
                <Button className="mt-3" type="submit" variant="primary">
                  Добавить сценарий
                </Button>
              </form>

              {library.scenarios.map((scenario) => (
                <form
                  action={updateScenarioAction.bind(null, scenario.id)}
                  className="rounded-md border border-black/10 bg-white p-4"
                  key={scenario.id}
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_100px]">
                    <label className="text-sm font-medium">
                      Название
                      <input
                        className={inputClass}
                        defaultValue={scenario.title}
                        name="title"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Slug
                      <input
                        className={inputClass}
                        defaultValue={scenario.slug}
                        name="slug"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Статус
                      <StatusSelect defaultValue={scenario.status} />
                    </label>
                    <label className="text-sm font-medium">
                      Порядок
                      <NumberInput defaultValue={scenario.order} />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm font-medium">
                    Краткое описание
                    <input
                      className={inputClass}
                      defaultValue={scenario.summary ?? ""}
                      name="summary"
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium">
                    Содержание сценария
                    <textarea
                      className={textareaClass}
                      defaultValue={scenario.contentMd}
                      name="contentMd"
                    />
                  </label>
                  <Button className="mt-3" type="submit" variant="secondary">
                    Сохранить
                  </Button>
                </form>
              ))}
            </Card.Content>
          </Card>
        </section>

        <section className="grid gap-6" id="achievements">
          <Card variant="default" className="border border-black/10">
            <Card.Header>
              <Card.Title>Ачивки</Card.Title>
              <Card.Description>
                Управление каталогом достижений. Правила выдачи живут в коде, а
                здесь редактируются названия, тексты и активность.
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <form
                action={createAchievementAction}
                className="rounded-md border border-dashed border-black/20 bg-[#fbfbf8] p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_200px_180px_120px]">
                  <label className="text-sm font-medium">
                    Название
                    <input className={inputClass} name="title" required />
                  </label>
                  <label className="text-sm font-medium">
                    Код
                    <input className={inputClass} name="code" />
                  </label>
                  <label className="text-sm font-medium">
                    Триггер
                    <TriggerSelect defaultValue={AchievementTriggerType.MANUAL} />
                  </label>
                  <label className="text-sm font-medium">
                    Иконка
                    <input className={inputClass} name="icon" />
                  </label>
                </div>
                <label className="mt-3 block text-sm font-medium">
                  Описание
                  <textarea className={compactTextareaClass} name="description" />
                </label>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input defaultChecked name="isActive" type="checkbox" />
                  Активна
                </label>
                <Button className="mt-3" type="submit" variant="primary">
                  Добавить ачивку
                </Button>
              </form>

              {library.achievements.map((achievement) => (
                <form
                  action={updateAchievementAction.bind(null, achievement.id)}
                  className="rounded-md border border-black/10 bg-white p-4"
                  key={achievement.id}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <AchievementArtwork
                      className="size-20 shrink-0"
                      code={achievement.code}
                      isLocked={!achievement.isActive}
                    />
                    <div>
                      <p className="font-bold">Предпросмотр награды</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Эту миниатюру видит ученик в списке достижений.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_200px_180px_120px]">
                    <label className="text-sm font-medium">
                      Название
                      <input
                        className={inputClass}
                        defaultValue={achievement.title}
                        name="title"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Код
                      <input
                        className={inputClass}
                        defaultValue={achievement.code}
                        name="code"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Триггер
                      <TriggerSelect defaultValue={achievement.triggerType} />
                    </label>
                    <label className="text-sm font-medium">
                      Иконка
                      <input
                        className={inputClass}
                        defaultValue={achievement.icon ?? ""}
                        name="icon"
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm font-medium">
                    Описание
                    <textarea
                      className={compactTextareaClass}
                      defaultValue={achievement.description}
                      name="description"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          defaultChecked={achievement.isActive}
                          name="isActive"
                          type="checkbox"
                        />
                        Активна
                      </label>
                      <Chip variant="soft" color="default">
                        Выдана: {achievement._count.users}
                      </Chip>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        formAction={grantAchievementToCurrentAdminAction.bind(
                          null,
                          achievement.id,
                        )}
                        isDisabled={!achievement.isActive}
                        type="submit"
                        variant="primary"
                      >
                        Получить и показать
                      </Button>
                      <Button type="submit" variant="secondary">
                        Сохранить
                      </Button>
                    </div>
                  </div>
                </form>
              ))}
            </Card.Content>
          </Card>
        </section>
      </div>
    </CockpitShell>
  );
}
