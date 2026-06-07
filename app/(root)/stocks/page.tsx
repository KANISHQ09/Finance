import { redirect } from 'next/navigation';

interface StocksPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function StocksPage({ searchParams }: StocksPageProps) {
  const params = await searchParams;
  
  // TradingView might send tvwidgetsymbol, symbol, or just append ?EXCHANGE:SYMBOL
  const rawSymbol = 
    params.tvwidgetsymbol || 
    params.symbol || 
    Object.keys(params).find(key => key.includes(':'));

  if (rawSymbol && typeof rawSymbol === 'string') {
    // Extract just the ticker (e.g., "AAPL" from "NASDAQ:AAPL")
    const symbol = rawSymbol.includes(':')
      ? rawSymbol.split(':')[1]
      : rawSymbol;

    redirect(`/stocks/${symbol.toUpperCase()}`);
  }

  // Fallback if no symbol is provided
  redirect('/search');
}
