import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Upload, Video, FileVideo, CheckCircle2, Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner@2.0.3";

interface VideoSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscriptSync: (transcript: string) => void;
  sceneNumber: number;
}

type SyncStage = 'upload' | 'processing' | 'review';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'complete';
  progress: number;
}

export function VideoSyncDialog({
  open,
  onOpenChange,
  onTranscriptSync,
  sceneNumber,
}: VideoSyncDialogProps) {
  const [syncStage, setSyncStage] = useState<SyncStage>('upload');
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [transcribedText, setTranscribedText] = useState("");
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: "Extracting audio from video", status: 'pending', progress: 0 },
    { name: "Analyzing speech patterns", status: 'pending', progress: 0 },
    { name: "Transcribing narration", status: 'pending', progress: 0 },
    { name: "Formatting transcript", status: 'pending', progress: 0 },
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const simulateProcessingStep = (stepIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      setProcessingSteps(prev => prev.map((step, idx) => 
        idx === stepIndex 
          ? { ...step, status: 'processing' }
          : step
      ));

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setProcessingSteps(prev => prev.map((step, idx) => 
            idx === stepIndex 
              ? { ...step, status: 'complete', progress: 100 }
              : step
          ));
          resolve();
        } else {
          setProcessingSteps(prev => prev.map((step, idx) => 
            idx === stepIndex 
              ? { ...step, progress }
              : step
          ));
        }
      }, 300);
    });
  };

  const handleStartProcessing = async () => {
    if (!selectedVideo) return;

    setSyncStage('processing');

    // Simulate processing steps
    for (let i = 0; i < processingSteps.length; i++) {
      await simulateProcessingStep(i);
    }

    // Simulate transcribed text based on scene
    const sampleTranscripts = [
      "Welcome everyone to today's presentation. I'm excited to share with you the latest innovations in AI-powered video creation. Throughout this session, we'll explore how technology is transforming the way we create and consume video content.",
      "Let me walk you through the three key benefits of our platform. First, we have unprecedented speed in content creation. Second, the quality of output rivals professional production studios. And third, the ease of use means anyone can create professional videos without technical expertise.",
      "Collaboration is at the heart of what we do. Your team can work together seamlessly, sharing projects in real-time. You can provide feedback directly on the timeline, and iterate faster than ever before. This collaborative approach ensures that everyone's voice is heard in the creative process.",
      "Thank you all for joining today's session. I encourage you to start creating your own professional videos and experience firsthand how our platform can transform your content strategy. If you have any questions, please don't hesitate to reach out to our support team.",
    ];
    
    const transcript = sampleTranscripts[(sceneNumber - 1) % sampleTranscripts.length];
    setTranscribedText(transcript);
    
    // Move to review stage
    setTimeout(() => {
      setSyncStage('review');
    }, 500);
  };

  const handleApplyTranscript = () => {
    onTranscriptSync(transcribedText);
    toast.success("Transcript synced successfully!", {
      description: `Scene ${sceneNumber} transcript has been updated from video.`,
    });
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setSyncStage('upload');
      setSelectedVideo(null);
      setVideoPreview("");
      setTranscribedText("");
      setProcessingSteps([
        { name: "Extracting audio from video", status: 'pending', progress: 0 },
        { name: "Analyzing speech patterns", status: 'pending', progress: 0 },
        { name: "Transcribing narration", status: 'pending', progress: 0 },
        { name: "Formatting transcript", status: 'pending', progress: 0 },
      ]);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background border sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Sync Transcript from Video</DialogTitle>
          <DialogDescription>
            Upload a video with narration to automatically extract and sync the transcript.
          </DialogDescription>
        </DialogHeader>

        {syncStage === 'upload' && (
          <div className="space-y-4">
            {!selectedVideo ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                    <p className="text-muted-foreground">MP4, MOV, AVI up to 500MB</p>
                  </div>
                  <Button variant="outline" type="button">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Video File
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileVideo className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{selectedVideo.name}</p>
                      <p className="text-muted-foreground">
                        {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVideo(null);
                        setVideoPreview("");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {videoPreview && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-[300px] bg-black"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {syncStage === 'processing' && (
          <div className="py-6 space-y-6">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Processing your video...</p>
            </div>

            <div className="space-y-4">
              {processingSteps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.status === 'complete' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : step.status === 'processing' ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className={`${
                        step.status === 'complete' 
                          ? 'text-foreground' 
                          : step.status === 'processing'
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                    {step.status !== 'pending' && (
                      <span className="text-muted-foreground">
                        {Math.round(step.progress)}%
                      </span>
                    )}
                  </div>
                  {step.status !== 'pending' && (
                    <Progress value={step.progress} className="h-1.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {syncStage === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Transcription complete!</span>
            </div>

            <div>
              <label className="text-foreground font-medium mb-2 block">
                Extracted Transcript
              </label>
              <p className="text-muted-foreground mb-2">
                Review and edit the transcribed text before applying to your scene.
              </p>
              <ScrollArea className="h-[200px] border border-border rounded-lg">
                <Textarea
                  value={transcribedText}
                  onChange={(e) => setTranscribedText(e.target.value)}
                  className="min-h-[200px] resize-none border-0 focus-visible:ring-0"
                  placeholder="Transcribed text will appear here..."
                />
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter>
          {syncStage === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleStartProcessing}
                disabled={!selectedVideo}
                className="gap-2"
              >
                <Video className="w-4 h-4" />
                Process Video
              </Button>
            </>
          )}

          {syncStage === 'processing' && (
            <Button variant="outline" disabled>
              Processing...
            </Button>
          )}

          {syncStage === 'review' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleApplyTranscript}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply to Scene
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
