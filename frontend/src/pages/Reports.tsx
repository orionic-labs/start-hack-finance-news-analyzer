import { useState } from "react";
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
  Settings,
  Edit,
  TrendingUp,
  FileText,
  Users,
} from "lucide-react";
import { HalfCircleGauge } from "../components/ui/half-circle-gauge";

const availableMarkets = [
  "FX (USD, CHF, EUR, JPY)",
  "Gold",
  "Global Government Bonds",
  "Global Corporate bonds",
  "USA Equities",
  "Emerging Markets",
  "EU(incl. UK and CH) Equities",
  "Japan Equities",
];

const availableClients = [
  "JP Morgan",
  "Goldman Sachs",
  "Bank of America",
  "Morgan Stanley",
  "Wells Fargo",
  "Deutsche Bank",
  "BNP Paribas",
  "Credit Suisse",
  "UBS",
  "Barclays",
  "Shell",
  "ExxonMobil",
  "Chevron",
  "BP",
  "Total",
  "Microsoft",
  "Apple",
  "Google",
  "Amazon",
  "Meta",
  "HSBC",
  "Standard Chartered",
  "Citigroup",
  "BlackRock",
  "Vanguard",
];

const importantNews = [
  {
    id: 1,
    title: "Federal Reserve Announces Interest Rate Decision",
    summary:
      "The Federal Reserve has decided to maintain current interest rates at 5.25-5.50% amid ongoing economic uncertainty and persistent inflation concerns. The decision comes after careful consideration of recent economic data showing mixed signals in employment and consumer spending patterns.",
    photo:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
    markets: ["USD", "Bonds", "Equities", "Forex"],
    clients: ["JP Morgan", "Goldman Sachs", "Bank of America"],
    publishedAt: "2024-01-15T14:30:00Z",
    source: "Reuters",
    generatedReport:
      "This Federal Reserve decision to maintain interest rates at 5.25-5.50% reflects the central bank's cautious approach amid mixed economic signals. The decision will likely impact bond yields and equity valuations across multiple sectors. Key implications for your portfolio include potential shifts in fixed income strategies and currency hedging approaches.",
    communitySentiment: 72,
    trustIndex: 89,
  },
  {
    id: 2,
    title: "Oil Prices Surge Following OPEC Meeting",
    summary:
      "Crude oil prices jumped 3.2% after OPEC+ announced unexpected production cuts of 1.2 million barrels per day. The decision has sent shockwaves through energy markets and is expected to impact global inflation rates.",
    photo:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
    markets: ["Energy", "Commodities", "Oil", "Gas"],
    clients: ["Shell", "ExxonMobil", "Chevron"],
    publishedAt: "2024-01-15T13:15:00Z",
    source: "Bloomberg",
    generatedReport:
      "The OPEC+ production cut of 1.2 million barrels per day represents a significant tightening of global oil supply. This development will likely lead to sustained higher energy prices, affecting downstream industries and consumer inflation. Energy sector equities may see upward pressure while transportation and manufacturing costs could rise.",
    communitySentiment: 45,
    trustIndex: 92,
  },
];

const mockClients = [
  { id: 1, name: "Goldman Sachs", email: "reports@goldmansachs.com" },
  { id: 2, name: "JP Morgan", email: "analysis@jpmorgan.com" },
  { id: 3, name: "BlackRock", email: "research@blackrock.com" },
  { id: 4, name: "ExxonMobil", email: "intelligence@exxonmobil.com" },
  { id: 5, name: "Chevron", email: "reports@chevron.com" },
  { id: 6, name: "Shell", email: "analysis@shell.com" },
];

interface ReportItemProps {
  news: (typeof importantNews)[0];
  onUpdateReport: (id: number, report: string) => void;
  onUpdateNews: (
    id: number,
    updates: Partial<(typeof importantNews)[0]>
  ) => void;
}

