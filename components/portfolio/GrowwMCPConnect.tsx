'use client';

import { useState, useEffect } from 'react';
import {
  Plug,
  Unplug,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  AlertTriangle,
  Key,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface GrowwMCPStatus {
  connected: boolean;
  lastSynced?: string;
  holdingsCount?: number;
  maskedKey?: string;
  mode?: 'access_token' | 'api_key';
}

interface GrowwHolding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentValue?: number;
  pnl?: number;
  assetType: 'stock' | 'mutual_fund';
  exchange?: string;
}

type AuthMode = 'access_token' | 'api_key';

export function GrowwMCPConnect() {
  const [status, setStatus] = useState<GrowwMCPStatus>({ connected: false });
  const [authMode, setAuthMode] = useState<AuthMode>('access_token');
  const [accessToken, setAccessToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    holdings?: GrowwHolding[];
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/portfolio/groww-mcp');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (authMode === 'access_token' && !accessToken.trim()) return;
    if (authMode === 'api_key' && (!apiKey.trim() || !apiSecret.trim())) return;

    setIsConnecting(true);
    setSyncResult(null);

    try {
      const payload =
        authMode === 'access_token'
          ? { action: 'connect', mode: 'access_token', accessToken: accessToken.trim() }
          : { action: 'connect', mode: 'api_key', apiKey: apiKey.trim(), apiSecret: apiSecret.trim() };

      const res = await fetch('/api/portfolio/groww-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');

      setStatus(data.status);
      setAccessToken('');
      setApiKey('');
      setApiSecret('');
      setSyncResult({ success: true, message: data.message, holdings: data.holdings });
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Failed to connect', error: err.message });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/portfolio/groww-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setStatus(data.status);
      setSyncResult({ success: true, message: data.message, holdings: data.holdings });
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/portfolio/groww-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Disconnect failed');
      setStatus({ connected: false });
      setSyncResult({ success: true, message: 'Successfully disconnected from Groww' });
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Disconnect failed' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const canConnect =
    authMode === 'access_token'
      ? accessToken.trim().length > 8
      : apiKey.trim().length > 4 && apiSecret.trim().length > 4;

  const formatDate = (iso?: string) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="groww-mcp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#212328', animation: 'pulse 1.5s ease infinite' }} />
          <div style={{ height: 14, width: 160, borderRadius: 6, background: '#212328', animation: 'pulse 1.5s ease infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="groww-mcp-card">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="groww-mcp-header">
        <div className="groww-mcp-logo-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="#00D09C" opacity="0.18"/>
            <path d="M17 12h-5v2h3a5 5 0 1 1-1.5-5.47l1.42-1.42A7 7 0 1 0 19 12h-2z" fill="#00D09C"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 className="groww-mcp-title">Groww Portfolio Sync</h3>
            <span className="groww-mcp-badge">LIVE API</span>
          </div>
          <p style={{ color: '#9095A1', fontSize: 12, marginTop: 2 }}>
            Fetch real holdings from your Groww Demat account
          </p>
        </div>
        <div className={`groww-status-pill ${status.connected ? 'groww-status-connected' : 'groww-status-disconnected'}`}>
          <span className="groww-status-dot" />
          {status.connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* ── Connected state ───────────────────────────────────────────── */}
      {status.connected ? (
        <div className="groww-connected-panel">
          <div className="groww-connected-row">
            <CheckCircle2 size={16} style={{ color: '#00D09C', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 600 }}>
                Groww account linked
                {status.mode === 'api_key' ? ' via API Key' : ' via Access Token'}
              </p>
              <p style={{ color: '#9095A1', fontSize: 11, marginTop: 2 }}>
                Credential: <code style={{ color: '#CCDADC', fontFamily: 'monospace', fontSize: 11 }}>{status.maskedKey}</code>
              </p>
            </div>
          </div>
          <div className="groww-stats-row">
            <div className="groww-stat-chip">
              <TrendingUp size={13} style={{ color: '#00D09C' }} />
              <span>{status.holdingsCount ?? 0} holdings imported</span>
            </div>
            <div className="groww-stat-chip">
              <Clock size={13} style={{ color: '#FDD458' }} />
              <span>Last synced {formatDate(status.lastSynced)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Auth form ───────────────────────────────────────────────── */
        <div className="groww-token-panel">
          {/* Mode toggle */}
          <div className="groww-mode-tabs">
            <button
              type="button"
              className={`groww-mode-tab ${authMode === 'access_token' ? 'groww-mode-tab-active' : ''}`}
              onClick={() => setAuthMode('access_token')}
            >
              <Key size={12} /> Access Token
            </button>
            <button
              type="button"
              className={`groww-mode-tab ${authMode === 'api_key' ? 'groww-mode-tab-active' : ''}`}
              onClick={() => setAuthMode('api_key')}
            >
              <Shield size={12} /> API Key + Secret
            </button>
          </div>

          {/* Security note */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 12 }}>
            <Shield size={13} style={{ color: '#FDD458', marginTop: 1, flexShrink: 0 }} />
            <p style={{ color: '#9095A1', fontSize: 11.5, lineHeight: 1.55 }}>
              {authMode === 'access_token'
                ? 'Paste your Groww Access Token. It is stored encrypted and only used to call GET /v1/holdings/user.'
                : 'Your API Key + Secret are used to obtain a session token. Stored encrypted, never shared.'}
            </p>
          </div>

          {/* Access-token mode */}
          {authMode === 'access_token' && (
            <div className="groww-input-wrap">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                placeholder="Paste your Groww Access Token…"
                className="groww-token-input"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" onClick={() => setShowToken((v) => !v)} className="groww-token-eye">
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          )}

          {/* API Key + Secret mode */}
          {authMode === 'api_key' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="groww-input-wrap">
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key  (from Groww → Settings → Trading APIs)"
                  className="groww-token-input"
                  autoComplete="off"
                  spellCheck={false}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div className="groww-input-wrap">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  placeholder="API Secret"
                  className="groww-token-input"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" onClick={() => setShowSecret((v) => !v)} className="groww-token-eye">
                  {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Instructions accordion */}
          <button
            type="button"
            onClick={() => setShowInstructions((v) => !v)}
            className="groww-instructions-btn"
            style={{ marginTop: 10 }}
          >
            <ExternalLink size={12} />
            How to get your Groww {authMode === 'access_token' ? 'Access Token' : 'API Key + Secret'}?
            {showInstructions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showInstructions && (
            <div className="groww-instructions-panel">
              {authMode === 'access_token' ? (
                <>
                  <p style={{ color: '#CCDADC', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📋 Getting your Access Token:</p>
                  <ol style={{ color: '#9095A1', fontSize: 11.5, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <li>Log in at <strong style={{ color: '#CCDADC' }}>groww.in</strong></li>
                    <li>Go to <strong style={{ color: '#CCDADC' }}>Profile → Settings → Trading APIs</strong></li>
                    <li>Click <strong style={{ color: '#CCDADC' }}>Generate Access Token</strong></li>
                    <li>Copy the long token string and paste it above</li>
                    <li>Token expires daily at 6:00 AM — re-enter if sync fails</li>
                  </ol>
                </>
              ) : (
                <>
                  <p style={{ color: '#CCDADC', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📋 Getting your API Key + Secret:</p>
                  <ol style={{ color: '#9095A1', fontSize: 11.5, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <li>Log in at <strong style={{ color: '#CCDADC' }}>groww.in</strong></li>
                    <li>Go to <strong style={{ color: '#CCDADC' }}>Profile → Settings → Trading APIs</strong></li>
                    <li>Click <strong style={{ color: '#CCDADC' }}>Generate API key</strong></li>
                    <li>Copy both <code style={{ color: '#00D09C' }}>api_key</code> and <code style={{ color: '#00D09C' }}>secret</code></li>
                    <li>Paste them above — we call <code style={{ color: '#00D09C', fontSize: 10.5 }}>GrowwAPI.get_access_token()</code> on the server</li>
                  </ol>
                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#0A0A0A', borderRadius: 6, border: '1px solid #212328' }}>
                    <code style={{ color: '#9095A1', fontSize: 10.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', display: 'block' }}>
{`# This is how we use your credentials on the server:
access_token = GrowwAPI.get_access_token(
    api_key=your_api_key,
    secret=your_secret
)
holdings = groww.get_holdings()`}
                    </code>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Result banner ─────────────────────────────────────────────── */}
      {syncResult && (
        <div className={`groww-result-banner ${syncResult.success ? 'groww-result-success' : 'groww-result-error'}`}>
          {syncResult.success
            ? <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            : <AlertTriangle size={14} style={{ flexShrink: 0 }} />}
          <span>{syncResult.message}</span>
        </div>
      )}

      {/* ── Holdings preview ──────────────────────────────────────────── */}
      {syncResult?.holdings && syncResult.holdings.length > 0 && (
        <div className="groww-holdings-preview">
          <p style={{ color: '#9095A1', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
            ✅ {syncResult.holdings.length} holdings synced from Groww:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {syncResult.holdings.slice(0, 10).map((h) => (
              <span key={h.symbol} className="groww-holding-chip" title={`Qty: ${h.quantity} | Avg: ₹${h.avgBuyPrice}`}>
                {h.symbol}
              </span>
            ))}
            {syncResult.holdings.length > 10 && (
              <span className="groww-holding-chip" style={{ color: '#9095A1', borderColor: '#30333A', background: 'transparent' }}>
                +{syncResult.holdings.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="groww-actions">
        {!status.connected ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting || !canConnect}
            className="groww-connect-btn"
          >
            {isConnecting ? (
              <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</>
            ) : (
              <><Plug size={15} /> Connect &amp; Fetch Holdings</>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="groww-sync-btn"
            >
              <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              {isSyncing ? 'Syncing…' : 'Sync Holdings Now'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="groww-disconnect-btn"
            >
              <Unplug size={14} />
              {isDisconnecting ? 'Removing…' : 'Disconnect'}
            </button>
          </>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="groww-footer-note">
        <Zap size={11} style={{ color: '#FDD458', flexShrink: 0, marginTop: 1 }} />
        <span>
          Calls <code style={{ fontFamily: 'monospace', color: '#CCDADC', fontSize: 10 }}>GET https://api.groww.in/v1/holdings/user</code> — read-only, no trading. 
          Requires an active Groww Trading API subscription.
        </span>
      </div>
    </div>
  );
}
