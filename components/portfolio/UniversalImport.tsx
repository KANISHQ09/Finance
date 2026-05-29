'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';

type AssetType = 'stock' | 'crypto' | 'gold' | 'real_estate' | 'mutual_fund' | 'other';

interface Asset {
  symbol: string;
  assetType: AssetType;
  quantity: number;
  avgBuyPrice: number;
  currency: string;
  broker: string;
}

interface UniversalImportProps {
  onAssetsChange?: (assets: Asset[]) => void;
}

const ASSET_TYPES: AssetType[] = ['stock', 'crypto', 'gold', 'real_estate', 'mutual_fund', 'other'];
const BROKERS = ['Groww', 'Zerodha', 'AngelOne', 'manual'];

export function UniversalImport({ onAssetsChange }: UniversalImportProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [broker, setBroker] = useState('groww');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch('/api/portfolio/external');
        if (res.ok) {
          const data = await res.json();
          if (data.assets) {
            setAssets(data.assets);
            onAssetsChange?.(data.assets);
          }
        }
      } catch (err) {
        console.error('Failed to fetch portfolio', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortfolio();
  }, [onAssetsChange]);

  const updateAssets = (newAssets: Asset[]) => {
    setAssets(newAssets);
    onAssetsChange?.(newAssets);
    setSaved(false);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('broker', broker);
      const res = await fetch('/api/portfolio/import-csv', { method: 'POST', body: formData });
      
      if (!res.ok) throw new Error('Failed to parse CSV');
      
      const { assets: imported, error } = await res.json();
      if (error) throw new Error(error);
      
      if (imported && Array.isArray(imported)) {
        if (imported.length === 0) {
          alert(`No valid assets found! Make sure the CSV format perfectly matches the ${broker} format.`);
        } else {
          updateAssets([...assets, ...imported]);
        }
      } else {
        alert('No valid assets found in this CSV.');
      }
    } catch (err) {
      console.error('CSV upload failed', err);
      alert('Failed to process CSV file. Please make sure the format matches the selected broker.');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addManual = () => {
    updateAssets([
      ...assets,
      { symbol: '', assetType: 'stock', quantity: 0, avgBuyPrice: 0, currency: 'INR', broker: 'manual' },
    ]);
  };

  const updateAsset = (i: number, field: keyof Asset, value: string | number) => {
    const updated = [...assets];
    (updated[i] as any)[field] = value;
    updateAssets(updated);
  };

  const removeAsset = (i: number) => updateAssets(assets.filter((_, idx) => idx !== i));

  const saveToServer = async () => {
    setIsSaving(true);
    // Filter out rows that have no symbol or 0 quantity
    const validAssets = assets.filter(a => a.symbol && a.quantity > 0);
    
    try {
      const res = await fetch('/api/portfolio/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: validAssets }),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      // Update local state to reflect only the valid saved ones
      setAssets(validAssets);
      onAssetsChange?.(validAssets);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving portfolio:', err);
      alert('Failed to save portfolio. Please check your data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="import-card">
      <div className="import-card-header">
        <Upload size={20} style={{ color: '#FDD458' }} />
        <h3 className="import-card-title">Universal Portfolio Import</h3>
      </div>

      {/* Upload row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
          className="auth-input auth-select"
          style={{ width: 140, height: 38, padding: '0 10px', fontSize: 13 }}
        >
          {BROKERS.map((b) => (
            <option key={b} value={b.toLowerCase()}>{b}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          style={{
            height: 38, padding: '0 16px', borderRadius: 8,
            background: 'rgba(253,212,88,0.1)', border: '1px solid rgba(253,212,88,0.25)',
            color: '#FDD458', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Upload size={14} />
          {isUploading ? 'Importing…' : 'Upload CSV'}
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" style={{ display: 'none' }} onChange={handleCSVUpload} />
      </div>

      {/* Asset table */}
      {assets.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #212328' }}>
                {['Symbol', 'Type', 'Qty', 'Avg Price', 'Broker', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: '#9095A1', fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #212328' }}>
                  <td style={{ padding: '6px 6px' }}>
                    <input
                      value={a.symbol}
                      onChange={(e) => updateAsset(i, 'symbol', e.target.value.toUpperCase())}
                      style={{ background: 'transparent', border: 'none', color: '#f5f5f5', width: 70, outline: 'none', fontWeight: 700, fontSize: 13 }}
                    />
                  </td>
                  <td>
                    <select
                      value={a.assetType}
                      onChange={(e) => updateAsset(i, 'assetType', e.target.value)}
                      style={{ background: '#0A0A0A', border: 'none', color: '#9095A1', fontSize: 11, borderRadius: 4, padding: '2px 4px' }}
                    >
                      {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={a.quantity}
                      onChange={(e) => updateAsset(i, 'quantity', parseFloat(e.target.value))}
                      style={{ background: 'transparent', border: 'none', color: '#f5f5f5', width: 60, outline: 'none', fontSize: 13 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={a.avgBuyPrice}
                      onChange={(e) => updateAsset(i, 'avgBuyPrice', parseFloat(e.target.value))}
                      style={{ background: 'transparent', border: 'none', color: '#f5f5f5', width: 80, outline: 'none', fontSize: 13 }}
                    />
                  </td>
                  <td style={{ color: '#9095A1', fontSize: 11 }}>{a.broker}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeAsset(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF495B', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={addManual}
          style={{
            height: 36, padding: '0 14px', borderRadius: 8,
            background: 'transparent', border: '1px solid #30333A',
            color: '#9095A1', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <Plus size={14} /> Add Asset Manually
        </button>
        {assets.length > 0 && (
          <button
            type="button"
            onClick={saveToServer}
            disabled={isSaving}
            style={{
              height: 36, padding: '0 16px', borderRadius: 8,
              background: saved ? 'rgba(15,237,190,0.1)' : 'rgba(253,212,88,0.1)',
              border: saved ? '1px solid rgba(15,237,190,0.3)' : '1px solid rgba(253,212,88,0.3)',
              color: saved ? '#0FEDBE' : '#FDD458', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> {isSaving ? 'Saving…' : 'Save Portfolio'}</>}
          </button>
        )}
      </div>
    </div>
  );
}
