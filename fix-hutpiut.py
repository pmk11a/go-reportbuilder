#!/usr/bin/env python3
with open('backend/internal/features/accounting/kasbank/service.go', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '// 6. Save HutPiut (Pelunasan) if any' in line and i+2 < len(lines):
        if 'Ensure NoBukti' not in lines[i+1]:
            indent = line[:len(line) - len(line.lstrip())]
            lines.insert(i+1, f'{indent}\t\t// Ensure NoBukti is set on all HutPiut items before insertion\n')
            lines.insert(i+2, f'{indent}\t\tfor _, hp := range req.HutPiutList {{\n')
            lines.insert(i+3, f'{indent}\t\thp.NoBukti = noBukti\n')
            lines.insert(i+4, f'{indent}\t\t}}\n')
            print(f"Fixed CreateHeader at line {i+1}")
            break

with open('backend/internal/features/accounting/kasbank/service.go', 'w') as f:
    f.writelines(lines)
print("Done!")
