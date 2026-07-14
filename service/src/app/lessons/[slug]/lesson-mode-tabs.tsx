"use client";

import { useEffect, useState } from "react";

type LessonModeTab = {
  href: string;
  label: string;
  meta: string;
};

export function LessonModeTabs({ tabs }: { tabs: LessonModeTab[] }) {
  const [activeHash, setActiveHash] = useState(tabs[0]?.href ?? "#materials");

  useEffect(() => {
    function syncHash() {
      setActiveHash(window.location.hash || tabs[0]?.href || "#materials");
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [tabs]);

  return (
    <nav aria-label="Режимы урока" className="cockpit-panel flex gap-2 overflow-x-auto p-2">
      {tabs.map((tab) => {
        const isActive = activeHash === tab.href;

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            className={`min-w-max rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[var(--signal-green)] text-white shadow-[0_10px_24px_rgba(7,108,62,0.18)]"
                : "bg-[var(--surface-muted)] text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]"
            }`}
            href={tab.href}
            key={tab.href}
            onClick={() => setActiveHash(tab.href)}
          >
            {tab.label}
            <span
              className={`ml-2 text-xs ${
                isActive ? "text-white/80" : "text-[var(--muted)]"
              }`}
            >
              {tab.meta}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
