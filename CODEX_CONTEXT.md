# CODEX_CONTEXT.md

Дата актуализации: 14 июля 2026

Этот файл нужен, чтобы можно было открыть проект в новом Codex-чате или на домашнем компьютере и быстро продолжить без восстановления всей истории переписки.

Главная инструкция для следующего Codex: сначала прочитать этот файл целиком, затем проверить `git status`, `service/package.json`, `service/prisma/schema.prisma` и только после этого вносить изменения.

## 1. Суть проекта

Проект: персональный учебный веб-сервис по работе с ИИ для отца пользователя.

Это подарок. Поэтому нельзя заранее проводить прямую диагностику ученика или делать действия, которые могут раскрыть сюрприз. Вместо предварительной диагностики использовать мягкую калибровку внутри первого урока на вымышленном материале.

Курс должен быть не про юридическое обучение как таковое, а про практическое управление ИИ на знакомом рабочем материале:

- как правильно ставить задачу ИИ;
- как ограничивать контекст;
- как обезличивать данные;
- как проверять ответы;
- как работать с длинными документами;
- как отделять факты, выводы и предположения;
- как собирать личную библиотеку рабочих сценариев;
- как использовать разные модели ИИ осознанно.

Юридические документы, аренда, ПВЗ, претензии и договоры - это тренировочный материал, а не цель курса.

## 2. Профиль ученика

Ученик:

- взрослый человек, около 54 лет;
- работает с юридическими и организационными задачами в сфере аренды и эксплуатации ПВЗ;
- основная юрисдикция: РФ;
- РБ временно исключена из основной версии курса до отдельной проверки применимости материалов;
- уже несколько месяцев базово пользуется ИИ;
- использует бесплатные ChatGPT, DeepSeek и Qwen;
- работает с договорами, допсоглашениями, претензиями, деловой перепиской, таблицами;
- целевой UX должен быть понятен человеку 50+.

UX-следствия:

- не делать интерфейс мелким и перегруженным;
- важные действия должны быть очевидны;
- прогресс и следующий шаг должны быть видны сразу;
- кликабельные зоны должны быть крупными;
- не использовать иконки без подсказок там, где смысл не очевиден;
- формулировки должны быть спокойными, прикладными и без ощущения экзамена.

## 3. Принятые продуктовые решения

Решено:

- делать свой веб-сервис, не Stepik;
- использовать HeroUI для интерфейса;
- хранить прогресс на сервере, не в `localStorage`;
- использовать простую авторизацию логин/пароль;
- роли: `STUDENT` и `ADMIN`;
- база: SQLite через Prisma;
- нужна админка для наполнения и редактирования курса;
- деплой планируется на VPS с доменом;
- Vercel обсуждали, но текущий основной путь - VPS;
- стиль UI: технологичный cockpit-style, вдохновлённый выбранным mockup `Student Learning Cockpit`.

Важно: пользователь просил не плодить лишние markdown-аудиты и документы, если информацию можно коротко дать в чате. Исключение - этот `CODEX_CONTEXT.md`, потому что он нужен для продолжения работы с другого места.

## 4. GitHub и текущее состояние репозитория

Репозиторий:

- `https://github.com/MeltoSanto/ai_course_for_dad.git`
- ветка: `main`

Основной коммит сервиса перед актуализацией этого файла:

- `e1b9a94 Add AI course service MVP`

Перед этим коммитом были зелёные проверки:

- `npm run lint`
- `npm run build`
- `git diff --cached --check`

После изменения этого файла нужно сделать отдельный commit/push, чтобы дома был актуальный контекст.

## 5. Структура репозитория

Корень проекта:

- `CODEX_CONTEXT.md` - этот файл, стартовый контекст для Codex.
- `lesson-1-data-safety.md` - первый контент-пакет урока.
- `docs/` - исследовательские и плановые материалы.
- `service/` - рабочий Next.js веб-сервис.
- `.codex-audit-admin-qa7/` - скриншоты последнего QA админки и UI.
- `.gitignore` - корневой ignore для `.appdata/` и `.npm-cache/`.

Внутри `service/`:

