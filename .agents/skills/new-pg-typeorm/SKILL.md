---
name: new-pg-typeorm
description: Add PostgreSQL database connection to an existing NestJS application using TypeORM.
---

# Add NestJS PostgreSQL TypeORM

When this skill is used, add PostgreSQL database support to an existing NestJS application.

## Database Environment Variables

Update the `.env` file and add:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=<project-name>-local
```

Use the current project name for `<project-name>`.

## Dependencies

Install required dependencies:

```bash
npm i @nestjs/typeorm typeorm pg @nestjs/config
```

## AppModule

Update `AppModule` and add TypeORM configuration.

Use `ConfigModule` for environment variables.

TypeORM must be configured with:

- PostgreSQL
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `autoLoadEntities: true`
- `synchronize: false`
- migrations support
- snake_case naming strategy
- Log of successfull connection to Database

```txt
Database <project-name>-local connected
```

## Naming Strategy

Create:

```txt
src/db/snake-naming.strategy.ts
```

using template:

```txt
resources/snake-naming.strategy.ts
```

Use this naming strategy in TypeORM configuration.

## Data Source

Create:

```txt
src/db/data-source.ts
```

using template:

```txt
resources/data-source.ts
```

## Migrations

Create an empty folder:

```txt
src/db/migrations
```

Configure migration scripts in `package.json`.

Create scripts for:

```bash
npm run migration:create
npm run migration:generate
npm run migration:run
npm run migration:revert
```

## Git

Add all new files to .git

Create commit with name: 

```txt
Configured TypeORM to Postgres connection
```

## Validation

Before completion:

1. Ensure dependencies are installed.
2. Ensure TypeORM is imported in `AppModule`.
3. Ensure `.env` contains all required DB variables.
4. Ensure TypeORM configuration is valid.
5. Ensure the application starts successfully.
6. Ensure the database connection is available.
7. Ensure the data source starts without errors.
8. Ensure migration files are discovered correctly.
9. Ensure `npm run migration:run` executes successfully.

## Rules

- Do not add entities unless explicitly requested.
- Do not use `synchronize: true`.
- Use migrations only.
- Do not hardcode database credentials in TypeScript files.
- Use environment variables only.
- Keep database configuration minimal.
- Use npm.
