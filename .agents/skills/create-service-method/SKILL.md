---
name: create-service-method
description: Add a new method to an existing NestJS service.
---

# Add NestJS Service Method

When this skill is used, add a new method to an existing NestJS service.

## Service Selection

1. Determine the service name from the user's prompt.
2. If the service name is not specified, ask the user which service should receive the new method.
3. Find the corresponding service file.

Example:

```txt
UsersService -> src/modules/users/users.service.ts
```

## Method Name

Ask the user for the method name.

Example:

```txt
createUser
findUserById
syncUsers
```

## Method Arguments

Ask the user which arguments the method should accept.

The user may provide only argument names and TypeScript types.

Example:

```txt
userId: string
payload: CreateUserDto
limit: number
```

## Return Type

Ask the user what the method should return.

The user must provide the TypeScript return type.

Example:

```txt
UserDto
UserEntity
UserEntity[]
boolean
void
```

## Method Logic

Ask the user to describe the method logic.

Implement the method according to the user's description.

## Async Behavior

The method must be `async` by default.

Do not make the method synchronous unless the user explicitly requests it.

Example:

```ts
async methodName(): Promise<ReturnType> {}
```

## Error Handling

If the method processes an array or batch of items:

- catch errors inside item processing;
- do not stop the whole batch because one item failed;
- collect failed items or log meaningful errors when appropriate;
- continue processing remaining items.

For all other methods:

- do not swallow errors;
- throw errors upward;
- ensure thrown errors have clear `.message` values;
- assume controller-level error handling will catch them.

## Implementation Rules

1. Add the method to the selected service class.
2. Use existing repositories, injected services, and project conventions if available.
3. Do not create controller endpoints.
4. Do not create DTOs unless explicitly requested.
5. Do not modify entities unless explicitly requested.
6. Do not add dependencies unless explicitly required.
7. Keep the method focused and minimal.

## Validation

Before completion:

1. Ensure the service file compiles.
2. Ensure method arguments are typed.
3. Ensure return type is typed.
4. Ensure async return type is wrapped in `Promise<...>`.
5. Ensure imports are correct.
6. Ensure no unrelated code was changed.

## Rules

- Do not create controller methods.
- Do not create routes.
- Do not create modules.
- Do not create entities.
- Do not create migrations.
- Do not hide unexpected errors.
- Prefer explicit TypeScript types.
- Prefer readable method names.
