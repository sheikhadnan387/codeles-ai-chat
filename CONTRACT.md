# Codeles AI — Frontend/Backend API Contract

This is the single source of truth for the REST/SSE contract between `frontend/` (Next.js)
and `backend/` (NestJS). Both sides must match this exactly. If either side needs to
deviate, update this file first.

Backend runs on `http://localhost:4000` (prefix `/api`), Swagger at `/api/docs`.
Frontend reads the base URL from `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api`).

## Auth model

- Access token: JWT, 15 min expiry, returned in JSON body as `accessToken`, sent by the
  client as `Authorization: Bearer <token>`.
- Refresh token: JWT, 7 day expiry, set by the backend as an **httpOnly, secure, sameSite=lax
  cookie** named `refresh_token` on `/auth/login` and `/auth/register`. Never returned in JSON.
- The backend stores a bcrypt hash of the current refresh token on `User.refreshTokenHash` so a
  token can be invalidated on logout/rotation (rotate-on-use).
- `/auth/refresh` reads the cookie, validates it against the stored hash, issues a new access
  token + rotates the refresh cookie.
- `/auth/logout` clears the cookie and nulls `refreshTokenHash`.
- Protected routes require `Authorization: Bearer <accessToken>` and use a `JwtAuthGuard`.
- On any `401` from a protected call, the frontend API client calls `/auth/refresh` once,
  retries the original request, and if that also fails, redirects to `/login`.

## Error shape (all non-2xx responses)

```json
{
  "statusCode": 400,
  "message": "Human readable message" ,
  "error": "Bad Request",
  "timestamp": "2026-08-20T12:00:00.000Z",
  "path": "/api/conversations"
}
```

`message` may be a string or string[] (class-validator errors).

## Endpoints

### POST /auth/register
Body: `{ name: string, email: string, password: string, confirmPassword: string }`
201 → `{ user: PublicUser, accessToken: string }` (+ sets refresh cookie)

### POST /auth/login
Body: `{ email: string, password: string }`
200 → `{ user: PublicUser, accessToken: string }` (+ sets refresh cookie)

### POST /auth/refresh
No body (reads cookie). 200 → `{ accessToken: string }` (+ rotates refresh cookie)

### POST /auth/logout
Protected. 204, clears refresh cookie.

### POST /auth/forgot-password
Body: `{ email: string }`. Always 200 → `{ message: "If an account exists for that email, a reset link has been sent." }`
regardless of whether the email exists (prevents user enumeration). If the user exists, the
backend generates a random token, stores its bcrypt hash + a 1 hour expiry on `User`, and
**logs the reset link to the server console** via `Logger` (no SMTP is configured in this
project — wire a real mail provider here later). This keeps the flow fully functional for
local/dev testing without pretending to send an email it can't.

### POST /auth/reset-password
Body: `{ token: string, password: string, confirmPassword: string }`
200 → `{ message: "Password updated. You can now log in." }` or 400 if token invalid/expired.

### GET /auth/me
Protected. 200 → `PublicUser`

```ts
type PublicUser = {
  id: string; name: string; email: string; avatarUrl: string | null; createdAt: string;
}
```

### GET /conversations?cursor=&limit=20&q=
Protected, paginated (cursor = last item's `updatedAt` ISO string, optional `q` searches title).
200 →
```ts
{
  data: Array<{ id: string; title: string; model: string; createdAt: string; updatedAt: string }>;
  nextCursor: string | null;
}
```

### POST /conversations
Protected. Body: `{ title?: string; model: string }` (title defaults to `"New Chat"`)
201 → `{ id, title, model, createdAt, updatedAt }`

### GET /conversations/:id
Protected. 200 →
```ts
{
  id: string; title: string; model: string; createdAt: string; updatedAt: string;
  messages: Array<{
    id: string; role: 'USER'|'ASSISTANT'|'SYSTEM'; content: string;
    status: 'PENDING'|'STREAMING'|'COMPLETE'|'ERROR'; createdAt: string;
    attachments: Array<{ id: string; fileName: string; fileUrl: string; mimeType: string; fileSize: number }>;
  }>;
}
```
404 if not found or not owned by requester.

### PATCH /conversations/:id
Protected. Body: `{ title: string }` (max 100 chars). 200 → updated conversation summary.

### DELETE /conversations/:id
Protected. 204.

### POST /conversations/:id/messages  — **streaming (SSE over POST)**
Protected. Body: `{ content: string, attachmentIds?: string[] }`

Response: `Content-Type: text/event-stream`, chunked. The connection stays open while the
model streams. Each event is a line `data: <json>\n\n`. Event payloads:

```ts
{ type: 'user_message'; message: MessageDto }              // echoes the persisted user message first
{ type: 'chunk'; content: string }                          // assistant text delta, repeated
{ type: 'title'; title: string }                             // emitted once if an auto title was generated
{ type: 'done'; message: MessageDto }                        // final persisted assistant message
{ type: 'error'; message: string }                           // generation failed; message stays status ERROR
```

`MessageDto` is the same shape as messages inside `GET /conversations/:id`.

Client aborts by closing the fetch (AbortController) — backend must detect the closed
connection (`req.on('close', ...)`) and stop calling the AI provider, persisting whatever
was generated so far with `status: 'ERROR'` if incomplete or `'COMPLETE'` if the stop landed
right at a natural boundary. A stopped generation is not treated as a hard error.

### POST /conversations/:id/regenerate — same streaming contract as above, no body

Regenerates a fresh assistant reply for the last user message (deletes the previous assistant
message first, then streams a new one with the same event protocol).

### GET /ai/models
Protected. 200 → `Array<{ id: string; label: string; provider: string }>` — drives the model
selector on the frontend. Backed by config, not hardcoded on either side.

## Attachments (architecture only — processing can be a stub)

### POST /attachments
Protected, `multipart/form-data`, field `file`. 201 →
`{ id: string; fileName: string; fileUrl: string; mimeType: string; fileSize: number }`
Accepts image/*, application/pdf, text/plain, .docx. Files are stored under
`backend/uploads/` and served statically at `/api/uploads/:filename`. `attachmentIds` returned
here are passed into `POST /conversations/:id/messages`.

## System prompt & context

Backend keeps the system prompt in config (`ai.systemPrompt`, overridable via
`AI_SYSTEM_PROMPT` env var), never hardcoded inline in providers/controllers.
`AiService.buildConversationContext(conversationId)` loads the most recent N messages
(config `ai.maxContextMessages`, default 20) oldest-first, prepends the system prompt, and
that's what's sent to the provider. This keeps room to add token-based trimming later.

## Auto title generation

After the **first** user+assistant exchange in a conversation (i.e. conversation still has the
default title and this was message-count 1), the backend asks the AI provider for a short
(<=6 word) title from the user's first message + assistant's first reply, sanitizes it (strip
quotes, clamp length), updates the conversation, and emits `{ type: 'title', title }` before
`done`.

## Frontend env

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Backend env

```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AI_SYSTEM_PROMPT="You are Codeles AI, an intelligent AI assistant. Provide accurate, practical and concise answers while expanding when the user asks for detail."
FRONTEND_URL=http://localhost:3000
PORT=4000
```
