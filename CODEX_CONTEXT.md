# CODEX_CONTEXT

Актуально на 2026-07-15. Этот файл нужен, чтобы быстро продолжить проект с другого компьютера или в новом чате Codex без повторного восстановления контекста.

## 1. Что это за проект

Проект: персональный веб-сервис обучения работе с ИИ для папы.

Идея: не лендинг и не набор статей, а личный учебный cockpit, где ученик проходит уроки, практику, тесты, видит прогресс, получает ачивки и возвращается к справочнику/глоссарию/сценариям.

Курс не учит юридической экспертизе. Юридические документы используются как тренировочный материал для работы с ИИ: обезличивание, постановка задачи, декомпозиция, цитатный контроль, проверка выводов, длинный контекст, роли и личная система сценариев.

Важная граница: юрисдикцию РБ из основной программы убрали. В основной программе остаётся РФ как проверяемый контур. Все юридически значимые выводы должны быть помечены как требующие проверки квалифицированным юристом.

## 2. Репозиторий и ветка

Рабочая папка:

```text
C:\Users\user\YandexDisk\!STARLINE\!РАБОТА\ai_course_for_dad
```

Git:

```text
branch: main
remote: origin https://github.com/MeltoSanto/ai_course_for_dad.git
```

Основные папки:

```text
docs/                         исследовательские материалы и программа
service/                      Next.js веб-сервис
service/prisma/               Prisma schema, миграции, seed
service/scripts/              импорт контент-пакетов и reset QA
service/src/app/              App Router страницы и server actions
service/src/components/       общие UI-компоненты
service/src/lib/              DB/session/course/progress/achievements helpers
lesson-research-prompts/      промпты для подготовки контент-пакетов уроков 4-8
```

Корневые контент-пакеты:

```text
lesson-1-data-safety.md
lesson-2-context-engineering.md
lesson-3-task-decomposition.md
```

## 3. Технологический стек

Сервис находится в `service/`.

Стек:

- Next.js `16.2.10` App Router;
- React `19.2.4`;
- TypeScript;
- Prisma `6.19.3`;
- SQLite;
- HeroUI `@heroui/react`;
- Tailwind CSS v4 через `@tailwindcss/postcss`;
- lucide-react для иконок;
- framer-motion подключён как зависимость.

Скрипты из `service/package.json`:

```bash
npm run dev            # локальный dev server
npm run build          # production build
npm run start          # next start -H 0.0.0.0
npm run lint           # eslint
npm run db:generate    # prisma generate
npm run db:migrate     # prisma migrate dev
npm run db:deploy      # prisma migrate deploy
npm run db:seed        # node prisma/seed.mjs
npm run content:import # node scripts/import-lesson-package.mjs
npm run qa:reset       # node scripts/reset-qa-user.mjs
npm run db:studio      # prisma studio
npm run prod:setup     # migrate deploy + seed + build
```

## 4. Локальный запуск

Из папки `service/`:

```bash
npm install
cp .env.example .env
npm run db:deploy
npm run db:seed
npm run dev
```

Локальный адрес:

```text
http://127.0.0.1:3000
```

Если порт занят:

```bash
npm run dev -- -H 127.0.0.1 -p 3001
```

## 5. Production / VPS

`service/.env.example`:

```bash
DATABASE_URL="file:../data/prod.db"
AUTH_SECRET="replace-with-a-long-random-secret"
SEED_STUDENT_PASSWORD="change-roman-password"
SEED_QA_PASSWORD="1234"
SEED_ADMIN_PASSWORD="change-nikita-password"
QA_USERNAME="qa"
QA_PASSWORD="1234"
```

Важно:

- `DATABASE_URL="file:../data/prod.db"` хранит SQLite в `service/data/prod.db`.
- Папку `service/data/` нужно сохранять между деплоями и бэкапить.
- В production cookie авторизации выставляется как secure, поэтому нужен HTTPS через домен.

Первый запуск на VPS:

