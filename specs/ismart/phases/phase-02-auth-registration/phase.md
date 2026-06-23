# Phase 02 - Authorization And Registration

## 1. Purpose

Implement the first user authentication workflow for iSmart.

This phase adds user registration, login, JWT issuing, reusable request protection, and a minimal frontend flow for checking login and logout behavior.

Email verification is intentionally out of scope and must be implemented in a later phase.

---

## 2. Scope

This phase includes:

- configuring the API database connection for existing shared TypeORM entities;
- creating an API authentication module;
- creating user registration endpoint;
- creating login endpoint;
- hashing user passwords with bcrypt before storage;
- issuing JWT access tokens after successful registration and login;
- creating reusable JWT request protection;
- validating JWT in an interceptor;
- creating a guard that can be attached to selected controllers or routes;
- defining how authenticated user identity is passed from request protection into controllers;
- creating frontend registration form;
- creating frontend login form;
- creating frontend authentication API requests;
- storing the access token on the client for MVP authentication checks;
- creating a protected home page with a successful-login message and logout button.

The Transcriber service is not changed in this phase.

---

## 3. Out Of Scope

This phase does not include:

- email confirmation;
- password reset;
- refresh tokens;
- social login;
- role-based authorization rules beyond storing user role in the JWT payload;
- account management screens;
- production session hardening;
- Transcriber changes;
- file upload, transcription, plans, knowledge bases, or notification workflows.

---

## 4. Backend Requirements

### API Module

Path:

```text
apps/api
```

Technology:

- NestJS;
- TypeScript;
- TypeORM;
- PostgreSQL;
- bcrypt;
- JWT.

The API must connect to PostgreSQL using environment variables.

Required environment variables:

```text
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
FRONTEND_ORIGIN
PORT
```

`JWT_SECRET` must use a safe placeholder in example files only. Real secrets must be provided through local or deployment environment variables.

### Auth Module

Create an authentication module under the API application.

Recommended structure:

```text
apps/api/src/auth
├── auth.controller.ts
├── auth.module.ts
├── auth.service.ts
├── dto
│   ├── auth-response.dto.ts
│   ├── login.dto.ts
│   └── register-user.dto.ts
├── guards
│   └── jwt-auth.guard.ts
├── interceptors
│   └── jwt-auth.interceptor.ts
├── decorators
│   └── current-user.decorator.ts
└── types
    ├── authenticated-request.type.ts
    └── jwt-payload.type.ts
```

The exact file layout may follow existing project conventions if they differ by the time this phase is implemented.

### Registration

Endpoint:

```text
POST /auth/register
```

Request body:

```ts
type RegisterUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
```

Behavior:

- normalize email before checking uniqueness and storage;
- reject registration when a user with the same email already exists;
- hash password with bcrypt;
- store only `passwordHash`, never the raw password;
- create user with `UserRole.USER`;
- issue JWT after successful registration;
- return public user data and access token.

Response body:

```ts
type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
};
```

### Login

Endpoint:

```text
POST /auth/login
```

Request body:

```ts
type LoginRequest = {
  email: string;
  password: string;
};
```

Behavior:

- normalize email before lookup;
- reject unknown email or invalid password with the same generic authentication error;
- compare the submitted password with the stored bcrypt hash;
- issue JWT after successful login;
- return public user data and access token.

### JWT Payload

JWT payload must contain enough identity for later controllers:

```ts
type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
```

`sub` is the authenticated user id.

### JWT Interceptor

Create an interceptor responsible for:

- reading `Authorization: Bearer <token>`;
- verifying JWT;
- attaching authenticated user identity to the request object;
- rejecting missing, malformed, expired, or invalid tokens.

The attached request user shape should be:

```ts
type RequestUser = {
  id: string;
  email: string;
  role: UserRole;
};
```

The interceptor must map JWT `sub` to request user `id`.

### JWT Guard

Create a reusable guard for protected controllers and routes.

The guard must:

- be attachable through `@UseGuards(JwtAuthGuard)`;
- enforce that `request.user` exists after JWT validation;
- avoid embedding route-specific business logic.

Controllers must be able to access the authenticated user id through a decorator or typed request parameter.

Recommended controller usage:

```ts
@UseGuards(JwtAuthGuard)
@UseInterceptors(JwtAuthInterceptor)
@Get('me')
getMe(@CurrentUser() user: RequestUser) {
  return user.id;
}
```

If the implementation chooses a different order or composition, it must keep the same observable behavior: JWT is validated before protected handler logic runs, and the handler can safely read the authenticated user id.

---

## 5. Frontend Requirements

Path:

```text
apps/web
```

Technology:

- Next.js;
- React;
- TypeScript.

### Authentication Requests

Create frontend API calls for:

- registration;
- login.

The API base URL must come from:

```text
NEXT_PUBLIC_API_URL
```

Requests must send JSON bodies and handle readable API error messages.

### Registration Form

Create a registration form with fields:

- first name;
- last name;
- email;
- password.

On successful registration:

- store returned access token;
- store or derive enough public user data for the MVP screen;
- route the user to the authenticated home page.

### Login Form

Create a login form with fields:

- email;
- password.

On successful login:

- store returned access token;
- store or derive enough public user data for the MVP screen;
- route the user to the authenticated home page.

### Authenticated Home Page

Create a minimal page shown after successful authentication.

The page must display:

```text
You successfully logged in to the application.
```

It must also include a logout button.

Logout behavior:

- remove the stored access token;
- remove stored MVP user data if present;
- return the user to the login or auth page.

---

## 6. Skill Usage

Developer must use relevant local skills from `.agents/skills` when implementing this phase.

Applicable skills:

- [`new-pg-typeorm`](../../../../.agents/skills/new-pg-typeorm/SKILL.md) for API PostgreSQL and TypeORM connection setup if it is not already configured;
- [`add-module`](../../../../.agents/skills/add-module/SKILL.md) for creating the API auth module structure when useful;
- [`add-dto`](../../../../.agents/skills/add-dto/SKILL.md) as the DTO creation pattern for auth request and response classes;
- [`create-service-method`](../../../../.agents/skills/create-service-method/SKILL.md) for auth service methods;
- [`create-endpoint`](../../../../.agents/skills/create-endpoint/SKILL.md) for auth controller endpoints;
- [`create-api-hook`](../../../../.agents/skills/create-api-hook/SKILL.md) for frontend auth API request helpers when generated API contracts exist.

Skill adaptation notes:

- Auth request DTOs are not direct entity DTOs, so `add-dto` is used as a style and validation pattern rather than a strict entity-driven workflow.
- If generated frontend API contracts do not exist yet, create the smallest auth request helper consistent with the frontend codebase and document that `create-api-hook` could not be applied strictly.
- When a skill conflicts with this phase specification, this `phase.md` and `tasks.md` take precedence.

---

## 7. Acceptance Criteria

- Transcriber files are unchanged.
- API can create a user through `POST /auth/register`.
- API stores bcrypt password hashes and never stores raw passwords.
- API rejects duplicate email registration.
- API can authenticate a user through `POST /auth/login`.
- API returns a JWT access token after successful registration and login.
- JWT payload includes user id as `sub`, email, and role.
- Protected API handlers can receive authenticated user id after guard/interceptor processing.
- Reusable JWT guard exists and can be attached to future controllers.
- Frontend has registration and login forms.
- Frontend can call registration and login endpoints.
- Frontend stores the access token after successful authentication.
- Frontend displays a successful-login home page.
- Frontend logout removes local auth state and returns the user to the unauthenticated flow.
- API and web typechecks pass after dependencies are installed.
