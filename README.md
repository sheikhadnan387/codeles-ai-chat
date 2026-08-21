# Codeles AI

A production-quality, ChatGPT-style AI chat application — original interface, not a visual
clone. Next.js 15 (App Router, TypeScript, Tailwind, shadcn/ui) frontend talking to a NestJS
backend (PostgreSQL via Prisma, JWT auth, Server-Sent Events streaming) with a pluggable AI
provider layer currently backed by OpenAI.

```
codeles-ai-chat/
  backend/        NestJS API (REST + SSE streaming)
  frontend/       Next.js app
  docker-compose.yml   optional local Postgres
  CONTRACT.md     the REST/SSE contract both sides implement against
```

## Requirements

- Node.js 20+ and npm
- A PostgreSQL 14+ database (locally via Homebrew/Docker, or a hosted instance — Neon,
  Supabase, Railway, RDS, etc.)
- An OpenAI API key (optional to boot the app, required to actually get AI replies)

## 1. Database

Pick one:

**Option A — Docker** (if you have Docker installed):
```bash
docker compose up -d
```
This starts Postgres on `localhost:5432` with user/password/db `postgres`/`postgres`/`codeles_ai`,
matching the default `DATABASE_URL` below.

**Option B — Homebrew (macOS)**:
```bash
brew install postgresql@16
brew services start postgresql@16
createdb codeles_ai
```

**Option C — hosted Postgres**: create a database with any provider and use its connection
string as `DATABASE_URL`.

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, OPENAI_API_KEY
npx prisma migrate dev --name init
npm run start:dev
```

The API runs on `http://localhost:4000`, prefixed at `/api`. Swagger docs are at
`http://localhost:4000/api/docs`.

### Backend environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (must differ from `JWT_SECRET`) |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime, default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime, default `7d` |
| `OPENAI_API_KEY` | OpenAI API key — the app boots without it, but chat requests will fail until it's set |
| `OPENAI_MODEL` | Default model id, default `gpt-4o-mini` |
| `AI_SYSTEM_PROMPT` | System prompt sent with every conversation |
| `AI_MAX_CONTEXT_MESSAGES` | How many recent messages are sent as context, default `20` |
| `FRONTEND_URL` | Used for CORS, default `http://localhost:3000` |
| `PORT` | API port, default `4000` |

Generate strong secrets with e.g. `openssl rand -base64 48`.

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
# edit .env.local if the backend isn't on http://localhost:4000/api
npm run dev
```

The app runs on `http://localhost:3000`.

### Frontend environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, e.g. `http://localhost:4000/api` |

## 4. Using the app

1. Visit `http://localhost:3000`, register an account.
2. Send a message from the welcome screen — a conversation is created, the reply streams in
   token-by-token, and a short title is generated automatically.
3. Everything (auth, conversations, messages, attachments) persists in Postgres via Prisma.

## AI provider architecture

`backend/src/ai/providers/ai-provider.interface.ts` defines the `AiProvider` contract
(`generateResponse`, `streamResponse`). `OpenAiProvider` is the only implementation today and
the only file that imports the `openai` SDK — everything else (controllers, `AiService`)
depends on the interface via the `AI_PROVIDER` injection token. Adding Claude, Gemini, or any
other model provider means writing a new class implementing `AiProvider` and wiring it into
`AiModule`; no other code changes. The model catalogue (`GET /ai/models`) and system prompt are
both config/env-driven (`backend/src/config/configuration.ts`), never hardcoded in a component
or controller.

## API reference

Full endpoint list, request/response shapes, the SSE streaming event protocol, and the auth
model are documented in [`CONTRACT.md`](./CONTRACT.md) and interactively in Swagger at
`/api/docs`. Summary:

- `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/me`
- `POST /auth/forgot-password`, `/reset-password`
- `GET/POST /conversations`, `GET/PATCH/DELETE /conversations/:id`
- `POST /conversations/:id/messages` — SSE stream
- `POST /conversations/:id/regenerate` — SSE stream
- `GET /ai/models`
- `POST /attachments`

## Database schema

`User` → many `Conversation` → many `Message` → many `Attachment`. See
[`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma) for the full definition
(indexes, enums `MessageRole`/`MessageStatus`, cascade deletes).

## Development notes

- Backend: `npm run build` (typecheck), `npm run lint`, `npm run test`
- Frontend: `npx tsc --noEmit`, `npm run lint`, `npm run build`
- Both projects use ESLint + Prettier + TypeScript strict mode.

## What you still need to configure manually

- A real `DATABASE_URL` pointing at a running Postgres instance, then run
  `npx prisma migrate dev` in `backend/` to create the schema.
- A real `OPENAI_API_KEY` for chat and auto-title generation to work.
- `JWT_SECRET` / `JWT_REFRESH_SECRET` should be long random values in any non-local
  environment — the `.env.example` placeholders are for local dev only.
- Password-reset emails are not sent (no SMTP provider is wired up) — the reset link is
  logged to the backend console instead. Wire a real mail provider in
  `backend/src/auth/auth.service.ts` (`forgotPassword`) before using this in production.
- File uploads are stored on local disk under `backend/uploads/` — swap for S3/GCS/etc.
  before deploying anywhere without a persistent filesystem.
- CORS/cookie settings assume frontend and backend are same-site in production (or you'll
  need to adjust `sameSite`/domain on the refresh cookie in `backend/src/auth/auth.controller.ts`).
