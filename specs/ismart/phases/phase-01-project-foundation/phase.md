# Phase 01 - Project Foundation

## 1. Purpose

Create the technical foundation for the iSmart monorepository.

This phase prepares the base applications, shared domain layer, containerization, local infrastructure, and healthcheck contracts required for future feature phases.

No business workflows are implemented in this phase.

---

## 2. Scope

This phase includes:

- creating the base API application on NestJS;
- creating the base Transcriber application on NestJS;
- creating the base Frontend application on Next.js;
- creating Dockerfiles for all runtime applications;
- creating root `docker-compose.yml`;
- configuring PostgreSQL with persistent storage volume;
- configuring Apache Kafka for asynchronous communication;
- adding healthchecks for all services;
- adding a frontend healthcheck that verifies backend availability;
- creating replaceable environment configuration and secret placeholders;
- configuring TypeScript path aliases for shared library imports;
- creating shared TypeORM entity definitions in the common shared library according to `specs/ismart/domain-model.md`.

---

## 3. Target Repository Structure

```text
/apps
├── api
├── transcriber
└── web

/libs
└── shared
    └── src
        ├── dto
        ├── entities
        └── enums

/specs
└── ismart
    ├── agents
    ├── current-state
    ├── phases
    ├── progress
    └── reports
```

---

## 4. Applications

### API

Path:

```text
apps/api
```

Technology:

- NestJS;
- TypeScript.

Responsibilities in this phase:

- start successfully inside and outside Docker;
- expose `GET /healthcheck`;
- read runtime configuration from environment variables;
- be ready for future PostgreSQL and Kafka integration.

Required healthcheck response:

```text
This is a api
```

---

### Transcriber

Path:

```text
apps/transcriber
```

Technology:

- NestJS;
- TypeScript.

Responsibilities in this phase:

- start successfully inside and outside Docker;
- expose `GET /healthcheck`;
- read Kafka connection settings from environment variables;
- remain independent from direct REST calls from API for business processing.

Required healthcheck response:

```text
This is a transcriber
```

---

### Frontend

Path:

```text
apps/web
```

Technology:

- Next.js;
- React;
- TypeScript;
- App Router.

Responsibilities in this phase:

- start successfully inside and outside Docker;
- expose a frontend healthcheck route;
- verify backend availability as part of the frontend healthcheck;
- configure backend URL through environment variables.

The frontend service healthcheck must fail if the API healthcheck is not available.

---

## 5. Shared Domain Layer

Path:

```text
libs/shared
```

The shared library must contain TypeORM entity classes and enum definitions based on:

```text
specs/ismart/domain-model.md
```

The shared definitions are the common runtime ORM contract for future backend modules and must include:

- `BaseEntity`;
- `User`;
- `Plan`;
- `UserPlan`;
- `File`;
- `TranscriptionJob`;
- `KnowledgeBase`;
- `KnowledgeBaseFile`;
- `KnowledgeBaseSubscriber`;
- `Notification`;
- all enums defined in the domain model.

All entity definitions must follow these rules:

- every entity extends or composes `BaseEntity`;
- every persisted entity is implemented as a TypeORM entity class with decorators;
- public identifiers are UUID strings;
- timestamp fields are represented as `Date`;
- object storage keys are computed and not persisted as database fields;
- enum values exactly match the specification;
- relation identifiers use explicit `*Id` fields from the domain model.

---

## 6. TypeScript Path Aliases

Shared library imports must be available from all services through TypeScript path aliases with the `@` prefix.

The implementation must configure root TypeScript paths and make every app extend or consume those settings.

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

Usage examples:

```ts
import { UserEntity } from '@entities';
import { UserEntity } from '@entities/user.entity';
import { UserDto } from '@dto';
import { UserDto } from '@dto/user.dto';
import { UserRole } from '@shared/enums/user-role.enum';
```

Rules:

- services must not import shared entities or DTOs through deep relative paths;
- `@dto` and `@dto/*` are configured in Phase 01 even if concrete DTO files are implemented in a later phase;
- shared barrel files must exist for `@shared`, `@entities`, and `@dto`;
- aliases must work for API, Transcriber, and future NestJS modules;
- frontend internal `@/*` alias may still be used for web app internals, but shared cross-app imports must use shared aliases.

---

## 7. Environment And Secrets

Runtime configuration must be environment-driven and easy to replace between local development, CI, staging, and production.

