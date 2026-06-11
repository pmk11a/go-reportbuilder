export interface ReportFilter {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'perkiraan';
  isRequired: boolean;
  defaultValue?: string;
}

export interface ReportDataset {
  id: string;
  name: string; // e.g. T1, T2
  spName: string; // e.g. Sp_LapSaldoAwal
  parameters: string[]; // e.g. ['@Perkiraan', '@TglAwal']
}

export interface HeaderColumn {
  content: string;
  colspan: number;
  width: string;
  style?: string;
  className?: string;
}

export interface HeaderRow {
  columns: HeaderColumn[];
}

export interface LayoutHeader {
  position: 'left' | 'center' | 'right';
  rows: HeaderRow[];
}

export interface TableHeaderCell {
  label: string;
  rowspan: number;
  colspan: number;
  width: string;
  className?: string;
  style?: string;
}

export interface TableBodyColumn {
  field: string;
  format: 'text' | 'number' | 'currency' | 'date';
  className?: string;
  style?: string;
}

export interface LayoutTable {
  id: string;
  datasetName: string;
  gridSpan: number; // 1-12
  headerRows: TableHeaderCell[][];
  bodyColumns: TableBodyColumn[];
}

export interface LayoutBody {
  layoutType: 'grid';
  tables: LayoutTable[];
}

export interface LayoutSignature {
  id: string;
  name: string;
  title: string;
  order: number;
}

export interface LayoutFooter {
  signatureColumns: number; // Max 3
  signatures: LayoutSignature[];
}

export interface LayoutConfig {
  header: LayoutHeader;
  body: LayoutBody;
  footer: LayoutFooter;
}

export interface ReportModel {
  id?: string;
  name: string;
  menuCode: string; // dbmenureport code
  description?: string;
  isActive: boolean;
  filters: ReportFilter[];
  datasets: ReportDataset[];
  layoutConfig: LayoutConfig;
}
