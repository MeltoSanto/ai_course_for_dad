const SORT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type SortQuestionVariant = {
  key: string;
  text: string;
};

export type SortQuestionModel = {
  correctKeys: string[];
  instruction: string;
  variants: SortQuestionVariant[];
};

function cleanStep(value: string) {
  return value.replace(/^\s*\d+[.)]\s+/, "").trim();
}

function normalizeStep(value: string) {
  return cleanStep(value)
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();
}

function displayStep(value: string) {
  return cleanStep(value).replace(/`([^`]+)`/g, "$1").replace(/\*\*/g, "");
}

export function parseSortOrder(value: string | null | undefined) {
  const source = String(value ?? "").trim();

  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.map(String).map(cleanStep).filter(Boolean);
    }
  } catch {
    // Plain newline text is also supported.
  }

  return source
    .replace(/\r/g, "")
    .split("\n")
    .map(cleanStep)
    .filter(Boolean);
}

function inlineVariants(prompt: string) {
  const firstVariant = prompt.search(/\bA\s*[—–-]\s*/);

  if (firstVariant < 0) {
    return null;
  }

  const variants: SortQuestionVariant[] = [];
  const source = prompt.slice(firstVariant);
  const pattern = /\b([A-Z])\s*[—–-]\s*([\s\S]*?)(?=;\s*[A-Z]\s*[—–-]\s*|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    variants.push({
      key: match[1],
      text: displayStep(match[2]),
    });
  }

  if (variants.length < 2) {
    return null;
  }

  return {
    instruction:
      prompt
        .slice(0, firstVariant)
        .replace(/\s*В ответе[\s\S]*$/i, "")
        .trim() || "Расположите варианты в правильном порядке.",
    variants,
  };
}

function generatedVariants(correctSteps: string[]) {
  const originalIndices = correctSteps.map((_, index) => index);
  const displayIndices =
    originalIndices.length > 1
      ? [...originalIndices.slice(1), originalIndices[0]]
      : originalIndices;
  const variants = displayIndices.map((stepIndex, displayIndex) => ({
    key: SORT_LETTERS[displayIndex],
    text: displayStep(correctSteps[stepIndex]),
  }));
  const correctKeys = originalIndices.map(
    (stepIndex) => SORT_LETTERS[displayIndices.indexOf(stepIndex)],
  );

  return { correctKeys, variants };
}

export function buildSortQuestionModel({
  correctOrder,
  prompt,
}: {
  correctOrder: string | null;
  prompt: string;
}): SortQuestionModel {
  const parsedVariants = inlineVariants(prompt);
  const correctSteps = parseSortOrder(correctOrder);

  if (parsedVariants) {
    const variantKeys = new Set(parsedVariants.variants.map(({ key }) => key));
    const correctKeys = correctSteps
      .map((step) => step.toUpperCase())
      .filter((key) => variantKeys.has(key));

    return {
      correctKeys,
      instruction: parsedVariants.instruction,
      variants: parsedVariants.variants,
    };
  }

  const generated = generatedVariants(correctSteps);

  return {
    ...generated,
    instruction: prompt.trim() || "Расположите варианты в правильном порядке.",
  };
}

export function normalizeSortSelection(
  value: string | string[] | null | undefined,
  model: SortQuestionModel,
) {
  const source = Array.isArray(value)
    ? value.length === 1 && /\r|\n/.test(value[0])
      ? parseSortOrder(value[0])
      : value.map(String)
    : parseSortOrder(value);
  const variantKeys = new Set(model.variants.map(({ key }) => key));

  return source.map((item) => {
    const possibleKey = cleanStep(item).toUpperCase();

    if (variantKeys.has(possibleKey)) {
      return possibleKey;
    }

    return (
      model.variants.find(
        (variant) => normalizeStep(variant.text) === normalizeStep(item),
      )?.key ?? ""
    );
  });
}

export function isCorrectSortSelection(
  selection: string[],
  model: SortQuestionModel,
) {
  return (
    selection.length === model.correctKeys.length &&
    selection.every((key, index) => key === model.correctKeys[index])
  );
}
