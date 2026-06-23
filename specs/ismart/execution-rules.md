# AI Development Process

## 1. Purpose

This document defines the workflow for AI-driven development.

The project is developed using a phase-based specification process.

Implementation is performed by specialized agents:

- Lead Agent
- Developer Agent
- QA Agent

All work must be traceable through project documentation.

Chat history must never be considered a source of truth.

The repository itself must contain the complete implementation history and current project state.

---

## 2. Source Of Truth

Before performing any work, every agent must read:

```text
/specs/ismart/spec.md
/specs/ismart/architecture.md
/specs/ismart/domain-model.md
/specs/ismart/agents/
/specs/ismart/current-state/
/specs/ismart/progress/
```

Additionally, agents must read the current phase documents:

```text
/specs/ismart/phases/<phase>/phase.md
/specs/ismart/phases/<phase>/tasks.md
```

Planning and validation entry points:

- Lead Agent must start planning and review from `/specs/ismart/current-state/`.
- Developer Agent must start implementation planning from `/specs/ismart/current-state/`.
- QA Agent must start validation from `/specs/ismart/progress/`.

Phase 01 exception:

If `/specs/ismart/current-state/` and `/specs/ismart/progress/` do not yet contain project state files, agents use the approved specification documents directly as the baseline.
This exception applies only before Phase 01 implementation creates the initial tracking documents.

---

## 3. Shared DTO And Message Contract Rules

All external application boundaries must use explicit DTO contracts.

### REST Endpoint DTO Rules

Every REST endpoint that accepts a request body must have a dedicated body DTO for that endpoint action.

Examples:

```text
POST /auth/register -> CreateUserDto or RegisterUserDto
POST /auth/login -> LoginDto
POST /files -> CreateFileDto
PATCH /files/:id -> UpdateFileDto
```

Rules:

- do not type endpoint request bodies inline in controller method signatures;
- do not reuse a body DTO for a different endpoint action unless the business action and validation contract are intentionally the same;
- name body DTOs by action, not only by entity;
- keep body DTOs separate from persistence entities;
- body DTOs must not expose internal fields such as `passwordHash`, database-only relation objects, or computed storage internals.

Every REST endpoint must also declare a response DTO.

Response DTO rules:

- response DTOs describe the object returned to API clients;
- response DTOs may be reused by many endpoints when the returned public object contract is the same;
- response DTOs must not expose internal-only fields;
- entity instances returned from services must be mapped to response DTOs before leaving the controller boundary.

Shared DTO files must be created under:

```text
libs/shared/src/dto
```

DTOs must be exported through shared DTO barrel files and be importable through:

```text
@dto
@dto/*
@shared/*
```

### Kafka Message DTO Rules

Every Kafka producer or consumer action must use an explicit message DTO.

Rules:

- create a dedicated DTO for each Kafka action, command, event, or result message;
- reuse a Kafka DTO only when the message semantics and schema are intentionally identical;
- do not publish ad hoc object literals as long-term Kafka contracts;
- Kafka DTOs must contain only serializable data;
- Kafka DTOs must not contain binary payloads;
- Kafka DTO names must reflect the action or event they represent.

Examples:

```text
CreateTranscriptionJobMessageDto
TranscriptionCompletedMessageDto
TranscriptionFailedMessageDto
NotifyUserMessageDto
```

When REST DTOs and Kafka DTOs look similar, they must still remain separate unless they represent the same boundary contract. REST API client contracts and asynchronous internal message contracts may evolve independently.

---

## 4. Project Workflow

Development follows strict phase ordering.

```text
Lead
    ↓
Developer
    ↓
QA
    ↓
Lead
```

A phase may only be considered completed after QA approval.

No phase may begin until the previous phase has been accepted.

The active phase is the single phase explicitly assigned by the user. Developer and QA agents must not work outside that phase.

Workflow artifacts are produced in this order:

1. Developer writes an implementation progress log with unchecked task checklist items.
2. QA verifies the Developer log against the current phase tasks and marks each checklist item as passed or failed.
3. Lead reviews the QA result and accepts the phase or returns it for rework.

