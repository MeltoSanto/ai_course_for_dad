# CODEX_CONTEXT

Актуально на 2026-07-17. Этот файл нужен, чтобы быстро продолжить проект с другого компьютера или в новом чате Codex без повторного восстановления контекста.

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

Версионирование и релизы:

- базовый релиз на Beget — `1.0.0`, commit `708f483` от 2026-07-16;
- текущая подготовленная версия — `1.1.0`;
- версия хранится в `service/package.json` и показывается внизу левого меню;
- журнал изменений ведётся в корневом `CHANGELOG.md`;
- перед каждым push с изменениями продукта обязательно увеличить версию, обновить `CHANGELOG.md`, выполнить lint и production build;
- push до обновления версии и журнала изменений запрещён.

Основные папки:

```text
docs/                         исследовательские материалы и программа
service/                      Next.js веб-сервис
service/prisma/               Prisma schema, миграции, seed
service/scripts/              импорт контент-пакетов и подготовка standalone-сборки
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

## 5. Production / VPS / Beget

`service/.env.example`:

```bash
DATABASE_URL="file:../data/prod.db"
AUTH_SECRET="replace-with-a-long-random-secret"
SEED_STUDENT_PASSWORD="change-roman-password"
SEED_ADMIN_PASSWORD="change-nikita-password"
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

### Beget shared hosting

Для Beget используется standalone-сборка Next.js под Passenger:

```bash
cd service
npm ci
npm run db:deploy
npm run build:hosting
```

Результат находится в `service/.next/standalone/`. Скрипт
`service/scripts/prepare-standalone.mjs` дополнительно переносит туда
`public/` и `.next/static/`. Шаблон Passenger находится в
`service/deploy/beget/htaccess.template`.

В локальном Git настроен только remote `origin` на GitHub. Отдельного Beget
remote, SSH-профиля или SFTP-конфигурации в репозитории нет. Перед следующим
ручным деплоем нужно уточнить, подтягивает ли Beget GitHub автоматически; если
нет — использовать предоставленный владельцем доступ к панели, SSH или SFTP.

Перед обновлением production обязательно:

1. сделать backup production SQLite;
2. загрузить новый код/standalone-сборку;
3. выполнить `prisma migrate deploy` для production-базы;
4. перезапустить Passenger-приложение;
5. проверить `/api/health`, вход, один урок и админку.

## 6. Пользователи и роли

Роли:

- `STUDENT`;
- `ADMIN`.

Стартовые пользователи создаются `npm run db:seed`:

```text
roman  / пароль из SEED_STUDENT_PASSWORD, fallback 1407 / STUDENT
nikita / пароль из SEED_ADMIN_PASSWORD, fallback 1234   / ADMIN
```

Важно: если пользователь уже существует, seed обновляет displayName/role, но не перезаписывает пароль.

Логин и пароль проверяются без учёта регистра. Тестовые функции доступны администратору `nikita`; отдельный пользователь `qa` удалён и seed больше его не создаёт.

## 7. Основные маршруты сервиса

Публичного лендинга нет. После входа пользователь попадает в учебный cockpit.

