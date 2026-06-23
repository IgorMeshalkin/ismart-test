# Phase 02 - Authorization And Registration Tasks

## Status Legend

- `Pending` - not started.
- `In Progress` - implementation started.
- `Completed` - implemented and validated.
- `Blocked` - cannot proceed without clarification or dependency.

---

## Skill Usage

Developer must use relevant local skills from `.agents/skills` when implementing tasks.

For Phase 02, applicable skills are:

- [`new-pg-typeorm`](../../../../.agents/skills/new-pg-typeorm/SKILL.md) for API PostgreSQL and TypeORM setup;
- [`add-module`](../../../../.agents/skills/add-module/SKILL.md) for creating an API auth module when useful;
- [`add-dto`](../../../../.agents/skills/add-dto/SKILL.md) as the DTO style pattern for auth request and response DTOs;
- [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) for auth service methods;
- [`create-endpoint`](../../../../.agents/skills/create-endpoint/SKILL.md) for auth controller endpoints;
- [`create-api-hook`](../../../../.agents/skills/create-api-hook/SKILL.md) for frontend auth API helpers when generated API URL contracts exist.

Skills not applicable to Phase 02 unless the phase is explicitly expanded:

- [`new-nest`](../../../../.agents/skills/new-nest/SKILL.md) because applications already exist;
- [`new-next`](../../../../.agents/skills/new-next/SKILL.md) because the frontend application already exists;
- [`add-entity`](../../../../.agents/skills/add-entity/SKILL.md) because `UserEntity` already exists and no new entity is required;
- [`add-swagger`](../../../../.agents/skills/add-swagger/SKILL.md) because Swagger is not required for the MVP auth flow;
- [`add-api-gen`](../../../../.agents/skills/add-api-gen/SKILL.md) because API generation is not required unless Swagger is added in a later phase.

When a skill conflicts with the approved phase scope, `phase.md`, `tasks.md`, and `specs/ismart/domain-model.md` take precedence.

---

## Task 01 - Configure API Database Access

Status:
Completed

Relevant Skills:

- [`new-pg-typeorm`](../../../../.agents/skills/new-pg-typeorm/SKILL.md)

Description:
Configure the API application to connect to PostgreSQL and use shared TypeORM entities.

Requirements:

- API reads `DATABASE_URL` from environment variables;
- API imports TypeORM module;
- API registers shared entities needed by auth, including `UserEntity`;
- local development may use TypeORM synchronization only if the implementation explicitly treats it as non-production behavior;
- required database dependencies are added to package configuration.

Acceptance Criteria:

- `UserEntity` can be injected through a TypeORM repository in API services;
- API startup fails clearly when database configuration is invalid;
- TypeScript compiles with shared entity imports;
- Transcriber database configuration is not changed.

---

## Task 02 - Add Auth Dependencies And Environment Contract

Status:
Completed

Description:
Add the runtime dependencies and environment examples required for password hashing and JWT issuing.

Required dependencies:

```text
@nestjs/jwt
bcrypt
```

Required development dependency:

```text
@types/bcrypt
```

Required API environment variables:

```text
JWT_SECRET
JWT_EXPIRES_IN
```

Acceptance Criteria:

- dependency manifests include required auth dependencies;
- API `.env.example` documents JWT variables with safe placeholder values;
- no real secrets are committed;
- existing non-auth environment variables remain available.

---

## Task 03 - Create Auth DTOs

Status:
Completed

Relevant Skills:

- [`add-dto`](../../../../.agents/skills/add-dto/SKILL.md)

Description:
Create DTOs for registration, login, and auth responses.

Required DTOs:

```text
RegisterUserDto
LoginDto
AuthResponseDto
AuthUserDto
```

Required registration fields:

```text
firstName: string
lastName: string
email: string
password: string
```

Required login fields:

```text
email: string
password: string
```

Required auth user response fields:

```text
id: string
firstName: string
lastName: string
email: string
role: UserRole
```

Required auth response fields:

```text
accessToken: string
user: AuthUserDto
```

Acceptance Criteria:

- DTO classes are exported;
- DTOs do not expose `passwordHash`;
- request DTOs are typed explicitly;
- response DTO has a mapping path from `UserEntity`;
- DTOs are usable from auth controller and service.

---

## Task 04 - Create Auth Service

Status:
Completed

Relevant Skills:

- [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md)

Description:
Create auth service methods for registration, login, password hashing, password verification, and token issuing.

Required methods:

```text
register(payload: RegisterUserDto): Promise<AuthResponseDto>
login(payload: LoginDto): Promise<AuthResponseDto>
hashPassword(password: string): Promise<string>
verifyPassword(password: string, passwordHash: string): Promise<boolean>
issueAccessToken(user: UserEntity): Promise<string>
```

Behavior:

- normalize email before storage and lookup;
- reject duplicate registration;
- use bcrypt for password hashing and verification;
- use a configurable bcrypt salt rounds value or a clear default;
- create new users with `UserRole.USER`;
- return generic authentication failure for invalid login credentials;
- never return `passwordHash` from public service responses.

Acceptance Criteria:

- registration creates a persisted user;
- login verifies an existing user;
- invalid credentials do not reveal whether email exists;
- service throws clear errors upward for controller handling;
- service has no route-specific concerns.

