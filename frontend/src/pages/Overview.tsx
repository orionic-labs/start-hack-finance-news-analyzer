// src/pages/Overview.tsx
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, FileText, Users, Globe, AlertTriangle, Loader2, LucideIcon } from 'lucide-react';

type KpiResponse = {
    total_news_today: {
        count: number;
        yesterday: number;
        delta_pct_vs_yesterday: number;
    };
    active_markets: { count: number };
    client_alerts: { count: number };
    important_news: {
        count: number;
        yesterday: number;
        delta_pct_vs_yesterday: number;
    };
};

type MetricCard = {
    title: string;
    value: string;
    icon: LucideIcon;
    description: string;
    changeText?: string;
    trend?: 'up' | 'down';
};

const recentNews = [
    {
        id: 1,
        title: 'Federal Reserve Announces Interest Rate Decision',
        summary: 'The Fed maintains current rates amid economic uncertainty and inflation concerns.',
        markets: ['USD', 'Bonds', 'Equities'],
        clients: ['JP Morgan', 'Goldman Sachs'],
        importance: 'high',
        time: '2 min ago',
    },
    {
        id: 2,
        title: 'Oil Prices Surge Following OPEC Meeting',
        summary: 'Crude oil prices jump 3% after OPEC+ announces production cuts.',
        markets: ['Energy', 'Commodities'],
        clients: ['Shell', 'ExxonMobil'],
        importance: 'high',
        time: '15 min ago',
    },
    {
        id: 3,
        title: 'Tech Earnings Beat Expectations',
        summary: 'Major technology companies report stronger than expected quarterly results.',
        markets: ['NASDAQ', 'Technology'],
        clients: ['Microsoft', 'Apple'],
        importance: 'medium',
        time: '1 hour ago',
    },
];

const fmtInt = (n: number) => (Number.isFinite(n) ? n.toLocaleString() : '0');
const fmtDeltaPct = (n: number) => `${n > 0 ? '+' : ''}${Math.round(n)}%` as const;

export default function Overview() {
    const [kpis, setKpis] = useState<KpiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get('/kpis/overview');
                setKpis(res.data as KpiResponse);
            } catch (e) {
                console.error('Error fetching KPIs:', e);
                setError('Failed to fetch KPIs. Please try again later.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const metrics: MetricCard[] = useMemo(() => {
        if (!kpis) return [];
        const newsDelta = kpis.total_news_today.delta_pct_vs_yesterday;
        const impDelta = kpis.important_news.delta_pct_vs_yesterday;

        return [
            {
                title: 'Total News Today',
                value: fmtInt(kpis.total_news_today.count),
                changeText: fmtDeltaPct(newsDelta),
                trend: newsDelta >= 0 ? 'up' : 'down',
                icon: FileText,
                description: 'vs yesterday',
            },
            {
                title: 'Active Markets',
                value: fmtInt(kpis.active_markets.count),
                icon: Globe,
                description: 'markets tracked',
            },
            {
                title: 'Client Alerts',
                value: fmtInt(kpis.client_alerts.count),
                icon: Users,
                description: 'notifications sent',
            },
            {
                title: 'Important News',
                value: fmtInt(kpis.important_news.count),
                changeText: fmtDeltaPct(impDelta),
                trend: impDelta >= 0 ? 'up' : 'down',
                icon: AlertTriangle,
                description: 'vs yesterday',
            },
        ];
    }, [kpis]);

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading dashboard…
            </div>
        );
    }
    if (error) {
        return (
            <div className="p-10 text-center">
                <p className="text-red-600 font-medium">{error}</p>
                <button
                    className="mt-4 px-4 py-2 rounded-lg border border-primary/30 hover:border-primary/60"
                    onClick={() => window.location.reload()}
                >
                    Reload
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* header omitted for brevity */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric) => (
                    <Card key={metric.title} className="border-dashboard-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                            <metric.icon className="h-4 w-4 text-dashboard-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
                            <div className="flex items-center gap-2">
                                {metric.changeText && metric.trend ? (
                                    <div
                                        className={`flex items-center gap-1 text-sm ${
                                            metric.trend === 'up' ? 'text-dashboard-success' : 'text-dashboard-danger'
                                        }`}
                                    >
                                        {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {metric.changeText}
                                    </div>
                                ) : null}
                                <span className="text-sm text-muted-foreground">{metric.description}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent News (still static demo items; wire to your own endpoint when ready) */}
            <Card className="border-dashboard-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Important News</CardTitle>
                    <CardDescription>Latest market-moving news requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {recentNews.map((news) => (
                        <div key={news.id} className="border border-dashboard-primary/10 rounded-lg p-4 hover:bg-muted/10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-2 h-2 rounded-full ${
                                            news.importance === 'high' ? 'bg-dashboard-danger' : 'bg-dashboard-warning'
                                        }`}
                                    />
                                    <h3 className="font-medium text-foreground">{news.title}</h3>
                                </div>
                                <span className="text-sm text-muted-foreground">{news.time}</span>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">{news.summary}</p>

                            <div className="flex flex-wrap gap-3">
                                <div className="flex flex-wrap gap-1 items-center">
                                    <span className="text-xs text-muted-foreground">Markets:</span>
                                    {news.markets.map((market) => (
                                        <Badge key={market} variant="secondary" className="text-xs">
                                            {market}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-1 items-center">
                                    <span className="text-xs text-muted-foreground">Clients:</span>
                                    {news.clients.map((client) => (
                                        <Badge key={client} variant="outline" className="text-xs">
                                            {client}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
