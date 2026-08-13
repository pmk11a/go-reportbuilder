#!/usr/bin/env python3
"""
seed_generator.py — Generate complete DB seed from DBMENUREPORT + SP introspection

Pipeline:
  1. Read DBMENUREPORT (L0=3, 70 entries)
  2. Introspect SP signatures via sys.parameters
  3. Generate complete seed SQL:
     - dbmasterlaporan (UPSERT)
     - dbquerylaporan (SP call with proper params)
     - dbparameterlaporan (filter config from SP params)
     - dbkolomlaporan (placeholder - needs manual mapping)
  4. Output: seed_complete.sql + seed_manifest.json

Usage:
  python seed_generator.py --db dbbcagroup --user sa --pass anekajc1a9 --host 192.168.56.1
"""

from __future__ import annotations
import argparse
import json
import pyodbc
import re
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional


# Mapping KODEMENU → SP name (from FrmReportPreview.pas analysis)
# This is the "knowledge base" that needs to be maintained
CODE_TO_SP: dict[str, str] = {
    # Kas & Bank
    '020101': 'Sp_LapKasHarian',
    '020102': 'Sp_LapBankHarian',
    '020103': 'Sp_LapPosisiBankKasPiutang',
    '020106': 'Sp_LapDaftarDeposito',
    '020107': 'Sp_LapDaftarGiroDiterima',
    '020108': 'Sp_LapDaftarGiroDibuka',
    '020109': 'Sp_LapBonSementara',
    
    # Jurnal
    '020201': 'Sp_LapJurnal',
    '020204': 'Sp_LapBiaya',
    '020205': 'Sp_LapAktiva',
    '020206': 'Sp_LapBiayaPenyusutan',
    
    # Piutang
    '020302': 'Sp_LapSisaPiutang',
    '020303': 'Sp_LapPelunasanPiutang',
    '020304': 'Sp_LapSaldoPiutang',
    '020305': 'Sp_LapUmurPiutang',
    
    # Piutang Detail
    '020402': 'Sp_LapSisaPiutangDetail',
    '020403': 'Sp_LapPelunasanPiutangDetail',
    '020404': 'Sp_LapSaldoPiutangDetail',
    '020405': 'Sp_LapUmurPiutangDetail',
    '020406': 'Sp_LapKartuPiutangDetail',
    '020407': 'Sp_LapMonitoringPembayaranPiutang',
    
    # Keuangan
    '020501': 'Sp_LapNeracaLajur',
    '020502': 'Sp_LapHPP',
    '020503': 'Sp_LapLabaRugi',
    '020504': 'Sp_LapNeraca',
    '020505': 'Sp_LapNeracaPenunjang',
    '020506': 'Sp_LapMutasi',
    '020507': 'Sp_LapMutasiKeuangan',
    
    # ACC
    '025711': 'Sp_LapPenerimaanACCPerNobukti',
    '025712': 'Sp_LapPenerimaanACCPerBarang',
    '025713': 'Sp_LapPenerimaanACCPerSupplier',
    '025731': 'Sp_LapReturPembelianACCPerNobukti',
    '025732': 'Sp_LapReturPembelianACCPerBarang',
    '025733': 'Sp_LapReturPembelianACCPerSupplier',
    '025741': 'Sp_LapReturPembelianGDGPerNobukti',
    '025743': 'Sp_LapReturPembelianGDGPerSupplier',
    
    # Transfer
    '025801': 'Sp_LapTransferInDetail',
    '025802': 'Sp_LapTransferOutDetail',
    '025902': 'Sp_LapPembelianACCRekening',
    
    # Sales
    '030201': 'Sp_LapPenawaranPerNobukti',
    '030202': 'Sp_LapPenawaranPerBarang',
    '030203': 'Sp_LapPenawaranPerCustomer',
    '030204': 'Sp_LapPenawaranPerMarketing',
    '030314': 'Sp_LapCashBack',
    '030325': 'Sp_LapReturSuratJalan',
    '030326': 'Sp_LapReturSuratJalanACC',
    '030351': 'Sp_LapTargetSales',
    '030361': 'Sp_LapKomisiPelunasan',
    '030362': 'Sp_LapKomisiSales',
    
    # Transfer Barang
    '040361': 'Sp_LapTransferBarangPerNobukti',
    '040362': 'Sp_LapTransferBarangPerBarang',
    
    # Production
    '040501': 'Sp_LapUbahKemasanBahanPerNobukti',
    '040502': 'Sp_LapUbahKemasanBahanPerBarang',
    '040701': 'Sp_LapOpnameBahanPerNobukti',
    '040702': 'Sp_LapOpnameBahanPerBarang',
    '040801': 'Sp_LapOpnameBarangPerNobukti',
    '040802': 'Sp_LapOpnameBarangPerBarang',
    '040851': 'Sp_LapHasilProduksiPerNobukti',
    '040852': 'Sp_LapHasilProduksiPerBarang',
    '040861': 'Sp_LapHasilProduksiACCPerNobukti',
    '040862': 'Sp_LapHasilProduksiACCPerBarang',
    
    # Stock
    '050101': 'Sp_LapStockQuantity',
    '050102': 'Sp_LapStockRupiah',
    '050103': 'Sp_LapStockQtyRupiah',
    '050104': 'Sp_LapStockAkhirBarangProduksi',
    '050105': 'Sp_LapStockFisikGudang',
    '050106': 'Sp_LapStockHarian',
    '050107': 'Sp_LapKatalogBarang',
    '050201': 'Sp_LapKartuStockQnt',
    '050202': 'Sp_LapKartuStockQntRupiah',
}

