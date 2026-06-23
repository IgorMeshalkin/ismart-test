# Phase 01 - Project Foundation Tasks

## Status Legend

- `Pending` - not started.
- `In Progress` - implementation started.
- `Completed` - implemented and validated.
- `Blocked` - cannot proceed without clarification or dependency.

---

## Skill Usage

Developer must use relevant local skills from `.agents/skills` when implementing tasks.

For Phase 01, applicable skills are:

- [`new-nest`](../../../../.agents/skills/new-nest/SKILL.md) for creating `apps/api` and `apps/transcriber`;
- [`new-next`](../../../../.agents/skills/new-next/SKILL.md) for creating `apps/web`;
- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md) as the TypeORM entity creation pattern for shared entity work, adapted to `libs/shared` and the approved domain model.

Skills not applicable to Phase 01 unless the phase is explicitly expanded:

- [`new-pg-typeorm`](../../../../.agents/skills/new-pg-typeorm/SKILL.md) because database connection setup and migrations are out of scope for this phase;
- [`add-module`](../../../../.agents/skills/add-module/SKILL.md) because business modules are out of scope;
- [`create-endpoint`](../../../../.agents/skills/create-endpoint/SKILL.md) because business endpoints are out of scope;
- [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) because business service methods are out of scope;
- [`add-dto`](../../../../.agents/skills/add-dto/SKILL.md) because API DTOs are out of scope;
- [`add-swagger`](../../../../.agents/skills/add-swagger/SKILL.md) because Swagger/OpenAPI is out of scope;
- [`add-api-gen`](../../../../.agents/skills/add-api-gen/SKILL.md) because frontend API generation depends on Swagger/OpenAPI;
- [`create-api-hook`](../../../../.agents/skills/create-api-hook/SKILL.md) because generated API contracts and product endpoints are out of scope.

When a skill conflicts with the approved phase scope, `phase.md`, `tasks.md`, and `specs/ismart/domain-model.md` take precedence.

---

## Task 01 - Create Monorepository Structure

Status:
Completed

Description:
Create the base repository structure required by the architecture.

Required paths:

```text
apps/api
apps/transcriber
apps/web
libs/shared
specs/ismart/agents
specs/ismart/progress
specs/ismart/current-state
specs/ismart/reports
```

Acceptance Criteria:

- all required directories exist;
- root package/workspace configuration exists if selected by implementation;
- repository structure does not conflict with `specs/ismart/architecture.md`.

---

## Task 02 - Configure TypeScript Shared Path Aliases

Status:
Completed

Description:
Configure TypeScript path aliases so services can import shared entities and future DTOs from `libs/shared` through `@`-prefixed aliases.

Required files:

```text
tsconfig.base.json
apps/api/tsconfig.json
apps/transcriber/tsconfig.json
apps/web/tsconfig.json
libs/shared/src/index.ts
libs/shared/src/entities/index.ts
libs/shared/src/dto/index.ts
```

Required aliases:

```json
{
  "@shared": ["libs/shared/src/index.ts"],
  "@shared/*": ["libs/shared/src/*"],
  "@entities": ["libs/shared/src/entities/index.ts"],
  "@entities/*": ["libs/shared/src/entities/*"],
  "@dto": ["libs/shared/src/dto/index.ts"],
  "@dto/*": ["libs/shared/src/dto/*"]
}
```

Requirements:

- root TypeScript config defines shared aliases;
- API extends or consumes the shared alias configuration;
- Transcriber extends or consumes the shared alias configuration;
- Web extends or consumes the shared alias configuration;
- shared barrel files exist for `@shared`, `@entities`, and `@dto`;
- shared entities can be imported from services through `@entities/*`;
- shared entities can be imported from services through `@entities`;
- future DTOs can be imported from services through `@dto` and `@dto/*`;
- shared enums and contracts can be imported through `@shared/*`;
- services do not use deep relative imports for shared library files.

Shared persisted entities must be TypeORM entity classes with decorators and must be usable by future database connection setup without rewriting the domain classes.

Acceptance Criteria:

