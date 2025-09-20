import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Send, RefreshCw, Edit3 } from "lucide-react";

const podcastItems = [
  {
    id: 1,
    title: "Federal Reserve Announces Interest Rate Decision",
    summary: "The Federal Reserve has decided to maintain current interest rates at 5.25-5.50% amid ongoing economic uncertainty and persistent inflation concerns.",
    photo: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
    markets: ["USD", "Bonds", "Equities"],
    clients: ["JP Morgan", "Goldman Sachs"],
    report: "This decision reflects the Fed's cautious approach to monetary policy in the current economic environment. Key implications include continued pressure on borrowing costs and potential impacts on equity valuations. Recommend maintaining defensive positioning in bond portfolios while monitoring employment data for future policy signals.",
    publishedAt: "2024-01-15T14:30:00Z"
  },
  {
    id: 2,
    title: "Oil Prices Surge Following OPEC Meeting",
    summary: "Crude oil prices jumped 3.2% after OPEC+ announced unexpected production cuts of 1.2 million barrels per day.",
    photo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
    markets: ["Energy", "Commodities"],
    clients: ["Shell", "ExxonMobil"],
    report: "The surprise production cut signals OPEC+'s commitment to supporting oil prices amid concerns about demand growth. This development is likely to support energy sector valuations and could contribute to inflationary pressures. Energy clients should consider the impact on their forward hedging strategies.",
    publishedAt: "2024-01-15T13:15:00Z"
  }
];

export default function Podcasts() {
  const [editingReport, setEditingReport] = useState<number | null>(null);
  const [reportTexts, setReportTexts] = useState<{[key: number]: string}>({});

  const handleEditReport = (id: number, currentReport: string) => {
    setEditingReport(id);
    setReportTexts(prev => ({ ...prev, [id]: currentReport }));
  };

  const handleSaveReport = (id: number) => {
    setEditingReport(null);
    // Here you would typically save to backend
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Podcasts & Reports</h1>
        <p className="text-muted-foreground">Important news items requiring detailed analysis and client communication</p>
      </div>

      <div className="space-y-6">
        {podcastItems.map((item) => (
          <Card key={item.id} className="border-dashboard-danger/20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-dashboard-danger animate-pulse"></div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                    <CardDescription className="mt-1">{formatTime(item.publishedAt)}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={item.photo}
                    alt={item.title}
                    className="w-32 h-24 rounded-lg object-cover object-center"
                  />
                </div>
                
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs font-medium text-muted-foreground">Markets:</span>
                      {item.markets.map((market) => (
                        <Badge key={market} variant="secondary" className="text-xs">
                          {market}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs font-medium text-muted-foreground">Clients:</span>
                      {item.clients.map((client) => (
                        <Badge key={client} variant="outline" className="text-xs">
                          {client}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashboard-primary/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">Analysis Report</h4>
                  {editingReport !== item.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditReport(item.id, item.report)}
                      className="text-dashboard-primary hover:bg-dashboard-primary/10"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
                
                {editingReport === item.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={reportTexts[item.id] || item.report}
                      onChange={(e) => setReportTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="min-h-24 border-dashboard-primary/20"
                      placeholder="Enter your analysis report..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveReport(item.id)}
                        className="bg-dashboard-primary hover:bg-dashboard-primary/90"
                      >
                        Save Report
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingReport(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">
                    {item.report}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dashboard-primary/10">
                <Button variant="outline" size="sm" className="border-dashboard-primary/20">
                  <Send className="w-4 h-4 mr-2" />
                  Send to Client
                </Button>
                
                <Button variant="outline" size="sm" className="border-dashboard-primary/20">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                
                <Button variant="outline" size="sm" className="border-dashboard-primary/20">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}