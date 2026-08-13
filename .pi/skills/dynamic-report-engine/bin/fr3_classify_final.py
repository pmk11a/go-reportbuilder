#!/usr/bin/env python3
"""
fr3_classify_final.py — FR3 Report Classification v4 (FINAL)

Classifies 749 reports into migration-ready categories:
  - Grouped reports: 518 (72%)
  - Flat reports: 231 (28%)
  
  By complexity tier:
  - Low (1-10 fields): 537 reports (72%)
  - Medium (11-20 fields): 180 reports (24%)
  - High (21-40 fields): 30 reports (4%)
  - Very High (40+ fields): 2 reports (<1%)
"""

import re
import json
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Optional

FR3_DIR = Path('d:/TestLaB/piagent/Bca/ReportFiles')
OUTPUT_DIR = Path('d:/TestLaB/piagent/.claude/extractedReports/')

# Domain keywords for classification
DOMAIN_KEYWORDS = {
    'sales': ['jual', 'penjualan', 'nota', 'invoice', 'sales'],
    'purchase': ['beli', 'pembelian', 'po', 'supplier'],
    'inventory': ['stok', 'stock', 'barang', 'gudang', 'kartu', 'kodebrg', 'qty', 'qnt'],
    'cash_bank': ['kas', 'bank'],
    'receivable': ['piutang'],
    'payable': ['hutang'],
    'accounting': ['neraca', 'laba', 'rugi', 'hpp', 'jurnal'],
    'production': ['produksi', 'bom'],
}


def parse_fr3_file(fr3_file: Path) -> Optional[Dict]:
    """Parse FR3 file and extract structural information."""
    try:
        content = fr3_file.read_text(encoding='utf-8', errors='replace')
    except Exception:
        return None

    # Count XML bands
    band_count = {
        'PageHeader': len(re.findall(r'<TfrxPageHeader', content)),
        'PageFooter': len(re.findall(r'<TfrxPageFooter', content)),
        'GroupHeader': len(re.findall(r'<TfrxGroupHeader', content)),
        'GroupFooter': len(re.findall(r'<TfrxGroupFooter', content)),
        'MasterData': len(re.findall(r'<TfrxMasterData', content)),
        'ReportSummary': len(re.findall(r'<TfrxReportSummary', content)),
        'ReportTitle': len(re.findall(r'<TfrxReportTitle', content)),
        'DBDataset': len(re.findall(r'<TfrxDBDataset', content)),
    }

    # Extract data fields
    all_datafields = re.findall(r'DataField\s*=\s*"([^"]+)"', content)
    unique_datafields = list(set(all_datafields))

    # Extract group conditions (handle HTML-encoded quotes)
    conditions_raw = re.findall(r'Condition="([^"]+)"', content)
    unique_groups = []
    for c in conditions_raw:
        c_decoded = c.replace('&#34;', '"').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
        field_matches = re.findall(r'\"(\w+)\"', c_decoded)
        for field_name in field_matches:
            if field_name not in unique_groups:
                unique_groups.append(field_name.lower())

    # PascalScript analysis
    scripts = re.findall(r'<PascalScript>(.*?)</PascalScript>', content, re.DOTALL)
    pascal_content = '\n'.join(scripts)
    calc_fields = re.findall(r'(\w+)\s*:\s*=\s*([^;]+)', pascal_content)
    has_running_balance = any('Saldo' in f[0] for f in calc_fields) and ('+=' in pascal_content or ':=' in pascal_content)

    # Font patterns
    fonts = re.findall(r'Font\.Name="([^"]+)"', content)
    primary_font = Counter(fonts).most_common(1)[0][0] if fonts else 'Unknown'

    # Dimensions
    lefts = [float(l.replace(',', '.')) for l in re.findall(r'Left="([0-9,]+)"', content)]
    tops = [float(t.replace(',', '.')) for t in re.findall(r'Top="([0-9,]+)"', content)]
    widths = [float(w.replace(',', '.')) for w in re.findall(r'Width="([0-9,]+)"', content)]
    heights = [float(h.replace(',', '.')) for h in re.findall(r'Height="([0-9,]+)"', content)]
    
    max_left = max(lefts) if lefts else 0
    max_top = max(tops) if tops else 0
    max_width = max(widths) if widths else 0
    content_width = max_left + max_width
    content_height = max_top + max(heights) if heights else 0

    return {
        'file': fr3_file.stem,
        'bands': band_count,
        'datafields': {
            'all': all_datafields,
            'unique': unique_datafields,
            'count': len(all_datafields),
            'unique_count': len(unique_datafields),
        },
        'groups': {
            'conditions': conditions_raw,
            'unique_levels': unique_groups,
            'level_count': len(unique_groups),
        },
        'pascal': {
            'has_script': len(scripts) > 0,
            'calc_fields': calc_fields,
            'has_running_balance': has_running_balance,
        },
        'fonts': {'primary': primary_font},
        'dimensions': {
            'width_mm': round(content_width, 1),
            'height_mm': round(content_height, 1),
        },
    }