- TypeScript resolves `@shared/*` from API, Transcriber, and Web;
- TypeScript resolves `@entities` from API and Transcriber;
- TypeScript resolves `@entities/*` from API and Transcriber;
- TypeScript resolves `@dto` from API, Transcriber, and Web before concrete DTOs are added;
- TypeScript resolves `@dto/*` from API, Transcriber, and Web once concrete DTO files are added;
- sample imports from aliases compile;
- no service imports shared entities or DTOs through `../../libs/...` paths.

---

## Task 03 - Create API NestJS Application

Status:
Completed

Relevant Skills:

- [`new-nest`](../../../../.agents/skills/new-nest/SKILL.md)

Description:
Create a minimal NestJS application for the main API service.

Requirements:

- path: `apps/api`;
- TypeScript enabled;
- environment-based port configuration;
- CORS allows frontend local origin;
- `GET /healthcheck` endpoint exists;
- endpoint returns `This is a api`.

Acceptance Criteria:

- API starts locally;
- API builds successfully;
- `GET /healthcheck` returns the required response;
- no business modules are implemented in this task.

---

## Task 04 - Create Transcriber NestJS Application

Status:
Completed

Relevant Skills:

- [`new-nest`](../../../../.agents/skills/new-nest/SKILL.md)

Description:
Create a minimal NestJS application for the transcription service.

Requirements:

- path: `apps/transcriber`;
- TypeScript enabled;
- environment-based port configuration;
- Kafka broker URL is configurable through environment variables;
- `GET /healthcheck` endpoint exists;
- endpoint returns `This is a transcriber`.

Acceptance Criteria:

- Transcriber starts locally;
- Transcriber builds successfully;
- `GET /healthcheck` returns the required response;
- no transcription provider logic is implemented in this task.

---

## Task 05 - Create Frontend Next.js Application

Status:
Completed

Relevant Skills:

- [`new-next`](../../../../.agents/skills/new-next/SKILL.md)

Description:
Create a minimal Next.js frontend application.

Requirements:

- path: `apps/web`;
- TypeScript enabled;
- App Router is used;
- backend URL is configurable through environment variables;
- frontend has a healthcheck route or endpoint;
- frontend healthcheck verifies API healthcheck availability.

Acceptance Criteria:

- frontend starts locally;
- frontend builds successfully;
- root page is available;
- frontend healthcheck succeeds only when API is reachable.

---

## Task 06 - Create Shared Entity Base

Status:
Completed

Relevant Skills:

- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md)

Description:
Create common TypeORM entity base definitions under `libs/shared`.

Required definitions:

- `guid` or equivalent UUID string type;
- `BaseEntity`.

Required `BaseEntity` fields:

- `id`;
- `isActive`;
- `createdDate`;
- `updatedDate`.

Acceptance Criteria:

- `BaseEntity` matches `specs/ismart/domain-model.md`;
- all future TypeORM entity definitions can extend or compose `BaseEntity`;
- persisted entity definitions use TypeORM decorators;
- entity exports are available through `@entities/*` or `@shared/*`;
- timestamp fields use `Date`.

Skill Notes:

- use `add-entity` only as a structural pattern;
- create shared definitions under `libs/shared`, not under `src/entity`;
- domain model fields are already defined, so Developer must not ask for entity fields unless the specification is ambiguous.

---

## Task 07 - Create User And Plan Shared Entities

Status:
Completed

Relevant Skills:

- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md)

Description:
Create shared definitions for users and plans.

Required entities:

- `User`;
- `Plan`;
- `UserPlan`.

Required enums:

- `UserRole`;
- `UserPlanStatus`.

Acceptance Criteria:

- fields match the domain model;
- entity classes use TypeORM decorators;
- enum values exactly match the specification;
- `UserPlan` includes remaining and reserved limits;
- shared entities and enums are importable through `@entities/*` or `@shared/*`;
- relation identifiers are represented with `userId` and `planId`.

Skill Notes:

- use `add-entity` only as a structural pattern;
- create shared definitions under `libs/shared`, not under `src/entity`;
- `specs/ismart/domain-model.md` is the source of truth for fields, relations, and enum values.

---

## Task 08 - Create File And Transcription Shared Entities

Status:
Completed

Relevant Skills:

- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md)

Description:
Create shared definitions for audio files and transcription jobs.

