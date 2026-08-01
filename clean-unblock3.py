import re

with open('backend/internal/features/accounting/kasbank/service.go', 'r') as f:
    content = f.read()

# 1. Fix HutPiut sections
create_hut_pattern = r'(\t\t// 6\. Save HutPiut \(Pelunasan\) if any\n\s*)for _, hp := range req\.HutPiutList \{'
create_hut_replace = r'\t\t// 6. Save HutPiut (Pelunasan) if any\n\t\t// Ensure NoBukti is set on all HutPiut items before insertion\n\t\tfor _, hp := range req.HutPiutList {\n\t\thp.NoBukti = noBukti\n\t\t}\n\t\tfor _, hp := range req.HutPiutList {'
content = re.sub(create_hut_pattern, create_hut_replace, content)

update_hut_pattern = r'(\t\t// Replace HutPiut \(Pelunasan\) if any\n\s*)for _, hp := range req\.HutPiutList \{'
update_hut_replace = r'\t\t// Replace HutPiut (Pelunasan) if any\n\t\t// Ensure NoBukti is set on all HutPiut items before insertion\n\t\tfor _, hp := range req.HutPiutList {\n\t\thp.NoBukti = noBukti\n\t\t}\n\t\tfor _, hp := range req.HutPiutList {'
content = re.sub(update_hut_pattern, update_hut_replace, content)

# 2. Add interface methods after GetByNoBukti
lines = content.split('\n')
new_lines = []
inserted = False
for line in lines:
    new_lines.append(line)
    if not inserted and line.strip().startswith('GetByNoBukti'):
        insertions = [
            '',
            '\t// GetPeriodeFromUser returns the active accounting period (bulan, tahun) for the given user',
            '\tGetPeriodeFromUser(ctx context.Context, userID string) (int, int, error)',
            '',
            '\t// GenerateNoBuktiPreview returns a preview voucher number and sequence for the given tipe and period',
            '\tGenerateNoBuktiPreview(ctx context.Context, tipe string, bulan, tahun int) (string, int, error)',
            '',
            '\t// LookupBagian returns department/bagian matching a search query',
            '\tLookupBagian(ctx context.Context, q string) ([]models.SDBAGIAN, error)',
            '',
            '\t// LookupAkumulasiAktiva returns accumulation accounts for Aktiva sub-form',
            '\tLookupAkumulasiAktiva(ctx context.Context, q string) ([]models.SDBPERKIRAAN, error)',
            '',
            '\t// LookupBiayaAktiva returns cost accounts for Aktiva sub-form',
            '\tLookupBiayaAktiva(ctx context.Context, q string) ([]models.SDBPERKIRAAN, error)',
            '',
            '\t// GenerateNoUrutAktiva generates the next NoUrut for Aktiva sub-form',
            '\tGenerateNoUrutAktiva(ctx context.Context, perkiraan, devisi string) (int, error)',
            '',
            '\t// GenerateNoUrutAktiva2 generates the next NoUrut2 for Aktiva sub-form',
            '\tGenerateNoUrutAktiva2(ctx context.Context, prefix, devisi string) (string, error)',
        ]
        new_lines.extend(insertions)
        inserted = True

content = '\n'.join(new_lines)

# 3. Add stub implementations after DB() method
db_func = 'func (s *SKasBankService) DB() *gorm.DB {\n\treturn s.db\n}'
pos = content.find(db_func) + len(db_func)
stub_impls = '''

// GetPeriodeFromUser returns the active accounting period for the user (stub).
func (s *SKasBankService) GetPeriodeFromUser(ctx context.Context, userID string) (int, int, error) {
	return 0, 0, errors.New("not implemented")
}

// GenerateNoBuktiPreview returns preview number (stub).
func (s *SKasBankService) GenerateNoBuktiPreview(ctx context.Context, tipe string, bulan, tahun int) (string, int, error) {
	return "", 0, errors.New("not implemented")
}

// LookupBagian (stub)
func (s *SKasBankService) LookupBagian(ctx context.Context, q string) ([]models.SDBAGIAN, error) {
	return nil, errors.New("not implemented")
}

// LookupAkumulasiAktiva (stub)
func (s *SKasBankService) LookupAkumulasiAktiva(ctx context.Context, q string) ([]models.SDBPERKIRAAN, error) {
	return nil, errors.New("not implemented")
}

// LookupBiayaAktiva (stub)
func (s *SKasBankService) LookupBiayaAktiva(ctx context.Context, q string) ([]models.SDBPERKIRAAN, error) {
	return nil, errors.New("not implemented")
}

// GenerateNoUrutAktiva (stub)
func (s *SKasBankService) GenerateNoUrutAktiva(ctx context.Context, perkiraan, devisi string) (int, error) {
	return 0, errors.New("not implemented")
}

// GenerateNoUrutAktiva2 (stub)
func (s *SKasBankService) GenerateNoUrutAktiva2(ctx context.Context, prefix, devisi string) (string, error) {
	return "", errors.New("not implemented")
}
'''

content = content[:pos] + stub_impls + content[pos:]

with open('backend/internal/features/accounting/kasbank/service.go', 'w') as f:
    f.write(content)

print("Done!")
