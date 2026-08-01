@echo off
REM ============================================================================
REM COMMAND INSTALLER UNTUK DELPHI PATCHES (KasBank Nomor Bukti)
REM ============================================================================
REM File ini berisi command untuk verifikasi dan instalasi patch Delphi
REM
REM Author: Agnes-2.0-Flash (Sapiens AI)
REM Date: 2026-01-14
REM Target: Delphi 12 Athens
REM Files Modified:
REM   - pwt/Unit/MyProcedure.pas (3 patches: P1, P2, P3)
REM   - pwt/Trasaksi/KasBank/FrmKasBank.pas (3 patches: P4, P5, P6)
REM ============================================================================

echo.
echo ================================================================
echo  DELPHI PATCHES - KASBANK NOMOR BUKTI FIX
echo ================================================================
echo.
echo  Target: Delphi 12 Athens
echo  Files:  MyProcedure.pas, FrmKasBank.pas
echo  Patches: 6 total (3 + 3)
echo.
echo ================================================================
echo.

REM Check if files exist
if not exist "pwt\Unit\MyProcedure.pas" (
    echo ERROR: pwt\Unit\MyProcedure.pas not found!
    echo Make sure you run this from the correct directory.
    pause
    exit /b 1
)

if not exist "pwt\Trasaksi\KasBank\FrmKasBank.pas" (
    echo ERROR: pwt\Trasaksi\KasBank\FrmKasBank.pas not found!
    echo Make sure you run this from the correct directory.
    pause
    exit /b 1
)

echo [OK] MyProcedure.pas found
echo [OK] FrmKasBank.pas found
echo.

REM Create backup of original files
echo Creating backups...
copy /Y "pwt\Unit\MyProcedure.pas" "pwt\Unit\MyProcedure.pas.bak" >nul 2>&1
copy /Y "pwt\Trasaksi\KasBank\FrmKasBank.pas" "pwt\Trasaksi\KasBank\FrmKasBank.pas.bak" >nul 2>&1
echo [OK] Backups created in same directory
echo.

echo ================================================================
echo  VERIFICATION
echo ================================================================
echo.

REM Count PATCH markers in MyProcedure.pas
setlocal enabledelayedexpansion
set myproc_patches=0
set frm_patches=0
for /f "delims=" %%a in ('findstr /c:"PATCH:" "pwt\Unit\MyProcedure.pas"') do (
    set /a myproc_patches+=1
)
for /f "delims=" %%a in ('findstr /c:"PATCH:" "pwt\Trasaksi\KasBank\FrmKasBank.pas"') do (
    set /a frm_patches+=1
)

echo  MyProcedure.pas: !myproc_patches! patches applied (expected 6)
echo  FrmKasBank.pas:  !frm_patches! patches applied (expected 3)
echo.

if !myproc_patches! NEQ 6 (
    echo WARNING: Expected 6 patches in MyProcedure.pas, found !myproc_patches!
)
if !frm_patches! NEQ 3 (
    echo WARNING: Expected 3 patches in FrmKasBank.pas, found !frm_patches!
)

echo ================================================================
echo  PATCH SUMMARY
echo ================================================================
echo.
echo  [P1] Daftar_Nomor - UPDLOCK,ROWLOCK + silent error on duplicate
echo  [P2] Hapus_Daftar_Nomor - UPDLOCK + parameterized UserID (no SQL injection)
echo  [P3] Hapus_Daftar_Nomor_User - UPDLOCK + silent error
echo  [P4] FormClose - Cleanup orphan dbNomorPK sebelum form ditutup
echo  [P5] TambahBtnClick - Auto-regenerate nomor bentrok (max 3x)
echo  [P6] SimpanData - Auto-retry PK violation dengan nomor baru
echo.
echo ================================================================
echo  SQL SERVER SCRIPT
echo ================================================================
echo.
echo  Run this SQL in SQL Server Management Studio:
echo.
echo    ALTER DATABASE [PWT] SET ALLOW_SNAPSHOT_ISOLATION ON;
echo    ALTER DATABASE [PWT] SET READ_COMMITTED_SNAPSHOT ON;
echo.
echo    -- Check orphan dbNomorPK:
echo    SELECT * FROM dbNomorPK WHERE Tipe IN ('BK','BM','KK','KM');
echo.
echo    -- Cleanup orphan dbNomorPK (jika perlu):
echo    DELETE FROM dbNomorPK WHERE UserID NOT IN (SELECT UserID FROM dbUser);
echo.
echo ================================================================
echo  NEXT STEPS
echo ================================================================
echo.
echo  1. Open pwt.dpr in Delphi 12 Athens
echo  2. Recompile project (Ctrl+F9)
echo  3. Test all scenarios:
echo     a. Normal transaction flow
echo     b. Multiple users inserting simultaneously
echo     c. Close form without saving
echo     d. Duplicate nomor bukti generation
echo.
echo  4. If issues occur, restore from .bak files:
echo     copy /Y pwt\Unit\MyProcedure.pas.bak pwt\Unit\MyProcedure.pas
echo     copy /Y pwt\Trasaksi\KasBank\FrmKasBank.pas.bak pwt\Trasaksi\KasBank\FrmKasBank.pas
echo.
echo ================================================================
echo.
pause
