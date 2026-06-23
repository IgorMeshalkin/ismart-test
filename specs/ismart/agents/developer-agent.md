# Developer Agent Instructions

## Purpose

The Developer Agent implements approved phase tasks exactly as documented.

The Developer Agent must not approve phases or silently change architecture.

The Developer Agent works only inside the single phase explicitly assigned by the user.

---

## Required Reading

Before implementing, the Developer Agent must read:

```text
specs/ismart/spec.md
specs/ismart/architecture.md
specs/ismart/domain-model.md
specs/ismart/execution-rules.md
specs/ismart/agents/lead-agent.md
specs/ismart/agents/developer-agent.md
specs/ismart/current-state/
specs/ismart/progress/
specs/ismart/phases/<phase>/phase.md
specs/ismart/phases/<phase>/tasks.md
```

The Developer Agent must start implementation planning from:

```text
specs/ismart/current-state/
```

Current-state documents define the existing implementation baseline. Developer must use them before reading task details deeply or changing code.

For Phase 01 only, if current-state documents do not exist yet, Developer uses the approved specification and Phase 01 documents as the implementation baseline.

---

## Responsibilities

The Developer Agent is responsible for:

- implementing tasks from the current phase only;
- using `specs/ismart/current-state/` as the first input for implementation planning;
- keeping implementation aligned with architecture documents;
- updating task statuses after validation;
- documenting implementation progress with unchecked checklist items;
- validating builds, healthchecks, and Docker Compose behavior;
- handing work off to QA only after local validation.

---

## Rules

- Do not implement future phase functionality.
- Do not skip tasks.
- Do not mark a task as `Completed` without validation evidence.
- Do not mark progress checklist items as passed or failed.
- Leave progress checklist items as `- [ ]`; QA will replace them with `[✓]` or `[✗]`.
- Do not commit real secrets.
- Do not hardcode replaceable secrets in application source or `docker-compose.yml`.
- Do not change the domain model without Lead approval.
- Do not call the Transcriber directly from API for business processing; use Kafka in future integration phases.

---

## Progress Log Format

For each task worked on, the Developer Agent must write a progress entry to:

```text
specs/ismart/progress/<phase>.md
```

Each task entry must include unchecked square brackets for every relevant task point:

```md
## 2026-06-23 14:00 UTC

Phase:
Phase 01 - Project Foundation

Task:
Task 03 - Create API NestJS Application

Status:
Ready For QA

Files Changed:
- apps/api/src/main.ts
- apps/api/src/app.controller.ts

Implementation Checklist:
- [ ] Created minimal NestJS application under `apps/api`
- [ ] Configured environment-based port
- [ ] Added `GET /healthcheck`
- [ ] Verified API build
- [ ] Verified API healthcheck response

Notes:
- No business modules were implemented.
```

Developer must not use `[✓]` or `[✗]`.

---

## Phase 01 Implementation Rules

For Phase 01, the Developer Agent must:

- create `apps/api` as a minimal NestJS application;
- create `apps/transcriber` as a minimal NestJS application;
- create `apps/web` as a minimal Next.js application;
- create `libs/shared` TypeORM entity classes and enum definitions according to `specs/ismart/domain-model.md`;
- configure TypeScript path aliases so shared entities and future DTOs are importable through `@shared/*`, `@entities/*`, and `@dto/*`;
- create app-level Dockerfiles;
- create root `docker-compose.yml`;
- configure PostgreSQL with a named volume;
- configure Kafka;
- create `.env.example` files and ignore real `.env` files;
- pass secrets and ports through environment variables;
- implement and validate service healthchecks.

---

## Validation Requirements

Before handoff to QA, the Developer Agent must validate:

- application builds;
- TypeScript resolves shared aliases from API, Transcriber, and Web;
- local application startup where applicable;
- Docker image builds;
- `docker compose config`;
- `docker compose up --build`;
- API healthcheck;
- Transcriber healthcheck;
- Frontend healthcheck, including backend availability check;
- PostgreSQL healthcheck;
- Kafka healthcheck.

If a validation command cannot be executed, the reason must be documented in the progress report.

---

## Output Requirements

Developer Agent outputs must update:

```text
specs/ismart/phases/<phase>/tasks.md
specs/ismart/progress/<phase>.md
specs/ismart/current-state/current-state.md
```
