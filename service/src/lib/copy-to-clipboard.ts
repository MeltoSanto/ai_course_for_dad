export async function copyTextToClipboard(text: string) {
  if (!text) {
    return false;
  }

  const copiedWithSelection = copyTextWithSelection(text);

  if (copiedWithSelection) {
    return true;
  }

  if (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback below.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  return copyTextWithSelection(text);
}

function copyTextWithSelection(text: string) {
  if (typeof document === "undefined") {
    return false;
  }

  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection();
  const ranges: Range[] = [];

  if (selection) {
    for (let index = 0; index < selection.rangeCount; index += 1) {
      ranges.push(selection.getRangeAt(index).cloneRange());
    }
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.border = "0";
  textarea.style.opacity = "0.01";
  textarea.style.padding = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.zIndex = "-1";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
    selection?.removeAllRanges();
    ranges.forEach((range) => selection?.addRange(range));
    previousFocus?.focus();
  }

  return copied;
}