# SP parameter signatures (from Sys.parameters introspection)
# Format: SP_NAME → [(param_name, type_name, is_output)]
# These will be populated dynamically from database
SP_SIGNATURES: dict[str, list[dict]] = {}

# Column mapping templates (needs manual refinement per SP)
COLUMN_TEMPLATES: dict[str, list[dict]] = {
    'Sp_LapKasHarian': [
        {'nama_kolom': 'Tanggal', 'label_tampil': 'Tanggal', 'format_type': 'date', 'alignment': 'center', 'is_summable': 0},
        {'nama_kolom': 'NoBukti', 'label_tampil': 'No. Bukti', 'format_type': 'text', 'alignment': 'left', 'is_summable': 0},
        {'nama_kolom': 'Keterangan', 'label_tampil': 'Keterangan', 'format_type': 'text', 'alignment': 'left', 'is_summable': 0},
        {'nama_kolom': 'Debit', 'label_tampil': 'Debit', 'format_type': 'currency', 'alignment': 'right', 'is_summable': 1},
        {'nama_kolom': 'Kredit', 'label_tampil': 'Kredit', 'format_type': 'currency', 'alignment': 'right', 'is_summable': 1},
        {'nama_kolom': 'Saldo', 'label_tampil': 'Saldo', 'format_type': 'currency', 'alignment': 'right', 'is_summable': 1},
    ],
    'Sp_LapBankHarian': [
        {'nama_kolom': 'Tanggal', 'label_tampil': 'Tanggal', 'format_type': 'date', 'alignment': 'center', 'is_summable': 0},
        {'nama_kolom': 'NoBukti', 'label_tampil': 'No. Bukti', 'format_type': 'text', 'alignment': 'left', 'is_summable': 0},
        {'nama_kolom': 'Perkiraan', 'label_tampil': 'Perkiraan', 'format_type': 'text', 'alignment': 'left', 'is_summable': 0},
        {'nama_kolom': 'Debit', 'label_tampil': 'Debit', 'format_type': 'currency', 'alignment': 'right', 'is_summable': 1},
        {'nama_kolom': 'Kredit', 'label_tampil': 'Kredit', 'format_type': 'currency', 'alignment': 'right', 'is_summable': 1},
        {'nama_kolom': 'Saldo', 'label_tampil': 'Saldo', 'format_type': 'currency', 'alignment': 'right', 'is_summable': 1},
    ],
}

