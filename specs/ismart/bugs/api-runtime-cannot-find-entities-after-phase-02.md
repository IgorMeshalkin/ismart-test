# Bug - API Runtime Cannot Resolve @entities After Phase 02

## Status

Resolved

## Created After Phase

Phase 02 - Authorization And Registration

## Summary

After Phase 02 changes, the API container fails at runtime because Node.js cannot resolve the TypeScript path alias `@entities` from the compiled JavaScript output.

## Error

```text
api-1          | node:internal/modules/cjs/loader:1433
api-1          |   throw err;
api-1          |   ^
api-1          |
api-1          | Error: Cannot find module '@entities'
api-1          | Require stack:
api-1          | - /app/apps/api/dist/apps/api/src/app.module.js
api-1          | - /app/apps/api/dist/apps/api/src/main.js
api-1          |     at Function._resolveFilename (node:internal/modules/cjs/loader:1430:15)
api-1          |     at defaultResolveImpl (node:internal/modules/cjs/loader:1040:19)
api-1          |     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1045:22)
api-1          |     at Function._load (node:internal/modules/cjs/loader:1216:25)
api-1          |     at wrapModuleLoad (node:internal/modules/cjs/loader:254:19)
api-1          |     at Module.require (node:internal/modules/cjs/loader:1527:12)
api-1          |     at require (node:internal/modules/helpers:147:16)
api-1          |     at Object.<anonymous> (/app/apps/api/dist/apps/api/src/app.module.js:14:21)
api-1          |     at Module._compile (node:internal/modules/cjs/loader:1781:14)
api-1          |     at Object..js (node:internal/modules/cjs/loader:1913:10) {
api-1          |   code: 'MODULE_NOT_FOUND',
api-1          |   requireStack: [
api-1          |     '/app/apps/api/dist/apps/api/src/app.module.js',
api-1          |     '/app/apps/api/dist/apps/api/src/main.js'
api-1          |   ]
api-1          | }
api-1          |
api-1          | Node.js v22.23.0
```

## Observed Behavior

The API Docker container starts compiled JavaScript from:

```text
/app/apps/api/dist/apps/api/src/main.js
```

During module loading, the compiled API code still contains a runtime import for:

```text
@entities
```

Node.js does not know how to resolve this TypeScript alias in the production runtime and terminates the process with `MODULE_NOT_FOUND`.

## Expected Behavior

The API container must start successfully after build and must be able to load shared entities from `libs/shared`.

## Likely Cause

TypeScript path aliases are configured for compile-time resolution, but the compiled CommonJS output still requires `@entities` at runtime. The runtime environment does not register `tsconfig-paths` or rewrite aliases after build.

## Notes For Fix

A fix should ensure shared aliases resolve in the compiled API runtime. Possible approaches include:

- configure a runtime alias resolver for compiled output;
- rewrite TypeScript aliases after compilation;
- change runtime imports in API code to paths that Node.js can resolve after build;
- package `libs/shared` as a workspace library and import it as a real Node package.

The chosen fix must preserve the project rule that application code should not use deep relative imports to shared entities and DTOs.
