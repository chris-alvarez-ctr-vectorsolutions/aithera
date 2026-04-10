import { useState } from "react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause, 
  SkipBack,
  Type,
  Image as ImageIcon,
  Plus,
  Trash2,
  GripVertical,
  Sparkles
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface TimelineItem {
  id: string;
  type: "text" | "graphic" | "media" | "template" | "audio";
  content: string;
  startTime: number; // seconds
  duration: number; // seconds
  track: number; // which track (0, 1, 2, etc.)
  transitionIn?: "none" | "fade" | "dissolve" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "wipe";
  transitionOut?: "none" | "fade" | "dissolve" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "wipe";
  transitionDuration?: number; // Duration of transition in seconds (default 0.5)
}

interface TimelinePanelProps {
  duration: number; // Total duration in seconds
  currentTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onAddItem?: (item: Omit<TimelineItem, "id">) => void;
  items?: TimelineItem[];
  onItemUpdate?: (id: string, updates: Partial<TimelineItem>) => void;
  onItemDelete?: (id: string) => void;
  className?: string; // Add className prop
  selectedItemId?: string | null;
  onItemSelect?: (id: string | null) => void;
}

export function TimelinePanel({
  duration,
  currentTime,
  onTimeChange,
  isPlaying,
  onPlayPause,
  onAddItem,
  items = [],
  onItemUpdate,
  onItemDelete,
  className, // Destructure className
  selectedItemId,
  onItemSelect,
}: TimelinePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<{ id: string; type: "move" | "resize-start" | "resize-end" } | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleAddItem = (type: "text" | "graphic") => {
    if (onAddItem) {
      onAddItem({
        type,
        content: type === "text" ? "New Text" : "graphic.png",
        startTime: currentTime,
        duration: 2, // Default 2 seconds
        track: 0,
      });
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onTimeChange(Math.max(0, Math.min(duration, newTime)));
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only deselect if clicking on the track background itself, not on an item
    if (e.target === e.currentTarget) {
      setSelectedItem(null);
      onItemSelect?.(null);
    }
    handleTimelineClick(e);
  };

  const handleItemDragStart = (e: React.MouseEvent, itemId: string, dragType: "move" | "resize-start" | "resize-end") => {
    e.stopPropagation();
    setIsDragging({ id: itemId, type: dragType });
    setSelectedItem(itemId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !onItemUpdate) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    const item = items.find(i => i.id === isDragging.id);
    if (!item) return;

    if (isDragging.type === "move") {
      const newStartTime = Math.max(0, Math.min(duration - item.duration, time - item.duration / 2));
      onItemUpdate(isDragging.id, { startTime: newStartTime });
    } else if (isDragging.type === "resize-start") {
      const newStartTime = Math.max(0, Math.min(item.startTime + item.duration - 0.1, time));
      const newDuration = item.startTime + item.duration - newStartTime;
      onItemUpdate(isDragging.id, { startTime: newStartTime, duration: newDuration });
    } else if (isDragging.type === "resize-end") {
      const newDuration = Math.max(0.1, Math.min(duration - item.startTime, time - item.startTime));
      onItemUpdate(isDragging.id, { duration: newDuration });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Generate time markers
  const timeMarkers = [];
  const markerInterval = duration > 30 ? 5 : duration > 10 ? 2 : 1;
  for (let i = 0; i <= duration; i += markerInterval) {
    timeMarkers.push(i);
  }

  if (isCollapsed) {
    return (
      <div className={`bg-background/95 backdrop-blur-xl border-t border-border shadow-lg ${className}`}>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(false)}
              className="h-7 px-2"
            >
              <ChevronUp className="w-4 h-4 mr-1" />
              Timeline
            </Button>
            <div className="text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onTimeChange(0)}
            >
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-7 w-7"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background/95 backdrop-blur-xl border-t border-border shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-7 px-2"
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            Timeline
          </Button>
          <div className="text-sm font-medium text-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Playback Controls */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onTimeChange(0)}
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset to Start</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="default"
            size="icon"
            className="h-8 w-8"
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Selected Item Properties */}
      {selectedItem && (
        <div className="px-4 py-2 border-b border-border bg-slate-900/20">
          {(() => {
            const item = items.find(i => i.id === selectedItem);
            if (!item) return null;

            return (
              <div className="flex items-center gap-3 text-xs">
                {/* Basic Info */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{formatTime(item.duration)}</span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Track:</span>
                  <span className="font-medium">{item.track + 1}</span>
                </div>

                {/* Transitions (only for text items) */}
                {item.type === "text" && onItemUpdate && (
                  <>
                    <div className="h-3 w-px bg-border ml-1" />
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">In:</span>
                      <Select
                        value={item.transitionIn || "fade"}
                        onValueChange={(value) => onItemUpdate(item.id, { transitionIn: value as any })}
                      >
                        <SelectTrigger className="h-6 text-xs w-24 px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="fade">Fade</SelectItem>
                          <SelectItem value="dissolve">Dissolve</SelectItem>
                          <SelectItem value="slide-up">Slide Up</SelectItem>
                          <SelectItem value="slide-down">Slide Down</SelectItem>
                          <SelectItem value="slide-left">Slide Left</SelectItem>
                          <SelectItem value="slide-right">Slide Right</SelectItem>
                          <SelectItem value="scale">Scale</SelectItem>
                          <SelectItem value="wipe">Wipe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Out:</span>
                      <Select
                        value={item.transitionOut || "fade"}
                        onValueChange={(value) => onItemUpdate(item.id, { transitionOut: value as any })}
                      >
                        <SelectTrigger className="h-6 text-xs w-24 px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="fade">Fade</SelectItem>
                          <SelectItem value="dissolve">Dissolve</SelectItem>
                          <SelectItem value="slide-up">Slide Up</SelectItem>
                          <SelectItem value="slide-down">Slide Down</SelectItem>
                          <SelectItem value="slide-left">Slide Left</SelectItem>
                          <SelectItem value="slide-right">Slide Right</SelectItem>
                          <SelectItem value="scale">Scale</SelectItem>
                          <SelectItem value="wipe">Wipe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Timeline Content */}
      <div className="px-4 py-3 h-[240px] overflow-y-auto">
        <div className="space-y-2">
          {/* Define specific tracks with labels */}
          <div className="flex gap-2">
            {/* Track Labels Column */}
            <div className="w-32 flex-shrink-0 space-y-2">
              <div className="h-8 flex items-center">
                <span className="text-xs font-medium text-muted-foreground">Audio</span>
              </div>
              <div className="h-8 flex items-center">
                <span className="text-xs font-medium text-muted-foreground">Background</span>
              </div>
              <div className="h-8 flex items-center">
                <span className="text-xs font-medium text-muted-foreground">Template</span>
              </div>
            </div>

            {/* Timeline Tracks */}
            <div className="flex-1 space-y-2">
              {/* Audio Track */}
              <div 
                className="relative h-8 bg-slate-900/40 rounded-lg border border-slate-700/50 overflow-hidden"
                onClick={handleTimelineClick}
              >
                {/* Mock waveform */}
                <div className="absolute inset-0 flex items-center justify-around px-1">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const height = 20 + Math.random() * 60;
                    return (
                      <div
                        key={i}
                        className="w-px bg-gradient-to-t from-blue-400 to-blue-600 opacity-70"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
                {/* Audio items on this track */}
                {items
                  .filter(item => item.type === "audio")
                  .map((item) => {
                    const left = (item.startTime / duration) * 100;
                    const width = (item.duration / duration) * 100;
                    const isSelected = (selectedItemId || selectedItem) === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`absolute top-0 bottom-0 rounded px-2 flex items-center justify-between gap-1 cursor-pointer transition-all group ${
                          isSelected
                            ? "ring-2 ring-blue-500 bg-blue-500/90"
                            : "bg-blue-400/80 hover:bg-blue-400/90"
                        }`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item.id);
                          onItemSelect?.(item.id);
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-white text-xs font-medium truncate flex-1 min-w-0">
                          <span className="truncate">{item.content}</span>
                        </div>
                      </div>
                    );
                  })}
                {/* Playhead on audio track */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Background Media Track */}
              <div
                className="relative h-8 bg-slate-900/20 rounded-lg border border-slate-700/30"
                onClick={handleBackgroundClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Background media items */}
                {items
                  .filter(item => item.type === "media")
                  .map((item) => {
                    const left = (item.startTime / duration) * 100;
                    const width = (item.duration / duration) * 100;
                    const isSelected = (selectedItemId || selectedItem) === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`absolute top-1 bottom-1 rounded px-2 flex items-center justify-between gap-1 cursor-move transition-all group ${
                          isSelected
                            ? "ring-2 ring-blue-500 bg-blue-500/90"
                            : "bg-green-500/80 hover:bg-green-500/90"
                        }`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onMouseDown={(e) => handleItemDragStart(e, item.id, "move")}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item.id);
                          onItemSelect?.(item.id);
                        }}
                      >
                        {/* Resize handle - start */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 hover:bg-white/60 cursor-ew-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleItemDragStart(e, item.id, "resize-start");
                          }}
                        />

                        {/* Content */}
                        <div className="flex items-center gap-1.5 text-white text-xs font-medium truncate flex-1 min-w-0">
                          <ImageIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.content}</span>
                        </div>

                        {/* Resize handle - end */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 hover:bg-white/60 cursor-ew-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleItemDragStart(e, item.id, "resize-end");
                          }}
                        />
                      </div>
                    );
                  })}
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Template/Overlay Track */}
              <div
                className="relative h-8 bg-slate-900/20 rounded-lg border border-slate-700/30"
                onClick={handleBackgroundClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Template items */}
                {items
                  .filter(item => item.type === "template" || item.type === "text")
                  .map((item) => {
                    const left = (item.startTime / duration) * 100;
                    const width = (item.duration / duration) * 100;
                    const isSelected = (selectedItemId || selectedItem) === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`absolute top-1 bottom-1 rounded px-2 flex items-center justify-between gap-1 cursor-move transition-all group ${
                          isSelected
                            ? "ring-2 ring-blue-500 bg-blue-500/90"
                            : "bg-purple-500/80 hover:bg-purple-500/90"
                        }`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onMouseDown={(e) => handleItemDragStart(e, item.id, "move")}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item.id);
                          onItemSelect?.(item.id);
                        }}
                      >
                        {/* Resize handle - start */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 hover:bg-white/60 cursor-ew-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleItemDragStart(e, item.id, "resize-start");
                          }}
                        />

                        {/* Content */}
                        <div className="flex items-center gap-1.5 text-white text-xs font-medium truncate flex-1 min-w-0">
                          <Type className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.content}</span>
                        </div>

                        {/* Delete button */}
                        {isSelected && onItemDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-white/20 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemDelete(item.id);
                              setSelectedItem(null);
                              onItemSelect?.(null);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}

                        {/* Resize handle - end */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 hover:bg-white/60 cursor-ew-resize"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleItemDragStart(e, item.id, "resize-end");
                          }}
                        />
                      </div>
                    );
                  })}
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
                </div>
              </div>

              {/* Time markers row */}
              <div className="relative h-6">
                {timeMarkers.map((time) => (
                  <div
                    key={time}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${(time / duration) * 100}%` }}
                  >
                    <div className="w-px h-2 bg-slate-600" />
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {formatTime(time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}