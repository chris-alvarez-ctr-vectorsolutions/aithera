import { useState } from "react";
import { Button } from "./ui/button";
import { Music, Upload, X, FileAudio, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";

interface AudioUploadButtonProps {
  audioFile: string | null;
  onAudioUpload: (url: string) => void;
  onAudioRemove: () => void;
}

export function AudioUploadButton({
  audioFile,
  onAudioUpload,
  onAudioRemove,
}: AudioUploadButtonProps) {
  const [audioUploadOpen, setAudioUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // Simulate file URL
          const mockUrl = URL.createObjectURL(file);
          onAudioUpload(mockUrl);
          setAudioUploadOpen(false);
          toast.success("Audio uploaded successfully");
          
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        simulateUpload(file);
      } else {
        toast.error("Please select a valid audio file");
      }
    }
  };

  const handleAudioRemove = () => {
    onAudioRemove();
    toast.success("Audio file removed");
  };

  return (
    <>
      {audioFile ? (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 hover:bg-white/50 text-purple-600"
            onClick={() => setAudioUploadOpen(true)}
            title="Replace audio"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleAudioRemove}
            title="Remove audio"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 hover:bg-white/50"
          onClick={() => setAudioUploadOpen(true)}
          title="Upload audio"
        >
          <Music className="w-4 h-4" />
        </Button>
      )}

      {/* Audio Upload Dialog */}
      <Dialog open={audioUploadOpen} onOpenChange={setAudioUploadOpen}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>Upload Audio Narration</DialogTitle>
            <DialogDescription>
              Select an audio file to use as narration for this scene. This will be the voice-over that plays during the scene.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!isUploading ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Choose an audio file
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV, or M4A (max 50MB)
                    </p>
                  </div>
                  <label htmlFor="audio-file-input">
                    <Button asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Select Audio File
                      </span>
                    </Button>
                  </label>
                  <input
                    id="audio-file-input"
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FileAudio className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Uploading audio...</p>
                    <p className="text-xs text-muted-foreground">Please wait</p>
                  </div>
                </div>
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAudioUploadOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
