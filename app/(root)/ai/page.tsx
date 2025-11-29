'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const initialAgents: AgentConfig[] = [
    {
        id: "portfolio",
        name: "Portfolio Analysis Agent",
        description:
            "Analyzes user's holdings, sector weights, diversification, gain/loss, and preferences.",
        icon: "📁",
        apiUrl: "/api/agents/portfolio",
        systemPrompt:
            "You are Portfolio Analysis Agent. Analyze user portfolio, sector weights, diversification, and strengths/weaknesses ONLY using provided data. If data is missing, ask for it. Do NOT hallucinate.",
        metadata: {
            agent_role: "Financial portfolio analyzer",
            agent_goal:
                "Identify portfolio strengths, weaknesses, and diversification opportunities.",
        },
    },
    {
        id: "risk",
        name: "Risk Agent",
        description:
            "Calculates personalized risk profile based on volatility, beta, and user tolerance.",
        icon: "⚖️",
        apiUrl: "/api/agents/risk",
        systemPrompt:
            "You are Risk Agent. Provide risk score (1–10), category, and explanation based ONLY on user inputs and volatility/beta data. Do NOT hallucinate.",
        metadata: {
            agent_role: "Risk assessment",
            agent_goal:
                "Recommend optimal risk level and asset allocation guidelines.",
        },
    },
    {
        id: "sentiment",
        name: "Sentiment Agent",
        description:
            "Analyzes market sentiment from news, social media, and indices.",
        icon: "📝",
        apiUrl: "/api/agents/sentiment",
        systemPrompt:
            "You are Sentiment Agent. Analyze market/news sentiment and return sentiment score (-1 to +1) with explanation. Only use provided data.",
        metadata: {
            agent_role: "Market sentiment analysis",
            agent_goal: "Provide sentiment scores for sectors and stocks.",
        },
    },
    {
        id: "forecast",
        name: "Forecast Agent",
        description: "Generates short-term numeric forecasts.",
        icon: "🔮",
        apiUrl: "/api/agents/forecast",
        systemPrompt:
            "You are Forecast Agent. ONLY generate numeric forecasts if data is available. Otherwise say 'insufficient data'.",
        metadata: {
            agent_role: "Forecast engine",
            agent_goal: "Predict short-term stock movements responsibly.",
        },
    },
    {
        id: "screener",
        name: "Screener Agent",
        description: "Filters and screens stocks based on user preferences.",
        icon: "🔎",
        apiUrl: "/api/agents/screener",
        systemPrompt:
            "You are Screener Agent. Filter and screen stocks ONLY using provided dataset & filters. Never invent data.",
        metadata: {
            agent_role: "Stock screener",
            agent_goal: "Return accurate filtered stock lists.",
        },
    },
    {
        id: "recommendation",
        name: "Recommendation Agent",
        description:
            "Generates final stock/portfolio recommendations using multi-agent results.",
        icon: "🤖",
        apiUrl: "/api/agents/recommendation",
        systemPrompt:
            "You are Recommendation Agent. Make recommendations ONLY using outputs from Portfolio, Risk, Sentiment, Forecast, and Screener Agents.",
        metadata: {
            agent_role: "Recommendation engine",
            agent_goal:
                "Provide well-rounded stock recommendations using multi-agent inputs.",
        },
    },
];

type Message = {
    id: number;
    content: string;
    sender: 'user' | 'agent';
    agentId: string;
    sources?: Array<{ title: string; link: string }>;
};

