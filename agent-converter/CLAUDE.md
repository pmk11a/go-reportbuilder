# Agent-Converter — Coordination Entry Point

## Coordination Protocol (WAJIB BACA)
Sebelum memulai kerja apa pun, agent WAJIB:

1. **Baca** `.shared/CONTEXT.md` — project context lengkap
2. **Baca** `.shared/tasks.json` — task board saat ini
3. **Claim** task: update `assigned_to` di tasks.json
4. **Check dependency**: pastikan `depends_on` sudah done
5. **Kerjakan** sesuai role agent
6. **Update status**: done/blocked setelah selesai
7. **Tulis hasil** di `.shared/results/[task-id].md`

## Agent Roles

| Agent | Role | Routing Key |
|-------|------|-------------|
| **pi** | Quick edits, multi-file coding, flexible tasks | General coding, file ops |
| **claude** | Deep reasoning, architecture review, debugging | Complex analysis |
| **hermes** | Delphi migration, .pas scanning, SQL extraction | Delphi/Pascal files |

## Structure
```
agent-converter/
├── CLAUDE.md              ← This file
├── src/
│   ├── scanners/          ← Delphi scanners
│   ├── generators/        ← Code generators
│   └── orchestrator.py    ← Main controller
├── audit.py               ← CLI entry point
├── migration-status/      ← YAML manifests
└── MIGRATION_DASHBOARD.md ← Auto-generated report
```

## Current Phase: 1.2 (Whole-Project Scanner)
- [x] Dataclasses + Knowledge Graph
- [x] Folder walker (_discover_pas_files)
- [x] File categorizer (categorize_file)
- [x] Cross-reference builder
- [x] Knowledge graph serialization (JSON/MD)
- [x] Integration test with pwt/ (424 files, 0 errors)

## Next Phase: 1.3 (ProcedureScanner Review)
- [ ] Gap analysis: 86/211 procedures captured
- [ ] Fix scanner regex for no-param procedures
- [ ] Add function detection (currently 0 custom_funcs)
- [ ] Cross-form analysis (MyProcedure references)
