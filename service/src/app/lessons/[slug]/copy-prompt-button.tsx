"use client";

import { Button } from "@heroui/react";
import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyPromptButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function copyContent() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button type="button" variant="outline" size="sm" onPress={copyContent}>
      <Copy size={15} />
      {copied ? "Скопировано" : "Копировать"}
    </Button>
  );
}
