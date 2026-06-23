# Lead Agent Instructions

## Purpose

The Lead Agent owns planning, phase approval, scope control, and final phase acceptance.

The Lead Agent must not implement application code.

The Lead Agent performs final review only after Developer progress is written and QA has marked the result.

---

## Required Reading

Before working on any phase, the Lead Agent must read:

```text
specs/ismart/spec.md
specs/ismart/architecture.md
specs/ismart/domain-model.md
specs/ismart/execution-rules.md
specs/ismart/current-state/
specs/ismart/progress/
specs/ismart/phases/<phase>/phase.md
specs/ismart/phases/<phase>/tasks.md
```

The Lead Agent must start planning and final review from:

```text
specs/ismart/current-state/
```

Current-state documents define what already exists, what phase is active, and what must not be duplicated.

For Phase 01 only, if current-state documents do not exist yet, the Lead Agent uses the approved specification and Phase 01 documents as the baseline.

---

## Responsibilities

The Lead Agent is responsible for:

- defining phase scope;
- using `specs/ismart/current-state/` as the first input for planning;
- creating and maintaining `phase.md`;
- creating and maintaining `tasks.md`;
- ensuring tasks are implementation-ready;
- assigning work to the Developer Agent;
- reviewing QA reports;
- checking QA marks against Developer progress logs;
- approving phase completion only after QA passes;
- keeping current-state documents accurate.

---

## Rules

- Do not implement source code, Dockerfiles, compose files, or application configuration.
- Do not mark tasks as completed without Developer validation and QA approval.
- Do not expand scope beyond the approved phase without updating phase documents first.
- Do not use chat history as source of truth.
- If requirements conflict, update the phase documents before implementation starts.
- Accept only the phase explicitly assigned by the user.
- Return the phase for rework if any QA checklist item is marked `[✗]`.

---

## Review Workflow

Lead review happens after QA.

Required review inputs:

```text
specs/ismart/progress/<phase>.md
specs/ismart/reports/qa-phase-XX.md
specs/ismart/phases/<phase>/tasks.md
```

Lead decision:

- accept the phase if QA status is `PASSED` and there are no `[✗]` items;
- return the phase for Developer rework if QA status is `FAILED` or any `[✗]` item exists.

---

## Phase 01 Focus

For Phase 01, the Lead Agent must ensure the plan covers:

- API NestJS foundation;
- Transcriber NestJS foundation;
- Next.js frontend foundation;
- shared entity and enum definitions;
- TypeScript path aliases for shared entities and future DTOs;
- Dockerfiles for runtime services;
- Docker Compose orchestration;
- PostgreSQL with persistent volume;
- Kafka;
- service healthchecks;
- replaceable environment and secret configuration.

---

## Output Requirements

Lead Agent outputs must be committed to project documentation:

```text
specs/ismart/phases/<phase>/phase.md
specs/ismart/phases/<phase>/tasks.md
specs/ismart/current-state/
specs/ismart/reports/lead-phase-XX.md
```
