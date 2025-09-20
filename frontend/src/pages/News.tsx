import { useState } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
	MessageSquare,
	Search,
	Filter,
	Star,
	Send,
	TrendingUp,
	Edit,
} from 'lucide-react';
import { HalfCircleGauge } from '@/components/ui/half-circle-gauge';
import {
	TooltipProvider,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';

const availableMarkets = [
	'USD',
	'EUR',
	'GBP',
	'JPY',
	'CHF',
	'CAD',
	'AUD',
	'CNY',
	'Bonds',
	'Equities',
	'Forex',
	'Commodities',
	'Energy',
	'Oil',
	'Gas',
	'Gold',
	'Silver',
	'NASDAQ',
	'S&P 500',
	'DOW',
	'FTSE',
	'DAX',
	'Nikkei',
	'Technology',
	'Banking',
	'Healthcare',
	'Manufacturing',
	'AI',
	'Crypto',
	'Real Estate',
];

const availableClients = [
	'JP Morgan',
	'Goldman Sachs',
	'Bank of America',
	'Morgan Stanley',
	'Wells Fargo',
	'Deutsche Bank',
	'BNP Paribas',
	'Credit Suisse',
	'UBS',
	'Barclays',
	'Shell',
	'ExxonMobil',
	'Chevron',
	'BP',
	'Total',
	'Microsoft',
	'Apple',
	'Google',
	'Amazon',
	'Meta',
	'HSBC',
	'Standard Chartered',
	'Citigroup',
	'BlackRock',
	'Vanguard',
];

const newsItems = [
	{
		id: 1,
		title: 'Federal Reserve Announces Interest Rate Decision',
		summary:
			'The Federal Reserve has decided to maintain current interest rates at 5.25-5.50% amid ongoing economic uncertainty and persistent inflation concerns. The decision comes after careful consideration of recent economic data showing mixed signals in employment and consumer spending patterns.',
		photo:
			'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
		markets: ['USD', 'Bonds', 'Equities', 'Forex'],
		clients: ['JP Morgan', 'Goldman Sachs', 'Bank of America'],
		importance: 'high',
		isImportant: true,
		publishedAt: '2024-01-15T14:30:00Z',
		source: 'Reuters',
		communitySentiment: 72,
		trustIndex: 89,
	},
	{
		id: 2,
		title: 'Oil Prices Surge Following OPEC Meeting',
		summary:
			'Crude oil prices jumped 3.2% after OPEC+ announced unexpected production cuts of 1.2 million barrels per day. The decision has sent shockwaves through energy markets and is expected to impact global inflation rates.',
		photo:
			'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
		markets: ['Energy', 'Commodities', 'Oil', 'Gas'],
		clients: ['Shell', 'ExxonMobil', 'Chevron'],
		importance: 'high',
		isImportant: true,
		publishedAt: '2024-01-15T13:15:00Z',
		source: 'Bloomberg',
		communitySentiment: 45,
		trustIndex: 92,
	},
	{
		id: 3,
		title: 'Tech Earnings Beat Expectations',
		summary:
			'Major technology companies have reported stronger than expected quarterly results, with AI-related revenues showing remarkable growth. The sector continues to outperform market expectations.',
		photo:
			'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=200&fit=crop',
		markets: ['NASDAQ', 'Technology', 'AI'],
		clients: ['Microsoft', 'Apple', 'Google'],
		importance: 'medium',
		isImportant: false,
		publishedAt: '2024-01-15T12:00:00Z',
		source: 'Financial Times',
		communitySentiment: 85,
		trustIndex: 78,
	},
	{
		id: 4,
		title: 'European Central Bank Policy Update',
		summary:
			'The ECB maintains its monetary policy stance while signaling potential changes in the coming quarters based on inflation trajectory and economic recovery metrics.',
		photo:
			'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=200&fit=crop',
		markets: ['EUR', 'European Bonds', 'Banking'],
		clients: ['Deutsche Bank', 'BNP Paribas'],
		importance: 'medium',
		isImportant: false,
		publishedAt: '2024-01-15T11:30:00Z',
		source: 'ECB Press',
		communitySentiment: 58,
		trustIndex: 94,
	},
	{
		id: 5,
		title: 'Chinese Manufacturing Data Shows Growth',
		summary:
			'Latest manufacturing PMI data from China indicates continued expansion in the sector, suggesting economic resilience despite global headwinds.',
		photo:
			'https://images.unsplash.com/photo-1565843708714-8511db8ef322?w=400&h=200&fit=crop',
		markets: ['CNY', 'Commodities', 'Manufacturing'],
		clients: ['HSBC', 'Standard Chartered'],
		importance: 'low',
		isImportant: false,
		publishedAt: '2024-01-15T10:45:00Z',
		source: 'China Daily',
		communitySentiment: 67,
		trustIndex: 81,
	},
];

interface NewsItemProps {
	news: (typeof newsItems)[number];
	onToggleImportant: (id: number) => void;
	onUpdateNews: (
		id: number,
		updatedFields: Partial<(typeof newsItems)[number]>
	) => void;
}

function NewsItem({ news, onToggleImportant, onUpdateNews }: NewsItemProps) {
	const [editMarketsOpen, setEditMarketsOpen] = useState(false);
	const [editClientsOpen, setEditClientsOpen] = useState(false);
	const [selectedMarkets, setSelectedMarkets] = useState<string[]>(
		news.markets
	);
	const [selectedClients, setSelectedClients] = useState<string[]>(
		news.clients
	);

	const handleSaveMarkets = () => {
		onUpdateNews(news.id, { markets: selectedMarkets });
		setEditMarketsOpen(false);
	};

	const handleSaveClients = () => {
		onUpdateNews(news.id, { clients: selectedClients });
		setEditClientsOpen(false);
	};

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInMinutes = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60)
		);

		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return date.toLocaleDateString();
	};

	return (
		<Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
			<div className="relative">
				<img
					src={news.photo || '/placeholder.svg'}
					alt={news.title}
					width={300}
					height={200}
					className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
				<div className="absolute top-3 right-3 flex items-center gap-2">
					<TooltipProvider>
						<Tooltip delayDuration={100}>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onToggleImportant(news.id)}
									className={`
                    relative h-9 w-9 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg border
                    ${
											news.isImportant
												? 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-amber-900 shadow-amber-400/30 border-amber-300'
												: 'bg-white/95 hover:bg-white text-gray-600 hover:text-amber-600 shadow-black/10 border-white/50 hover:border-amber-200'
										}
                    hover:scale-110 hover:shadow-xl active:scale-95
                    group/button
                  `}
								>
									{news.isImportant ? (
										<div className="relative">
											<Star className="h-4 w-4 fill-current transition-transform group-hover/button:rotate-12" />
											<div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-full animate-pulse shadow-sm" />
										</div>
									) : (
										<Star className="h-4 w-4 transition-transform group-hover/button:rotate-12 group-hover/button:scale-110" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent
								side="left"
								className="bg-gray-900 text-white border-gray-700"
							>
								<p className="text-xs font-medium">
									{news.isImportant
										? 'Remove from important'
										: 'Mark as important'}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					{news.isImportant && (
						<div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-red-400 to-red-500 rounded-full shadow-lg animate-pulse border border-white/80" />
					)}
				</div>
			</div>

			<CardHeader className="pb-3">
				<CardTitle className="text-lg leading-tight text-gray-900 group-hover:text-primary transition-colors">
					{news.title}
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-5">
				<p className="text-sm text-gray-600 leading-relaxed">{news.summary}</p>

				<div className="space-y-4">
					<div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
						<div className="flex items-center justify-between mb-2">
							<h4 className="text-sm font-semibold text-blue-900">
								Markets Influenced
							</h4>
							<Dialog
								open={editMarketsOpen}
								onOpenChange={setEditMarketsOpen}
							>
								<DialogTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
									>
										<Edit className="h-3 w-3" />
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Edit Influenced Markets</DialogTitle>
									</DialogHeader>
									<div className="space-y-4 max-h-80 overflow-y-auto">
										{availableMarkets.map((market) => (
											<div
												key={market}
												className="flex items-center space-x-2"
											>
												<Checkbox
													id={`market-${market}`}
													checked={selectedMarkets.includes(market)}
													onCheckedChange={(checked) => {
														if (checked) {
															setSelectedMarkets([...selectedMarkets, market]);
														} else {
															setSelectedMarkets(
																selectedMarkets.filter((m) => m !== market)
															);
														}
													}}
												/>
												<label
													htmlFor={`market-${market}`}
													className="text-sm"
												>
													{market}
												</label>
											</div>
										))}
									</div>
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => setEditMarketsOpen(false)}
										>
											Cancel
										</Button>
										<Button onClick={handleSaveMarkets}>Save Changes</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
						<div className="flex flex-wrap gap-1">
							{news.markets.map((market) => (
								<Badge
									key={market}
									variant="secondary"
									className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
								>
									{market}
								</Badge>
							))}
						</div>
					</div>

					<div className="bg-green-50/50 rounded-lg p-3 border border-green-100">
						<div className="flex items-center justify-between mb-2">
							<h4 className="text-sm font-semibold text-green-900">
								Clients Influenced
							</h4>
							<Dialog
								open={editClientsOpen}
								onOpenChange={setEditClientsOpen}
							>
								<DialogTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
									>
										<Edit className="h-3 w-3" />
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Edit Influenced Clients</DialogTitle>
									</DialogHeader>
									<div className="space-y-4 max-h-80 overflow-y-auto">
										{availableClients.map((client) => (
											<div
												key={client}
												className="flex items-center space-x-2"
											>
												<Checkbox
													id={`client-${client}`}
													checked={selectedClients.includes(client)}
													onCheckedChange={(checked) => {
														if (checked) {
															setSelectedClients([...selectedClients, client]);
														} else {
															setSelectedClients(
																selectedClients.filter((c) => c !== client)
															);
														}
													}}
												/>
												<label
													htmlFor={`client-${client}`}
													className="text-sm"
												>
													{client}
												</label>
											</div>
										))}
									</div>
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => setEditClientsOpen(false)}
										>
											Cancel
										</Button>
										<Button onClick={handleSaveClients}>Save Changes</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
						<div className="flex flex-wrap gap-1">
							{news.clients.map((client) => (
								<Badge
									key={client}
									variant="outline"
									className="text-xs border-green-200 text-green-800 hover:bg-green-50"
								>
									{client}
								</Badge>
							))}
						</div>
					</div>
				</div>

				<div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
					<h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
						<TrendingUp className="h-4 w-4" />
						Key Performance Indicators
					</h4>
					<div className="flex justify-around">
						<HalfCircleGauge
							value={news.communitySentiment}
							max={100}
							label="Community Sentiment"
							color="#8b5cf6"
							size={100}
						/>
						<HalfCircleGauge
							value={news.trustIndex}
							max={100}
							label="Trust Index"
							color="#06b6d4"
							size={100}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
					<span className="font-medium">{news.source}</span>
					<span>{formatTime(news.publishedAt)}</span>
				</div>
			</CardContent>
		</Card>
	);
}