Required entities:

- `File`;
- `TranscriptionJob`.

Required enums:

- `FileStatus`;
- `TranscriptionJobStatus`.

Acceptance Criteria:

- fields match the domain model;
- entity classes use TypeORM decorators;
- `File` exposes computed `audioStorageKey`;
- `File` exposes computed `textStorageKey`;
- storage keys are not represented as persisted database columns on `File`;
- `TranscriptionJob` includes request and response topic fields;
- `TranscriptionJob` does not persist `audioStorageKey` or `textStorageKey`;
- shared entities and enums are importable through `@entities/*` or `@shared/*`;
- Kafka messages are not modeled with binary audio payloads.

Skill Notes:

- use `add-entity` only as a structural pattern;
- do not persist `File.audioStorageKey` or `File.textStorageKey` as fields;
- do not persist `TranscriptionJob.audioStorageKey` or `TranscriptionJob.textStorageKey` as fields;
- computed storage key behavior must follow `specs/ismart/domain-model.md`.

---

## Task 09 - Create Knowledge Base Shared Entities

Status:
Completed

Relevant Skills:

- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md)

Description:
Create shared definitions for knowledge base functionality.

Required entities:

- `KnowledgeBase`;
- `KnowledgeBaseFile`;
- `KnowledgeBaseSubscriber`.

Required enums:

- `KnowledgeBaseRole`.

Acceptance Criteria:

- fields match the domain model;
- entity classes use TypeORM decorators;
- `KnowledgeBaseFile` contains `knowledgeBaseId`, `fileId`, and `addedAt`;
- `KnowledgeBaseSubscriber` contains `knowledgeBaseId`, `userId`, and `role`;
- shared entities and enums are importable through `@entities/*` or `@shared/*`;
- unique pair requirements are documented near the relevant definitions or in shared metadata.

Skill Notes:

- use `add-entity` only as a structural pattern;
- create shared definitions under `libs/shared`, not under `src/entity`;
- document unique pair requirements from the domain model.

---

## Task 10 - Create Notification Shared Entity

Status:
Completed

Relevant Skills:

- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md)

Description:
Create shared definitions for notifications.

Required entity:

- `Notification`.

Required enums:

- `NotificationType`;
- `NotificationReason`.

Acceptance Criteria:

- fields match the domain model;
- entity class uses TypeORM decorators;
- `payload` supports structured JSON-like data;
- enum values include future channels from the specification;
- shared entity and enums are importable through `@entities/*` or `@shared/*`;
- MVP channel restrictions are documented.

Skill Notes:

- use `add-entity` only as a structural pattern;
- preserve future enum channels from `specs/ismart/domain-model.md`;
- do not implement notification delivery logic in this phase.

---

## Task 11 - Create API Dockerfile

Status:
Completed

Description:
Create Dockerfile for the API service.

Requirements:

- path: `apps/api/Dockerfile`;
- installs dependencies;
- builds the NestJS application;
- starts the compiled API service;
- exposes the API port.

Acceptance Criteria:

- API Docker image builds successfully;
- container starts successfully;
- container healthcheck endpoint is reachable.

---

## Task 12 - Create Transcriber Dockerfile

Status:
Completed

Description:
Create Dockerfile for the Transcriber service.

Requirements:

- path: `apps/transcriber/Dockerfile`;
- installs dependencies;
- builds the NestJS application;
- starts the compiled Transcriber service;
- exposes the Transcriber port.

Acceptance Criteria:

- Transcriber Docker image builds successfully;
- container starts successfully;
- container healthcheck endpoint is reachable.

---

## Task 13 - Create Frontend Dockerfile

Status:
Completed

Description:
Create Dockerfile for the frontend service.

Requirements:

- path: `apps/web/Dockerfile`;
- installs dependencies;
- builds the Next.js application;
- starts the production frontend server;
- exposes the frontend port.

Acceptance Criteria:

- frontend Docker image builds successfully;
- container starts successfully;
- frontend root route is reachable;
- frontend healthcheck route is reachable.

---

## Task 14 - Configure PostgreSQL In Docker Compose

Status:
Completed

Description:
Add PostgreSQL service to root `docker-compose.yml`.

