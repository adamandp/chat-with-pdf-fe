# Chat with PDF — Frontend

A colorful, neo-brutalist PDF workspace built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query v5, Axios, MSW, and React-PDF.

The current build is a **standalone frontend demo**. It includes navigation, document management, chat interactions, source citations, and a PDF viewer. AI responses and uploads are mocked; no production backend or LLM is connected.

## Start

Requires Bun 1.4 or later.

```bash
bun install
bun run dev
```

Open <http://localhost:3000>. Try `/documents`, `/trash`, and `/chats/session-1` for a seeded conversation with citations.

The demo API is enabled by default. Copy `.env.example` to `.env.local` if you want to configure it. For a real backend, set `NEXT_PUBLIC_API_MOCKING=disabled` and `NEXT_PUBLIC_API_URL` to the API origin. The frontend expects the response contracts defined in the service modules.

## Commands

```bash
bun run typecheck
bun run lint
bun run test           # Bun tests for MSW contracts
bun run build
bun run test:e2e       # Requires Playwright Chromium
bun run generate:pdf   # Regenerate committed sample PDFs
```

`postinstall` copies the matching `pdfjs-dist` worker into `public/`, avoiding a separate CDN worker version.

## Architecture

```text
app/
  layout.tsx                  Root providers
  (workspace)/layout.tsx      Persistent shared AppSidebar + main
  (workspace)/page.tsx        New conversation
  (workspace)/chats/[sessionId]/page.tsx
  (workspace)/documents/page.tsx
  (workspace)/trash/page.tsx
components/ui/                 shadcn primitives
components/layout/             Shared sidebar
features/                      Chat, documents, trash, PDF, common UI
services/                      Domain API + TanStack Query hooks
mocks/data/                    Seeded worker-memory data
mocks/handlers/                MSW endpoints by domain
lib/axios.ts                   One configured Axios instance
providers/                     Separate mock readiness and query providers
```

The sidebar is mounted **once** in the shared route layout. Page transitions use actual App Router URLs; no `?page=` or giant client-side page switcher is involved.

The `dam-creamy-cream` frontend informed the service/mock/provider separation, but this app guards initial queries until MSW is ready to avoid a service-worker race.

## Demo behaviors and limitations

- 12 sample PDFs are included for preview, download, page navigation, zoom, and current-page text highlighting. These PDFs are synthetic examples, not real financial reports.
- Documents support grid/list, search, sorting, pagination, and soft delete. Trash supports independent chat/document pagination, restore, and confirmed permanent deletion.
- Chat supports session routing, editing user questions, feedback, copying responses, multi-select library attachments, PDF upload, two answer modes, and clickable citations.
- Desktop preview is resizable; the side panel is constrained to 20–40%. Tablet/mobile use a full-screen PDF overlay and a sidebar drawer.
- MSW data is held in service-worker memory and may reset when the worker restarts. Uploaded file metadata can be previewed only during the same browser session through an object URL. The application does **not** promise persistent storage.
- Chat responses, analysis status, and document citations are simulated. Replace the mock handlers with your NestJS endpoints to enable real RAG responses and storage.
- The print action opens the PDF in the browser's PDF viewer; printing is then handled by the browser.

## Testing

Unit/API tests exercise document pagination, independent Trash lists, and chat create/delete/restore. Playwright tests cover routing, document grid/list/search, citation preview, and mobile overflow. Browser tests require Playwright Chromium to be installed with `bunx playwright install chromium`.
