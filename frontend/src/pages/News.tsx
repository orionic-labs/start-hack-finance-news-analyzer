// src/pages/News.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { AxiosError } from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Filter,
  Star,
  Send,
  Loader2,
  ImageOff,
  Edit3,
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
};

type Client = {
  id: number;
  name: string;
  status: string;
  portfolio: Record<string, number>;
};

type NewsItemProps = {
  news: News;
  toggling: boolean;
  onToggleImportant: (n: News) => Promise<void>;
  onUpdateNewsLocal: (id: string, updated: Partial<News>) => void;
  resolveClients: (markets: string[]) => string[];
  allClientNames: string[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

// тип ответа API для News
type NewsApiResponse = Partial<News> & {
  importance_flag?: unknown;
  importanceFlag?: unknown;
  important?: unknown;
};

// --- helpers ---
function uid() {
  return (
    crypto?.randomUUID?.() ??
    `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

function formatTime(ts: string | null) {
  if (!ts) return "—";
  const date = new Date(ts);
  return date.toLocaleDateString();
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

// --------------------------------------------------

function NewsItem({
  news,
  toggling,
  onToggleImportant,
  onUpdateNewsLocal,
  resolveClients,
  allClientNames,
}: NewsItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [editMarketsOpen, setEditMarketsOpen] = useState(false);
  const [editClientsOpen, setEditClientsOpen] = useState(false);

  const [selectedMarkets, setSelectedMarkets] = useState(news.markets ?? []);
  const [selectedClients, setSelectedClients] = useState(news.clients ?? []);

  const handleSaveMarkets = () => {
    const recomputed = resolveClients(selectedMarkets);
    const mergedClients = unionStrings(selectedClients, recomputed);
    onUpdateNewsLocal(news.id, {
      markets: selectedMarkets,
      clients: mergedClients,
    });
    setEditMarketsOpen(false);
  };

  const handleSaveClients = () => {
    onUpdateNewsLocal(news.id, { clients: selectedClients });
    setEditClientsOpen(false);
  };

  useEffect(() => {
    setSelectedMarkets(news.markets ?? []);
    setSelectedClients(news.clients ?? []);
  }, [news.markets, news.clients]);

  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-lg group">
      {/* Image + Important Button */}
      <div className="relative">
        {news.photo ? (
          <img
            src={news.photo}
            alt={news.title}
            className="w-full h-48 object-cover"
          />
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
                  className={`rounded-full ${
                    news.isImportant
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {toggling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Star
                      className={`h-4 w-4 ${
                        news.isImportant ? "fill-current" : ""
                      }`}
                    />
                  )}
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

      {/* Title */}
      <CardHeader>
        <CardTitle>{news.title}</CardTitle>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex flex-col flex-1">
        <div className="mb-4">
          <p
            className={`text-sm text-gray-600 ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {news.summary}
          </p>
          {news.summary && news.summary.length > 200 && (
            <Button
              variant="link"
              size="sm"
              className="px-0 text-blue-600"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          )}
        </div>

        <div className="flex-1" />

        {/* Markets */}
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <div className="flex justify-between">
            <h4 className="text-sm font-semibold">Markets Influenced</h4>
            <Dialog open={editMarketsOpen} onOpenChange={setEditMarketsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Edit3 className="h-3 w-3" />
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
                        setSelectedMarkets((prev) =>
                          checked ? [...prev, m] : prev.filter((x) => x !== m)
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
            {(news.markets ?? []).map((m) => (
              <Badge key={m}>{m}</Badge>
            ))}
          </div>
        </div>

        {/* Clients */}
        <div className="bg-green-50 rounded-lg p-3 mb-3">
          <div className="flex justify-between">
            <h4 className="text-sm font-semibold">Clients Influenced</h4>
            <Dialog open={editClientsOpen} onOpenChange={setEditClientsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Edit3 className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Clients</DialogTitle>
                </DialogHeader>
                {allClientNames.map((c) => (
                  <div key={c} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedClients.includes(c)}
                      onCheckedChange={(checked) =>
                        setSelectedClients((prev) =>
                          checked ? [...prev, c] : prev.filter((x) => x !== c)
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
            {(news.clients ?? []).map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        </div>

        {/* KPI Block */}
        <div className="bg-purple-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold mb-2">
            Key Performance Indicators
          </h4>
          <div className="flex justify-around">
            <HalfCircleGauge
              value={news.communitySentiment}
              max={100}
              label="Community Sentiment"
              size={100}
              color="#8b5cf6"
            />
            <HalfCircleGauge
              value={news.trustIndex}
              max={100}
              label="Trust Index"
              size={100}
              color="#06b6d4"
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 border-t pt-2 mt-3">
          <span>
            <a className="underline" href={news.url}>
              {news.source}
            </a>
          </span>
          <span>{formatTime(news.publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function News() {
  const [filterImportance, setFilterImportance] = useState<
    "all" | "important" | "not-important"
  >("all");
  const [newsData, setNewsData] = useState<News[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // --- Chat state ---
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "system",
      content: "Welcome! Ask me anything about the news items.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Fetch news + clients
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [newsResp, clientsResp] = await Promise.all([
          api.get<NewsApiResponse[]>("/news/list"),
          api.get<Client[]>("/clients/list"),
        ]);
        if (!mounted) return;

        const rawNews = Array.isArray(newsResp.data) ? newsResp.data : [];
        const rawClients = Array.isArray(clientsResp.data)
          ? clientsResp.data
          : [];

        setClients(rawClients);

        const mapped: News[] = rawNews.map((d) => {
          const rawImp =
            d?.isImportant ??
            d?.importance_flag ??
            d?.importanceFlag ??
            d?.important ??
            null;
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
          };
        });

        setNewsData(mapped);
      } catch (e: unknown) {
        if (e instanceof AxiosError) {
          setError(
            e.response?.data?.error || e.message || "Failed to fetch news"
          );
        } else {
          setError("Unexpected error while fetching news");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // recompute clients when clients list updates
  useEffect(() => {
    if (!clients.length || !newsData.length) return;
    setNewsData((prev) =>
      prev.map((n) => {
        const computed = resolveClientsForMarkets(n.markets ?? [], clients);
        return { ...n, clients: unionStrings(n.clients ?? [], computed) };
      })
    );
  }, [clients]);

  const handleToggleImportant = async (n: News) => {
    try {
      setTogglingId(n.id);
      setNewsData((prev) =>
        prev.map((it) =>
          it.id === n.id ? { ...it, isImportant: !it.isImportant } : it
        )
      );
      await api.post("/news/importance", { url: n.url });
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        setError(
          e.response?.data?.error || e.message || "Failed to toggle importance"
        );
      } else {
        setError("Unexpected error while toggling importance");
      }
      setNewsData((prev) =>
        prev.map((it) =>
          it.id === n.id ? { ...it, isImportant: n.isImportant } : it
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleUpdateNewsLocal = (id: string, updates: Partial<News>) => {
    setNewsData((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  };

  const filteredNews = useMemo(() => {
    if (filterImportance === "important")
      return newsData.filter((n) => n.isImportant === true);
    if (filterImportance === "not-important")
      return newsData.filter((n) => n.isImportant === false);
    return newsData;
  }, [newsData, filterImportance]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatMessage.trim();
    if (!msg || chatLoading) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: msg };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatMessage("");
    setChatLoading(true);

    try {
      const { data } = await api.post<{ answer?: string }>(
        "/chatbot/send_message_chat",
        { customers: msg }
      );
      const answer: string =
        typeof data?.answer === "string"
          ? data.answer
          : "Sorry, I could not generate an answer.";
      const botMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: answer,
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (e: unknown) {
      const message =
        e instanceof AxiosError
          ? e.response?.data?.error || e.message
          : "Unexpected error contacting assistant";
      setChatMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: `Error: ${message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const allClientNames = useMemo(
    () => clients.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    [clients]
  );

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
            <Select
              value={filterImportance}
              onValueChange={(v: "all" | "important" | "not-important") =>
                setFilterImportance(v)
              }
            >
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

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading news…
          </div>
        )}
        {error && <p className="text-red-600">Error: {error}</p>}

        <div className="grid md:grid-cols-2 gap-6 auto-rows-fr">
          {!isLoading &&
            filteredNews.map((news) => (
              <NewsItem
                key={news.id}
                news={news}
                toggling={togglingId === news.id}
                onToggleImportant={handleToggleImportant}
                onUpdateNewsLocal={handleUpdateNewsLocal}
                resolveClients={(m) => resolveClientsForMarkets(m, clients)}
                allClientNames={allClientNames}
              />
            ))}
        </div>

        {!isLoading && !error && filteredNews.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No news match your filters.
          </p>
        )}
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
            <div
              ref={chatScrollRef}
              className="h-96 bg-muted/30 rounded-lg p-4 overflow-y-auto space-y-3"
            >
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : m.role === "assistant"
                      ? "mr-auto bg-white border"
                      : "mx-auto text-muted-foreground italic"
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

            <form
              onSubmit={handleChatSubmit}
              className="flex gap-2 items-center"
            >
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about any news item..."
                className="flex-1 resize-none"
                rows={1}
              />
              <Button
                type="submit"
                disabled={!chatMessage.trim() || chatLoading}
                className="h-10"
              >
                <Send className="w-4 h-auto" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
