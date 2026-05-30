---
name: dapen-build-check
description: "Checks the build health and type safety of the DAPEN project. Use this skill after making significant architectural changes to ensure no types or routes are broken."
---

# DAPEN Build Check

This skill runs a full diagnostic check on the DAPEN repository, focusing on TanStack Router synchronization and TypeScript strictness.

## Frontend Diagnostics
Run the following inside the `frontend/` directory:

1. **Sync Routes**:
```bash
npx @tanstack/router-cli generate
```
Always generate routes after creating/deleting files in `src/routes/`.

2. **Type Check**:
```bash
npm run type-check
```
Must return zero errors. Pay special attention to `src/types/` (Centralized Type Safety).

3. **Lint**:
```bash
npm run lint
```

## Backend Diagnostics
Run the following inside the `backend/` directory:

1. **Format**:
```bash
go fmt ./...
```

2. **Build Test**:
```bash
go build -v ./...
```