# Parameter mapping templates (maps SP params to UI filter config)
PARAM_MAPPING: dict[str, dict] = {
    '@@TglAw': {'nama_filter': 'tanggal_awal', 'label': 'Tanggal Awal', 'tipe_input': 'date', 'wajib_isi': 1},
    '@@TglAk': {'nama_filter': 'tanggal_akhir', 'label': 'Tanggal Akhir', 'tipe_input': 'date', 'wajib_isi': 1},
    '@@Perkiraan': {'nama_filter': 'perkiraan', 'label': 'Perkiraan', 'tipe_input': 'browse', 'wajib_isi': 0, 'kode_browse': '0001'},
    '@@Divisi': {'nama_filter': 'divisi', 'label': 'Divisi', 'tipe_input': 'browse', 'wajib_isi': 0, 'kode_browse': '0001'},
    '@@Tipe': {'nama_filter': 'tipe', 'label': 'Tipe Jurnal', 'tipe_input': 'browse', 'wajib_isi': 0, 'kode_browse': '0013'},
}


def get_connection(host: str, database: str, user: str, password: str):
    """Create SQL Server connection."""
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={host};"
        f"DATABASE={database};"
        f"UID={user};"
        f"PWD={password};"
    )
    return pyodbc.connect(conn_str)


def introspect_sp_signature(conn, sp_name: str) -> list[dict]:
    """Get SP parameter signatures from sys.parameters."""
    cur = conn.cursor()
    cur.execute(f'''
        SELECT p.name, t.name as type_name, p.max_length, p.is_output, p.default_value
        FROM sys.procedures pr
        JOIN sys.parameters p ON pr.object_id = p.object_id
        JOIN sys.types t ON p.user_type_id = t.user_type_id
        WHERE pr.name = '{sp_name}'
        ORDER BY p.parameter_id
    ''')
    
    params = []
    for r in cur.fetchall():
        params.append({
            'name': r[0],
            'type': r[1],
            'max_length': r[2],
            'is_output': r[3],
            'default': r[4]
        })
    return params


def introspect_all_sp_signatures(conn) -> dict[str, list[dict]]:
    """Introspect all SP signatures from CODE_TO_SP mapping."""
    signatures = {}
    for kode, sp_name in CODE_TO_SP.items():
        sig = introspect_sp_signature(conn, sp_name)
        if sig:
            signatures[sp_name] = sig
        else:
            print(f"  WARNING: SP '{sp_name}' not found, skipping")
    return signatures


def get_menu_data(conn) -> list[dict]:
    """Read DBMENUREPORT for L0=3 entries."""
    cur = conn.cursor()
    cur.execute('''
        SELECT KODEMENU, Keterangan, L0, ACCESS 
        FROM DBMENUREPORT 
        WHERE L0 = 3 AND LEN(KODEMENU) = 6
        ORDER BY KODEMENU
    ''')
    
    menus = []
    for r in cur.fetchall():
        menus.append({
            'kode_menu': r[0],
            'nama_menu': r[1],
            'l0': r[2],
            'access': r[3]
        })
    return menus


def get_existing_master(conn) -> set[str]:
    """Get existing KODEMENU in dbmasterlaporan."""
    cur = conn.cursor()
    cur.execute('SELECT KODEMENU FROM dbmasterlaporan')
    return {r[0] for r in cur.fetchall()}


def generate_master_sql(menus: list[dict], existing: set[str]) -> list[str]:
    """Generate UPSERT SQL for dbmasterlaporan."""
    sql = []
    sql.append("-- =====================================================")
    sql.append("-- DBMASTERLAPORAN SEED")
    sql.append("-- Source: DBMENUREPORT (L0=3)")
    sql.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql.append("-- =====================================================")
    sql.append("")
    
    for menu in menus:
        kode = menu['kode_menu']
        nama = menu['nama_menu'].replace("'", "''")
        
        if kode in existing:
            # UPSERT: UPDATE existing
            sql.append(f"-- Update existing: {kode}")
            sql.append(f"UPDATE dbmasterlaporan")
            sql.append(f"SET nama_laporan = '{nama}',")
            sql.append(f"    status_aktif = 1,")
            sql.append(f"    updated_at = GETDATE()")
            sql.append(f"WHERE KODEMENU = '{kode}';")
        else:
            # INSERT new
            sql.append(f"-- Insert new: {kode}")
            sql.append(f"INSERT INTO dbmasterlaporan (KODEMENU, nama_laporan, status_aktif, footer_bands)")
            sql.append(f"VALUES ('{kode}', '{nama}', 1, '[]');")
        
        sql.append("GO")
        sql.append("")
    
    return sql


