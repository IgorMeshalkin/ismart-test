---
name: add-module
description: Add one or more empty NestJS modules with controller and service.
---

# Add NestJS Module

When this skill is used, create one or more minimal NestJS modules.

## Module Creation Loop

Repeat the following workflow for each module the user wants to create.

## Module Name

1. Ask the user for the new module name.
2. Convert the module name to:
   - kebab-case directory and file names;
   - PascalCase class names.

Example:

```txt
User Example
```

Should become:

```txt
src/modules/user-example/user-example.module.ts
src/modules/user-example/user-example.controller.ts
src/modules/user-example/user-example.service.ts
src/modules/user-example/user-example.swagger.ts
```

With classes:

```txt
UserExampleModule
UserExampleController
UserExampleService
```

## Controller Path

Ask the user which route path should be used for the controller.

The route path may be an empty string.

Examples:

```txt
users
admin/users
""
```

Use the provided path in the `@Controller()` decorator.

## Files

Create:

```txt
src/modules/<module-name>/<module-name>.module.ts
src/modules/<module-name>/<module-name>.controller.ts
src/modules/<module-name>/<module-name>.service.ts
src/modules/<module-name>/<module-name>.swagger.ts
```

## Swagger Module Decorator

Create a Swagger decorator file:

```txt
src/modules/<module-name>/<module-name>.swagger.ts
```

The file must contain a module-level Swagger tag decorator.

Example:

```ts
import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

export function ApiUsers() {
  return applyDecorators(
    ApiTags('Users'),
  );
}
```

Decorator naming rules:

```txt
users -> ApiUsers
departments -> ApiDepartments
user-example -> ApiUserExample
```

Apply the decorator to the controller.

Example:

```ts
@ApiUsers()
@Controller('users')
export class UsersController {}
```

Rules:

- Create one Swagger tag decorator per module.
- Keep all module Swagger decorators in `<module-name>.swagger.ts`.
- Reuse the existing file if it already exists.
- Do not create multiple Swagger files for the same module.

## Minimal Implementation

Create a minimal module, controller, and service.

Requirements:

- inject the service into the controller;
- register the controller in the module;
- register the service in the module;
- register the module in `AppModule`;
- apply the module Swagger decorator to the controller;
- do not create any methods;
- do not create any endpoints.

## Entity Repositories

Ask the user whether repositories for existing entities should be injected into the service.

If yes:

1. Find all existing entity files.
2. Show the user a numbered list of entities.

Example:

```txt
1. User
2. Department
3. Project
```

3. Ask the user to enter, separated by commas, the numbers of the entities whose repositories should be injected.

For selected entities:

- import `TypeOrmModule.forFeature([...])` in the new module;
- inject repositories into the service using `@InjectRepository`;
- use `Repository<EntityName>` types;
- do not create service methods.

## Continue Or Finish

After creating the module, ask the user whether they want to create another module.

If yes, return to the Module Name step.

If no, finish the session.

## Validation

Before completion:

1. Ensure all created files compile.
2. Ensure module, controller, and service class names are correct.
3. Ensure the service is injected into the controller.
4. Ensure the controller and service are registered in the module.
5. Ensure the module is registered in `AppModule`.
6. Ensure repository injection is configured correctly if selected.
7. Ensure the Swagger file exists.
8. Ensure the Swagger decorator is exported.
9. Ensure the Swagger decorator is applied to the controller.
10. Ensure no endpoints or business methods were created.
11. Ensure imports are correct.

## Rules

- Do not create DTOs.
- Do not create entities.
- Do not create migrations.
- Do not create endpoints.
- Do not create service methods.
- Do not add business logic.
- Create a module-level Swagger decorator in `<module-name>.swagger.ts`.
- Apply the module Swagger decorator to the controller.
- Keep implementation empty and minimal.
- Use existing project naming style.
