---
name: create-endpoint
description: Add a new endpoint to an existing NestJS controller.
---

# Add NestJS Controller Endpoint

When this skill is used, add a new endpoint to an existing NestJS controller.

## Controller Selection

1. Determine the controller name from the user's prompt.
2. If the controller name is not specified, ask the user which controller should receive the new endpoint.
3. Find the corresponding controller file.

Example:

```txt
UsersController -> src/modules/users/users.controller.ts
```

## Endpoint Name

Ask the user for the endpoint method name.

Example:

```txt
createUser
getUserById
getUsersList
```

## Endpoint Path

Ask the user for the endpoint path.

Example:

```txt
""
":id"
"list"
":id/profile"
```

If the path contains path variables, add them to the method signature using `@Param()`.

Example:

```ts
@Get(':id')
async getUserById(@Param('id') id: string) {}
```

## HTTP Method

Ask the user which HTTP method the endpoint should use.

Supported methods:

- GET
- POST
- PUT
- PATCH
- DELETE

Use the matching NestJS decorator:

```ts
@Get()
@Post()
@Put()
@Patch()
@Delete()
```

## Request Body

If the HTTP method is `POST`, `PUT`, or `PATCH`, ask whether the endpoint should accept a request body.

If yes, ask which DTO should be used as the body type.

Example:

```ts
@Post()
async createUser(@Body() dto: CreateUserDto) {}
```

Do not add `@Body()` for `GET` endpoints unless the user explicitly requests it.

## Query Parameters

Ask the user which query parameters the endpoint should accept.

If query parameters are provided, add them to the method signature using `@Query()`.

Example:

```ts
@Get()
async getUsers(@Query('limit') limit: string) {}
```

If no query parameters are needed, do not add `@Query()`.

## Path Parameters

If the endpoint path includes variables, add all of them to the method signature.

Example:

```txt
:id/orders/:orderId
```

Should become:

```ts
@Param('id') id: string,
@Param('orderId') orderId: string,
```

## Response DTO

Ask the user which DTO the endpoint should return.

Use the provided DTO as the method return type.

Example:

```ts
Promise<UserDto>
Promise<UserDto[]>
Promise<void>
```

If the service returns an Entity or an array of Entities, use DTO `fromEntity()` methods to transform entities into DTOs.

Examples:

```ts
return UserDto.fromEntity(user);
```

```ts
return users.map(UserDto.fromEntity);
```

## Endpoint Logic

Ask the user to describe the endpoint logic.

The description should include:

- which service methods should be called;
- which arguments should be passed;
- how the result should be transformed;
- what should be returned to the client.

Use already injected services when available.

If the required service is not injected into the controller, inject it using the existing project style.

## Error Handling

Wrap the endpoint logic in `try/catch`.

Services must throw errors upward.

Controller endpoints must catch all errors and return a readable error message to the client.

Use the error `.message` when available.

Example:

```ts
try {
  const user = await this.usersService.getUserById(id);

  return UserDto.fromEntity(user);
} catch (error) {
  throw new BadRequestException(
    error instanceof Error ? error.message : 'Unexpected error',
  );
}
```

Use an appropriate NestJS HTTP exception.

Default to `BadRequestException` unless the user specifies another status or the endpoint logic clearly requires another exception type.

## Logging

Every endpoint must log both successful and failed execution.

Use NestJS `Logger`.

Create:

```ts
private readonly logger = new Logger(UsersController.name);
```

if the controller does not already have a logger.

### Successful Operations

Log successful execution with as much useful context as possible.

Examples:

```ts
this.logger.log(
  `Successfully found user with id ${id}`,
);
```

```ts
this.logger.log(
  `Successfully created user with id ${user.id}`,
);
```

```ts
this.logger.log(
  `Successfully updated user with id ${id}`,
);
```

```ts
this.logger.log(
  `Successfully deleted user with id ${id}`,
);
```

