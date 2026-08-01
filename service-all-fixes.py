#!/usr/bin/env python3
with open('backend/internal/features/accounting/kasbank/service.go', 'r') as f:
    lines = f.readlines()

# Fix 1: Add NoBukti in CreateHeader HutPiut section
create_hut_idx = None
for i, line in enumerate(lines):
    if '// 6. Save HutPiut (Pelunasan) if any' in line:
        create_hut_idx = i
        break

if create_hut_idx is not None:
    indent = lines[create_hut_idx][:len(lines[create_hut_idx]) - len(lines[create_hut_idx].lstrip())]
    new_lines = [
        indent + '\t// Ensure NoBukti is set on all HutPiut items before insertion\n',
        indent + '\tfor _, hp := range req.HutPiutList {\n',
        indent + '\t\thp.NoBukti = noBukti\n',
        indent + '\t}\n',
    ]
    for j, nl in enumerate(reversed(new_lines)):
        lines.insert(create_hut_idx + 1, nl)
    print("Applied HutPiut fix in CreateHeader")

# Fix 2: Add methods to IKasBankService interface
get_by_no_bukti_line = None
for i, line in enumerate(lines):
    if line.strip().startswith('GetByNoBukti'):
        get_by_no_bukti_line = i
        break

if get_by_no_bukti_line is not None:
    new_interface_methods = [
        '\n\t// GetPeriodeFromUser returns the active accounting period (bulan, tahun) for the given user\n',
        '\tGetPeriodeFromUser(ctx context.Context, userID string) (int, int, error)\n',
        '\n\t// GenerateNoBuktiPreview returns a preview voucher number and sequence for the given tipe and period\n',
        '\tGenerateNoBuktiPreview(ctx context.Context, tipe string, bulan, tahun int) (string, int, error)\n',
    ]
    for method_line in reversed(new_interface_methods):
        lines.insert(get_by_no_bukti_line + 1, method_line)
    print("Added basic interface methods")

with open('backend/internal/features/accounting/kasbank/service.go', 'w') as f:
    f.writelines(lines)

print("Done!")
