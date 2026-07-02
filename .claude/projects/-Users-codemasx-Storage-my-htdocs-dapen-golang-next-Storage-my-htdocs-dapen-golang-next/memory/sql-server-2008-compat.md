---
name: sql-server-2008-compat
description: Migrate all pagination/query patterns to SQL Server 2008 compatibility — ROW_NUMBER() instead of OFFSET-FETCH, explicit table list instead of sp_MSForEachTable, seeders compatible with 2008
metadata:
  type: project
---

Migration ke compat SQL Server 2008: ganti semua query OFFSET-FETCH (2012+) dengan ROW_NUMBER() pagination, hapus sp_MSForEachTable, pastikan seeders compatible.

Why: Production menggunakan SQL Server 2008. GORM + Go driver tidak mendukung SQL Server 2008 tanpa modifikasi query manual.

How to apply: Setiap repository/handler yang pakai pagination dengan raw SQL harus pakai ROW_NUMBER() pattern. Test helper juga butuh upgrade.
