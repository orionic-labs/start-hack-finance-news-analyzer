import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

const accountsL = [
    {
        id: 1,
        login: 'twitter_analyst',
        mediaSource: 'Twitter',
        link: 'https://twitter.com/api',
        status: 'connected',
        lastSync: '2 hours ago',
    },
    {
        id: 2,
        login: 'reuters_feed',
        mediaSource: 'Reuters',
        link: 'https://reuters.com/feed',
        status: 'connected',
        lastSync: '1 hour ago',
    },
    {
        id: 3,
        login: 'bloomberg_api',
        mediaSource: 'Bloomberg',
        link: 'https://bloomberg.com/api',
        status: 'error',
        lastSync: 'Failed',
    },
];

export default function Accounts() {
    const [accounts, setAccounts] = useState(accountsL); // Start with mock data
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [platform, setPlatform] = useState('');
    const [link, setLink] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    useEffect(() => {
        fetchAccounts();
    }, []);
    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5001/api/accounts/list');

            if (!response.ok) {
                throw new Error('Failed to fetch accounts');
            }

            const data = await response.json();
            setAccounts(data);
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError(err.message);
            // Keep using mock data as fallback
        } finally {
            setIsLoading(false);
        }
    };
    const handleAddAccount = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/accounts/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    platform,
                    link,
                    username,
                    password,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add account');
            }

            // Refresh accounts list
            await fetchAccounts();

            // Reset form
            setPlatform('');
            setLink('');
            setUsername('');
            setPassword('');
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error adding account:', error);
            alert('Failed to add account. Please try again.');
        }
    };
    const handleDeleteAccount = async (accountId) => {
        if (!confirm('Are you sure you want to delete this account?')) {
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/accounts/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: accountId }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            // Refresh accounts list
            await fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account. Please try again.');
        }
    };
    const getStatusBadge = (status: string) => {
        return status === 'connected' ? (
            <Badge className="bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20">Connected</Badge>
        ) : (
            <Badge variant="secondary" className="bg-dashboard-danger/10 text-dashboard-danger">
                Error
            </Badge>
        );
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
                        <Button className="bg-primary text-primary-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add Social Media Account</DialogTitle>
                            <DialogDescription>Add a new social media account to monitor</DialogDescription>
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
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="link">Profile Link</Label>
                                <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://twitter.com/username" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
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
                                <Button onClick={handleAddAccount} disabled={!platform || !link || !username || !password} className="flex-1">
                                    Add Account
                                </Button>
                                <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="flex-1">
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
                                        <a
                                            href={account.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-dashboard-primary truncate"
                                        >
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