```bash
cd /opt/ai-course/service
npm ci
mkdir -p data
npm run prod:setup
PORT=3000 npm start
```

Проверка:

```bash
curl -f http://127.0.0.1:3000/api/health
```

Ожидаемый ответ:

```json
{"ok":true,"database":"ok"}
```

Обновление на VPS:

```bash
cd /opt/ai-course
git pull
cd service
npm ci
npm run db:deploy
npm run build
sudo systemctl restart ai-course
curl -f http://127.0.0.1:3000/api/health
```

Backup SQLite:

```bash
mkdir -p backups
cp data/prod.db "backups/prod-$(date +%F-%H%M).db"
```

## 6. Пользователи и роли

Роли:

- `STUDENT`;
- `ADMIN`.

Стартовые пользователи создаются `npm run db:seed`:

```text
roman  / пароль из SEED_STUDENT_PASSWORD, fallback 1234 / STUDENT
qa     / пароль из SEED_QA_PASSWORD, fallback 1234     / STUDENT
nikita / пароль из SEED_ADMIN_PASSWORD, fallback 1234  / ADMIN
```

Важно: если пользователь уже существует, seed обновляет displayName/role, но не перезаписывает пароль.

Для повторяемого тестирования без порчи прогресса Романа:

```bash
cd service
npm run qa:reset
```

`qa:reset` создаёт/обновляет пользователя `qa`, сбрасывает только его прогресс, попытки тестов и ачивки.

## 7. Основные маршруты сервиса

Публичного лендинга нет. После входа пользователь попадает в учебный cockpit.

```text
/login                         вход
/                              главная: статистика, карта, продолжение, ачивки
/lessons                       плитки уроков
/lessons/[slug]                рабочая страница урока
/practice                      отдельная страница практики
/tests                         отдельная страница тестов
/progress                      прогресс, история, reset QA для qa
/achievements                  ачивки
/reference                     справочник
/glossary                      глоссарий
/scenarios                     сценарии
/admin                         админка
/admin/library                 справочник, глоссарий, сценарии, ачивки
/admin/lessons/[lessonId]      редактирование урока, блоков, практики, тестов
/api/health                    healthcheck
```

Навигация слева должна работать как реальные разделы, а не якоря лендинга.

## 8. UI/UX текущее состояние

Визуальный стиль: cockpit в духе выбранного референса `Student Learning Cockpit`.

Ключевые решения:

- тёмный левый сайдбар;
- светлая технологичная рабочая область;
- зелёный акцент;
- HeroUI для интерактивных элементов;
- lucide icons;
- карточки/панели с аккуратными границами;
- главная страница показывает статистику, прогресс, карту маршрута и ачивки;
- уроки открываются отдельными страницами;
- практика, тесты, прогресс, ачивки, справочник, глоссарий и сценарии вынесены на отдельные страницы;
- админка отделена от ученического сценария.

Markdown уроков рендерится через `service/src/components/markdown-content.tsx`.

Рендер поддерживает:

- `#`, `##`, `###`, `####`;
- обычные абзацы;
- ordered/unordered lists;
- чек-листы `- [ ]` и `- [x]`;
- blockquote `>`;
- markdown tables;
- code fences с кнопкой копирования;
- inline code;
- `**bold**`;
- `*italic*`;
- `__underline__`, `++underline++`, `<u>...</u>`;
- `==highlight==`;
- markdown links.

Для готовых промптов обязательно использовать fenced code block:

````md
```text
Текст промпта
```
````

Такой блок получает кнопку `Копировать` и индикатор `Скопировано` / `В буфере`.

## 9. База данных

Prisma schema: `service/prisma/schema.prisma`.

Основные модели:

- `User`;
- `Lesson`;
- `LessonBlock`;
- `Assignment`;
- `LessonTest`;
- `Question`;
- `QuestionOption`;
- `UserLessonProgress`;
- `UserBlockProgress`;
- `UserAssignmentProgress`;
- `UserTestAttempt`;
- `Achievement`;
- `UserAchievement`;
- `Scenario`;
- `GlossaryTerm`;
- `ReferenceItem`.