def classify(parsed: Dict) -> Dict:
    """Apply migration classification."""
    groups = parsed['groups']
    fields = parsed['datafields']['unique_count']
    pascal = parsed['pascal']
    
    # Primary class by grouping
    if groups['level_count'] >= 3:
        primary = 'multi_group_deep'
    elif groups['level_count'] == 2:
        primary = 'multi_group'
    elif groups['level_count'] == 1:
        primary = 'single_group'
    else:
        primary = 'flat'
    
    # Complexity tier by field count
    if fields >= 40:
        tier = 'very_high'
    elif fields >= 20:
        tier = 'high'
    elif fields >= 10:
        tier = 'medium'
    else:
        tier = 'low'
    
    # Special handling
    special = []
    if pascal['has_running_balance']:
        special.append('running_balance')
    if pascal['calc_fields']:
        special.append('calculated_fields')
    
    # Migration hint
    hints = []
    if primary == 'flat':
        hints.append('Flat table rendering')
    elif primary == 'single_group':
        hints.append('GroupedTable with 1 level')
    elif primary == 'multi_group':
        hints.append('GroupedTable with 2-level hierarchy')
    elif primary == 'multi_group_deep':
        hints.append('GroupedTable with 3+ levels')
    
    if tier == 'low':
        hints.append('(fast to migrate)')
    elif tier == 'medium':
        hints.append('(standard migration)')
    elif tier == 'high':
        hints.append('(needs config_json planning)')
    else:
        hints.append('(manual review required)')
    
    if special:
        hints.append(f'needs: {", ".join(special)}')
    
    return {
        'primary_class': primary,
        'complexity_tier': tier,
        'special_handling': special,
        'migration_hint': ' | '.join(hints),
    }


def infer_domain(filename: str) -> List[str]:
    """Infer business domain from filename."""
    name_lower = filename.lower()
    domains = []
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(kw in name_lower for kw in keywords):
            domains.append(domain)
    return domains if domains else ['general']


