# Current State

Active phase:
Phase 02 - Authorization And Registration

Phase status:
Implemented by Developer and ready for QA.

Repository structure:
- `apps/api` contains a minimal NestJS API service.
- `apps/transcriber` contains a minimal NestJS Transcriber service.
- `apps/web` contains a minimal Next.js App Router frontend.
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
- Web exposes `/` as the MVP auth screen and `/healthcheck`.
- Web `/healthcheck` calls the configured API healthcheck and returns `503` when API is unavailable.

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

Frontend auth:
- Root page provides registration and login forms.
- Frontend auth helper uses `NEXT_PUBLIC_API_URL`.
- Successful registration or login stores MVP auth state in localStorage.
- Authenticated home state displays `You successfully logged in to the application.` and provides logout.

Infrastructure:
- Postgres uses the `postgres_data` named volume.
- Kafka is configured as a single-node KRaft broker.
- Compose service healthchecks exist for Postgres, Kafka, API, Transcriber, and Web.
- Runtime configuration is represented in `.env.example` files.
- Real `.env` files are ignored.

Build:
- `npm run build --workspace @ismart/api` runs `tsc` followed by `tsc-alias`, which rewrites TypeScript path aliases (`@entities`, `@shared`, `@dto`) to relative paths in the compiled CommonJS output so Node.js can resolve them at runtime without additional configuration.

Validated commands:
- `npm install`
- `npm run typecheck --workspace @ismart/api`
- `npm run typecheck --workspace @ismart/web`
- `npm run build --workspace @ismart/api`
- `npm run build --workspace @ismart/web`
- `docker compose config`
- Local API smoke checks for register, duplicate register, login, invalid login, missing token, malformed token, and valid `GET /auth/me`.

Out of scope and not implemented:
- Email verification.
- Password reset.
- Refresh tokens.
- Social login.
- Account management screens.
- Database migrations.
- Kafka producers/consumers for business processing.
- Swagger/OpenAPI.
- Frontend product workflows beyond MVP auth verification.
