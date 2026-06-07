'use client';

import React, { memo } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import {cn} from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
    const widgetHeight = title ? height - 60 : height;

    // Convert relative URLs to absolute URLs so TradingView iframe redirects back to our site properly
    const resolvedConfig: Record<string, unknown> = { ...config };
    if (typeof window !== "undefined") {
        const origin = window.location.origin;
        if (typeof resolvedConfig.symbolUrl === "string" && resolvedConfig.symbolUrl.startsWith("/")) {
            resolvedConfig.symbolUrl = `${origin}${resolvedConfig.symbolUrl}`;
        }
        if (typeof resolvedConfig.largeChartUrl === "string" && resolvedConfig.largeChartUrl.startsWith("/")) {
            resolvedConfig.largeChartUrl = `${origin}${resolvedConfig.largeChartUrl}`;
        }
    }

    const containerRef = useTradingViewWidget(scriptUrl, resolvedConfig, widgetHeight);

    return (
        <div className="w-full h-full flex flex-col p-5">
            {title && <h3 className="font-bold text-2xl text-gray-100 mb-4 tracking-tight">{title}</h3>}
            <div className={cn('tradingview-widget-container flex-1', className)} ref={containerRef}>
                <div className="tradingview-widget-container__widget" style={{ height: widgetHeight, width: "100%" }} />
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
