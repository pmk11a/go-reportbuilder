import React from 'react';
import { Plus, X } from 'lucide-react';
import type { LayoutFooter, LayoutSignature } from '@/types/report';
import { Button } from '@/components/ui';

interface Props {
  value: LayoutFooter;
  onChange: (value: LayoutFooter) => void;
}

export function LayoutFooterBuilder({ value, onChange }: Props) {
  const addSignature = () => {
    const newSig: LayoutSignature = {
      id: `sig-${Date.now()}`,
      name: '',
      title: '',
      order: value.signatures.length + 1
    };
    onChange({ ...value, signatures: [...value.signatures, newSig] });
  };

  const removeSignature = (id: string) => {
    const newSigs = value.signatures.filter(s => s.id !== id);
    // Re-order
    newSigs.forEach((s, idx) => s.order = idx + 1);
    onChange({ ...value, signatures: newSigs });
  };

  const updateSignature = (id: string, updates: Partial<LayoutSignature>) => {
    onChange({
      ...value,
      signatures: value.signatures.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Footer Configuration (Signatures)</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Columns per row:</label>
          <select 
            value={value.signatureColumns} 
            onChange={(e) => onChange({ ...value, signatureColumns: parseInt(e.target.value) || 3 })}
            className="border rounded p-1 text-sm bg-background"
          >
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
          </select>
          <Button variant="outline" size="sm" onClick={addSignature} type="button">
            <Plus className="h-4 w-4 mr-1" /> Add Signature
          </Button>
        </div>
      </div>
      
      {(!value.signatures || value.signatures.length === 0) && (
        <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/50">
          <p className="text-muted-foreground text-sm">No signatures configured.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {value.signatures.map((sig, idx) => (
          <div key={sig.id} className="p-4 border rounded-lg bg-card shadow-sm relative group">
            <button 
              onClick={() => removeSignature(sig.id)} 
              type="button" 
              className="absolute top-2 right-2 text-destructive hover:opacity-80"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="mb-2">
              <span className="text-xs font-medium text-muted-foreground bg-accent px-2 py-0.5 rounded">Signature #{sig.order}</span>
            </div>

            <div className="space-y-3 mt-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Signer Title/Role</label>
                <input 
                  value={sig.title} 
                  onChange={(e) => updateSignature(sig.id, { title: e.target.value })}
                  type="text" 
                  className="w-full border rounded p-1.5 text-sm bg-background" 
                  placeholder="e.g. Director" 
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Signer Name</label>
                <input 
                  value={sig.name} 
                  onChange={(e) => updateSignature(sig.id, { name: e.target.value })}
                  type="text" 
                  className="w-full border rounded p-1.5 text-sm bg-background" 
                  placeholder="e.g. John Doe" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
