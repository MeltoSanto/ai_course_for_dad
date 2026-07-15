import type { ReactNode } from "react";
import { CopyCodeButton } from "@/components/copy-code-button";

type MarkdownContentProps = {
  content: string;
  className?: string;
  compact?: boolean;
  tone?: "default" | "prompt";
};

type ParagraphBlock = {
  text: string;
  type: "paragraph";
};

type HeadingBlock = {
  level: 1 | 2 | 3 | 4;
  text: string;
  type: "heading";
};

type CodeBlock = {
  code: string;
  language?: string;
  type: "code";
};

type ListBlock = {
  items: Array<{
    checked?: boolean;
    text: string;
  }>;
  ordered: boolean;
  start?: number;
  type: "list";
};

type QuoteBlock = {
  text: string;
  type: "quote";
};

type RuleBlock = {
  type: "rule";
};

type TableBlock = {
  headers: string[];
  rows: string[][];
  type: "table";
};

type MarkdownBlock =
  | ParagraphBlock
  | HeadingBlock
  | CodeBlock
  | ListBlock
  | QuoteBlock
  | RuleBlock
  | TableBlock;

function joinClassNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isBlank(line: string) {
  return line.trim().length === 0;
}

function isFence(line: string) {
  return line.trim().startsWith("```");
}

function isHeading(line: string) {
  return /^#{1,4}\s+\S/.test(line.trim());
}

function isQuote(line: string) {
  return line.trim().startsWith(">");
}

function isRule(line: string) {
  return /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim());
}

function isUnorderedList(line: string) {
  return /^\s*[-*+]\s+/.test(line);
}

function isOrderedList(line: string) {
  return /^\s*\d+[.)]\s+/.test(line);
}

function isTableDivider(line: string) {
  const cleaned = line.trim().replace(/^\|/, "").replace(/\|$/, "");

  return cleaned
    .split("|")
    .every((part) => /^:?-{3,}:?$/.test(part.trim()));
}

function isTableStart(lines: string[], index: number) {
  const current = lines[index]?.trim() ?? "";
  const next = lines[index + 1]?.trim() ?? "";

  return current.includes("|") && next.includes("|") && isTableDivider(next);
}

