// src/pages/Sources.tsx
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { AxiosError } from "axios";

import {
  Rss,
  Settings,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Globe,
  Plus,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Source = {
  id: number | string;
  name: string;
  url: string;
  category: string;
  description: string;
  status: "active" | "maintenance" | "error";
  lastUpdate: string;
  articlesPerDay: number;
  reliability: number;
  keywords: string[];
  enabled: boolean;
};

export default function Sources() {
  const [sourceLink, setSourceLink] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceCategory, setSourceCategory] = useState("Global News");
  const [sourceDescription, setSourceDescription] = useState("");
  const [sourceKeywords, setSourceKeywords] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Source[]>("/sources/list");
      setSources(data);
    } catch (err) {
      console.error("Error fetching sources:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = async () => {
    try {
      setIsVerifying(true);
      const newSource: Omit<Source, "id" | "lastUpdate"> = {
        name: sourceName,
        url: sourceLink,
        category: sourceCategory,
        description: sourceDescription,
        status: "maintenance",
        articlesPerDay: 0,
        reliability: 0,
        keywords: sourceKeywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k),
        enabled: false,
      };

      await api.post("/sources/add", newSource);

      await fetchSources();
      setSourceName("");
      setSourceLink("");
      setSourceDescription("");
      setSourceKeywords("");
      setIsDialogOpen(false);
    } catch (error) {
      const msg =
        error instanceof AxiosError
          ? error.response?.data?.error || error.message
          : "Failed to add source";
      console.error("Error adding source:", msg);
      alert("Failed to add source. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: LucideIcon } } =
      {
        active: {
          color:
            "bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20",
          icon: CheckCircle,
        },
        maintenance: {
          color:
            "bg-dashboard-warning/10 text-dashboard-warning border-dashboard-warning/20",
          icon: Clock,
        },
        error: {
          color:
            "bg-dashboard-danger/10 text-dashboard-danger border-dashboard-danger/20",
          icon: XCircle,
        },
      };
    const config = statusConfig[status] || statusConfig["error"];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />{" "}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colorMap: { [key: string]: string } = {
      "Global News":
        "bg-dashboard-primary/10 text-dashboard-primary border-dashboard-primary/20",
      "Financial News":
        "bg-dashboard-secondary/10 text-dashboard-secondary border-dashboard-secondary/20",
      "Business News":
        "bg-dashboard-muted/10 text-dashboard-muted border-dashboard-muted/20",
      "Central Bank":
        "bg-dashboard-warning/10 text-dashboard-warning border-dashboard-warning/20",
      Commodities: "bg-green-100 text-green-700 border-green-200",
    };
    return (
      <Badge
        variant="outline"
        className={colorMap[category] || "border-dashboard-primary/20"}
      >
        {category}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">News Sources</h1>
          <p className="text-muted-foreground">
            Manage and monitor news source feeds
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Add New Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add News Source</DialogTitle>
              <DialogDescription>
                Add a new financial news source to monitor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sourceName">Source Name</Label>
                <Input
                  id="sourceName"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Bloomberg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceLink">Resource Link</Label>
                <Input
                  id="sourceLink"
                  value={sourceLink}
                  onChange={(e) => setSourceLink(e.target.value)}
                  placeholder="https://example.com/news-feed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceCategory">Category</Label>
                <Select
                  value={sourceCategory}
                  onValueChange={setSourceCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Global News">Global News</SelectItem>
                    <SelectItem value="Financial News">
                      Financial News
                    </SelectItem>
                    <SelectItem value="Business News">Business News</SelectItem>
                    <SelectItem value="Central Bank">Central Bank</SelectItem>
                    <SelectItem value="Commodities">Commodities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceDescription">Description</Label>
                <Textarea
                  id="sourceDescription"
                  value={sourceDescription}
                  onChange={(e) => setSourceDescription(e.target.value)}
                  placeholder="Brief description of the source"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceKeywords">
                  Keywords (comma separated)
                </Label>
                <Input
                  id="sourceKeywords"
                  value={sourceKeywords}
                  onChange={(e) => setSourceKeywords(e.target.value)}
                  placeholder="finance, stocks, markets"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsVerifying(true)}
                  variant="outline"
                  disabled={!sourceLink || isVerifying}
                  className="flex-1"
                >
                  <Shield className="w-4 h-4 mr-2" />{" "}
                  {isVerifying ? "Verifying..." : "Verify Source"}
                </Button>
                <Button
                  onClick={handleAddSource}
                  disabled={!sourceName || !sourceLink || isVerifying}
                  className="flex-1"
                >
                  Add Source
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {isLoading && <p className="text-muted-foreground">Loading sources…</p>}
        {!isLoading &&
          sources.map((source) => (
            <Card key={source.id} className="border-dashboard-primary/10">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between flex-1">
                  {/* Left section */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-dashboard-primary/10 to-dashboard-muted/10 flex items-center justify-center">
                      <Rss className="w-5 h-5 text-dashboard-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {source.name}
                        </h3>
                        {getStatusBadge(source.status)}
                        {getCategoryBadge(source.category)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {source.description}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Globe className="w-3 h-3" /> <span>{source.url}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {source.keywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="secondary"
                            className="text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metrics + Switch */}
                  <div className="flex items-center gap-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Articles/day:
                        </span>
                        <div className="font-medium">
                          {source.articlesPerDay}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Reliability:
                        </span>
                        <div className="font-medium text-dashboard-success">
                          {source.reliability}%
                        </div>
                      </div>
                    </div>
                    <Switch checked={source.enabled} />
                  </div>
                </div>

                {/* Bottom */}
                <div className="flex justify-end items-center gap-4 mt-4">
                  <p className="text-xs text-muted-foreground">
                    Last update: {source.lastUpdate}
                  </p>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