```text
/login                         вход
/                              главная: статистика, карта, продолжение, ачивки
/lessons                       плитки уроков
/lessons/[slug]                рабочая страница урока
/practice                      отдельная страница практики
/tests                         отдельная страница тестов
/progress                      прогресс, история и сброс тестового прогресса для администратора
/achievements                  ачивки
/search                        глобальный поиск по урокам, справочнику, глоссарию и сценариям
/reference                     справочник
/glossary                      глоссарий
/scenarios                     сценарии
/admin                         админка
/admin/accounts                аккаунты, блокировки и активные сессии
/admin/lessons                 список уроков для редактирования
/admin/library                 справочник, глоссарий, сценарии, ачивки
/admin/lessons/[lessonId]      редактирование урока, блоков, практики, тестов
/admin/progress                активность и управление прогрессом учеников
/api/activity                  heartbeat активности авторизованного пользователя
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
- шапка содержит глобальный поиск по урокам, справочнику, глоссарию и сценариям;
- блок пользователя в шапке оформлен как информационный, а не как ложная кнопка;
- справочник имеет фильтры, сортировку, понятные русские категории и объяснения назначения материалов;
- глоссарий оформлен как словарь с алфавитной навигацией, поиском и единым форматированием терминов;
- все карточки уроков и блоки промптов используют общий дочерний компонент, который предотвращает горизонтальный выход за экран.

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
- `UserAccessSession`;
- `UserActivityDay`.

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
- при неполном заполнении подсвечиваются только пропущенные карточки;
- неполная попытка не сохраняется и не начисляет баллы;
- ранее введённые ответы и частично заполненная сортировка сохраняются после предупреждения;
- ответы сохраняются в `UserTestAttempt.answers`;
- после завершённой попытки вопросы блокируются до нажатия `Пройти тест заново`;
- новая попытка очищает поля и перемешивает вопросы/варианты стабильным seed для этой попытки;
- для `MULTIPLE_CHOICE` начисляются частичные баллы с вычетом ошибочно выбранных вариантов;
- в разборе показываются ответ ученика, правильный ответ, пояснения и ссылка на материал урока;
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

Изображения ачивок:

- исходные атласы лежат в `service/public/achievements/`;
- `AchievementArtwork` сопоставляет каждый из 11 кодов со своей миниатюрой;
- круглые изображения используются в каталогах и карточках прогресса;
- большая версия показывается в полноэкранном окне при получении ачивки;
- атласы отдаются без повторного уменьшения Next Image, поэтому сохраняют исходную чёткость;
- `AchievementUnlockOverlay` показывает анимированное уведомление и не повторяет уже просмотренное событие;
- в `/admin/library#achievements` у каждой активной ачивки есть кнопка `Получить и показать` для проверки;
- повторная тестовая выдача обновляет `awardedAt`, поэтому анимацию можно запускать многократно.

## 13. Текущее состояние контента в БД

По состоянию локальной SQLite на 2026-07-16:

- пользователей: `roman`, `nikita`;
- core lessons: 8;
- extra lessons: 8;
- glossary terms: 78;
- reference items: 42;
- scenarios: 11;
- achievements: 11.

Core lessons:

| order | slug | title | status | content state |
| --- | --- | --- | --- | --- |
| 1 | `data-safety` | Безопасность и обезличивание данных | PUBLISHED | импортирован контент-пакет `lesson-1-data-safety.md` |
| 2 | `managed-ai-brief` | Контекст-инжиниринг и управляемое ТЗ для ИИ | PUBLISHED | импортирован и отформатирован `lesson-2-context-engineering.md` |
| 3 | `task-decomposition` | Декомпозиция сложной задачи | PUBLISHED | импортирован и отформатирован `lesson-3-task-decomposition.md` |
| 4 | `citation-control` | Цитатный контроль | PUBLISHED | импортирован и отформатирован `lesson-4-citation-control.md` |
| 5 | `long-documents` | Длинные документы и контекстное окно | PUBLISHED | импортирован и отформатирован `lesson-5-long-documents.md` |
| 6 | `rf-legal-check` | Проверка норм и дисциплина юрисдикции РФ | PUBLISHED | импортирован и отформатирован `lesson-6-rf-legal-check.md` |
| 7 | `agent-roles` | Агентные роли | PUBLISHED | импортирован и отформатирован `lesson-7-agent-roles.md` |
| 8 | `personal-ai-system` | Личная система работы с ИИ | PUBLISHED | импортирован и отформатирован `lesson-8-personal-ai-system.md` |

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

- импортирован в существующий урок 3;
- title в БД: `Декомпозиция сложной задачи для ИИ`;
- 8 blocks;
- 1 assignment;
- 1 test;
- 10 questions;
- passingScore: 8;
- maxScore: 10;
- 8 glossary terms в пакете;
- 3 reference items в пакете;
- scenario: `document-analysis-pipeline`.

Что сделано 2026-07-16:

- удалены research citation-маркеры вида `cite...`;
- удалён служебный блок `# sourceNotes`;
- сокращён description;
- добавлены callout-блоки;
- добавлены внутренние `###`-подзаголовки;
- добавлены markdown tables для схемы конвейера и демонстрации;
- учебный фрагмент практики завернут в code block;
- шаблоны промптов сгруппированы с пояснениями “когда использовать”;
- чек-лист сгруппирован по этапам контроля;
- тест доведён до 10 вопросов, 10 баллов и всех 5 типов.

Команда импорта:

```bash
cd service
npm run content:import -- ..\lesson-3-task-decomposition.md
```

