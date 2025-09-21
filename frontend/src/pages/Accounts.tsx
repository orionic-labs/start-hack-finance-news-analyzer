import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreVertical,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

// Mock data as fallback
const mockAccounts = [
  {
    id: 1,
    username: "twitter_analyst",
    platform: "Twitter",
    link: "https://twitter.com/api",
    status: "active",
    lastSync: "2 hours ago",
  },
  {
    id: 2,
    username: "reuters_feed",
    platform: "Reuters",
    link: "https://reuters.com/feed",
    status: "active",
    lastSync: "1 hour ago",
  },
  {
    id: 3,
    username: "bloomberg_api",
    platform: "Bloomberg",
    link: "https://bloomberg.com/api",
    status: "error",
    lastSync: "Failed",
  },
];

export default function Accounts() {
  // State for the accounts list
  const [accounts, setAccounts] = useState(mockAccounts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for adding accounts
  const [platform, setPlatform] = useState("");
  const [link, setLink] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5001/api/accounts/list");

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      setAccounts(data);
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
      setError(err.message);
      // Keep using mock data as fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/accounts/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          link,
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add account");
      }

      // Refresh accounts list
      await fetchAccounts();

      // Reset form
      setPlatform("");
      setLink("");
      setUsername("");
      setPassword("");
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding account:", error);
      alert("Failed to add account. Please try again.");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5001/api/accounts/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: accountId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      // Refresh accounts list
      await fetchAccounts();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; text: string } } = {
      active: {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Active",
      },
      error: { color: "bg-red-100 text-red-800 border-red-200", text: "Error" },
      inactive: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        text: "Inactive",
      },
    };

    const config = statusConfig[status] || statusConfig["inactive"];

    return (
      <Badge variant="outline" className={config.color}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Social Media Accounts
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your connected social media accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchAccounts}
            disabled={isLoading}
            variant="outline"
            size="default"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground"
                size="default"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Social Media Account</DialogTitle>
                <DialogDescription>
                  Add a new social media account to monitor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Twitter">Twitter</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Reddit">Reddit</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Profile Link</Label>
                  <Input
                    id="link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddAccount}
                    disabled={!platform || !link || !username || !password}
                    className="flex-1"
                  >
                    Add Account
                  </Button>
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">
            Loading accounts...
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-800 mb-6">
          <p>Error: {error}</p>
          <p>Using fallback data instead.</p>
        </div>
      )}

      {/* Accounts Grid */}
      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="border-dashboard-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${account.platform}&background=0f172a&color=fff`}
                      alt={account.platform}
                    />
                    <AvatarFallback>
                      {account.platform?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {account.username}
                      </h3>
                      {getStatusBadge(account.status)}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {account.platform}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="w-3 h-3" />
                      <a
                        href={account.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-dashboard-primary truncate"
                      >
                        {account.link}
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last sync: {account.lastSync}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteAccount(account.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No accounts found. Add your first social media account to get
            started.
          </p>
        </div>
      )}
    </div>
  );
}