def generate_query_sql(menus: list[dict]) -> list[str]:
    """Generate INSERT SQL for dbquerylaporan."""
    sql = []
    sql.append("-- =====================================================")
    sql.append("-- DBQUERYLAPORAN SEED")
    sql.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql.append("-- =====================================================")
    sql.append("")
    
    for menu in menus:
        kode = menu['kode_menu']
        sp_name = CODE_TO_SP.get(kode)
        
        if not sp_name:
            continue
        
        # Build parameter placeholders
        params = SP_SIGNATURES.get(sp_name, [])
        placeholders = ', '.join([f"@{p['name']}" for p in params if not p['is_output']])
        
        if placeholders:
            query = f"EXEC {sp_name} {placeholders}"
        else:
            query = f"EXEC {sp_name}"
        
        # Config JSON for query
        config_json = json.dumps({
            "static_params": {p['name']: "" for p in params if not p['is_output']},
            "display_role": "detail",
            "sp_signature": sp_name
        }, ensure_ascii=False)
        
        sql.append(f"-- Query for {kode}: {sp_name}")
        sql.append(f"INSERT INTO dbquerylaporan (id_laporan, nama_dataset, urutan, query_sumber_data, config_json)")
        sql.append(f"SELECT id_laporan, 'dataset_utama', 1, '{query.replace(chr(39), chr(39)+chr(39))}', '{config_json}'")
        sql.append(f"FROM dbmasterlaporan WHERE KODEMENU = '{kode}';")
        sql.append("GO")
        sql.append("")
    
    return sql


def generate_parameter_sql(menus: list[dict]) -> list[str]:
    """Generate INSERT SQL for dbparameterlaporan."""
    sql = []
    sql.append("-- =====================================================")
    sql.append("-- DBPARAMETERLAPORAN SEED")
    sql.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql.append("-- =====================================================")
    sql.append("")
    
    for menu in menus:
        kode = menu['kode_menu']
        sp_name = CODE_TO_SP.get(kode)
        
        if not sp_name:
            continue
        
        params = SP_SIGNATURES.get(sp_name, [])
        
        for param in params:
            if param['is_output']:
                continue
            
            param_name = param['name']
            # Map to filter config
            filter_config = PARAM_MAPPING.get(param_name, {
                'nama_filter': param_name,
                'label': param_name.replace('@', '').replace('_', ' '),
                'tipe_input': 'text',
                'wajib_isi': 0
            })
            
            nama_filter = filter_config['nama_filter'].replace("'", "''")
            label = filter_config['label'].replace("'", "''")
            tipe_input = filter_config['tipe_input']
            wajib_isi = filter_config['wajib_isi']
            kode_browse = filter_config.get('kode_browse')
            
            kode_browse_sql = f"'{kode_browse}'" if kode_browse else "NULL"
            
            sql.append(f"-- Parameter for {kode}: {param_name}")
            sql.append(f"INSERT INTO dbparameterlaporan (id_laporan, nama_filter, label, tipe_input, wajib_isi, kode_browse)")
            sql.append(f"SELECT id_laporan, '{nama_filter}', '{label}', '{tipe_input}', {wajib_isi}, {kode_browse_sql}")
            sql.append(f"FROM dbmasterlaporan WHERE KODEMENU = '{kode}';")
            sql.append("GO")
            sql.append("")
    
    return sql


