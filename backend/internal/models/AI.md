# Models Layer Context

## Responsibilities
- Define database schemas and relationships using GORM tags.
- Define JSON serialization tags for API responses/requests.
- Maintain legacy mapping formats (e.g., specific table names or column types) if integrating with old databases.
- Contains NO business logic, NO database queries, and NO HTTP logic.

## Rules
- All models must be placed here.
- Use explicit types (like `int32` instead of `int`) if mapping to legacy SQL Server `int` to avoid GORM auto-migration conflicts.
- Implement `TableName()` method if the table name does not match GORM's pluralization convention.
