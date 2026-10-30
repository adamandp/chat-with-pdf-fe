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