const AIChatPage = () => {
    const [activeAgentId, setActiveAgentId] = useState<string>(initialAgents[0].id);

    const [agentHistory, setAgentHistory] = useState<Record<string, Message[]>>(() =>
        initialAgents.reduce((acc, agent) => ({ ...acc, [agent.id]: [] }), {})
    );

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const activeAgent = useMemo(
        () => initialAgents.find(a => a.id === activeAgentId) || initialAgents[0],
        [activeAgentId]
    );

    const history = agentHistory[activeAgentId] || [];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleAgentSwitch = useCallback(
        (agentId: string) => {
            if (isLoading) return;
            setActiveAgentId(agentId);
        },
        [isLoading]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            content: trimmedInput,
            sender: 'user',
            agentId: activeAgent.id,
        };

        setAgentHistory(prev => ({
            ...prev,
            [activeAgent.id]: [...prev[activeAgent.id], userMessage],
        }));

        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(activeAgent.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: trimmedInput,
                    history: history.map(m => ({ role: m.sender, content: m.content })),
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                const errorMessage: Message = {
                    id: Date.now() + 1,
                    content: `Error (${response.status}): ${error.error || response.statusText}`,
                    sender: 'agent',
                    agentId: activeAgent.id,
                };

                setAgentHistory(prev => ({
                    ...prev,
                    [activeAgent.id]: [...prev[activeAgent.id], errorMessage],
                }));
                return;
            }

            const data: AgentApiReply = await response.json();

            const agentMessage: Message = {
                id: Date.now() + 1,
                content: data.reply,
                sender: 'agent',
                agentId: activeAgent.id,
                sources: data.sources,
            };

            setAgentHistory(prev => ({
                ...prev,
                [activeAgent.id]: [...prev[activeAgent.id], agentMessage],
            }));
        } catch (err) {
            const errorMessage: Message = {
                id: Date.now() + 1,
                content: 'Unexpected error talking to agent.',
                sender: 'agent',
                agentId: activeAgent.id,
            };

            setAgentHistory(prev => ({
                ...prev,
                [activeAgent.id]: [...prev[activeAgent.id], errorMessage],
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const ChatMessage = ({ message }: { message: Message }) => {
        const isUser = message.sender === 'user';
        const agent = initialAgents.find(a => a.id === message.agentId);

        return (
            <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
                <div
                    className={cn(
                        "max-w-xl p-3 rounded-xl flex flex-col gap-2",
                        isUser
                            ? "bg-yellow-500 text-gray-900 rounded-br-sm"
                            : "bg-gray-700 text-gray-100 rounded-tl-sm"
                    )}
                >
                    <div className="text-sm font-semibold">
                        {isUser ? "You" : agent?.name || "Agent"}
                    </div>

                    <p className="text-base whitespace-pre-wrap">{message.content}</p>

                    {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                            <span className="text-xs font-semibold text-gray-400 block mb-1">
                                Sources:
                            </span>
                            <ul className="space-y-1">
                                {message.sources.map((source, index) => (
                                    <li key={index} className="text-xs">
                                        <a
                                            href={source.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:underline"
                                        >
                                            {source.title.substring(0, 70) +
                                                (source.title.length > 70 ? "..." : "")}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex pt-4 pb-10 gap-8 min-h-[calc(100vh-100px)]">
            {/* LEFT COLUMN */}
            <section className="hidden lg:flex flex-col gap-4 w-auto p-4 bg-gray-800 border border-gray-600 rounded-lg shrink-0">
                <h2 className="text-xl font-bold text-gray-100 mb-2">Agents</h2>

                <div className="flex flex-col gap-2">
                    {initialAgents.map(agent => (
                        <Button
                            key={agent.id}
                            variant={activeAgentId === agent.id ? "default" : "ghost"}
                            size="lg"
                            className={cn(
                                "justify-start font-semibold transition-colors",
                                activeAgentId === agent.id
                                    ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
                                    : "text-gray-400 hover:bg-gray-700 hover:text-gray-100"
                            )}
                            onClick={() => handleAgentSwitch(agent.id)}
                            disabled={isLoading}
                        >
                            <span className="text-xl mr-3">{agent.icon}</span>
                            {agent.name}
                        </Button>
                    ))}
                </div>
            </section>

            {/* RIGHT COLUMN */}
            <section className="flex flex-col flex-1 bg-gray-800 border border-gray-600 rounded-lg p-6">
                <div className="border-b border-gray-600 pb-4 mb-4">
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
                        <span className="text-4xl">{activeAgent.icon}</span>
                        {activeAgent.name}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">{activeAgent.description}</p>
                </div>

                <div
                    className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide-default"
                    style={{ minHeight: "400px" }}
                >
                    {history.length === 0 ? (
                        <div className="text-center text-xl py-10 text-gray-500 italic">
                            Ask the <b>{activeAgent.name}</b> a question to start the conversation.
                            <p className="text-xl mt-2 text-gray-400">
                                or
                            </p>
                            <p className="text-xl mt-2 text-gray-500 italic">
                                Just say "hi" to start 👋
                            </p>
                        </div>
                    ) : (
                        history.map(msg => <ChatMessage key={msg.id} message={msg} />)
                    )}

                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={`Ask the ${activeAgent.name}...`}
                        className="flex-1 form-input h-12"
                        disabled={isLoading}
                    />

                    <Button
                        type="submit"
                        className="yellow-btn h-12 px-6"
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? <Loader2 className="animate-spin size-5" /> : "Send"}
                    </Button>
                </form>

                <p className="text-xs text-gray-500 mt-2 text-center">
                    Disclaimer: AI responses are for informational purposes only and are not
                    financial advice.
                </p>
            </section>
        </div>
    );
};

export default AIChatPage;