```ts
this.logger.log(
  `Successfully found ${users.length} users`,
);
```

```ts
this.logger.log(
  `Successfully processed ${items.length} items`,
);
```

### Failed Operations

Log failures before throwing HTTP exceptions.

Examples:

```ts
this.logger.error(
  `Failed to find user with id ${id}: ${error.message}`,
);
```

```ts
this.logger.error(
  `Failed to update user with id ${id}: ${error.message}`,
);
```

```ts
this.logger.error(
  `Failed to retrieve users: ${error.message}`,
);
```

```ts
this.logger.error(
  `Failed to process ${items.length} items: ${error.message}`,
);
```

### Logging Rules

- Always log both success and failure.
- Include identifiers whenever available.
- Include item counts for collection operations.
- Include filter parameters when useful.
- Include request context whenever available.
- Include the original error message.
- Log before throwing exceptions.
- Use readable business-oriented messages.
- Prefer entity names over generic wording.

## Swagger

If Swagger is installed, add endpoint documentation decorators when appropriate.

Do not install Swagger from this skill.

Do not add Swagger setup from this skill.

## Custom Swagger Decorator

For each new endpoint, create or update a module-level Swagger decorators file.

Find the folder where the controller is located.

Example:

```txt
src/modules/users/users.controller.ts
```

Create or update:

```txt
src/modules/users/users.swagger.ts
```

The Swagger file must contain a custom decorator for the new endpoint.

The decorator name must be based on the endpoint method name.

Example:

```ts
async getUserById(...) {}
```

Should use:

```ts
@ApiGetUserById()
async getUserById(...) {}
```

The decorator must be implemented with `applyDecorators`.

Example:

```ts
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiGetUserById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user by id' }),
    ApiParam({ name: 'id', type: String }),
    ApiResponse({
      status: 200,
      description: 'User found successfully.',
      type: UserDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Failed to find user.',
    }),
  );
}
```

Apply this custom decorator to the endpoint in the controller.

Example:

```ts
@ApiGetUserById()
@Get(':id')
async getUserById(@Param('id') id: string): Promise<UserDto> {
  // endpoint logic
}
```

Rules:

- Do not place Swagger decorators directly on the endpoint if a custom decorator is created.
- Put endpoint Swagger documentation into `<module-name>.swagger.ts`.
- Use one custom Swagger decorator per endpoint.
- Reuse existing `<module-name>.swagger.ts` if it already exists.
- Do not create multiple Swagger files for the same module.
- Import and apply the custom Swagger decorator in the controller.
- The decorator must describe request params, query params, body, response DTO, success response, and failure response when applicable.

## Validation

Before completion:

1. Ensure the controller file compiles.
2. Ensure all imports are correct.
3. Ensure the HTTP method decorator is correct.
4. Ensure path params are included in the method signature.
5. Ensure query params are included when requested.
6. Ensure body DTO is included when requested.
7. Ensure the return type is explicit.
8. Ensure DTO `fromEntity()` is used when returning DTOs from Entities.
9. Ensure logic is wrapped in `try/catch`.
10. Ensure errors are converted to readable HTTP exceptions.
11. Ensure success and failure logging is implemented.
12. Ensure a custom Swagger decorator was created or updated in `<module-name>.swagger.ts`.
13. Ensure the custom Swagger decorator is applied to the endpoint.
14. Ensure no unrelated files were changed.

## Rules

- Do not create services.
- Do not create service methods unless explicitly requested.
- Do not create DTOs.
- Do not create entities.
- Do not create migrations.
- Do not install dependencies.
- Keep endpoint logic thin.
- Put business logic in services, not controllers.
- Controllers must catch service errors and return readable messages.
- Controllers must log both successful and failed operations.
- Services must throw errors upward.
- Keep Swagger endpoint documentation in module-level `.swagger.ts` files.
- Use custom Swagger decorators instead of inline Swagger decorators on controller methods.
- Use existing project naming style.
