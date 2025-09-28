// src/pages/DashboardPodcasts.tsx
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Download, Edit3, CheckCircle, Volume2, Loader2 } from 'lucide-react';
import { usePodcastStore } from '@/store/podcastStore';
import { AxiosError } from 'axios';

type JobStatus = 'queued' | 'pending' | 'running' | 'done' | 'error' | 'idle';

export default function DashboardPodcasts() {
    const { jobId, status, script, voiceBase64, setJobId, setStatus, setResult } = usePodcastStore();

    const [isEditing, setIsEditing] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevAudioUrlRef = useRef<string | null>(null);

    const isGenerating = status === 'queued' || status === 'pending' || status === 'running';
    const hasResult = status === 'done' && (script || voiceBase64);

    // Start generation using shared axios instance
    const handleGeneratePodcast = async () => {
        setError(null);
        setStatus('pending');
        try {
            const res = await api.post('/podcasts/start');
            const id = res.data?.jobId;
            if (id) {
                setJobId(id);
                setStatus('queued');
            } else {
                setStatus('error');
                setError('Unexpected response when starting the podcast job.');
                console.error('Unexpected /podcasts/start response:', res.data);
            }
        } catch (e: unknown) {
            if (e instanceof AxiosError) {
                console.error('Error starting podcast:', e);
                setStatus('error');
                setError(e.response?.data?.message || e.message || 'Failed to start podcast generation. Please try again.');
            } else {
                console.error('Unexpected error:', e);
                setStatus('error');
                setError('Unexpected error while starting podcast.');
            }
        }
    };

    // Build/rebuild audio URL whenever base64 changes
    useEffect(() => {
        if (prevAudioUrlRef.current) {
            URL.revokeObjectURL(prevAudioUrlRef.current);
            prevAudioUrlRef.current = null;
        }

        if (!voiceBase64) {
            setAudioUrl(null);
            return;
        }

        try {
            const binaryString = atob(voiceBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            prevAudioUrlRef.current = url;
            setAudioUrl(url);
        } catch (e) {
            console.error('Failed to build audio URL from base64:', e);
            setAudioUrl(null);
        }

        return () => {
            if (prevAudioUrlRef.current) {
                URL.revokeObjectURL(prevAudioUrlRef.current);
                prevAudioUrlRef.current = null;
            }
        };
    }, [voiceBase64]);

    // Poll backend for status whenever a jobId exists
    useEffect(() => {
        const startPolling = () => {
            if (!jobId) return;

            const pollOnce = async () => {
                try {
                    const res = await api.get(`/podcasts/status/${jobId}`);
                    const data = res.data ?? {};
                    const s: JobStatus = (data?.status as JobStatus) || 'pending';

                    if (s === 'queued' || s === 'pending' || s === 'running') {
                        setStatus(s);
                        return;
                    }

                    if (s === 'done') {
                        const answer = data?.result?.answer ?? '';
                        const voice = data?.result?.voice ?? null;
                        setResult(answer, voice);
                        setStatus('done');
                        return;
                    }

                    if (s === 'error') {
                        setStatus('error');
                        setError(data?.message || 'Podcast job failed.');
                    }
                } catch (e: unknown) {
                    if (e instanceof AxiosError) {
                        if (e.response?.status === 404) {
                            setStatus('error');
                            setError('Podcast job not found (404).');
                        } else {
                            console.warn('Polling transient error:', e.message);
                            setStatus('pending');
                        }
                    } else {
                        console.error('Unexpected error during polling:', e);
                        setStatus('error');
                        setError('Unexpected error while polling podcast status.');
                    }
                }
            };

            // Fire immediately, then every 3s
            pollOnce();
            pollingRef.current = setInterval(pollOnce, 3000);
        };

        if (jobId) startPolling();

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [jobId, setResult, setStatus]);

    const handleDownload = () => {
        const content = `Market Pulse Podcast Script
Generated on: ${new Date().toLocaleDateString()}

${script}
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

    // Initial landing view
    if (!hasResult && !isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 max-w-[800px] mx-auto">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">Generate a podcast based on the featured news in the All News section</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Create an AI-powered analysis and discussion of the most important market news
                    </p>
                </div>

                {error ? <div className="text-red-600 text-sm">{error}</div> : null}

                <Button
                    size="lg"
                    onClick={handleGeneratePodcast}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-6 text-lg font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
                >
                    {isGenerating ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <RefreshCw className="w-6 h-6 mr-3" />}
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
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {isGenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
            </div>

            {error ? <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div> : null}

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
                    {isGenerating && !script ? (
                        <div className="text-sm text-muted-foreground py-6">Generating script…</div>
                    ) : isEditing ? (
                        <Textarea
                            value={script}
                            onChange={() => {
                                /* local editing only – wire to store if you want persistence of edits */
                            }}
                            className="min-h-[400px]"
                            placeholder="Podcast script content..."
                        />
                    ) : (
                        <div className="bg-muted/30 rounded-xl p-6 border border-primary/10">
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-medium">{script}</pre>
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
                    {isGenerating && !audioUrl ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Generating audio…</p>
                        </div>
                    ) : audioUrl ? (
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
