---
name: new-next
description: Create a new minimal Next.js application. Use when asked to initialize or scaffold a new Next.js project.
---

# New Next.js Application

When this skill is used, create a new Next.js application according to the following requirements.

## Project Creation

1. Determine the project name from the user's prompt.
2. If the project name is not specified, explicitly ask the user for it.
3. Create a new Next.js application.
4. Use:
   - npm
   - TypeScript
   - App Router
   - SCSS
5. Do not use:
   - Tailwind CSS
   - Pages Router

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8080
```

The application must be started using the `PORT` environment variable.

## Architecture

Use App Router.

Pages and layouts must remain Server Components by default.

Create Client Components only when required:

- useState
- useEffect
- event handlers
- React Query
- browser APIs

Do not add `"use client"` unless required.

Prefer Server Components whenever possible.

## Path Aliases

Configure and use the `@` alias for all internal imports.

Examples:

```ts
import { HomeComponent } from '@/components/test/home.component';
import { useHealthcheck } from '@/hooks/useHealthcheck';
```

## Providers

Create:

```txt
app/providers.tsx
app/layout.tsx
```

using templates:

```txt
resources/providers.tsx
resources/layout.tsx
```

`providers.tsx` must be a Client Component.

`layout.tsx` must remain a Server Component and wrap the application with `<Providers />`.

## Global Styles

Create:

```txt
app/globals.scss
```

using:

```txt
resources/globals.scss
```

## SCSS Mixins

Create:

```txt
styles/_mixins.scss
```

using:

```txt
resources/_mixins.scss
```

## Components

Create:

```txt
components/test/home.component.tsx
components/test/healthcheck.component.tsx
components/test/test.module.scss
```

using:

```txt
resources/test/home.component.tsx
resources/test/healthcheck.component.tsx
resources/test/test.module.scss
```

## Pages and Routing

Create:

```txt
app/page.tsx
```

containing:

```tsx
<HomeComponent appName="<project-name>" />
```

Create:

```txt
app/healthcheck/page.tsx
```

containing:

```tsx
<HealthcheckComponent />
```

After startup:

```txt
http://localhost:3000
```

must render `HomeComponent`.

```txt
http://localhost:3000/healthcheck
```

must render `HealthcheckComponent`.

## Healthcheck

`HealthcheckComponent` must automatically call the healthcheck endpoint when mounted.

The endpoint:

```txt
GET ${process.env.NEXT_PUBLIC_API_URL}/healthcheck
```

must be called through the hook implementation provided by the template resources.

## Project Structure

The final project structure should follow:

```txt
app/
├── healthcheck/
│   └── page.tsx
├── globals.scss
├── layout.tsx
├── page.tsx
└── providers.tsx

components/
└── test/

hooks/

styles/
└── _mixins.scss

public/

.env
package.json
next.config.ts
tsconfig.json
```

Do not create additional top-level directories unless required.

## Validation

Before completion:

1. Ensure the project builds successfully.
2. Ensure `npm run dev` starts successfully.
3. Ensure routes `/` and `/healthcheck` work correctly.
4. Ensure TypeScript has no errors.

## Git

1. Initialize a local Git repository.
2. Create the first commit:

```text
Initialized <project-name> Next.js application.
```

## Rules

- Do not add unnecessary dependencies.
- Do not add Docker.
- Do not add i18n.
- Do not add a state manager.
- Do not add a UI kit.
- Do not add authentication.
- Do not add middleware.
- Use the minimum number of files required.
- Prefer Server Components whenever possible.
