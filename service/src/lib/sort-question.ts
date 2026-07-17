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

function seedHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = seedHash(seed) || 1;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleBySeed<T>(values: readonly T[], seed: string) {
  const result = [...values];

  if (result.length < 2 || !seed) {
    return result;
  }

  const random = seededRandom(seed);

  for (let index = result.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));
    [result[index], result[targetIndex]] = [result[targetIndex], result[index]];
  }

  if (result.every((item, index) => item === values[index])) {
    result.push(result.shift()!);
  }

  return result;
}

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
  shuffleSeed,
}: {
  correctOrder: string | null;
  prompt: string;
  shuffleSeed?: string;
}): SortQuestionModel {
  const parsedVariants = inlineVariants(prompt);
  const correctSteps = parseSortOrder(correctOrder);

  let model: SortQuestionModel;

  if (parsedVariants) {
    const variantKeys = new Set(parsedVariants.variants.map(({ key }) => key));
    const correctKeys = correctSteps
      .map((step) => step.toUpperCase())
      .filter((key) => variantKeys.has(key));

    model = {
      correctKeys,
      instruction: parsedVariants.instruction,
      variants: parsedVariants.variants,
    };
  } else {
    const generated = generatedVariants(correctSteps);

    model = {
      ...generated,
      instruction:
        prompt.trim() || "Расположите варианты в правильном порядке.",
    };
  }

  if (!shuffleSeed || model.variants.length < 2) {
    return model;
  }

  let shuffled = shuffleBySeed(model.variants, shuffleSeed);
  if (
    shuffled.length === model.correctKeys.length &&
    shuffled.every(
      (variant, index) => variant.key === model.correctKeys[index],
    )
  ) {
    shuffled = [...shuffled.slice(1), shuffled[0]];
  }

  const newKeys = shuffled.map((_, index) => SORT_LETTERS[index]);
  const keyMap = new Map(
    shuffled.map((variant, index) => [variant.key, newKeys[index]]),
  );

  return {
    correctKeys: model.correctKeys
      .map((key) => keyMap.get(key) ?? "")
      .filter(Boolean),
    instruction: model.instruction,
    variants: shuffled.map((variant, index) => ({
      key: newKeys[index],
      text: variant.text,
    })),
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