Ключевые enum:

```text
UserRole: STUDENT, ADMIN
PublicationStatus: DRAFT, PUBLISHED, ARCHIVED
LessonKind: CORE, EXTRA
LessonBlockType: OBJECTIVE, EXPLANATION, DEMONSTRATION, PRACTICE, PROMPTS, CHECK, ARTIFACT, MARKDOWN, CALLOUT
ProgressStatus: NOT_STARTED, IN_PROGRESS, COMPLETED
AssignmentStatus: NOT_STARTED, IN_PROGRESS, SUBMITTED, COMPLETED
QuestionType: SINGLE_CHOICE, MULTIPLE_CHOICE, SORT_STEPS, FIND_PROMPT_ERROR, FILL_BLANK
AchievementTriggerType: LESSON_COMPLETED, PRACTICE_COMPLETED, TEST_PASSED, SCENARIO_SAVED, MANUAL
```

## 10. Прогресс и правила завершения

Прогресс хранится на сервере в SQLite.

Текущее правило процента урока:

```text
totalUnits = published blocks + assignments + tests
completedUnits = completed blocks + completed assignments + passed tests
percent = round(completedUnits / totalUnits * 100)
```

Урок считается завершённым, когда:

- все опубликованные блоки отмечены `Готово`;
- практика завершена;
- тест сдан.

`refreshLessonProgress` обновляет:

- `lastBlockId`;
- `lastVisitedAt`;
- `status`;
- `percent`;
- `completedAt`.

Кнопки `Предыдущий блок` / `Следующий блок` как отдельная ручная навигация были признаны лишними. Основной сценарий: ученик читает блоки, нажимает `Готово`, система обновляет прогресс и плавно скроллит к следующему блоку.

## 11. Практика и тесты

Практика:

