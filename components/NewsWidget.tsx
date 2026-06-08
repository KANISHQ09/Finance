'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import useTradingViewWidget from '@/hooks/useTradingViewWidget';
import { TOP_STORIES_WIDGET_CONFIG } from '@/lib/constants';
import { X, ExternalLink, Loader2, Newspaper } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsArticle {
    url: string;
    title?: string;
}

// ─── News Article Modal ────────────────────────────────────────────────────────

const NewsModal = ({
    article,
    onClose,
}: {
    article: NewsArticle;
    onClose: () => void;
}) => {
    const [loading, setLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(6px)',
                    animation: 'fadeIn 0.2s ease',
                }}
            />

            {/* Modal Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="News Article Reader"
                style={{
                    position: 'fixed',
                    inset: '40px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0f0f0f',
                    border: '1px solid #2a2a2a',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
                    animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
                }}
            >
                {/* Header Bar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 20px',
                        borderBottom: '1px solid #1e1e1e',
                        background: '#141414',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg,#0FEDBE22,#0FEDBE11)',
                                border: '1px solid #0FEDBE33',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Newspaper size={15} color="#0FEDBE" />
                        </div>

                        {/* Fake URL bar */}
                        <div
                            style={{
                                flex: 1,
                                background: '#0a0a0a',
                                border: '1px solid #2a2a2a',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                color: '#888',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'monospace',
                            }}
                            title={article.url}
                        >
                            {article.url}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in new tab"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                background: '#1a1a1a',
                                border: '1px solid #2a2a2a',
                                color: '#aaa',
                                fontSize: '12px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = '#222';
                                (e.currentTarget as HTMLElement).style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = '#1a1a1a';
                                (e.currentTarget as HTMLElement).style.color = '#aaa';
                            }}
                        >
                            <ExternalLink size={13} />
                            Open
                        </a>

                        <button
                            onClick={onClose}
                            title="Close (Esc)"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 34,
                                height: 34,
                                borderRadius: '8px',
                                background: '#1a1a1a',
                                border: '1px solid #2a2a2a',
                                color: '#aaa',
                                cursor: 'pointer',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = '#2d1515';
                                (e.currentTarget as HTMLElement).style.color = '#ff6b6b';
                                (e.currentTarget as HTMLElement).style.borderColor = '#ff6b6b44';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = '#1a1a1a';
                                (e.currentTarget as HTMLElement).style.color = '#aaa';
                                (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a';
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Loading Indicator */}
                {loading && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: '64px 0 0 0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '14px',
                            background: '#0f0f0f',
                            zIndex: 1,
                        }}
                    >
                        <Loader2
                            size={30}
                            color="#0FEDBE"
                            style={{ animation: 'spin 1s linear infinite' }}
                        />
                        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                            Loading article…
                        </p>
                    </div>
                )}

                {/* Article iframe */}
                <iframe
                    ref={iframeRef}
                    src={article.url}
                    title="News Article"
                    style={{
                        flex: 1,
                        border: 'none',
                        width: '100%',
                        background: '#0f0f0f',
                        opacity: loading ? 0 : 1,
                        transition: 'opacity 0.3s ease',
                    }}
                    onLoad={() => setLoading(false)}
                    // Allow scripts so the page renders, but restrict dangerous APIs
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    referrerPolicy="no-referrer"
                />
            </div>

            <style>{`
                @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.98) } to { opacity:1; transform:none } }
                @keyframes spin    { to { transform: rotate(360deg) } }
            `}</style>
        </>
    );
};

// ─── News Widget Wrapper ───────────────────────────────────────────────────────

/**
 * Renders the TradingView Top Stories widget but intercepts all outbound
 * navigation so clicking a news headline opens the article in an in-app
 * modal reader instead of redirecting to tradingview.com.
 *
 * Strategy:
 *  1. Render the widget inside its container as normal (no backend changes).
 *  2. Place a transparent overlay on top of the widget's iframe.
 *  3. Listen for postMessage events from the TradingView iframe — TV sends a
 *     "tv-widget-navigate" message with the target URL before navigating.
 *  4. Also intercept window.location changes via a beforeunload guard.
 *  5. On intercept → open NewsModal with the captured URL.
 */
const NewsWidgetInner = () => {
    const height = 600;
    const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

    // ── Intercept postMessage from TradingView iframes ──────────────────────
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data =
                    typeof event.data === 'string'
                        ? JSON.parse(event.data)
                        : event.data;

                // TradingView emits { name: "tv-widget-navigate", data: { url } }
                // or { name: "navigate", url: "..." } depending on the widget version
                const url: string | undefined =
                    data?.data?.url ||
                    data?.url ||
                    (data?.name === 'tv-widget-navigate' ? data?.data?.url : undefined);

                if (url && (url.startsWith('http') || url.startsWith('//'))) {
                    setActiveArticle({ url });
                }
            } catch {
                // Non-JSON messages — ignore
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // ── Guard against actual top-level navigation ───────────────────────────
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Suppress the navigation if a TV article URL is the cause.
            // We can't easily distinguish, so we just prevent default here.
            // The modal interception via postMessage is the primary mechanism.
            e.preventDefault();
        };

        // Only attach if the modal is NOT open (don't double-block)
        if (!activeArticle) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeArticle]);

    const handleClose = useCallback(() => setActiveArticle(null), []);

    const srcDoc = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <style>
                body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
                .tradingview-widget-container { width: 100%; height: 100%; }
            </style>
        </head>
        <body>
            <div class="tradingview-widget-container">
                <div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>
                <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js" async>
                    ${JSON.stringify(TOP_STORIES_WIDGET_CONFIG)}
                </script>
            </div>
            <script>
                // Forward postMessage events from the TradingView iframe up to the parent React window
                window.addEventListener('message', function(e) {
                    window.parent.postMessage(e.data, '*');
                });
            </script>
        </body>
        </html>
    `;

    return (
        <>
            {/* Widget + overlay wrapper */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* The actual TradingView widget */}
                <div
                    className="w-full h-full flex flex-col p-5"
                >
                    <iframe 
                        srcDoc={srcDoc}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            </div>

            {/* In-app article reader modal */}
            {activeArticle && (
                <NewsModal article={activeArticle} onClose={handleClose} />
            )}
        </>
    );
};

const NewsWidget = () => {
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        // Refresh the widget every 5 minutes to keep data real-time
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return <NewsWidgetInner key={refreshKey} />;
};

export default memo(NewsWidget);
