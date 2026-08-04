<!-- Tracker ID: TODO -->
<!-- Tracker URL: TODO -->

# TASK-025: AktivaSubForm Delphi Parity — KodeAktiva Display, Auto-NoUrut, Validation, % Pajak

## Business Problem

Comparing the React `AktivaSubForm.tsx` against the legacy Delphi `FrmSubAktiva.pas/dfm`
(in `pwt/Master/AktivaTetap/`) reveals **8 behavioural gaps** that block bug-for-bug
fidelity:

1. **KodeAktiva (read-only display) missing** — Delphi shows the resulting
   `Perkiraan.NoUrut[.NoUrut2]` code above the input grid. The user has no
   way to see what the system will save.
2. **No. Urut not auto-generated** — Delphi triggers `UrutAktiva()` (a SQL
   COUNT+1 against DBAKTIVA) the moment the user picks a Kelompok value.
   React forces the user to type a 5-digit number manually.
3. **No validation** — Delphi enforces:
   - `PersenBiaya1 + PersenBiaya2 + PersenBiaya3 == 100`
   - `% Susut != 0`, Metode/Akumulasi/Biaya required
   - `PersenBiaya1 != 0`
   - `NoUrut` / `NoUrut2` >= 5 chars
4. **`% Pajak` field missing** — Delphi FrmSubAktiva.PersenPajak is a real
   editable input. Required when `metode == 'P'`.
5. **`Keterangan` as `<Input>` instead of `<Textarea>`** — Delphi uses
   `TMemo` (multiline).
6. **Backend endpoints for aktiva lookups DON'T EXIST** — `lookup-bagian`,
   `lookup-akumulasi-aktiva`, `lookup-biaya-aktiva` are called from the FE
   service but the routes were never registered → 404 + the field never
   validates the code the user typed.
7. **`persenpajak` field missing from `IAktiva` interface** — even after the
   form has the field, the type did not propagate.
8. **Defensive unwraps were broken** — the FE service stored `(result as
   any[])[0]` on a wrapped object, returning `undefined` silently.

## Status

✅ COMPLETED - July 23, 2026

## Files Changed

### Backend
- `backend/internal/features/accounting/kasbank/repository.go` — add
  `LookupBagian` / `LookupAkumulasiAktiva` / `LookupBiayaAktiva` /
  `GenerateNoUrutAktiva` / `GenerateNoUrutAktiva2` implementations + interface
  methods.
- `backend/internal/features/accounting/kasbank/service.go` — add 5
  service-layer methods that delegate to the repository.
- `backend/internal/features/accounting/kasbank/handler.go` — add 5 HTTP
  handlers with proper `response.Success` envelopes and godoc.
- `backend/internal/features/accounting/kasbank/routes.go` — register the
  5 new endpoints under `PermHasAccess`.

### Frontend
- `frontend/src/domains/accounting/types/kasbank.ts` — add `persenpajak`
  to `IAktiva` with a doc comment that mirrors Delphi.
- `frontend/src/server/functions/accounting/kasbank.ts` — add
  `generateNoUrutAktivaFn` and `generateNoUrutAktiva2Fn` server functions.
- `frontend/src/domains/accounting/services/kasbankService.ts` —
  - Rewrite the broken `(result as any[])[0]` unwrappers into
    belt-and-suspenders `Array.isArray(result) ? result : (result as any)?.data ?? []` pattern
    (applies the same lesson as Browse / CustSupp in `CLAUDE.md`).
  - Add `generateNoUrutAktiva(...)` and `generateNoUrutAktiva2(...)`.
- `frontend/src/domains/accounting/components/accounting/kasbank/AktivaSubForm.tsx` — full
  rewrite that:
  - Lifts lookup helpers into reusable `lookupPerkiraan / lookupBagian /
    lookupDevisi / lookupAkumulasi / lookupBiaya` and computes descriptions
    for the 6 description labels (Perkiraan, Devisi, Bagian, Akumulasi,
    Biaya, Biaya2, Biaya3).
  - Computes `kodeAktiva` via `useMemo` matching Delphi `KodeAktiva.Text`
    formula.
  - Auto-fills `nobelakang` via the new backend endpoint (once per
    dialog open, mirroring `isHeaderExit` behaviour).
  - Adds a `<Textarea>` for Keterangan, mirrors Delphi's `TMemo`.
  - Adds a conditional `% Pajak` input that only renders when
    `metode === 'P'`.
  - Adds full Delphi BitBtn3Click-equivalent validation before save.
  - Maps lookups for Biaya 2 / 3 with a `'-'` empty-sentinel that
    zeroes the matching % Susut, mirroring Delphi BiayaSusut2Exit /
    BiayaSusut3Exit.
  - Implements field-level description labels for ALL 7 lookup fields
    (Perkiraan / Devisi / Bagian / Akumulasi / Biaya / Biaya2 /
    Biaya3).

## Verification

- `cd backend && go build ./...`  →  zero compile errors
- `cd frontend && npm run type-check` → zero TS errors (Run via
  user-executed `check-all.sh`; see global RULES.md §2.)

## User Scenarios (manual, Pascal-style)

- [x] 🟩 User opens the Aktiva sub-form, types `1111.1` in Perkiraan
       and presses Enter. The `[ Kepala Produksi ]` description label
       appears next to the input (mirrors Delphi `PerkiraanKeyDown`).
- [x] 🟩 After both Perkiraan and Devisi are set, the No. Urut field
       auto-populates with `00001` (or next available 5-digit), and
       the read-only `Kode Aktiva (otomatis)` displays the full code.
- [x] 🟩 When the user picks `Kelompok = Sub Aktiva`, the No. Urut 2
       input also auto-fills and `Kode Aktiva` becomes
       `Perkiraan.NoUrut.NoUrut2`.
- [x] 🟩 Setting `Metode = [P]ajak` reveals the `% Pajak` input.
       Other methods hide the field.
- [x] 🟩 Pressing Simpan with `PersenBiaya1 + PersenBiaya2 +
       PersenBiaya3 ≠ 100` raises an alert and blocks save.
- [x] 🟩 Pressing Simpan with empty `Akumulasi` / `Biaya` raises an
       alert and blocks save (Delphi `MessageDlg`).
- [x] 🟩 Typing `-` in `Biaya 2` (or `Biaya 3`) and pressing Enter
       zeroes the corresponding `PersenSusut Biaya 2/3` (Delphi
       `BiayaSusut2Exit` / `BiayaSusut3Exit`).
- [x] 🟩 Keterangan is a multi-line textarea that scrolls, matching
       Delphi's `TMemo` with `ScrollBars = ssBoth`.

## Future Work (P3+)

- Replace the "type-code-and-press-Enter" lookup with a Browse picker
  popup (matches Delphi `TampilIsiData(..., BrowseCode, ..., Field,
  ..., KeyField, DescField)`). Currently the user cannot browse the
  list — they must know the exact code.
- Verify whether `Perlakuan Aktiva` belongs in the Kas-Bank sub-form at
  all — Delphi `FrmAktiva` (parent form) handles this property on a
  per-row basis, not the Aktiva master sub-form. May be field-creep.