Requirements:

- service name: `postgres`;
- persistent named volume;
- configured database name, user, and password through replaceable environment variables;
- exposed local port if needed for development;
- healthcheck verifies readiness.

Acceptance Criteria:

- PostgreSQL starts through docker compose;
- PostgreSQL healthcheck becomes healthy;
- data persists across container recreation through the named volume.

---

## Task 15 - Configure Environment Files And Secret Placeholders

Status:
Completed

Description:
Create environment configuration templates and ensure secrets are easy to replace.

Required files:

```text
.env.example
apps/api/.env.example
apps/transcriber/.env.example
apps/web/.env.example
.gitignore
```

Requirements:

- real `.env` files are ignored by version control;
- `.env.example` files contain all required variable names;
- placeholder values are safe for local development examples and are not production secrets;
- PostgreSQL credentials are represented through variables;
- PostgreSQL connection URL is represented through `DATABASE_URL`;
- service ports are represented through variables;
- API, frontend, and transcriber URLs are represented through variables;
- Kafka broker address is represented through variables;
- changing secrets must not require source code changes.

Minimum root variables:

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
DATABASE_URL
API_PORT
TRANSCRIBER_PORT
WEB_PORT
KAFKA_BROKERS
NEXT_PUBLIC_API_URL
API_INTERNAL_URL
```

Acceptance Criteria:

- root `.env.example` documents all compose-level variables;
- each application `.env.example` documents its runtime variables;
- `.gitignore` excludes real `.env` files while allowing `.env.example`;
- implementation can run with copied local `.env` files;
- secrets can be replaced by editing environment values only.

---

## Task 16 - Configure Apache Kafka In Docker Compose

Status:
Completed

Description:
Add Apache Kafka service to root `docker-compose.yml`.

Requirements:

- service name: `kafka`;
- reachable from API and Transcriber containers;
- local development port is exposed if needed;
- healthcheck verifies broker availability;
- configuration supports future topics `transcription.jobs` and `transcription.results`.

Acceptance Criteria:

- Kafka starts through docker compose;
- Kafka healthcheck becomes healthy;
- API and Transcriber can receive Kafka broker address through environment variables.

---

## Task 17 - Configure Docker Compose For Runtime Services

Status:
Completed

Description:
Create root `docker-compose.yml` orchestration for all runtime services.

Required services:

- `postgres`;
- `kafka`;
- `api`;
- `transcriber`;
- `web`.

Requirements:

- API depends on PostgreSQL and Kafka health;
- Transcriber depends on Kafka health;
- Frontend depends on API health;
- each runtime service receives required environment variables;
- secrets and ports are passed through `${VARIABLE_NAME}` interpolation;
- all services use Docker network names for internal communication.

Acceptance Criteria:

- `docker compose config` succeeds;
- compose config succeeds after copying `.env.example` to `.env`;
- `docker compose up --build` starts all services;
- all service healthchecks become healthy.

---

## Task 18 - Validate Service Healthchecks

Status:
Completed

Description:
Validate healthcheck behavior for all services.

Required checks:

- API healthcheck;
- Transcriber healthcheck;
- Frontend healthcheck;
- PostgreSQL healthcheck;
- Kafka healthcheck.

Acceptance Criteria:

- API healthcheck passes when API is running;
- Transcriber healthcheck passes when Transcriber is running;
- Frontend healthcheck passes only when backend API is reachable;
- PostgreSQL healthcheck reports healthy only after database readiness;
- Kafka healthcheck reports healthy only after broker readiness.

---

## Task 19 - Update Project Tracking Documents

Status:
Completed

Description:
Update project state and progress tracking after implementation.

Required files:

```text
specs/ismart/progress/2026-06-23-0718-phase-01-project-foundation.md
specs/ismart/current-state/current-state.md
```

Acceptance Criteria:

- progress document contains completed task entries;
- Developer progress entries use unchecked `- [ ]` checklist items;
- QA report marks Developer checklist items with `[✓]` or `[✗]`;
- Lead reviews QA status before accepting the phase;
- current state document reflects implemented foundation services;
- task statuses in this file are updated;
- no future phase work is marked as completed.