---

## 5. Lead Agent Responsibilities

The Lead Agent is responsible for:

- planning phases;
- using current-state documents as the first input for planning;
- maintaining specifications;
- assigning work;
- reviewing QA results;
- approving phase completion;
- maintaining current project state.

The Lead Agent must never directly implement features.

---

## 6. Developer Agent Responsibilities

The Developer Agent is responsible for:

- implementing tasks;
- using current-state documents as the first input for implementation planning;
- updating task status;
- documenting implementation results in a progress log;
- validating completed work before handing off to QA.

The Developer Agent must not:

- skip tasks;
- change architecture without approval;
- modify future phases;
- mark work as completed without validation.

The Developer Agent must write progress entries with unchecked square brackets for each implemented or validated point:

```md
- [ ] Created `apps/api`
- [ ] Verified API build
- [ ] Verified API healthcheck
```

Developer must leave these boxes empty. QA is responsible for marking pass or fail.

---

## 7. QA Agent Responsibilities

The QA Agent is responsible for:

- using progress documents as the first input for validation;
- validating completed tasks;
- validating acceptance criteria;
- validating architectural compliance;
- validating business rules;
- marking Developer progress checklist items as passed or failed;
- identifying bugs and edge cases;
- producing QA reports.

The QA Agent must not implement features.

QA must use the square brackets from the Developer progress log:

```md
- [✓] Verified API build
- [✗] Verified frontend healthcheck
```

`[✓]` means the item passed QA validation.
`[✗]` means the item failed QA validation.

---

## 8. Progress Tracking

All implementation activity must be documented.

The following directory is mandatory:

```text
/specs/ismart/progress/
```

This directory contains implementation history split by phases.

---

## 9. Developer Progress Entry Format

Every completed task must generate a progress entry in the current phase progress document.

Example:

```md
## 2026-06-23 14:00 UTC

Phase:
Phase 01 - Project Foundation

Task:
Create User Entity

Status:
Ready For QA

Files Changed:
- apps/api/src/users/user.entity.ts

Implementation Checklist:
- [ ] Entity file created
- [ ] Entity fields match domain model
- [ ] Build command completed successfully

Notes:
- Email uniqueness constraint added
```

Developer must not replace `[ ]` with `[✓]` or `[✗]`.
Only QA marks checklist results.

---

## 10. QA Checklist Marking Format

QA must create a report for the current phase and copy or reference Developer checklist items using these markers:

```md
- [✓] Passed item
- [✗] Failed item
```

Each failed item must include a finding with:

- related task;
- failed criterion;
- evidence;
- required rework.

---

## 11. Current State Tracking

The current state of the system must always be maintained.

Directory:

```text
/specs/ismart/current-state/
```

This directory contains current project state documents.

Current state documents must contain only the current project state.

Historical information must not be stored here.

Example:

```md
# Current State

Completed Phases

- Phase 01 - Foundation

Current Phase

- Phase 02 - Authentication

Implemented Modules

- Users
- Plans

Pending Modules

- Files
- Knowledge Bases
- Notifications
```

---

## 12. Phase Lifecycle

Each phase follows the same lifecycle.

### Step 1

Lead approves the phase.

### Step 2

Developer implements tasks.

### Step 3

Developer updates:

```text
/specs/ismart/progress/YYYY-MM-DD-HHMM-<phase>.md
/specs/ismart/phases/<phase>/tasks.md
/specs/ismart/current-state/
```

Developer progress entries must use unchecked `- [ ]` checklist items.

### Step 4

Developer requests QA review.

### Step 5

QA validates implementation.

QA creates:

```text
/specs/ismart/reports/YYYY-MM-DD-HHMM-qa-phase-XX.md
```

QA marks Developer checklist items with `[✓]` or `[✗]`.

### Step 6

Lead reviews QA report.

### Step 7

Phase is approved or returned for rework.

---

## 13. Validation Requirements

