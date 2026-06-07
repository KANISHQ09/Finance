import { Check, X, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import React from "react";

const PricingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto py-16 px-4 pt-24">
      
      {/* Header Section */}
      <div className="text-center mb-16 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-[#CCDADC]">
          Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D09C] to-[#0FEDBE]">pricing</span>
        </h1>
        <p className="text-lg text-[#9095A1] leading-relaxed">
          Start for free to manually track your portfolio, or upgrade to Pro for automated broker syncing and unlimited AI-powered intelligence.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        {/* FREE TIER */}
        <div className="relative bg-[#0A0A0A] border border-[#212328] rounded-2xl p-8 md:p-10 flex flex-col transition-all duration-300 hover:border-[#3A3D45] hover:shadow-xl hover:shadow-black/50">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
            <p className="text-[#9095A1] text-sm">Perfect for beginners and manual trackers.</p>
          </div>
          <div className="mb-8 flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">$0</span>
            <span className="text-[#9095A1] font-medium">/ forever</span>
          </div>
          
          <ul className="flex flex-col gap-4 mb-10 flex-grow">
            <li className="flex items-start gap-3">
              <Check className="text-[#00D09C] mt-0.5 shrink-0" size={18} />
              <span className="text-[#CCDADC] text-sm leading-relaxed">Manual Portfolio Tracking</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="text-[#00D09C] mt-0.5 shrink-0" size={18} />
              <span className="text-[#CCDADC] text-sm leading-relaxed">Basic Charting & Watchlists</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="text-[#00D09C] mt-0.5 shrink-0" size={18} />
              <span className="text-[#CCDADC] text-sm leading-relaxed">1 AI Portfolio Summary / month</span>
            </li>
            <li className="flex items-start gap-3 opacity-50">
              <X className="text-[#9095A1] mt-0.5 shrink-0" size={18} />
              <span className="text-[#9095A1] text-sm leading-relaxed">No Live Broker Sync</span>
            </li>
            <li className="flex items-start gap-3 opacity-50">
              <X className="text-[#9095A1] mt-0.5 shrink-0" size={18} />
              <span className="text-[#9095A1] text-sm leading-relaxed">No Real-time Alerts</span>
            </li>
          </ul>

          <Link 
            href="/sign-in"
            className="w-full py-3 px-6 rounded-lg font-bold text-center border border-[#212328] text-white hover:bg-[#141414] transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        {/* PRO TIER */}
        <div className="relative bg-[#141414] border border-[#00D09C] rounded-2xl p-8 md:p-10 flex flex-col shadow-[0_0_40px_rgba(0,208,156,0.15)] transform md:-translate-y-2 transition-all duration-300 hover:shadow-[0_0_60px_rgba(0,208,156,0.25)]">
          {/* Badge */}
          <div className="absolute -top-4 right-8 bg-gradient-to-r from-[#00D09C] to-[#0FEDBE] text-black text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-[#00D09C]/20">
            <Sparkles size={14} className="fill-black" /> Recommended
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              FinNext Pro <Zap className="text-[#00D09C] fill-[#00D09C]" size={20} />
            </h3>
            <p className="text-[#9095A1] text-sm">For serious investors who want the AI edge.</p>
          </div>
          <div className="mb-8 flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">$15</span>
            <span className="text-[#9095A1] font-medium">/ month</span>
          </div>
          
          <ul className="flex flex-col gap-4 mb-10 flex-grow">
            <li className="flex items-start gap-3">
              <Check className="text-[#00D09C] mt-0.5 shrink-0" size={18} />
              <span className="text-[#CCDADC] text-sm leading-relaxed">
                <strong className="text-white">Live Broker Sync</strong> (Groww, Upstox, etc.)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="text-[#00D09C] mt-0.5 shrink-0" size={18} />
              <span className="text-[#CCDADC] text-sm leading-relaxed">
                <strong className="text-white">Unlimited AI Intelligence</strong> for stock screening & analysis
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="text-[#00D09C] mt-0.5 shrink-0" size={18} />
              <span className="text-[#CCDADC] text-sm leading-relaxed">
                <strong className="text-white">Real-time Alerts</strong> via Email
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="text-[#00D09C] mt-0.5 shrink-0" size={18} />
              <span className="text-[#CCDADC] text-sm leading-relaxed">
                <strong className="text-white">Tax-Loss Harvesting</strong> insights
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="text-[#00D09C] mt-0.5 shrink-0" size={18} />
              <span className="text-[#CCDADC] text-sm leading-relaxed">
                Priority 24/7 Support
              </span>
            </li>
          </ul>

          <Link 
            href="/profile"
            className="w-full py-3 px-6 rounded-lg font-bold text-center bg-gradient-to-r from-[#00D09C] to-[#0FEDBE] text-black hover:opacity-90 transition-opacity shadow-lg shadow-[#00D09C]/20"
          >
            Upgrade to Pro
          </Link>
        </div>

      </div>

      {/* Enterprise / API Footer Note */}
      <div className="mt-16 text-center max-w-2xl border-t border-[#212328] pt-8">
        <h4 className="text-white text-lg font-semibold mb-2">Are you a wealth manager or RIA?</h4>
        <p className="text-[#9095A1] text-sm mb-4">
          Get FinNext white-labeled for your own clients with our B2B SaaS plans.
        </p>
        <button className="text-[#00D09C] text-sm font-semibold hover:underline flex items-center gap-1 mx-auto">
          Contact Sales <Zap size={14} className="fill-current" />
        </button>
      </div>

    </div>
  );
};

export default PricingPage;