Проверки после импорта:

```bash
npm run lint
npm run build
```

## 18. Урок 4

Файл:

```text
lesson-4-citation-control.md
```

Slug:

```text
citation-control
```

Статус:

- импортирован в существующий урок 4;
- title в БД: `Цитатный контроль`;
- 8 blocks;
- 1 assignment;
- 1 test;
- 10 questions;
- passingScore: 8;
- maxScore: 10;
- 10 glossary terms в пакете, часть терминов обновляет существующие записи;
- 6 reference items в пакете;
- scenario: `citation-table-review`.

Что сделано 2026-07-16:

- удалены research citation-маркеры вида `cite...`;
- тест нормализован до 10 вопросов и 10 баллов;
- `SORT_STEPS` переведён на ответ буквами, чтобы ученику не нужно было переписывать длинные фразы;
- секции `# glossary` и `# referenceItems` переведены из формата `## term` / `## reference` в формат импортёра `- term:` / `- slug:`;
- импортирован полный пакет: блоки, практика, тест, глоссарий, справочник и сценарий.

Команда импорта:

```bash
cd service
npm run content:import -- ..\lesson-4-citation-control.md
```

Проверки после импорта:

```bash
npm run lint
npm run build
```

## 19. Урок 5

Файл:

```text
lesson-5-long-documents.md
```

Slug:

```text
long-documents
```

Статус:

- импортирован в существующий урок 5;
- title в БД: `Длинные документы и контекстное окно`;
- 8 blocks;
- 1 assignment;
- 1 test;
- 10 questions;
- passingScore: 8;
- maxScore: 10;
- 10 glossary terms в пакете, часть терминов обновляет существующие записи;
- 5 reference items в пакете;
- scenario: `long-document-protocol`.

Что сделано 2026-07-16:

- удалены research citation-маркеры вида `cite...`;
- тест нормализован до 10 вопросов и 10 баллов;
- оба `SORT_STEPS` переведены на ответ буквами, чтобы ученик не переписывал длинные фразы;
- секции `# glossary` и `# referenceItems` переведены из формата `## term` / `## reference` в формат импортёра `- term:` / `- slug:`;
- импортирован полный пакет: блоки, практика, тест, глоссарий, справочник и сценарий.

Команда импорта:

```bash
cd service
npm run content:import -- ..\lesson-5-long-documents.md
```

Проверки после импорта:

```bash
npm run lint
npm run build
```

## 20. Урок 6

Файл:

```text
lesson-6-rf-legal-check.md
```

Slug:

```text
rf-legal-check
```

Статус:

- импортирован в существующий урок 6;
- title в БД: `Проверка норм и дисциплина юрисдикции РФ`;
- 10 blocks;
- 1 assignment;
- 1 test;
- 10 questions;
- passingScore: 8;
- maxScore: 10;
- 10 glossary terms в пакете, часть терминов обновляет существующие записи;
- 6 reference items в пакете;
- scenario: `rf-check-protocol`.

Что сделано 2026-07-16:

- файл уже пришёл без research citation-маркеров;
- тест был переписан из неподдерживаемых типов `TRUE_FALSE`, `MATCHING`, `ORDERING` в поддерживаемые `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `FIND_PROMPT_ERROR`, `SORT_STEPS`;
- оба `SORT_STEPS` переведены на ответ буквами, чтобы ученик не переписывал длинные фразы;
- секции `# glossary` и `# referenceItems` переведены из формата `## term` / `## reference` в формат импортёра `- term:` / `- slug:`;
- импортирован полный пакет: блоки, практика, тест, глоссарий, справочник и сценарий.

Команда импорта:

```bash
cd service
npm run content:import -- ..\lesson-6-rf-legal-check.md
```

Проверки после импорта:

```bash
npm run lint
npm run build
```

Важно по содержанию:

- урок построен как учебная дисциплина проверки, а не как юридическая консультация;
- нормы и правовые выводы должны оставаться помеченными как требующие ручной проверки по официальным источникам РФ.

## 21. Урок 7

Файл:

```text
lesson-7-agent-roles.md
```

Slug:

```text
agent-roles
```

Статус:

- импортирован в существующий урок 7;
- title в БД: `Агентный подход через роли`;
- 9 blocks;
- 1 assignment;
- 1 test;
- 10 questions;
- passingScore: 8;
- maxScore: 10;
- 10 glossary terms в пакете;
- 6 reference items в пакете;
- scenario: `ai-role-team`.

