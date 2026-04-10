import { Sparkles, Volume2, Loader2, Clock, Upload, Plus, CheckCircle, Circle, MoreHorizontal, Trash2, MoveRight, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { VideoSyncDialog } from "./VideoSyncDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SceneCardProps {
  sceneNumber: number;
  transcript: string;
  isActive: boolean;
  completed: boolean;
  status: "in-progress" | "in-review" | "ready";
  onSelect: () => void;
  onTranscriptChange: (value: string) => void;
  onStatusChange?: (status: "in-progress" | "in-review" | "ready") => void;
  duration: number; // Duration in seconds
  onAddBefore?: () => void;
  onAddAfter?: () => void;
  onToggleComplete: () => void;
  onDelete?: () => void;
  onMoveTo?: (targetIndex: number) => void;
  totalScenes?: number;
}

const VOICES = [
  { id: "alloy", name: "Sarah", description: "Neutral and balanced" },
  { id: "echo", name: "Michael", description: "Warm and friendly" },
  { id: "fable", name: "Emma", description: "Expressive British" },
  { id: "onyx", name: "James", description: "Deep and authoritative" },
  { id: "nova", name: "Emily", description: "Energetic and youthful" },
  { id: "shimmer", name: "Sophia", description: "Soft and gentle" },
];