- `package.json` - команды и зависимости.
- `.env.example` - пример env.
- `.gitignore` - защита от `node_modules`, `.next`, `.env`, SQLite DB и build artifacts.
- `README.md` - инструкция по локальному запуску и VPS.
- `prisma/schema.prisma` - схема базы.
- `prisma/seed.mjs` - стартовые данные.
- `prisma/migrations/20260714000100_init/migration.sql` - первая миграция.
- `scripts/import-lesson-package.mjs` - импорт Markdown-пакета урока.
- `scripts/reset-qa-user.mjs` - сброс QA-пользователя.
- `src/app/` - Next.js App Router страницы и server actions.
- `src/components/` - общие UI-компоненты.
- `src/lib/` - работа с DB, курсом, прогрессом, сессиями, ачивками.

## 6. Технологический стек

Сервис:

- Next.js 16.2.10
- React 19.2.4
- TypeScript
- HeroUI 3.2.2
- Prisma 6.19.3
- SQLite
- Server Actions
- cookie-based session auth
- lucide-react icons
- npm

Важные ограничения:

- не использовать внешнюю сеть без необходимости;
- не коммитить `.env`;
- не коммитить SQLite базы;
- не коммитить `node_modules`;
- не коммитить `.next`;
- перед push запускать `npm run lint` и `npm run build`.

## 7. Как поднять проект на новом компьютере

Вариант для Windows PowerShell:

```powershell
git clone https://github.com/MeltoSanto/ai_course_for_dad.git
cd ai_course_for_dad\service
npm install
Copy-Item .env.example .env
npm run db:deploy
npm run db:seed
npm run content:import -- ..\lesson-1-data-safety.md
npm run qa:reset
npm run dev -- -H 127.0.0.1
```

Вариант для bash:

```bash
git clone https://github.com/MeltoSanto/ai_course_for_dad.git
cd ai_course_for_dad/service
npm install
cp .env.example .env
npm run db:deploy
npm run db:seed
npm run content:import -- ../lesson-1-data-safety.md
npm run qa:reset
npm run dev -- -H 127.0.0.1
```

Локальный адрес:

- `http://127.0.0.1:3000`

Важно: у текущей версии Next для host используется `-H`, а не `--host`. Команда `npm run dev -- --host 127.0.0.1` падает с ошибкой `unknown option '--host'`.

## 8. Env и SQLite

Файл `service/.env` не коммитится.

Для локальной разработки можно использовать:

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-ai-course-secret-change-before-production"
SEED_STUDENT_PASSWORD="1234"
SEED_QA_PASSWORD="1234"
SEED_ADMIN_PASSWORD="1234"
QA_USERNAME="qa"
QA_PASSWORD="1234"
```

Пояснение по SQLite:

- `DATABASE_URL="file:./dev.db"` создаёт SQLite базу как `service/prisma/dev.db`.
- Эта база gitignored.
- В production по README используется `DATABASE_URL="file:../data/prod.db"`, то есть `service/data/prod.db`.
- `service/data/.gitkeep` закоммичен, сама база `prod.db` не коммитится.

Если дома после `Copy-Item .env.example .env` база создастся в `service/data/prod.db`, это тоже технически нормально, но для локальной разработки удобнее `file:./dev.db`.

## 9. Логины

После `npm run db:seed`:

- student: `roman` / `1234`
- QA student: `qa` / `1234`
- admin: `nikita` / `1234`

Особенности:

- `db:seed` создаёт пользователей, если их нет.
- `db:seed` не перезаписывает пароль уже существующих `roman` и `nikita`.
- `qa:reset` всегда создаёт или обновляет пользователя `qa`, выставляет ему пароль из `QA_PASSWORD` или `1234` и очищает только его прогресс.
- Для QA и автотестов использовать `qa`, чтобы не портить прогресс `roman`.

## 10. npm scripts

Все команды выполнять из `service/`.

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run content:import
npm run qa:reset
npm run db:studio
npm run prod:setup
```

Что делают:

