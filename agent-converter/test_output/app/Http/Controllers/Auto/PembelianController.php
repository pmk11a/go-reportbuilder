<?php

namespace App\Http\Controllers\Auto;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Auto\PembelianService;

/**
 * Auto-generated controller for Pembelian
 * Mirrors Delphi Form pattern: TRANSACTION (master-detail)
 * Includes: Daftar_Nomor, pembatalan, LoggingData, Posting
 */
class PembelianController extends Controller
{
    protected $service;

    public function __construct(PembelianService $service)
    { $this->service = $service; $this->middleware('auth'); }

    public function index(Request $request)
    { return response()->json($this->service->paginate($request->all())); }

    public function create()
    { return response()->json([
        'form_config' => $this->service->getFormConfig(),
        'next_number' => $this->service->getNextNumber()
    ]); }

    public function store(Request $request)
    { $validated = $request->validate($this->service->getValidationRules('create'));
      return response()->json($this->service->create($validated), 201); }

    public function show($id)
    { return response()->json($this->service->findWithDetails($id)); }

    public function edit($id)
    { return response()->json($this->service->findWithDetails($id)); }

    public function update(Request $request, $id)
    { return response()->json($this->service->update($id, $request->all())); }

    public function destroy($id)
    { $this->service->delete($id); return response()->json(['message' => 'Deleted']); }

    public function cancel(Request $request, $id)
    { return response()->json($this->service->cancel($id, $request->input('reason'))); }

    public function posting(Request $request, $id)
    { return response()->json($this->service->posting($id)); }

    public function print(Request $request, $id)
    { return $this->service->generatePrint($id); }

    public function export(Request $request)
    { return $this->service->generateExport($request->all()); }
}
