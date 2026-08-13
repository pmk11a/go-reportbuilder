# Seed Generator Recommendations — Dynamic Report Engine

> **Tanggal:** 2026-08-06
> **Status:** Analysis & Recommendations
> **Author:** Agnes (Sapiens AI)

---

## 1. Current State Analysis

### Database Reality
| Metric | Value |
|--------|-------|
| DBMENUREPORT (L0=3) | 70 entries |
| dbmasterlaporan | 29 entries |
| **Missing** | **41 entries** |
| SP found with "Lap" | 19 SPs |
| SP coverage | **27%** |

### Missing Reports (41)
- 020106-020108: Daftar Deposito, Giro diterima, Giro dibuka
- 020201, 020205-020206: Jurnal, Aktiva, Biaya Penyusutan
- 020303-020304: Pelunasan, Saldo (Piutang)
- 020403-020404, 020407: Pelunasan, Saldo, Monitoring (Piutang Detail)
- 020502, 020505: HPP, Neraca Penunjang
- 025711-025743: ACC Pembelian (9 reports)
- 030201-030204: Penawaran (4 reports)
- 030314, 030325-030326, 030351, 030361-030362: Sales (6 reports)
- 040361-040362: Transfer Barang (2 reports)
- 040501-040502: Ubah Kemasan (2 reports)
- 040701-040702: Opname Bahan (2 reports)
- 040801-040802: Opname Barang (2 reports)
- 040851-040862: Hasil Produksi (4 reports)
- 050104-050107: Stock variants (4 reports)
- 050201-050202: Kartu Stock (2 reports)

---

## 2. Root Cause Analysis

### Problem 1: SP Naming Inconsistency
```
Expected: Sp_LapKasHarian
Actual:   sp_LapKasHarian (lowercase prefix)
```

### Problem 2: SP Not Found
Most SPs in mapping don't exist. The actual SP names differ from expectations.

### Problem 3: Template Gap
Only 2 SPs have column templates:
- `sp_LapKasHarian` → Kas Harian
- `sp_LapBankHarian` → Bank Harian

---

## 3. Recommendations

### R1: Dynamic SP Discovery (HIGH PRIORITY)

Instead of hardcoded mapping, auto-discover SPs:

```python
# Search for SP by name pattern
cur.execute("""
    SELECT name FROM sys.procedures 
    WHERE name LIKE '%LapKas%' OR name LIKE '%LapBank%'
    ORDER BY name
""")
```

### R2: Fuzzy SP Matching

Create a similarity function to match expected → actual SP names:

| Expected | Possible Matches |
|----------|------------------|
| Sp_LapKasHarian | sp_LapKasHarian, sp_LapKasHarianOld |
| Sp_LapNeraca | SP_LapNeracaPenunjang |
| Sp_LapLabaRugi | (no match) |

### R3: SP Parameter Introspection

Auto-generate parameter config from sys.parameters:

```python
def get_sp_signature(sp_name):
    cur.execute("""
        SELECT p.name, t.name, p.max_length, p.is_output
        FROM sys.parameters p
        JOIN sys.types t ON p.user_type_id = t.user_type_id
        WHERE p.object_id = OBJECT_ID(?)
        ORDER BY p.parameter_id
    """, sp_name)
    return cur.fetchall()
```

### R4: Column Template Automation

Use result set introspection to auto-generate column templates:

```python
def get_sp_result_columns(sp_name, sample_params):
    # Execute with sample params, get column info
    cur.execute(f"EXEC {sp_name} {' '.join(sample_params)}")
    return [col[0] for col in cur.description]
```

### R5: Priority-Based Seeding

Focus on high-value reports first:

| Priority | Criteria | Reports |
|----------|----------|---------|
| P0 | Has SP + Common use | Kas, Bank, Jurnal, Neraca, LabaRugi |
| P1 | Has SP + Medium use | Aktiva, Biaya, Depo, Giro |
| P2 | No SP, needs SP creation | ACC, Transfer, Stock variants |
| P3 | Complex, manual mapping | Production, Opname |

### R6: Manual Mapping Tool

Create a browser-based tool for manual SP mapping:

1. List all missing KODEMENU
2. Show available SPs with parameters
3. User selects SP for each report
4. Auto-generate column template from SP result
5. Export as SQL

---

## 4. Implementation Plan

### Phase 1: Quick Wins (2-3 days)
- [ ] Fix SP discovery to use case-insensitive matching
- [ ] Auto-discover all 19 SPs with parameters
- [ ] Generate seed for discovered SPs
- [ ] Target: 29 existing + 19 new = 48/70 covered

### Phase 2: Manual Mapping (1 week)
- [ ] Create mapping tool UI
- [ ] Map SPs for remaining 22 reports
- [ ] Focus on P0 reports first (Neraca, LabaRugi, HPP)
- [ ] Generate complete column templates

### Phase 3: Automation (2 weeks)
- [ ] Result set introspection for auto-column generation
- [ ] Fuzzy SP name matching
- [ ] Self-healing seed regeneration

### Phase 4: Maintenance (ongoing)
- [ ] Version control for SP mappings
- [ ] Changelog when SPs change
- [ ] Validation against DBMENUREPORT

---

## 5. Immediate Actions

### Action 1: Generate Complete Seed for Found SPs

```bash
cd d:/TestLaB/piagent/dynamic-report-engine
python bin/seed_generator.py --discover --output samples/seed_v2.sql
```

### Action 2: Create SP Mapping Document

Generate `SP_MAPPING.md` with:
- All 70 KODEMENU
- Found SP (with params)
- Missing SP
- Suggested next steps

### Action 3: Focus on Critical Reports

Prioritize these 5 missing reports (no SP found):
1. **020201** - Jurnal (high frequency use)
2. **020502** - HPP (cost calculation)
3. **020505** - Neraca Penunjang (financial report)
4. **020205** - Aktiva (fixed assets)
5. **050104-050107** - Stock variants (inventory)

---

## 6. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SP renamed/removed | High | Version control, backup SP definitions |
| Column mismatch | Medium | Result introspection, validation |
| Parameter type wrong | Medium | Explicit type mapping |
| Missing SP entirely | High | Legacy report migration needed |

---

## 7. Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| SP Coverage | 100% | 27% |
| Column Template | 100% | 3% |
| Seed Completeness | 90% | 41% |

---

## 8. Files Generated

| File | Purpose |
|------|---------|
| `bin/seed_generator.py` | Main generator script |
| `samples/seed_complete.sql` | Full seed SQL (1208 lines) |
| `samples/seed_complete.json` | Manifest with coverage analysis |
| `SEED_RECOMMENDATIONS.md` | This document |

---

*Generated by Agnes - Sapiens AI*
