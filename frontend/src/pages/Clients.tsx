// src/pages/Clients.tsx
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Mail, Plus, Edit3, Loader2 } from 'lucide-react';

type Client = {
    id: string;
    name: string;
    status: string;
    contact: { name: string; email: string };
    portfolio: Record<string, number>;
    logo?: string | null;
};

const portfolioLabels: Record<string, string> = {
    fx_usd: 'FX USD',
    fx_chf: 'FX CHF',
    fx_eur: 'FX EUR',
    fx_jpy: 'FX JPY',
    gold: 'Gold',
    global_gov_bonds: 'Global Government Bonds',
    global_corp_bonds: 'Global Corporate Bonds',
    usa_equities: 'USA Equities',
    emerging_markets: 'Emerging Markets',
    eu_equities: 'EU (incl. UK and CH) Equities',
    japan_equities: 'Japan Equities',
};

const KEYS = Object.keys(portfolioLabels);
const EPS = 0.1; // small tolerance for 100%

const round1 = (n: number) => Math.round(n * 10) / 10;
const sum = (obj: Record<string, number> | undefined) => round1(Object.values(obj ?? {}).reduce((s, v) => s + (+v || 0), 0));

// robust numeric parsing (supports comma decimals)
const toNumber = (v: string | number): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [clientName, setClientName] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [editingClient, setEditingClient] = useState<string | null>(null);
    const [editPortfolio, setEditPortfolio] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch clients (with allocations)
    useEffect(() => {
        const fetchClients = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get('/clients/list');

                const mapped: Client[] = (res.data || []).map((c: any) => ({
                    id: String(c.id ?? c.client_id),
                    name: c.name,
                    status: c.status ?? 'active',
                    contact: c.contact
                        ? { name: c.contact.name ?? '', email: c.contact.email ?? '' }
                        : { name: c.contact_name ?? '', email: c.contact_email ?? '' },
                    portfolio: c.portfolio ?? {},
                    logo: c.logo_url ?? null,
                }));

                setClients(mapped);
            } catch (e) {
                console.error('Error fetching clients:', e);
                setError('Failed to fetch clients. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    // Whenever a client is selected for editing, hydrate the dialog state from source
    useEffect(() => {
        if (!editingClient) return;
        const c = clients.find((x) => x.id === editingClient);
        const normalized: Record<string, number> = {};
        KEYS.forEach((k) => {
            normalized[k] = round1(toNumber(c?.portfolio?.[k] ?? 0));
        });
        setEditPortfolio(normalized);
    }, [editingClient, clients]);

    // Add client
    const handleAddClient = async () => {
        try {
            setSubmitting(true);
            setError(null);

            const res = await api.post('/clients/add_client', {
                name: clientName,
                status: 'active',
                contact_name: contactName,
                contact_email: contactEmail,
            });

            const newClient: Client = {
                id: String(res.data?.id ?? res.data?.client_id),
                name: res.data?.name ?? clientName,
                status: res.data?.status ?? 'active',
                contact: res.data?.contact ?? { name: contactName, email: contactEmail },
                portfolio: {},
                logo: null,
            };

            setClients((prev) => [newClient, ...prev]);
            setClientName('');
            setContactName('');
            setContactEmail('');
            setIsDialogOpen(false);
        } catch (e) {
            console.error('Error adding client:', e);
            setError('Failed to add client. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Save portfolio
    const handleSavePortfolio = async () => {
        if (!editingClient) return;
        try {
            setSubmitting(true);
            setError(null);

            await api.put(`/clients/${editingClient}/portfolio`, { portfolio: editPortfolio });

            setClients((prev) => prev.map((c) => (c.id === editingClient ? { ...c, portfolio: { ...editPortfolio } } : c)));
            setEditingClient(null);
            setEditPortfolio({});
        } catch (e) {
            console.error('Error saving portfolio:', e);
            setError('Failed to save portfolio changes. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Update a single bucket (no fancy rebalancing; just clamp & round)
    const handlePortfolioChange = (key: string, value: string) => {
        const n = Math.max(0, Math.min(100, toNumber(value)));
        setEditPortfolio((prev) => ({ ...prev, [key]: round1(n) }));
    };

    const editTotal = useMemo(() => sum(editPortfolio), [editPortfolio]);
    const totalClass =
        Math.abs(editTotal - 100) <= EPS ? 'text-dashboard-success' : editTotal > 100 + EPS ? 'text-dashboard-danger' : 'text-dashboard-warning';

    if (loading) {
        return (
            <div className="p-10 flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading clients…
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center">
                <p className="text-red-600 font-medium">{error}</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                    Reload
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header + Add Client */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Client Management</h1>
                    <p className="text-muted-foreground text-lg">Manage client portfolios and asset allocations</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-105">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Client
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Add New Client</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 pt-4">
                            <div className="space-y-1">
                                <Label htmlFor="clientName" className="text-sm font-semibold text-foreground">
                                    Client Name
                                </Label>
                                <Input
                                    id="clientName"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="Enter client name"
                                    className="rounded-lg border-primary/20 focus:border-primary/40"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="contactName" className="text-sm font-semibold text-foreground">
                                    Contact Name
                                </Label>
                                <Input
                                    id="contactName"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    placeholder="Enter contact person name"
                                    className="rounded-lg border-primary/20 focus:border-primary/40"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="contactEmail" className="text-sm font-semibold text-foreground">
                                    Contact Email
                                </Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="Enter contact email"
                                    className="rounded-lg border-primary/20 focus:border-primary/40"
                                />
                            </div>

                            <Button
                                onClick={handleAddClient}
                                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 py-3 rounded-xl font-medium"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Add Client
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Clients List */}
            <div className="grid gap-8">
                {clients.map((client) => {
                    const initials =
                        client.name
                            ?.trim()
                            ?.split(/\s+/)
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'CL';

                    return (
                        <Card
                            key={client.id}
                            className="group relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 border border-primary/10 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                        >
                            <CardContent className="p-8">
                                <div className="flex flex-col lg:flex-row items-start gap-8">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0 relative">
                                        <div className="relative">
                                            <Avatar className="w-24 h-24 ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
                                                <AvatarImage
                                                    src={client.logo || ''}
                                                    alt={client.name}
                                                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary text-xl font-bold">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -top-1 -right-1">
                                                <div
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                                                        client.status === 'active'
                                                            ? 'bg-gradient-to-r from-dashboard-success to-dashboard-success/80'
                                                            : 'bg-gradient-to-r from-muted to-muted/80'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${
                                                            client.status === 'active' ? 'bg-white' : 'bg-muted-foreground'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                                                    {client.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={`${
                                                            client.status === 'active'
                                                                ? 'bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20'
                                                                : 'bg-muted/10 text-muted-foreground border-muted/20'
                                                        } pointer-events-none`}
                                                    >
                                                        {client.status?.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={() => setEditingClient(client.id)}
                                                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-card-foreground px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-105"
                                            >
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                Edit Portfolio
                                            </Button>
                                        </div>

                                        {/* Contact */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                                                <h4 className="text-lg font-bold text-foreground">Primary Contact</h4>
                                            </div>
                                            <div className="bg-muted/5 rounded-xl p-4 border border-primary/10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-background shadow-sm flex items-center justify-center">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-foreground">{client.contact?.name || '—'}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Mail className="w-4 h-4" />
                                                            <span>{client.contact?.email || '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Portfolio */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                                                <h4 className="text-lg font-bold text-foreground">Portfolio Allocation</h4>
                                            </div>

                                            <div className="bg-muted/5 rounded-xl p-6 border border-primary/10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {Object.entries(client.portfolio || {}).map(([key, value]) => (
                                                        <div
                                                            key={key}
                                                            className="group/item flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-primary/5 transition-all duration-300 hover:shadow-md border border-transparent hover:border-primary/10"
                                                        >
                                                            <span className="text-sm text-muted-foreground font-medium">
                                                                {portfolioLabels[key] ?? key}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-foreground">{value}%</span>
                                                                <div className="w-12 h-2 bg-muted/50 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 group-hover/item:shadow-sm"
                                                                        style={{ width: `${Math.min(value, 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-primary/50">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-base font-semibold text-foreground">Total Allocation:</span>
                                                        <span
                                                            className={`text-xl font-bold ${
                                                                Math.abs(sum(client.portfolio) - 100) <= EPS
                                                                    ? 'text-dashboard-success'
                                                                    : sum(client.portfolio) > 100 + EPS
                                                                    ? 'text-dashboard-danger'
                                                                    : 'text-dashboard-warning'
                                                            }`}
                                                        >
                                                            {sum(client.portfolio)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* /Content */}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Edit Portfolio Dialog */}
            <Dialog
                open={editingClient !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingClient(null);
                        setEditPortfolio({});
                    }
                }}
            >
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden bg-gradient-to-br from-background to-muted/20">
                    <DialogHeader className="pb-4 border-b border-primary/10">
                        <DialogTitle className="text-2xl font-bold text-foreground">Edit Portfolio Allocation</DialogTitle>
                        <p className="text-muted-foreground">Adjust the portfolio allocation percentages for this client</p>
                    </DialogHeader>

                    <div className="space-y-6 max-h-96 overflow-y-auto p-1">
                        <div className="grid gap-4">
                            {Object.entries(portfolioLabels).map(([key, label]) => (
                                <div
                                    key={key}
                                    className="group flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-md"
                                >
                                    <Label className="text-sm font-medium text-foreground flex-1 pr-4">{label}</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={Number.isFinite(editPortfolio[key]) ? editPortfolio[key] : 0}
                                                onChange={(e) => handlePortfolioChange(key, e.currentTarget.value)}
                                                className="w-24 text-center rounded-lg border-primary/20 focus:border-primary/40"
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground min-w-[20px]">%</span>
                                        <div className="w-16 h-2 bg-muted/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(Number(editPortfolio[key] || 0), 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total Section */}
                        <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-6 border border-primary/10">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-foreground">Total Allocation:</span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-2xl font-bold transition-colors ${totalClass}`}>{editTotal.toFixed(1)}%</span>
                                    {Math.abs(editTotal - 100) <= EPS && (
                                        <div className="w-6 h-6 rounded-full bg-dashboard-success/20 flex items-center justify-center">
                                            <div className="w-3 h-3 rounded-full bg-dashboard-success" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {Math.abs(editTotal - 100) > EPS && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    {editTotal > 100 + EPS
                                        ? 'Total exceeds 100%. Reduce some allocations.'
                                        : 'Total is less than 100%. Consider adjusting allocations.'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-primary/10">
                        <Button
                            onClick={handleSavePortfolio}
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Portfolio Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
