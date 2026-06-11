# План по настройке Next.js (TestForge)

Документ описывает, как настроен проект Next.js «Тестер с таймером», и
какие шаги нужны для локального запуска, разработки и развёртывания.

## 1. Технологический стек

- **Next.js 15.5.19** (App Router) — выбран по требованию ТЗ (Next.js 15);
  зафиксирована пропатченная версия без известных уязвимостей.
- **React 19.1.0**
- **TypeScript 5** (строгий режим)
- **Tailwind CSS v4** (через `@tailwindcss/postcss`)
- **ESLint 9** + `eslint-config-next` (flat config через `FlatCompat`)
- **Хранилище данных:** JSON-файл `data/tests.json` + серверные API Route Handlers.

## 2. Предварительные требования

- Node.js **18.18+** (рекомендуется **20** или **22** LTS)
- npm 9+ (в проекте используется npm, есть `package-lock.json`)

```bash
node -v   # ожидается v20.x или v22.x
npm -v
```

## 3. Установка и запуск

```bash
npm install        # установка зависимостей
npm run dev        # режим разработки (http://localhost:3000)
npm run build      # продакшн-сборка
npm run start      # запуск собранного приложения
npm run lint       # проверка ESLint
```

## 4. Структура проекта

```
src/
  app/
    layout.tsx              # общий каркас (шапка, подвал, шрифты)
    page.tsx                # главная — список тестов
    create/page.tsx         # создание теста
    edit/[id]/page.tsx      # редактор вопросов
    test/[id]/page.tsx      # прохождение теста + результаты
    api/tests/route.ts      # GET (список) и POST (создание)
    api/tests/[id]/route.ts # GET / PUT / DELETE одного теста
  components/
    TestCard.tsx            # карточка теста
    QuestionForm.tsx        # форма добавления/редактирования вопроса
    QuestionCard.tsx        # карточка вопроса в редакторе
    Timer.tsx               # таймер обратного отсчёта
  lib/
    storage.ts              # серверное чтение/запись data/tests.json
    api.ts                  # клиентские fetch-обёртки
    quiz.ts                 # подсчёт результатов, варианты ответов
    id.ts                   # генерация id на клиенте
  types/
    test.ts                 # типы Test, Question, AnswerOptions и т.д.
data/
  tests.json                # хранилище тестов (60 импортированных вопросов)
```

## 5. Ключевые файлы конфигурации

- **`next.config.ts`** — базовая конфигурация Next (расширяется по мере необходимости).
- **`tsconfig.json`** — алиас `@/*` → `./src/*`, `resolveJsonModule: true`, строгий режим.
- **`postcss.config.mjs`** — подключение `@tailwindcss/postcss`.
- **`eslint.config.mjs`** — flat config через `FlatCompat` (`next/core-web-vitals`, `next/typescript`).
- **`src/app/globals.css`** — `@import "tailwindcss"`, светлая тема, анимация таймера.

## 6. Хранение данных в .json

ТЗ предполагало LocalStorage, но по требованию заказчика данные хранятся в
`.json`-файле:

- Запись/чтение выполняются **на сервере** через `node:fs` внутри Route Handlers.
- Маршруты помечены `runtime = "nodejs"` и `dynamic = "force-dynamic"` (без кэша).
- Запись атомарная (через временный файл + `rename`) и сериализованная (очередь),
  чтобы избежать гонок.

> Важно: файловое хранилище работает в Node-окружении (`next start`,
> собственный сервер, Docker, VPS). На serverless/edge (например, Vercel)
> файловая система только для чтения — см. раздел 8.

## 7. Проверки качества

```bash
npm run lint     # ESLint — без ошибок
npm run build    # сборка + проверка типов — успешно
```

## 8. План развёртывания (следующие шаги)

1. **Node-хостинг (рекомендуется для файлового хранилища):**
   VPS / Docker / Render / Railway — там, где доступна запись на диск.
   - Собрать: `npm run build`
   - Запустить: `npm run start`
   - Обеспечить персистентный том для `data/tests.json`.
2. **Docker:** добавить `Dockerfile` (multi-stage) и `output: "standalone"`
   в `next.config.ts` для компактного образа.
3. **Vercel/edge:** при необходимости заменить файловое хранилище на БД
   (SQLite/Postgres/KV), так как ФС там доступна только для чтения.
4. **Переменные окружения:** добавить `.env` (уже игнорируется git) при
   подключении внешних сервисов.

## 9. Возможные доработки

- Добавить тесты (Vitest / Playwright) — по запросу.
- Импорт/экспорт тестов в JSON через UI.
- Перемешивание вопросов и вариантов ответов.
- Подсветка правильных/неправильных ответов на странице результатов.
