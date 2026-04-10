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
import { Upload, Video, FileVideo, FileImage, ImageIcon, CheckCircle2, Loader2, Eye, Volume2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoUpload: (mediaUrl: string, transcript?: string) => void;
  sceneNumber: number;
}

type UploadStage = 'upload' | 'validating' | 'options' | 'processing' | 'review';
type FileType = 'image' | 'video' | null;
type MediaUsage = 'both' | 'visual-only';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'complete';
  progress: number;
}

export function VideoUploadDialog({
  open,
  onOpenChange,
  onVideoUpload,
  sceneNumber,
}: VideoUploadDialogProps) {
  const [uploadStage, setUploadStage] = useState<UploadStage>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [transcribedText, setTranscribedText] = useState("");
  const [mediaUsage, setMediaUsage] = useState<MediaUsage>('visual-only');
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: "Processing upload", status: 'pending', progress: 0 },
    { name: "Extracting audio from video", status: 'pending', progress: 0 },
    { name: "Analyzing speech patterns", status: 'pending', progress: 0 },
    { name: "Transcribing narration", status: 'pending', progress: 0 },
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (file.type.startsWith('video/')) {
      setSelectedFile(file);
      setFileType('video');
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
      
      // Start validation
      setUploadStage('validating');
      await simulateValidation();
      
      // Move to options stage for video
      setUploadStage('options');
      setMediaUsage('visual-only');
    } else if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      setFileType('image');
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
      
      // Start validation
      setUploadStage('validating');
      await simulateValidation();
      
      // Move to options stage for image (visual only)
      setUploadStage('options');
      setMediaUsage('visual-only');
    } else {
      toast.error('Unsupported file type. Please upload an image or video file.');
    }
  };

  const simulateValidation = (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
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

  const handleAddToScene = async () => {
    if (!selectedFile) return;

    setUploadStage('processing');

    // Determine which steps to process based on media usage
    let stepsToProcess = [0]; // Always process upload
    
    if (fileType === 'video' && mediaUsage === 'both') {
      stepsToProcess = [0, 1, 2, 3]; // All steps for video with audio extraction
    }

    // Update steps visibility
    if (fileType === 'image' || mediaUsage === 'visual-only') {
      setProcessingSteps(prev => prev.map((step, idx) => 
        idx > 0 ? { ...step, status: 'pending', progress: 0 } : step
      ));
    }

    // Simulate processing steps
    for (let i of stepsToProcess) {
      await simulateProcessingStep(i);
    }

    // If audio extraction is enabled for video, generate sample transcript
    if (fileType === 'video' && mediaUsage === 'both') {
      const sampleTranscripts = [
        "Welcome everyone to today's presentation. I'm excited to share with you the latest innovations in AI-powered video creation. Throughout this session, we'll explore how technology is transforming the way we create and consume video content.",
        "Let me walk you through the three key benefits of our platform. First, we have unprecedented speed in content creation. Second, the quality of output rivals professional production studios. And third, the ease of use means anyone can create professional videos without technical expertise.",
        "Collaboration is at the heart of what we do. Your team can work together seamlessly, sharing projects in real-time. You can provide feedback directly on the timeline, and iterate faster than ever before. This collaborative approach ensures that everyone's voice is heard in the creative process.",
        "Thank you all for joining today's session. I encourage you to start creating your own professional videos and experience firsthand how our platform can transform your content strategy. If you have any questions, please don't hesitate to reach out to our support team.",
      ];
      
      const transcript = sampleTranscripts[(sceneNumber - 1) % sampleTranscripts.length];
      setTranscribedText(transcript);
    }
    
    // Move to review stage if audio extraction is enabled, otherwise finish
    setTimeout(() => {
      if (fileType === 'video' && mediaUsage === 'both') {
        setUploadStage('review');
      } else {
        handleCompleteUpload("");
      }
    }, 500);
  };

  const handleCompleteUpload = (transcript: string) => {
    // In a real implementation, this would upload the media and return a URL
    // For now, we'll use the preview URL
    onVideoUpload(mediaPreview, transcript || undefined);
    
    const mediaType = fileType === 'video' ? 'Video' : 'Image';
    toast.success(`${mediaType} uploaded successfully!`, {
      description: transcript 
        ? `Scene ${sceneNumber} ${mediaType.toLowerCase()} and transcript have been updated.`
        : `Scene ${sceneNumber} ${mediaType.toLowerCase()} has been updated.`,
    });
    
    handleClose();
  };

  const handleApplyVideo = () => {
    handleCompleteUpload(transcribedText);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setUploadStage('upload');
      setSelectedFile(null);
      setFileType(null);
      setMediaPreview("");
      setTranscribedText("");
      setMediaUsage('visual-only');
      setProcessingSteps([
        { name: "Processing upload", status: 'pending', progress: 0 },
        { name: "Extracting audio from video", status: 'pending', progress: 0 },
        { name: "Analyzing speech patterns", status: 'pending', progress: 0 },
        { name: "Transcribing narration", status: 'pending', progress: 0 },
      ]);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background border sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Media to Scene</DialogTitle>
          <DialogDescription>
            Upload an image or video to replace the current media. For videos with narration, you can optionally extract the transcript.
          </DialogDescription>
        </DialogHeader>

        {uploadStage === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-muted-foreground">Images (JPG, PNG) or Videos (MP4, MOV) up to 500MB</p>
                </div>
                <Button variant="outline" type="button">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {uploadStage === 'validating' && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-foreground font-medium">Validating file...</p>
              <p className="text-muted-foreground">Please wait</p>
            </div>
          </div>
        )}

        {uploadStage === 'options' && selectedFile && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {fileType === 'video' ? (
                    <FileVideo className="w-6 h-6 text-primary" />
                  ) : (
                    <FileImage className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {fileType === 'video' ? 'Video' : 'Image'}
                  </p>
                </div>
              </div>
            </div>

            {mediaPreview && (
              <div className="rounded-lg overflow-hidden border border-border">
                {fileType === 'video' ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-[300px] bg-black"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-[300px] object-contain bg-muted"
                  />
                )}
              </div>
            )}

            <div className="space-y-3">
              <Label className="font-medium text-foreground">How should this media be used?</Label>
              <RadioGroup value={mediaUsage} onValueChange={(value) => setMediaUsage(value as MediaUsage)}>
                {fileType === 'video' && (
                  <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="both" id="both" className="mt-0.5" />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <Label htmlFor="both" className="font-medium text-foreground cursor-pointer flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Audio and Visual
                      </Label>
                      <p className="text-muted-foreground">
                        Extract audio for narration and use video as visual media. Transcript will be automatically generated.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="visual-only" id="visual-only" className="mt-0.5" />
                  <div className="grid gap-1.5 leading-none flex-1">
                    <Label htmlFor="visual-only" className="font-medium text-foreground cursor-pointer flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Visual Only
                    </Label>
                    <p className="text-muted-foreground">
                      Use {fileType === 'video' ? 'video' : 'image'} as visual media only. Audio/narration will not be extracted.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {uploadStage === 'processing' && (
          <div className="py-6 space-y-6">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">
                {fileType === 'video' && mediaUsage === 'both'
                  ? "Processing video and extracting audio..." 
                  : fileType === 'video'
                  ? "Processing video upload..."
                  : "Processing image upload..."}
              </p>
            </div>

            <div className="space-y-4">
              {processingSteps
                .filter((_, idx) => (fileType === 'image' || mediaUsage === 'visual-only') ? idx === 0 : true)
                .map((step, index) => (
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

        {uploadStage === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Video uploaded and transcript extracted!</span>
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
          {uploadStage === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {uploadStage === 'validating' && (
            <Button variant="outline" disabled>
              Validating...
            </Button>
          )}

          {uploadStage === 'options' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAddToScene}
                disabled={!selectedFile}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Add to Scene
              </Button>
            </>
          )}

          {uploadStage === 'processing' && (
            <Button variant="outline" disabled>
              Processing...
            </Button>
          )}

          {uploadStage === 'review' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleApplyVideo}
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