- сохраняется на сервере;
- статусы: `NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `COMPLETED`;
- после выполнения может выдавать ачивку;
- при проблемах с сессией важно не терять введённый текст.

Тесты:

- нельзя отправить пустой тест;
- ответы сохраняются в `UserTestAttempt.answers`;
- статистика учитывает ever passed: если тест однажды был сдан, урок может считать тестовый слой пройденным даже после неудачной поздней попытки;
- после успешной сдачи теста выдаются тестовые ачивки.

Типы вопросов:

- `SINGLE_CHOICE`;
- `MULTIPLE_CHOICE`;
- `SORT_STEPS`;
- `FIND_PROMPT_ERROR`;
- `FILL_BLANK`.

Для `correctText` можно задавать несколько правильных вариантов через `|`.

Пример:

```md
correctText: нет задачи | нет формата | нет позитивной инструкции
```

Для `SORT_STEPS` лучше использовать короткие элементы, например буквы:

```md
correctOrder:
1. B
2. D
3. C
4. A
```

## 12. Ачивки

Сейчас в базе 11 ачивок.

Коды:

```text
safe-start
task-architect
step-by-step
citation-discipline
long-doc-tamer
jurisdiction-control
ai-team
personal-system
first-test
practice-track
course-finish
```

Логика выдачи в `service/src/lib/achievements.ts`:

- `awardLessonAchievements` выдаёт уроковые ачивки и `course-finish`;
- `awardPracticeAchievements` выдаёт практические ачивки и `practice-track`;
- `awardTestAchievements` выдаёт `first-test`, уроковую ачивку для некоторых уроков и специальные тестовые ачивки.

Важно: для урока 2 после успешного теста также выдаётся ачивка за урок через `awardTestAchievements`.

## 13. Текущее состояние контента в БД

По состоянию локальной SQLite на 2026-07-15:

- пользователей: `roman`, `qa`, `nikita`;
- core lessons: 8;
- extra lessons: 8;
- glossary terms: 27;
- reference items: 12;
- scenarios: 5;
- achievements: 11.

Core lessons:

| order | slug | title | status | content state |
| --- | --- | --- | --- | --- |
| 1 | `data-safety` | Безопасность и обезличивание данных | PUBLISHED | импортирован контент-пакет `lesson-1-data-safety.md` |
| 2 | `managed-ai-brief` | Контекст-инжиниринг и управляемое ТЗ для ИИ | PUBLISHED | импортирован и отформатирован `lesson-2-context-engineering.md` |
| 3 | `task-decomposition` | Декомпозиция сложной задачи | PUBLISHED | в БД пока сидовый каркас; файл `lesson-3-task-decomposition.md` готовится |
| 4 | `citation-control` | Цитатный контроль | PUBLISHED | сидовый каркас |
| 5 | `long-documents` | Длинные документы и контекстное окно | PUBLISHED | сидовый каркас |
| 6 | `rf-legal-check` | Проверка норм и дисциплина юрисдикции РФ | PUBLISHED | сидовый каркас |
| 7 | `agent-roles` | Агентные роли | PUBLISHED | сидовый каркас |
| 8 | `personal-ai-system` | Личная система работы с ИИ | PUBLISHED | сидовый каркас |

Extra lessons из `docs/advanced_ai_techniques.md`:

| order | slug | title |
| --- | --- | --- |
| 9 | `structured-outputs` | Структурированные ответы: таблицы и JSON |
| 10 | `personal-evals` | Личные evals: как проверять промпты и модели |
| 11 | `guardrails-red-teaming` | Guardrails и red teaming для личной работы |
| 12 | `rag-knowledge-base` | RAG и личная база знаний |
| 13 | `tool-calling-mcp` | Tool calling, MCP и ИИ как управляющий слой |
| 14 | `multimodal-ai` | Мультимодальный ИИ: PDF, сканы, таблицы |
| 15 | `browser-agents` | Browser agents и human-in-the-loop |
| 16 | `ai-operating-system` | Память, наблюдаемость и личная AI Operating System |

## 14. Контент-пакеты уроков

Импортёр: `service/scripts/import-lesson-package.mjs`.

Команда:

```bash
cd service
npm run content:import -- ..\lesson-2-context-engineering.md
```

Если путь не указан, импортёр берёт `lesson-1-data-safety.md`.

Важно:

- импортёр обновляет урок по `slug`;
- для того же slug он пересоздаёт блоки, практику и тест;
- это может сбросить прогресс, потому что меняются id блоков/практики/теста;
- перед реальным использованием курса нужно решить стратегию обновления контента без потери прогресса.

Требуемая структура пакета:

````md
# lesson
slug: managed-ai-brief
title: ...
subtitle: ...
description: ...
durationMinutes: 45
mainSkill: ...

# blocks

## block 1
type: OBJECTIVE
title: ...
content: |
  ...

## block 2
type: EXPLANATION
title: ...
content: |
  ...

# assignment

title: ...
instructions: |
  ...
expectedProcess: |
  ...
checklist: |
  - [ ] ...

# test

title: ...
description: ...
passingScore: 8

## question 1
type: SINGLE_CHOICE
prompt: ...
points: 1
options:
- [x] правильный вариант
- [ ] неправильный вариант
explanation: ...

# glossary

## term 1
term: ...
definition: ...
content: |
  ...

# referenceItems

## reference 1
slug: ...
title: ...
category: ...
content: |
  ...

# scenario

slug: ...
title: ...
summary: ...
content: |
  ...
````

Рекомендуемая структура урока:

1. `OBJECTIVE`;
2. `EXPLANATION`;
3. `EXPLANATION`;
4. `DEMONSTRATION`;
5. `PROMPTS`;
6. `PRACTICE`;
7. `CHECK`;
8. `ARTIFACT`.

Для теста желательно 10 вопросов и все 5 типов:

- 2-3 `SINGLE_CHOICE`;
- 2 `MULTIPLE_CHOICE`;
- 1-2 `SORT_STEPS`;
- 2 `FIND_PROMPT_ERROR`;
- 1-2 `FILL_BLANK`.

## 15. Урок 1

Файл:

```text
lesson-1-data-safety.md
```

Статус:

- импортирован;
- отображается через markdown renderer;
- содержит 8 блоков, практику, тест, глоссарий, справочник, сценарий.

Тема:

- безопасность;
- обезличивание;
- что нельзя отдавать ИИ;
- учебные/вымышленные документы;
- безопасная замена чувствительных данных.

## 16. Урок 2

Файл:

```text
lesson-2-context-engineering.md
```

Slug:

```text
managed-ai-brief
```

Статус:

- импортирован в существующий урок 2;
- title в БД: `Контекст-инжиниринг и управляемое ТЗ для ИИ`;
- 8 blocks;
- 1 assignment;
- 1 test;
- 10 questions;
- passingScore: 8;
- maxScore: 10;
- 9 glossary terms;
- 4 reference items;
- scenario: `context-task-brief`.

Что сделано 2026-07-15:

- исходный slug `context-engineering` заменён на `managed-ai-brief`, чтобы обновить существующую карточку урока 2;
- удалены research citation-маркеры вида `cite...`;
- сокращён description;
- добавлены callout-блоки;
- добавлены внутренние `###`-подзаголовки;
- блок “8 полей ТЗ” переделан в markdown table;
- добавлены подсветки `==...==`;
- перед шаблонами промптов добавлено “Когда использовать”;
- чек-лист сгруппирован;
- смягчены правильные варианты для текстовых вопросов;
- проверена кнопка копирования prompt code blocks.

