---
name: add-swagger
description: Add Swagger OpenAPI documentation to an existing NestJS application.
---

# Add NestJS Swagger

When this skill is used, add Swagger OpenAPI documentation to an existing NestJS application.

## Dependencies

Install required dependencies:

```bash
npm i @nestjs/swagger swagger-ui-express
```

## Swagger Setup

Update:

```txt
src/main.ts
```

Import:

```ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
```

Create Swagger configuration after application creation and before `app.listen()`.

Swagger must:

- use `DocumentBuilder`;
- use the project name as the API title;
- set API description;
- set API version;
- enable Bearer Authentication;
- expose Swagger UI at `/api-docs`;
- expose OpenAPI JSON document at `/docs-json`.

## Required Configuration

Use:

```ts
const config = new DocumentBuilder()
  .setTitle('<project-name>')
  .setDescription('<project-name> API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);

SwaggerModule.setup('api-docs', app, document, {
  jsonDocumentUrl: 'docs-json',
});
```

Swagger UI must be available at:

```txt
http://localhost:<PORT>/api-docs
```

OpenAPI JSON must be available at:

```txt
http://localhost:<PORT>/docs-json
```

The JSON endpoint must be suitable for frontend code generation tools such as:

- openapi-typescript
- Orval
- OpenAPI Generator
- Swagger TypeScript API

## Startup Logs

After successful application startup output:

```txt
Docs available at http://localhost:<PORT>/api-docs
OpenAPI JSON available at http://localhost:<PORT>/docs-json
```

Example:

```ts
const port = process.env.PORT || 3000;

await app.listen(port);

console.log(
  `Docs available at http://localhost:${port}/api-docs`,
);

console.log(
  `OpenAPI JSON available at http://localhost:${port}/docs-json`,
);
```

## DTO Decorators

Do not modify DTOs automatically.

Only add Swagger decorators if the user explicitly requests it.

If DTO decorators are requested, use:

```ts
@ApiProperty()
@ApiPropertyOptional()
```

## Validation

Before completion:

1. Ensure dependencies are installed.
2. Ensure `src/main.ts` compiles.
3. Ensure the application starts without errors.
4. Ensure Swagger UI is available at `/api-docs`.
5. Ensure OpenAPI JSON is available at `/docs-json`.
6. Ensure Bearer Authentication appears in Swagger UI.
7. Ensure the JSON document is valid and suitable for frontend code generation.

## Git

Do not create a Git commit unless the user explicitly requests it.

If the user explicitly requests a commit:

1. Verify that the application builds successfully.
2. Add all modified files to Git.
3. Create a commit.

Commit message:

```txt
Added Swagger OpenAPI documentation and JSON schema endpoint.
```

Before creating the commit:

- Ensure there are no TypeScript errors.
- Ensure Swagger UI is available.
- Ensure OpenAPI JSON is available.
- Ensure the application starts successfully.

## Rules

- Use npm.
- Do not change existing routes.
- Do not change existing controllers unless explicitly requested.
- Do not add Swagger decorators to DTOs unless explicitly requested.
- Do not expose Swagger on `/api/docs` unless explicitly requested.
- Keep Swagger setup minimal.
- Do not add additional Swagger plugins unless explicitly requested.
- Do not modify authentication logic.
- Do not modify existing endpoint behavior.