A task may be marked completed only if:

- implementation exists;
- project builds successfully;
- tests pass (if applicable);
- validation commands succeed.

A phase may be marked completed only if:

- all tasks are completed;
- QA report status is PASSED;
- current-state documents are updated.

---

## 14. Architectural Discipline

Agents must not:

- introduce new libraries without justification;
- change database structure outside approved phases;
- modify specifications without Lead approval;
- implement functionality from future phases;
- silently remove existing functionality.

All architectural decisions must be documented.

---

## 15. Deliverables

Every completed phase must produce:

```text
Updated implementation
Updated tasks.md
Updated progress documents
Updated current-state documents
QA report
```

A phase is not complete until all deliverables exist.

---

## 16. Bug Fix Workflow

Bugs are tracked in `/specs/ismart/bugs/` and follow the same agent workflow as phases.

### Bug Fix Lifecycle

#### Step 1

A bug report is created under:

```text
/specs/ismart/bugs/<bug-slug>.md
```

The bug report must contain: status, summary, error, observed behavior, expected behavior, and notes for the fix.

#### Step 2

Developer investigates and implements the fix.

#### Step 3

Developer creates a progress entry for the bug fix:

```text
/specs/ismart/progress/YYYY-MM-DD-HHMM-bug-<bug-slug>.md
```

The bug progress entry format must follow the same structure as phase progress entries.

Example:

```md
## 2026-06-23 14:00 UTC

Bug:
api-runtime-cannot-find-entities-after-phase-02

Status:
Ready For QA

Files Changed:
- apps/api/package.json

Implementation Checklist:
- [ ] Identified root cause
- [ ] Applied fix
- [ ] Verified API starts successfully
- [ ] Verified API runtime resolves shared aliases
```

Developer must leave checklist boxes empty. QA is responsible for marking pass or fail.

#### Step 4

Developer updates the bug report status to `Ready For QA`.

#### Step 5

QA validates the fix and creates a QA report:

```text
/specs/ismart/reports/YYYY-MM-DD-HHMM-qa-bug-<bug-slug>.md
```

QA marks Developer checklist items with `[✓]` or `[✗]`.

#### Step 6

If QA passes, Developer:

- updates the bug report status to `Resolved`;
- updates `/specs/ismart/current-state/current-state.md` if the fix affects the described runtime state.

If QA fails, the fix is returned for rework.

### Bug Fix Rules

- A bug fix must not introduce new functionality beyond the fix scope.
- A bug fix must not modify future phases or other bug reports.
- The progress file and QA report are mandatory even for small fixes.
- current-state must be updated if the fix changes the observable runtime behavior described there.

---

## 17. Progress And Report File Naming Convention

All progress and report files must be named with a date-time prefix so they sort in chronological order.

### Format

```text
YYYY-MM-DD-HHMM-<slug>.md
```

- `YYYY-MM-DD` — UTC date when the file was created.
- `HHMM` — UTC time (hours and minutes, no separator) when the file was created.
- `<slug>` — descriptive slug identifying the phase, bug, or report type.

### Examples

```text
specs/ismart/progress/2026-06-23-0718-phase-01-project-foundation.md
specs/ismart/progress/2026-06-23-0805-phase-02-auth-registration.md
specs/ismart/progress/2026-06-23-0824-bug-api-runtime-cannot-find-entities-after-phase-02.md

specs/ismart/reports/2026-06-23-0720-qa-phase-01.md
specs/ismart/reports/2026-06-23-0728-lead-phase-01.md
specs/ismart/reports/2026-06-23-0830-qa-bug-api-runtime-cannot-find-entities-after-phase-02.md
```

### Rules

- The date-time prefix must match the UTC timestamp of the first entry in the file.
- Never omit the prefix. Files without a prefix violate this convention.
- When two files are created within the same minute, append a sequential suffix: `HHMM-1-<slug>.md`, `HHMM-2-<slug>.md`.
- Do not rename existing files unless explicitly migrating to this convention.