---

## Task 05 - Create Auth Controller Endpoints

Status:
Completed

Relevant Skills:

- [`create-endpoint`](../../../../.agents/skills/create-endpoint/SKILL.md)

Description:
Create public auth endpoints for registration and login.

Required endpoints:

```text
POST /auth/register
POST /auth/login
```

Controller behavior:

- call the matching auth service method;
- return `AuthResponseDto`;
- handle service errors with readable HTTP exceptions;
- log successful and failed endpoint execution using NestJS `Logger`.

Acceptance Criteria:

- `POST /auth/register` returns access token and public user data;
- `POST /auth/login` returns access token and public user data;
- duplicate registration returns an appropriate client error;
- invalid login returns an appropriate client error;
- raw password and password hash never appear in responses or logs.

---

## Task 06 - Add JWT Request Protection

Status:
Completed

Description:
Create reusable JWT request protection for future API controllers.

Required files or equivalents:

```text
jwt-auth.interceptor.ts
jwt-auth.guard.ts
current-user.decorator.ts
authenticated-request.type.ts
jwt-payload.type.ts
```

JWT payload:

```ts
type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
```

Authenticated request user:

```ts
type RequestUser = {
  id: string;
  email: string;
  role: UserRole;
};
```

Requirements:

- interceptor reads and validates Bearer token;
- interceptor attaches `{ id, email, role }` to `request.user`;
- guard enforces that authenticated request user exists;
- decorator allows controllers to read the authenticated user cleanly;
- protected controllers can later use `@UseGuards(JwtAuthGuard)` and the chosen interceptor composition.

Acceptance Criteria:

- missing token is rejected for protected routes;
- malformed token is rejected for protected routes;
- expired or invalid token is rejected for protected routes;
- protected handler code can read authenticated user id;
- guard contains no endpoint-specific business logic.

---

## Task 07 - Add Protected Auth Smoke Endpoint

Status:
Completed

Relevant Skills:

- [`create-endpoint`](../../../../.agents/skills/create-endpoint/SKILL.md)

Description:
Add a minimal protected endpoint to validate guard, interceptor, and user id propagation.

Recommended endpoint:

```text
GET /auth/me
```

Behavior:

- require JWT authentication;
- return public data for the authenticated user or at least the authenticated request user;
- use the current-user decorator or typed request parameter.

Acceptance Criteria:

- request without token is rejected;
- request with valid token succeeds;
- response proves that controller received authenticated user id;
- endpoint is minimal and does not become an account management feature.

---

## Task 08 - Create Frontend Auth API Helper

Status:
Completed

Relevant Skills:

- [`create-api-hook`](../../../../.agents/skills/create-api-hook/SKILL.md)

Description:
Create frontend API request helpers for registration and login.

Requirements:

- base URL comes from `NEXT_PUBLIC_API_URL`;
- helper exposes registration and login functions;
- helper exposes loading and error state if implemented as a React hook;
- requests send JSON bodies;
- responses are typed;
- API errors are converted to readable messages.

Acceptance Criteria:

- frontend can call `POST /auth/register`;
- frontend can call `POST /auth/login`;
- successful calls return access token and public user data;
- failed calls expose readable errors;
- if generated `apiUrls` contracts are unavailable, the implementation documents the fallback and keeps the helper small.

---

## Task 09 - Create Registration And Login UI

Status:
Completed

Description:
Create frontend registration and login forms.

Required registration fields:

```text
firstName
lastName
email
password
```

Required login fields:

```text
email
password
```

Requirements:

- forms are usable on desktop and mobile;
- inputs have clear labels;
- submit buttons show loading state;
- API errors are visible;
- successful registration and login store auth state and navigate to the authenticated home page.

Acceptance Criteria:

- user can register from the frontend;
- user can log in from the frontend;
- user cannot submit duplicate in-flight requests from the same form;
- failed auth attempts do not clear unrelated form state unexpectedly.

---

## Task 10 - Create Authenticated Home And Logout

Status:
Completed

Description:
Create the minimal frontend home page used to verify login and logout.

Required logged-in message:

```text
You successfully logged in to the application.
```

Requirements:

- unauthenticated users are redirected to login or auth page;
- authenticated users see the success message;
- logout button removes stored token and MVP user data;
- logout returns the user to unauthenticated flow.

Acceptance Criteria:

- successful auth flow reaches the home page;
- refresh keeps the MVP auth state if token storage supports it;
- logout clears auth state;
- after logout, protected home page is no longer shown.

---

## Task 11 - Validate Phase 02

Status:
Completed

Description:
Validate backend and frontend implementation.

Required checks:

```text
npm run typecheck --workspace @ismart/api
npm run typecheck --workspace @ismart/web
```

Recommended manual checks:

```text
POST /auth/register creates user and returns JWT
POST /auth/login returns JWT for valid credentials
GET /auth/me rejects missing token
GET /auth/me accepts valid Bearer token
Frontend registration reaches authenticated home
Frontend login reaches authenticated home
Frontend logout returns to unauthenticated flow
```

Acceptance Criteria:

- API typecheck passes;
- web typecheck passes;
- auth happy path works end to end;
- expected auth failures are handled clearly;
- no Transcriber files are changed.
