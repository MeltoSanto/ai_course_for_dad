import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { LessonBlockType } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import { CompleteBlockButton } from "@/app/lessons/[slug]/complete-block-button";
import { CopyPromptButton } from "@/app/lessons/[slug]/copy-prompt-button";
import { MarkdownContent } from "@/components/markdown-content";

export const blockTypeLabels: Record<LessonBlockType, string> = {
  OBJECTIVE: "Цель",
  EXPLANATION: "Объяснение",
  DEMONSTRATION: "Демонстрация",
  PRACTICE: "Практика",
  PROMPTS: "Промпты",
  CHECK: "Проверка",
  ARTIFACT: "Артефакт",
  MARKDOWN: "Материал",
  CALLOUT: "Акцент",
};

type LessonBlockCardProps = {
  block: {
    contentMd: string;
    id: string;
    order: number;
    title: string;
    type: LessonBlockType;
  };
  isCompleted: boolean;
  isLastBlock: boolean;
  lessonId: string;
  lessonSlug: string;
};

export function LessonBlockCard({
  block,
  isCompleted,
  isLastBlock,
  lessonId,
  lessonSlug,
}: LessonBlockCardProps) {
  const isPromptBlock = block.type === LessonBlockType.PROMPTS;

  return (
    <article
      className="lesson-block-card cockpit-panel min-w-0 scroll-mt-28 p-5"
      data-block-type={block.type.toLowerCase()}
      data-lesson-block-id={block.id}
      id={`block-${block.id}`}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Chip variant="soft" color="accent">
              {blockTypeLabels[block.type]}
            </Chip>
            {isCompleted ? (
              <Chip variant="soft" color="success">
                Готово
              </Chip>
            ) : null}
          </div>
          <h3 className="mt-3 text-xl font-bold">
            {block.order}. {block.title}
          </h3>
        </div>
        {isPromptBlock ? <CopyPromptButton content={block.contentMd} /> : null}
      </div>

      <div
        className={`lesson-block-content mt-4 min-w-0 p-4 ${
          isPromptBlock
            ? "lesson-block-content--prompt prompt-console"
            : "cockpit-muted-panel"
        }`}
      >
        <MarkdownContent
          content={block.contentMd}
          tone={isPromptBlock ? "prompt" : "default"}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap gap-2">
          <CompleteBlockButton
            blockId={block.id}
            isCompleted={isCompleted}
            lessonId={lessonId}
            slug={lessonSlug}
          />
          {isLastBlock ? (
            <a href="#practice">
              <Button variant="secondary">
                К практике
                <ChevronRight size={16} />
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
