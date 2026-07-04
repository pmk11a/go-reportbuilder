# Core Context — Delphi (Trade2Exchange) to Laravel

## Arsitektur Delphi Asli
- Project: Trade2Exchange.dpr
- Data Module: MyModul.pas (TDM - ADO Connections)
- Global State: MyGlobal.pas (vars + constants)
- Core Logic: MyProcedure.pas (3785 lines)
- Main MDI: FrmUtama.pas (2592 lines)
- DB: SQL Server via ADO
- Reports: FastReport (.fr3)

## Multi-Tenant Architecture
- Multiple connections: Koneksi array[0..20]
- Database selectors: gDatabaseStk, gDatabaseGL, gDatabaseMkt
- Connection config: Connection.dat
- Period locking: dbLockPeriode stored proc
- Multi-gudang: global variable XnamaGudang
- Multi-company: gProgram, gDatabase

## Global Variables (to Laravel Session/Config)
IDUser -> auth()->id() / Session
MyUser -> session('my_user')
LevelUserAccess -> session('level_user')
PeriodBln/Thn -> session('periode_bln/thn')
XnamaGudang -> session('xnamagudang')
KodeGudang -> session('kode_gudang')
KodeKlien -> session('kode_klien')
Xtgl -> now()->format('d/m/Y')

## Authentication Flow
1. FrmUtama.FormShow -> Create TfrLogin
2. Login form: NamaUser + KUNCI (encrypted password)
3. MyCariUserName(userId, kunci, status, level) -> validate
4. UpdateStatusUser(userId, 1) -> set online
5. Load menu from DBFLMENU (per-user permissions)
6. Dynamic menu building based on akses codes

## Menu Access Control Pattern (ALL FORMS)
CekOtoritasMenu(IDUser, Tag, Istambah, Ishapus, IsKoreksi, IsCetak, IsExcel)

Permission flags map to Laravel Policy:
ISTAMBAH -> can('create', $resource)
ISHAPUS -> can('delete', $resource)
ISKOREKSI -> can('update', $resource)
ISCETAK -> can('print', $resource)
ISEXPORT -> can('export', $resource)

## Number Booking System (dbNomorPK)
- Table tracks: kodeBukti, periode, tahun, prefix, lastNumber, urut, tipe
- Daftar_Nomor -> locks a sequence number
- Hapus_Daftar_Nomor -> release locked number
- UpdateNomor -> increment number
- Used by ALL transactions for auto-numbering

## Soft Cancel Pattern (pembatalan)
- Field: isbatal boolean
- Field: UserBatal varchar
- Field: TglBatal datetime
- pembatalan(table, keyField, keyValue, keyVal) -> mark as cancelled

## Activity Logging
- LoggingData(tabel, aksi, userid) -> writes to logfile/audit trail
- Aksi codes: 'Add', 'Edit', 'Delete', 'Cancel', etc.

## Encryption (XOR)
- Decrypt(text) -> XOR decode password
- Encrypt(text) -> XOR encode

## Utility Functions
- KonversiKeTeks(value) -> Indonesian numeral conversion (seribu dua ratus)
- IsLockPeriode -> check period locked
- CekPeriode -> validate period not in future

## Database Table Naming
- Prefix DB* -> main tables (DBPERKIRAAN, DBBARANG, DBCUSTSUPP)
- Prefix DB*DET -> detail tables
- Some prefixed with table name only: FLMENU, NOMOR, LOCKPERIODE

## Query Patterns (MyProcedure.pas)
- DataBuka(query) -> executes plain query
- DataBersyarat(query, params) -> parameterized query
- DataUrut(query) -> sorted query
- MySearch(query) -> contains search
- All use DM.QuCari (TADOQuery) as reusable query component