- `dev` - запускает Next dev server.
- `build` - production build.
- `start` - `next start -H 0.0.0.0`.
- `lint` - ESLint.
- `db:generate` - Prisma Client generate.
- `db:migrate` - Prisma migrate dev.
- `db:deploy` - применить миграции.
- `db:seed` - стартовые пользователи, уроки-заглушки, библиотека, ачивки.
- `content:import` - импорт Markdown-пакета урока в SQLite.
- `qa:reset` - сброс прогресса QA-пользователя.
- `db:studio` - Prisma Studio.
- `prod:setup` - `prisma migrate deploy && npm run db:seed && npm run build`.

Для первого урока:

```bash
npm run content:import -- ..\lesson-1-data-safety.md
```

## 11. Реализованные страницы

Публично-ученические:

- `/` - главная cockpit-панель.
- `/lessons` - плитки уроков.
- `/lessons/[slug]` - страница конкретного урока.
- `/practice` - список практик.
- `/tests` - список тестов.
- `/progress` - экран прогресса и истории.
- `/achievements` - ачивки.
- `/reference` - справочник.
- `/glossary` - глоссарий.
- `/scenarios` - сценарии.
- `/login` - вход.

Админские:

- `/admin` - обзор админки.
- `/admin/lessons/[lessonId]` - редактирование урока, блоков, практики, тестов и вопросов.
- `/admin/library` - справочник, глоссарий, сценарии, управление ачивками.

API:

- `/api/health` - проверка сервиса и базы.

## 12. Основные файлы приложения

Auth/session:

- `service/src/app/login/page.tsx`
- `service/src/app/login/login-form.tsx`
- `service/src/app/actions/auth.ts`
- `service/src/lib/session.ts`
- `service/src/lib/password.ts`

Data/course/progress:

- `service/src/lib/db.ts`
- `service/src/lib/course.ts`
- `service/src/lib/progress.ts`
- `service/src/lib/achievements.ts`

Student UI:

- `service/src/components/cockpit-shell.tsx`
- `service/src/components/cockpit-ui.tsx`
- `service/src/components/course/lesson-card.tsx`
- `service/src/components/course/course-route-map.tsx`
- `service/src/components/course/achievement-card.tsx`
- `service/src/components/course/metric-card.tsx`
- `service/src/app/page.tsx`
- `service/src/app/lessons/page.tsx`
- `service/src/app/lessons/[slug]/page.tsx`

Lesson interactions:

- `service/src/app/actions/progress.ts` - отметка блоков/посещений.
- `service/src/app/actions/learning.ts` - отправка практики и тестов.
- `service/src/app/lessons/[slug]/copy-prompt-button.tsx` - копирование промптов.
- `service/src/app/lessons/[slug]/lesson-mode-tabs.tsx` - вкладки/режимы урока.

Admin:

- `service/src/app/admin/page.tsx`
- `service/src/app/admin/actions.ts`
- `service/src/app/admin/lessons/[lessonId]/page.tsx`
- `service/src/app/admin/library/page.tsx`

Reference pages:

- `service/src/app/reference/page.tsx`
- `service/src/app/glossary/page.tsx`
- `service/src/app/scenarios/page.tsx`

## 13. Prisma schema

Файл: `service/prisma/schema.prisma`.

Enums:

- `UserRole`: `STUDENT`, `ADMIN`
- `PublicationStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- `LessonKind`: `CORE`, `EXTRA`
- `LessonBlockType`: `OBJECTIVE`, `EXPLANATION`, `DEMONSTRATION`, `PRACTICE`, `PROMPTS`, `CHECK`, `ARTIFACT`, `MARKDOWN`, `CALLOUT`
- `ProgressStatus`: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`
- `AssignmentStatus`: `NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `COMPLETED`
- `QuestionType`: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `SORT_STEPS`, `FIND_PROMPT_ERROR`, `FILL_BLANK`
- `AchievementTriggerType`: `LESSON_COMPLETED`, `PRACTICE_COMPLETED`, `TEST_PASSED`, `SCENARIO_SAVED`, `MANUAL`

Models:

- `User`
- `Lesson`
- `LessonBlock`
- `Assignment`
- `LessonTest`
- `Question`
- `QuestionOption`
- `UserLessonProgress`
- `UserBlockProgress`
- `UserAssignmentProgress`
- `UserTestAttempt`
- `Achievement`
- `UserAchievement`
- `Scenario`
- `GlossaryTerm`
- `ReferenceItem`

Особенности модели:

- `Lesson.slug` уникален.
- `QuestionOption` связан с `Question`.
- `UserLessonProgress` уникален по `userId + lessonId`.
- `UserBlockProgress` уникален по `userId + blockId`.
- `UserAssignmentProgress` уникален по `userId + assignmentId`.
- `UserTestAttempt` хранит каждую попытку теста, включая `answers` JSON.
- `UserAchievement` уникален по `userId + achievementId`.

## 14. Как сейчас считается прогресс

Файл: `service/src/lib/progress.ts`.

Текущее правило:

- total units = опубликованные блоки + неархивные практики + неархивные тесты;
- completed units = завершённые блоки + completed assignments + passed test ids.

Важный известный нюанс:

- В прогрессе тест считается пройденным, если когда-либо был passed.
- На странице `/tests` может использоваться логика последней попытки.
- Это входит в план исправления `Единый контракт прогресса` и `Тесты`.

Нужно будет решить:

- `ever passed` или `latest attempt passed`;
- что считается завершением урока;
- как показывать отдельные слои: блоки, практика, тест.

## 15. Как сейчас работают тесты

Файл: `service/src/app/actions/learning.ts`.

Поддерживаемые типы:

- `SINGLE_CHOICE` - radio, один правильный ответ.
- `MULTIPLE_CHOICE` - checkbox, несколько правильных.
- `SORT_STEPS` - textarea, сравнение с `correctOrder`.
- `FIND_PROMPT_ERROR` - textarea, accepted substrings из `correctText`, разделитель `|`.
- `FILL_BLANK` - input, exact accepted variants из `correctText`, разделитель `|`.

Известные задачи:

- запретить отправку пустого теста;
- привести статистику pass -> fail к единому правилу;
- добавить smoke-тесты на все 5 типов;
- проверить понятность формата сортировки шагов для ученика 50+.

## 16. Как сейчас работает практика

Файл: `service/src/app/actions/learning.ts`.

Практика:

- пользователь вводит ответ;
- может отметить `isCompleted`;
- если `isCompleted`, статус становится `COMPLETED`;
- иначе `SUBMITTED`;
- ответ хранится в `UserAssignmentProgress.submissionMd`;
- после сохранения обновляется прогресс и проверяются ачивки.

Известные задачи:

- защитить введённый текст от потери при истёкшей сессии;
- визуально различить `Сохранено` и `Выполнено`;
- сделать UX спокойнее и понятнее.

## 17. Ачивки

Файл: `service/src/lib/achievements.ts`.

Сейчас есть базовая механика:

- ачивки сидятся через `service/prisma/seed.mjs`;
- выдаются при прохождении уроков, практики, тестов и т.д.;
- админка умеет управлять ачивками.

Продуктовая позиция:

- ачивки должны мотивировать;
- не превращать курс в игру ради игры;
- лучше награждать за полезные рабочие привычки:
  - обезличивание;
  - цитатный контроль;
  - декомпозиция;
  - работа с длинным документом;
  - агентные роли;
  - личная система.

## 18. Первый урок и контент-пакет

Файл:

- `lesson-1-data-safety.md`

Урок:

- slug: `data-safety`
- title: `Безопасная работа с документами во внешних ИИ-моделях`
- subtitle: `Как поставить границы задачи, обезличить данные и проверить файл перед загрузкой`
- durationMinutes: 45
- mainSkill: подготовка минимального и обезличенного контекста для внешней ИИ-модели

Структура импортированного пакета:

- 8 блоков;
- 1 практика;
- 1 тест;
- 8 вопросов;
- max score: 10;
- passingScore: 8;
- 12 терминов глоссария;
- 4 reference items;
- 1 scenario.

Блоки урока:

1. `OBJECTIVE` - какой результат вы получите.
2. `EXPLANATION` - четыре слоя чувствительных данных.
3. `EXPLANATION` - метод `Сократить - заменить - проверить`.
4. `DEMONSTRATION` - как превратить фрагмент договора в безопасный контекст.
5. `PROMPTS` - готовые промпты для подготовки и проверки текста.
6. `PRACTICE` - практика на учебном договоре.
7. `CHECK` - проверка перед нажатием `Отправить`.
8. `ARTIFACT` - что сохранить после урока.

Команда импорта:

```bash
cd service
npm run content:import -- ..\lesson-1-data-safety.md
```

Важно:

- импортёр пересоздаёт блоки, практику и тест для урока с тем же slug;
- это нормально на этапе наполнения;
- это может сбросить прогресс по старым id блоков/практики/теста;
- перед реальным использованием курса нужно аккуратно решить стратегию обновления контента без потери прогресса.

## 19. Формат Markdown-пакета урока

Текущий импортёр ожидает структуру как в `lesson-1-data-safety.md`.

Основные секции:

```md
# lesson
# blocks
# assignment
# test
# glossary
# referenceItems
# scenario
```

`# lesson`:

```md
slug: data-safety
title: ...
subtitle: ...
description: ...
durationMinutes: 45
mainSkill: ...
```

`# blocks`:

```md
## block 1
type: OBJECTIVE
title: ...
content:
...
```

`# assignment`:

```md
title: ...
instructions:
...
expectedProcess:
...
checklist:
- [ ] ...
```

`# test`:

```md
title: ...
description: ...
passingScore: 8

## question 1
type: SINGLE_CHOICE
prompt: ...
points: 1
options:
- [ ] ...
- [x] ...
explanation: ...
```

Для `MULTIPLE_CHOICE` можно ставить несколько `[x]`.

Для `SORT_STEPS`:

```md
correctOrder:
1. Первый шаг
2. Второй шаг
3. Третий шаг
```

Для `FIND_PROMPT_ERROR` и `FILL_BLANK`:

```md
correctText: вариант 1 | вариант 2 | вариант 3
```

`# glossary`:

```md
- term: Термин
  definition: Краткое определение
  content: Дополнительное пояснение
```

`# referenceItems`:

```md
- slug: pre-upload-checklist
  title: ...
  category: ...
  content: |
    ...
```

`# scenario`:

```md
slug: ...
title: ...
summary: ...
content:
...
```

## 20. Текущий рендер контента

На странице урока `contentMd` сейчас в основном выводится как текст с сохранением переносов строк (`whitespace-pre-line`), не как полноценный Markdown.

Следствие:

- списки читаются, но не получают полноценный markdown-style;
- таблицы, цитаты, жирный текст и code fences могут выглядеть слишком сыро;
- `PROMPTS` блоки выделяются и имеют кнопку копирования.

Будущее улучшение:

- добавить безопасный Markdown renderer;
- аккуратно стилизовать списки, цитаты, code blocks и таблицы;
- отдельно проверить читаемость на мобильных и для ученика 50+.

## 21. Админка

Админ:

- логин `nikita`;
- пароль по умолчанию `1234`;
- роль `ADMIN`.

Что уже есть:

- создание/редактирование уроков;
- создание/редактирование блоков;
- создание/редактирование практики;
- создание/редактирование тестов;
- создание/редактирование вопросов и вариантов;
- управление справочником;
- управление глоссарием;
- управление сценариями;
- управление ачивками.

Известные UX-проблемы:

- формы длинные;
- слишком много одинаковых кнопок `Сохранить`;
- нужны табы/секции;
- нужно усилить контекст действий;
- нужно добавить валидацию обязательных полей;
- якоря должны учитывать sticky header.

## 22. QA-пользователь и повторяемая тестовая база

Пункт плана `Зафиксировать тестовую базу` выполнен.

Что сделано:

- в seed добавлен пользователь `qa`;
- добавлен `service/scripts/reset-qa-user.mjs`;
- добавлена команда `npm run qa:reset`;
- `.env.example` и `README.md` обновлены.

Команда:

```bash
cd service
npm run qa:reset
```

Ожидаемый результат:

- пользователь `qa` существует;
- пароль соответствует `QA_PASSWORD` или `1234`;
- прогресс QA очищен;
- таблицы `UserLessonProgress`, `UserBlockProgress`, `UserAssignmentProgress`, `UserTestAttempt`, `UserAchievement` для `qa` пустые;
- `roman` не затронут.

Это позволяет гонять QA повторно и получать предсказуемые цифры.

## 23. Последний большой QA и план исправлений

Пользователь просил создать 10 агентов-тестировщиков и проверить функционал сайта:

- кнопки;
- поля ввода;
- графики;
- статистику;
- чекпоинты;
- удобство для человека 50+;
- дополнительные критичные метрики.

На основе анализа был составлен план. Пока исправлен только пункт 1.

### 23.1 Зафиксировать тестовую базу

Статус: выполнено.

Критерий:

- QA можно гонять повторно;
- прогресс `roman` не портится.

### 23.2 Починить responsive/mobile

Статус: следующий пункт.

Задачи:

- убрать root-level горизонтальный overflow на 390px и 768px;
- пересобрать grid/layout главной;
- пересобрать layout урока;
- пересобрать карту маршрута;
- пересобрать topbar.

Критерий:

- `scrollWidth <= viewportWidth + 2px` на ключевых страницах.

Ключевые страницы для проверки:

- `/`
- `/lessons`
- `/lessons/data-safety`
- `/progress`
- `/admin`
- `/admin/library`

### 23.3 Разобраться с topbar-заглушками

Статус: не сделано.

Проблема:

- поиск выглядит рабочим, но не помогает;
- user menu/notifications/icon actions могут быть кликабельными без понятного результата.

Нужно:

- поиск либо реализовать, либо сделать disabled/убрать;
- добавить tooltip или понятное поведение для icon-only кнопок;
- не оставлять кликабельных элементов, которые ничего не делают.

### 23.4 Единый контракт прогресса

Статус: не сделано.

Нужно решить:

- урок завершён, когда закрыты блоки + практика + тест;
- или каждый слой считается отдельно;
- как считать `passed test`: ever passed или latest attempt.

После решения привести к единой логике:

- `/`
- `/lessons`
- `/progress`
- `/tests`
- `/achievements`

Критерий:

- одна активность даёт одинаковые цифры на всех экранах.

### 23.5 Тесты

Статус: не сделано.

Нужно:

- определить `latest passed` vs `ever passed`;
- запретить отправку пустого теста;
- добавить реальные seed-примеры всех 5 типов вопросов;
- проверить pass -> fail сценарий;
- проверить, что статистика не расходится.

### 23.6 Практика и защита от потери текста

Статус: не сделано.

Нужно:

- проверить session edge case;
- при истёкшей сессии не терять введённый ответ;
- сделать статусы `Сохранено` и `Выполнено` более различимыми.

Критерий:

- submit не уводит на login с потерей текста.

### 23.7 Accessibility/keyboard

Статус: не сделано.

Нужно:

- убрать `Link > Button`;
- добавить понятные `aria-label` для таймлайна;
- усилить focus states;
- увеличить checkbox/radio/малые targets ближе к 44x44;
- проверить tab path.

Критерий:

- интерактивные элементы имеют имена;
- Tab-путь понятный;
- мелкие цели увеличены.

### 23.8 Админка

Статус: не сделано.

Нужно:

- разбить длинные формы на более управляемые блоки/табы;
- поправить якоря под sticky header;
- добавить валидацию обязательных полей;
- сделать опасные действия более безопасными.

Критерий:

- автор не видит десятки одинаковых `Сохранить` без контекста.

### 23.9 Reference / Glossary / Scenarios

Статус: не сделано.

Нужно:

- поиск/фильтр;
- empty state;
- для сценариев добавить открыть/копировать/использовать шаблон.

Критерий:

- поле поиска на справочных страницах реально помогает.

### 23.10 Регрессионный QA

Статус: не сделано.

Нужно собрать Playwright smoke suite:

- login;
- navigation;
- lesson;
- practice;
- test;
- progress;
- admin;
- responsive.

Критерий:

