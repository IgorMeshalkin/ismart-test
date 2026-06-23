# Current State

Active phase:
Phase 03 - UI Redesign And Voice Recording

Phase status:
Implemented by Developer and passed QA.

Repository structure:
- `apps/api` contains a minimal NestJS API service.
- `apps/transcriber` contains a minimal NestJS Transcriber service.
- `apps/web` contains a Next.js App Router frontend with authenticated layout and audio input tool.
- `libs/shared` contains TypeORM entity classes, enum definitions, and shared barrels.
- `docker-compose.yml` orchestrates Postgres, Kafka, API, Transcriber, and Web.

Runtime services:
- API listens on `PORT` with default `8080`.
- API exposes `GET /healthcheck` returning `This is a api`.
- API connects to PostgreSQL through `DATABASE_URL`.
- API requires `JWT_SECRET` and uses `JWT_EXPIRES_IN` with default `1h`.
- API exposes `POST /auth/register`, `POST /auth/login`, and protected `GET /auth/me`.
- Transcriber listens on `PORT` with default `8081`.
- Transcriber exposes `GET /healthcheck` returning `This is a transcriber`.
- Web listens on `PORT` with default `3000`.
- Web exposes `/` as the auth screen (login / register toggle) and `/healthcheck`.
- Web exposes `/files`, `/knowledge-bases`, and `/profile` as authenticated routes.
- Web `/healthcheck` calls the configured API healthcheck and returns `503` when API is unavailable.

Frontend routing:
- `app/(auth)/layout.tsx` — unauthenticated layout; redirects to `/files` if `ismart.accessToken` is present in localStorage.
- `app/(auth)/page.tsx` — auth screen entry point; no sidebar.
- `app/(app)/layout.tsx` — authenticated layout; redirects to `/` if `ismart.accessToken` is absent; renders persistent left sidebar.
- `app/(app)/files/page.tsx` — Files page with audio input tool.
- `app/(app)/knowledge-bases/page.tsx` — Knowledge Bases placeholder.
- `app/(app)/profile/page.tsx` — Profile placeholder.

Frontend auth:
- Auth screen shows one form at a time: login (default) or register.
- Login and register forms toggle by client-side state; no page navigation occurs on toggle.
- Login view footer: "Don't have an account?" + "Create account" toggle.
- Registration view footer: "Already have an account?" + "Sign in" toggle.
- Successful login or registration stores `ismart.accessToken` and `ismart.user` in localStorage, then navigates to `/files`.
- API error messages are displayed below the respective form.
- Frontend auth helper uses `NEXT_PUBLIC_API_URL`.

Frontend sidebar:
- `SidebarComponent` is rendered on all authenticated pages.
- Sidebar is fixed to the left edge, 220px wide, full viewport height.
- Navigation items: Files (top), Knowledge Bases (top).
- Profile link anchored to the bottom, separated by a border.
- Active item detected via `usePathname()` with `startsWith` matching and styled with `background: rgba(15,118,110,0.08); color: var(--accent)`.

Frontend Files page:
- `AudioInputComponent` provides record and upload modes, toggled by a segmented control.
- Default mode is `record`.
- Record mode: Start recording → `getUserMedia` → `MediaRecorder` → pulsing indicator + timer → Stop → `<audio controls>` preview → Discard.
- Record mode: microphone permission denied shows a readable error message.
- Upload mode: `<input accept="audio/*">` → file name + `<audio controls>` preview → Clear.
- Switching modes resets all state in both directions.
- Audio files are not submitted to the backend in this phase.

Design system:
- Light background (`var(--background): #f7f8fa`), white surface (`var(--surface): #ffffff`).
- Accent color `var(--accent): #0f766e`.
- All cards use `border-radius: 16px` and `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`.
- All inputs use `border-radius: 12px` with focus ring.
- All primary buttons are full-width within their form, `border-radius: 12px`.

Shared domain:
- Entity classes exist for `User`, `Plan`, `UserPlan`, `File`, `TranscriptionJob`, `KnowledgeBase`, `KnowledgeBaseFile`, `KnowledgeBaseSubscriber`, and `Notification`.
- All entities extend `BaseEntity`.
- All enum values match `specs/ismart/domain-model.md`.
- `File.audioStorageKey` and `File.textStorageKey` are computed getters and are not persisted columns.
- Shared imports are exposed through `@shared`, `@shared/*`, `@entities`, `@entities/*`, `@dto`, and `@dto/*`.

Shared DTOs:
- Auth DTOs exist for registration, login, public auth user responses, and auth responses.
- Auth response DTOs do not expose `passwordHash`.

Authentication:
- Registration normalizes email, rejects duplicate email, hashes passwords with bcrypt, creates `USER` users, and returns JWT access tokens.
- Login normalizes email, compares bcrypt password hashes, returns generic invalid credential errors, and returns JWT access tokens.
- JWT payload includes `sub`, `email`, and `role`.
- Reusable JWT guard, interceptor, current-user decorator, and request user types exist under `apps/api/src/auth`.
- Protected auth smoke endpoint `GET /auth/me` returns `{ id, email, role }` for a valid Bearer token.

Infrastructure:
- Postgres uses the `postgres_data` named volume.
- Kafka is configured as a single-node KRaft broker.
- Compose service healthchecks exist for Postgres, Kafka, API, Transcriber, and Web.
- Runtime configuration is represented in `.env.example` files.
- Real `.env` files are ignored.

Build:
- `npm run build --workspace @ismart/api` runs `tsc` followed by `tsc-alias`, which rewrites TypeScript path aliases (`@entities`, `@shared`, `@dto`) to relative paths in the compiled CommonJS output.

Validated commands:
- `npm run typecheck --workspace @ismart/web` (phase 03)
- `npm run typecheck --workspace @ismart/api` (phase 02)
- `npm run build --workspace @ismart/api` (phase 02)
- `docker compose config` (phase 01)

Out of scope and not implemented:
- Submitting or processing audio files on the backend.
- Transcription workflows.
- Knowledge base creation or management screens.
- Profile page content.
- Email verification, password reset, or refresh tokens.
- Role-based or plan-based access control.
- Transcriber or API changes beyond phase 02.
- Database migrations.
- Kafka producers/consumers for business processing.
- Swagger/OpenAPI.
