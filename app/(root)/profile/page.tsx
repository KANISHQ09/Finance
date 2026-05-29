'use client';

import { useState, useEffect } from 'react';
import { UniversalImport } from '@/components/portfolio/UniversalImport';
import { User, ShieldAlert, Target, Save, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        setProfile(data);
      } catch (e) {
        console.error('Failed to load profile', e);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskTolerance: profile?.riskTolerance,
          investmentGoals: profile?.investmentGoals,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save profile', e);
      alert('Failed to save profile preferences.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#FDD458' }} />
      </div>
    );
  }

  return (
    <main className="profile-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div className="profile-header-icon">
          <User className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#FDD458' }} />
        </div>
        <div>
          <h1 className="profile-header-title">
            Investor Profile
          </h1>
          <p style={{ color: '#9095A1', fontSize: 14 }}>
            Set your financial preferences to personalize the AI Assistant, and manage your portfolio data.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Settings */}
        <div className="profile-card">
          <h2 style={{ color: '#f5f5f5', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} style={{ color: '#FDD458' }} /> Preferences
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <ShieldAlert size={14} /> Risk Tolerance
              </label>
              <select 
                value={profile?.riskTolerance || 'MEDIUM'}
                onChange={(e) => setProfile({ ...profile, riskTolerance: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none' }}
              >
                <option value="LOW">Low (Conservative)</option>
                <option value="MEDIUM">Medium (Moderate)</option>
                <option value="HIGH">High (Aggressive)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <Target size={14} /> Investment Goal
              </label>
              <select 
                value={profile?.investmentGoals || 'GROWTH'}
                onChange={(e) => setProfile({ ...profile, investmentGoals: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none' }}
              >
                <option value="GROWTH">Growth (Capital Appreciation)</option>
                <option value="INCOME">Income (Dividends & Yield)</option>
                <option value="PRESERVATION">Preservation (Capital Protection)</option>
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  background: saved ? 'rgba(15,237,190,0.1)' : 'rgba(253,212,88,0.1)',
                  border: saved ? '1px solid rgba(15,237,190,0.3)' : '1px solid rgba(253,212,88,0.3)',
                  color: saved ? '#0FEDBE' : '#FDD458', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}</>}
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Import */}
        {/* Portfolio Import */}
        <UniversalImport />
      </div>
    </main>
  );
}
