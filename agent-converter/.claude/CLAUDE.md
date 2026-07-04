# Agent-Converter Skill — Delphi to Laravel/Nuxt

## Context
Folder: D:\fiturlaporan\agent-converter
Project: Trade2Exchange Delphi -> Laravel + Nuxt migration
Source Delphi: D:\fiturlaporan\pwt\

## Workflow
1. Scan form: `python audit.py extract pwt/[Module]/[Form].pas`
2. Check status: `python audit.py status [FormName]`
3. List all: `python audit.py ls`
4. Update dashboard: `python audit.py report`

## Output
- Manifest YAML: D:\fiturlaporan\agent-converter\migration-status\[Form].yaml
- Dashboard: D:\fiturlaporan\agent-converter\MIGRATION_DASHBOARD.md

## Key Rules
- 428 Delphi .pas files di pwt/
- Status di YAML: not_started, partially_converted, completed, blocked
- Target backend: be-fitur/ (Laravel 12 + SQLSRV)
- Target frontend: fe-fitur/ (Nuxt 3 + Tailwind)
- Authentication: Sanctum + DBFLPASS table
- Multi-tenant: gDatabase/gProgram/gKodeGudang -> session config
