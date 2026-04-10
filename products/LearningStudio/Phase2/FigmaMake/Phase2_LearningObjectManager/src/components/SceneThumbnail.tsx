import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { Clock } from "lucide-react";

interface SceneThumbnailProps {
  sceneNumber: number;
  title: string;
  previewImage: string;
  templateColor: string;
  isActive: boolean;
  onClick: () => void;
  duration: number; // Duration in seconds
}

export function SceneThumbnail({
  sceneNumber,
  title,
  previewImage,
  templateColor,
  isActive,
  onClick,
  duration,
}: SceneThumbnailProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  return (
    <div
      onClick={onClick}
      className="w-full cursor-pointer transition-all"
    >
      <div 
        className={`glass-card rounded-xl overflow-hidden transition-all relative ${
          isActive 
            ? "ring-2 ring-neutral-400 border-neutral-400" 
            : ""
        }`}
        style={{
          boxShadow: isActive
            ? '0 0 0 1px rgba(115, 115, 115, 0.3), 0 8px 16px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), 0 3px 12px rgba(0, 0, 0, 0.08), inset 0 0 20px rgba(255, 255, 255, 0.4)'
        }}
      >
        <div className="relative aspect-video">
          <ImageWithFallback
            src={previewImage}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: templateColor,
              opacity: 0.2,
            }}
          />
          {/* Darkened overlay for non-active scenes */}
          {!isActive && (
            <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" />
          )}
        </div>
        
        {/* Scene Number Badge */}
        <div className="absolute top-2 left-2">
          <span 
            className={`px-2.5 py-1 rounded-lg backdrop-blur-md transition-all shadow-lg ${
              isActive 
                ? "bg-black text-white" 
                : "bg-white text-black"
            }`}
          >
            {sceneNumber}
          </span>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2">
          <Badge 
            variant="secondary" 
            className={`gap-1 backdrop-blur-md shadow-lg ${
              isActive
                ? "bg-white/80 text-foreground border-white/40"
                : "bg-white/80 text-foreground border-white/30"
            }`}
          >
            <Clock className="w-3 h-3" />
            {formatDuration(duration)}
          </Badge>
        </div>
      </div>
    </div>
  );
}
