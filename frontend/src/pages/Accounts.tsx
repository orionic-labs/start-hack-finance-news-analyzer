import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Edit3, Trash2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { AxiosError } from "axios";

const accountsL = [
  {
    id: 1,
    username: "twitter_analyst",
    mediaSource: "Twitter",
    link: "https://twitter.com/api",
    status: "connected",
    lastSync: "2 hours ago",
  },
  {
    id: 2,
    username: "reuters_feed",
    mediaSource: "Reuters",
    link: "https://reuters.com/feed",
    status: "connected",
    lastSync: "1 hour ago",
  },
  {
    id: 3,
    username: "bloomberg_api",
    mediaSource: "Bloomberg",
    link: "https://bloomberg.com/api",
    status: "error",
    lastSync: "Failed",
  },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState(accountsL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [platform, setPlatform] = useState("");
  const [link, setLink] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/accounts/list");
      setAccounts(res.data);
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        console.error("Error fetching accounts:", e);
        setError(
          e.response?.data?.message || e.message || "Failed to fetch accounts."
        );
      } else {
        console.error("Unexpected error fetching accounts:", e);
        setError("Unexpected error while fetching accounts.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      await api.post("/accounts/add", {
        platform,
        link,
        username,
        password,
      });

      await fetchAccounts();

      setPlatform("");
      setLink("");
      setUsername("");
      setPassword("");
      setIsDialogOpen(false);
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        console.error("Error adding account:", e);
        alert(
          e.response?.data?.message || e.message || "Failed to add account."
        );
      } else {
        console.error("Unexpected error adding account:", e);
        alert("Unexpected error while adding account.");
      }
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    try {
      await api.post("/accounts/delete", { id: accountId });
      await fetchAccounts();
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        console.error("Error deleting account:", e);
        alert(
          e.response?.data?.message || e.message || "Failed to delete account."
        );
      } else {
        console.error("Unexpected error deleting account:", e);
        alert("Unexpected error while deleting account.");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "connected" ? (
      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20 ml-2">
        Connected
      </div>
    ) : (
      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-dashboard-danger/10 text-dashboard-danger border-dashboard-danger/20 ml-2">
        Error
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Social Media & News Accounts
          </h1>
          <p className="text-muted-foreground">
            Manage connected accounts for automated news parsing
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
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
                  <SelectTrigger className="placeholder:text-muted-foreground">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Reddit">Reddit</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
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
                  className="placeholder:text-muted-foreground placeholder:opacity-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  className="placeholder:text-muted-foreground placeholder:opacity-100"
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
                  className="placeholder:text-muted-foreground placeholder:opacity-100"
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

      {isLoading && <p className="text-muted-foreground">Loading accounts…</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="border-dashboard-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <h3 className="font-semibold text-foreground">
                      {account.username}
                    </h3>
                    {getStatusBadge(account.status)}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {account.mediaSource}
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

                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" title="Edit Account">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
