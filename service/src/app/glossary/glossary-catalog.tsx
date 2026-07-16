"use client";

import { RotateCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";

export type GlossaryCatalogItem = {
  content: string | null;
  definition: string;
  id: string;
  order: number;
  term: string;
  topic: string;
};

type GlossaryCatalogProps = {
  initialQuery?: string;
  items: GlossaryCatalogItem[];
  topics: readonly string[];
};

export function GlossaryCatalog({ initialQuery = "", items, topics }: GlossaryCatalogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [topic, setTopic] = useState("Все темы");

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru-RU");

    return items
      .filter((item) => {
        if (topic !== "Все темы" && item.topic !== topic) return false;
        if (!normalized) return true;
        return [item.term, item.definition, item.content ?? "", item.topic]
          .join(" ")
          .toLocaleLowerCase("ru-RU")
          .includes(normalized);
      })
      .sort((left, right) => left.term.localeCompare(right.term, "ru"));
  }, [items, query, topic]);

  const groupedItems = useMemo(() => {
    return visibleItems.reduce<Record<string, GlossaryCatalogItem[]>>((groups, item) => {
      const firstLetter = item.term.trim().charAt(0).toLocaleUpperCase("ru-RU") || "#";
      const letter = /[А-ЯЁ]/.test(firstLetter) ? firstLetter : "A–Z";
      groups[letter] = [...(groups[letter] ?? []), item];
      return groups;
    }, {});
  }, [visibleItems]);

  const reset = () => {
    setQuery("");
    setTopic("Все темы");
  };

  return (
    <div className="mt-5 grid gap-5">
      <section aria-label="Поиск терминов" className="cockpit-panel p-5 sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <label className="grid gap-2 text-base font-bold" htmlFor="glossary-search">
            Найти термин или объяснение
            <span className="reference-search-field">
              <Search aria-hidden="true" size={21} />
              <input
                autoComplete="off"
                id="glossary-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Например: выдуманный факт или защита данных"
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
          <label className="grid gap-2 text-base font-bold" htmlFor="glossary-topic">
            Тема
            <select
              className="reference-select"
              id="glossary-topic"
              onChange={(event) => setTopic(event.target.value)}
              value={topic}
            >
              <option value="Все темы">Все темы</option>
              {topics.map((itemTopic) => (
                <option key={itemTopic} value={itemTopic}>{itemTopic}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
          <p aria-live="polite" className="text-base font-bold">Найдено: {visibleItems.length} из {items.length}</p>
          {query || topic !== "Все темы" ? (
            <button className="reference-reset-button" onClick={reset} type="button">
              <RotateCcw aria-hidden="true" size={18} />
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      </section>

      {visibleItems.length ? (
        <section aria-label="Термины курса" className="glossary-list cockpit-panel">
          {Object.entries(groupedItems).map(([letter, letterItems]) => (
            <section className="glossary-letter-section" key={letter}>
              <h2 aria-label={`Буква ${letter}`} className="glossary-letter">{letter}</h2>
              <dl>
                {letterItems.map((item) => (
                  <div className="glossary-entry" key={item.id}>
                    <dt>
                      <span className="glossary-term-label">Термин</span>
                      <h3>{item.term}</h3>
                    </dt>
                    <dd>
                      <span className="glossary-definition-label">Определение</span>
                      <p>{item.definition}</p>
                      {item.content ? <MarkdownContent className="mt-2" compact content={item.content} /> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </section>
      ) : (
        <section className="cockpit-panel grid justify-items-center gap-3 p-8 text-center" role="status">
          <Search aria-hidden="true" className="text-[var(--signal-green)]" size={32} />
          <h2 className="text-2xl font-bold">Термин не найден</h2>
          <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
            Попробуйте написать слово проще или выберите другую тему.
          </p>
          <button className="reference-reset-button" onClick={reset} type="button">
            <RotateCcw aria-hidden="true" size={18} />
            Сбросить фильтры
          </button>
        </section>
      )}
    </div>
  );
}
