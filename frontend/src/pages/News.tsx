// src/pages/News.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/axios';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Filter, Star, Send, Edit, Loader2, ImageOff } from 'lucide-react';
import { HalfCircleGauge } from '@/components/ui/half-circle-gauge';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const availableMarkets = [
    'FX (USD, CHF, EUR, JPY)',
    'Gold',
    'Global Government Bonds',
    'Global Corporate bonds',
    'USA Equities',
    'Emerging Markets',
    'EU(incl. UK and CH) Equities',
    'Japan Equities',
];

const availableClients = [
    'JP Morgan',
    'Goldman Sachs',
    'Bank of America',
    'Morgan Stanley',
    'Wells Fargo',
    'Deutsche Bank',
    'BNP Paribas',
    'Credit Suisse',
    'UBS',
    'Barclays',
    'Shell',
    'ExxonMobil',
    'Chevron',
    'BP',
    'Total',
    'Microsoft',
    'Apple',
    'Google',
    'Amazon',
    'Meta',
    'HSBC',
    'Standard Chartered',
    'Citigroup',
    'BlackRock',
    'Vanguard',
];

type News = {
    id: string;
    url: string;
    title: string;
    summary: string;
    photo?: string | null;
    markets: string[];
    clients: string[];
    importance?: 'low' | 'medium' | 'high';
    isImportant: boolean; // must be boolean after fetch
    publishedAt: string | null;
    source: string;
    communitySentiment: number;
    trustIndex: number;
};

type NewsItemProps = {
    news: News;
    toggling: boolean;
    onToggleImportant: (n: News) => Promise<void>;
    onUpdateNewsLocal: (id: string, updated: Partial<News>) => void;
};

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
};

