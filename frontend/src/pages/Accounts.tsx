import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Plus, Edit3, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";

const accounts = [
  {
    id: 1,
    login: "twitter_analyst",
    mediaSource: "Twitter",
    link: "https://twitter.com/api",
    status: "connected",
    lastSync: "2 hours ago"
  },
  {
    id: 2,
    login: "reuters_feed",
    mediaSource: "Reuters",
    link: "https://reuters.com/feed",
    status: "connected",
    lastSync: "1 hour ago"
  },
  {
    id: 3,
    login: "bloomberg_api",
    mediaSource: "Bloomberg",
    link: "https://bloomberg.com/api",
    status: "error",
    lastSync: "Failed"
  }
];

export default function Accounts() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [link, setLink] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    return status === "connected" ? (
      <Badge className="bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20">
        Connected
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-dashboard-danger/10 text-dashboard-danger">
        Error
      </Badge>
    );
  };

  const handleAddAccount = () => {
    // Handle form submission here
    console.log({ login, password, link });
    setLogin("");
    setPassword("");
    setLink("");
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Media & News Accounts</h1>
          <p className="text-muted-foreground">Manage connected accounts for automated news parsing</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-dashboard-primary hover:bg-dashboard-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Social Media & News Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="login">Login / Username</Label>
                <Input
                  id="login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Enter login username or email"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="link">Media Source Link</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com/api or profile URL"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  API endpoint, RSS feed, or profile URL for news extraction
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddAccount} 
                  disabled={!login || !password || !link}
                  className="flex-1"
                >
                  Add Account
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="border-dashboard-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{account.login}</h3>
                      {getStatusBadge(account.status)}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{account.mediaSource}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="w-3 h-3" />
                      <a href={account.link} target="_blank" rel="noopener noreferrer" className="hover:text-dashboard-primary truncate">
                        {account.link}
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">Last sync: {account.lastSync}</p>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" title="Edit Account">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-dashboard-danger hover:bg-dashboard-danger/10" title="Delete Account">
                        <Trash2 className="w-4 h-4" />
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