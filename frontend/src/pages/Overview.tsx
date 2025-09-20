import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, FileText, Users, Globe, AlertTriangle } from "lucide-react";

const metrics = [
  {
    title: "Total News Today",
    value: "247",
    change: "+12%",
    trend: "up",
    icon: FileText,
    description: "vs yesterday"
  },
  {
    title: "Active Markets",
    value: "18",
    change: "+2",
    trend: "up", 
    icon: Globe,
    description: "markets tracked"
  },
  {
    title: "Client Alerts",
    value: "34",
    change: "-8%",
    trend: "down",
    icon: Users,
    description: "notifications sent"
  },
  {
    title: "Important News",
    value: "12",
    change: "+3",
    trend: "up",
    icon: AlertTriangle,
    description: "require attention"
  }
];

const recentNews = [
  {
    id: 1,
    title: "Federal Reserve Announces Interest Rate Decision",
    summary: "The Fed maintains current rates amid economic uncertainty and inflation concerns.",
    markets: ["USD", "Bonds", "Equities"],
    clients: ["JP Morgan", "Goldman Sachs"],
    importance: "high",
    time: "2 min ago"
  },
  {
    id: 2,
    title: "Oil Prices Surge Following OPEC Meeting",
    summary: "Crude oil prices jump 3% after OPEC+ announces production cuts.",
    markets: ["Energy", "Commodities"],
    clients: ["Shell", "ExxonMobil"],
    importance: "high",
    time: "15 min ago"
  },
  {
    id: 3,
    title: "Tech Earnings Beat Expectations",
    summary: "Major technology companies report stronger than expected quarterly results.",
    markets: ["NASDAQ", "Technology"],
    clients: ["Microsoft", "Apple"],
    importance: "medium",
    time: "1 hour ago"
  }
];

export default function Overview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Market News Overview</h1>
        <p className="text-muted-foreground">Monitor global market developments and client impact</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-dashboard-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-dashboard-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 text-sm ${
                  metric.trend === 'up' ? 'text-dashboard-success' : 'text-dashboard-danger'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {metric.change}
                </div>
                <span className="text-sm text-muted-foreground">{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent News */}
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
                  <div className={`w-2 h-2 rounded-full ${
                    news.importance === 'high' ? 'bg-dashboard-danger' : 'bg-dashboard-warning'
                  }`}></div>
                  <h3 className="font-medium text-foreground">{news.title}</h3>
                </div>
                <span className="text-sm text-muted-foreground">{news.time}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{news.summary}</p>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">Markets:</span>
                  {news.markets.map((market) => (
                    <Badge key={market} variant="secondary" className="text-xs">
                      {market}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
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