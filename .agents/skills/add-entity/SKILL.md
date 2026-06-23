---
name: add-entity
description: Add one or more shared TypeORM entities to the project shared library.
---

# Add Shared TypeORM Entity

When this skill is used, add one or more TypeORM entities to the shared project library.

In this project, entities are common domain definitions and must live under:

```txt
libs/shared/src/entities
```

Do not create entities inside an application-level `src/entity` directory unless the user explicitly overrides this project rule.

## Base Entity

1. Check if the following file exists:

```txt
libs/shared/src/entities/base.entity.ts
```

2. If it does not exist, create it using the template:

```txt
resources/base.entity.ts
```

## Entity Creation Loop

Repeat the following workflow for each entity the user wants to create.

## Entity Name

1. Ask the user for the new entity name.
2. Convert the entity name to:
   - PascalCase class name;
   - kebab-case file name.
3. Create the entity file in:

```txt
libs/shared/src/entities/<entity-name>.entity.ts
```

Example:

```txt
libs/shared/src/entities/user-example.entity.ts
```

4. The entity class must extend `BaseEntity`.

Example:

```ts
export class UserExampleEntity extends BaseEntity {}
```

## Entity Fields

1. Use `specs/ismart/domain-model.md` as the source of truth for fields when the entity exists there.
2. Ask the user which fields the new entity should have only when the field list is not defined in the project specification.
3. The user may provide only field names and TypeScript types.
4. Convert the provided fields into TypeORM columns.
5. Add the appropriate decorators for each field.

Examples:

```txt
email: string
age: number
isActive: boolean
createdDate: Date
```

Should become:

```ts
@Column()
email: string;

@Column()
age: number;

@Column({ name: 'is_active', type: 'boolean', default: true })
isActive: boolean;

@Column({ name: 'created_date', type: 'timestamptz' })
createdDate: Date;
```

## Entity Relations

1. Ask the user whether the new entity should have relations with other entities.
2. If yes, ask which relations are required.
3. Support common TypeORM relations:
   - OneToOne
   - OneToMany
   - ManyToOne
   - ManyToMany
4. Add relation decorators.
5. Add additional relation fields when required.
6. Import related entities correctly.
7. Prefer explicit relation names and readable field names.
8. Use explicit `*Id` fields from `specs/ismart/domain-model.md` when relations are represented as identifiers in the domain model.

## Continue Or Finish

After creating each entity, ask the user whether they want to add another entity.

If yes, return to the Entity Name step.

If no, finish the session.

## Validation

Before completion:

1. Ensure all entity files compile.
2. Ensure all imports are correct.
3. Ensure every entity extends `BaseEntity`.
4. Ensure fields have appropriate TypeORM decorators.
5. Ensure relations are correctly configured.
6. Ensure entity files are created under `libs/shared/src/entities`.
7. Ensure entities are exported from `libs/shared/src/entities/index.ts`.
8. Ensure entities are re-exported from `libs/shared/src/index.ts` when needed.
9. Ensure entities can be imported through `@entities`, `@entities/*`, or `@shared/*`.
10. Ensure all physical table and column names use snake_case.
11. Ensure no unnecessary files were created.

## Rules

- Do not create services, controllers, modules, DTOs, or migrations unless explicitly requested.
- Do not modify existing entities unless required for relations.
- Do not guess complex relation behavior.
- Ask for clarification when a field type or relation is ambiguous.
- Use TypeORM decorators only.
- Keep entity files minimal.
- Use the existing project naming style.
- Use `libs/shared/src/entities` as the default entity directory.
- Export shared entities from `libs/shared/src/entities/index.ts`.
- Shared entities must be available to services through TypeScript aliases such as `@entities`, `@entities/*`, or `@shared/*`.
- Follow `specs/ismart/domain-model.md` for entity names, fields, enum values, storage key rules, and relation identifiers.
- Use `id` as the UUID primary identifier field, not `uuid`.
- Use `createdDate` and `updatedDate` fields, not `createdAt` and `updatedAt`.
- Use snake_case physical names for tables, columns, indexes, and constraints.
