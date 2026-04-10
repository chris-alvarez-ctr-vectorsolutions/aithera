import { useState } from "react";
import { Button } from "./ui/button";
import { Upload, Image, Sparkles } from "lucide-react";
import { GenerateMediaDialog } from "./GenerateMediaDialog";

interface MediaControlsProps {
  onMediaGenerated?: (url: string, type: 'image' | 'video') => void;
}

export function MediaControls({ onMediaGenerated }: MediaControlsProps) {
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const handleMediaGenerated = (url: string, type: 'image' | 'video') => {
    onMediaGenerated?.(url, type);
  };

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          <Button className="flex-1 gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Image className="w-4 h-4" />
            Stock
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={() => setGenerateDialogOpen(true)}
          >
            <Sparkles className="w-4 h-4" />
            Generate (AI)
          </Button>
        </div>
        <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          Select a media source to add content to your scene
        </div>
      </div>

      <GenerateMediaDialog 
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onMediaGenerated={handleMediaGenerated}
      />
    </>
  );
}