function ReportItem({ news, onUpdateReport, onUpdateNews }: ReportItemProps) {
  const [editingReport, setEditingReport] = useState(news.generatedReport);
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
    // Simulate sending to selected clients
    console.log("Sending report to clients:", selectedClients);
    setSendDialogOpen(false);
    setSelectedClients([]);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      const response = await fetch(
        "http://localhost:5001/api/reports/download_pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: news.summary, // Send the news text for processing
            filename: `financial_report_${news.id}.pdf`,
            company: "Your Company Name",
            report_title: news.title,
            report_date: new Date().toISOString().split("T")[0],
            logo_path: null,
            include_cover: true,
            customers: [
              {
                name: "John Doe Portfolio",
                portfolio: {
                  "FX (USD, CHF, EUR, JPY)": 15.0,
                  Gold: 5.0,
                  "Global Government Bonds": 20.0,
                  "Global Corporate bonds": 10.0,
                  "USA Equities": 25.0,
                  "Emerging Markets": 10.0,
                  "EU(incl. UK and CH) Equities": 10.0,
                  "Japan Equities": 5.0,
                },
                notes: "Conservative investor focused on stability",
              },
              // Add more customers as needed
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Handle the PDF download
      const blob = await response.blob();
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
      setIsRegenerating(true); // Add loading state

      const response = await fetch(
        "http://0.0.0.0:5001/api/reports/regenerate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: news.title,
            text: news.summary,
            markets: news.markets,
            source: news.source,
            publishedAt: news.publishedAt,
            customers: [
              {
                name: "John Doe Portfolio",
                portfolio: {
                  "FX (USD, CHF, EUR, JPY)": 15.0,
                  Gold: 5.0,
                  "Global Government Bonds": 20.0,
                  "Global Corporate bonds": 10.0,
                  "USA Equities": 25.0,
                  "Emerging Markets": 10.0,
                  "EU(incl. UK and CH) Equities": 10.0,
                  "Japan Equities": 5.0,
                },
                notes: "Conservative investor focused on stability",
              },
              {
                name: "Tech Growth Fund",
                portfolio: {
                  "FX (USD, CHF, EUR, JPY)": 10.0,
                  Gold: 2.0,
                  "Global Government Bonds": 5.0,
                  "Global Corporate bonds": 8.0,
                  "USA Equities": 40.0,
                  "Emerging Markets": 20.0,
                  "EU(incl. UK and CH) Equities": 12.0,
                  "Japan Equities": 3.0,
                },
                notes: "Aggressive growth strategy with tech focus",
              },
              // Add more customers as needed
            ],
            // Add any other news data you want to send
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to regenerate report");
      }

      const result = await response.json();

      // Wait for the response and update with the returned report
      const generatedReport = result.generatedReport || result.answer;
      setEditingReport(generatedReport);
      onUpdateReport(news.id, generatedReport);
    } catch (error) {
      console.error("Error regenerating report:", error);
      // Show error message to user
      alert("Failed to regenerate report. Please try again.");
    } finally {
      setIsRegenerating(false); // Remove loading state
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const affectedClients = mockClients.filter((client) =>
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

        <div className="space-y-4">
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
                    {availableMarkets.map((market) => (
                      <div key={market} className="flex items-center space-x-2">
                        <Checkbox
                          id={`market-${market}`}
                          checked={selectedMarkets.includes(market)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMarkets([...selectedMarkets, market]);
                            } else {
                              setSelectedMarkets(
                                selectedMarkets.filter((m) => m !== market)
                              );
                            }
                          }}
                        />
                        <label htmlFor={`market-${market}`} className="text-sm">
                          {market}
                        </label>
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
                    {availableClients.map((client) => (
                      <div key={client} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client}`}
                          checked={selectedClientsEdit.includes(client)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClientsEdit([
                                ...selectedClientsEdit,
                                client,
                              ]);
                            } else {
                              setSelectedClientsEdit(
                                selectedClientsEdit.filter((c) => c !== client)
                              );
                            }
                          }}
                        />
                        <label htmlFor={`client-${client}`} className="text-sm">
                          {client}
                        </label>
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
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
          <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Key Performance Indicators
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

        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <Send className="h-4 w-4" />
                Send to Clients
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Report to Clients</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select clients to send this report to:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {affectedClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`client-${client.id}`}
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedClients([...selectedClients, client.id]);
                          } else {
                            setSelectedClients(
                              selectedClients.filter((id) => id !== client.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`client-${client.id}`}
                        className="text-sm"
                      >
                        {client.name} ({client.email})
                      </label>
                    </div>
                  ))}
                </div>
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
            className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-600 bg-transparent"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 bg-transparent"
          >
            <RefreshCw className="h-4 w-4" />
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

export default function Reports() {
  // const [reports, setReports] = useState(newsReports);
  const [newsReports, setNewsReports] = useState(importantNews);

  const handleUpdateReport = (id: number, report: string) => {
    setNewsReports((prev) =>
      prev.map((item) => (item.id === id ? { ...item, report } : item))
    );
  };

  const handleUpdateNews = (
    id: number,
    updates: Partial<(typeof newsReports)[0]>
  ) => {
    setNewsReports((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {newsReports.map((news) => (
          <ReportItem
            key={news.id}
            news={news}
            onUpdateReport={handleUpdateReport}
            onUpdateNews={handleUpdateNews}
          />
        ))}
      </div>

      {newsReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No important news items found for reporting.
          </p>
        </div>
      )}
    </div>
  );
}
