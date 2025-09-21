import { useState, useEffect } from "react";
import {
  Rss,
  Settings,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Globe,
  Plus,
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

const sourceList = [
  {
    id: 1,
    name: "Reuters",
    url: "https://reuters.com",
    category: "Global News",
    description:
      "Leading international news and financial information provider",
    status: "active",
    lastUpdate: "2 minutes ago",
    articlesPerDay: 450,
    reliability: 98,
    keywords: ["markets", "economy", "finance", "geopolitics"],
    enabled: true,
  },
  {
    id: 2,
    name: "Bloomberg",
    url: "https://bloomberg.com",
    category: "Financial News",
    description: "Business and financial news, data and analysis",
    status: "active",
    lastUpdate: "1 minute ago",
    articlesPerDay: 380,
    reliability: 97,
    keywords: ["stocks", "bonds", "commodities", "central banks"],
    enabled: true,
  },
];

export default function Sources() {
  const [sourceLink, setSourceLink] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceCategory, setSourceCategory] = useState("Global News");
  const [sourceDescription, setSourceDescription] = useState("");
  const [sourceKeywords, setSourceKeywords] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sources, setSources] = useState(sourceList);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5001/api/sources/list");
      if (!response.ok) throw new Error("Failed to fetch sources");
      const data = await response.json();
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
      const newSource = {
        name: sourceName,
        url: sourceLink,
        category: sourceCategory,
        description: sourceDescription,
        status: "active",
        articlesPerDay: 0,
        reliability: 0,
        keywords: sourceKeywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k),
        enabled: true,
      };
      const response = await fetch("http://localhost:5001/api/sources/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource),
      });
      if (!response.ok) throw new Error("Failed to add source");
      await fetchSources();
      setSourceName("");
      setSourceLink("");
      setSourceDescription("");
      setSourceKeywords("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding source:", error);
      alert("Failed to add source. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: any } } = {
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
        {sources.map((source) => (
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

                {/* Metrics + Switch aligned middle */}
                <div className="flex items-center gap-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Articles/day:
                      </span>
                      <div className="font-medium">{source.articlesPerDay}</div>
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

              {/* Bottom right section */}
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
