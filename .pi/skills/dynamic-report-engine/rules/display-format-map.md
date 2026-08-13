# DisplayFormat Mapping — `.fr3` → dbkolomlaporan.format_type → frontend

`.fr3` encodes display formats as opaque numeric `DisplayFormat.Kind` plus
optional `FormatStr` and `DecimalSeparator`. The mapping to
`dbkolomlaporan.format_type` is what the front-end `useNumberFormatter`
reads to pick a number formatter.

## Reference table

| `.fr3` DisplayFormat.Kind | FormatStr example | dbkolomlaporan.format_type | useNumberFormatter `type` |
|---|---|---|---|
| `1` (`fkNumeric`) | `"%2.2n"` | `currency` | `currency` |
| `1` (`fkNumeric`) | `"%2.0n"` | `number` | `number` |
| `1` (`fkNumeric`) | `"%2.0m"` | `money` | `money` |
| `2` (`fkDateTime`) | (any) | `date` | `date` |
| `3` (`fkInteger`) | (any) | `number` | `number` |
| `0` (none) | (none) | `text` | `text` |
| `9` (`fkFloat`) | `"%2.2f"` | `decimal` | `decimal` |
| `12` (`fkBoolean`) | `"True;False"` | `text` | `boolean` |

## Recognised-format strings (frontend)

`GroupedTable.vue` `formatCell()` accepts these format types:

- `numeric` → `Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, ... })`
- `decimal` → same as numeric, no thousands separator
- `money` → currency formatter with `Rp ` prefix
- `currency` → numeric + `Rp ` prefix
- `angka` → Indonesian-style digit grouping
- `number` → plain integer, no decimals
- `date` → `new Date(v).toLocaleDateString('id-ID')`
- `text` → string (default)

## Known gotcha

`.fr3` DisplayFormat `1` (`fkNumeric`) with `FormatStr="%2.0n"` is
**integer with thousand separator** (e.g. `1,234`). It should map to
`number`, NOT `currency`. The `format-type-number-not-currency.md`
memory feedback covers this in detail.

## Where to look when uncertain

1. Open the `.fr3` file in a text editor, find the `<TfrxMemoView>` for
   the column, check `DisplayFormat.Kind` and `DisplayFormat.FormatStr`.
2. Cross-reference with `dbkolomlaporan.format_type` for that report.
3. If they disagree, the front-end WILL render the wrong format. Fix in
   the seed SQL generator (`delphi-report-generator`), not in the renderer.