export default function News() {
	const [searchQuery, setSearchQuery] = useState('');
	const [filterImportance, setFilterImportance] = useState('all');
	const [newsData, setNewsData] = useState(newsItems);
	const [chatMessage, setChatMessage] = useState('');

	const handleToggleImportant = (id: number) => {
		setNewsData((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, isImportant: !item.isImportant } : item
			)
		);
	};

	const handleUpdateNews = (
		id: number,
		updates: Partial<(typeof newsItems)[0]>
	) => {
		setNewsData((prev) =>
			prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
		);
	};

	const filteredNews = newsData.filter((news) => {
		const matchesSearch =
			news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			news.summary.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFilter =
			filterImportance === 'all' ||
			(filterImportance === 'important' && news.isImportant);
		return matchesSearch && matchesFilter;
	});

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    console.log('User question:', chatMessage);

    // Placeholder for chat submission logic
    setChatMessage('');
  }

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* News List */}
			<div className="lg:col-span-2 space-y-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold text-foreground">All News</h1>
						<p className="text-muted-foreground">
							Monitor and analyze market news from global sources
						</p>
					</div>

					<div className="flex gap-3">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
							<Input
								placeholder="Search news..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10 w-64"
							/>
						</div>

						<Select
							value={filterImportance}
							onValueChange={setFilterImportance}
						>
							<SelectTrigger className="w-40">
								<Filter className="w-4 h-4 mr-2" />
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All News</SelectItem>
								<SelectItem value="important">Important</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-6 grid md:grid-cols-2 md:gap-6 md:space-y-0">
					{filteredNews.map((news) => (
						<NewsItem
							key={news.id}
							news={news}
							onToggleImportant={handleToggleImportant}
							onUpdateNews={handleUpdateNews}
						/>
					))}
				</div>
			</div>

			{/* Always Visible Chat */}
			<div className="lg:col-span-1">
				<Card className="sticky top-6 border-dashboard-primary/10">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MessageSquare className="w-5 h-5 text-dashboard-primary" />
							AI News Assistant
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							Ask questions about any news item
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="h-96 bg-muted/30 rounded-lg p-4 overflow-y-auto">
							<div className="space-y-3">
								<div className="bg-background rounded-lg p-3 border border-dashboard-primary/10">
									<p className="text-sm text-muted-foreground">
										Welcome! Ask me anything about the news items on this page.
									</p>
								</div>
							</div>
						</div>

						<form className="flex gap-2" onSubmit={handleChatSubmit}>
							<Textarea
								placeholder="Ask about any news item..."
								value={chatMessage}
								onChange={(e) => setChatMessage(e.target.value)}
								className="flex-1 min-h-[40px] max-h-[120px] resize-none"
								rows={1}
							/>
							<Button
								size="sm"
                disabled={!chatMessage.trim()}
                type="submit"
								className="bg-dashboard-primary hover:bg-dashboard-primary/90"
							>
								<Send className="w-4 h-4" />
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
