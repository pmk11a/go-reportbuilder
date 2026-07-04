# Scanning Rules — Delphi to Laravel Conversion

## Phase 1: Source Code Analysis (Static Scan)

### Step 1: Parse frm file header
Extract: UnitName, InheritsFrom, PrivateVariables, ObjectProperties

### Step 2: Parse form events
Scan for: FormOnCreate, FormOnShow, FormOnClose
Extract: procedure bodies, field names, variable declarations

### Step 3: Scan component references
Parse ComponentEvents block for:
- TcxDBLookupComboBox properties: KeyItemIndex, LabelItemIndex, DBEdit2, DBTable2
- TcxGrid columns: DataBinding.ValueType, DataBinding.ValueTypeClass
- TdxDBEdit, TcxDBTextEdit, TcxDBDateEdit, TcxDBCurrencyEdit → input field
- TcxDBCheckBox → boolean toggle
- Tfr3 → report file

### Step 4: Extract business logic
In frm file:
- Click handlers: btnTambahClick, btnHapusClick, btnSimpanClick, btnBatalClick
- Exit handlers: cbKodeBrgExit, txtNamaBrgExit
- Change handlers: dxDBGrid column changes

### Step 5: Trace to MyProcedure.pas
Find ALL referenced procedures:
- Procedure names called from form
- Check parameter signatures
- Identify database calls (DataBuka, DataBersyarat, DataUrut)
- Identify global variable reads/writes

### Step 6: Check FrmUtama references
Verify form is referenced in FrmUtama:
- Find form instance: e.g., Var FrBeli: TFrbeli;
- Find menu assignment: case Tag of ... -> opens form
- Verify CekOtoritasMenu pattern

## Phase 2: Validation Gates (NON-NEGOTIABLE)

### Gate 1: Component Completeness
FAIL if: Form has object instances not declared in header/private section
Action: Flag missing component declaration → manual review required

### Gate 2: Event Handler Integrity
FAIL if: Form mentions method name but no procedure body found
Action: Check MyProcedure.pas for helper procedures
         If not found → flag as orphan handler

### Gate 3: Table Column Reference Consistency
FAIL if: Form references table column not in DB schema
ACTION: Check against DB schema, flag missing columns
        Check both source (frm) and destination (Laravel model)

### Gate 4: Business Rule Completeness
FAIL if: Click handler has logic not traceable to known pattern
ACTION: Map to Form Pattern from catalog
        If unique pattern → document as new pattern

### Gate 5: Report Template Binding
FAIL if: Form references fr3 file not found
ACTION: Check ReportPreview directory
        If missing → flag for manual extraction

## Phase 3: Code Generation

### Step 1: Generate Model (Eloquent)
From frm field declarations + form object properties
- Map Delphi types to PHP types
- Infer fillable fields from form components
- Define relationships from form structure

### Step 2: Generate Controller
Based on matched Form Pattern:
- Master Form → 7 methods (index, create, store, show, edit, update, destroy)
- Master-Detail → 10+ methods (+ post, cancel, print, export)
- Browser → extend BrowseService
- Setting → 3 methods (show, update)

### Step 3: Generate Service Layer
Business logic extracted from:
- frm event handlers (click, exit, change)
- MyProcedure.pas shared procedures
- Global variable reads/writes → dependency injection

### Step 4: Generate Policy
Map CekOtoritasMenu parameters:
- Istambah → create
- Ishapus → delete
- IsKoreksi → update
- IsCetak → print
- IsExcel → export

### Step 5: Generate Frontend Routes
Update:
- be-fitur/routes/api.php
- fe-fitur/pages/ (Nuxt)
- fe-fitur/stores/ (Pinia state management)

## Phase 4: Verification

### Gate 6: Cross-reference Audit
- All frm components mapped to Vue props/bindings
- All frm event handlers mapped to JS methods
- All frm TADOQuery mapped to Eloquent/DB queries
- All frm fr3 reports mapped to Laravel reports
- All frm globals mapped to session/config

### Gate 7: Permission Mapping Validation
- Every opened form in FrmUtama must have Policy
- Every Policy must match CekOtoritasMenu flags
- Admin bypass must be preserved

