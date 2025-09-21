import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MessageSquare,
  Search,
  Filter,
  Star,
  Send,
  Edit,
  TrendingUp,
} from "lucide-react";
import { HalfCircleGauge } from "@/components/ui/half-circle-gauge";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const newsItems = [
  {
    id: 1,
    title: "Federal Reserve Announces Interest Rate Decision",
    summary:
      "The Federal Reserve has decided to maintain current interest rates at 5.25-5.50% amid ongoing economic uncertainty.",
    photo:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
    markets: ["USD", "Bonds", "Equities", "Forex"],
    clients: ["JP Morgan", "Goldman Sachs", "Bank of America"],
    importance: "high",
    isImportant: true,
    publishedAt: "2024-01-15T14:30:00Z",
    source: "Reuters",
    communitySentiment: 72,
    trustIndex: 89,
  },
  {
    id: 2,
    title: "Oil Prices Surge Following OPEC Meeting",
    summary:
      "Crude oil prices jumped 3.2% after OPEC+ announced unexpected production cuts of 1.2 million barrels per day.",
    photo:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
    markets: ["Energy", "Commodities", "Oil", "Gas"],
    clients: ["Shell", "ExxonMobil", "Chevron"],
    importance: "high",
    isImportant: true,
    publishedAt: "2024-01-15T13:15:00Z",
    source: "Bloomberg",
    communitySentiment: 45,
    trustIndex: 92,
  },
];

interface NewsItemProps {
  news: {
    id: number;
    title: string;
    summary: string;
    photo?: string;
    markets: string[];
    clients: string[];
    importance: string;
    isImportant: boolean;
    publishedAt: string;
    source: string;
    communitySentiment: number;
    trustIndex: number;
    impactScore?: number; // Add this as optional
    novelty?: number; // Add this as optional
  };
  onToggleImportant: (id: number) => void;
  onUpdateNews: (id: number, updates: Partial<any>) => void;
}

function NewsItem({ news, onToggleImportant, onUpdateNews }: NewsItemProps) {
  const [editMarketsOpen, setEditMarketsOpen] = useState(false);
  const [editClientsOpen, setEditClientsOpen] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(
    news.markets
  );
  const [selectedClients, setSelectedClients] = useState<string[]>(
    news.clients
  );

  const handleSaveMarkets = () => {
    onUpdateNews(news.id, { markets: selectedMarkets });
    setEditMarketsOpen(false);
  };

  const handleSaveClients = () => {
    onUpdateNews(news.id, { clients: selectedClients });
    setEditClientsOpen(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < -60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < -1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };
  const truncateDescription = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  return (
    <Card className="overflow-hidden shadow-lg group">
      <div className="relative">
        <img
          src={news.photo || "/placeholder.svg"}
          alt={news.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleImportant(news.id)}
                  className={`rounded-full ${
                    news.isImportant
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-white text-gray-600"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${
                      news.isImportant ? "fill-current" : ""
                    }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {news.isImportant
                  ? "Remove from important"
                  : "Mark as important"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <CardHeader>
        <CardTitle>{news.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm text-gray-600">
          {truncateDescription(news.summary)}
        </p>

        {/* Markets Section */}
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
                        setSelectedMarkets(
                          checked
                            ? [...selectedMarkets, m]
                            : selectedMarkets.filter((x) => x !== m)
                        )
                      }
                    />
                    <span>{m}</span>
                  </div>
                ))}
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditMarketsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveMarkets}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {news.markets.map((m) => (
              <Badge key={m}>{m}</Badge>
            ))}
          </div>
        </div>

        {/* Clients Section */}
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
                        setSelectedClients(
                          checked
                            ? [...selectedClients, c]
                            : selectedClients.filter((x) => x !== c)
                        )
                      }
                    />
                    <span>{c}</span>
                  </div>
                ))}
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditClientsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveClients}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {news.clients.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-purple-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold mb-2">
            Key Performance Indicators
          </h4>
          <div className="flex justify-around">
            <HalfCircleGauge
              value={news.impactScore || news.communitySentiment || 0}
              max={100}
              label="Impact Score"
              color="#8b5cf6"
              size={100}
            />
            <HalfCircleGauge
              value={news.novelty * 10 || news.trustIndex || 0}
              max={10}
              label="Novelty Index"
              color="#06b6d4"
              size={100}
            />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterImportance, setFilterImportance] = useState("all");
  const [newsData, setNewsData] = useState(newsItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("http://localhost:5001/api/news/list");
        if (!res.ok) throw new Error("Failed to fetch news");
        const data = await res.json();
        setNewsData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleToggleImportant = (id: number) => {
    setNewsData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isImportant: !item.isImportant } : item
      )
    );
  };

  const handleUpdateNews = (
    id: number,
    updates: Partial<(typeof newsItems)[0]>
  ) => {
    setNewsData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const filteredNews = newsData.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterImportance === "all" ||
      (filterImportance === "important" && n.isImportant);
    return matchesSearch && matchesFilter;
  });

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    console.log("User asked:", chatMessage);
    setChatMessage("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* News List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">All News</h1>
            <p className="text-muted-foreground">
              Monitor and analyze market news
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select
              value={filterImportance}
              onValueChange={setFilterImportance}
            >
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All News</SelectItem>
                <SelectItem value="important">Important</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && <p>Loading news…</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        <div className="grid md:grid-cols-2 gap-6">
          {filteredNews.map((news) => (
            <NewsItem
              key={news.id}
              news={news}
              onToggleImportant={handleToggleImportant}
              onUpdateNews={handleUpdateNews}
            />
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6 h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> AI News Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4 min-h-0">
            <div className="flex-1 border border-muted/30 rounded-lg p-4 overflow-y-auto min-h-0">
              <p className="text-sm bg-muted/30 p-2 rounded-md text-muted-foreground">
                Welcome! Ask me anything about the news items.
              </p>
            </div>
            <div className="flex-shrink-0 relative bg-gray-50 rounded-md border border-gray-200 p-2">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask me anything about the news..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit(e);
                    }
                  }}
                />
                <Button
                  onClick={handleChatSubmit}
                  disabled={!chatMessage.trim()}
                  size="sm"
                  className="rounded-full w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
