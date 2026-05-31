---
name: dapen-scaffolding
description: "Instructions on how to correctly scaffold a new full-stack feature in the DAPEN project."
---

# DAPEN Feature Scaffolding Workflow

When asked to scaffold or create a new feature end-to-end, follow this sequence strictly to comply with the project architecture:

## 1. Backend Database Layer
1. Create the database model in `backend/internal/models/` (prefix `S`). Add `TableName() string`.
2. Define the Repository interface and implementation in `backend/internal/repositories/` (prefix `I`).

## 2. Backend Business Layer
1. Define DTOs in `backend/internal/dto/` for requests/responses.
2. Define the Service interface and implementation in `backend/internal/services/`.
3. Write a unit test for the service logic using mocks.

## 3. Backend Delivery Layer
1. Create the Handler in `backend/internal/handlers/`. Add Swagger annotations.
2. Register the routes in `backend/internal/routes/routes.go`.
3. Verify compilation: `cd backend && go build ./...`

## 4. Frontend Integration Layer
1. Define TypeScript interfaces in `frontend/src/types/`.
2. Create API fetch functions in `frontend/src/services/`. Do not use components for fetching.
3. Wrap fetch functions in React Query hooks in `frontend/src/hooks/`.

## 5. Frontend UI Layer
1. Create the UI components in `frontend/src/components/`. Use atomic design and Glassmorphism.
2. Map routes in TanStack Router.
3. Implement `errorMapper.ts` for handling API errors visually.
4. Verify runtime: `cd frontend && npm run type-check`.

## 6. Testing (QA)
1. Write End-to-End (Playwright) tests for the complete user workflow.
