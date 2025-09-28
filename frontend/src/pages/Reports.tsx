// src/pages/Reports.tsx
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { AxiosError } from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send,
  Download,
  RefreshCw,
  Edit,
  TrendingUp,
  FileText,
  Users,
} from "lucide-react";
import { HalfCircleGauge } from "@/components/ui/half-circle-gauge";

// --- shared types ---
type News = {
  id: string;
  url: string;
  title: string;
  summary: string;
  photo?: string | null;
  markets: string[];
  clients: string[];
  importance?: "low" | "medium" | "high";
  isImportant: boolean;
  publishedAt: string | null;
  source: string;
  communitySentiment: number;
  trustIndex: number;
  generatedReport?: string;
};

type Client = {
  id: number;
  name: string;
  status: string;
  portfolio: Record<string, number>;
  email?: string;
};

// --- helpers ---
function uid() {
  return (
    crypto?.randomUUID?.() ??
    `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

const norm = (s?: string) => (s ?? "").trim().toLowerCase();

function resolveClientsForMarkets(
  markets: string[],
  clientsList: Client[]
): string[] {
  if (
    !Array.isArray(markets) ||
    markets.length === 0 ||
    clientsList.length === 0
  )
    return [];
  const mset = new Set(markets.map(norm));
  const targeted: string[] = [];
  for (const c of clientsList) {
    const pf = c?.portfolio ?? {};
    for (const [asset, pct] of Object.entries(pf)) {
      if ((pct ?? 0) > 0 && mset.has(norm(asset))) {
        targeted.push(c.name);
        break;
      }
    }
  }
  return Array.from(new Set(targeted));
}

const unionStrings = (a: string[], b: string[]) =>
  Array.from(new Set([...(a ?? []), ...(b ?? [])]));

const normalizeBool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string")
    return ["true", "t", "1", "yes", "y"].includes(v.toLowerCase());
  return false;
};

// --- Report Item ---
interface ReportItemProps {
  news: News;
  clients: Client[];
  onUpdateReport: (id: string, report: string) => void;
  onUpdateNews: (id: string, updates: Partial<News>) => void;
}

function ReportItem({
  news,
  clients,
  onUpdateReport,
  onUpdateNews,
}: ReportItemProps) {
  const [editingReport, setEditingReport] = useState(
    news.generatedReport ?? ""
  );
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [editMarketsOpen, setEditMarketsOpen] = useState(false);
  const [editClientsOpen, setEditClientsOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(
    news.markets
  );
  const [selectedClientsEdit, setSelectedClientsEdit] = useState<string[]>(
    news.clients
  );

  const handleSendToClients = () => {
    console.log("Sending report to clients:", selectedClients);
    setSendDialogOpen(false);
    setSelectedClients([]);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      const response = await api.post(
        "/reports/download_pdf",
        {
          text: editingReport || news.summary,
          filename: `financial_report_${news.id}.pdf`,
          company: "Wellershoff & Partners",
          report_title: news.title,
          report_date: new Date().toISOString().split("T")[0],
          logo_path: "frontend/public/WPlogo.png",
          include_cover: true,
          customers: clients, // 🔑 real clients
        },
        { responseType: "blob" } // ✅ important to get PDF
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial_report_${news.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);

      const { data } = await api.post("/reports/regenerate", {
        title: news.title,
        text: editingReport || news.summary,
        markets: news.markets,
        source: news.source,
        publishedAt: news.publishedAt,
        customers: clients,
      });

      const generatedReport = data.generatedReport || data.answer;
      setEditingReport(generatedReport);
      onUpdateReport(news.id, generatedReport);
    } catch (error) {
      console.error("Error regenerating report:", error);
      alert("Failed to regenerate report. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveMarkets = () => {
    onUpdateNews(news.id, { markets: selectedMarkets });
    setEditMarketsOpen(false);
  };

  const handleSaveClients = () => {
    onUpdateNews(news.id, { clients: selectedClientsEdit });
    setEditClientsOpen(false);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const affectedClients = clients.filter((client) =>
    news.clients.includes(client.name)
  );

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="relative">
        <img
          src={news.photo || "/placeholder.svg"}
          alt={news.title}
          width={300}
          height={200}
          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg" />
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight text-gray-900 group-hover:text-primary transition-colors">
          {news.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm text-gray-600 leading-relaxed">{news.summary}</p>

        {/* Markets */}
        <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-blue-900">
              Markets Influenced
            </h4>
            <Dialog open={editMarketsOpen} onOpenChange={setEditMarketsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Influenced Markets</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {selectedMarkets.map((market) => (
                    <div key={market} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedMarkets.includes(market)}
                        onCheckedChange={(checked) => {
                          if (checked)
                            setSelectedMarkets([...selectedMarkets, market]);
                          else
                            setSelectedMarkets(
                              selectedMarkets.filter((m) => m !== market)
                            );
                        }}
                      />
                      <span>{market}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditMarketsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveMarkets}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-1">
            {news.markets.map((market) => (
              <Badge
                key={market}
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {market}
              </Badge>
            ))}
          </div>
        </div>

        {/* Clients */}
        <div className="bg-green-50/50 rounded-lg p-3 border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-green-900">
              Affected Clients
            </h4>
            <Dialog open={editClientsOpen} onOpenChange={setEditClientsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Influenced Clients</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={selectedClientsEdit.includes(client.name)}
                        onCheckedChange={(checked) => {
                          if (checked)
                            setSelectedClientsEdit([
                              ...selectedClientsEdit,
                              client.name,
                            ]);
                          else
                            setSelectedClientsEdit(
                              selectedClientsEdit.filter(
                                (c) => c !== client.name
                              )
                            );
                        }}
                      />
                      <span>{client.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditClientsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveClients}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-1">
            {news.clients.map((client) => (
              <Badge
                key={client}
                variant="outline"
                className="text-xs border-green-200 text-green-800 hover:bg-green-50"
              >
                {client}
              </Badge>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
          <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Key Performance Indicators
          </h4>
          <div className="flex justify-around">
            <HalfCircleGauge
              value={news.communitySentiment}
              max={100}
              label="Community Sentiment"
              color="#8b5cf6"
              size={100}
            />
            <HalfCircleGauge
              value={news.trustIndex}
              max={100}
              label="Trust Index"
              color="#06b6d4"
              size={100}
            />
          </div>
        </div>

        {/* Report */}
        <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
          <h4 className="text-sm font-semibold text-amber-900 mb-3">
            Report Analysis
          </h4>
          <Textarea
            value={editingReport}
            onChange={(e) => setEditingReport(e.target.value)}
            onBlur={() => onUpdateReport(news.id, editingReport)}
            placeholder="Enter your analysis and recommendations..."
            className="min-h-[120px] border-amber-200 focus:border-amber-400 bg-white/80"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500"
              >
                <Send className="h-4 w-4" /> Send to Clients
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Report to Clients</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {affectedClients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={(checked) => {
                        if (checked)
                          setSelectedClients([...selectedClients, client.id]);
                        else
                          setSelectedClients(
                            selectedClients.filter((id) => id !== client.id)
                          );
                      }}
                    />
                    <span>
                      {client.name} ({client.email ?? "no email"})
                    </span>
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSendDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendToClients}
                    disabled={selectedClients.length === 0}
                  >
                    Send to {selectedClients.length} Client
                    {selectedClients.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" /> Download PDF
          </Button>

          <Button variant="outline" size="sm" onClick={handleRegenerate}>
            <RefreshCw className="h-4 w-4" />{" "}
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <span className="font-medium">{news.source}</span>
          <span>{formatTime(news.publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Reports Page ---
export default function Reports() {
  const [newsReports, setNewsReports] = useState<News[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [newsResp, clientsResp] = await Promise.all([
          api.get<Partial<News>[]>("/news/list"),
          api.get<Client[]>("/clients/list"),
        ]);

        const rawNews = Array.isArray(newsResp.data) ? newsResp.data : [];
        const rawClients = Array.isArray(clientsResp.data)
          ? clientsResp.data
          : [];
        setClients(rawClients);

        const mapped: News[] = rawNews.map((d) => {
          const rawImp = d?.isImportant ?? null;
          const markets = Array.isArray(d?.markets) ? d.markets : [];
          const clientsCalc = resolveClientsForMarkets(markets, rawClients);

          return {
            id: d.id ?? uid(),
            url: d.url ?? "",
            title: d.title ?? "Untitled",
            summary: d.summary ?? "",
            photo: d.photo ?? null,
            markets,
            clients: clientsCalc,
            importance: d.importance as "low" | "medium" | "high" | undefined,
            isImportant: normalizeBool(rawImp),
            publishedAt: d.publishedAt ?? null,
            source: d.source ?? "Unknown",
            communitySentiment: d.communitySentiment ?? 0,
            trustIndex: d.trustIndex ?? 0,
            generatedReport: d.generatedReport ?? "",
          };
        });

        setNewsReports(mapped.filter((n) => n.isImportant));
      } catch (e) {
        setError(e instanceof AxiosError ? e.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpdateReport = (id: string, report: string) => {
    setNewsReports((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, generatedReport: report } : item
      )
    );
  };

  const handleUpdateNews = (id: string, updates: Partial<News>) => {
    setNewsReports((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Important News
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newsReports.length}</div>
            <p className="text-xs text-muted-foreground">Requiring reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Affected Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(newsReports.flatMap((news) => news.clients)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Reports Ready</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                newsReports.filter(
                  (news) =>
                    news.generatedReport && news.generatedReport.length > 50
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Ready to send</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        {loading && <p className="text-muted-foreground">Loading reports…</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {!loading &&
          !error &&
          newsReports.map((news) => (
            <ReportItem
              key={news.id}
              news={news}
              clients={clients}
              onUpdateReport={handleUpdateReport}
              onUpdateNews={handleUpdateNews}
            />
          ))}
      </div>

      {!loading && !error && newsReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No important news items found for reporting.
          </p>
        </div>
      )}
    </div>
  );
}