Required files:

```text
.env.example
apps/api/.env.example
apps/transcriber/.env.example
apps/web/.env.example
```

Rules:

- real `.env` files must not be committed;
- `.env.example` files must contain all required variable names with safe placeholder values;
- secrets must be replaceable by changing environment files or deployment environment variables;
- `docker-compose.yml` must read values through `${VARIABLE_NAME}` interpolation instead of hardcoded secrets;
- local default values may be convenient, but must be clearly non-production placeholders.

Minimum required variables:

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
DATABASE_URL
KAFKA_BROKERS
API_PORT
TRANSCRIBER_PORT
WEB_PORT
NEXT_PUBLIC_API_URL
API_INTERNAL_URL
```

Additional variables may be added if the implementation needs them.

---

## 8. Agent Instructions

This phase must be executed through the agent workflow defined in:

```text
specs/ismart/execution-rules.md
```

Existing agent instruction files used by this phase:

```text
specs/ismart/agents/lead-agent.md
specs/ismart/agents/developer-agent.md
specs/ismart/agents/qa-agent.md
```

Phase ownership:

- Lead Agent owns planning, scope, and final approval;
- Developer Agent owns implementation and validation;
- QA Agent owns independent verification and QA reporting.

Workflow:

1. Developer implements only Phase 01 tasks and writes progress logs with unchecked checklist items.
2. QA checks those progress logs against Phase 01 tasks and marks each checklist item as `[✓]` or `[✗]`.
3. Lead reviews the QA report and accepts the phase only when QA passes.

The phase cannot be accepted until the QA Agent produces a passing QA report with no `[✗]` items and the Lead Agent approves it.
Agent instruction files already exist and are not created as Phase 01 implementation tasks.

---

## 9. Infrastructure

### PostgreSQL

PostgreSQL must be configured in `docker-compose.yml`.

Requirements:

- service name: `postgres`;
- persistent Docker volume for database files;
- healthcheck using PostgreSQL readiness tooling;
- database, user, and password configured through replaceable environment variables.

---

### Apache Kafka

Kafka must be configured in `docker-compose.yml`.

Requirements:

- service name: `kafka`;
- available to API and Transcriber through Docker network;
- healthcheck that verifies broker availability;
- suitable for future topics:
  - `transcription.jobs`;
  - `transcription.results`.

---

## 10. Docker Requirements

Each runtime application must have its own Dockerfile:

```text
apps/api/Dockerfile
apps/transcriber/Dockerfile
apps/web/Dockerfile
```

The root compose file must orchestrate:

- `postgres`;
- `kafka`;
- `api`;
- `transcriber`;
- `web`.

Service startup order must use healthcheck-based dependencies where supported.

---

## 11. Acceptance Criteria

The phase is complete when:

- `apps/api` exists and runs as a minimal NestJS application;
- `apps/transcriber` exists and runs as a minimal NestJS application;
- `apps/web` exists and runs as a minimal Next.js application;
- each application has a Dockerfile;
- root `docker-compose.yml` exists;
- Developer progress format uses unchecked `- [ ]` task checklist items;
- QA report format marks Developer checklist items with `[✓]` or `[✗]`;
- Lead acceptance depends on QA status and checklist results;
- `.env.example` files exist for root and application-level configuration;
- real `.env` files are ignored by version control;
- `docker-compose.yml` receives secrets and runtime values through replaceable environment variables;
- root TypeScript path aliases expose shared entities and future DTOs through `@` imports;
- API, Transcriber, and Web TypeScript configs can resolve shared aliases;
- PostgreSQL runs through docker compose with a persistent volume;
- Kafka runs through docker compose;
- API healthcheck works;
- Transcriber healthcheck works;
- Frontend healthcheck works and verifies API availability;
- shared TypeORM entity and enum definitions exist under `libs/shared`;
- shared entities match `specs/ismart/domain-model.md`;
- all services can be started through docker compose;
- phase task statuses are updated in `tasks.md`;
- implementation progress is documented in `specs/ismart/progress/`.

---

## 12. Out Of Scope

The following items are not part of this phase:

- authentication implementation;
- REST business endpoints;
- database connection setup;
- database migrations;
- Kafka producers or consumers;
- object storage integration;
- transcription provider integration;
- frontend product screens;
- authorization rules;
- payment logic;
- notification delivery logic.
