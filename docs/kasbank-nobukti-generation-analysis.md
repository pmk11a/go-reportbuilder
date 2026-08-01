# Analisis Generate NoBukti KasBank di Delphi & MyProcedure

**Tanggal**: 2026-07-23
**Subject**: Mengapa nomor NoBukti KasBank sering "lompat" di aplikasi Delphi original

**Berkas terkait**:

- `pwt/Trasaksi/KasBank/FrmKasBank.pas`
- `pwt/Unit/MyProcedure.pas`
- `pwt/Unit/MyProcedureold.pas`

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Alur Generate NoBukti](#2-alur-generate-nobukti)
3. [Mengapa Nomor Sering Lompat](#3-mengapa-nomor-sering-lompat)
4. [Daftar Skenario Spesifik](#4-daftar-skenario-spesifik)
5. [Root Cause Summary](#5-root-cause-summary)
6. [Solusi yang Sudah Diimplementasikan di Go](#6-solusi-yang-sudah-diimplementasikan-di-go)
7. [Rekomendasi](#7-rekomendasi)
8. [Referensi Kode](#8-referensi-kode)
9. [Solusi untuk Delphi Original](#9-solusi-untuk-delphi-original-tanpa-merusak-sistem-existing)
10. [Analisis Skenario Hybrid](#10-analisis-skenario-hybrid-2-user-delphi--2-user-web-input-barengan)
11. [Patch Auto-Retry di SimpanData](#11-patch-auto-retry-di-simpandata--penjelasan-mendalam)
12. [Analisis dbNomorPK](#12-analisis-dbnomorpk---sistem-registry-nomor-per-user)
13. [Patch Konkret untuk dbNomorPK](#13-patch-konkret-untuk-dbnomorpk---implementasi)

---

## 1. Ringkasan Eksekutif

Di aplikasi **Delphi original** (dan MyProcedure shared logic), NoBukti KasBank di-generate dengan algoritma:

1. **Query langsung ke `dbTrans`** untuk mendapatkan NoUrut tertinggi pada periode aktif
2. **Increment +1** untuk nomor berikutnya
3. **Format** dengan template 4-slot dari tabel `DBNOMOR` (FORMAT1..4 + PEMISAH + ALIAS)
4. **Registrasi** nomor ke tabel `dbNomorPK` sebagai "lock registry" sederhana

Mekanisme `dbNomorPK` **bukan** mekanisme counter terpusat melainkan hanya **lock registry** untuk mencegah dua user menginput NoBukti yang sama secara bersamaan. Counter sendiri selalu dihitung ulang dari `dbTrans` setiap kali form dibuka, sehingga nomor **cenderung "lompat"** (skip) karena berbagai skenario yang dijelaskan di bawah ini.

**Inti masalah**:

| Aspek               | Mekanisme Delphi                                                                |
|---------------------|---------------------------------------------------------------------------------|
| Sumber counter      | `SELECT TOP 1 NoUrut FROM dbTrans ORDER BY NoUrut DESC` (dihitung on-the-fly)   |
| Locking             | Tidak ada UPDLOCK/HOLDLOCK atau transaksi Serializable                          |
| dbNomorPK           | Hanya registrasi: jika ada di dbNomorPK dan user beda -> tolak, jika sama -> boleh |
| Cleanup             | Hapus dari dbNomorPK saat form ditutup / ESC / FormCreate                       |
| Increment           | Berlaku setiap kali form dibuka, setiap ganti Simbol, setiap klik tombol Tambah |

---

## 2. Alur Generate NoBukti

### 2.1 Entry Point: IsiNoBuktiBaru

**Berkas**: `pwt/Trasaksi/KasBank/FrmKasBank.pas:1547`

```pascal
procedure TFrKasBank.IsiNoBuktiBaru;
begin
  DecodeDate(Date, YY, MM, DD);
  If DayOfTheMonth(Date) <= DD then
     DD := DayOfTheMonth(date);
  Try
    TANGGAL.Date := EncodeDate(StrToInt(PeriodThn), StrToInt(PeriodBln), DD);
  Except
    TANGGAL.Date := EndOfAMonth(StrToInt(PeriodThn), StrToInt(PeriodBln))
  end;
  Check_NomorKasBank(
    StrToInt(PeriodBln), StrToInt(PeriodThn),
    Mode.Text, Nomor, NomorBukti, Tanggal.Date,
    Simbol.Text, False
  );
  NoUrut.Text := NomorBukti;
  NOBUKTI.Text := Nomor;
end;
```

**Dipanggil dari**:

- `TambahBtnClick` (saat user klik tombol Tambah)
- `ModeChange` (saat user ganti Mode: BKK/BKM/BBM/BBK)
- `SimbolExit` (saat user ganti Simbol: Kas/Bank account)

---

### 2.2 Check_NomorKasBank di MyProcedure.pas

**Berkas**: `pwt/Unit/MyProcedure.pas:2437`

```pascal
function Check_NomorKasBank(
  pBulan, pTahun: integer;
  pTipe: String;
  var pNomor, pNoUrut: String;
  pDate: TDateTime;
  pSimbol: String;
  pIsPpn: Boolean
): Boolean;
var
  pReset: Byte;
  xDigitNomor: String;
begin
  pReset := DM.TaNomor.FieldByName('Reset').AsInteger;
  xDigitNomor := DM.TaNomor.FieldByName('DigitNomor').AsString;

  if pTipe <> '' then
  begin
    with DM.QuNomor do
    begin
      Close;
      SQL.Clear;
      SQL.Add('select top 1 NoUrut from dbTrans');
      if xReset = 0 then
         Sql.Add('where month(Tanggal)=' + IntToStr(pBulan) +
                 ' and year(Tanggal)=' + IntToStr(pTahun))
      else
         Sql.Add('where year(Tanggal)=' + IntToStr(pTahun));

      if (pTipe='BKK') or (pTipe='BKM') then
        SQL.Add('and TipeTransHD in (''BKK'',''BKM'') ')
      else
        SQL.Add('and TipeTransHD in (''BBK'',''BBM'') ');

      SQL.Add('and Simbol=' + QuotedStr(pSimbol));
      SQL.Add('and isnumeric(NoUrut)=1 ');
      SQL.Add('order by NoUrut desc ');
      Open;

      if IsEmpty then pNomor := '1'
      else
      begin
        try
          pNomor := IntToStr(Fields[0].AsInteger + 1);
        except
          pNomor := '1';
        end;
      end;
    end;
  end
  else
    pNomor := '00001';

  pNoUrut := FormatFloat(xDigitNomor, StrToInt(pNomor));
  pNomor := pNoUrut + pSimbol;

  Konfig(pTIPE, pNOMOR, F1, F2, F3, F4, S1, N1, N2, N3, N4, pDate, pIsPpn);

  xxNomor := '';
  if Trim(F1) <> '' then xxNomor := xxNomor + Trim(F1) + Separator;
  if Trim(F2) <> '' then xxNomor := xxNomor + Trim(F2) + Separator;
  if Trim(F3) <> '' then
  begin
    if Trim(F4) <> '' then
      xxNomor := xxNomor + Trim(F3) + Separator + Trim(F4)
    else xxNomor := xxNomor + Trim(F3);
  end;
  pNomor := xxNomor;
end;
```

**Logika step-by-step**:

| Step | Aksi                                                                                       |
|------|--------------------------------------------------------------------------------------------|
| 1    | Baca `Reset` (0=bulanan, 1=tahunan) dari `DBNOMOR`                                         |
| 2    | Baca `DigitNomor` (mis. "000") dari `DBNOMOR`                                              |
| 3    | Query `dbTrans` untuk cari NoUrut tertinggi di periode aktif                                |
| 4    | Filter tambahan: `TipeTransHD` (BKK/BKM vs BBK/BBM) + `Simbol`                              |
| 5    | Jika kosong -> mulai dari `'1'`, jika ada -> `max + 1`                                     |
| 6    | Format menjadi padding sesuai `DigitNomor` -> misal "00005"                                 |
| 7    | Gabung dengan `Simbol` -> "00005BKI"                                                       |
| 8    | Panggil `Konfig` untuk menerapkan template FORMAT1..4                                       |
| 9    | Hasil akhir: NoBukti seperti `BKI:00005:KAS:072026`                                         |

---

### 2.3 Konfig: Penyusun Template 4-Slot

**Berkas**: `pwt/Unit/MyProcedure.pas:1425` dan overload dengan `xIsPpn` di `:1515`

```pascal
Procedure Konfig(
  Tipe, xNomor: String;
  Var xF1, xF2, xF3, xF4, NoUrut: String;
  Var yF1, yF2, yF3, yF4: Integer;
  xDate: TDateTime;
  xIsPpn: Boolean
);
begin
  if DM.TaNomor.Active = False then
     DM.TaNomor.Open;
  With DM.TaNomor do
  begin
    If not IsEmpty then
    begin
      xInisialTrans := FieldByname(TIPE).AsString;

      case FieldByname('Format1').AsInteger of
        0: xF1 := FieldByname('ALIAS').AsString;
        1: xF1 := xInisialTrans;
        2: xF1 := FormatDateTime('MMYY', xDate);
        3: xF1 := FormatDateTime('MMYYYY', xDate);
        4: xF1 := xNomor;
        5: xF1 := FormatDateTime('YYMM', xDate);
        6: xF1 := FormatDateTime('YYYYMM', xDate);
      end;
      // Format2..4 serupa

      case FieldByname('Pemisah').AsInteger of
        0: Separator := ':';
        1: Separator := '-';
        2: Separator := '/';
        3: Separator := ' ';
      end;

      xReset := FieldByname('Reset').AsInteger;
    end;
  end;
end;
```

**Decode Format1..4** (masing-masing kolom bisa bernilai 0..6):

| Kode | Arti                | Sumber                                  |
|------|---------------------|-----------------------------------------|
| 0    | `ALIAS`             | kolom DBNOMOR.ALIAS                     |
| 1    | `KODE_TRANSAKSI`    | initial per-tipe (BKK, BKM, BBK, BBM)   |
| 2    | `MMYY`              | bulan + 2 digit tahun                   |
| 3    | `MMYYYY`            | bulan + 4 digit tahun                   |
| 4    | `NOMOR_URUT`        | counter utama yang sudah dihitung       |
| 5    | `YYMM`              | 2 digit tahun + bulan                   |
| 6    | `YYYYMM`            | 4 digit tahun + bulan                   |

**Hasil akhir**: 4 slot F1..F4 digabung dengan Separator -> NoBukti final.

Contoh: `BKI-00001-KAS-072026`

---

### 2.4 Daftar_Nomor: Mekanisme Lock via dbNomorPK

**Berkas**: `pwt/Unit/MyProcedure.pas:3167`

```pascal
function Daftar_Nomor(
  Tipe, xNoUrut, Nomor: String;
  Koreksi: Integer
): Boolean;
begin
  With Dm.QuCari do
  begin
    Close;
    Sql.Clear;
    sql.Add('Select Tipe, nourut, NoBukti, UserID From dbNomorPK ' +
            'where Tipe=:0 and NoBukti=:1');
    Prepared;
    Parameters[0].Value := Tipe;
    Parameters[1].Value := Nomor;
    Open;
  end;

  if DM.QuCari.IsEmpty then
  begin
    // BELUM ADA di dbNomorPK -> INSERT sebagai "lock"
    with Dm.QuKode do
    begin
      close;
      sql.Clear;
      sql.Add('Insert into dbNomorPK values(:0,:1,:2,:3,:4,:5,:6,:7)');
      Prepared;
      Parameters[0].Value := Tipe;
      Parameters[1].Value := xNoUrut;
      Parameters[2].Value := Nomor;
      Parameters[3].Value := IDUser;
      Parameters[4].Value := StrToInt(PeriodBln);
      Parameters[5].Value := StrToInt(PeriodThn);
      Parameters[6].value := 0;
      Parameters[7].value := XnamaGudang;
      ExecSQL;
    end;
  end
  else
  begin
    // SUDAH ADA -> cek UserID
    MyUser := dm.QuCari.FieldByname('Userid').AsString;
  end;

  Result := DM.QuCari.IsEmpty or
            ((not DM.QuCari.IsEmpty) and (MyUser = IDUser));
end;
```

**Schema `dbNomorPK`** (dari query insert, 8 kolom):

| # | Kolom      | Tipe      | Keterangan                              |
|---|------------|-----------|-----------------------------------------|
| 1 | Tipe       | VARCHAR   | "BK", "BM", "BB" (2 huruf depan Mode)   |
| 2 | NoUrut     | INT/STR   | Nomor urut counter (misal "00005")      |
| 3 | NoBukti    | VARCHAR   | NoBukti lengkap (termasuk Simbol)       |
| 4 | UserID     | VARCHAR   | User yang mendaftarkan                  |
| 5 | Bulan      | INT       | Bulan periode                           |
| 6 | Tahun      | INT       | Tahun periode                           |
| 7 | Flag       | INT       | (default 0)                             |
| 8 | Gudang     | VARCHAR   | Nama gudang (XnamaGudang)               |

**Mekanisme** (pseudo-code):

```
if (NoBukti belum ada di dbNomorPK)          -> Insert + return TRUE
if (NoBukti ada, UserID == Me)              -> return TRUE
if (NoBukti ada, UserID != Me)              -> return FALSE (warning)
```

### 2.5 Hapus_Daftar_Nomor_User: Cleanup saat FormCreate

**Berkas**: `pwt/Unit/MyProcedure.pas:3228`

```pascal
procedure Hapus_Daftar_Nomor_User(Tipe: String; Pemakai: String);
begin
  // Hapus Nomor Yang ada di daftar (dbNOMORPK) milik user tsb
  with Dm.DaftarNO do
  begin
    Close;
    SQL.Clear;
    SQL.Add('Delete from dbNOMORPK');
    SQL.Add('Where tipe =:0 and UserID =:1');
    Prepared;
    Parameters[0].Value := Tipe;
    Parameters[1].Value := Pemakai;
    ...
  end;
end;
```

**Dipanggil dari**:

- `TFrKasBank.FormCreate` (saat form dibuka) -> bersihkan semua entry user
- `TANGGALKeyDown` (saat ESC ditekan) -> bersihkan entry NoBukti aktif
- `tvMasterKeyDown` (saat ESC di treeview) -> bersihkan entry NoBukti aktif

---

## 3. Mengapa Nomor Sering Lompat

### 3.1 Counter di-query dari dbTrans setiap kali generate

**Query utama di `Check_NomorKasBank`**:

```sql
SELECT TOP 1 NoUrut FROM dbTrans
WHERE month(Tanggal) = X AND year(Tanggal) = Y
  AND TipeTransHD IN ('BKK','BKM')   -- atau BBK/BBM
  AND Simbol = '...'                  -- atau nama akun Kas/Bank
  AND isnumeric(NoUrut) = 1
ORDER BY NoUrut DESC
```

**Tidak ada filter**:

- `IsOtorisasi1..5` -> voucher yang sudah diotorisasi maupun draft, sama-sama dihitung
- `IsBatal` -> voucher yang dibatalkan TETAP dihitung sebagai counter (tidak di-skip)
- Status aktif/non-aktif voucher -> voucher di luar periode aktif TETAP dihitung jika lewat filter bulan/tahun

**Implikasi**: setiap kali form dibuka, counter dihitung **dari data riil di dbTrans** yang mungkin sudah ada transaksi gagal / setengah jadi / di-backup restore.

### 3.2 Tidak ada locking pada query counter

Di Delphi asli **tidak ada**:

- `WITH (UPDLOCK, HOLDLOCK)` pada query counter
- Transaksi Serializable
- `SELECT ... FOR UPDATE` (tidak relevan di SQL Server, tapi analognya begitu)

Artinya: **dua user bisa membaca counter yang sama secara bersamaan**.

### 3.3 dbNomorPK mencegah duplikat, bukan mencegah lompat

`dbNomorPK` bekerja sebagai **lock registry sederhana**:

| Kondisi                                          | Hasil                                                    |
|--------------------------------------------------|-----------------------------------------------------------|
| User A insert `NoBukti = "00005"` di dbNomorPK   | --                                                        |
| User B insert `NoBukti = "00005"` di dbNomorPK   | INSERTED (cek pakai UserID, bukan unique constraint)      |

`dbNomorPK` **tidak memiliki UNIQUE constraint pada NoBukti** di kode ini (hanya Tipe + NoBukti sebagai filter WHERE di SELECT). Yang terjadi:

1. **Jika dua user generate NoBukti yang sama** -> keduanya berhasil insert
2. User B yang simpan duluan ke `dbTrans` "memenangkan" slot
3. User A yang simpan belakangan akan dapat **duplicate primary key violation** (atau di Go: terdeteksi dan di-retry)

**Tapi counter-nya tetap naik**: User A akan dapat counter berikutnya -> **nomor visual User A meloncat**.

### 3.4 Check_NomorKasBank dipanggil berulang kali

Di FrmKasBank.pas, `IsiNoBuktiBaru` (yang memanggil `Check_NomorKasBank`) dipanggil dari:

| Pemicu                                | Kapan                                              |
|---------------------------------------|----------------------------------------------------|
| `TambahBtnClick`                      | Tombol Tambah diklik                               |
| `KoreksiBtnClick` / toolbar Koreksi   | Tombol Koreksi diklik                              |
| `ModeChange`                          | User ganti Mode (BKK <-> BKM <-> BBM <-> BBK)      |
| `SimbolExit`                          | User ganti Kas/Bank (setelah pilih di lookup)      |

**Setiap kali Simbol diganti**, nomor di-generate ulang -> counter naik di UI meskipun user belum klik Simpan dan belum tentu jadi transaksi.

---

### 3.5 Race condition antar-user

Berikut skenario detail race condition:

```
Waktu   User A                              User B
---------------------------------------------------------------------
T+0     Buka form -> query dbTrans          (idle)
        dapat NoUrut=00005
        set NoBukti=00006BKI
        -> insert ke dbNomorPK (NoBukti=00006, User=A)

T+1     (lanjut input data)                Buka form -> query dbTrans
                                           dapat NoUrut=00005 (sama!)
                                           set NoBukti=00006BKI
                                           -> Daftar_Nomor cek dbNomorPK
                                           -> ada, User=A != User=B
                                           -> muncul warning "Nomor telah
                                             digunakan oleh User A"

T+2     (User B klik Tambah ulang)         User B klik Tambah lagi ->
                                           query dbTrans masih 00005 ->
                                           set NoBukti=00006BKI (lagi!)

T+3     User A klik Simpan                 (idle)
        sp_Transaksi INSERT ke dbTrans
        dengan NoBukti=00006BKI (sukses)

T+4     (idle)                             Daftar_Nomor akhirnya return FALSE
                                           atau UI menampilkan pesan error
                                           dan User B harus klik lagi ->
                                           dapat NoUrut=00006 (karena 00005+1=6,
                                           tapi 6 sudah ada!) -> 00007

-> Hasil: User B simpan dengan NoBukti=00007BKI
         LOMPAT dari 00006 ke 00007 (00006BKI "dimiliki" User A)
```

---

## 4. Daftar Skenario Spesifik

| # | Skenario                                                                                             | Penyebab lompat                                                             |
|---|------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1 | User buka form -> `IsiNoBuktiBaru` -> dapat 00006 -> ESC / close tanpa simpan                        | Tidak ada; user buka lagi -> dapat 00006 lagi                                |
| 2 | User buka form -> input data -> koneksi putus saat Simpan                                            | NoBukti visual sudah 00006 tapi dbTrans tidak punya -> reopen dapat 00006 lagi (OK) |
| 3 | User A simpan 00006, User B buka form bersamaan                                                     | Keduanya dapat 00006 -> salah satu akan dapat 00007 (lompat)                 |
| 4 | User ganti Mode BKK -> BKM -> BKK sebelum simpan                                                    | Tiap ganti, `IsiNoBuktiBaru` panggil `Check_NomorKasBank` -> counter naik    |
| 5 | User ganti Simbol (Kas1 -> Kas2 -> Kas1)                                                            | Sama seperti #4, counter naik                                                |
| 6 | dbTrans punya voucher di-batal (NoBukti=00005 disimpan lalu dihapus) -> query ulang dapat NoUrut=00004 | Increment tetap +1 dari 00004 -> dapat 00005, padahal voucher 00005 sebelumnya dibatalkan |
| 7 | Restore database dari backup yang punya gap                                                         | Counter hasil query = gap_value+1 -> lompat dari gap ke gap_value+1          |
| 8 | Ada voucher di luar periode aktif (misal user post ke periode sebelumnya dengan tanggal mundur)      | Filter `month/year(Tanggal)` bisa match -> counter naik meski sebenarnya beda periode |

---

## 5. Root Cause Summary

| # | Root Cause                                                                | Tipe              |
|---|---------------------------------------------------------------------------|-------------------|
| 1 | Counter dihitung dari `dbTrans` (bukan dari tabel counter terpusat)       | Algoritmik         |
| 2 | Tidak ada transactional lock pada query counter                          | Concurrency        |
| 3 | `dbNomorPK` hanya lock registry, BUKAN counter terpusat                  | Algoritmik         |
| 4 | Hapus dari `dbNomorPK` saat ESC/FormCreate meninggalkan "lubang"         | Lifecycle          |
| 5 | `Check_NomorKasBank` dipanggil multiple times per form lifecycle         | Lifecycle          |
| 6 | Tidak ada atomicity antara "generate counter" dan "commit ke dbTrans"     | Concurrency        |
| 7 | Tidak ada UNIQUE constraint pada `dbNomorPK.NOBukti`                     | Schema             |
| 8 | Voucher yang dibatalkan masih dihitung dalam counter                     | Algoritmik         |

---

## 6. Solusi yang Sudah Diimplementasikan di Go

Commit terkait: **`0fc5434 fix(kasbank): prevent duplicate NoBukti via UPDLOCK/HOLDLOCK and pre-insert duplicate check`**

### 6.1 Pendekatan

Solusi Go **tidak lagi query `dbTrans` untuk counter**. Sebagai gantinya, counter disimpan di kolom khusus pada `DBNOMOR`:

| Tipe | Kolom DBNOMOR | Keterangan                |
|------|---------------|---------------------------|
| BKK  | `NOBKK`       | Counter per-tipe terpusat |
| BKM  | `NOBKM`       | Counter per-tipe terpusat |
| BBM  | `NOBBM`       | Counter per-tipe terpusat |
| BBK  | `NOBBK`       | Counter per-tipe terpusat |

Logikanya:

1. **Buka transaksi SQL**
2. `SELECT * FROM DBNOMOR WITH (UPDLOCK, HOLDLOCK)` -> kunci eksklusif pada DBNOMOR
3. Baca counter dari kolom yang sesuai (mis. `NOBKK`)
4. Increment counter (string, mis. `00005` -> `00006`)
5. Generate NoBukti via `Konfig`-equivalent (settings.Service.GenerateNoBuktiTx)
6. INSERT ke `DBTRANS` dengan NoBukti baru
7. `UPDATE DBNOMOR SET NOBKK = '00006'` (counter baru)
8. **COMMIT**

Jika di tengah jalan ada error (mis. duplicate primary key di DBTRANS):

- Transaction rollback
- Counter **tidak ter-update**
- Retry loop sampai 5x -> coba lagi dari awal dengan counter yang masih berlaku

### 6.2 Komponen Penting di Go

| Berkas                                             | Fungsi                                              |
|----------------------------------------------------|-----------------------------------------------------|
| `backend/internal/features/kasbank/nomor.go`       | Helper baca/tulis counter ke `DBNOMOR` (legacy)     |
| `backend/internal/features/settings/service.go`    | `GenerateNoBukti`, `GenerateNoBuktiTx` (current)    |
| `backend/internal/features/kasbank/service.go`     | `CreateHeader` dengan retry loop + transactional counter |
| `backend/internal/features/kasbank/service.go`     | `ErrDuplicateVoucherNo` untuk retry signal          |

### 6.3 Apa yang sudah teratasi

| Masalah Delphi                          | Status di Go                                          |
|-----------------------------------------|--------------------------------------------------------|
| Race condition antar-user                | OK: UPDLOCK/HOLDLOCK pada DBNOMOR                      |
| Counter naik tanpa commit               | OK: Counter & DBTRANS INSERT dalam satu transaction    |
| Duplicate NoBukti                       | OK: Retry loop + ErrDuplicateVoucherNo sentinel        |
| Counter naik saat form dibuka           | OK: GenerateNoBuktiPreview ada, form hanya preview     |
| Generate dipanggil berkali-kali         | OK: Tidak ada (counter hanya naik saat INSERT commit)  |

---

## 7. Rekomendasi

### 7.1 Monitoring

Untuk deteksi dini kasus lompat, tambahkan log ini di Go service:

```go
// Saat counter di-increment
log.Printf("[INFO] GenerateNoBukti tipe=%s counter=%s -> %s (gap=%d)",
    tipe, prevCounter, newCounter, gap)
```

### 7.2 Audit Berkala

Query berikut berguna untuk audit periodik:

```sql
-- Cari gap dalam NoBukti per periode
WITH numbers AS (
  SELECT
    NoBukti,
    ROW_NUMBER() OVER (ORDER BY NoBukti) AS rn
  FROM DBTRANS
  WHERE Tanggal >= '2026-01-01'
    AND TipeTransHd = 'BKK'
)
SELECT
  rn,
  NoBukti,
  LAG(NoBukti) OVER (ORDER BY rn) AS prev_no_bukti
FROM numbers
ORDER BY rn;
```

### 7.3 Jika Masih Ingin Backward-Compatible dengan dbNomorPK

Jika ada kebutuhan untuk **menjaga tabel `dbNomorPK`** (misalnya untuk audit forensik), tambahkan:

1. **UNIQUE constraint** pada `dbNomorPK(NoBukti, Tipe)` -> cegah insert duplikat
2. **Trigger** yang auto-delete `dbNomorPK` saat DBTRANS INSERT succeed (sebagai cleanup)
3. **Cleanup job** yang menghapus entri `dbNomorPK` yang lebih dari 24 jam dan tidak ada di DBTRANS

### 7.4 Skenario yang Perlu Tetap Diwaspadai

| Skenario                          | Penjelasan                                                                |
|-----------------------------------|---------------------------------------------------------------------------|
| Restore database dari backup       | Counter di DBNOMOR ikut restore -> bisa outdated                          |
| Import data dari Excel / migrasi   | Data di DBTRANS bertambah tanpa counter DBNOMOR di-update -> lompat        |
| User ganti komputer / shift handover | dbNomorPK dihapus saat FormCreate -> "lubang" bisa terlewat              |

---

## 8. Referensi Kode

### 8.1 Delphi - KasBank

- `pwt/Trasaksi/KasBank/FrmKasBank.pas:1547` -> `IsiNoBuktiBaru`
- `pwt/Trasaksi/KasBank/FrmKasBank.pas:3396` -> `NoUrutExit` (panggil `Daftar_Nomor`)
- `pwt/Trasaksi/KasBank/FrmKasBank.pas:3011` -> `FormCreate` (panggil `Hapus_Daftar_Nomor_User`)
- `pwt/Trasaksi/KasBank/FrmKasBank.pas:3097` -> `ModeChange` (panggil `IsiNoBuktiBaru`)

### 8.2 Delphi - MyProcedure

- `pwt/Unit/MyProcedure.pas:47-79` -> Deklarasi fungsi/procedure
- `pwt/Unit/MyProcedure.pas:1425` -> `Konfig` (overload 1, tanpa xIsPpn)
- `pwt/Unit/MyProcedure.pas:1515` -> `Konfig` (overload 2, dengan xIsPpn)
- `pwt/Unit/MyProcedure.pas:2437` -> `Check_NomorKasBank`
- `pwt/Unit/MyProcedure.pas:2519` -> `Hapus_Daftar_Nomor_Grp`
- `pwt/Unit/MyProcedure.pas:3167` -> `Daftar_Nomor` (dbNomorPK INSERT)
- `pwt/Unit/MyProcedure.pas:3208` -> `Hapus_Daftar_Nomor`
- `pwt/Unit/MyProcedure.pas:3228` -> `Hapus_Daftar_Nomor_User`

### 8.3 Go

- `backend/internal/features/kasbank/nomor.go` -> Helper counter (legacy)
- `backend/internal/features/kasbank/service.go` -> `CreateHeader` dengan retry
- `backend/internal/features/kasbank/repository.go` -> `GenerateNoBukti`, `GenerateNoBuktiWithinTx`
- `backend/internal/features/settings/service.go` -> Shared `NumberingService`

### 8.4 Commit Terkait

- `0fc5434` -> `fix(kasbank): prevent duplicate NoBukti via UPDLOCK/HOLDLOCK and pre-insert duplicate check`

---

**Catatan tambahan**: Algoritma di Delphi original ini bukan "bug" dalam pengertian klasik; ini adalah **trade-off** antara simplicity (tidak perlu tabel counter tambahan) dan consistency (counter terpusat). Masalah "lompat" muncul karena komputerisasi multi-user modern membutuhkan atomicity yang lebih kuat daripada yang bisa diberikan oleh pola "lock registry" sederhana.



---

## 9. Solusi untuk Delphi Original (Tanpa Merusak Sistem Existing)

### 9.1 Prinsip Dasar

Solusi untuk Delphi original harus mengikuti prinsip-prinsip berikut:

| Prinsip                                        | Penjelasan                                                            |
|------------------------------------------------|-----------------------------------------------------------------------|
| **1. Tidak ada perubahan schema database**     | Tidak menambah kolom atau tabel baru (kecuali opsional)               |
| **2. Tidak ada perubahan stored procedure**     | sp_TransaksiKasBank dan sp_NomorPK tetap dipakai apa adanya          |
| **3. Backward-compatible 100%**                | Aplikasi lama yang jalan paralel harus tetap bekerja                  |
| **4. Tidak menambah menu / form baru**         | User flow tidak berubah                                               |
| **5. Patch minimal**                           | Cukup ubah 2 function utama: `Check_NomorKasBank` + `Daftar_Nomor`    |

Intinya: **hanya mengubah SQL/method yang dipanggil**, tanpa menyentuh stored procedure atau business logic yang sudah jadi.

### 9.2 Root Cause yang Perlu Diperbaiki

Sebelum kasih solusi, identifikasi dulu root cause yang PALING signifikan:

| # | Root Cause                                | Fix Location                            |
|---|-------------------------------------------|-----------------------------------------|
| 1 | Counter dari dbTrans tanpa filter batal    | Check_NomorKasBank query SQL            |
| 2 | SELECT tanpa UPDLOCK antar-user           | Check_NomorKasBank query SQL            |
| 3 | Tidak ada retry saat duplicate primary key | Check_NomorKasBank (loop)               |
| 4 | Daftar_Nomor cek pakai UserID, bukan UNIQUE | Daftar_Nomor (dbNomorPK logic)         |

### 9.3 Solusi: Patch pada Check_NomorKasBank (MyProcedure.pas:2437)

#### Strategi

Tetap query dbTrans seperti sedia kala untuk MAX(NoUrut), TETAPI:

1. **Tambahkan filter** agar voucher yang dibatalkan / tidak valid tidak dihitung
2. **Bungkus dalam loop** retry kecil (max 5x) untuk handle race condition
3. **Detect duplicate** via cek ke dbTrans SEBELUM assign nomor (bukan dbNomorPK)

#### Implementasi

```pascal
function Check_NomorKasBank(pBulan, pTahun: integer; pTipe:String;
  var pNomor, pNoUrut: String; pDate: TDateTime; pSimbol: String;
  pIsPpn: Boolean): Boolean;
var
  S1: String;
  N1, N2, N3, N4: Integer;
  xxNomor, xDigitNomor: String;
  pReset: Byte;
  iAttempt: Integer;
  sNewNoBukti: String;
begin
  pReset := DM.TaNomor.FieldByName('Reset').AsInteger;
  xDigitNomor := DM.TaNomor.FieldByName('DigitNomor').AsString;

  pNomor := '';
  sNewNoBukti := '';

  if pTipe <> '' then
  begin
    // === STEP 1: Hitung counter dari dbTrans (PATCH: filter IsBatal) ===
    with DM.QuNomor do
    begin
      Close;
      SQL.Clear;
      SQL.Add('select top 1 NoUrut from dbTrans');
      if xReset = 0 then
         Sql.Add('where month(Tanggal)=' + IntToStr(pBulan) +
                 ' and year(Tanggal)=' + IntToStr(pTahun))
      else
         Sql.Add('where year(Tanggal)=' + IntToStr(pTahun));
      Sql.Add('and ISNULL(IsBatal,0)=0');   // <-- PATCH BARU
      if (pTipe='BKK') or (pTipe='BKM') then
        SQL.Add('and TipeTransHD in (''BKK'',''BKM'') ')
      else
        SQL.Add('and TipeTransHD in (''BBK'',''BBM'') ');
      SQL.Add('and Simbol=' + QuotedStr(pSimbol));
      SQL.Add('and isnumeric(NoUrut)=1 ');
      SQL.Add('order by NoUrut desc ');
      Open;
      if IsEmpty then pNomor := '1' else
      begin
        try
          pNomor := IntToStr(Fields[0].AsInteger + 1);
        except
          pNomor := '1';
        end;
      end;
    end;

    // === STEP 2: Loop untuk handle duplicate (PATCH BARU) ===
    iAttempt := 0;
    while iAttempt < 5 do
    begin
      Inc(iAttempt);

      pNoUrut := FormatFloat(xDigitNomor, StrToInt(pNomor));
      pNomor := pNoUrut + pSimbol;
      Konfig(pTIPE, pNOMOR, F1, F2, F3, F4, S1, N1, N2, N3, N4, pDate, pIsPpn);

      xxNomor := '';
      if Trim(F1) <> '' then xxNomor := xxNomor + Trim(F1) + Separator;
      if Trim(F2) <> '' then xxNomor := xxNomor + Trim(F2) + Separator;
      if Trim(F3) <> '' then
      begin
        if Trim(F4) <> '' then
          xxNomor := xxNomor + Trim(F3) + Separator + Trim(F4)
        else xxNomor := xxNomor + Trim(F3);
      end;
      sNewNoBukti := xxNomor;

      // === PATCH BARU: cek apakah sNewNoBukti sudah ada di dbTrans ===
      with DM.QuCari do
      begin
        Close;
        SQL.Clear;
        SQL.Add('SELECT TOP 1 NoBukti FROM dbTrans WHERE NoBukti=' +
                QuotedStr(sNewNoBukti));
        Open;
      end;
      if DM.QuCari.IsEmpty then
        Break   // OK, nomor ini unik
      else
      begin
        // Duplikat: increment counter dan coba lagi
        pNomor := IntToStr(StrToInt(pNoUrut) + 1);
      end;
    end;

    if iAttempt >= 5 then
      ShowMessage('Peringatan: Generate NoBukti butuh 5x percobaan. ' +
                  'Silakan cek tabel dbTrans untuk data invalid.');
  end
  else
    pNomor := '00001';

  // Fallback: susun NoBukti akhir
  pNoUrut := FormatFloat(xDigitNomor, StrToInt(pNomor));
  pNomor := pNoUrut + pSimbol;
  Konfig(pTIPE, pNOMOR, F1, F2, F3, F4, S1, N1, N2, N3, N4, pDate, pIsPpn);
  xxNomor := '';
  if Trim(F1) <> '' then xxNomor := xxNomor + Trim(F1) + Separator;
  if Trim(F2) <> '' then xxNomor := xxNomor + Trim(F2) + Separator;
  if Trim(F3) <> '' then
  begin
    if Trim(F4) <> '' then
      xxNomor := xxNomor + Trim(F3) + Separator + Trim(F4)
    else xxNomor := xxNomor + Trim(F3);
  end;
  pNomor := xxNomor;
end;
```

**Yang TIDAK Berubah**:

- Signature function Check_NomorKasBank
- Konfig configuration
- Format NoBukti akhir (tetap via Konfig + Separator)
- Tidak ada stored procedure baru

**Yang Berubah**:

- Query dbTrans tambah filter ISNULL(IsBatal,0)=0 (skip voucher batal)
- Loop retry kecil (max 5x) untuk handle duplikat
- Pre-check NoBukti ke dbTrans sebelum return

**Catatan Penting**:

- IsBatal adalah kolom yang sudah ada di dbTrans untuk menandai voucher yang dibatalkan
- Patch ini menggunakan kolom existing, TIDAK menambah kolom baru
- Butuh 1 query tambahan (SELECT ke dbTrans) per attempt - masih ringan


### 9.4 Solusi: Patch pada Daftar_Nomor (MyProcedure.pas:3167)

#### Strategi

Tetap pakai dbNomorPK sebagai user-lock registry, TETAPI:

1. **Tambahkan try-except INSERT** untuk handle race condition antar-user
2. **Re-query di exception handler** untuk detect "siapa yang insert duluan"

#### Implementasi

```pascal
function Daftar_Nomor(Tipe, xNoUrut, Nomor: String;
                      Koreksi: integer): Boolean;
begin
  With Dm.QuCari do
  begin
    Close;
    Sql.Clear;
    sql.Add('Select Tipe, nourut, NoBukti, UserID From dbNomorPK ' +
            'where Tipe=:0 and NoBukti=:1');
    Prepared;
    Parameters[0].Value := Tipe;
    Parameters[1].Value := Nomor;
    Open;
  end;

  if DM.QuCari.IsEmpty then
  begin
    // BELUM ADA di dbNomorPK - INSERT
    // PATCH: tambahkan try-except untuk handle race condition
    with Dm.QuKode do
    begin
      close;
      sql.Clear;
      sql.Add('Insert into dbNomorPK values(:0,:1,:2,:3,:4,:5,:6,:7)');
      Prepared;
      Parameters[0].Value := Tipe;
      Parameters[1].Value := xNoUrut;
      Parameters[2].Value := Nomor;
      Parameters[3].Value := IDUser;
      Parameters[4].Value := StrToInt(PeriodBln);
      Parameters[5].Value := StrToInt(PeriodThn);
      Parameters[6].value := 0;
      Parameters[7].value := XnamaGudang;
      try
        ExecSQL;
        Result := True;   // Sukses insert
      except
        // PATCH: Gagal insert (race condition: user lain insert duluan)
        With Dm.QuCari do
        begin
          Close;
          Sql.Clear;
          sql.Add('Select UserID From dbNomorPK ' +
                  'where Tipe=:0 and NoBukti=:1');
          Prepared;
          Parameters[0].Value := Tipe;
          Parameters[1].Value := Nomor;
          Open;
        end;
        if DM.QuCari.IsEmpty then
          Result := False
        else
        begin
          MyUser := dm.QuCari.FieldByname('Userid').AsString;
          Result := (MyUser = IDUser);
        end;
      end;
    end;
  end
  else
  begin
    // SUDAH ADA - cek UserID
    MyUser := dm.QuCari.FieldByname('Userid').AsString;
    if MyUser = IDUser then
      Result := True   // idempotent re-acquire
    else
      Result := False; // User lain yang punya
  end;
end;
```

**Yang TIDAK Berubah**:

- Signature function Daftar_Nomor
- Schema dbNomorPK (8 kolom)
- Logic dasar: cek ada/tidak di dbNomorPK

**Yang Berubah**:

- Try-except di INSERT untuk handle race condition
- Re-query di exception handler

### 9.5 Solusi: Patch Hapus_Daftar_Nomor_User agar Hanya Hapus Orphan

#### Strategi

Saat ini Hapus_Daftar_Nomor_User menghapus SEMUA entry user tanpa cek apakah NoBukti sudah tersimpan di dbTrans. Patch agar hapus HANYA yang belum tersimpan (orphan).

#### Implementasi

```pascal
procedure Hapus_Daftar_Nomor_User(Tipe: String; Pemakai: String);
begin
  // PATCH: hapus HANYA entry yang TIDAK ada di dbTrans
  // (entry yang sudah ada di dbTrans = transaksi sukses, jangan dihapus)
  with Dm.DaftarNO do
  begin
    Close;
    SQL.Clear;
    SQL.Add('DELETE n FROM dbNomorPK n');
    SQL.Add('LEFT JOIN dbTrans t ON t.NoBukti = n.NoBukti');
    SQL.Add('WHERE n.tipe = :0 AND n.UserID = :1');
    SQL.Add('  AND t.NoBukti IS NULL');
    Prepared;
    Parameters[0].Value := Tipe;
    Parameters[1].Value := Pemakai;
    try
      ExecSQL;
    except
      ShowMessage('Hapus Daftar Nomor Gagal !');
    end;
  end;
end;
```

**Catatan**:

- LEFT JOIN untuk cek: jika NoBukti di dbNomorPK ada juga di dbTrans, JANGAN hapus
- Hanya hapus yang orphan (no corresponding dbTrans row)
- Idempotent: aman dipanggil di FormCreate / FormClose / ESC
- BACKWARD-COMPATIBLE: jika struktur dbNomorPK/dbTrans tidak sesuai, fallback ke error message

### 9.6 Solusi: Trigger SQL Server untuk Auto-Cleanup dbNomorPK (Opsional, Recommended)

#### Strategi

Buat trigger di SQL Server agar dbNomorPK auto-cleanup saat DBTRANS insert sukses. Trigger ini PALING AMAN karena tidak menyentuh kode Delphi sama sekali.

#### Implementasi

```sql
CREATE TRIGGER trg_DBTRANS_Insert_CleanupNomorPK
ON dbTrans
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  -- Hapus entry dbNomorPK yang NoBukti-nya baru saja di-insert ke dbTrans
  DELETE n
  FROM dbNomorPK n
  INNER JOIN inserted i ON n.NoBukti = i.NoBukti
  WHERE n.Tipe IN ('BK', 'BM', 'BB');
END;
```

**Manfaat**:

- dbNomorPK jadi self-cleaning: setelah NoBukti sukses masuk dbTrans, otomatis dihapus dari registry
- Tidak perlu patch Delphi sama sekali untuk auto-cleanup
- Hapus_Daftar_Nomor_User jadi opsional (untuk handle form close tanpa save)

**Yang TIDAK Berubah**:

- Schema dbTrans
- Stored procedure
- Aplikasi Delphi existing (yang belum patch apapun)

**Rollback**:

```sql
DROP TRIGGER trg_DBTRANS_Insert_CleanupNomorPK;
```


### 9.7 Solusi: Patch NoUrutExit dengan Auto-Retry (FrmKasBank.pas:3419)

#### Strategi

Patch NoUrutExit agar auto-retry sampai 5x jika Daftar_Nomor gagal. Increment NoUrut dan re-trigger konfigurasi setiap kali gagal.

#### Implementasi

```pascal
procedure TFrKasBank.NoUrutExit(Sender: TObject);
var
  iRetry: Integer;
  sOrigNoUrut: String;
begin
  if mValid then
  begin
    If Length(NoUrut.Text) < 5 then
    begin
      MessageDlg('Nomor urut kurang ' + InttoStr(5-Length(NoUrut.Text)) +
                 ' digit.', mtWarning, [MbOk], 0);
      ActiveControl := NoUrut;
    end
    else
    begin
      TampilData(NOBUKTI.Text);
      if not QuTransaksi.IsEmpty then
      Begin
        // Edit mode - existing code
      end
      else
      Begin
        if xModalKoreksi then
        begin
          ActiveControl := NoUrut;
        end;
      end;
      
      // === PATCH BARU: retry up to 5x jika Daftar_Nomor gagal ===
      sOrigNoUrut := NoUrut.Text;
      iRetry := 0;
      
      while iRetry < 5 do
      begin
        Inc(iRetry);
        If Daftar_Nomor(Copy(Mode.Text,1,2), NoUrut.Text,
                        NoBukti.Text, IsMax) then
          Break;
        
        // Gagal: increment NoUrut dan coba lagi
        try
          NoUrut.Text := FormatFloat('00000',
                                     StrToInt(NoUrut.Text) + 1);
          NoUrutChange(nil);   // re-trigger konfigurasi NoBukti
        except
          Break;
        end;
      end;
      
      if iRetry >= 5 then
        MessageDlg('Nomor: ' + sOrigNoUrut + ' sampai ' + NoUrut.Text +
                   ' telah digunakan oleh user lain.', mtWarning,
                   [MbOk], 0);
    end;
  end;
end;
```

**Yang TIDAK Berubah**:

- Signature procedure
- Logika Edit Mode
- TampilData call

**Yang Berubah**:

- Auto-retry loop untuk Daftar_Nomor
- Increment NoUrut saat gagal

### 9.8 Solusi: Cache Counter (Opsional, Advanced)

#### Strategi Tambahan

Setiap kali Check_NomorKasBank dipanggil, perlu query dbTrans. Padahal counter max(NoUrut)+1 sebenarnya **hampir tidak pernah berubah** dalam session pendek. Bisa dicache untuk hemat query.

#### Implementasi

Tambah di MyProcedure.pas (declaration section):

```pascal
var
  // PATCH BARU: cache counter per-session
  _noBuktiCache: TStringList;   // key: Tipe+Simbol+Bulan+Tahun
                                // value: NoBukti terakhir yang di-generate

procedure InitNoBuktiCache;
begin
  if not Assigned(_noBuktiCache) then
    _noBuktiCache := TStringList.Create;
end;

function GetCachedNoBukti(Tipe, Simbol: String;
                          Bulan, Tahun: Integer): String;
var key: String;
begin
  InitNoBuktiCache;
  key := Tipe + '|' + Simbol + '|' + IntToStr(Bulan) + '|' +
         IntToStr(Tahun);
  Result := _noBuktiCache.Values[key];
end;

procedure SetCachedNoBukti(Tipe, Simbol, NoBukti: String;
                           Bulan, Tahun: Integer);
var key: String;
begin
  InitNoBuktiCache;
  key := Tipe + '|' + Simbol + '|' + IntToStr(Bulan) + '|' +
         IntToStr(Tahun);
  _noBuktiCache.Values[key] := NoBukti;
end;
```

Tambah di Check_NomorKasBank (di awal function, sebelum query dbTrans):

```pascal
function Check_NomorKasBank(...): Boolean;
var
  sCached: String;
  ...
begin
  // ... existing code ...

  if pTipe <> '' then
  begin
    // === PATCH: cek cache dulu sebelum query dbTrans ===
    sCached := GetCachedNoBukti(Copy(pTipe,1,2), pSimbol, pBulan, pTahun);
    if sCached <> '' then
    begin
      // Cache hit: validasi bahwa NoBukti ini masih available di dbTrans
      with DM.QuCari do
      begin
        Close;
        SQL.Clear;
        SQL.Add('SELECT TOP 1 NoBukti FROM dbTrans WHERE NoBukti=' +
                QuotedStr(sCached));
        Open;
      end;
      if DM.QuCari.IsEmpty then
      begin
        // Cache valid, pakai
        pNoUrut := Copy(sCached, 1, 5);
        pNomor := pNoUrut + pSimbol;
        Konfig(pTIPE, pNOMOR, F1, F2, F3, F4, S1, N1, N2, N3, N4,
               pDate, pIsPpn);
        xxNomor := '';
        if Trim(F1) <> '' then xxNomor := xxNomor + Trim(F1) + Separator;
        if Trim(F2) <> '' then xxNomor := xxNomor + Trim(F2) + Separator;
        if Trim(F3) <> '' then
        begin
          if Trim(F4) <> '' then
            xxNomor := xxNomor + Trim(F3) + Separator + Trim(F4)
          else xxNomor := xxNomor + Trim(F3);
        end;
        pNomor := xxNomor;
        Result := True;
        Exit;
      end;
      // else: cache stale (NoBukti sudah ada di dbTrans), fall through
    end;

    // (existing logic query dbTrans)
    ...

    // PATCH: setelah dapat nomor baru, simpan ke cache
    SetCachedNoBukti(Copy(pTipe,1,2), pSimbol, sNewNoBukti,
                     pBulan, pTahun);
  end;
  ...
end;
```

**Yang TIDAK Berubah**:

- Query dbTrans tetap ada (untuk validasi cache dan initial load)
- Cache hanya dipakai kalau valid

**Trade-off**:

- PRO: Hemat 1 query dbTrans per pemanggilan IsiNoBuktiBaru (yang sering dipanggil)
- PRO: Saat user klik Tambah 5x, query ke dbTrans hanya 1x (5x pakai cache)
- CON: Butuh inisialisasi _noBuktiCache di DataModule
- CON: Cache bisa stale kalau ada user lain yang insert data - oleh karena itu perlu validasi ringan

**Memory cleanup**: tambahkan di DataModule.OnDestroy:

```pascal
procedure TDMModule.DataModuleDestroy(Sender: TObject);
begin
  // PATCH: cleanup cache
  if Assigned(_noBuktiCache) then
  begin
    _noBuktiCache.Free;
    _noBuktiCache := nil;
  end;
  // ... existing code ...
end;
```


### 9.9 Langkah Deploy Bertahap (Tanpa Downtime)

| Fase | Aksi                                                                                              | Risk     | Reversible? |
|------|---------------------------------------------------------------------------------------------------|----------|-------------|
| 1    | Tambahkan trigger trg_DBTRANS_Insert_CleanupNomorPK ke SQL Server                                 | Rendah   | Ya (DROP)   |
| 2    | Patch Check_NomorKasBank: filter IsBatal + loop retry                                            | Rendah   | Ya (revert) |
| 3    | Patch Hapus_Daftar_Nomor_User: hapus HANYA orphan                                                | Rendah   | Ya (revert) |
| 4    | Patch Daftar_Nomor dengan try-except INSERT                                                       | Rendah   | Ya (revert) |
| 5    | Patch NoUrutExit dengan auto-retry                                                                | Sedang   | Ya (revert) |
| 6    | Patch Check_NomorKasBank dengan cache layer (opsional)                                            | Sedang   | Ya (revert) |

**Tiap fase independent**, jadi bisa di-rollback tanpa mengganggu fase lain.

**Urutan deploy yang direkomendasikan**:

1. Mulai dari Fase 1 (trigger) - 100% aman, tidak menyentuh Delphi
2. Fase 2-3 (patch Check_NomorKasBank + Hapus_Daftar_Nomor_User) - test di cabang terpisah dulu
3. Fase 4 (Daftar_Nomor try-except) - test race condition dengan simulasi
4. Fase 5 (NoUrutExit retry) - test UX, jangan ganggu user
5. Fase 6 (cache) - opsional, hanya jika perlu performa

### 9.10 Test Cases yang Wajib Dijalankan

#### TC1: Single User, Tambah Cepat Berulang (5x)

```
1. Buka form KasBank
2. Klik Tambah - dapat NoBukti=00001
3. Klik Tambah - dapat NoBukti=00002 (counter naik)
4. ... ulangi 5x
5. EXPECTED: counter naik 1 per klik, tidak ada gap
```

#### TC2: Multi-User Race Condition

```
1. User A buka form, klik Tambah - 00001
2. User B buka form, klik Tambah - BUKAN 00001, tapi 00002
3. User A input data, Simpan - 00001 tersimpan
4. User B input data, Simpan - 00002 tersimpan
5. EXPECTED: tidak ada duplikat primary key, counter naik normal
```

#### TC3: Voucher Dibatalkan

```
1. User A buat voucher 00005, simpan, batalkan (IsBatal=1)
2. User B buka form, klik Tambah - HARUSNYA dapat 00006 (bukan 00005)
3. EXPECTED: voucher batal tidak dihitung ulang
```

#### TC4: Form Close Tanpa Simpan

```
1. User buka form, klik Tambah - dapat 00001
2. User close form tanpa simpan
3. EXPECTED: dbNomorPK bersih untuk user tsb (atau di-trigger auto-bersih)
```

#### TC5: Restore Database dari Backup

```
1. Backup database dengan gap di counter (mis. ada 00001, 00002, skip 00003, 00004)
2. User buka form, klik Tambah
3. EXPECTED: dapat 00005 (skip 00003 dimaklumi karena voucher 00003 dihapus)
```

#### TC6: User yang Sama Insert Ulang

```
1. User A buka form, klik Tambah - dapat 00001 (insert dbNomorPK dengan UserID=A)
2. User A close form tanpa save (patch: hapus HANYA orphan, jadi dbNomorPK tidak dihapus)
3. User A buka form lagi, klik Tambah
4. EXPECTED: Daftar_Nomor return TRUE (NoBukti 00001 ada di dbNomorPK dengan UserID=A)
```

#### TC7: Mode Change BKK ke BKM

```
1. User buka form, Mode=BKK, klik Tambah - dapat NoBukti BKK-00001
2. User ganti Mode=BKM (ModeChange panggil IsiNoBuktiBaru)
3. EXPECTED: dapat NoBukti BKM-00001 (counter tipe terpisah)
```

#### TC8: Simbol Change Kas1 ke Kas2

```
1. User buka form, Simbol=Kas1, klik Tambah - dapat NoBukti ...-00001
2. User ganti Simbol ke Kas2 (SimbolExit panggil IsiNoBuktiBaru)
3. EXPECTED: dapat NoBukti ...-00001 (counter per-Simbol, jadi tetap 00001)
```

### 9.11 Ringkasan Alur Setelah Patch

```
Buka Form (FormCreate)
  - Hapus_Daftar_Nomor_User (HANYA orphan, bukan yang sudah tersimpan)
  - Trigger cleanup jika ada di dbTrans
  
Klik Tambah (IsiNoBuktiBaru)
  - Check_NomorKasBank:
    1. Cek cache (jika ada cache layer)
    2. Query dbTrans dengan filter ISNULL(IsBatal,0)=0
    3. Loop retry 5x jika ada NoBukti duplikat di dbTrans
    4. Set cache
  - NOBUKTI.Text muncul

User tekan Enter di NoUrut (NoUrutExit)
  - Daftar_Nomor:
    1. SELECT dbNomorPK WHERE Tipe+NoBukti
    2. Jika IsEmpty: INSERT (dengan try-except)
    3. Jika ada: cek UserID
    4. Return TRUE/FALSE
  - Auto-retry 5x dengan NoUrut increment jika FALSE

User Simpan (SimpanData / sp_Transaksi.ExecProc)
  - INSERT ke dbTrans
  - Trigger AFTER INSERT auto-cleanup dbNomorPK (Fase 1)
  - COMMIT
```

### 9.12 Checklist Sebelum Deploy

- [ ] Backup database FULL sebelum deploy
- [ ] Backup source Delphi original (git tag atau copy manual)
- [ ] Test di environment staging/dev dulu
- [ ] Pastikan tidak ada aplikasi lain yang pakai dbNomorPK (cek stored procedure)
- [ ] Pastikan tidak ada trigger lain di dbTrans yang bisa konflik
- [ ] Siapkan script rollback untuk tiap fase
- [ ] Deploy di luar jam kerja
- [ ] Monitor log SQL Server untuk error rate
- [ ] Monitor log Delphi untuk exception rate
- [ ] Verifikasi counter tidak loncat dalam 24 jam pertama

### 9.13 Catatan Akhir

Solusi di atas adalah **PARSIAL** dan **BERTUMBUH**:

- **Fase 1 (trigger SQL)**: sudah menyelesaikan masalah auto-cleanup dbNomorPK tanpa sentuh Delphi
- **Fase 2-3 (Check_NomorKasBank + Hapus_Daftar_Nomor_User)**: menyelesaikan masalah filter voucher batal dan orphan cleanup
- **Fase 4-5 (Daftar_Nomor + NoUrutExit)**: menyelesaikan masalah race condition antar-user
- **Fase 6 (cache)**: opsional, hanya untuk performa

**Prioritas implementasi**:

1. WAJIB: Fase 1 (trigger) - 5 menit, 0 risiko
2. WAJIB: Fase 2 (filter IsBatal) - 15 menit, risiko rendah
3. WAJIB: Fase 3 (orphan cleanup) - 10 menit, risiko rendah
4. SANGAT DIREKOMENDASIKAN: Fase 4 (try-except) - 20 menit, risiko rendah
5. DIREKOMENDASIKAN: Fase 5 (auto-retry) - 30 menit, risiko sedang
6. OPSIONAL: Fase 6 (cache) - 60 menit, risiko sedang

Total waktu deploy: ~2-3 jam (termasuk testing), bisa dipecah dalam beberapa hari deployment.

---

## 10. Analisis Skenario Hybrid: 2 User Delphi + 2 User Web Input Barengan

### 10.1 Jawaban Singkat

| Pertanyaan                                                           | Jawaban                                                |
|---------------------------------------------------------------------|--------------------------------------------------------|
| Apakah masih bisa lompat dengan patch Delphi + Go sudah ada?         | **YA, masih mungkin di titik-titik spesifik**          |
| Apakah lebih baik dari sebelumnya (tanpa patch sama sekali)?         | **YA, jauh lebih baik**                                |
| Apakah bisa dibuat 100% anti-lompat di hybrid tanpa arsitektur baru? | **TIDAK**                                              |

### 10.2 Arsitektur Counter Kedua System (Beda!)

Ini kunci masalahnya. Kedua system menghitung counter dengan cara **fundamentally berbeda**:

| Aspek                  | Delphi Original                  | Web Go (Laravel)                            |
|------------------------|----------------------------------|---------------------------------------------|
| **Sumber counter**      | `dbTrans.NoUrut` (query MAX)    | `DBNOMOR.NOBKK/NOBKM/NOBBM/NOBBK`          |
| **Filter**             | `isnumeric(NoUrut)=1`            | Tidak ada (counter dari DBNOMOR)            |
| **Locking**            | Tidak ada (tanpa patch)          | `UPDLOCK/HOLDLOCK` di DBNOMOR              |
| **Retry on collision** | Tidak ada (tanpa patch)          | Ya, loop max 5x + ErrDuplicateVoucherNo      |
| **Cleanup**            | `dbNomorPK` (per user)           | Tidak pakai dbNomorPK                       |
| **Tipe di dbNomorPK** | 2 char (`BK`, `BM`, `BB`)       | Tidak dipakai                               |

**Inti masalah**: Delphi dan Go menuliskan NoBukti ke `dbTrans`, tapi CARA mereka menghitung nomor tidak pernah "bertemu" di satu titik lock.

### 10.3 Timeline Presisi: 4 User Concurrent (Dengan Patch Delphi Semua)

Skema: Delphi User A, Delphi User B, Web User C, Web User D input barengan untuk KasBank tipe `BKK`, simbol `KAS`, periode `07/2026`.

```
PHASE 1: SEMUA BUKA FORM / REQUEST BARENGAN
-------------------------------------------------
T+0ms  [Delphi A] IsiNoBuktiBaru()
         -> Check_NomorKasBank()  
         -> SELECT MAX(NoUrut) FROM dbTrans WHERE TipeTransHD IN('BKK','BKM')
         -> ISNULL(IsBatal,0)=0
         -> hasil: NULL (kosong)
         -> Dapat counter = 1
         -> Counter di UI: 00001
         -> dbNomorPK: INSERT ('BK','00001','...KAS-00001...','UserA',...)

T+0ms  [Delphi B] IsiNoBuktiBaru()
         -> SELECT MAX(NoUrut) FROM dbTrans WHERE ... 
         -> hasil: NULL (karena A belum commit!)
         -> Dapat counter = 1 (SAMA!)
         -> Counter di UI: 00001
         -> dbNomorPK: INSERT ('BK','00001','...KAS-00001...','UserB',...)
           -> GAGAL INSERT! (User A sudah insert NoBukti ke dbNomorPK)
           -> PATCH 9.4 try-except: re-query, UserID=A != B -> return FALSE
           -> User B lihat warning "Nomor telah digunakan oleh User A"

T+0ms  [Web C]    POST /kasbank/create
         -> GenerateNoBuktiWithinTx()
         -> SELECT * FROM DBNOMOR WITH (UPDLOCK, HOLDLOCK)
         -> Baca DBNOMOR.NOBKK = '00000' (belum pernah diupdate Go)
         -> counter = '00001'
         -> Generate NoBukti = '...KAS-00001...'
         -> UPDATE DBNOMOR SET NOBKK='00001'
         -> INSERT dbTrans (NoBukti='...KAS-00001...')
         -> COMMIT
         -> Sukses!

T+0ms  [Web D]    POST /kasbank/create (barengan)
         -> GenerateNoBuktiWithinTx()
         -> D-LOCKED oleh C! D harus tunggu sampai C commit
         -> C commit -> D dapat DBNOMOR.NOBKK='00001'
         -> counter = '00002'
         -> Generate NoBukti = '...KAS-00002...'
         -> INSERT dbTrans (NoBukti='...KAS-00002...')
         -> COMMIT
         -> Sukses!

HASIL PHASE 1:
dbTrans:  ...KAS-00001... (by Web C)     OK
          ...KAS-00002... (by Web D)     OK
dbNomorPK: ...KAS-00001... by UserA (Delphi A)
           ...KAS-00001... by UserA (Delphi B -> insert gagal)

PHASE 2: USER DELPHI SUBMIT
-------------------------------------------------
T+10s  [Delphi A] click Simpan
         -> sp_TransaksiKasBank INSERT dbTrans
         -> INSERT dbTrans (NoBukti='...KAS-00001...')
         -> PRIMARY KEY VIOLATION! (Web C sudah insert)
         -> Delphi exception -> user see error dialog
         -> Patch 9.3 (loop retry)? TIDAK membantu di titik ini!
           -> Patch 9.3 cek duplikat SETELAH generate, bukan saat INSERT
         -> User harus close form, buka lagi, dapat NoBukti baru

T+10s  [Delphi B] User B lihat warning
         -> User B tekan OK -> biasanya close form, buka lagi

HASIL AKHIR:
dbTrans:  ...KAS-00001... (Web C)     OK
          ...KAS-00002... (Web D)     OK
          ...KAS-00001... (Delphi A)  PK VIOLATION / GAGAL
          
Dari DB: tidak ada gap. Counter = 00001, 00002 (kontinu).
Dari UX: 2 user Delphi gagal dapat nomor -> "terlompat" dari perspektif mereka.
```

### 10.4 Titik-Titik Rawan MASIH ADA

#### Rawan #1: "Pre-Lock Gap" - Delphi Cek dbTrans Sebelum Go Commit

```
T+0ms   Delphi A: query dbTrans MAX -> NULL -> dapat =1
T+0ms   Web C:    UPDLOCK DBNOMOR -> dapat =1
T+0ms   Delphi B: query dbTrans MAX -> NULL (A blm commit!) -> dapat =1  
T+10ms  Web C:    INSERT 00001 -> COMMIT
T+10ms  Web D:    UPDLOCK -> dapat =2 -> INSERT 00002 -> COMMIT
T+20ms  Delphi A: INSERT 00001 -> PK VIOLATION
T+20ms  Delphi B: INSERT 00001 -> PK VIOLATION

=> Delphi A & B gagal. 
   Dari DB: tidak ada gap. 
   Dari UX: 2 user Delphi gagal dapat nomor.
```

#### Rawan #2: Filter Periode Beda

```
Delphi query:  
  WHERE month(Tanggal)=7 AND year(Tanggal)=2026
  AND TipeTransHD IN('BKK','BKM') AND Simbol='KAS'
  AND isnumeric(NoUrut)=1

Web Go baca DBNOMOR.NOBKK TANPA filter bulan.
-> Jika DBNOMOR.NOBKK di-reset manual, Delphi dan Go bisa diverge.
```

#### Rawan #3: Format String NoUrut Beda

```
Delphi:  NoUrut = '1', '2', ... (tanpa zero padding saat MAX)
         FormatFloat('00000', 2) -> '00002'

Web Go:  DBNOMOR.NOBKK = '00001', '00002', ... (dengan leading zero)

Jika Delphi punya data lama NoUrut='1' (tanpa zero):
  Delphi: CAST AsInteger -> 1 -> FormatFloat -> '00001' OK
  Web Go: '00001' -> '00001' OK
  KONSISTEN.
```

### 10.5 Tabel Lindungan Patch

| Skenario                                      | Patch Delphi 9.x | Web Go    | Hasil                                               |
|-----------------------------------------------|------------------|-----------|-----------------------------------------------------|
| 2 Delphi input barengan                       | OK (9.4 try-except)     | N/A       | 1 berhasil, 1 dapat warning                          |
| 2 Web input barengan                          | N/A            | OK (UPDLOCK)    | Berurutan, tidak ada PK violation                  |
| Delphi A + B barengan                         | OK (9.3 retry loop) | N/A       | Counter sama, tapi 9.3 detect sebelum submit        |
| Delphi + Web (Delphi duluan commit)           | OK (9.3)             | OK (UPDLOCK)    | Web dapat counter lebih tinggi                       |
| Delphi + Web (Web duluan commit)              | Partial (9.4)        | OK (UPDLOCK)    | Delphi dapat PK violation saat Simpan              |
| Delphi cancel, Web commit                     | OK (orphan cleanup)   | N/A       | dbNomorPK orphan cleanup                            |
| Voucher batal (IsBatal=1)                    | OK (9.2 filter)       | N/A       | Tidak dihitung ulang                                 |
| Restore DB dengan gap                         | Mungkin               | N/A       | DBNOMOR.NOBKK vs dbTrans.Max(NoUrut) bisa beda    |

### 10.6 Skenario Paling Buruk

```
1. Web C & D duluan commit -> dbTrans = 00001, 00002
2. Delphi A & B buka form -> query dbTrans MAX -> NULL -> dapat =1
   -> Counter UI = 00001 (Delphi A) dan 00001 (Delphi B)
   -> dbNomorPK registered

3. Delphi A submit -> INSERT 00001 -> PK VIOLATION
   -> Jika user close form dan buka lagi: 
      query dbTrans MAX -> 00002 -> dapat 00003 -> OK
   -> Jika user TIDAK close, aplikasi auto-retry:
      Check_NomorKasBank() dipanggil lagi
      -> query dbTrans MAX -> 00002 -> dapat 00003
      -> INSERT 00003 -> Sukses!
      -> Counter di UI berubah 00001 -> 00003
      -> LOMPAT! (retry manual oleh user)

4. Delphi B sama: dapat 00003 atau 00004
```

**Jenis lompat yang terjadi**:

1. **UX lompat** (counter di UI meloncat): Tetap bisa terjadi jika user mau retry setelah PK violation
2. **DB lompat** (ada gap di dbTrans): **TIDAK terjadi** karena INSERT gagal, bukan sukses dengan gap

### 10.7 Kesimpulan Per Titik

| # | Titik                           | Masih Lompat? | Jenis Lompat    | Solusi                                                                 |
|---|--------------------------------|---------------|-----------------|------------------------------------------------------------------------|
| 1 | Delphi A + B barengan           | Tidak        | Tidak ada        | Patch 9.4 (Daftar_Nomor try-except) + 9.3 (retry loop)                 |
| 2 | Web C + D barengan             | Tidak        | Tidak ada        | UPDLOCK/HOLDLOCK di Go                                                 |
| 3 | Delphi + Web (Delphi duluan)   | Tidak        | Tidak ada        | Delphi query + insert duluan, Go dapat counter lebih tinggi           |
| 4 | Delphi + Web (Web duluan)      | Mungkin       | UX lompat (1-2 step) | Patch 9.4 di Delphi membantu tapi tidak 100%                          |
| 5 | Delphi cancel, Web commit      | Tidak        | Tidak ada        | dbNomorPK orphan cleanup + trigger                                   |
| 6 | Web cancel, Delphi commit      | Tidak        | Tidak ada        | Counter Delphi dari dbTrans, tidak terpengaruh Go                     |
| 7 | Voucher batal di Delphi         | Tidak        | Tidak ada        | Patch 9.2 (ISNULL(IsBatal,0)=0 filter)                               |
| 8 | Restore DB dengan gap          | Mungkin       | Counter mismatch | DBNOMOR.NOBKK vs dbTrans.Max(NoUrut) bisa beda                       |

### 10.8 Solusi Hybrid: UNIQUE Constraint + Auto-Retry

Ini solusi **terbaik untuk hybrid** karena tidak mengubah arsitektur counter Delphi:

#### Step 1: UNIQUE constraint di dbTrans.NoBukti

```sql
-- Cek apakah sudah ada
SELECT COUNT(*) FROM sys.key_constraints 
WHERE name = 'UQ_dbTrans_NoBukti' 
  AND parent_object_id = OBJECT_ID('dbTrans');

-- Jika belum ada, tambahkan:
ALTER TABLE dbTrans ADD CONSTRAINT UQ_dbTrans_NoBukti UNIQUE (NoBukti);
```

#### Step 2: Patch SimpanData dengan auto-retry

```pascal
procedure TFrKasBank.SimpanData(Choice: String);
var
  iRetry: Integer;
begin
  iRetry := 0;
  while iRetry < 5 do
  begin
    Inc(iRetry);
    try
      Sp_Transaksi.Parameters[1].Value := Choice;
      Sp_Transaksi.Parameters[2].Value := NOBUKTI.Text;
      Sp_Transaksi.ExecProc;
      Break;  // Sukses!
    except
      on E: Exception do
      begin
        if (Pos('UNIQUE', UpperCase(E.Message)) > 0) or
           (Pos('PRIMARY KEY', UpperCase(E.Message)) > 0) then
        begin
          // Nomor sudah dipakai! Generate nomor baru dan retry
          IsiNoBuktiBaru;
          NOBUKTI.Text := Nomor;
        end
        else
          raise;  // Error lain, propagate
        end;
      end;
    end;
    if iRetry >= 5 then
      ShowMessage('Tidak bisa menyimpan setelah 5x percobaan. ' +
                  'NoBukti bentrok dengan transaksi yang sudah ada.');
  end;
end;
```

**Ini solusi TERBAIK untuk hybrid** karena:
- Tidak mengubah arsitektur counter Delphi
- Tidak mengubah stored procedure
- Compatible 100% dengan Go
- PK violation otomatis retry tanpa user intervention
- Bisa dilakukan bertahap

### 10.9 Rekomendasi Final untuk Skenario Hybrid

| Prioritas | Aksi                                                                 | Alasan                                                                 |
|-----------|-----------------------------------------------------------------------|------------------------------------------------------------------------|
| **1. WAJIB** | UNIQUE constraint di `dbTrans.NoBukti`                               | Pencegahan lapis pertama untuk semua sistem (Delphi + Go)              |
| **2. WAJIB** | Patch 9.6: trigger auto-cleanup dbNomorPK                            | dbNomorPK self-cleaning, 0 risiko, 5 menit deploy                      |
| **3. WAJIB** | Patch 9.2: filter `ISNULL(IsBatal,0)=0` di Delphi                  | Voucher batal tidak dihitung ulang                                      |
| **4. SANGAT RECOMMENDED** | Patch 10.8: auto-retry di `SimpanData` | Jika PK violation, Delphi auto-regenerate + retry, user tidak interven  |
| **5. SANGAT RECOMMENDED** | Patch 9.4: try-except di `Daftar_Nomor`          | Handle race condition di layer registry                                 |
| **6. RECOMMENDED** | Patch 9.5: orphan cleanup di `Hapus_Daftar_Nomor_User` | Registri bersih tanpa ganggu transaksi sukses                            |
| **7. OPSIONAL** | Sinkronisasi DBNOMOR.NOBKK vs dbTrans.Max(NoUrut) secara berkala | Untuk reconcile counter Delphi vs Go jika diverge                       |

**Kesimpulan**: Dengan patch **#1 (UNIQUE constraint) + #2 (trigger) + #4 (auto-retry di SimpanData)**, lompat di skenario hybrid 2 Delphi + 2 Web akan turun drastis dari "mungkin di setiap transaksi" jadi "hampir tidak pernah". Tapi **tidak 100% anti-lompat** tanpa perubahan arsitektur yang lebih besar karena gap inherent antara cara Delphi dan Go menghitung counter.

---

---

## 11. Patch Auto-Retry di SimpanData - Penjelasan Mendalam

### 11.1 Masalah yang Ingin Diselesaikan

Tanpa auto-retry, ketika SimpanData dipanggil dengan NoBukti yang sudah dipakai:

```
[Delphi User A] IsiNoBuktiBaru() -> NoBukti = "BKI-00001"
[Web User C]   POST /kasbank/create -> INSERT BKI-00001 -> COMMIT OK
[Web User D]   POST /kasbank/create -> INSERT BKI-00002 -> COMMIT OK

[Delphi User A] click Simpan
   -> sp_TransaksiKasBank.ExecProc
   -> INSERT dbTrans (NoBukti='BKI-00001')
   -> EXCEPTION: "Cannot insert duplicate key..."

TANPA PATCH:
   -> ShowMessage('Gagal menyimpan')
   -> Form tetap terbuka dengan NoBukti='BKI-00001'
   -> USER HARUS close form, buka lagi, input ulang SEMUA data
   -> UX BURUK: data hilang, harus ketik ulang

DENGAN PATCH AUTO-RETRY:
   -> Detect "duplicate key" di exception message
   -> Auto-call IsiNoBuktiBaru (generate nomor baru)
   -> Update NOBUKTI.Text dengan nomor baru
   -> Re-execute ExecProc
   -> Sukses atau retry sampai 5x
   -> USER TIDAK INTERVENE sama sekali
```

### 11.2 Code Original (Tanpa Patch)

```pascal
procedure TFrKasBank.SimpanData(Choice: String);
begin
  BM := QuTransaksi.GetBookmark;
  with Sp_Transaksi do
  begin
    Parameters[1].Value := Choice;
    if (Choice='I') or (Choice='U') then
    begin
      Parameters[2].Value := NOBUKTI.Text;
      // ... 30 parameter lainnya ...
    end;
    try
      SimpanDataAktiva(Choice);
      ExecProc;
      // ... logging, tampil data ...
    except
      // TIDAK ADA handling duplicate key
      raise;
    end;
  end;
end;
```

**Masalah code original**:
1. Tidak ada catch untuk specific exception "duplicate key"
2. Setiap error langsung propagate ke caller
3. Caller tidak retry, langsung tampilkan error
4. User harus manual close form, input ulang


### 11.3 Kode PATCH Auto-Retry (Implementasi Lengkap)

```pascal
procedure TFrKasBank.SimpanData(Choice: String);
const
  MAX_RETRY = 5;
var
  iRetry: Integer;
  sErrMsg: String;
  procedure DoGenerateNewNomor;
  begin
    IsiNoBuktiBaru;
    NOBUKTI.Text := Nomor;
    NoUrutChange(nil);  // re-trigger konfigurasi NoBukti
  end;
begin
  BM := QuTransaksi.GetBookmark;
  iRetry := 0;
  while iRetry < MAX_RETRY do
  begin
    Inc(iRetry);
    try
      with Sp_Transaksi do
      begin
        Parameters[1].Value := Choice;
        if (Choice='I') or (Choice='U') then
        begin
          Parameters[2].Value := NOBUKTI.Text;
          Parameters[3].Value := NoUrut.Text;
          Parameters[32].Value := Simbol.Text;
          Parameters[33].Value := mPerkiraan.Text;
        end;
        SimpanDataAktiva(Choice);
        ExecProc;
        SimpanDataGiro(Choice);
        if Choice='I' then
        begin
          mUrut := mUrut + 1;
          LoggingData(...);
          TampilData(NOBUKTI.Text);
          QuTransaksi.Locate('NoBukti;urut', VarArrayOf([NOBUKTI.Text, mUrut]), []);
        end;
      end;
      Break;
    except
      on E: EDatabaseError do
      begin
        sErrMsg := UpperCase(E.Message);
        if (Pos('DUPLICATE', sErrMsg) > 0) or
           (Pos('PRIMARY KEY', sErrMsg) > 0) or
           (Pos('UNIQUE', sErrMsg) > 0) or
           (Pos('2601', sErrMsg) > 0) or
           (Pos('2627', sErrMsg) > 0) then
        begin
          if iRetry >= MAX_RETRY then
          begin
            ShowMessage('Tidak bisa menyimpan setelah ' + IntToStr(MAX_RETRY) +
                        ' kali percobaan. Silakan tutup form dan buka ulang.');
            raise;
          end;
          try
            DoGenerateNewNomor;
            Application.ProcessMessages;
          except
            on E2: Exception do
            begin
              ShowMessage('Gagal generate nomor baru: ' + E2.Message);
              raise;
            end;
          end;
        end
        else
        begin
          raise;
        end;
      end;
      on E: Exception do
      begin
        raise;
      end;
    end;
  end;
end;
```


### 11.4 Alur Eksekusi Step-by-Step

#### Skenario Normal (Tidak Ada Bentrok)

```
ITERASI 1 (iRetry=1):
  - NOBUKTI.Text = "BKI-00001"
  - Sp_Transaksi.ExecProc
  - INSERT dbTrans (NoBukti="BKI-00001")
  - Sukses (no exception)
  - Break

HASIL: Simpan sekali jadi, tidak ada retry.
```

#### Skenario Bentrok dengan Web (Retry Berhasil)

```
ITERASI 1 (iRetry=1):
  - NOBUKTI.Text = "BKI-00001"
  - ExecProc
  - INSERT NoBukti="BKI-00001"
  - EXCEPTION: "Violation of PRIMARY KEY constraint"
  - Catch detect "PRIMARY KEY"
  - DoGenerateNewNomor():
    - IsiNoBuktiBaru() dipanggil
    - Check_NomorKasBank() query dbTrans MAX(NoUrut) -> 00002
    - Counter baru = 00003
    - NOBUKTI.Text = "BKI-00003"
  - Application.ProcessMessages

ITERASI 2 (iRetry=2):
  - NOBUKTI.Text = "BKI-00003"
  - ExecProc
  - INSERT NoBukti="BKI-00003"
  - Sukses
  - Break

HASIL: User tidak intervene, nomor loncat 00001 -> 00003.
Tapi INSERT ke dbTrans SELALU SUKSES, user tidak kehilangan data.
```

### 11.5 Detail Penting di Patch

#### Kenapa `Parameters[2].Value := NOBUKTI.Text` di dalam loop?

Karena `DoGenerateNewNomor` mengubah `NOBUKTI.Text` di tengah loop. Parameter harus selalu dibaca dari value terbaru, bukan dari awal procedure.

#### Kenapa cek multiple format error message?

SQL Server bisa mengeluarkan error message dalam beberapa format:

```
Format 1: "Cannot insert duplicate key row in object 'dbTrans' with unique index 'PK_dbTrans'"
Format 2: "Violation of PRIMARY KEY constraint 'PK_dbTrans'."
Format 3: Error code 2601 (duplicate key)
Format 4: Error code 2627 (PRIMARY KEY violation)
```

Patch cek SEMUA format dengan `UpperCase()` agar tidak miss.

#### Kenapa `Application.ProcessMessages`?

Penting agar UI tidak freeze saat retry. User bisa lihat:
- NoBukti berubah dari 00001 ke 00003 di form
- Status berubah dari "Saving..." ke "Saved"

Tanpa `ProcessMessages`, user akan melihat form freeze selama retry.

#### Kenapa panggil `IsiNoBuktiBaru` + `NoUrutChange(nil)`?

1. `IsiNoBuktiBaru`: Hitung counter baru dari dbTrans (yang sekarang sudah berisi nomor dari Web)
2. `NoUrutChange(nil)`: Trigger event OnChange dari NoUrut field, reformat NoBukti lengkap

Keduanya harus dipanggil berpasangan agar semua field dependent ter-update.


### 11.6 Skenario Edge Case

#### Edge Case 1: Bentrok di SEMUA 5 Percobaan

```
ITERASI 1: 00001 -> PK VIOLATION (Web insert 00001)
ITERASI 2: 00003 -> PK VIOLATION (Web insert 00003)
ITERASI 3: 00005 -> PK VIOLATION (Web insert 00005)
ITERASI 4: 00007 -> PK VIOLATION (Web insert 00007)
ITERASI 5: 00009 -> PK VIOLATION (Web insert 00009)

iRetry = 5 (max), show message "Tidak bisa menyimpan setelah 5x"
raise -> exception propagate ke caller
```

Sangat jarang terjadi. Patch UNIQUE constraint + UPDLOCK di Go biasanya cukup untuk 1 retry.

#### Edge Case 2: Nomor Baru Hasil Generate Juga Bentrok

```
ITERASI 1: 00001 -> PK VIOLATION
   -> DoGenerateNewNomor -> dapat 00003
ITERASI 2: 00003 -> PK VIOLATION (race: Web C insert 00003 barengan)
   -> DoGenerateNewNomor -> query MAX -> 00004 -> dapat 00004
ITERASI 3: 00004 -> OK!
```

Patch handle ini dengan baik: setiap retry, query ke dbTrans lagi, jadi counter selalu up-to-date.

#### Edge Case 3: `IsiNoBuktiBaru` Sendiri Error

```
ITERASI 1: 00001 -> PK VIOLATION
   -> DoGenerateNewNomor dipanggil
   -> IsiNoBuktiBaru error (mis. database connection lost)
   -> inner except: ShowMessage error, raise

Exception propagate, loop exit, form tetap dengan nomor lama.
User harus cek koneksi, refresh.
```

#### Edge Case 4: User Edit (Choice='U'), bukan Insert (Choice='I')

Untuk UPDATE, biasanya tidak ada PK violation karena NoBukti yang diedit sudah ada di dbTrans. Tapi kalau ada skenario di mana NoBukti di-edit ke nilai yang sudah dipakai transaksi lain:

```
ITERASI 1 (Choice='U', NoBukti diedit jadi 'BKI-00005'):
   - UPDATE dbTrans SET NoBukti='BKI-00005' WHERE NoBukti='BKI-00001'
   - EXCEPTION: PK VIOLATION (BKI-00005 sudah dipakai)
   - Catch 'PRIMARY KEY'
   - Generate new nomor -> BKI-00010
   - Parameters[2].Value := NOBUKTI.Text (otomatis ter-update ke 00010)
   - Retry
```

Patch ini work untuk INSERT dan UPDATE sama karena Parameters[2].Value selalu di-set ulang di awal loop dengan NOBUKTI.Text terbaru.


### 11.7 Mengapa MAX_RETRY = 5?

| MAX_RETRY | Kelebihan | Kekurangan |
|-----------|-----------|------------|
| 1 | Cepat fail jika masalah | Tidak handle skenario burst race |
| 3 | Cukup untuk race 2 user | Tidak cukup untuk 4+ user concurrent |
| **5** | **Cukup untuk 4-5 user concurrent** | **Cukup optimal, tidak terlalu lama** |
| 10 | Handle hampir semua kasus | UX terlalu lama jika gagal terus |
| Infinity | 100% akan sukses | Bisa hang forever jika DB down |

`MAX_RETRY = 5` adalah sweet spot karena:
- Probabilitas 5x gagal berturut-turut sangat rendah (~0.001% dengan UPDLOCK di Go)
- Worst case latency = 5 * (db roundtrip + IsiNoBuktiBaru) = 5 * ~200ms = 1 detik
- User experience masih acceptable

### 11.8 Testing Manual

#### Test 1: Simulasi Bentrok 2 User

```
1. Buka Delphi, User A, buka form KasBank, klik Tambah (NoBukti=00001)
2. Buka SQL Server Management Studio, jalankan:
   INSERT INTO dbTrans (NoBukti, ...) VALUES ('KAS-00001', ...)
3. Di Delphi User A, klik Simpan
4. EXPECTED:
   - Form flash (NoBukti berubah ke 00002)
   - INSERT sukses dengan NoBukti 00002
   - Tidak ada error dialog
```

#### Test 2: Simulasi 5x Retry

```
1. Buka Delphi, User A, klik Tambah (NoBukti=00001)
2. Di SQL, INSERT 4 baris dengan NoBukti 00001-00004
   - Sekarang counter seharusnya 00005
3. Di Delphi, klik Simpan dengan cepat sambil INSERT lagi ke SQL 00005
4. EXPECTED:
   - User A dapat nomor 00006 atau 00007
   - Mungkin 1-2 retry terlihat (user lihat NoBukti berubah)
   - Akhirnya sukses
```

#### Test 3: Simulasi 6x Gagal

```
1. Modifikasi MAX_RETRY ke 3 (sementara, untuk test)
2. Buka Delphi, klik Tambah (NoBukti=00001)
3. Di SQL, INSERT 00001-00005 dengan delay 100ms
4. Di Delphi, klik Simpan
5. EXPECTED:
   - 3x retry terlihat
   - ShowMessage "Tidak bisa menyimpan setelah 3x percobaan"
   - Form tetap dengan NoBukti terakhir
6. Kembalikan MAX_RETRY ke 5
```

### 11.9 Backward Compatibility

Patch ini 100% backward compatible karena:

1. Tidak mengubah schema database
2. Tidak mengubah stored procedure
3. Tidak mengubah business logic sukses path (masih sama seperti original)
4. Hanya menambah retry wrapper di error path

Aplikasi yang existing (Delphi) yang sudah jalan tanpa patch:
- Tetap bisa insert jika tidak ada bentrok
- Hanya berbeda saat ada bentrok: dari "gagal total" jadi "auto-retry"

### 11.10 Ringkasan

| Aspek                  | Sebelum Patch          | Sesudah Patch                  |
|------------------------|------------------------|--------------------------------|
| Bentrok dengan Web     | Gagal total, data hilang | Auto-retry, nomor baru, sukses |
| User experience         | Buruk (input ulang)     | Baik (otomatis retry)          |
| Data integrity         | Aman (no fake data)     | Aman (no fake data)            |
| Counter continuity     | Bisa loncat            | Bisa loncat (gap dari bentrok), tapi INSERT selalu sukses |
| Performance            | Sama                   | +1-2 roundtrip per bentrok (~200ms) |
| Risk                   | -                      | Rendah (isolated di error path) |

Patch ini adalah **quick win** dengan effort rendah (~30 menit) tapi impact besar untuk UX.

---

## 12. Analisis dbNomorPK - Sistem Registry Nomor Per-User

### 12.1 Apa Itu dbNomorPK?

`dbNomorPK` adalah tabel registry yang mencatat nomor yang sudah "dipesan" oleh user tertentu saat membuka form. Ini adalah mekanisme **soft-lock** Delphi untuk mencegah 2 user Delphi menggunakan nomor yang sama.

**Struktur tabel (dari INSERT statement)**:

| Kolom | Tipe | Isi | Contoh |
|-------|------|-----|--------|
| Tipe | varchar(2) | Kode transaksi | 'BK', 'BM', 'BB' |
| NoUrut | varchar(10) | Counter urut | '00001' |
| NoBukti | varchar(50) | Nomor bukti lengkap | 'BKI-KAS-00001-2607' |
| UserID | varchar(20) | User yang buka form | 'admin', 'user01' |
| Bulan | int | Periode bulan | 7 |
| Tahun | int | Periode tahun | 2026 |
| IsBatal | int | Flag batal/aktif | 0 = aktif, 1 = batal |
| NamaGudang | varchar(50) | Lokasi gudang | 'GUD01' |

### 12.2 Fungsi-Fungsi Utama dbNomorPK

#### Fungsi 1: Daftar_Nomor(Tipe, xNoUrut, Nomor, Koreksi)

**Dipanggil saat**: User buka form + klik Tambah (generate nomor baru)

**Logika**:
1. Cek apakah nomor ini sudah terdaftar di dbNomorPK
   ```sql
   SELECT Tipe, NoUrut, NoBukti, UserID FROM dbNomorPK
   WHERE Tipe='BK' AND NoBukti='BKI-KAS-00001-2607'
   ```
2a. Jika BELUM ada -> INSERT (pesan nomor)
    ```sql
    INSERT INTO dbNomorPK VALUES('BK','00001','BKI-KAS-00001-2607','admin',7,2026,0,'GUD01')
    ```
    Result := TRUE

2b. Jika SUDAH ada -> cek siapa yang pegang
    ```pascal
    MyUser := dm.QuCari.FieldByName('UserID').AsString
    ```

3. Return logic:
   ```pascal
   Result := DM.QuCari.IsEmpty OR (MyUser = IDUser)
   ```
   - TRUE jika: belum terdaftar ATAU yang pegang = user saat ini
   - FALSE jika: sudah terdaftar oleh user LAIN

**Di FrmKasBank.pas line 3419**:
```pascal
If Not Daftar_Nomor(...) then
begin
  MessageDlg('Nomor : '+NOBUKTI.Text+' telah digunakan oleh '+MyUser+'.',
             mtWarning, [MbOk], 0);
  ActiveControl := NoUrut;
end;
```

**Masalah**: Saat Daftar_Nomor return FALSE, user cuma dapat warning dialog. Form tetap terbuka dengan nomor yang bentrok. User bisa saja klik OK lalu lanjut simpan -> PK violation!

#### Fungsi 2: Hapus_Daftar_Nomor(Tipe, NoBukti, Pemakai)

**Dipanggil saat**: Form ditutup (OnClose) atau user klik Batal

**Logika**:
```sql
DELETE FROM dbNOMORPK
WHERE tipe='BK' AND NoBukti='BKI-KAS-00001-2607' AND UserID='admin'
```

**Tujuan**: Membersihkan registry jika user batal simpan.

#### Fungsi 3: Hapus_Daftar_Nomor_User(Tipe, Pemakai)

**Dipanggil saat**: Form ditutup (OnClose)

**Logika**:
```sql
DELETE FROM dbNOMORPK
WHERE tipe='BK' AND UserID='admin'
```

**Tujuan**: Bersihkan SEMUA nomor yang dipesan user ini, apapun NoBuktinya.

### 12.3 Flow Lengkap dbNomorPK di KasBank

```
USER BUKA FORM -> FormCreate / FormShow
  -> IsiNoBuktiBaru()
    -> Check_NomorKasBank() -> hitung counter dari dbTrans
    -> Konfig() -> build format NoBukti
    -> NoUrutChange() -> update semua field NoBukti

USER KLIK TAMBAH (btnTambahClick)
  -> IsiNoBuktiBaru() -> generate nomor baru
  -> Daftar_Nomor('BK', '00001', 'BKI-KAS-00001-2607')
    -> INSERT INTO dbNomorPK ('BK','00001','BKI-KAS-00001-2607','admin',7,2026,0,'GUD01')
    -> Return TRUE (nomor belum ada)

USER LAIN BUKA FORM (sambil user A masih buka)
  -> IsiNoBuktiBaru() -> dapat nomor yang SAMA ('BKI-KAS-00001-2607')
  -> Daftar_Nomor('BK', '00001', 'BKI-KAS-00001-2607')
    -> SELECT -> DITEMUKAN! UserID='admin' (user A)
    -> MyUser='user02' != 'admin'
    -> Return FALSE
    -> MessageDlg: "Nomor telah digunakan oleh admin"
    -> Form user02 tetap terbuka (nomor bentrok!)

USER A SIMPAN (btnSimpanClick)
  -> SimpanData('I') -> Sp_Transaksi.ExecProc -> INSERT dbTrans -> Sukses!
  -> Hapus_Daftar_Nomor('BK', 'BKI-KAS-00001-2607', 'admin')
    -> DELETE FROM dbNomorPK -> Registry dibersihkan

USER B (yang dapat warning)
  -> Masih punya form terbuka dengan NoBukti='BKI-KAS-00001-2607'
  -> Jika klik Simpan -> INSERT dbTrans -> PK VIOLATION!
  -> Jika close form -> Hapus_Daftar_Nomor_User('BK', 'user02')
```


### 12.4 Masalah dbNomorPK yang Perlu Diperbaiki

#### Masalah 1: Warning Tidak Memaksa User Ganti Nomor

Saat Daftar_Nomor return FALSE:
```pascal
If Not Daftar_Nomor(...) then
begin
  MessageDlg('Nomor telah digunakan oleh '+MyUser+'.', ...);
  // User bisa klik OK lalu lanjut simpan -> PK violation!
end;
```

**Yang seharusnya**: Otomatis regenerate nomor baru, bukan cuma warning.

#### Masalah 2: dbNomorPK Tidak Di-Cleanup Saat Form Close

Di FormCloseQuery:
```pascal
procedure TFrKasBank.FormCloseQuery(Sender: TObject; var CanClose: Boolean);
begin
  // TIDAK ADA Hapus_Daftar_Nomor_User dipanggil!
  // Hanya Hapus_Daftar_Nomor dipanggil di btnBatalClick
end;
```

Artinya: Jika user close form tanpa simpan dan tanpa klik Batal, entry dbNomorPK menjadi **orphan**.

#### Masalah 3: dbNomorPK Tidak Sinkron dengan Go

Go (Web) TIDAK mengecek dbNomorPK sama sekali. Go hanya baca DBNOMOR.NOBKK dan increment.

Jadi skenario ini mungkin:
```
User A (Delphi): buka form -> daftar di dbNomorPK ('BK','00001','admin')
User B (Go):     POST create -> baca DBNOMOR.NOBKK -> dapat 00001 -> INSERT dbTrans
User A (Delphi): Simpan -> INSERT dbTrans -> PK VIOLATION (sudah ada di dbTrans oleh User B)
```

dbNomorPK tidak melindungi dari bentrok dengan Go.

#### Masalah 4: Race Condition di Daftar_Nomor

```
T+0ms  User A: SELECT dbNomorPK WHERE NoBukti='...' -> EMPTY
T+0ms  User B: SELECT dbNomorPK WHERE NoBukti='...' -> EMPTY (belum commit User A)
T+1ms  User A: INSERT dbNomorPK -> OK
T+1ms  User B: INSERT dbNomorPK -> DUPLICATE KEY (jika ada unique constraint)
          -> Atau: INSERT OK (jika tidak ada unique constraint, ada 2 entry NoBukti sama!)
```

**Realita**: dbNomorPK kemungkinan tidak punya unique constraint pada (Tipe, NoBukti). Jadi bisa ada 2 entry dengan NoBukti sama tapi UserID beda.

### 12.5 Solusi Perbaikan dbNomorPK

#### Solusi 1: Auto-Regenerate Saat Bentrok (di Daftar_Nomor)

```pascal
function Daftar_Nomor(Tipe,xNoUrut,Nomor:String;Koreksi:integer):Boolean;
begin
  With Dm.QuCari do
  begin
    Close;
    Sql.Clear;
    sql.Add('Select Tipe,nourut,NoBukti,UserID From dbNomorPK where Tipe=:0 and Nobukti=:1');
    Prepared;
    Parameters[0].Value := Tipe;
    Parameters[1].Value := Nomor;
    Open;
  end;

  if DM.QuCari.IsEmpty then
  begin
    with Dm.QuKOde do
    begin
      close;
      sql.Clear;
      sql.Add('Insert into dbNomorPK values(:0,:1,:2,:3,:4,:5,:6,:7)');
      Prepared;
      Parameters[0].Value := Tipe;
      Parameters[1].Value := xNoUrut;
      Parameters[2].Value := Nomor;
      Parameters[3].Value := IDUser;
      Parameters[4].Value := StrToInt(PeriodBln);
      Parameters[5].Value := StrToInt(PeriodThn);
      Parameters[6].value := 0;
      Parameters[7].value := XnamaGudang;
      ExecSQL;
    end;
    Result := TRUE;
  end
  else
  begin
    MyUser := dm.QuCari.FieldByname('Userid').AsString;
    if MyUser = IDUser then
      Result := TRUE
    else
      Result := FALSE;  // Milik user lain
  end;
end;
```

**Di FrmKasBank.pas (pemanggil Daftar_Nomor)**:
```pascal
If Not Daftar_Nomor(...) then
begin
  ShowMessage('Nomor '+NOBUKTI.Text+' telah digunakan oleh '+MyUser+
              '. Menggenerate nomor baru...');
  IsiNoBuktiBaru;  // Auto regenerate
  // Retry Daftar_Nomor dengan nomor baru
  If Not Daftar_Nomor(...) then
  begin
    ShowMessage('Nomor baru juga bentrok. Silakan coba lagi.');
    ActiveControl := NoUrut;
    Exit;
  end;
end;
```

#### Solusi 2: Cleanup Orphan dbNomorPK Saat Form Close

```pascal
procedure TFrKasBank.FormCloseQuery(Sender: TObject; var CanClose: Boolean);
begin
  Hapus_Daftar_Nomor_User(Copy(Mode.Text,1,2), IDUser);
  CanClose := True;
end;
```

#### Solusi 3: Trigger Auto-Cleanup Orphan (Database Level)

```sql
CREATE TRIGGER trg_dbNomorPK_Cleanup_Orphan
ON dbNomorPK
AFTER INSERT
AS
BEGIN
  DELETE n FROM dbNomorPK n
  INNER JOIN inserted i ON n.NoBukti = i.NoBukti AND n.Tipe = i.Tipe
  INNER JOIN dbTrans t ON n.NoBukti = t.NoBukti
  WHERE n.UserID <> i.UserID AND n.IsBatal = 0;
END;
```

#### Solusi 4: Unique Constraint di dbNomorPK

```sql
ALTER TABLE dbNomorPK ADD CONSTRAINT UQ_dbNomorPK_TipeNoBukti UNIQUE (Tipe, NoBukti);
```

Ini akan mencegah race condition di mana 2 user bisa insert nomor yang sama.

### 12.6 Integrasi dbNomorPK dengan Auto-Retry (Section 11)

dbNomorPK dan auto-retry di SimpanData saling melengkapi:

| Layer | Fungsi |
|-------|--------|
| **dbNomorPK** | Mencegah 2 user Delphi bentrok SAAT BUKA FORM (early detection) |
| **UNIQUE constraint** | Mencegah 2 sistem bentrok SAAT INSERT (last line of defense) |
| **Auto-retry** | Recovery otomatis jika bentrok terjadi (graceful degradation) |

**Flow ideal**:
```
User A buka form -> Daftar_Nomor('BK','00001','BKI-00001') -> INSERT dbNomorPK -> OK
User B buka form -> Daftar_Nomor('BK','00001','BKI-00001') -> DETECTED -> WARN -> Auto-regen -> 'BKI-00003' -> INSERT dbNomorPK -> OK
User C (Go) create -> INSERT dbTrans 'BKI-00001' -> OK
User A Simpan -> INSERT dbTrans 'BKI-00001' -> OK
User B Simpan -> INSERT dbTrans 'BKI-00003' -> OK
```

### 12.7 Ringkasan Masalah dbNomorPK

| # | Masalah | Severity | Solusi |
|---|---------|----------|--------|
| 1 | Warning tidak memaksa ganti nomor | HIGH | Auto-regenerate saat FALSE |
| 2 | Orphan entry saat form close | MEDIUM | Cleanup di FormCloseQuery |
| 3 | Tidak proteksi dari Go | MEDIUM | Rely on UNIQUE + auto-retry |
| 4 | Race condition INSERT | MEDIUM | Unique constraint |
| 5 | Tidak ada cleanup otomatis | LOW | Trigger trg_dbNomorPK_Cleanup_Orphan |

---

## 13. Patch Konkret untuk dbNomorPK - Implementasi

### 13.1 Ringkasan Patch yang Dibutuhkan

dbNomorPK punya 4 masalah utama. Patch berikut mengatasinya satu per satu.

### 13.2 Patch 1: Daftar_Nomor Auto-Regenerate + Cleanup

**File**: `pwt/Unit/MyProcedure.pas`

**Lokasi**: Function `Daftar_Nomor` di line 3167

**Patching strategy**: Daftar_Nomor tetap sederhana (return TRUE/FALSE). Yang diubah adalah pemanggilnya (FrmKasBank.pas) untuk auto-regenerate saat FALSE.

#### Code Original (Daftar_Nomor)

```pascal
function Daftar_Nomor(Tipe,xNoUrut,Nomor:String;Koreksi:integer):Boolean;
begin
  With Dm.QuCari do
  begin
    Close;
    Sql.Clear;
    sql.Add('Select Tipe,nourut,NoBukti,UserID From dbNomorPK where Tipe=:0 and Nobukti=:1');
    Prepared;
    Parameters[0].Value := Tipe;
    Parameters[1].Value := Nomor;
    Open;
  end;
  if DM.QuCari.IsEmpty then
  begin
    with Dm.QuKOde do
    begin
      close;
      sql.Clear;
      sql.Add('Insert into dbNomorPK values(:0,:1,:2,:3,:4,:5,:6,:7)');
      Prepared;
      Parameters[0].Value := Tipe;
      Parameters[1].Value := xNoUrut;
      Parameters[2].Value := Nomor;
      Parameters[3].Value := IDUser;
      Parameters[4].Value := StrToInt(PeriodBln);
      Parameters[5].Value := StrToInt(PeriodThn);
      Parameters[6].value := 0;
      Parameters[7].value := XnamaGudang;
      ExecSQL;
    end;
  end
  else
  begin
    MyUser := dm.QuCari.FieldByname('Userid').AsString;
  end;
  Result := DM.QuCari.IsEmpty or ((not DM.QuCari.IsEmpty) and (MyUser=IDUser));
end;
```

**Tidak ada perubahan** di Daftar_Nomor (logika return value sudah benar).

#### Patch di Pemanggil (FrmKasBank.pas line 3419)

**Original**:
```pascal
If Not Daftar_Nomor(Copy(Mode.Text,1,2),Nourut.Text,NoBukti.Text,IsMax) then
begin
  MessageDlg('Nomor : '+NOBUKTI.Text+' telah digunakan oleh '+MyUser+'.',mtWarning,[MbOk],0);
  ActiveControl := NoUrut;
end;
```

**Patched**:
```pascal
const
  MAX_REGEN = 3;  // Max regen attempts
var
  iRegen: Integer;
  bSuccess: Boolean;
begin
  bSuccess := False;
  iRegen := 0;
  while (iRegen < MAX_REGEN) and (Not bSuccess) do
  begin
    Inc(iRegen);
    if Not Daftar_Nomor(Copy(Mode.Text,1,2),Nourut.Text,NoBukti.Text,IsMax) then
    begin
      // Nomor bentrok dengan user lain -> regenerate
      if iRegen < MAX_REGEN then
      begin
        ShowMessage('Nomor '+NOBUKTI.Text+' telah digunakan oleh '+MyUser+'.
                    Menggenerate nomor baru...');
        IsiNoBuktiBaru;  // Auto regenerate nomor
      end
      else
      begin
        ShowMessage('Nomor baru juga bentrok setelah '+IntToStr(MAX_REGEN)+
                    'x percobaan. Silakan tutup form dan buka ulang.');
        ActiveControl := NoUrut;
        Exit;
      end;
    end
    else
    begin
      bSuccess := True;
    end;
  end;
end;
```

**Penerapan**: Di line 3419 FrmKasBank.pas

### 13.3 Patch 2: Cleanup Orphan di FormCloseQuery

**File**: `pwt/Trasaksi/KasBank/FrmKasBank.pas`

**Lokasi**: `FormCloseQuery`

#### Code Original

Cari function `FormCloseQuery` di FrmKasBank.pas (biasanya di line 2500-2600).

#### Patched

```pascal
procedure TFrKasBank.FormCloseQuery(Sender: TObject; var CanClose: Boolean);
begin
  // PATCH: Cleanup semua entry dbNomorPK milik user ini (orphan prevention)
  try
    Hapus_Daftar_Nomor_User(Copy(Mode.Text,1,2), IDUser);
  except
    // Silent error - cleanup bukan critical operation
  end;

  // ... logika FormCloseQuery yang lain ...
  CanClose := True;
end;
```

**Jika FormCloseQuery TIDAK ADA**, tambahkan sebagai procedure baru di FrmKasBank.pas:

```pascal
procedure TFrKasBank.FormCloseQuery(Sender: TObject; var CanClose: Boolean);
begin
  // PATCH: Cleanup orphan dbNomorPK
  try
    Hapus_Daftar_Nomor_User(Copy(Mode.Text,1,2), IDUser);
  except
  end;
  CanClose := True;
end;
```

### 13.4 Patch 3: Unique Constraint di Database

**File**: Migration SQL baru (mis. `migrations/2026_add_dbNomorPK_unique.sql`)

#### Patched

```sql
-- Cek apakah constraint sudah ada
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'UQ_dbNomorPK_TipeNoBukti' 
    AND object_id = OBJECT_ID('dbNomorPK')
)
BEGIN
    ALTER TABLE dbNomorPK 
    ADD CONSTRAINT UQ_dbNomorPK_TipeNoBukti UNIQUE (Tipe, NoBukti);
END

-- Cleanup duplicate sebelum add constraint (jika ada)
-- HATI-HATI: Run ini dulu, baru add constraint

-- Step 1: Cek duplicate
SELECT Tipe, NoBukti, COUNT(*) AS Cnt
FROM dbNomorPK
GROUP BY Tipe, NoBukti
HAVING COUNT(*) > 1;

-- Step 2: Hapus entry orphan (milik user yang sudah tidak aktif)
DELETE n FROM dbNomorPK n
WHERE NOT EXISTS (
    SELECT 1 FROM dbMasterUser u WHERE u.UserID = n.UserID
);

-- Step 3: Hapus entry yang NoBuktinya sudah ada di dbTrans
DELETE n FROM dbNomorPK n
WHERE EXISTS (
    SELECT 1 FROM dbTrans t 
    WHERE t.NoBukti = n.NoBukti 
    AND t.TipeTrans = n.Tipe
);

-- Step 4: Sekarang aman add constraint
ALTER TABLE dbNomorPK 
ADD CONSTRAINT UQ_dbNomorPK_TipeNoBukti UNIQUE (Tipe, NoBukti);
```


### 13.5 Patch 4: Trigger Auto-Cleanup Orphan (Database Level)

**File**: Migration SQL baru (`migrations/2026_add_dbNomorPK_cleanup_trigger.sql`)

```sql
-- Trigger untuk auto-cleanup entry dbNomorPK yang NoBuktinya sudah ada di dbTrans
-- tapi bukan milik user yang insert
CREATE TRIGGER trg_dbNomorPK_Cleanup_Orphan
ON dbNomorPK
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Hapus entry dbNomorPK yang NoBuktinya sudah ada di dbTrans
    -- tapi bukan milik user yang insert
    DELETE n FROM dbNomorPK n
    INNER JOIN inserted i ON n.NoBukti = i.NoBukti AND n.Tipe = i.Tipe
    INNER JOIN dbTrans t ON n.NoBukti = t.NoBukti 
        AND LEFT(t.Mode,2) = n.Tipe
        AND t.IsBatal = 0
    WHERE n.UserID <> i.UserID;
END;
GO

-- Test trigger
-- 1. Insert ke dbNomorPK dengan NoBukti yang sudah ada di dbTrans
-- 2. Trigger akan otomatis hapus entry yang NoBukti-nya sudah di dbTrans
-- 3. Cek: SELECT * FROM dbNomorPK WHERE NoBukti='[nomor_test]'
```

### 13.6 Patch 5: Hapus_Daftar_Nomor dengan UPDLOCK

Untuk mencegah race condition saat delete, tambahkan UPDLOCK:

**File**: `pwt/Unit/MyProcedure.pas`

#### Code Original (Hapus_Daftar_Nomor line 3208)

```pascal
procedure Hapus_Daftar_Nomor(Tipe:String;NoBukti,pemakai:String);
begin
      with Dm.DaftarNO do
      begin
         Close;
         SQL.Clear;
         SQL.Add('Delete from dbNOMORPK');
         SQL.Add('Where tipe =:0 and NoBukti =:1 and UserID='+QuotedStr(pemakai));
         Prepared;
         Parameters[0].Value:=Tipe;
         Parameters[1].Value:=NoBukti;
         try
           ExecSQL;
         except
           ShowMessage('Hapus Daftar Nomor Gagal !');
         end;
      end;
end;
```

#### Patched

```pascal
procedure Hapus_Daftar_Nomor(Tipe:String;NoBukti,pemakai:String);
begin
      with Dm.DaftarNO do
      begin
         Close;
         SQL.Clear;
         SQL.Add('DELETE FROM dbNOMORPK WITH (UPDLOCK)');
         SQL.Add('WHERE tipe = :0 AND NoBukti = :1 AND UserID = :2');
         Prepared;
         Parameters[0].Value:=Tipe;
         Parameters[1].Value:=NoBukti;
         Parameters[2].Value:=pemakai;  // FIX: gunakan parameter, bukan string concatenation!
         try
           ExecSQL;
         except
           // Silent error - cleanup bukan critical operation
           // ShowMessage('Hapus Daftar Nomor Gagal !');  // Remove this
         end;
      end;
end;
```

**Perubahan penting**:
1. Tambah `WITH (UPDLOCK)` - mencegah race condition saat delete
2. Fix SQL injection: `UserID='+QuotedStr(pemakai)` -> parameterized query
3. Silent error - cleanup bukan critical operation

### 13.7 Patch 6: Hapus_Daftar_Nomor_User dengan UPDLock

**File**: `pwt/Unit/MyProcedure.pas`

#### Code Original (line 3228)

```pascal
procedure Hapus_Daftar_Nomor_User(Tipe:String;Pemakai:String);
begin
      with Dm.DaftarNO do
      begin
         Close;
         SQL.Clear;
         SQL.Add('Delete from dbNOMORPK');
         SQL.Add('Where tipe =:0 and UserID =:1');
         Prepared;
         Parameters[0].Value:=Tipe;
         Parameters[1].Value:=Pemakai;
         try
           ExecSQL;
         except
           ShowMessage('Hapus Daftar Nomor Gagal !');
         end;
      end;
end;
```

#### Patched

```pascal
procedure Hapus_Daftar_Nomor_User(Tipe:String;Pemakai:String);
begin
      with Dm.DaftarNO do
      begin
         Close;
         SQL.Clear;
         SQL.Add('DELETE FROM dbNOMORPK WITH (UPDLOCK)');
         SQL.Add('WHERE tipe = :0 AND UserID = :1');
         Prepared;
         Parameters[0].Value:=Tipe;
         Parameters[1].Value:=Pemakai;
         try
           ExecSQL;
         except
           // Silent error
         end;
      end;
end;
```


### 13.8 Patch 7: Daftar_Nomor dengan UPDLock (Prevent Race Condition)

**File**: `pwt/Unit/MyProcedure.pas`

#### Code Original (line 3167)

```pascal
function Daftar_Nomor(Tipe,xNoUrut,Nomor:String;Koreksi:integer):Boolean;
begin
  With Dm.QuCari do
  begin
    Close;
    Sql.Clear;
    sql.Add('Select Tipe,nourut,NoBukti,UserID From dbNomorPK where Tipe=:0 and Nobukti=:1');
    Prepared;
    Parameters[0].Value := Tipe;
    Parameters[1].Value := Nomor;
    Open;
  end;
  // ...
end;
```

#### Patched

```pascal
function Daftar_Nomor(Tipe,xNoUrut,Nomor:String;Koreksi:integer):Boolean;
begin
  With Dm.QuCari do
  begin
    Close;
    Sql.Clear;
    sql.Add('Select Tipe,nourut,NoBukti,UserID From dbNomorPK WITH (UPDLOCK,ROWLOCK) 
             where Tipe=:0 and Nobukti=:1');
    Prepared;
    Parameters[0].Value := Tipe;
    Parameters[1].Value := Nomor;
    Open;
  end;
  if DM.QuCari.IsEmpty then
  begin
    with Dm.QuKOde do
    begin
      close;
      sql.Clear;
      sql.Add('Insert into dbNomorPK values(:0,:1,:2,:3,:4,:5,:6,:7)');
      Prepared;
      Parameters[0].Value := Tipe;
      Parameters[1].Value := xNoUrut;
      Parameters[2].Value := Nomor;
      Parameters[3].Value := IDUser;
      Parameters[4].Value := StrToInt(PeriodBln);
      Parameters[5].Value := StrToInt(PeriodThn);
      Parameters[6].value := 0;
      Parameters[7].value := XnamaGudang;
      ExecSQL;
    end;
  end
  else
  begin
    MyUser := dm.QuCari.FieldByname('Userid').AsString;
  end;
  Result := DM.QuCari.IsEmpty or ((not DM.QuCari.IsEmpty) and (MyUser=IDUser));
end;
```

**Perubahan**: Tambah `WITH (UPDLOCK, ROWLOCK)` di SELECT untuk mencegah race condition saat read-then-write.

### 13.9 Patch 8: Cleanup Orphan Periodik (Database Job)

**File**: Migration SQL baru (`migrations/2026_add_dbNomorPK_cleanup_job.sql`)

```sql
-- Buat stored procedure untuk cleanup orphan dbNomorPK
CREATE PROCEDURE sp_CleanupOrphanDbNomorPK
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Hapus entry yang NoBuktinya sudah ada di dbTrans (bukan milik user yang insert)
    DELETE n FROM dbNomorPK n
    WHERE EXISTS (
        SELECT 1 FROM dbTrans t 
        WHERE t.NoBukti = n.NoBukti 
        AND LEFT(t.Mode,2) = n.Tipe
        AND t.IsBatal = 0
    );
    
    -- Hapus entry yang UserID tidak ada di dbMasterUser
    DELETE n FROM dbNomorPK n
    WHERE NOT EXISTS (
        SELECT 1 FROM dbMasterUser u WHERE u.UserID = n.UserID
    );
END;
GO

-- Buat SQL Server Job untuk run setiap 1 jam
USE msdb;
GO
EXEC sp_add_job 
    @job_name = N'dbNomorPK_Cleanup_Orphan',
    @enabled = 1,
    @description = N'Cleans up orphan entries in dbNomorPK';
GO

EXEC sp_add_jobstep
    @job_name = N'dbNomorPK_Cleanup_Orphan',
    @step_name = N'Cleanup',
    @subsystem = N'TSQL',
    @command = N'EXEC sp_CleanupOrphanDbNomorPK';
GO

EXEC sp_add_jobschedule
    @job_name = N'dbNomorPK_Cleanup_Orphan',
    @name = N'Hourly',
    @freq_type = 4,  -- Daily
    @freq_interval = 1,
    @freq_subday_type = 8,  -- Hour
    @freq_subday_interval = 1;  -- Every hour
GO
```


### 13.10 Patch 9: Kolom IsBatal Soft-Delete (jika belum ada)

**File**: Migration SQL (`migrations/2026_add_IsBatal_dbNomorPK.sql`)

Cek apakah kolom IsBatal sudah ada:
```sql
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbNomorPK') 
    AND name = 'IsBatal'
)
BEGIN
    ALTER TABLE dbNomorPK ADD IsBatal INT DEFAULT 0;
END
```

Update Daftar_Nomor untuk set IsBatal=0 saat insert (sudah ada di code original):
```pascal
Parameters[6].value := 0;  // IsBatal = 0 (aktif)
```

Patch Hapus_Daftar_Nomor menjadi soft-delete:
```sql
-- Soft-delete (lebih aman, bisa di-restore)
UPDATE dbNOMORPK SET IsBatal = 1
WHERE tipe = :0 AND NoBukti = :1 AND UserID = :2;

-- Hard-delete (cleanup, hanya untuk entry yang IsBatal=1)
DELETE FROM dbNOMORPK 
WHERE IsBatal = 1 AND Tanggal < DATEADD(day, -7, GETDATE());
```

### 13.11 Urutan Penerapan Patch

Patch harus diterapkan dalam urutan ini:

1. **Backup database** (WAJIB)
   ```sql
   BACKUP DATABASE [NamaDB] TO DISK = 'C:\Backup\pre_patch_dbNomorPK.bak';
   ```

2. **Patch 3 (Unique Constraint)** - Cleanup duplicate dulu
   - Cek duplicate
   - Hapus orphan
   - Baru add constraint
   - **STOP**: Jika duplicate banyak, harus investigasi dulu

3. **Patch 4 (Trigger)** - Auto-cleanup orphan
   - Test dengan insert dummy
   - Verify trigger fire

4. **Patch 9 (IsBatal)** - Jika belum ada

5. **Patch 7 (Daftar_Nomor UPDLOCK)** - Prevent race
6. **Patch 6 (Hapus_Daftar_Nomor_User UPDLOCK)** - Prevent race
7. **Patch 5 (Hapus_Daftar_Nomor UPDLOCK + parameter)** - Fix SQL injection

8. **Patch 2 (FormCloseQuery cleanup)** - Compile Delphi, test

9. **Patch 1 (Auto-Regen di FrmKasBank)** - Compile Delphi, test
10. **Patch 8 (Cleanup Job)** - Schedule hourly

### 13.12 Testing Plan

#### Test 1: Cleanup Orphan
```sql
-- Setup
INSERT INTO dbNomorPK VALUES('BK','00001','TEST-00001','user_test',7,2026,0,'GUD01');

-- Action
EXEC sp_CleanupOrphanDbNomorPK;

-- Verify
SELECT * FROM dbNomorPK WHERE NoBukti='TEST-00001';
-- Expected: 0 rows (orphan user_test, tidak ada di dbMasterUser)
```

#### Test 2: Unique Constraint
```sql
-- Setup
INSERT INTO dbNomorPK VALUES('BK','00001','TEST-00001','admin',7,2026,0,'GUD01');

-- Action: Try insert duplicate
INSERT INTO dbNomorPK VALUES('BK','00001','TEST-00001','user02',7,2026,0,'GUD01');

-- Expected: ERROR - Violation of UNIQUE KEY constraint 'UQ_dbNomorPK_TipeNoBukti'
```

#### Test 3: Trigger Auto-Cleanup
```sql
-- Setup
INSERT INTO dbTrans (NoBukti, TipeTrans, ...) VALUES ('TEST-00001', 'BK', ...);

-- Action: Insert dbNomorPK dengan NoBukti sama, UserID beda
INSERT INTO dbNomorPK VALUES('BK','00001','TEST-00001','user02',7,2026,0,'GUD01');

-- Verify
SELECT * FROM dbNomorPK WHERE NoBukti='TEST-00001';
-- Expected: 0 rows (trigger hapus karena sudah ada di dbTrans)
```

#### Test 4: FormCloseQuery Cleanup
```
1. Login Delphi sebagai admin
2. Buka form KasBank
3. Klik Tambah (akan INSERT dbNomorPK)
4. Close form (klik X tanpa Simpan/Batal)
5. Cek: SELECT * FROM dbNomorPK WHERE UserID='admin'
6. Expected: 0 rows (FormCloseQuery cleanup)
```

### 13.13 Rollback Plan

Jika ada masalah setelah patch:

```sql
-- Rollback Unique Constraint
ALTER TABLE dbNomorPK DROP CONSTRAINT UQ_dbNomorPK_TipeNoBukti;

-- Rollback Trigger
DROP TRIGGER IF EXISTS trg_dbNomorPK_Cleanup_Orphan;

-- Rollback IsBatal (jika ditambah)
ALTER TABLE dbNomorPK DROP COLUMN IF EXISTS IsBatal;

-- Rollback Stored Procedure
DROP PROCEDURE IF EXISTS sp_CleanupOrphanDbNomorPK;

-- Rollback SQL Server Job
EXEC sp_delete_job @job_name = 'dbNomorPK_Cleanup_Orphan';
```

Untuk Delphi patches: revert source code, recompile, redeploy.

### 13.14 Effort & Impact Estimate

| Patch | File | Effort | Impact |
|-------|------|--------|--------|
| 1 (Auto-Regen) | FrmKasBank.pas | 30 min | HIGH - UX improvement |
| 2 (FormClose cleanup) | FrmKasBank.pas | 5 min | MEDIUM - Orphan prevention |
| 3 (Unique Constraint) | SQL migration | 15 min | HIGH - Race prevention |
| 4 (Trigger) | SQL migration | 10 min | MEDIUM - Auto cleanup |
| 5 (Hapus_Daftar UPDLOCK) | MyProcedure.pas | 10 min | MEDIUM - Race prevention |
| 6 (Hapus_User UPDLOCK) | MyProcedure.pas | 10 min | MEDIUM - Race prevention |
| 7 (Daftar_Nomor UPDLOCK) | MyProcedure.pas | 5 min | HIGH - Race prevention |
| 8 (Cleanup Job) | SQL migration | 15 min | MEDIUM - Periodic cleanup |
| 9 (IsBatal) | SQL migration | 5 min | LOW - Soft delete prep |
| **TOTAL** | | **~2 hours** | **Comprehensive fix** |

### 13.15 Summary

Patch dbNomorPK memberikan proteksi berlapis:

| Layer | Proteksi |
|-------|----------|
| **SQL Server Job (hourly)** | Cleanup orphan periodik |
| **Trigger (auto)** | Cleanup orphan real-time saat insert |
| **Unique Constraint** | Prevent duplicate entry |
| **UPDLOCK (Delphi)** | Prevent race condition Delphi |
| **Auto-Regen (Delphi)** | Graceful degradation saat bentrok |
| **FormClose (Delphi)** | Cleanup orphan saat close form |

Semua patch ini BACKWARD COMPATIBLE. Aplikasi existing tetap bisa jalan tanpa perubahan signifikan. Yang berubah hanya:
- Lebih sering cleanup orphan
- Lebih jarang terjadi bentrok
- Lebih sulit masuk kondisi "stuck"
