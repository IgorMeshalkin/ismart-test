# Current State

Active phase:
Phase 01 - Project Foundation

Phase status:
Accepted after local Developer validation, QA report, and Lead review.

Repository structure:
- `apps/api` contains a minimal NestJS API service.
- `apps/transcriber` contains a minimal NestJS Transcriber service.
- `apps/web` contains a minimal Next.js App Router frontend.
- `libs/shared` contains TypeORM entity classes, enum definitions, and shared barrels.
- `docker-compose.yml` orchestrates Postgres, Kafka, API, Transcriber, and Web.

Runtime services:
- API listens on `PORT` with default `8080`.
- API exposes `GET /healthcheck` returning `This is a api`.
- Transcriber listens on `PORT` with default `8081`.
- Transcriber exposes `GET /healthcheck` returning `This is a transcriber`.
- Web listens on `PORT` with default `3000`.
- Web exposes `/` and `/healthcheck`.
- Web `/healthcheck` calls the configured API healthcheck and returns `503` when API is unavailable.

Shared domain:
- Entity classes exist for `User`, `Plan`, `UserPlan`, `File`, `TranscriptionJob`, `KnowledgeBase`, `KnowledgeBaseFile`, `KnowledgeBaseSubscriber`, and `Notification`.
- All entities extend `BaseEntity`.
- All enum values match `specs/ismart/domain-model.md`.
- `File.audioStorageKey` and `File.textStorageKey` are computed getters and are not persisted columns.
- Shared imports are exposed through `@shared`, `@shared/*`, `@entities`, `@entities/*`, `@dto`, and `@dto/*`.

Infrastructure:
- Postgres uses the `postgres_data` named volume.
- Kafka is configured as a single-node KRaft broker.
- Compose service healthchecks exist for Postgres, Kafka, API, Transcriber, and Web.
- Runtime configuration is represented in `.env.example` files.
- Real `.env` files are ignored.

Validated commands:
- `npm install`
- `npm run typecheck`
- `npm run build`
- `docker compose config`
- `docker compose up --build --wait`
- `docker compose down`

Out of scope and not implemented:
- Authentication.
- Business modules and endpoints.
- Database connection modules or migrations.
- Kafka producers/consumers for business processing.
- Swagger/OpenAPI.
- Frontend product workflows.
