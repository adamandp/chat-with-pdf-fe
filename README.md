# Chat with PDF — Frontend

Next.js 16 / React 19 PDF workspace, using Axios, TanStack Query, MSW, React-PDF, and the NestJS backend contract.

The same UI supports two modes:

| Mode          | API                               | Data                                                               |
| ------------- | --------------------------------- | ------------------------------------------------------------------ |
| Vercel / demo | MSW intercepts `/api/*`           | Simulated chat; browser-persistent documents, sessions and account |
| Local         | NestJS at `http://localhost:3000` | Real auth, MinIO/BullMQ uploads, AI SSE, chat, and documents       |

## Run

Requires Bun 1.4+ (or Node 24+).

```bash
bun install
cp .env.example .env.local
bun run dev -- --port 3001
```

The demo defaults to:

```dotenv
NEXT_PUBLIC_API_MOCKING=enabled
NEXT_PUBLIC_API_URL=/api
```

The workspace opens directly at `/` as Guest. Simply viewing or navigating does not create an account. The first **Send Chat** or **Upload PDF** restores an existing refresh session or creates an anonymous user via `POST /auth/guest`. Guest chats/PDFs persist within the current browser. Register upgrades the same guest user (keeping chats and PDFs); logging into a different existing account does not import guest data.

The demo account is still available: **demo** / **demo12345**. Demo accounts and guest workspaces are stored separately in browser localStorage; uploaded PDF binaries use IndexedDB. These browser-local records are not synchronized across devices.

To connect a local NestJS server:

```dotenv
NEXT_PUBLIC_API_MOCKING=disabled
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Run the backend on port 3000 and the frontend on port 3001, with `FRONTEND_ORIGINS=http://localhost:3001` in the NestJS environment. The backend has **no** global `/api` prefix. The refresh token is an HttpOnly cookie; the frontend holds the access token in memory, refreshes it on reload, and retries a single unauthorized request after refresh. Queries for personal data remain disabled until a valid user session exists.

> `NEXT_PUBLIC_*` variables are embedded during a Next.js build. Give Vercel the demo values and rebuild after changing them.

## Docker

Build and run the production frontend (demo mode, no backend required):

```bash
docker build -t chat-with-pdf-fe .
docker run -d --name chat-with-pdf-fe -p 3001:3000 chat-with-pdf-fe
```

Open http://localhost:3001. The container runs as a non-root user and includes a health check.

For a real backend, set the browser-accessible API URL at build time:

```bash
docker build -t chat-with-pdf-fe \
  --build-arg NEXT_PUBLIC_API_MOCKING=disabled \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3000 .
```

`NEXT_PUBLIC_*` values are embedded in the browser bundle; rebuild the image to change them.
The backend must allow `http://localhost:3001` in its CORS origins.

```bash
docker logs chat-with-pdf-fe
docker stop chat-with-pdf-fe
docker rm chat-with-pdf-fe
```

## Integrated operations

| Screen               | Backend endpoints                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth/account         | `/auth/guest`, `/auth/register`, `/auth/login`, `/auth/profile`, `/session/refresh`, `/auth/logout`, `/auth/logout-all`                                                                                  |
| Chat sidebar / Trash | `GET /chat-sessions`, `GET /chat-sessions/deleted`, `PATCH /chat-sessions/:id`, DELETE / restore / permanent                                                                                             |
| Chat messages        | `GET /chat/:id/details`, `POST /chat/send`, `POST /chat/:messageId/edit`, `POST /chat/:messageId/regenerate`, `POST /chat/:id/fork`, `PATCH /chat/:messageId/activate`, `POST /chat/:messageId/feedback` |
| Documents / Trash    | `GET /documents`, `GET /documents/deleted`, `GET /documents/:id`, DELETE / restore / permanent                                                                                                           |
| Upload               | `POST /document-upload/presigned-url` → signed PUT → `POST /document-upload/:id/process` → status checks via `GET /documents/:id` (resume on refresh/return to the chat)                                 |

Chat generations stream `started`, `sources`, `token`, `done`, and `error` events, with partial text displayed while the response arrives. The active branch (including feedback, sources and versions) comes from the chat detail endpoint. PDF preview retrieves a signed GET URL on demand.

**Backend integration dependencies:** at the time of this frontend implementation, the inspected BE `master` declares `q/order` in the query DTO but the list services do not apply them; documents also ignore the requested sort field. These UI controls send the expected query parameters and work in MSW, but real search/sorting awaits the corresponding BE service changes. Permanent deletion keeps tombstone metadata/relations; a deleted PDF cannot be previewed. Processing retry is intentionally not implemented.

## Project layout

```text
src/app/               App Router pages and workspace layout
src/components/        Screen-oriented UI, auth modal and PDF viewer
src/features/          Per-domain API, query and mutation modules
src/interface/         Frontend models / web response types
src/lib/               Axios auth/refresh, SSE parser, uploaded PDF storage
src/mocks/data/        Browser-persistent demo state and fixtures
src/mocks/handlers/    NestJS-compatible HTTP and SSE handlers
src/providers/         Query, auth and MSW readiness providers
```

## Verification

```bash
bun run typecheck
bun run lint
bun run test
bun run build
bun run test:e2e
```

Playwright tests require Chromium (`bunx playwright install chromium`) and exercise the production build. Real-backend end-to-end testing additionally requires PostgreSQL, Redis, MinIO, Milvus and the configured AI provider.
