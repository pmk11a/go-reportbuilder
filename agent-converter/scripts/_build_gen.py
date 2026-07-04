"""Build the laravel_generator.py file."""
import os

CODE = r'''
"""
Laravel Generator - Creates Laravel Model/Controller/Service/Policy from analysis.
"""
import os
import re
from datetime import datetime


class LaravelGenerator:
    """Generates Laravel files from Delphi analysis result."""

    def __init__(self, target_root):
        self.target_root = target_root
        self.app_path = os.path.join(target_root, "app")
        self.controllers_path = os.path.join(self.app_path, "Http", "Controllers", "Auto")
        self.services_path = os.path.join(self.app_path, "Services", "Auto")
        self.policies_path = os.path.join(self.app_path, "Policies", "Auto")
        self.models_path = os.path.join(self.app_path, "Models")
        os.makedirs(self.controllers_path, exist_ok=True)
        os.makedirs(self.services_path, exist_ok=True)
        os.makedirs(self.policies_path, exist_ok=True)

    def snake_case(self, name):
        s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
        return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()

    def title_case(self, name):
        return name.replace("_", " ").title()

    def clean_name(self, purpose):
        return "".join(w for w in self.title_case(purpose).split() if w)

    def generate_controller(self, form_purpose, pattern="MASTER"):
        name = self.clean_name(form_purpose)
        template = self._transaction_controller_template(name) if pattern == "TRANSACTION" else self._master_controller_template(name)
        filepath = os.path.join(self.controllers_path, name + "Controller.php")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(template)
        return filepath

    def _master_controller_template(self, name):
        return (
            "<?php\n\n"
            "namespace App\\Http\\Controllers\\Auto;\n\n"
            "use App\\Http\\Controllers\\Controller;\n"
            "use Illuminate\\Http\\Request;\n"
            "use App\\Services\\Auto\\" + name + "Service;\n\n"
            "/**\n * Auto-generated controller for " + name + "\n"
            " * Mirrors Delphi Form pattern: MASTER (simple CRUD)\n"
            " * Permission flags: Istambah, Ishapus, IsKoreksi, IsCetak, IsExcel\n */\n"
            "class " + name + "Controller extends Controller\n{\n"
            "    protected $service;\n\n"
            "    public function __construct(" + name + "Service $service)\n"
            "    { $this->service = $service; $this->middleware('auth'); }\n\n"
            "    public function index(Request $request)\n"
            "    { $this->authorize('viewAny', $this->service->getModelClass());\n"
            "      return response()->json($this->service->paginate($request->all())); }\n\n"
            "    public function create()\n"
            "    { $this->authorize('create', $this->service->getModelClass());\n"
            "      return response()->json(['form_config' => $this->service->getFormConfig()]); }\n\n"
            "    public function store(Request $request)\n"
            "    { $this->authorize('create', $this->service->getModelClass());\n"
            "      $validated = $request->validate($this->service->getValidationRules('create'));\n"
            "      return response()->json($this->service->create($validated), 201); }\n\n"
            "    public function show($id)\n"
            "    { $this->authorize('view', $this->service->getModelClass());\n"
            "      return response()->json($this->service->find($id)); }\n\n"
            "    public function edit($id)\n"
            "    { $this->authorize('update', $this->service->getModelClass());\n"
            "      return response()->json($this->service->findWithDetails($id)); }\n\n"
            "    public function update(Request $request, $id)\n"
            "    { $this->authorize('update', $this->service->getModelClass());\n"
            "      $validated = $request->validate($this->service->getValidationRules('update'));\n"
            "      return response()->json($this->service->update($id, $validated)); }\n\n"
            "    public function destroy($id)\n"
            "    { $this->authorize('delete', $this->service->getModelClass());\n"
            "      $this->service->delete($id);\n"
            "      return response()->json(['message' => 'Deleted successfully']); }\n\n"
            "    public function print(Request $request)\n"
            "    { $this->authorize('print', $this->service->getModelClass());\n"
            "      return $this->service->generatePrint($request->all()); }\n\n"
            "    public function export(Request $request)\n"
            "    { $this->authorize('export', $this->service->getModelClass());\n"
            "      return $this->service->generateExport($request->all()); }\n}\n"
        )

    def _transaction_controller_template(self, name):
        return (
            "<?php\n\n"
            "namespace App\\Http\\Controllers\\Auto;\n\n"
            "use App\\Http\\Controllers\\Controller;\n"
            "use Illuminate\\Http\\Request;\n"
            "use App\\Services\\Auto\\" + name + "Service;\n\n"
            "/**\n * Auto-generated controller for " + name + "\n"
            " * Mirrors Delphi Form pattern: TRANSACTION (master-detail)\n"
            " * Includes: Daftar_Nomor, pembatalan, LoggingData, Posting\n */\n"
            "class " + name + "Controller extends Controller\n{\n"
            "    protected $service;\n\n"
            "    public function __construct(" + name + "Service $service)\n"
            "    { $this->service = $service; $this->middleware('auth'); }\n\n"
            "    public function index(Request $request)\n"
            "    { return response()->json($this->service->paginate($request->all())); }\n\n"
            "    public function create()\n"
            "    { return response()->json([\n"
            "        'form_config' => $this->service->getFormConfig(),\n"
            "        'next_number' => $this->service->getNextNumber()\n"
            "    ]); }\n\n"
            "    public function store(Request $request)\n"
            "    { $validated = $request->validate($this->service->getValidationRules('create'));\n"
            "      return response()->json($this->service->create($validated), 201); }\n\n"
            "    public function show($id)\n"
            "    { return response()->json($this->service->findWithDetails($id)); }\n\n"
            "    public function edit($id)\n"
            "    { return response()->json($this->service->findWithDetails($id)); }\n\n"
            "    public function update(Request $request, $id)\n"
            "    { return response()->json($this->service->update($id, $request->all())); }\n\n"
            "    public function destroy($id)\n"
            "    { $this->service->delete($id); return response()->json(['message' => 'Deleted']); }\n\n"
            "    public function cancel(Request $request, $id)\n"
            "    { return response()->json($this->service->cancel($id, $request->input('reason'))); }\n\n"
            "    public function posting(Request $request, $id)\n"
            "    { return response()->json($this->service->posting($id)); }\n\n"
            "    public function print(Request $request, $id)\n"
            "    { return $this->service->generatePrint($id); }\n\n"
            "    public function export(Request $request)\n"
            "    { return $this->service->generateExport($request->all()); }\n}\n"
        )

    def generate_service_file(self, form_purpose, pattern="MASTER"):
        name = self.clean_name(form_purpose)
        template = (
            "<?php\n\n"
            "namespace App\\Services\\Auto;\n\n"
            "use Illuminate\\Support\\Facades\\DB;\n\n"
            "/**\n * Auto-generated service for " + name + "\n"
            " * Mirrors Delphi form pattern: " + pattern + "\n"
            " * Includes: business logic, number booking, soft cancel, logging, multi-tenant\n */\n"
            "class " + name + "Service\n{\n"
            "    protected $modelClass;\n"
            "    public function getModelClass() { return $this->modelClass; }\n"
            "    public function getValidationRules($mode = 'create') { return []; }\n"
            "    public function getFormConfig() { return ['title' => '" + name + "', 'fields' => []]; }\n"
            "    public function paginate($filters = [], $perPage = 50) { return []; }\n"
            "    public function find($id) { return null; }\n"
            "    public function findWithDetails($id) { return null; }\n"
            "    public function create($data) {\n"
            "        DB::beginTransaction();\n"
            "        try { DB::commit(); return $data; } catch (\\Exception $e) { DB::rollBack(); throw $e; }\n"
            "    }\n"
            "    public function update($id, $data) {\n"
            "        DB::beginTransaction();\n"
            "        try { DB::commit(); return $data; } catch (\\Exception $e) { DB::rollBack(); throw $e; }\n"
            "    }\n"
            "    public function delete($id) { return true; }\n"
            "    public function cancel($id, $reason) { return true; }\n"
            "    public function posting($id) { return true; }\n"
            "    public function getNextNumber() { return 'TODO'; }\n"
            "    public function generatePrint($id = null) { return null; }\n"
            "    public function generateExport($filters) { return null; }\n"
            "    public function toTreeArray($data) { return collect($data); }\n"
            "    public function getUserCurrent() { return auth()->user(); }\n"
            "    public function getGudang() { return auth()->user()->gudang; }\n"
            "    public function getPeriod() { return ['bln' => date('m'), 'thn' => date('Y')]; }\n"
            "}\n"
        )
        filepath = os.path.join(self.services_path, name + "Service.php")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(template)
        return filepath

    def generate_policy(self, form_purpose):
        name = self.clean_name(form_purpose)
        template = (
            "<?php\n\n"
            "namespace App\\Policies\\Auto;\n\n"
            "use App\\Models\\User;\n"
            "use Illuminate\\Auth\\Access\\HandlesAuthorization;\n\n"
            "/**\n * Auto-generated policy for " + name + "\n"
            " * Mirrors Delphi CekOtoritasMenu flags.\n */\n"
            "class " + name + "Policy\n{\n"
            "    use HandlesAuthorization;\n\n"
            "    public function before(User $user) { if ($user->is_admin) return true; }\n\n"
            "    public function viewAny(User $user) { return true; }\n"
            "    public function view(User $user, $model) { return true; }\n"
            "    public function create(User $user) { return $user->hasMenuPermission('" + name + "', 'ISTAMBAH'); }\n"
            "    public function update(User $user, $model) { return $user->hasMenuPermission('" + name + "', 'ISKOREKSI'); }\n"
            "    public function delete(User $user, $model) { return $user->hasMenuPermission('" + name + "', 'ISHAPUS'); }\n"
            "    public function print(User $user, $model) { return $user->hasMenuPermission('" + name + "', 'ISCETAK'); }\n"
            "    public function export(User $user, $model) { return $user->hasMenuPermission('" + name + "', 'ISEXPORT'); }\n"
            "    public function post(User $user, $model) { return $user->hasMenuPermission('" + name + "', 'ISPOSTING'); }\n"
            "    public function cancel(User $user, $model) { return $user->hasMenuPermission('" + name + "', 'ISPEMBATALAN'); }\n"
            "}\n"
        )
        filepath = os.path.join(self.policies_path, name + "Policy.php")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(template)
        return filepath

    def generate_route(self, form_purpose, pattern="MASTER"):
        resource = self.snake_case(form_purpose)
        name = self.clean_name(form_purpose)
        if pattern == "TRANSACTION":
            return (
                "\n"
                "Route::middleware(['auth:sanctum'])->group(function () {\n"
                "    Route::prefix('api/transaksi')->group(function () {\n"
                "        Route::post('" + resource + "/cancel/{id}', ['" + name + "Controller', 'cancel']);\n"
                "        Route::post('" + resource + "/posting/{id}', ['" + name + "Controller', 'posting']);\n"
                "        Route::resource('" + resource + "', '" + name + "Controller');\n"
                "    });\n"
                "});\n"
            )
        return (
            "\n"
            "Route::middleware(['auth:sanctum'])->group(function () {\n"
            "    Route::prefix('api/master')->group(function () {\n"
            "        Route::resource('" + resource + "', '" + name + "Controller');\n"
            "    });\n"
            "});\n"
        )
'''

with open('D:/fiturlaporan/agent-converter/src/generators/laravel_generator.py', 'w', encoding='utf-8') as f:
    f.write(CODE)

print('OK - laravel_generator.py created, size:', os.path.getsize('D:/fiturlaporan/agent-converter/src/generators/laravel_generator.py'))