export function SceneCard({
  sceneNumber,
  transcript,
  isActive,
  completed,
  status,
  onSelect,
  onTranscriptChange,
  onStatusChange,
  duration,
  onAddBefore,
  onAddAfter,
  onToggleComplete,
  onDelete,
  onMoveTo,
  totalScenes = 1,
}: SceneCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  
  const getStatusLabel = (status: "in-progress" | "in-review" | "ready") => {
    switch (status) {
      case "in-progress":
        return "In Progress";
      case "in-review":
        return "In Review";
      case "ready":
        return "Marked as Ready";
    }
  };
  
  const getStatusColor = (status: "in-progress" | "in-review" | "ready") => {
    switch (status) {
      case "in-progress":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "in-review":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "ready":
        return "text-green-700 bg-green-50 border-green-200";
    }
  };
  
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [audioUploadDialogOpen, setAudioUploadDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [audioGenerateDialogOpen, setAudioGenerateDialogOpen] = useState(false);
  const [phoneticText, setPhoneticText] = useState(transcript);
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);

  const handleRegenerateTranscript = () => {
    if (!regeneratePrompt.trim()) return;
    
    setIsRegenerating(true);
    setRegenerateDialogOpen(false);
    
    // Simulate AI regeneration based on prompt
    setTimeout(() => {
      const sampleTexts = [
        "This scene showcases the power of AI-driven content creation. With advanced natural language processing, we can generate engaging narratives effortlessly.",
        "Experience seamless video production with our innovative platform. Transform your ideas into professional content in minutes, not hours.",
        "Discover how cutting-edge technology meets creative storytelling. Our AI assistant helps you craft compelling narratives that resonate with your audience.",
      ];
      onTranscriptChange(sampleTexts[Math.floor(Math.random() * sampleTexts.length)]);
      setIsRegenerating(false);
      setRegeneratePrompt("");
    }, 1500);
  };

  const handleGenerateAudio = () => {
    setIsGeneratingAudio(true);
    // Simulate audio generation
    setTimeout(() => {
      console.log(`Generating audio with voice: ${selectedVoice.name}`);
      setIsGeneratingAudio(false);
    }, 2000);
  };

  const handlePreviewAudio = () => {
    setIsPreviewingAudio(true);
    // Simulate audio preview
    setTimeout(() => {
      setIsPreviewingAudio(false);
    }, 2000);
  };

  // Inactive card - single click target
  if (!isActive) {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onSelect}
        className="glass-elevated rounded-xl p-4 transition-all cursor-pointer hover:bg-white/80 opacity-85 hover:opacity-95 relative"
        style={{
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 0 20px rgba(255, 255, 255, 0.4)'
        }}
      >
        {/* Add Scene Buttons */}
        <TooltipProvider>
          {isHovered && onAddBefore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="absolute -top-3 left-2 z-10 h-7 w-7 rounded-full shadow-lg hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBefore();
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Add scene before</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {isHovered && onAddAfter && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="absolute -bottom-3 left-2 z-10 h-7 w-7 rounded-full shadow-lg hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAfter();
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Add scene after</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
        
        {/* Header with scene number */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="px-2.5 py-1 rounded-lg glass min-h-[44px] min-w-[44px] flex items-center justify-center border-2 border-white/50">
            {sceneNumber}
          </div>
          
          {/* Duration and complete button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-foreground/70">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(duration)}</span>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={completed ? "default" : "ghost"}
                    size="icon"
                    className={`h-8 w-8 ${completed ? 'bg-green-500 hover:bg-green-600 text-white border-green-400' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete();
                    }}
                  >
                    {completed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{completed ? "Mark Incomplete" : "Mark Complete"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Read-only transcript preview */}
        <div className="min-h-[100px] p-3 rounded-lg bg-white/30 border border-white/30">
          <p className="text-foreground/80 line-clamp-4">
            {transcript || "Enter scene transcript..."}
          </p>
        </div>
      </div>
    );
  }

  // Active card - full editing capabilities
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-elevated rounded-xl p-4 transition-all relative ring-2 ring-neutral-300 border-l-4 border-l-neutral-400 opacity-100"
      style={{
        boxShadow: '0 20px 70px rgba(0, 0, 0, 0.15), 0 8px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(163, 163, 163, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
      }}
    >
      {/* Add Scene Buttons */}
      <TooltipProvider>
        {isHovered && onAddBefore && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="absolute -top-3 left-2 z-10 h-7 w-7 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddBefore();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Add scene before</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {isHovered && onAddAfter && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="absolute -bottom-3 left-2 z-10 h-7 w-7 rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAfter();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Add scene after</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
      {/* Header with scene number, duration, and action buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="px-2.5 py-1 rounded-lg text-white min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-700">
          {sceneNumber}
        </div>
        
        {/* Action buttons - wrap to next line when space constrained */}
        <TooltipProvider>
          <div className="flex gap-1 mr-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-white/50 border-white/40 hover:bg-white/70 shadow-sm"
                  disabled={isGeneratingAudio}
                  onClick={() => {
                    setPhoneticText(transcript);
                    setAudioGenerateDialogOpen(true);
                  }}
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate Audio</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-white/50 border-white/40 hover:bg-white/70 shadow-sm"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More Options</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-border">
                <DropdownMenuItem
                  onClick={() => setRegenerateDialogOpen(true)}
                  disabled={isRegenerating}
                  className="cursor-pointer"
                >
                  {isRegenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  <span>AI Regenerate Transcript</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsPreviewingAudio(true)}
                  className="cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  <span>Preview Audio</span>
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete Scene</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>
        
      {/* Regenerate Dialog - outside the dropdown */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent className="bg-background border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Regenerate Transcript</DialogTitle>
            <DialogDescription>
              Describe how you'd like to modify the transcript text.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Make it more professional and concise..."
              value={regeneratePrompt}
              onChange={(e) => setRegeneratePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRegenerateTranscript();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateTranscript}
              disabled={!regeneratePrompt.trim()}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        
        {/* Duration and complete button - stay together */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-foreground/70">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(duration)}</span>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={completed ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 shadow-sm ${
                    completed 
                      ? 'bg-green-500 hover:bg-green-600 text-white border-green-400' 
                      : 'bg-white/50 border-white/40 hover:bg-white/70'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete();
                  }}
                >
                  {completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{completed ? "Mark Incomplete" : "Mark Complete"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <Textarea
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder="Enter scene transcript..."
        className="min-h-[100px] resize-none bg-white/50 border-white/40 focus:bg-white/70 focus:border-white/50 transition-all"
        style={{
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.08)'
        }}
      />

      {/* Footer with Status and Duration */}
      <div className="flex items-center justify-between mt-3 text-xs">
        {/* Status - Bottom Left */}
        <div>
          {onStatusChange ? (
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className={`h-7 px-2 text-xs border ${getStatusColor(status)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="ready">Marked as Ready</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className={`${getStatusColor(status)} border px-2 py-1`}>
              {getStatusLabel(status)}
            </Badge>
          )}
        </div>

        {/* Duration - Bottom Right */}
        <div className="flex items-center gap-1 text-foreground/60">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Audio Upload Dialog */}
      <Dialog open={audioUploadDialogOpen} onOpenChange={setAudioUploadDialogOpen}>
        <DialogContent className="bg-background border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Audio Narration</DialogTitle>
            <DialogDescription>
              Upload an audio file for this scene's voiceover narration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Choose an audio file
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV, or M4A (max 50MB)
                  </p>
                </div>
                <label htmlFor="scene-audio-input">
                  <Button asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Select Audio File
                    </span>
                  </Button>
                </label>
                <input
                  id="scene-audio-input"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAudioUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio Generation Dialog with Phonetic Editing */}
      <Dialog open={audioGenerateDialogOpen} onOpenChange={setAudioGenerateDialogOpen}>
        <DialogContent className="bg-background border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Audio</DialogTitle>
            <DialogDescription>
              Select a voice and edit the phonetic text below to improve pronunciation accuracy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="voice-select" className="font-medium text-foreground">
                Voice
              </label>
              <Select value={selectedVoice.id} onValueChange={(value) => {
                const voice = VOICES.find(v => v.id === value);
                if (voice) setSelectedVoice(voice);
              }}>
                <SelectTrigger id="voice-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-xs text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phonetic-text" className="font-medium text-foreground">
                Phonetic Text
              </label>
              <Textarea
                id="phonetic-text"
                value={phoneticText}
                onChange={(e) => setPhoneticText(e.target.value)}
                className="min-h-[200px] resize-none font-mono"
                placeholder="Enter phonetic text for audio generation..."
              />
              <p className="text-xs text-muted-foreground">
                Tip: Spell words phonetically (e.g., "data" as "day-tuh" or "dah-tuh"), use hyphens for pauses, or write numbers as words.
              </p>
            </div>

            {/* Preview Button */}
            <div>
              <Button 
                variant="outline"
                onClick={handlePreviewAudio}
                disabled={!phoneticText.trim() || isPreviewingAudio}
                className="w-full gap-2"
              >
                {isPreviewingAudio ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Previewing Audio...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Preview with {selectedVoice.name}
                  </>
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAudioGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleGenerateAudio();
                setAudioGenerateDialogOpen(false);
              }}
              className="gap-2"
              disabled={!phoneticText.trim()}
            >
              {isGeneratingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              Generate Audio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}