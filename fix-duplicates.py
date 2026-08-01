with open('backend/internal/features/accounting/kasbank/service.go', 'r') as f:
    lines = f.readlines()

# Find duplicates of GetPeriodeFromUser and GenerateNoBuktiPreview that appear twice in interface
# We want to keep the first occurrence after GetByNoBukti and remove the second occurrence before GenerateNoBukti

in_interface = False
interface_start = -1
interface_end = -1

for i, line in enumerate(lines):
    if 'type IKasBankService interface {' in line:
        in_interface = True
        interface_start = i
    if in_interface and line.strip() == '}' and interface_end == -1:
        interface_end = i
        break

if interface_start != -1 and interface_end != -1:
    print(f"Interface from line {interface_start+1} to {interface_end+1}")
    
    # Now within this range, look for duplicate GetPeriodeFromUser/GenerateNoBuktiPreview
    # The first set should stay, the second (before GenerateNoBukti) should go
    # Find all occurrences of these method names
    gen_lines = []
    for i in range(interface_start, interface_end + 1):
        if ('GetPeriodeFromUser' in lines[i] or 'GenerateNoBuktiPreview' in lines[i]) and 'func' not in lines[i]:
            gen_lines.append((i, lines[i]))
    
    print(f"Found {len(gen_lines)} lines with these patterns in interface")
    
    # Simpler approach: just remove ALL lines containing GetPeriodeFromUser or GenerateNoBuktiPreview 
    # except those immediately following GetByNoBukti (the ones we intentionally added)
    # Actually, let's rebuild the interface section properly
    
new_lines = []
skip_until_next = False
i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if we're inside the interface section
    if 'type IKasBankService interface {' in line:
        new_lines.append(line)
        i += 1
        in_intf = True
        continue
    
    if in_intf and line.strip() == '}':
        new_lines.append(line)
        in_intf = False
        i += 1
        continue
    
    if in_intf:
        # Skip duplicate method declarations that appear after GenerateNoUrutAktiva2 
        # and before GenerateNoBukti
        if 'GenerateNoUrutAktiva2' in line:
            next_lines_are_dups = True
        if next_lines_are_dups and ('GetPeriodeFromUser' in line or 'GenerateNoBuktiPreview' in line):
            i += 1
            continue
        if next_lines_are_dups and 'GenerateNoBukti' in line:
            next_lines_are_dups = False
        
        new_lines.append(line)
    
    else:
        new_lines.append(line)
    
    i += 1

with open('backend/internal/features/accounting/kasbank/service.go', 'w') as f:
    f.writelines(new_lines)

print("Duplicates removed!")