function uid() {
    // Stable UID across modern browsers; falls back for older ones
    return (crypto as any)?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatTime(ts: string | null) {
    if (!ts) return '—';
    const date = new Date(ts);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return date.toLocaleDateString();
}

function NewsItem({ news, toggling, onToggleImportant, onUpdateNewsLocal }: NewsItemProps) {
    const [editMarketsOpen, setEditMarketsOpen] = useState(false);
    const [editClientsOpen, setEditClientsOpen] = useState(false);
    const [selectedMarkets, setSelectedMarkets] = useState<string[]>(news.markets ?? []);
    const [selectedClients, setSelectedClients] = useState<string[]>(news.clients ?? []);

    useEffect(() => setSelectedMarkets(news.markets ?? []), [news.markets]);
    useEffect(() => setSelectedClients(news.clients ?? []), [news.clients]);

    const handleSaveMarkets = () => {
        onUpdateNewsLocal(news.id, { markets: selectedMarkets });
        setEditMarketsOpen(false);
    };
    const handleSaveClients = () => {
        onUpdateNewsLocal(news.id, { clients: selectedClients });
        setEditClientsOpen(false);
    };

    return (
        <Card className="overflow-hidden shadow-lg group">
            <div className="relative">
                {news.photo ? (
                    <img src={news.photo} alt={news.title} className="w-full h-48 object-cover" />
                ) : (
                    <div className="w-full h-48 bg-muted/40 flex items-center justify-center">
                        <ImageOff className="w-6 h-6 text-muted-foreground" />
                    </div>
                )}

                <div className="absolute top-3 right-3 flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onToggleImportant(news)}
                                    disabled={toggling}
                                    className={`rounded-full ${news.isImportant ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-gray-600'}`}
                                >
                                    {toggling ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Star className={`h-4 w-4 ${news.isImportant ? 'fill-current' : ''}`} />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">{news.isImportant ? 'Remove from important' : 'Mark as important'}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <CardHeader>
                <CardTitle>{news.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
                <p className="text-sm text-gray-600">{news.summary}</p>

                {/* Markets */}
                <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex justify-between">
                        <h4 className="text-sm font-semibold">Markets Influenced</h4>
                        <Dialog open={editMarketsOpen} onOpenChange={setEditMarketsOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                    <Edit className="h-3 w-3" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Markets</DialogTitle>
                                </DialogHeader>
                                {availableMarkets.map((m) => (
                                    <div key={m} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={selectedMarkets.includes(m)}
                                            onCheckedChange={(checked) =>
                                                setSelectedMarkets((prev) => (checked ? [...prev, m] : prev.filter((x) => x !== m)))
                                            }
                                        />
                                        <span>{m}</span>
                                    </div>
                                ))}
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setEditMarketsOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveMarkets}>Save</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {(news.markets ?? []).map((m) => (
                            <Badge key={m}>{m}</Badge>
                        ))}
                    </div>
                </div>

                {/* Clients */}
                <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex justify-between">
                        <h4 className="text-sm font-semibold">Clients Influenced</h4>
                        <Dialog open={editClientsOpen} onOpenChange={setEditClientsOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                    <Edit className="h-3 w-3" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Clients</DialogTitle>
                                </DialogHeader>
                                {availableClients.map((c) => (
                                    <div key={c} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={selectedClients.includes(c)}
                                            onCheckedChange={(checked) =>
                                                setSelectedClients((prev) => (checked ? [...prev, c] : prev.filter((x) => x !== c)))
                                            }
                                        />
                                        <span>{c}</span>
                                    </div>
                                ))}
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setEditClientsOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveClients}>Save</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {(news.clients ?? []).map((c) => (
                            <Badge key={c}>{c}</Badge>
                        ))}
                    </div>
                </div>

                {/* KPIs */}
                <div className="bg-purple-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-2">Key Performance Indicators</h4>
                    <div className="flex justify-around">
                        <HalfCircleGauge value={news.communitySentiment} max={100} label="Community Sentiment" color="#8b5cf6" size={100} />
                        <HalfCircleGauge value={news.trustIndex} max={100} label="Trust Index" color="#06b6d4" size={100} />
                    </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
                    <span>{news.source}</span>
                    <span>{formatTime(news.publishedAt)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export default function News() {
    const [filterImportance, setFilterImportance] = useState<'all' | 'important' | 'not-important'>('all');
    const [newsData, setNewsData] = useState<News[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // --- Chat state ---
    const [chatMessage, setChatMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: uid(), role: 'system', content: 'Welcome! Ask me anything about the news items.' },
    ]);
    const [chatLoading, setChatLoading] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement | null>(null);

    // Fetch news (and normalize isImportant)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                setError(null);
                const { data } = await api.get<News[]>('/news/list');
                if (!mounted) return;

                const normalizeBool = (v: any): boolean => {
                    if (typeof v === 'boolean') return v;
                    if (typeof v === 'number') return v !== 0;
                    if (typeof v === 'string') return ['true', 't', '1', 'yes', 'y'].includes(v.toLowerCase());
                    return false;
                };

                const mapped = (Array.isArray(data) ? data : []).map((d: any) => {
                    const raw = d?.isImportant ?? d?.importance_flag ?? d?.importanceFlag ?? d?.important ?? null;
                    return {
                        ...d,
                        isImportant: normalizeBool(raw),
                        markets: Array.isArray(d?.markets) ? d.markets : [],
                        clients: Array.isArray(d?.clients) ? d.clients : [],
                    } as News;
                });

                setNewsData(mapped);
            } catch (e: any) {
                setError(e?.response?.data?.error || e?.message || 'Failed to fetch news');
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Toggle importance (optimistic)
    const handleToggleImportant = async (n: News) => {
        try {
            setTogglingId(n.id);
            setNewsData((prev) => prev.map((it) => (it.id === n.id ? { ...it, isImportant: !it.isImportant } : it)));
            await api.post('/news/importance', { url: n.url }); // server toggles
        } catch (e: any) {
            // rollback on fail
            setNewsData((prev) => prev.map((it) => (it.id === n.id ? { ...it, isImportant: n.isImportant } : it)));
            setError(e?.response?.data?.error || e?.message || 'Failed to toggle importance');
        } finally {
            setTogglingId(null);
        }
    };

    // Local-only updates (markets/clients tagging UI)
    const handleUpdateNewsLocal = (id: string, updates: Partial<News>) => {
        setNewsData((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    };

    // Apply importance-only filter
    const filteredNews = useMemo(() => {
        if (filterImportance === 'important') {
            return newsData.filter((n) => n.isImportant === true);
        }
        if (filterImportance === 'not-important') {
            return newsData.filter((n) => n.isImportant === false);
        }
        return newsData;
    }, [newsData, filterImportance]);

    // Auto-scroll chat to bottom on new messages
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages, chatLoading]);

    // Send message to backend LLM endpoint WITHOUT changing it:
    // the endpoint expects: { customers: <string> } and returns { answer: <string> }
    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = chatMessage.trim();
        if (!msg || chatLoading) return;

        const userMsg: ChatMessage = { id: uid(), role: 'user', content: msg };
        setChatMessages((prev) => [...prev, userMsg]);
        setChatMessage('');
        setChatLoading(true);

        try {
            const { data } = await api.post('/send_message_chat', { customers: msg });
            const answer: string = typeof data?.answer === 'string' ? data.answer : 'Sorry, I could not generate an answer.';
            const botMsg: ChatMessage = { id: uid(), role: 'assistant', content: answer };
            setChatMessages((prev) => [...prev, botMsg]);
        } catch (err: any) {
            const message = err?.response?.data?.error || err?.message || 'Failed to contact the assistant.';
            const botMsg: ChatMessage = { id: uid(), role: 'assistant', content: `Error: ${message}` };
            setChatMessages((prev) => [...prev, botMsg]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* News List */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">All News</h1>
                        <p className="text-muted-foreground">Monitor and analyze market news</p>
                    </div>

                    <div className="flex gap-3">
                        <Select value={filterImportance} onValueChange={(v: 'all' | 'important' | 'not-important') => setFilterImportance(v)}>
                            <SelectTrigger className="w-40">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All News</SelectItem>
                                <SelectItem value="important">Important</SelectItem>
                                <SelectItem value="not-important">Not Important</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* States */}
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading news…
                    </div>
                )}
                {error && <p className="text-red-600">Error: {error}</p>}

                <div className="grid md:grid-cols-2 gap-6">
                    {!isLoading &&
                        filteredNews.map((news) => (
                            <NewsItem
                                key={news.id}
                                news={news}
                                toggling={togglingId === news.id}
                                onToggleImportant={handleToggleImportant}
                                onUpdateNewsLocal={handleUpdateNewsLocal}
                            />
                        ))}
                </div>

                {!isLoading && !error && filteredNews.length === 0 && <p className="text-sm text-muted-foreground">No news match your filters.</p>}
            </div>

            {/* Chat */}
            <div className="lg:col-span-1">
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" /> AI News Assistant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div ref={chatScrollRef} className="h-96 bg-muted/30 rounded-lg p-4 overflow-y-auto space-y-3">
                            {chatMessages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                        m.role === 'user'
                                            ? 'ml-auto bg-primary text-primary-foreground'
                                            : m.role === 'assistant'
                                            ? 'mr-auto bg-white border'
                                            : 'mx-auto text-muted-foreground italic'
                                    }`}
                                >
                                    {m.content}
                                </div>
                            ))}

                            {chatLoading && (
                                <div className="mr-auto inline-flex items-center gap-2 text-muted-foreground text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleChatSubmit} className="flex gap-2">
                            <Textarea
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Ask about any news item..."
                                className="flex-1 resize-none"
                                rows={1}
                            />
                            <Button type="submit" disabled={!chatMessage.trim() || chatLoading}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
