"use client";

import { ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MarkdownContent, markdownToPlainText } from "@/components/markdown-content";
import type { ReferenceTopic } from "@/lib/reference-catalog";

export type ReferenceCatalogItem = {
  content: string;
  id: string;
  order: number;
  title: string;
  topic: ReferenceTopic;
  type: string;
  whenUseful: string;
};

type ReferenceCatalogProps = {
  initialQuery?: string;
  items: ReferenceCatalogItem[];
  topics: readonly ReferenceTopic[];
};

type SortMode = "recommended" | "alphabetical" | "topic";

export function ReferenceCatalog({ initialQuery = "", items, topics }: ReferenceCatalogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [topic, setTopic] = useState<ReferenceTopic | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");

  const topicCounts = useMemo(
    () => Object.fromEntries(topics.map((itemTopic) => [itemTopic, items.filter((item) => item.topic === itemTopic).length])),
    [items, topics],
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
    const filtered = items.filter((item) => {
      if (topic !== "all" && item.topic !== topic) return false;
      if (!normalizedQuery) return true;

      return [item.title, item.topic, item.type, item.whenUseful, markdownToPlainText(item.content)]
        .join(" ")
        .toLocaleLowerCase("ru-RU")
        .includes(normalizedQuery);
    });

    return [...filtered].sort((left, right) => {
      if (sortMode === "alphabetical") return left.title.localeCompare(right.title, "ru");
      if (sortMode === "topic") {
        return topics.indexOf(left.topic) - topics.indexOf(right.topic) || left.order - right.order;
      }
      return left.order - right.order || left.title.localeCompare(right.title, "ru");
    });
  }, [items, query, sortMode, topic, topics]);

  const resetFilters = () => {
    setQuery("");
    setTopic("all");
    setSortMode("recommended");
  };

  return (
    <div className="mt-5 grid gap-5">
      <section aria-label="Поиск и фильтры" className="cockpit-panel p-5 sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-end">
          <label className="grid gap-2 text-base font-bold" htmlFor="reference-search">
            Найти материал
            <span className="reference-search-field">
              <Search aria-hidden="true" size={21} />
              <input
                autoComplete="off"
                id="reference-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Например: как проверить факты или обезличить файл"
                type="search"
                value={query}
              />
              {query ? (
                <button aria-label="Очистить поиск" onClick={() => setQuery("")} type="button">
                  <X aria-hidden="true" size={20} />
                </button>
              ) : null}
            </span>
          </label>

          <label className="grid gap-2 text-base font-bold" htmlFor="reference-sort">
            Сортировка
            <select
              className="reference-select"
              id="reference-sort"
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              value={sortMode}
            >
              <option value="recommended">Сначала основные</option>
              <option value="alphabetical">По алфавиту</option>
              <option value="topic">По темам</option>
            </select>
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="text-base font-bold">Выберите тему</legend>
          <div className="mt-3 flex flex-wrap gap-2" role="group">
            <button
              aria-pressed={topic === "all"}
              className="reference-filter-button"
              onClick={() => setTopic("all")}
              type="button"
            >
              Все материалы <span>{items.length}</span>
            </button>
            {topics.map((itemTopic) => (
              <button
                aria-pressed={topic === itemTopic}
                className="reference-filter-button"
                key={itemTopic}
                onClick={() => setTopic(itemTopic)}
                type="button"
              >
                {itemTopic} <span>{topicCounts[itemTopic]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
          <p aria-live="polite" className="text-base font-bold">
            Найдено: {visibleItems.length} из {items.length}
          </p>
          {query || topic !== "all" || sortMode !== "recommended" ? (
            <button className="reference-reset-button" onClick={resetFilters} type="button">
              <RotateCcw aria-hidden="true" size={18} />
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      </section>

      {visibleItems.length ? (
        <section aria-label="Материалы справочника" className="grid gap-3">
          {visibleItems.map((item) => {
            const preview = markdownToPlainText(item.content);

            return (
              <details className="reference-card cockpit-panel" key={item.id}>
                <summary>
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="reference-badge reference-badge-topic">{item.topic}</span>
                      <span className="reference-badge">{item.type}</span>
                    </div>
                    <h2>{item.title}</h2>
                    <p className="reference-use-case">
                      <strong>Когда пригодится:</strong> {item.whenUseful}
                    </p>
                    <p className="reference-preview">{preview}</p>
                    <span className="reference-open-label">
                      <span className="reference-label-open">Открыть объяснение</span>
                      <span className="reference-label-close">Свернуть объяснение</span>
                    </span>
                  </div>
                  <span aria-hidden="true" className="reference-chevron">
                    <ChevronDown size={24} />
                  </span>
                </summary>
                <div className="reference-card-content">
                  <MarkdownContent content={item.content} />
                </div>
              </details>
            );
          })}
        </section>
      ) : (
        <section className="cockpit-panel grid justify-items-center gap-3 p-8 text-center" role="status">
          <Search aria-hidden="true" className="text-[var(--signal-green)]" size={32} />
          <h2 className="text-2xl font-bold">Ничего не найдено</h2>
          <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
            Попробуйте более простые слова или сбросьте выбранную тему.
          </p>
          <button className="reference-reset-button" onClick={resetFilters} type="button">
            <RotateCcw aria-hidden="true" size={18} />
            Сбросить фильтры
          </button>
        </section>
      )}
    </div>
  );
}
