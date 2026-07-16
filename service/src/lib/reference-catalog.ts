export const REFERENCE_TOPICS = [
  "Безопасность данных и файлов",
  "Как составлять запросы к ИИ",
  "Сложные задачи и ИИ-агенты",
  "Длинные документы и большой контекст",
  "Проверка фактов, цитат и правовой информации",
  "Оценка качества ответов ИИ",
] as const;

export type ReferenceTopic = (typeof REFERENCE_TOPICS)[number];

const TOPIC_BY_SLUG: Record<string, ReferenceTopic> = {
  "safe-data-rules": REFERENCE_TOPICS[0],
  "stop-rule": REFERENCE_TOPICS[0],
  "pre-upload-checklist": REFERENCE_TOPICS[0],
  "file-hygiene": REFERENCE_TOPICS[0],
  "replacement-patterns": REFERENCE_TOPICS[0],
  "required-fields": REFERENCE_TOPICS[1],
  "prompt-debug": REFERENCE_TOPICS[1],
  "mnemonic-frameworks": REFERENCE_TOPICS[1],
  "insufficient-data": REFERENCE_TOPICS[1],
  "good-prompt-structure": REFERENCE_TOPICS[1],
  "task-decomposition-checklist": REFERENCE_TOPICS[2],
  "stage-input-output-check": REFERENCE_TOPICS[2],
  "common-pipeline-mistakes": REFERENCE_TOPICS[2],
  "openai-agents-sdk": REFERENCE_TOPICS[2],
  "anthropic-agent-patterns": REFERENCE_TOPICS[2],
  "google-multi-agent-grounding": REFERENCE_TOPICS[2],
  "microsoft-orchestration-patterns": REFERENCE_TOPICS[2],
  "langchain-langgraph-multi-agent": REFERENCE_TOPICS[2],
  "orkes-human-loop": REFERENCE_TOPICS[2],
  "nist-and-research": REFERENCE_TOPICS[2],
  "long-document-protocol": REFERENCE_TOPICS[3],
  "long-context-basics": REFERENCE_TOPICS[3],
  "lost-middle-evidence": REFERENCE_TOPICS[3],
  "prompt-organization": REFERENCE_TOPICS[3],
  "grounding-verification": REFERENCE_TOPICS[3],
  "structured-output-notes": REFERENCE_TOPICS[3],
  "citation-check": REFERENCE_TOPICS[4],
  "openai-hallucinations": REFERENCE_TOPICS[4],
  "openai-structured-outputs": REFERENCE_TOPICS[4],
  "anthropic-citations": REFERENCE_TOPICS[4],
  "google-grounding": REFERENCE_TOPICS[4],
  "microsoft-groundedness": REFERENCE_TOPICS[4],
  "nist-and-attribution-research": REFERENCE_TOPICS[4],
  "openai-limitations": REFERENCE_TOPICS[4],
  "anthropic-grounding": REFERENCE_TOPICS[4],
  "google-double-check": REFERENCE_TOPICS[4],
  "microsoft-grounding": REFERENCE_TOPICS[4],
  "rf-official-sources": REFERENCE_TOPICS[4],
  "nist-genai-profile": REFERENCE_TOPICS[4],
  "anthropic-hallucination": REFERENCE_TOPICS[4],
  "openai-evals": REFERENCE_TOPICS[5],
  "braintrust-prompt-eval": REFERENCE_TOPICS[5],
};

const TITLE_BY_SLUG: Record<string, string> = {
  "anthropic-hallucination":
    "Как уменьшить выдуманные факты в ответах (инструкция Anthropic Claude)",
  "braintrust-prompt-eval":
    "Как оценивать качество запросов к ИИ (материал Braintrust)",
  "google-double-check":
    "Google о неточностях Gemini, двойной проверке и опоре на источники (double-check и grounding)",
  "microsoft-grounding":
    "Microsoft о контроле человеком, проверке и ответах без опоры на источник (human oversight, validation, ungrounded responses)",
  "openai-evals":
    "Как правильно проверять качество ответов ИИ (рекомендации OpenAI)",
  "orkes-human-loop":
    "Участие человека в работе ИИ-агентов (Human-in-the-Loop, Orkes)",
  "nist-genai-profile":
    "Система NIST для управления рисками генеративного ИИ (AI RMF и Generative AI Profile)",
  "langchain-langgraph-multi-agent":
    "LangChain и LangGraph: несколько ИИ-агентов, подагенты, распределитель и координатор",
  "mnemonic-frameworks":
    "Как использовать схемы-памятки для составления запросов (RTF, RACE и другие)",
  "openai-agents-sdk":
    "Инструменты OpenAI для ИИ-агентов: передача задач, координация и контроль человеком",
  "anthropic-agent-patterns":
    "Anthropic: как строить эффективных ИИ-агентов и распределять роли",
  "google-multi-agent-grounding":
    "Google Cloud: несколько ИИ-агентов и опора ответов на источники",
  "microsoft-orchestration-patterns":
    "Microsoft Azure: схемы координации ИИ-агентов",
  "nist-and-research":
    "Управление рисками ИИ, самопроверка и обсуждение несколькими агентами (NIST AI RMF, Reflexion, Multiagent Debate)",
  "openai-structured-outputs":
    "Структурированный ответ по заданной схеме (Structured Outputs)",
  "google-grounding":
    "Опора ответа на источники и проверка каждого утверждения (grounding)",
  "microsoft-groundedness":
    "Подкреплённость ответа источниками и риск выдуманных сведений (groundedness)",
};