Что сделано 2026-07-16:

- файл уже пришёл без research citation-маркеров;
- тест был переписан из неподдерживаемых типов `TRUE_FALSE`, `ORDERING`, `SHORT_ANSWER` в поддерживаемые `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `FIND_PROMPT_ERROR`, `SORT_STEPS`;
- оба `SORT_STEPS` переведены на ответ буквами, чтобы ученик не переписывал длинные фразы;
- секции `# glossary` и `# referenceItems` переведены из формата `## term` / `## reference` в формат импортёра `- term:` / `- slug:`;
- импортирован полный пакет: блоки, практика, тест, глоссарий, справочник и сценарий.

Команда импорта:

```bash
cd service
npm run content:import -- ..\lesson-7-agent-roles.md
```

Проверки после импорта:

```bash
npm run lint
npm run build
```

## 22. Урок 8

Файл:

```text
lesson-8-personal-ai-system.md
```

Slug:

```text
personal-ai-system
```

Статус:

- импортирован в существующий урок 8;
- title в БД: `Личная система работы с ИИ`;
- 8 blocks;
- 1 assignment;
- 1 test;
- 10 questions;
- passingScore: 8;
- maxScore: 10;
- 10 glossary terms в пакете;
- 4 reference items в пакете;
- scenario: `personal-ai-system-template`.

Что сделано 2026-07-16:

- файл уже пришёл без research citation-маркеров;
- добавлены внутренние `###`-подзаголовки для читаемости;
- готовые промпты разделены на отдельные code blocks, чтобы у каждого была своя кнопка копирования;
- тест был переписан из неподдерживаемых типов `ORDER`, `MATCH`, `TEXT_INPUT` в поддерживаемые `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `FIND_PROMPT_ERROR`, `SORT_STEPS`;
- оба `SORT_STEPS` переведены на ответ буквами, чтобы ученик не переписывал длинные фразы;
- секции `# glossary` и `# referenceItems` переведены из формата `## term` / `## reference` в формат импортёра `- term:` / `- slug:`;
- импортирован полный пакет: блоки, практика, тест, глоссарий, справочник и сценарий.

Команда импорта:

```bash
cd service
npm run content:import -- ..\lesson-8-personal-ai-system.md
```

Проверки после импорта:

```bash
npm run lint
npm run build
```

## 23. Промпты для подготовки уроков 4-8

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

## 24. Главный план курса

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

## 25. Админка

Админ-пользователь:

```text
nikita
```

Админские страницы:

```text
/admin
/admin/accounts
/admin/lessons
/admin/library
/admin/lessons/[lessonId]
/admin/progress
```

Админка умеет:

- создавать/редактировать уроки;
- редактировать блоки урока;
- редактировать практику;
- редактировать тесты и варианты ответов;
- управлять справочником;
- управлять глоссарием;
- управлять сценариями;
- управлять ачивками;
- создавать, редактировать, блокировать и удалять аккаунты;
- принудительно завершать активные сессии пользователя;
- просматривать входы, дни активности, последний маршрут и время в уроках;
- сбрасывать выбранные части прогресса конкретного ученика;
- выдавать любую активную ачивку себе кнопкой `Получить и показать`;
- сбрасывать собственный тестовый прогресс со страницы `/progress` без изменения материалов курса.

Важно по UX админки:

- длинные формы уже частично разбиты, но всё ещё могут быть тяжёлыми;
- при большом наполнении лучше добавлять табы/секции и валидацию;
- контент-пакеты через markdown пока быстрее и безопаснее для массового наполнения, чем ручная админка.

## 26. Известные технические риски и TODO

Важное:

- импортёр пересоздаёт дочерние записи урока, что может ломать старый прогресс по id;
- seed создаёт каркас для всех 16 уроков; полноценный контент импортирован для основных уроков 1-8, extra lessons 9-16 пока остаются каркасами;
- перед production нужно проверить `.env`, HTTPS, backup SQLite и systemd/reverse proxy;
- перед Beget-деплоем обязательно применить четыре новые миграции 2026-07-17: activity tracking, account management, test feedback и partial test scores;
- responsive/mobile уже правился, но после крупных UI-изменений всегда прогонять smoke на 390/768/desktop;
- после наполнения каждого урока прогонять ученический сценарий под `nikita`, используя админский сброс тестового прогресса;
- юридические темы не считать проверенными без отдельной квалифицированной проверки.

