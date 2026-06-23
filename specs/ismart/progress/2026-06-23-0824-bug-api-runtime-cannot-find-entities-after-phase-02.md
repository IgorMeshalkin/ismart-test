# Bug Fix Progress - api-runtime-cannot-find-entities-after-phase-02

## 2026-06-23 08:24 UTC

Bug:
api-runtime-cannot-find-entities-after-phase-02

Status:
Ready For QA

Files Changed:
- `package.json`
- `package-lock.json`
- `apps/api/package.json`

Root Cause:
TypeScript path aliases (`@entities`, `@shared`, `@dto`) are resolved at compile time but remain as literal strings in the compiled CommonJS output. The production runtime (`node dist/apps/api/src/main.js`) has no alias resolver registered, so Node.js cannot find the modules and terminates with `MODULE_NOT_FOUND`.

Fix Applied:
Added `tsc-alias` as a dev dependency. After `tsc` compiles the source, `tsc-alias` rewrites all TypeScript path aliases in the compiled output to relative paths that Node.js can resolve natively. No runtime overhead and no changes to application source code.

Implementation Checklist:
- [ ] Added `tsc-alias@^1.8.16` to root `package.json` devDependencies.
- [ ] Updated `apps/api/package.json` build script to run `tsc-alias -p tsconfig.build.json` after `tsc`.
- [ ] Ran `npm install` and verified `tsc-alias` was added to `package-lock.json`.
- [ ] Verified `npm run build:api` completes without errors.
- [ ] Verified no `@entities`, `@shared`, or `@dto` aliases remain in the compiled output under `apps/api/dist/`.
- [ ] Verified compiled `app.module.js` requires a relative path instead of `@entities`.
