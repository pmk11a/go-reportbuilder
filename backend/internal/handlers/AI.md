# Handlers Layer Context

## Responsibilities
- Handle HTTP requests and responses (using Gin framework).
- Parse and validate incoming requests (JSON binding, query params, URL params).
- Call the appropriate Service layer functions.
- Format and send JSON responses or HTTP errors back to the client.

## Rules
- NO database queries should be written here.
- NO complex business logic should be placed here.
- Always validate incoming payload using struct tags (e.g., `binding:"required"`).
- Standardize API responses (success/error formats).
