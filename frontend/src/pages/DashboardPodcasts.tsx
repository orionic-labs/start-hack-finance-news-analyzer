import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Download, Play, Pause, Volume2, Edit3 } from "lucide-react";

const samplePodcastScript = `Welcome to Market Pulse, your daily briefing on global financial developments.

I'm your AI host, and today we're diving into some significant market movements that are shaping the financial landscape.

**Federal Reserve Interest Rate Decision**

Starting with monetary policy - the Federal Reserve has maintained interest rates at 5.25-5.50%. This decision comes amid ongoing economic uncertainty and persistent inflation concerns. The Fed's cautious stance reflects mixed signals in employment and consumer spending data. 

For investors, this means continued pressure on borrowing costs, but also stability in the monetary policy environment. Bond portfolios should maintain defensive positioning while monitoring employment data for future policy signals.

**OPEC Production Cuts Drive Oil Surge**

Moving to energy markets - crude oil prices have surged 3.2% following OPEC+'s announcement of unexpected production cuts totaling 1.2 million barrels per day. This surprise move signals OPEC+'s commitment to supporting oil prices amid concerns about global demand growth.

Energy sector equities are likely to see upward pressure, while this development could contribute to broader inflationary pressures. Companies in transportation and manufacturing should reassess their forward hedging strategies.

**Technology Sector Earnings**

In corporate news, major technology companies continue to outperform expectations, particularly in AI-related revenues. This sector remains a bright spot in an otherwise mixed earnings season.

**Market Outlook**

Looking ahead, key factors to watch include employment data releases, corporate earnings from the banking sector, and any developments in US-China trade relations.

That's your Market Pulse briefing for today. Stay informed, stay strategic.`;

export default function DashboardPodcasts() {
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [podcastScript, setPodcastScript] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const handleGeneratePodcast = async () => {
    setIsGenerating(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPodcastScript(samplePodcastScript);
    setIsGenerated(true);
    setIsGenerating(false);
  };

  const handleDownloadPDF = () => {
    // Create PDF content
    const content = `
Market Pulse Podcast Script
Generated on: ${new Date().toLocaleDateString()}

${podcastScript}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `podcast-script-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    // For now, we'll simulate audio generation
    // In a real implementation, this would call ElevenLabs API
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Sample audio URL for demonstration
    setAudioUrl("https://www.soundjay.com/misc/sounds/bell-ringing-05.wav");
    setIsGeneratingAudio(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control audio playback
  };

  if (!isGenerated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 max-w-[800px] mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Generate a podcast based on the featured news in the All News
            section
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create an AI-powered analysis and discussion of the most important
            market news
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleGeneratePodcast}
          disabled={isGenerating}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-6 text-lg font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
        >
          <RefreshCw
            className={`w-6 h-6 mr-3 ${isGenerating ? "animate-spin" : ""}`}
          />
          {isGenerating ? "Generating Podcast..." : "Generate Podcast"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Market Pulse Podcast
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            AI-generated financial news analysis
          </p>
        </div>
        <Button
          onClick={handleGeneratePodcast}
          disabled={isGenerating}
          variant="outline"
          className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`}
          />
          Regenerate
        </Button>
      </div>

      {/* Podcast Script Section */}
      <Card className="group relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 border border-primary/10 hover:border-primary/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-foreground">
              Podcast Script
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="ghost"
                size="sm"
                className="hover:bg-primary/10 hover:text-primary"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? "Preview" : "Edit"}
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={podcastScript}
              onChange={(e) => setPodcastScript(e.target.value)}
              className="min-h-[400px] bg-muted/30 border border-primary/10 focus:border-primary/30 rounded-xl p-4 text-sm leading-relaxed transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
              placeholder="Podcast script content..."
            />
          ) : (
            <div className="bg-muted/30 rounded-xl p-6 border border-primary/10">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-medium">
                {podcastScript}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Generation Section */}
      <Card className="group relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 border border-primary/10 hover:border-primary/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-primary" />
            Generated Audio Podcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!audioUrl ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Generate an AI voice version of your podcast script
              </p>
              <Button
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
              >
                <Volume2
                  className={`w-5 h-5 mr-2 ${
                    isGeneratingAudio ? "animate-pulse" : ""
                  }`}
                />
                {isGeneratingAudio
                  ? "Generating Audio..."
                  : "Generate Audio Podcast"}
              </Button>
              {isGeneratingAudio && (
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a few minutes...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-6 border border-primary/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Market Pulse - Today's Edition
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Generated on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    AI Generated
                  </Badge>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={handlePlayPause}
                    variant="outline"
                    size="lg"
                    className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 px-6"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 mr-2" />
                    ) : (
                      <Play className="w-5 h-5 mr-2" />
                    )}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>

                  <div className="flex-1 bg-muted/50 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full w-1/3 transition-all duration-300" />
                  </div>

                  <span className="text-sm text-muted-foreground">
                    2:45 / 8:32
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio}
                variant="outline"
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Audio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