- перед каждым новым наполнением можно быстро понять, что интерфейс не сломался.

## 24. Скриншоты QA

Папка:

- `.codex-audit-admin-qa7/`

Содержит 19 PNG-скриншотов:

- admin overview;
- admin library;
- lesson editor;
- clicks по user menu / notifications;
- search typed / search enter.

Эти скриншоты уже попали в коммит `e1b9a94`.

Использовать как визуальное основание для следующих UI/UX правок, особенно по админке и topbar.

## 25. Дизайн-направление

Пользователь показал изображение `Student Learning Cockpit` и сказал, что оно понравилось.

Нужно приводить вторичные страницы к этому cockpit-style:

- `reference`
- `glossary`
- `scenarios`
- `admin/library`
- `admin/lessons/[id]`
- `login`

Уже была работа по cockpit-стилю, но пользователь затем отметил, что:

- левое меню не должно быть якорями лендинга;
- должна быть главная страница со статистикой, ачивками и общей картой;
- `Уроки` должны вести на отдельную страницу уроков;
- `Практика`, `Тесты`, `Ачивки` должны быть отдельными страницами;
- структуру проекта нужно разделять так, чтобы можно было редактировать отдельные блоки сайта, не подтягивая весь контекст.

Эта навигационная структура уже в основном реализована.

## 26. Важные UX-решения для cockpit

Главная `/` должна быть рабочей панелью, не лендингом:

- приветствие;
- статистика прохождения;
- продолжить обучение;
- карта маршрута;
- выполненные/текущие уроки;
- последние тесты;
- последние ачивки;
- быстрые справочные элементы.

`/lessons`:

- плитки уроков;
- при клике открывается урок целиком.

`/lessons/[slug]`:

- блоки урока;
- режимы/вкладки;
- копирование промптов;
- практика;
- тест;
- навигация дальше.

`/practice`:

- отдельный список практик и статусов.

`/tests`:

- отдельный список тестов и результатов.

`/progress`:

- нормальный экран прогресса и истории результатов.

`/achievements`:

- ачивки отдельно, не якорь.

## 27. Исходные исследовательские документы

Исходные исследования:

- `docs/AI-kurs-dlya-yurista__issledovanie_claude.md`
- `docs/AI_Course_Research_gemini.md`

Сводные документы:

- `docs/compiled_research_analysis.md` - компиляция двух исследований и обновлённая концепция курса.
- `docs/advanced_ai_techniques.md` - дополнительные продвинутые техники.
- `docs/course_program_web_service.md` - программа обучения и продуктовая структура веб-сервиса.

Документ `docs/service_development_readiness_audit.md` был удалён по просьбе пользователя. Не ссылаться на него и не восстанавливать.

## 28. Концепция курса

Оптимальная структура основного курса: 8 занятий по 30-40 минут.

Текущий план:

1. Безопасность и обезличивание данных.
2. Контекст-инжиниринг и управляемое ТЗ для ИИ.
3. Декомпозиция задачи в многошаговый конвейер.
4. Цитатный контроль и разделение фактов, выводов, предположений.
5. Работа с длинными документами и контекстным окном.
6. Проверка норм и дисциплина юрисдикции РФ.
7. Агентный подход: ИИ-команда из ролей.
8. Личная система: бенчмарк моделей, сценарии, журнал ошибок.

Дополнительный трек из `docs/advanced_ai_techniques.md`:

- structured outputs: таблицы и JSON;
- личные evals;
- guardrails и red teaming;
- RAG и личная база знаний;
- tool calling, MCP и ИИ как управляющий слой;
- мультимодальный ИИ: PDF, сканы, таблицы;
- browser agents и human-in-the-loop;
- память, наблюдаемость и личная AI Operating System.

## 29. Что должно остаться у ученика после курса

Практические артефакты:

- чек-лист обезличивания;
- шаблон постановки задачи;
- протокол анализа длинного документа;
- шаблон таблицы рисков;
- протокол сравнения редакций;
- алгоритм проверки норм РФ и юридически чувствительных выводов;
- набор агентных ролей;
- таблица выбора модели;
- журнал ошибок ИИ;
- библиотека рабочих сценариев.

