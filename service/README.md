# AI Course Service

Персональный учебный сервис на Next.js, Prisma и SQLite.

## Локальная разработка

```bash
npm install
cp .env.example .env
npm run db:deploy
npm run db:seed
npm run dev
```

Локально сервис открывается на `http://127.0.0.1:3000`.

## Production env

На VPS создайте `service/.env`:

```bash
DATABASE_URL="file:../data/prod.db"
AUTH_SECRET="replace-with-output-of-openssl-rand-base64-48"
SEED_STUDENT_PASSWORD="change-roman-password"
SEED_ADMIN_PASSWORD="change-nikita-password"
```

`DATABASE_URL="file:../data/prod.db"` хранит SQLite в `service/data/prod.db`.
Папка `data/` должна сохраняться между деплоями и бэкапиться.

Секрет:

```bash
openssl rand -base64 48
```

## Первый запуск на VPS

```bash
cd /opt/ai-course/service
npm ci
mkdir -p data
npm run prod:setup
PORT=3000 npm start
```

Что делает `prod:setup`:

- применяет миграции Prisma через `prisma migrate deploy`;
- создает стартовых пользователей и материалы через `db:seed`;
- собирает Next.js приложение.

Стартовые пользователи создаются сидером:

- `roman` с паролем из `SEED_STUDENT_PASSWORD`;
- `nikita` с паролем из `SEED_ADMIN_PASSWORD`.

Если пользователь уже существует, сидер не перезаписывает пароль.

Тестовые и административные функции выполняются из аккаунта `nikita`.
Отдельный аккаунт `qa` больше не создаётся.

## Проверка продакшена

```bash
curl -f http://127.0.0.1:3000/api/health
```

Ожидаемый ответ:

```json
{"ok":true,"database":"ok"}
```

## Systemd пример

`/etc/systemd/system/ai-course.service`:

```ini
[Unit]
Description=AI Course Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/ai-course/service
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Команды:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-course
sudo systemctl start ai-course
sudo systemctl status ai-course
```

## Обновление на VPS

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

## SQLite backup

```bash
mkdir -p backups
cp data/prod.db "backups/prod-$(date +%F-%H%M).db"
```

Перед крупными изменениями или обновлением сервера делайте бэкап `data/prod.db`.

## HTTPS и домен

В production cookie авторизации выставляется как `secure`, поэтому сервис должен
работать через HTTPS на домене. Обычно схема такая:

- Next.js слушает `127.0.0.1:3000` или `0.0.0.0:3000`;
- Nginx/Caddy принимает HTTPS на домене;
- reverse proxy прокидывает запросы в Next.js.