def generate_column_sql(menus: list[dict]) -> list[str]:
    """Generate INSERT SQL for dbkolomlaporan."""
    sql = []
    sql.append("-- =====================================================")
    sql.append("-- DBKOLOMLAPORAN SEED")
    sql.append("-- Note: Columns are templates, needs manual refinement")
    sql.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql.append("-- =====================================================")
    sql.append("")
    
    for menu in menus:
        kode = menu['kode_menu']
        sp_name = CODE_TO_SP.get(kode)
        
        if not sp_name:
            continue
        
        # Use template if available
        columns = COLUMN_TEMPLATES.get(sp_name, [])
        
        if not columns:
            # Skip if no template (needs manual mapping)
            sql.append(f"-- WARNING: No column template for {sp_name} ({kode})")
            sql.append(f"-- Manual mapping required")
            sql.append("GO")
            sql.append("")
            continue
        
        for col in columns:
            nama_kolom = col['nama_kolom'].replace("'", "''")
            label_tampil = col['label_tampil'].replace("'", "''")
            format_type = col['format_type']
            alignment = col['alignment']
            is_summable = col['is_summable']
            
            sql.append(f"-- Column for {kode}: {col['nama_kolom']}")
            sql.append(f"INSERT INTO dbkolomlaporan (id_laporan, nama_dataset, nama_kolom, label_tampil, format_type, alignment, is_summable, is_visible, urutan_tampil)")
            sql.append(f"SELECT id_laporan, 'dataset_utama', '{nama_kolom}', '{label_tampil}', '{format_type}', '{alignment}', {is_summable}, 1, 1")
            sql.append(f"FROM dbmasterlaporan WHERE KODEMENU = '{kode}';")
            sql.append("GO")
            sql.append("")
    
    return sql


def generate_full_seed_script(conn, output_path: Path):
    """Generate complete seed script."""
    print("Reading DBMENUREPORT...")
    menus = get_menu_data(conn)
    print(f"  Found {len(menus)} L0=3 menus")
    
    print("Checking existing masterlaporan...")
    existing = get_existing_master(conn)
    print(f"  Existing: {len(existing)}, Missing: {len(menus) - len(existing)}")
    
    print("Introspecting SP signatures...")
    signatures = introspect_all_sp_signatures(conn)
    print(f"  Resolved: {len(signatures)} SPs")
    
    print("Generating seed SQL...")
    all_sql = []
    
    # Header
    all_sql.append("-- =====================================================")
    all_sql.append("-- COMPLETE SEED SCRIPT")
    all_sql.append("-- Source: DBMENUREPORT → dbmasterlaporan")
    all_sql.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    all_sql.append(f"-- Total Reports: {len(menus)}")
    all_sql.append("-- =====================================================")
    all_sql.append("")
    
    # Generate each section
    all_sql.extend(generate_master_sql(menus, existing))
    all_sql.extend(generate_query_sql(menus))
    all_sql.extend(generate_parameter_sql(menus))
    all_sql.extend(generate_column_sql(menus))
    
    # Footer
    all_sql.append("-- =====================================================")
    all_sql.append("-- END OF SEED")
    all_sql.append("-- =====================================================")
    
    # Write to file
    output_path.write_text('\n'.join(all_sql), encoding='utf-8')
    print(f"\nSeed script written to: {output_path}")
    print(f"  Total lines: {len(all_sql)}")
    
    # Generate manifest
    manifest = {
        'generated_at': datetime.now().isoformat(),
        'total_menus': len(menus),
        'existing_count': len(existing),
        'missing_count': len(menus) - len(existing),
        'sp_resolved': len(signatures),
        'menus': [
            {
                'kode_menu': m['kode_menu'],
                'nama_menu': m['nama_menu'],
                'sp_name': CODE_TO_SP.get(m['kode_menu']),
                'param_count': len(signatures.get(CODE_TO_SP.get(m['kode_menu']), [])),
                'column_template': 'Yes' if CODE_TO_SP.get(m['kode_menu']) in COLUMN_TEMPLATES else 'No',
            }
            for m in menus
        ]
    }
    
    manifest_path = output_path.with_suffix('.json')
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"Manifest written to: {manifest_path}")
    
    return manifest


def main():
    parser = argparse.ArgumentParser(description='Generate DB seed from DBMENUREPORT')
    parser.add_argument('--host', default='192.168.56.1', help='SQL Server host')
    parser.add_argument('--database', default='dbbcagroup', help='Database name')
    parser.add_argument('--user', default='sa', help='Username')
    parser.add_argument('--password', default='anekajc1a9', help='Password')
    parser.add_argument('--output', default='seed_complete.sql', help='Output file')
    args = parser.parse_args()
    
    output_path = Path(args.output)
    
    try:
        print(f"Connecting to {args.host}/{args.database}...")
        conn = get_connection(args.host, args.database, args.user, args.password)
        
        print("Generating seed script...")
        manifest = generate_full_seed_script(conn, output_path)
        
        print(f"\n✓ Complete! {manifest['missing_count']} new reports to add")
        
        conn.close()
        return 0
        
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