Обязательные проверки перед каждым push:

```bash
cd service
npm run lint
npm run build
```

Потом вручную пройти:

- login `nikita`;
- главная;
- урок;
- отметка блоков `Готово`;
- практика;
- тест;
- прогресс;
- ачивки;
- справочник/глоссарий/сценарии;
- админку, тестовую выдачу ачивок и сброс прогресса.

## 27. Предпочтения пользователя

Пользователь хочет:

- делать свой сервис, а не Stepik;
- HeroUI и красивый технологичный интерфейс;
- отдельные страницы вместо якорей лендинга;
- прогресс на сервере, не localStorage;
- простой login/password;
- `roman` как ученик;
- `nikita` как админ;
- тестовые и административные функции должны быть сосредоточены в аккаунте `nikita`; отдельный `qa` не нужен;
- SQLite достаточно;
- ачивки нужны, механику можно развивать постепенно;
- материалы наполнять через исследовательскую нейронку, потом импортировать в БД;
- не создавать лишние audit-документы, если короткий вывод можно дать в чате;
- после каждого крупного шага говорить, какой следующий пункт по плану.

## 28. Рабочий стиль для следующего Codex

Если продолжаешь проект:

1. Сначала прочитай этот файл.
2. Проверь `git status --short`.
3. Не откатывай чужие изменения.
4. Для поиска используй `rg`.
5. Для ручных правок файлов используй `apply_patch`.
6. После изменений запускай `npm run lint` и `npm run build` из `service/`.
7. Для контента сначала правь `.md` пакет, потом импортируй в SQLite.
8. После импорта проверяй, что нет `cite...` и похожих private-use markers.
9. Перед push обязательно обнови версию в `service/package.json` и `service/package-lock.json`, затем `CHANGELOG.md`.
10. После успешных lint/build создай commit и выполни `git push origin main`.
11. Не называй GitHub push деплоем на Beget, пока не подтверждён автодеплой или фактическое обновление Passenger-приложения.

## 29. Последнее подтверждённое состояние

На момент обновления этого файла:

- текущая версия сервиса — `1.1.0`, она отображается внизу левого меню;
- Beget-релиз `1.0.0` привязан к commit `708f483`; история следующего релиза описана в `CHANGELOG.md`;
- `npm run lint` проходит для версии `1.1.0`;
- `npm run build` проходит для версии `1.1.0`;
- lessons 1-8 импортированы в SQLite как полноценные контент-пакеты;
- extra lessons 9-16 пока сидовые каркасы;
- в SQLite остаются только `roman` (STUDENT) и `nikita` (ADMIN); `qa` удалён и больше не создаётся seed-скриптом;
- авторизация не зависит от регистра имени и пароля; актуальный fallback-пароль Романа — `1407`;
- глобальный поиск работает через `/search` и доступен из общей шапки;
- справочник и глоссарий переработаны для понятности и использования людьми 50+;
- форматирование блоков уроков унифицировано, длинные промпты переносятся и не создают горизонтальную прокрутку страницы;
- текстовые вопросы содержат подсказки о формате ответа без раскрытия правильного ответа;
- `SORT_STEPS` показывает варианты A, B, C, D и отдельные позиции для ввода/выбора букв;
- незавершённая отправка теста не создаёт попытку и не сбрасывает введённые ответы;
- завершённая попытка показывает разбор ошибок, частичные баллы и кнопку новой попытки;
- админ `nikita` управляет аккаунтами, сессиями, активностью и прогрессом учеников;
- все 11 ачивок получили свои круглые и полноразмерные изображения, анимацию получения и админские кнопки тестовой выдачи;
- production-сборка и локальный healthcheck на `http://localhost:3100/api/health` проходят;
- prompts for lessons 4-8 добавлены в `lesson-research-prompts/`;
- последние импортированные пакеты:
  - `lesson-3-task-decomposition.md`;
  - `lesson-4-citation-control.md`;
  - `lesson-5-long-documents.md`;
  - `lesson-6-rf-legal-check.md`;
  - `lesson-7-agent-roles.md`;
  - `lesson-8-personal-ai-system.md`.