Проверки после импорта:

```bash
npm run lint
npm run build
```

Production-страница проверялась локально на `http://127.0.0.1:3001/lessons/managed-ai-brief`:

- сырой markdown не торчит;
- таблица рендерится;
- callout и highlight видны;
- code blocks имеют `Копировать`;
- копирование меняет буфер и показывает `Скопировано`.

## 17. Урок 3

Файл:

```text
lesson-3-task-decomposition.md
```

Slug:

```text
task-decomposition
```

Статус:

- файл существует;
- содержит 8 blocks и 8 questions;
- в файле ещё есть research citation-маркеры `cite...`;
- в БД сейчас сидовый каркас урока 3, а не финальный пакет из файла.

Перед импортом урока 3 нужно:

1. удалить citation/private-use markers;
2. проверить формат всех секций;
3. привести markdown к cockpit-стилю, как урок 2;
4. желательно довести тест до 10 вопросов и всех 5 типов;
5. импортировать:

```bash
cd service
npm run content:import -- ..\lesson-3-task-decomposition.md
```

6. проверить:

```bash
npm run lint
npm run build
```

## 18. Промпты для подготовки уроков 4-8

Создана папка:

```text
lesson-research-prompts/
```

Файлы:

```text
lesson-research-prompts/lesson-4-citation-control-prompt.md
lesson-research-prompts/lesson-5-long-documents-prompt.md
lesson-research-prompts/lesson-6-rf-legal-check-prompt.md
lesson-research-prompts/lesson-7-agent-roles-prompt.md
lesson-research-prompts/lesson-8-personal-ai-system-prompt.md
```

Их задача: дома скормить исследовательской нейронке отдельный промпт по нужному уроку и получить готовый `.md` контент-пакет в формате импортёра.

Правила для всех будущих пакетов:

- не добавлять research citation widgets вида `cite...`;
- источники указывать в `# referenceItems`;
- учебные документы делать вымышленными;
- не давать юридическую консультацию;
- юридические выводы помечать как требующие ручной проверки;
- использовать markdown-форматирование: таблицы, callout `>`, списки, `==highlight==`, code fences для промптов;
- делать материал читаемым для ученика 50+.

## 19. Главный план курса

Основание:

```text
docs/compiled_research_analysis.md
docs/course_program_web_service.md
docs/advanced_ai_techniques.md
```

