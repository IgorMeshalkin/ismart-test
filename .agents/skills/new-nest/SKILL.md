---
name: new-nest
description: Create a new NestJS app.
---

## Workflow

1. Determine the project name from the user's prompt.
2. If the project name is not provided, ask the user explicitly for the project name.
3. Create a new NestJS project using the project name from step 1.
4. Ensure the project contains only the required minimum NestJS application files.
5. Create a `.env` file in the project root with:

```env
NODE_ENV=development
PORT=8080
```

6. Use ConfigModule to work with '.env' file.
7. Configure the application to listen on `process.env.PORT`.
8. Ensure `AppController` has a `GET /healthcheck` endpoint.
9. The `GET /healthcheck` endpoint must return:

```text
This is a <project-name>
```

10 Make CORS opened for 'http://localhost:3000'
11. Create scripts: build, start, start:dev in the package.json file. 
12. Check scripts from step 10 work correctly.
13. Initialize a local Git repository.
14. Create the first commit with the message:

```text
Initialized <project-name> NestJS application.
```

## Rules

- Do not add unnecessary dependencies.
- Do not add database, authentication, Docker, Swagger, Redis, Kafka, or configuration modules unless explicitly requested.
- Keep the project minimal.
- Use TypeScript.
- Prefer the default NestJS project structure.
- Do not silently delete files without explicit user confirmation.

## Expected Result

A clean minimal NestJS application that:

- starts on `process.env.PORT`;
- has `.env` with `NODE_ENV=development` and `PORT=8080`;
- exposes `GET /healthcheck`;
- returns `Hello World`;
- has a local Git repository;
- has the initial commit created.
- Scripts build, start, start:dev works correctly.
