# Repositories Layer Context

## Responsibilities
- Handle all database interactions (CRUD operations).
- Interface directly with GORM.
- Encapsulate complex database queries and return clean model instances or slices.

## Rules
- NO business logic should be placed here.
- NO HTTP/Gin context should be imported or used here.
- Must return primitive types, domain models, or `error`.
- Every repository should ideally have an interface defined to allow for easy mocking during unit testing.
