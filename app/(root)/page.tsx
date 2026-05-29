import TradingViewWidget from "@/components/TradingViewWidget";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG
} from "@/lib/constants";

const widgetCard = {
    background: "#141414",
    border: "1px solid #212328",
    borderRadius: 16,
    overflow: "hidden" as const,
    height: "100%",
};

const Home = () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    return (
        <div className="flex flex-col min-h-screen p-4 md:p-8" style={{ gap: 24 }}>
            {/* Top Row: Market Overview & Heatmap */}
            <section className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 20 }}>
                <div className="lg:col-span-1" style={{ height: 620 }}>
                    <div style={widgetCard}>
                        <TradingViewWidget
                            title="Market Overview"
                            scriptUrl={`${scriptUrl}market-overview.js`}
                            config={MARKET_OVERVIEW_WIDGET_CONFIG}
                            className="custom-chart"
                            height={600}
                        />
                    </div>
                </div>
                <div className="lg:col-span-2" style={{ height: 620 }}>
                    <div style={widgetCard}>
                        <TradingViewWidget
                            title="Stock Heatmap"
                            scriptUrl={`${scriptUrl}stock-heatmap.js`}
                            config={HEATMAP_WIDGET_CONFIG}
                            height={600}
                        />
                    </div>
                </div>
            </section>

            {/* Bottom Row: News & Quotes */}
            <section className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 20 }}>
                <div className="lg:col-span-1" style={{ height: 620 }}>
                    <div style={widgetCard}>
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}timeline.js`}
                            config={TOP_STORIES_WIDGET_CONFIG}
                            height={600}
                        />
                    </div>
                </div>
                <div className="lg:col-span-2" style={{ height: 620 }}>
                    <div style={widgetCard}>
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}market-quotes.js`}
                            config={MARKET_DATA_WIDGET_CONFIG}
                            height={600}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;

