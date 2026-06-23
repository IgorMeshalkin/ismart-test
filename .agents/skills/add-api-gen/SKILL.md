---
name: add-api-gen
description: Add frontend API auto-generation using an existing prepared generation script.
---

# API Auto Generation

When this skill is used, add frontend API auto-generation using the existing prepared script from `/resources/gen-api.script.ts`.

## Dependencies

Install required dependencies:

```bash
npm i -D openapi-typescript dotenv tsx
```

## Package Script

Add the following script to `package.json`:

```json
{
  "scripts": {
    "gen:api": "tsx scripts/gen-api.script.ts"
  }
}
```

## Environment

The generation script uses:

```txt
${process.env.NEXT_PUBLIC_API_URL}/docs-json
```

Ensure `NEXT_PUBLIC_API_URL` is available in the project environment.

## Files

Create target directories if they do not exist:

```txt
/scripts
/src/shared/types
/src/shared/api
```

Copy the prepared generation script:

```txt
/resources/gen-api.script.ts
```

to:

```txt
/scripts/gen-api.script.ts
```

Do not implement `/scripts/gen-api.script.ts` manually.

## Generated Output

Running:

```bash
npm run gen:api
```

must generate or update:

```txt
/src/shared/types/api.d.ts
/src/shared/api/api.ts
```

## Validation

Before completion:

1. Ensure dependencies are installed.
2. Ensure `/resources/gen-api.script.ts` exists.
3. Ensure `/scripts/gen-api.script.ts` was copied from `/resources/gen-api.script.ts`.
4. Ensure `package.json` contains the `gen:api` script.
5. Ensure `NEXT_PUBLIC_API_URL` is configured.
6. Ensure OpenAPI JSON is available at `${NEXT_PUBLIC_API_URL}/docs-json`.
7. Run:

```bash
npm run gen:api
```

8. Ensure generated files exist:

```txt
/src/shared/types/api.d.ts
/src/shared/api/api.ts
```

9. Ensure the project builds successfully.

## Git

After validation:

```bash
git add .
git commit -m "feat: Added auto api-docs generation script"
```

## Rules

- Use npm.
- Do not write the generation script manually.
- Do not change `/resources/gen-api.script.ts`.
- Always copy `/scripts/gen-api.script.ts` from `/resources/gen-api.script.ts`.
- Do not manually edit generated files.
- Do not hardcode endpoint definitions.
- Do not change existing application code unless required for script registration.
- Keep the setup minimal.
