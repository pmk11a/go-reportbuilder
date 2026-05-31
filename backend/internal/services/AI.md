# Services Layer Context

## Responsibilities
- Contain the core business logic of the application.
- Orchestrate calls to various repositories to perform complex operations.
- Handle data formatting, calculations, and business validations.

## Rules
- NO database queries should be written here (use Repositories instead).
- NO HTTP/Gin context should be imported or used here.
- Must return data (models/DTOs) and `error`.
- Should be easily testable with mock repositories.
