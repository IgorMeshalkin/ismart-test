---
name: add-dto
description: Add one or more shared DTO classes for existing TypeORM entities.
---

# Add Shared DTO

When this skill is used, add one or more DTO classes for existing TypeORM entities to the shared project library.

DTO files must live under:

```txt
libs/shared/src/dto
```

Do not create DTO files inside an application-level `src/dto` directory unless the user explicitly overrides this project rule.

## Entity Selection

1. Find all existing entity files.
2. Show the user a numbered list of entities.

Example:

```txt
1. User
2. Department
3. Project
```

3. Ask the user to enter the number of the entity for which the DTO should be created.

## DTO File

Create a DTO file if it does not already exist:

```txt
libs/shared/src/dto/<entity-name>.dto.ts
```

Use the entity name without the `Entity` suffix.

Example:

```txt
UserEntity -> libs/shared/src/dto/user.dto.ts
DepartmentEntity -> libs/shared/src/dto/department.dto.ts
```

All DTO classes for the same entity must be placed in the same DTO file.

## DTO Name

Ask the user for the new DTO class name.

Example:

```txt
UserDto
UserShortDto
UserListItemDto
UserDetailsDto
```

## Entity Fields

1. Show the user all entity fields as a numbered list.

Example:

```txt
1. id
2. name
3. createdAt
4. updatedAt
```

2. Ask the user to enter, separated by commas, the numbers of the fields that should be included in the DTO.

## Custom Fields

1. Ask the user whether the DTO should contain custom fields that do not exist in the entity.
2. If yes, ask the user to provide custom field names and TypeScript types.

Example:

```txt
ordersCount: number
fullName: string
isOnline: boolean
```

## DTO Class

Create a new class in the DTO file.

The class must include:

- selected entity fields;
- custom fields, if provided;
- Swagger decorators for every field;
- static `fromEntity` method.

Example:

```ts
export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  ordersCount: number;

  static fromEntity(entity: UserEntity): UserDto {
    const dto = new UserDto();

    dto.id = entity.id;
    dto.name = entity.name;

    // TODO: Implement ordersCount mapping.
    dto.ordersCount = undefined as unknown as number;

    return dto;
  }
}
```

## fromEntity Method

The DTO class must contain:

```ts
static fromEntity(entity: Entity): ThisDTO {}
```

Rules:

- map selected entity fields directly from `entity`;
- add `// TODO` comments for custom fields;
- do not invent logic for custom fields;
- return the created DTO instance.

## Swagger Decorators

Add Swagger decorators to all DTO fields.

Use:

```ts
@ApiProperty()
@ApiPropertyOptional()
```

Choose the decorator based on whether the field is required or optional.

Import decorators from:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
```

## Repeat Flow

After creating the DTO, ask the user whether they want to add another DTO.

If yes, return to the Entity Selection step.

If no, finish the session.

## Validation

Before completion:

1. Ensure the DTO file exists.
2. Ensure the new DTO class is exported.
3. Ensure all selected entity fields are included.
4. Ensure all custom fields are included.
5. Ensure every DTO field has a Swagger decorator.
6. Ensure `fromEntity` maps entity fields correctly.
7. Ensure custom fields have TODO comments.
8. Ensure imports are correct.
9. Ensure DTO files are created under `libs/shared/src/dto`.
10. Ensure DTOs are exported from `libs/shared/src/dto/index.ts`.
11. Ensure DTOs are re-exported from `libs/shared/src/index.ts` when needed.
12. Ensure DTOs can be imported through `@dto`, `@dto/*`, or `@shared/*`.
13. Ensure TypeScript compiles.

## Rules

- Do not create entities.
- Do not modify entity files.
- Do not create controllers, services, or modules.
- Do not create separate DTO files for DTOs of the same entity.
- Do not guess custom field logic.
- Keep DTO classes simple.
- Use existing project naming style.
- Use `libs/shared/src/dto` as the default DTO directory.
- Shared DTOs must be available through TypeScript aliases such as `@dto`, `@dto/*`, or `@shared/*`.
- Use npm if dependencies must be checked or installed.
