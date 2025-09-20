import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Globe, Rss, Clock, CheckCircle, XCircle, Plus, Settings, Shield } from "lucide-react";
import { useState } from "react";

const sources = [
  {
    id: 1,
    name: "Reuters",
    url: "https://reuters.com",
    category: "Global News",
    description: "Leading international news and financial information provider",
    status: "active",
    lastUpdate: "2 minutes ago",
    articlesPerDay: 450,
    reliability: 98,
    keywords: ["markets", "economy", "finance", "geopolitics"],
    enabled: true
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
    enabled: true
  },
  {
    id: 3,
    name: "Financial Times",
    url: "https://ft.com", 
    category: "Business News",
    description: "Global business news and economic analysis",
    status: "active",
    lastUpdate: "5 minutes ago", 
    articlesPerDay: 180,
    reliability: 96,
    keywords: ["business", "markets", "analysis", "opinion"],
    enabled: true
  },
  {
    id: 4,
    name: "Wall Street Journal",
    url: "https://wsj.com",
    category: "Financial News", 
    description: "American business and financial news publication",
    status: "maintenance",
    lastUpdate: "2 hours ago",
    articlesPerDay: 220,
    reliability: 95,
    keywords: ["US markets", "earnings", "policy", "business"],
    enabled: false
  },
  {
    id: 5,
    name: "ECB Press Releases",
    url: "https://ecb.europa.eu",
    category: "Central Bank",
    description: "Official European Central Bank communications", 
    status: "active",
    lastUpdate: "30 minutes ago",
    articlesPerDay: 15,
    reliability: 99,
    keywords: ["monetary policy", "EUR", "European economy"],
    enabled: true
  },
  {
    id: 6,
    name: "OPEC News",
    url: "https://opec.org",
    category: "Commodities",
    description: "Official OPEC news and market reports",
    status: "error",
    lastUpdate: "6 hours ago",
    articlesPerDay: 8,
    reliability: 94,
    keywords: ["oil", "production", "energy policy"],
    enabled: false
  }
];

export default function Sources() {
  const [sourceLink, setSourceLink] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig: {[key: string]: {color: string, icon: any}} = {
      "active": { color: "bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20", icon: CheckCircle },
      "maintenance": { color: "bg-dashboard-warning/10 text-dashboard-warning border-dashboard-warning/20", icon: Clock },
      "error": { color: "bg-dashboard-danger/10 text-dashboard-danger border-dashboard-danger/20", icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig["error"];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colorMap: {[key: string]: string} = {
      "Global News": "bg-dashboard-primary/10 text-dashboard-primary border-dashboard-primary/20",
      "Financial News": "bg-dashboard-secondary/10 text-dashboard-secondary border-dashboard-secondary/20", 
      "Business News": "bg-dashboard-muted/10 text-dashboard-muted border-dashboard-muted/20",
      "Central Bank": "bg-dashboard-warning/10 text-dashboard-warning border-dashboard-warning/20",
      "Commodities": "bg-green-100 text-green-700 border-green-200"
    };
    
    return (
      <Badge variant="outline" className={colorMap[category] || "border-dashboard-primary/20"}>
        {category}
      </Badge>
    );
  };

  const handleVerifySource = async () => {
    setIsVerifying(true);
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsVerifying(false);
    // Here you would make an API call to verify the source
    console.log("Verifying source:", sourceLink);
  };

  const handleAddSource = () => {
    // Handle adding the source
    console.log("Adding source:", sourceLink);
    setSourceLink("");
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">News Sources</h1>
          <p className="text-muted-foreground">Manage and monitor news source feeds</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-dashboard-primary hover:bg-dashboard-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add a Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="sourceLink">Resource Link</Label>
                <Input
                  id="sourceLink"
                  value={sourceLink}
                  onChange={(e) => setSourceLink(e.target.value)}
                  placeholder="https://example.com/news-feed"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleVerifySource} 
                  variant="outline"
                  disabled={!sourceLink || isVerifying}
                  className="flex-1"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {isVerifying ? "Verifying..." : "Verify Source"}
                </Button>
                <Button onClick={handleAddSource} disabled={!sourceLink} className="flex-1">
                  Add Source
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sources.map((source) => (
          <Card key={source.id} className="border-dashboard-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-dashboard-primary/10 to-dashboard-muted/10 flex items-center justify-center">
                    <Rss className="w-5 h-5 text-dashboard-primary" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{source.name}</h3>
                      {getStatusBadge(source.status)}
                      {getCategoryBadge(source.category)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{source.description}</p>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      <span>{source.url}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {source.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Articles/day:</span>
                        <div className="font-medium">{source.articlesPerDay}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reliability:</span>
                        <div className="font-medium text-dashboard-success">{source.reliability}%</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Last update: {source.lastUpdate}</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <Switch checked={source.enabled} />
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}