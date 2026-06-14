import React from 'react';
import { Plus, X } from 'lucide-react';
import type { LayoutHeader, HeaderColumn } from '@/domains/accounting/report';
import { Button } from '@/shared/ui';

interface Props {
  value: LayoutHeader;
  onChange: (value: LayoutHeader) => void;
}

export function LayoutHeaderBuilder({ value, onChange }: Props) {
  const addRow = () => {
    const newRows = [...value.rows, { columns: [{ content: '', colspan: 1, width: '100%', style: '', className: '' }] }];
    onChange({ ...value, rows: newRows });
  };

  const removeRow = (rowIndex: number) => {
    const newRows = value.rows.filter((_, i) => i !== rowIndex);
    onChange({ ...value, rows: newRows });
  };

  const addColumn = (rowIndex: number) => {
    const newRows = [...value.rows];
    newRows[rowIndex].columns.push({ content: '', colspan: 1, width: '', style: '', className: '' });
    onChange({ ...value, rows: newRows });
  };

  const removeColumn = (rowIndex: number, colIndex: number) => {
    const newRows = [...value.rows];
    newRows[rowIndex].columns = newRows[rowIndex].columns.filter((_, i) => i !== colIndex);
    if (newRows[rowIndex].columns.length === 0) {
      newRows.splice(rowIndex, 1);
    }
    onChange({ ...value, rows: newRows });
  };

  const updateColumn = (rowIndex: number, colIndex: number, colData: Partial<HeaderColumn>) => {
    const newRows = [...value.rows];
    newRows[rowIndex].columns[colIndex] = { ...newRows[rowIndex].columns[colIndex], ...colData };
    onChange({ ...value, rows: newRows });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Header Configuration</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Position:</label>
          <select 
            value={value.position} 
            onChange={(e) => onChange({ ...value, position: e.target.value as any })}
            className="border rounded p-1 text-sm bg-background"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <Button variant="outline" size="sm" onClick={addRow} type="button">
            <Plus className="h-4 w-4 mr-1" /> Row
          </Button>
        </div>
      </div>
      
      {(!value.rows || value.rows.length === 0) && (
        <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground text-sm">No header rows configured.</p>
        </div>
      )}

      {value.rows && value.rows.map((row, rIdx) => (
        <div key={rIdx} className="p-4 border rounded-lg bg-card shadow-sm relative group">
          <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1 z-10">
            <button onClick={() => removeRow(rIdx)} type="button" className="bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-90" title="Remove Row">
              <X className="h-3 w-3" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Row {rIdx + 1}</span>
            <button onClick={() => addColumn(rIdx)} type="button" className="text-xs text-primary hover:underline flex items-center">
              <Plus className="h-3 w-3 mr-1"/> Column
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {row.columns.map((col, cIdx) => (
              <div key={cIdx} className="flex-1 min-w-[200px] border bg-accent/20 p-3 rounded relative">
                <button onClick={() => removeColumn(rIdx, cIdx)} type="button" className="absolute top-2 right-2 text-destructive hover:opacity-80">
                  <X className="h-4 w-4" />
                </button>
                <input 
                  value={col.content} 
                  onChange={(e) => updateColumn(rIdx, cIdx, { content: e.target.value })}
                  type="text" 
                  className="w-full border rounded p-1.5 text-sm mb-2 pr-7 bg-background" 
                  placeholder="Header content text..." 
                />
                <div className="flex gap-2">
                  <input 
                    value={col.colspan} 
                    onChange={(e) => updateColumn(rIdx, cIdx, { colspan: parseInt(e.target.value) || 1 })}
                    type="number" 
                    className="w-1/3 border rounded p-1.5 text-xs bg-background" 
                    placeholder="Colspan" title="Colspan" 
                  />
                  <input 
                    value={col.width} 
                    onChange={(e) => updateColumn(rIdx, cIdx, { width: e.target.value })}
                    type="text" 
                    className="w-1/3 border rounded p-1.5 text-xs bg-background" 
                    placeholder="Width" title="Width (e.g. 100%, 200px)" 
                  />
                  <input 
                    value={col.className || ''} 
                    onChange={(e) => updateColumn(rIdx, cIdx, { className: e.target.value })}
                    type="text" 
                    className="w-1/3 border rounded p-1.5 text-xs bg-background" 
                    placeholder="CSS Class" title="Tailwind CSS classes" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
