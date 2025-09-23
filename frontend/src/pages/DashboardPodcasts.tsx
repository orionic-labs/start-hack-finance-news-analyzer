import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Download, Edit3, CheckCircle, Volume2 } from 'lucide-react';
import { usePodcastStore } from '@/store/podcastStore';

export default function DashboardPodcasts() {
    const { jobId, setJobId } = usePodcastStore();

    const [isGenerated, setIsGenerated] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [podcastScript, setPodcastScript] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const handleGeneratePodcast = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('http://localhost:5001/api/podcasts/start', {
                method: 'POST',
            });
            const { jobId } = await res.json();
            setJobId(jobId); // store globally
        } catch (err) {
            console.error('Error starting podcast:', err);
            setIsGenerating(false);
        }
    };

    // Poll backend for status
    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/podcasts/status/${jobId}`);
                const data = await res.json();

                if (data.status === 'done') {
                    setPodcastScript(data.result.answer);

                    const binaryString = atob(data.result.voice);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                    setAudioUrl(URL.createObjectURL(audioBlob));

                    setIsGenerated(true);
                    setIsGenerating(false);
                    clearInterval(interval);
                }

                if (data.status === 'error') {
                    console.error('Podcast generation failed:', data.result);
                    setIsGenerating(false);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('Polling error:', err);
                setIsGenerating(false);
                clearInterval(interval);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [jobId]);

    const handleDownload = () => {
        const content = `
Market Pulse Podcast Script
Generated on: ${new Date().toLocaleDateString()}

${podcastScript}
    `;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `podcast-script-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!isGenerated && !isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 max-w-[800px] mx-auto">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">Generate a podcast based on the featured news in the All News section</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Create an AI-powered analysis and discussion of the most important market news
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={handleGeneratePodcast}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-6 text-lg font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
                >
                    <RefreshCw className={`w-6 h-6 mr-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating Podcast...' : 'Generate Podcast'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Market Pulse Podcast</h1>
                    <p className="text-muted-foreground text-lg mt-2">AI-generated financial news analysis</p>
                </div>
                <Button
                    onClick={handleGeneratePodcast}
                    disabled={isGenerating}
                    variant="outline"
                    className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
            </div>

            {/* Podcast Script Section */}
            <Card className="bg-gradient-to-br from-background via-background to-muted/20 border border-primary/10">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold text-foreground">Podcast Script</CardTitle>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsEditing(!isEditing)} variant="ghost" size="sm">
                                <Edit3 className="w-4 h-4 mr-2" />
                                {isEditing ? 'Preview' : 'Edit'}
                            </Button>
                            <Button
                                onClick={handleDownload}
                                variant="outline"
                                size="sm"
                                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <Textarea
                            value={podcastScript}
                            onChange={(e) => setPodcastScript(e.target.value)}
                            className="min-h-[400px]"
                            placeholder="Podcast script content..."
                        />
                    ) : (
                        <div className="bg-muted/30 rounded-xl p-6 border border-primary/10">
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-medium">{podcastScript}</pre>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Audio Section */}
            <Card className="bg-gradient-to-br from-background via-background to-muted/20 border border-primary/10">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Volume2 className="w-6 h-6 text-primary" />
                        Generated Audio Podcast
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {audioUrl ? (
                        <div className="space-y-4">
                            <audio controls className="w-full" src={audioUrl}>
                                Your browser does not support the audio element.
                            </audio>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Audio generated successfully
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Audio will be generated automatically with the podcast script</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
