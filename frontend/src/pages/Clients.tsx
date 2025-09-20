import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Mail, Plus, Edit3 } from "lucide-react";
import { useState } from "react";

const clients = [
  {
    id: 1,
    name: "Global Investment Corp",
    logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop",
    contact: {
      name: "Sarah Mitchell",
      email: "sarah@globalinvest.com"
    },
    portfolio: {
      fx_usd: 15,
      fx_chf: 10,
      fx_eur: 12,
      fx_jpy: 8,
      gold: 10,
      global_gov_bonds: 15,
      global_corp_bonds: 10,
      usa_equities: 15,
      emerging_markets: 5,
      eu_equities: 8,
      japan_equities: 2
    },
    status: "active"
  },
  {
    id: 2,
    name: "Pension Fund Alliance",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop",
    contact: {
      name: "David Chen",
      email: "david@pensionfund.org"
    },
    portfolio: {
      fx_usd: 20,
      fx_chf: 5,
      fx_eur: 15,
      fx_jpy: 5,
      gold: 5,
      global_gov_bonds: 25,
      global_corp_bonds: 15,
      usa_equities: 5,
      emerging_markets: 3,
      eu_equities: 2,
      japan_equities: 0
    },
    status: "active"
  }
];

export default function Clients() {
  const [clientName, setClientName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [editPortfolio, setEditPortfolio] = useState<any>({});

  const getStatusIndicator = (status: string) => {
    return (
      <div className={`w-2 h-2 rounded-full ${
        status === "active" ? "bg-dashboard-success" : "bg-dashboard-muted"
      }`}></div>
    );
  };

  const portfolioLabels = {
    fx_usd: "FX USD",
    fx_chf: "FX CHF", 
    fx_eur: "FX EUR",
    fx_jpy: "FX JPY",
    gold: "Gold",
    global_gov_bonds: "Global Government Bonds",
    global_corp_bonds: "Global Corporate Bonds",
    usa_equities: "USA Equities",
    emerging_markets: "Emerging Markets",
    eu_equities: "EU (incl. UK and CH) Equities",
    japan_equities: "Japan Equities"
  };

  const handleAddClient = () => {
    console.log({ clientName, contactName, contactEmail });
    setClientName("");
    setContactName("");
    setContactEmail("");
    setIsDialogOpen(false);
  };

  const handleEditPortfolio = (clientId: number, portfolio: any) => {
    setEditingClient(clientId);
    setEditPortfolio({ ...portfolio });
  };

  const handleSavePortfolio = () => {
    console.log("Saving portfolio for client", editingClient, editPortfolio);
    setEditingClient(null);
    setEditPortfolio({});
  };

  const handlePortfolioChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newPortfolio = { ...editPortfolio, [key]: numValue };
    
    // Calculate total 
    const total = calculateTotal(newPortfolio);
    
    // If total exceeds 100, proportionally adjust other values
    if (total > 100) {
      const excess = total - 100;
      const otherKeys = Object.keys(newPortfolio).filter(k => k !== key);
      const otherTotal = Object.entries(newPortfolio)
        .filter(([k]) => k !== key)
        .reduce((sum, [, val]) => {
          const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
          return sum + numVal;
        }, 0);
      
      if (otherTotal > 0) {
        otherKeys.forEach(otherKey => {
          const currentVal = typeof newPortfolio[otherKey] === 'number' ? newPortfolio[otherKey] : parseFloat(String(newPortfolio[otherKey])) || 0;
          const proportion = currentVal / otherTotal;
          newPortfolio[otherKey] = Math.max(0, currentVal - (excess * proportion));
        });
      }
    }
    
    setEditPortfolio(newPortfolio);
  };

  const calculateTotal = (portfolio: Record<string, any>): number => {
    return Object.values(portfolio).reduce((sum: number, val: unknown) => {
      const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
      return sum + numVal;
    }, 0);
  };

  return (
    <div className="space-y-6">
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
                <Label htmlFor="clientName" className="text-sm font-semibold text-foreground">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="rounded-lg border-primary/20 focus:border-primary/40"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactName" className="text-sm font-semibold text-foreground">Contact Name</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter contact person name"
                  className="rounded-lg border-primary/20 focus:border-primary/40"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactEmail" className="text-sm font-semibold text-foreground">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Enter contact email"
                  className="rounded-lg border-primary/20 focus:border-primary/40"
                />
              </div>
              <Button onClick={handleAddClient} className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 py-3 rounded-xl font-medium">
                Add Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8">
        {clients.map((client) => (
          <Card key={client.id} className="group relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 border border-primary/10 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Avatar Section */}
                <div className="flex-shrink-0 relative">
                  <div className="relative">
                    <Avatar className="w-24 h-24 ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
                      <AvatarImage src={client.logo} alt={client.name} className="object-cover object-center transition-transform duration-500 group-hover:scale-105" />
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary text-xl font-bold">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                        client.status === "active" 
                          ? "bg-gradient-to-r from-dashboard-success to-dashboard-success/80" 
                          : "bg-gradient-to-r from-muted to-muted/80"
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          client.status === "active" ? "bg-white" : "bg-muted-foreground"
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          client.status === "active" 
                            ? "bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20" 
                            : "bg-muted/10 text-muted-foreground border-muted/20"
                        } pointer-events-none`}>
                          {client.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => handleEditPortfolio(client.id, client.portfolio)}
                      className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-card-foreground px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-105"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Portfolio
                    </Button>
                  </div>

                  {/* Contact Information */}
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
                          <p className="font-semibold text-foreground">{client.contact.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span>{client.contact.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Portfolio Allocation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                      <h4 className="text-lg font-bold text-foreground">Portfolio Allocation</h4>
                    </div>
                    <div className="bg-muted/5 rounded-xl p-6 border border-primary/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(client.portfolio).map(([key, value]) => (
                          <div key={key} className="group/item flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-primary/5 transition-all duration-300 hover:shadow-md border border-transparent hover:border-primary/10">
                            <span className="text-sm text-muted-foreground font-medium">
                              {portfolioLabels[key as keyof typeof portfolioLabels]}
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
                      
                      {/* Total */}
                      <div className="mt-4 pt-4 border-t border-primary/50">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold text-foreground">Total Allocation:</span>
                          <span className={`text-xl font-bold ${
                            calculateTotal(client.portfolio) === 100 
                              ? "text-dashboard-success"
                              : "text-dashboard-warning"
                          }`}>
                            {calculateTotal(client.portfolio)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Portfolio Edit Dialog */}
      <Dialog open={editingClient !== null} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <DialogHeader className="pb-4 border-b border-primary/10">
            <DialogTitle className="text-2xl font-bold text-foreground">Edit Portfolio Allocation</DialogTitle>
            <p className="text-muted-foreground">Adjust the portfolio allocation percentages for this client</p>
          </DialogHeader>
          
          <div className="space-y-6 max-h-96 overflow-y-auto p-1">
            <div className="grid gap-4">
              {Object.entries(portfolioLabels).map(([key, label]) => (
                <div key={key} className="group flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-primary/10 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
                  <Label className="text-sm font-medium text-foreground flex-1 pr-4">{label}</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editPortfolio[key] || 0}
                        onChange={(e) => handlePortfolioChange(key, e.target.value)}
                        className="w-24 text-center rounded-lg border-primary/20 focus:border-primary/40"
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground min-w-[20px]">%</span>
                    <div className="w-16 h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(editPortfolio[key] || 0, 100)}%` }}
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
                  <span className={`text-2xl font-bold transition-colors ${
                    calculateTotal(editPortfolio) === 100 
                      ? "text-dashboard-success" 
                      : calculateTotal(editPortfolio) > 100
                      ? "text-dashboard-danger"
                      : "text-dashboard-warning"
                  }`}>
                    {calculateTotal(editPortfolio).toFixed(1)}%
                  </span>
                  {calculateTotal(editPortfolio) === 100 && (
                    <div className="w-6 h-6 rounded-full bg-dashboard-success/20 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-dashboard-success" />
                    </div>
                  )}
                </div>
              </div>
              {calculateTotal(editPortfolio) !== 100 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {calculateTotal(editPortfolio) > 100 
                    ? "Total exceeds 100%. Other allocations will be adjusted proportionally."
                    : "Total is less than 100%. Consider adjusting allocations."}
                </p>
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t border-primary/10">
            <Button 
              onClick={handleSavePortfolio} 
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            >
              Save Portfolio Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}