const USE_CASE_BY_TOPIC: Record<ReferenceTopic, string> = {
  "Безопасность данных и файлов":
    "Перед загрузкой договоров, таблиц, писем и других рабочих файлов в ИИ.",
  "Как составлять запросы к ИИ":
    "Когда ответ получается слишком общим, неточным или не в том формате.",
  "Сложные задачи и ИИ-агенты":
    "Когда большую задачу нужно разбить на понятные этапы и роли.",
  "Длинные документы и большой контекст":
    "При разборе больших документов, где легко пропустить важную часть.",
  "Проверка фактов, цитат и правовой информации":
    "Когда ошибка в фактах, ссылках или правовой информации может навредить.",
  "Оценка качества ответов ИИ":
    "Чтобы сравнить ответы или понять, стал ли запрос действительно лучше.",
};

export function referenceTopicFor(slug: string): ReferenceTopic {
  return TOPIC_BY_SLUG[slug] ?? REFERENCE_TOPICS[1];
}

export function localizedReferenceTitle(slug: string, title: string) {
  return TITLE_BY_SLUG[slug] ?? title;
}

export function referenceUseCase(topic: ReferenceTopic) {
  return USE_CASE_BY_TOPIC[topic];
}

export function referenceMaterialType(category: string, slug: string) {
  if (category === "cheat-sheet" || category === "Шпаргалка") return "Шпаргалка";
  if (category === "Практическая памятка" || slug.includes("checklist")) return "Чек-лист";
  if (category === "Исследование" || category === "Исследования" || category === "standard-and-research" || category === "RISK_FRAMEWORK") {
    return "Исследование или стандарт";
  }
  if (category === "official-doc" || category === "framework-doc" || category.endsWith("Docs") || category.endsWith("Guides") || category === "RF_PRIMARY_SOURCES") {
    return "Проверенный источник";
  }
  if (category === "note" || category === "Основа метода") return "Понятное объяснение";
  return "Практическая инструкция";
}

const CONTENT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/specialist takes over/gi, "специалист принимает задачу (specialist takes over)"],
  [/manager stays in control/gi, "руководитель сохраняет контроль (manager stays in control)"],
  [/agents as tools/gi, "ИИ-агенты как инструменты (agents as tools)"],
  [/context management/gi, "управление контекстом (context management)"],
  [/consequential decisions/gi, "важные решения с последствиями (consequential decisions)"],
  [/cited sources/gi, "источники с цитатами (cited sources)"],
  [/source links/gi, "ссылки на источники (source links)"],
  [/long context/gi, "длинный контекст (long context)"],
  [/working memory/gi, "рабочая память (working memory)"],
  [/prompt engineering/gi, "составление запросов (prompt engineering)"],
  [/human-in-the-loop/gi, "участие человека (human-in-the-loop)"],
  [/human oversight/gi, "контроль человеком (human oversight)"],
  [/ungrounded responses?/gi, "ответы без опоры на источники (ungrounded responses)"],
  [/groundedness/gi, "подкреплённость источниками (groundedness)"],
  [/grounding/gi, "опора на источники (grounding)"],
  [/double-check/gi, "двойная проверка (double-check)"],
  [/success criteria/gi, "критерии успешного результата (success criteria)"],
  [/multi-agent/gi, "несколько ИИ-агентов (multi-agent)"],
  [/guardrails/gi, "ограничения безопасности (guardrails)"],
  [/orchestration/gi, "координация работы (orchestration)"],
  [/handoffs?/gi, "передача задачи между ролями (handoff)"],
  [/supervisor/gi, "координатор (supervisor)"],
  [/router/gi, "распределитель задач (router)"],
  [/evals/gi, "проверки качества (evals)"],
  [/validation/gi, "проверка (validation)"],
  [/outputs?/gi, "результаты (outputs)"],
  [/citations?/gi, "цитаты (citations)"],
  [/recall/gi, "полнота извлечения сведений (recall)"],
  [/drift/gi, "отклонение поведения (drift)"],
];

export function localizeReferenceContent(content: string) {
  return CONTENT_REPLACEMENTS.reduce(
    (localized, [pattern, replacement]) => localized.replace(pattern, replacement),
    content,
  );
}
