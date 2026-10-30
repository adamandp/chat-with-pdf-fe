# Frontend implementation conventions

These conventions are grounded in the owner's repositories:
- **dam-creamy-cream:** Next.js App Router layouts, Axios API modules, TanStack Query, and isolated MSW data/handlers
- **habit-sharper:** feature-specific `.api.ts`, `.query.ts`, and `.mutation.ts` files, plus explicit query-key invalidation
- **dam-shop-control:** shared navigation and reusable table/pagination components
- **dam-neural-classifier:** focused upload/process mutations and a central Axios instance

## Rules for Chat with PDF

1. Keep navigation and shared sidebar in the App Router workspace layout; pages compose screens rather than reimplementing navigation.
2. Put HTTP requests in `services/<domain>/*.api.ts`; reads and query keys in `*.query.ts`; writes/invalidation in `*.mutation.ts`.
3. Keep MSW fixture data separate from handlers. Components must not import mock fixtures.
4. Keep chat header, composer, message, source display, and PDF viewer as distinct UI responsibilities.
5. Maintain mobile viewport containment: nested flex/grid children need `min-width: 0`, and only the thread should scroll behind a stable header/composer.
6. Prefer existing shadcn primitives and shared styles over one-off controls.
7. Test layout changes at narrow and wide widths, with long conversations, many attachments, PDF overlay, and iOS keyboard. CI build alone does not prove visual correctness.

## Document upload boundary

The current NestJS backend exposes `POST /documents/presigned-url` (body `{fileName}`),
signed `PUT upload_url` to object storage, `POST /documents/:id/process`,
and `GET /documents/:id` for status. There is no backend multipart
`POST /documents` upload endpoint.

The composer keeps message drafts editable while this mutation is pending, blocks
Send until the document reaches READY, and surfaces Preparing / Uploading /
Processing stages. The isolated MSW handlers simulate the same contract, but
do not replace a real MinIO/BullMQ integration test. Signed PUT requests bypass
the app Axios baseURL and authentication interceptors. An upload still
processing after two minutes surfaces an error instead of pretending to be ready.
