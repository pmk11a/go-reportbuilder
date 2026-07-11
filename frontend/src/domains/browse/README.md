# Browse Domain

Generic lookup facility that powers 19 different "kodeBrowse" types
(Perkiraan, Customer/Supplier, Kas/Bank, Departemen, Barang, Aktiva, Giro,
Periode, User, SubTrans, ArusKas, Transaksi, etc.).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend                                                     │
│                                                              │
│  Components (SearchableSelect wrappers)                      │
│    ├─ GenericBrowsePicker      ─┐                            │
│    ├─ PerkiraanSelect           │                           │
│    ├─ CustomerPicker            ├─→ useBrowseSearch hook     │
│    └─ KasBankSelect            ─┘    ├─ debounce             │
│                                      ├─ min-chars guard      │
│                                      └─ TanStack Query       │
│                                                              │
│  Service                                                     │
│    └─ browseService             ─→ server functions          │
│                                                              │
│  Server Functions (authMiddleware)                            │
│    ├─ listBrowseTypesFn                                     │
│    ├─ searchBrowseFn                                        │
│    ├─ getAllBrowseFn                                        │
│    ├─ validateBrowseFn                                      │
│    └─ validateBrowseBatchFn                                 │
└──────────────────────────────────┬───────────────────────────┘
                                   │ HTTP (X-Access-Token)
┌──────────────────────────────────▼───────────────────────────┐
│ Backend (Go)                                                 │
│                                                              │
│  /api/browse/types      → browse config metadata             │
│  /api/browse/search     → SQL with placeholders <P:X>        │
│  /api/browse/all        → all rows (limited)                 │
│  /api/browse/validate   → 1 code → 1 row                     │
│  /api/browse/validate-batch → N codes → map                  │
│                                                              │
│  BrowseService                                               │
│    ├─ Type registration (hardcoded config map)               │
│    ├─ DB lookup (dbbrowseconfigs)                            │
│    ├─ Parent filter resolution (parent_<col> → <P:col>)      │
│    └─ User mode filtering (modeA/modeB/modeC)                │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic (string-only value)

```tsx
import { PerkiraanSelect } from '@/domains/browse'

function MyForm() {
  const [kode, setKode] = useState('')
  return (
    <PerkiraanSelect
      value={kode}
      onChange={setKode}
      posthutpiut="N"
    />
  )
}
```

### With parent filter

```tsx
import { GenericBrowsePicker } from '@/domains/browse'

function TransaksiForm({ kodeCust }) {
  const [kodeBrg, setKodeBrg] = useState('')
  return (
    <GenericBrowsePicker
      kodeBrowse="1012" // Barang
      value={kodeBrg}
      onChange={setKodeBrg}
      parentFilters={{ KODE_CUST: kodeCust }}
    />
  )
}
```

### Display-only (label for existing code)

```tsx
import { useBrowseDisplay } from '@/domains/browse'

function Header({ kodePerkiraan }) {
  const { label, isLoading } = useBrowseDisplay({
    kodeBrowse: '1001',
    code: kodePerkiraan,
    labelField: 'Keterangan',
  })
  return <span>{isLoading ? kodePerkiraan : label}</span>
}
```

## Backend Configuration

`kodeBrowse` definitions live in `dbbrowseconfigs` (override) or in the
hardcoded map in `backend/internal/browse/config.go` (defaults). Each
entry has:

| Field            | Description                                       |
| ---------------- | ------------------------------------------------- |
| `kodeBrowse`     | Unique identifier (e.g. "1001" for Perkiraan)     |
| `keyField`       | Column name that holds the value                  |
| `labelField`     | Column name that holds the display label          |
| `table`          | Table to query (defaults to type name)            |
| `searchFields`   | Columns to search with `q` (LIKE)                 |
| `userMode`       | SQL fragment for permission filtering             |
| `parentFilters`  | Map of `parent_<col>` → placeholder `<P:COL>`      |

To add a new browse type, register it in `RegisterDefaults()` in
`backend/internal/browse/config.go`.

## Adding a Specialized Picker

When a standard picker isn't enough (e.g. Perkiraan needs NERACA grouping,
Customer needs full address display), create a thin wrapper:

```tsx
// src/domains/browse/components/browse/MyPicker.tsx
import { GenericBrowsePicker } from './GenericBrowsePicker'

export function MyPicker({ value, onChange }) {
  return (
    <GenericBrowsePicker
      kodeBrowse="XXXX"
      value={value}
      onChange={onChange}
      keyField="Kode"
      labelField="Keterangan"
      renderLabel={(row) => `${row.Kode} - ${row.Keterangan}`}
      renderOption={(row) => (
        <div>
          <div className="font-medium">{row.Kode}</div>
          <div className="text-xs text-muted-foreground">{row.Keterangan}</div>
        </div>
      )}
    />
  )
}
```

Then export it from `src/domains/browse/index.ts`.

## Performance Notes

- `useBrowseTypes` caches for 1 hour (types rarely change).
- `useBrowseSearch` debounces input by 300ms and waits for 2+ chars.
- Search results are kept while typing (TanStack `placeholderData: prev`).
- Cache invalidation is exposed via `useInvalidateBrowse` for bulk imports.

## i18n

Translation keys live in `locales/en/browse.json` and `locales/id/browse.json`.
Import via your i18n provider's namespace mechanism.