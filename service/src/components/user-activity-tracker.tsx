"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HEARTBEAT_MS = 60_000;

export function sendUserActivity(payload: Record<string, unknown>) {
  return fetch("/api/activity", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}

export function UserActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    function heartbeat() {
      if (document.visibilityState !== "visible") return;
      void sendUserActivity({ path: pathname });
    }

    heartbeat();
    const interval = window.setInterval(heartbeat, HEARTBEAT_MS);

    return () => window.clearInterval(interval);
  }, [pathname]);

  return null;
}
