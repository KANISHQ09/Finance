import TradingViewWidget from '@/components/TradingViewWidget';
import WatchlistButton from '@/components/WatchlistButton';
import { StockAlertButton } from '@/components/StockAlertButton';
import { SandboxTradeWidget } from '@/components/sandbox/SandboxTradeWidget';
import { WatchlistItem } from '@/database/models/watchlist.model';
import { getStocksDetails } from '@/lib/actions/finnhub.actions';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from '@/lib/constants';
import { notFound, redirect } from 'next/navigation';

const widgetCardStyle = (height: number) => ({
  background: '#141414',
  border: '1px solid #212328',
  borderRadius: 16,
  overflow: 'hidden' as const,
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  height: height,
});

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;

  // Handle TradingView symbols like "NASDAQ:AAPL" or url-encoded "NASDAQ%3AAAPL"
  const decodedSymbol = decodeURIComponent(symbol);
  if (decodedSymbol.includes(':')) {
    const cleanSymbol = decodedSymbol.split(':')[1];
    redirect(`/stocks/${cleanSymbol.toUpperCase()}`);
  }

  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  const stockData = await getStocksDetails(symbol.toUpperCase());
  const watchlist = await getUserWatchlist();

  const isInWatchlist = watchlist.some(
    (item: WatchlistItem) => item.symbol === symbol.toUpperCase()
  );

  if (!stockData) notFound();

  return (
    <div className='flex min-h-screen p-4 md:p-6 lg:p-8 flex-col' style={{ gap: 24 }}>

      {/* Top Banner Row - Full Width */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 bg-[#141414] border border-[#212328] p-6 rounded-2xl shadow-xl w-full">
        {/* Left: Ticker Symbol Info */}
        <div className="flex-1 min-w-0" style={{ height: 200 }}>
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
            height={200}
          />
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-3 bg-[#0C0C0E] border border-[#212328] p-4 rounded-xl shadow-inner flex-wrap justify-center lg:justify-end shrink-0">
          <WatchlistButton
            symbol={symbol}
            company={stockData.company}
            isInWatchlist={isInWatchlist}
            type='button'
          />
          <StockAlertButton
            symbol={symbol.toUpperCase()}
            currentPrice={stockData.currentPrice}
          />
          <SandboxTradeWidget
            symbol={symbol.toUpperCase()}
            companyName={stockData.company}
            currentPrice={stockData.currentPrice}
          />
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <section className='grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start'>

        {/* Left Side Column - Widescreen Chart & Financials (2/3 width) */}
        <div className='lg:col-span-2 flex flex-col gap-6 w-full'>
          {/* Advanced Live Candlestick Chart */}
          <div style={widgetCardStyle(680)}>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}advanced-chart.js`}
              config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
              className='custom-chart'
              height={680}
            />
          </div>

          {/* Company Financials Widget Card */}
          <div style={widgetCardStyle(620)}>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}financials.js`}
              config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
              height={620}
            />
          </div>
        </div>

        {/* Right Side Column - Analytics Sidebar (1/3 width) */}
        <div className='lg:col-span-1 flex flex-col gap-6 w-full'>
          {/* Technical Analysis Widget */}
          <div style={widgetCardStyle(500)}>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}technical-analysis.js`}
              config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
              height={500}
            />
          </div>

          {/* Company Profile Widget */}
          <div style={widgetCardStyle(580)}>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}symbol-profile.js`}
              config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
              height={580}
            />
          </div>
        </div>

      </section>
    </div>
  );
}