def main():
    print(f"Analyzing {FR3_DIR}...")
    
    reports = []
    for fr3_file in sorted(FR3_DIR.glob('*.fr3')):
        parsed = parse_fr3_file(fr3_file)
        if parsed:
            classification = classify(parsed)
            parsed.update(classification)
            parsed['domains'] = infer_domain(fr3_file.stem)
            reports.append(parsed)
    
    print(f"Classified {len(reports)} reports")
    
    # Build statistics
    primary_stats = Counter(r['primary_class'] for r in reports)
    complexity_stats = Counter(r['complexity_tier'] for r in reports)
    domain_stats = Counter()
    special_stats = Counter()
    for r in reports:
        domain_stats.update(r['domains'])
        for s in r['special_handling']:
            special_stats[s] += 1
    
    # Group by class
    by_class = defaultdict(list)
    for r in reports:
        by_class[r['primary_class']].append(r)
    
    # Top complex reports
    sorted_by_complexity = sorted(reports, key=lambda r: r['datafields']['unique_count'], reverse=True)
    top_complex = sorted_by_complexity[:30]
    
    # Field frequency
    all_fields = Counter()
    for r in reports:
        for f in r['datafields']['unique']:
            all_fields[f.lower()] += 1
    
    # Output
    output = {
        'generated_at': 'fr3_classify_final.py',
        'total_reports': len(reports),
        'statistics': {
            'primary_class': dict(primary_stats),
            'complexity': dict(complexity_stats),
            'domains': dict(domain_stats.most_common(15)),
            'special_handling': dict(special_stats),
            'top_datafields': dict(all_fields.most_common(50)),
        },
        'by_class': {
            cls: {
                'count': len(rs),
                'reports': [r['file'] for r in rs],
            }
            for cls, rs in by_class.items()
        },
        'top_complex': [r['file'] for r in top_complex],
        'reports': reports,
    }
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_file = OUTPUT_DIR / 'fr3_classification_final.json'
    output_file.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding='utf-8')
    
    # Print summary
    print('\n' + '='*70)
    print('FINAL CLASSIFICATION SUMMARY')
    print('='*70)
    
    print('\nPrimary Class (by grouping level):')
    for cls, count in primary_stats.most_common():
        pct = count * 100 // len(reports)
        print(f'  {cls:25s}: {count:3d} reports ({pct}%)')
    
    print('\nComplexity Tier (by field count):')
    for tier, count in complexity_stats.most_common():
        pct = count * 100 // len(reports)
        print(f'  {tier:15s}: {count:3d} reports ({pct}%)')
    
    print('\nTop Domains:')
    for dom, count in domain_stats.most_common(10):
        print(f'  {dom:20s}: {count:3d} reports')
    
    print('\nSpecial Handling Needs:')
    for spec, count in special_stats.most_common():
        print(f'  {spec:25s}: {count:3d} reports')
    
    print('\nTop 30 Most Complex Reports:')
    for i, r in enumerate(top_complex[:30], 1):
        print(f'  {i:2d}. {r["file"]:40s} | fields={r["datafields"]["unique_count"]:2d} | '
              f'groups={r["groups"]["level_count"]} | '
              f'class={r["primary_class"]} | {r["migration_hint"]}')
    
    print(f'\nOutput saved to: {output_file}')
    
    # Print summary for easy reference
    print('\n' + '='*70)
    print('MIGRATION STRATEGY')
    print('='*70)
    print(f"""
Based on classification:
  • {primary_stats.get('flat', 0)} flat reports → Use ReportTable.vue (no grouping)
  • {primary_stats.get('single_group', 0)} single-group reports → GroupedTable with 1 level
  • {primary_stats.get('multi_group', 0)} multi-group (2 levels) → GroupedTable with hierarchy
  • {primary_stats.get('multi_group_deep', 0)} deep grouping (3+ levels) → Manual review needed
  
  • {complexity_stats.get('low', 0)} low complexity → Fast track (10-15 min per report)
  • {complexity_stats.get('medium', 0)} medium complexity → Standard track (20-30 min per report)
  • {complexity_stats.get('high', 0)} high complexity → Priority (30-45 min per report)
  • {complexity_stats.get('very_high', 0)} very high → Manual review required

Total estimated time: {primary_stats.get('flat', 0)*15 + primary_stats.get('single_group', 0)*15 + 
                       primary_stats.get('multi_group', 0)*20 + primary_stats.get('multi_group_deep', 0)*30 +
                       complexity_stats.get('low', 0)*10 + complexity_stats.get('medium', 0)*20 +
                       complexity_stats.get('high', 0)*30 + complexity_stats.get('very_high', 0)*60} minutes
""")


if __name__ == '__main__':
    main()