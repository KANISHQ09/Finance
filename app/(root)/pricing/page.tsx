import { Check, Zap, DollarSign, Users, Cpu, Server, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Feature {
    text: string;
    description: string;
    basic: boolean;
    pro: boolean;
    premium: boolean;
    icon: React.ElementType;
}

const features: Feature[] = [
    { 
        text: 'Stock Watchlist & Real-Time Charts', 
        description: 'Track your favorite stocks and view market data.',
        basic: true, pro: true, premium: true, icon: Check 
    },
    { 
        text: 'Daily Market Digest Email', 
        description: 'Automated market summary sent daily (via Inngest).',
        basic: true, pro: true, premium: true, icon: Check 
    },
    { 
        text: 'AI Agent Access', 
        description: 'Access to the core 6 specialized agents (Portfolio, Risk, Sentiment, etc.).',
        basic: false, pro: true, premium: true, icon: Cpu 
    },
    { 
        text: 'Unlimited AI Chat Queries', 
        description: 'No limits on the number of questions you can ask the agents.',
        basic: false, pro: true, premium: true, icon: Zap
    },
    { 
        text: 'Real-Time Quote Streaming', 
        description: 'Zero-latency quotes essential for active trading decisions.',
        basic: false, pro: true, premium: true, icon: Server
    },
    { 
        text: 'Custom SMS/Email Alerts (via Inngest)', 
        description: 'Receive instant notifications when your price targets are hit.',
        basic: false, pro: true, premium: true, icon: Zap
    },
    { 
        text: 'Custom AI Screener Data Export', 
        description: 'Export AI-filtered stock lists for use in external tools (CSV/JSON).',
        basic: false, pro: false, premium: true, icon: DollarSign
    },
    { 
        text: 'Priority Agent Processing', 
        description: 'Faster response times for critical market decisions.',
        basic: false, pro: false, premium: true, icon: Zap 
    },
];

const tiers = [
    {
        name: 'Basic',
        price: 'Free',
        priceDetail: 'forever',
        description: 'The foundation for observation. Ideal for new users and casual investors.',
        color: 'text-gray-400',
        planKey: 'basic',
    },
    {
        name: 'Pro',
        price: '$29',
        priceDetail: 'per month',
        description: 'Our most popular tier. Unlock the full value of the AI Analyst Suite.',
        color: 'text-yellow-500',
        planKey: 'pro',
    },
    {
        name: 'Premium',
        price: '$79',
        priceDetail: 'per month',
        description: 'Maximize your edge with high-speed execution and comprehensive data control.',
        color: 'text-green-400',
        planKey: 'premium',
    },
];

const PricingPage = () => {
    // Helper function to render icons based on plan inclusion
    const FeatureIcon = ({ included, highlighted }: { included: boolean, highlighted: boolean }) => {
        if (included) {
            return <Check className={cn("h-5 w-5", highlighted ? "text-yellow-500" : "text-green-400")} />;
        }
        return <X className="h-5 w-5 text-gray-500" />;
    };

    return (
        <div className="min-h-screen pt-12 pb-20 bg-gray-900 text-white">
            <header className="text-center mb-16">
                <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl">
                    Specialized AI Analysis. Simplified Pricing.
                </h1>
                <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
                    Choose the plan that matches your trading frequency and the level of artificial intelligence you need to gain an edge.
                </p>
            </header>

            <div className="max-w-6xl mx-auto">
                {/* Pricing Tiers Header (Responsive Columns) */}
                <div className="grid grid-cols-4 gap-4 px-6 md:px-0 mb-4 items-end">
                    <div className="col-span-4 md:col-span-1 text-2xl font-semibold text-gray-200 hidden md:block">
                        Features
                    </div>
                    {tiers.map((tier) => (
                        <div 
                            key={tier.name} 
                            className={cn(
                                "col-span-1 p-4 rounded-xl text-center border-2",
                                tier.name === 'Pro' 
                                    ? 'bg-gray-700 border-yellow-500 shadow-lg shadow-yellow-500/20' 
                                    : 'bg-gray-800 border-gray-700'
                            )}
                        >
                            <h2 className={cn("text-2xl font-bold", tier.color)}>{tier.name}</h2>
                            <p className="mt-2 flex justify-center items-baseline">
                                <span className="text-4xl font-extrabold text-gray-100">
                                    {tier.price}
                                </span>
                                {tier.priceDetail && (
                                    <span className="ml-1 text-lg font-medium text-gray-500">
                                        /{tier.priceDetail}
                                    </span>
                                )}
                            </p>
                            <Button 
                                asChild
                                className={cn(
                                    'w-full mt-4 h-10 font-semibold',
                                    tier.name === 'Pro' ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 'bg-gray-600 hover:bg-gray-500 text-white'
                                )}
                            >
                                <Link href="/sign-up">
                                    {tier.name === 'Basic' ? 'Start Free' : 'Choose Plan'}
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Feature Comparison Grid */}
                <div className="space-y-3">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className={cn(
                                "grid grid-cols-4 gap-4 p-4 rounded-xl items-center",
                                index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850',
                                features.indexOf(feature) === 2 && 'mt-8 border-t border-yellow-500/50 pt-6' // Separator line for AI features
                            )}
                        >
                            {/* Feature Description Column */}
                            <div className="col-span-4 md:col-span-1 flex flex-col">
                                <span className="text-lg font-medium text-gray-100 flex items-center gap-2">
                                    {feature.icon && <feature.icon className="h-5 w-5 text-gray-400" />}
                                    {feature.text}
                                </span>
                                <span className="text-sm text-gray-500 ml-7 md:ml-0">{feature.description}</span>
                            </div>

                            {/* Plan Inclusion Columns */}
                            <div className="col-span-3 grid grid-cols-3 gap-4 md:gap-8 text-center ml-auto w-full md:w-auto">
                                <div className="text-center">
                                    <FeatureIcon included={feature.basic} highlighted={false} />
                                </div>
                                <div className="text-center">
                                    <FeatureIcon included={feature.pro} highlighted={true} />
                                </div>
                                <div className="text-center">
                                    <FeatureIcon included={feature.premium} highlighted={false} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="text-center mt-16 text-gray-500 text-sm">
                *The Pro tier includes access to all 6 specialized Lyzr AI agents. All plans are billed monthly.
            </footer>
        </div>
    );
};

export default PricingPage;