## 30. Ограничения по юридической части

Курс должен учить работе с ИИ, а не праву.

Автор курса не должен самостоятельно утверждать юридическую правильность эталонов. Все образцы договоров, претензий и правовые выводы нужно проверять с квалифицированным юристом.

Для реальных документов:

- важна конфиденциальность;
- учебные материалы должны быть вымышленными;
- реальные документы перед загрузкой в ИИ нужно обезличивать;
- не загружать персональные данные, реквизиты, внутренние условия и коммерческие секреты во внешние модели без проверки.

## 31. VPS/deploy заметки

Production `.env` по README:

```bash
DATABASE_URL="file:../data/prod.db"
AUTH_SECRET="replace-with-output-of-openssl-rand-base64-48"
SEED_STUDENT_PASSWORD="change-roman-password"
SEED_QA_PASSWORD="1234"
SEED_ADMIN_PASSWORD="change-nikita-password"
QA_USERNAME="qa"
QA_PASSWORD="1234"
```

Первый запуск на VPS:

```bash
cd /opt/ai-course/service
npm ci
mkdir -p data
npm run prod:setup
PORT=3000 npm start
```

Health check:

```bash
curl -f http://127.0.0.1:3000/api/health
```

Systemd пример есть в `service/README.md`.

SQLite production база должна лежать в `service/data/prod.db`.

Важно:

- папку `service/data/` сохранять между деплоями;
- регулярно бэкапить `service/data/prod.db`;
- перед крупными изменениями делать backup;
- не коммитить production DB.

## 32. Что нельзя делать без явной просьбы

Не делать:

- не проводить диагностику ученика до подарка;
- не возвращать РБ в основной курс без отдельной проверки;
- не создавать новые отчётные markdown-файлы для кратких аудитов;
- не удалять пользовательские изменения;
- не делать `git reset --hard`;
- не коммитить `.env`, базы, `node_modules`, `.next`;
- не превращать главную страницу в маркетинговый лендинг;
- не делать progress только в localStorage;
- не ломать простой логин/пароль до решения о полноценной auth-системе;
- не добавлять лишние зависимости без причины.

## 33. Как работать дальше в Codex

В начале нового чата:

1. Прочитать `CODEX_CONTEXT.md`.
2. Выполнить `git status -sb`.
3. Если работа дома после clone, поднять проект по шагам из раздела 7.
4. Проверить `service/package.json`.
5. Если задача про UI, открыть соответствующие файлы в `service/src/app` и `service/src/components`.
6. Если задача про данные, открыть `service/prisma/schema.prisma`, `service/src/lib/course.ts`, `service/src/lib/progress.ts`.
7. Если задача про контент, открыть `lesson-1-data-safety.md` и импортёр.

Перед внесением кода:

- коротко сказать пользователю, что именно меняется;
- использовать `apply_patch`;
- держать изменения локальными к задаче;
- не делать незапрошенные рефакторы.

Перед финалом:

- запускать релевантные проверки;
- для кода сервиса обычно `npm run lint` и `npm run build`;
- для DB/контента проверять импорт и Prisma-запросы;
- для UI желательно Playwright/screenshot, особенно после responsive-правок;
- кратко сказать, что изменено и что следующий пункт плана.

## 34. Следующий практический шаг

Продолжать по плану исправлений с пункта 2:

**Починить responsive/mobile.**

Конкретная ближайшая задача:

1. Поднять локальный dev server.
2. Проверить ключевые страницы на ширинах 390px, 768px, desktop.
3. Найти root-level horizontal overflow.
4. Исправить layout главной, урока, карты маршрута и topbar.
5. Добавить или подготовить Playwright-проверку `scrollWidth <= viewportWidth + 2px`.
6. Прогнать `npm run lint` и `npm run build`.
7. Сообщить следующий пункт: topbar-заглушки.

Ключевые страницы для проверки:

- `/`
- `/lessons`
- `/lessons/data-safety`
- `/progress`
- `/admin`
- `/admin/library`

Использовать `qa / 1234` для пользовательских проверок.