Основная программа:

1. Безопасность и обезличивание данных.
2. Контекст-инжиниринг и управляемое ТЗ для ИИ.
3. Декомпозиция сложной задачи.
4. Цитатный контроль.
5. Длинные документы и контекстное окно.
6. Проверка норм и дисциплина юрисдикции РФ.
7. Агентный подход через роли.
8. Личная система работы с ИИ.

Дополнительные уроки из `docs/advanced_ai_techniques.md` уже есть в seed как extra lessons, но пока это каркас.

## 20. Админка

Админ-пользователь:

```text
nikita
```

Админские страницы:

```text
/admin
/admin/library
/admin/lessons/[lessonId]
```

Админка умеет:

- создавать/редактировать уроки;
- редактировать блоки урока;
- редактировать практику;
- редактировать тесты и варианты ответов;
- управлять справочником;
- управлять глоссарием;
- управлять сценариями;
- управлять ачивками.

Важно по UX админки:

- длинные формы уже частично разбиты, но всё ещё могут быть тяжёлыми;
- при большом наполнении лучше добавлять табы/секции и валидацию;
- контент-пакеты через markdown пока быстрее и безопаснее для массового наполнения, чем ручная админка.

## 21. Известные технические риски и TODO

Важное:

- импортёр пересоздаёт дочерние записи урока, что может ломать старый прогресс по id;
- урок 3 перед импортом надо очистить от citation-маркеров;
- seed создаёт каркас для всех 16 уроков, но финальный контент есть только у уроков 1-2;
- перед production нужно проверить `.env`, HTTPS, backup SQLite и systemd/reverse proxy;
- responsive/mobile уже правился, но после крупных UI-изменений всегда прогонять smoke на 390/768/desktop;
- после наполнения каждого урока прогонять ученический сценарий под `qa`;
- юридические темы не считать проверенными без отдельной квалифицированной проверки.

Желательные проверки перед каждым push:

```bash
cd service
npm run lint
npm run build
```

Для QA:

```bash
cd service
npm run qa:reset
npm run dev
```

Потом вручную пройти:

- login `qa`;
- главная;
- урок;
- отметка блоков `Готово`;
- практика;
- тест;
- прогресс;
- ачивки;
- справочник/глоссарий/сценарии;
- admin под `nikita`.

## 22. Предпочтения пользователя

Пользователь хочет:

- делать свой сервис, а не Stepik;
- HeroUI и красивый технологичный интерфейс;
- отдельные страницы вместо якорей лендинга;
- прогресс на сервере, не localStorage;
- простой login/password;
- `roman` как ученик;
- `nikita` как админ;
- `qa` для тестов;
- SQLite достаточно;
- ачивки нужны, механику можно развивать постепенно;
- материалы наполнять через исследовательскую нейронку, потом импортировать в БД;
- не создавать лишние audit-документы, если короткий вывод можно дать в чате;
- после каждого крупного шага говорить, какой следующий пункт по плану.

## 23. Рабочий стиль для следующего Codex

Если продолжаешь проект:

1. Сначала прочитай этот файл.
2. Проверь `git status --short`.
3. Не откатывай чужие изменения.
4. Для поиска используй `rg`.
5. Для ручных правок файлов используй `apply_patch`.
6. После изменений запускай `npm run lint` и `npm run build` из `service/`.
7. Для контента сначала правь `.md` пакет, потом импортируй в SQLite.
8. После импорта проверяй, что нет `cite...` и похожих private-use markers.
9. Если пользователь просит push, делай commit и `git push origin main`.

## 24. Последнее подтверждённое состояние

На момент обновления этого файла:

- `npm run lint` проходил после форматирования урока 2;
- `npm run build` проходил после форматирования урока 2;
- lesson 2 импортирован и визуально проверен;
- prompts for lessons 4-8 добавлены в `lesson-research-prompts/`;
- текущая задача пользователя: обновить контекст, добавить промпты 4-8 и запушить всё на GitHub.