function isBlockStart(lines: string[], index: number) {
  const line = lines[index] ?? "";

  return (
    isBlank(line) ||
    isFence(line) ||
    isHeading(line) ||
    isQuote(line) ||
    isRule(line) ||
    isUnorderedList(line) ||
    isOrderedList(line) ||
    isTableStart(lines, index)
  );
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (isBlank(line)) {
      index += 1;
      continue;
    }

    if (isFence(line)) {
      const language = line.trim().slice(3).trim() || undefined;
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !isFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && isFence(lines[index])) {
        index += 1;
      }

      blocks.push({
        code: codeLines.join("\n").replace(/\n+$/g, ""),
        language,
        type: "code",
      });
      continue;
    }

    if (isHeading(line)) {
      const match = line.trim().match(/^(#{1,4})\s+(.+)$/);

      if (match) {
        blocks.push({
          level: Math.min(match[1].length, 4) as 1 | 2 | 3 | 4,
          text: match[2].trim(),
          type: "heading",
        });
      }

      index += 1;
      continue;
    }

    if (isRule(line)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    if (isQuote(line)) {
      const quoteLines: string[] = [];

      while (index < lines.length && (isQuote(lines[index]) || isBlank(lines[index]))) {
        if (isBlank(lines[index])) {
          quoteLines.push("");
        } else {
          quoteLines.push(lines[index].replace(/^\s*>\s?/, ""));
        }

        index += 1;
      }

      blocks.push({
        text: quoteLines.join("\n").trim(),
        type: "quote",
      });
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index]);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && lines[index].includes("|") && !isBlank(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push({
        headers,
        rows,
        type: "table",
      });
      continue;
    }

    if (isUnorderedList(line) || isOrderedList(line)) {
      const ordered = isOrderedList(line);
      const items: ListBlock["items"] = [];
      const start = ordered
        ? Number.parseInt(line.match(/^\s*(\d+)[.)]\s+/)?.[1] ?? "1", 10)
        : undefined;

      while (
        index < lines.length &&
        !isBlank(lines[index]) &&
        (ordered ? isOrderedList(lines[index]) : isUnorderedList(lines[index]))
      ) {
        const itemLine = lines[index];
        const rawText = ordered
          ? itemLine.replace(/^\s*\d+[.)]\s+/, "")
          : itemLine.replace(/^\s*[-*+]\s+/, "");
        const checkboxMatch = rawText.match(/^\[(x|X| )\]\s+(.+)$/);

        items.push(
          checkboxMatch
            ? {
                checked: checkboxMatch[1].toLowerCase() === "x",
                text: checkboxMatch[2],
              }
            : {
                text: rawText,
              },
        );
        index += 1;
      }

      blocks.push({
        items,
        ordered,
        start,
        type: "list",
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({
      text: paragraphLines.join("\n").trim(),
      type: "paragraph",
    });
  }

  return blocks;
}

function safeHref(href: string) {
  const trimmed = href.trim();

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:")
  ) {
    return trimmed;
  }

  return "#";
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokenPattern =
    /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\+\+[^+]+\+\+|==[^=]+==|<u>.*?<\/u>|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*|_[^_\n]+_)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${tokenIndex}`;

    if (token.startsWith("`")) {
      nodes.push(
        <code className="markdown-inline-code" key={key}>
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (token.startsWith("__")) {
      nodes.push(<u key={key}>{renderInline(token.slice(2, -2), key)}</u>);
    } else if (token.startsWith("++")) {
      nodes.push(<u key={key}>{renderInline(token.slice(2, -2), key)}</u>);
    } else if (token.startsWith("==")) {
      nodes.push(<mark key={key}>{renderInline(token.slice(2, -2), key)}</mark>);
    } else if (token.startsWith("<u>")) {
      nodes.push(<u key={key}>{renderInline(token.slice(3, -4), key)}</u>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

      if (linkMatch) {
        const href = safeHref(linkMatch[2]);
        const isExternal = href.startsWith("http://") || href.startsWith("https://");

        nodes.push(
          <a
            href={href}
            key={key}
            rel={isExternal ? "noreferrer" : undefined}
            target={isExternal ? "_blank" : undefined}
          >
            {renderInline(linkMatch[1], key)}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    } else if (token.startsWith("_")) {
      nodes.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    } else {
      nodes.push(token);
    }

    lastIndex = match.index + token.length;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderInlineWithBreaks(text: string, keyPrefix: string) {
  return text.split("\n").flatMap((line, index, lines) => {
    const nodes = renderInline(line, `${keyPrefix}-${index}`);

    if (index < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-${index}-br`} />);
    }

    return nodes;
  });
}

function isLabelParagraph(text: string) {
  const normalized = text.trim();

  return (
    normalized.length > 0 &&
    normalized.length <= 90 &&
    normalized.endsWith(":") &&
    !normalized.includes("\n")
  );
}

function isStrongParagraph(text: string) {
  const normalized = text.trim();

  return (
    normalized.length > 4 &&
    normalized.length <= 120 &&
    !normalized.includes("\n") &&
    /^\*\*[^*]+(?:\*[^*]+)*\*\*$/.test(normalized)
  );
}

function renderBlock(block: MarkdownBlock, index: number) {
  const key = `md-block-${index}`;

  if (block.type === "heading") {
    const className = `markdown-heading markdown-heading-${block.level}`;

    if (block.level === 1) {
      return (
        <h2 className={className} key={key}>
          {renderInline(block.text, key)}
        </h2>
      );
    }

    if (block.level === 2) {
      return (
        <h3 className={className} key={key}>
          {renderInline(block.text, key)}
        </h3>
      );
    }

    return (
      <h4 className={className} key={key}>
        {renderInline(block.text, key)}
      </h4>
    );
  }

  if (block.type === "paragraph") {
    const label = isLabelParagraph(block.text);
    const strongLine = isStrongParagraph(block.text);

    return (
      <p
        className={joinClassNames(
          label && "markdown-label",
          strongLine && "markdown-strong-line",
        )}
        key={key}
      >
        {renderInlineWithBreaks(block.text, key)}
      </p>
    );
  }

  if (block.type === "code") {
    return (
      <div className="markdown-code-frame" key={key}>
        <div className="markdown-code-toolbar">
          {block.language ? (
            <span className="markdown-code-language">{block.language}</span>
          ) : null}
          <CopyCodeButton content={block.code} />
        </div>
        <pre className="markdown-code">
          <code>{block.code}</code>
        </pre>
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote key={key}>
        <MarkdownContent compact content={block.text} />
      </blockquote>
    );
  }

  if (block.type === "rule") {
    return <hr key={key} />;
  }

  if (block.type === "table") {
    return (
      <div className="markdown-table-wrap" key={key}>
        <table>
          <thead>
            <tr>
              {block.headers.map((header, headerIndex) => (
                <th key={`${key}-head-${headerIndex}`}>
                  {renderInline(header, `${key}-head-${headerIndex}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${key}-row-${rowIndex}`}>
                {block.headers.map((_, cellIndex) => (
                  <td key={`${key}-cell-${rowIndex}-${cellIndex}`}>
                    {renderInline(row[cellIndex] ?? "", `${key}-cell-${rowIndex}-${cellIndex}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const ListTag = block.ordered ? "ol" : "ul";

  return (
    <ListTag className={block.items.some((item) => item.checked !== undefined) ? "markdown-checklist" : undefined} key={key} start={block.start}>
      {block.items.map((item, itemIndex) => (
        <li key={`${key}-item-${itemIndex}`}>
          {item.checked !== undefined ? (
            <span
              aria-hidden="true"
              className={joinClassNames("markdown-checkbox", item.checked && "markdown-checkbox-checked")}
            />
          ) : null}
          <span>{renderInline(item.text, `${key}-item-${itemIndex}`)}</span>
        </li>
      ))}
    </ListTag>
  );
}

export function markdownToPlainText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+(\[(x|X| )\]\s+)?/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<\/?u>/g, "")
    .replace(/(`|\*\*|__|\*|_|==|\+\+)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function MarkdownContent({
  className,
  compact = false,
  content,
  tone = "default",
}: MarkdownContentProps) {
  const blocks = parseMarkdown(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div
      className={joinClassNames(
        "markdown-content",
        compact && "markdown-content-compact",
        tone === "prompt" && "markdown-content-prompt",
        className,
      )}
    >
      {blocks.map(renderBlock)}
    </div>
  );
}
