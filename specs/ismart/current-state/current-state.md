# Current State

Active phase:
Phase 04 - Audio Upload To Transcriber

Phase status:
Implemented by Developer and passed QA.

Repository structure:
- `apps/api` contains a NestJS API service with auth, files, storage, and Kafka producer modules.
- `apps/transcriber` contains a NestJS Transcriber service with a Kafka consumer and R2 storage module.
- `apps/web` contains a Next.js App Router frontend with authenticated layout, audio input tool, and file send flow.
- `libs/shared` contains TypeORM entity classes, enum definitions, shared DTOs, and shared barrels.
- `docker-compose.yml` orchestrates Postgres, Kafka, API, Transcriber, and Web.

Runtime services:
- API listens on `PORT` with default `8080`.
- API exposes `GET /healthcheck` returning `This is a api`.
- API connects to PostgreSQL through `DATABASE_URL`.
- API requires `JWT_SECRET` and uses `JWT_EXPIRES_IN` with default `1h`.
- API exposes `POST /auth/register`, `POST /auth/login`, and protected `GET /auth/me`.
- API exposes `POST /files` (JWT-protected) — creates a `FileEntity` with status `UPLOADING` and returns a presigned PUT URL for Cloudflare R2.
- API exposes `POST /files/:id/upload-complete` (JWT-protected) — sets file status to `TRANSCRIBING`, creates a `TranscriptionJobEntity` with status `PENDING`, and publishes a `TranscriptionJobMessageDto` to Kafka topic `transcription.jobs`.
- Transcriber listens on `PORT` with default `8081`.
- Transcriber exposes `GET /healthcheck` returning `This is a transcriber`.
- Transcriber runs a Kafka microservice alongside the HTTP server (`connectMicroservice` + `startAllMicroservices`).
- Transcriber consumes `transcription.jobs` Kafka topic, downloads the audio file from Cloudflare R2, and saves it to `<cwd>/<fileId>.webm`.
- Web listens on `PORT` with default `3000`.
- Web exposes `/` as the auth screen (login / register toggle) and `/healthcheck`.
- Web exposes `/files`, `/knowledge-bases`, and `/profile` as authenticated routes.
- Web `/healthcheck` calls the configured API healthcheck and returns `503` when API is unavailable.

Frontend routing:
- `app/(auth)/layout.tsx` — unauthenticated layout; redirects to `/files` if `ismart.accessToken` is present in localStorage.
- `app/(auth)/page.tsx` — auth screen entry point; no sidebar.
- `app/(app)/layout.tsx` — authenticated layout; redirects to `/` if `ismart.accessToken` is absent; renders persistent left sidebar.
- `app/(app)/files/page.tsx` — Files page with audio input tool and send flow.
- `app/(app)/knowledge-bases/page.tsx` — Knowledge Bases placeholder.
- `app/(app)/profile/page.tsx` — Profile placeholder.

Frontend auth:
- Auth screen shows one form at a time: login (default) or register.
- Login and register forms toggle by client-side state; no page navigation occurs on toggle.
- Successful login or registration stores `ismart.accessToken` and `ismart.user` in localStorage, then navigates to `/files`.
- Frontend auth helper uses `NEXT_PUBLIC_API_URL`.

Frontend sidebar:
- `SidebarComponent` is rendered on all authenticated pages.
- Sidebar is fixed to the left edge, 220px wide, full viewport height.
- Navigation items: Files (top), Knowledge Bases (top).
- Logout button anchored to the bottom, separated by a border.
- Clicking Logout removes `ismart.accessToken` from localStorage and navigates to `/`.
- Active item detected via `usePathname()` with `startsWith` matching.

