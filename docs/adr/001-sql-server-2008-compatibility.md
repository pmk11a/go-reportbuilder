# ADR-001: SQL Server 2008 Backward Compatibility

**Date**: 2026-06-25
**Status**: Accepted
**Subject**: SQL Server 2008 R2 as minimum supported database version for production

---

## Context

Production environment uses legacy SQL Server 2008 tables (`DBMENU`, `DBFLPASS`, `DBTRANSAKSI`, `DBCUSTSUPP`, `DBNOMOR`, etc.) with fixed schemas. These tables are managed by Laravel/Eloquent (legacy) and GORM (new backend). New GORM features and SQL Server 2017+ syntax cannot be deployed to production.

## Decision

All new Go (GORM) code, raw SQL queries, and seeds must be **backward compatible with SQL Server 2008 R2**. This means:

1. No `OFFSET ... FETCH NEXT` — pagination must use `ROW_NUMBER()`
2. No undocumented `sp_MSForEachTable` — truncate/re-enable constraints must use explicit table lists
3. Only use T-SQL features available since SQL Server 2008 (2008 supports `CASE`, `COALESCE`, `YEAR()`, `MONTH()`, `UPDLOCK/HOLDLOCK`, `INFORMATION_SCHEMA`, `sys.tables`, `sys.default_constraints`, `sys.foreign_keys`)

## Consequences

- Pagination queries need `ROW_NUMBER()` pattern instead of `OFFSET ... FETCH`
- Test harness truncate/restore needs explicit table list instead of `sp_MSForEachTable`
- All raw SQL must be reviewed for 2008 compatibility before merge
- GORM's built-in pagination helper (`Limit` + `Offset` with `ORDER BY`) generates `OFFSET ... FETCH` — needs override for SQL Server 2008

## References

- [SQL Server 2008 Feature Support](https://learn.microsoft.com/en-us/sql/t-sql/statements/select-offset-fetch-transact-sql) (available since SQL Server 2012)
- [ROW_NUMBER() pagination](https://learn.microsoft.com/en-us/sql/t-sql/queries/ordering-by-using-over) (available since SQL Server 2005)