Frontend Files page:
- `AudioInputComponent` provides record and upload modes, toggled by a segmented control.
- Default mode is `record`.
- Record mode: Start recording → `getUserMedia` → `MediaRecorder` → pulsing indicator + timer → Stop → `<audio controls>` preview → Send / Discard.
- Upload mode: `<input accept="audio/*">` → file name + `<audio controls>` preview → Send / Clear.
- Send flow (three steps):
  1. Checks `ismart.accessToken` in localStorage; shows error if absent without making API calls.
  2. Calls `POST /files` via `useFilesApi.createFile` → receives `{ fileId, uploadUrl }`.
  3. PUT audio blob to presigned `uploadUrl` via `XMLHttpRequest`; `onprogress` updates `uploadProgress` (0–100); progress bar shows "Uploading… X%".
  4. Calls `POST /files/<fileId>/upload-complete` via `useFilesApi.confirmUpload`.
  5. Shows "File sent. ID: \<fileId\>" on success or readable error message on failure.
- `sendState` and `uploadProgress` reset to initial values on discard, clear, or mode switch.
- Switching modes resets all state in both directions.

Cloudflare R2 integration:
- API `StorageService` creates an `S3Client` with `region: 'auto'`, endpoint `https://<CLOUD_STORAGE_ACCOUNT_ID>.r2.cloudflarestorage.com`, and credentials from env.
- API generates presigned PUT URLs with 15-minute expiry using `PutObjectCommand` + `getSignedUrl`.
- Transcriber `StorageService` downloads files using `GetObjectCommand` and writes to disk via `fs.promises.writeFile`.
- Storage keys: `audio-<fileId>` for audio objects.

Kafka integration:
- API Kafka producer uses `ClientKafka` with `clientId: 'ismart-api'`, brokers from `KAFKA_BROKERS`.
- API publishes `TranscriptionJobMessageDto` to topic `transcription.jobs` with key `fileId`.
- Transcriber Kafka consumer uses `clientId: 'ismart-transcriber'`, `groupId: 'ismart-transcriber'`, brokers from `KAFKA_BROKERS`.
- Transcriber listens on `@EventPattern('transcription.jobs')`.

Shared DTOs:
- Auth DTOs: registration, login, public auth user responses, auth responses.
- File DTOs: `CreateFileDto`, `CreateFileResponseDto`, `ConfirmUploadResponseDto`.
- Kafka DTOs: `TranscriptionJobMessageDto`.

Authentication:
- Registration normalizes email, rejects duplicates, hashes passwords with bcrypt, creates `USER` users, and returns JWT access tokens.
- Login normalizes email, compares bcrypt hashes, returns generic invalid credential errors, and returns JWT access tokens.
- JWT payload includes `sub`, `email`, and `role`.
- Reusable JWT guard, interceptor, `@CurrentUser` decorator, and request user types under `apps/api/src/auth`.

Infrastructure:
- Postgres uses the `postgres_data` named volume.
- Kafka is configured as a single-node KRaft broker.
- Compose service healthchecks exist for Postgres, Kafka, API, Transcriber, and Web.
- Runtime configuration is in `.env.example` files; real `.env` files are git-ignored.
- `CLOUD_STORAGE_*` variables required by both API and Transcriber.

Build:
- `npm run build --workspace @ismart/api` runs `tsc` followed by `tsc-alias`.
- `npm run build --workspace @ismart/transcriber` runs `tsc`.

Validated commands:
- `npm run typecheck --workspace @ismart/api` (phase 04)
- `npm run typecheck --workspace @ismart/transcriber` (phase 04)
- `npm run typecheck --workspace @ismart/web` (phase 04)
- `npm run build --workspace @ismart/api` (phase 04)
- `npm run build --workspace @ismart/transcriber` (phase 04)
- `docker compose config` (phase 04)

Out of scope and not implemented:
- Actual audio transcription.
- Publishing to `transcription.results`.
- Setting file status to `COMPLETED` or `FAILED`.
- User plan limit checking and reservation.
- Polling file status from the frontend.
- Displaying transcription results.
- Knowledge base management.
- Profile page content.
- Email verification, password reset, or refresh tokens.
- Role-based or plan-based access control.
- Database migrations.
- Swagger/OpenAPI.
