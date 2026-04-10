import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Clock, Play, CheckCircle2, Circle, ChevronLeft, ChevronRight, Pencil, Check, X, MoreVertical, Film, Sparkles, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

interface ScenePreview {
  id: number;
  transcript: string;
  previewImage: string;
  duration: number;
}

interface LearningObjectHeaderProps {
  title: string;
  objective: string;
  totalDuration: number;
  isCompleted: boolean;
  scenes: ScenePreview[];
  onToggleComplete: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  previousTitle?: string;
  nextTitle?: string;
  previousSectionTitle?: string;
  nextSectionTitle?: string;
  onTitleChange?: (newTitle: string) => void;
  onObjectiveChange?: (newObjective: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  currentPreviewScene: number;
  setCurrentPreviewScene: (scene: number) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function LearningObjectHeader({
  title,
  objective,
  totalDuration,
  isCompleted,
  scenes,
  onToggleComplete,
  onNavigate,
  previousTitle,
  nextTitle,
  previousSectionTitle,
  nextSectionTitle,
  onTitleChange,
  onObjectiveChange,
  activeTab,
  onTabChange,
  previewOpen,
  setPreviewOpen,
  currentPreviewScene,
  setCurrentPreviewScene,
  searchQuery,
  onSearchQueryChange,
}: LearningObjectHeaderProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedObjective, setEditedObjective] = useState(objective);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [autoSplitScenes, setAutoSplitScenes] = useState(false);
  const [autoGenerateVisuals, setAutoGenerateVisuals] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Sync internal search state with prop if needed, or just use prop.
  // We'll use local isSearching to toggle the input visibility.
  // If query is present, we assume searching is active.
  if (searchQuery && !isSearching) setIsSearching(true);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleStartPreview = () => {
    setCurrentPreviewScene(0);
    setPreviewOpen(true);
  };

  const handleNextScene = () => {
    if (currentPreviewScene < scenes.length - 1) {
      setCurrentPreviewScene(currentPreviewScene + 1);
    } else {
      // Preview complete
      setPreviewOpen(false);
      toast.success("Preview complete!", {
        description: "You've viewed all scenes in this learning object.",
      });
    }
  };

  const handlePreviousScene = () => {
    if (currentPreviewScene > 0) {
      setCurrentPreviewScene(currentPreviewScene - 1);
    }
  };

  const handleToggleComplete = () => {
    onToggleComplete();
    toast.success(isCompleted ? "Learning object marked as incomplete" : "Learning object completed!", {
      description: isCompleted 
        ? "You can continue working on this learning object."
        : "Great work! You've completed this learning object.",
    });
  };

  const handleSave = () => {
    if (editedTitle.trim() && editedObjective.trim()) {
      if (onTitleChange) onTitleChange(editedTitle);
      if (onObjectiveChange) onObjectiveChange(editedObjective);
      setEditModalOpen(false);
      toast.success("Learning object updated successfully");
    }
  };

  const handleCancel = () => {
    setEditedTitle(title);
    setEditedObjective(objective);
    setEditModalOpen(false);
  };

  const handleStartEdit = () => {
    setEditedTitle(title);
    setEditedObjective(objective);
    setEditModalOpen(true);
  };

  const handleOpenMediaGallery = () => {
    setMediaGalleryOpen(true);
  };

  const handleOpenRegenerateModal = () => {
    setRegeneratePrompt("");
    setAutoSplitScenes(false);
    setAutoGenerateVisuals(false);
    setRegenerateModalOpen(true);
  };

  const handleRegenerateSubmit = () => {
    if (!regeneratePrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    // Simulate AI regeneration
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Regenerating learning object...",
        success: () => {
          setRegenerateModalOpen(false);
          return `Learning object regenerated${autoSplitScenes ? ' and split into scenes' : ''}${autoGenerateVisuals ? ' with AI-generated visuals' : ''}!`;
        },
        error: "Failed to regenerate learning object",
      }
    );
  };

  return (
    <>
      <div className="w-full bg-white border-b-2 border-white/40 relative z-30" style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="px-12 py-4">
          {/* Single row with 2 sections */}
          <div className="flex items-center gap-8">
            {/* Section 1: Tabs (left side) */}
            <div className="flex-1 flex justify-start">
              <Tabs value={activeTab} onValueChange={onTabChange} className="gap-0">
                <TabsList className="h-auto p-1 bg-gray-100/80 rounded-lg">
                  <TabsTrigger 
                    value="scenes"
                    className="px-4 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Scenes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="knowledge-checks"
                    className="px-4 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Knowledge Checks
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assessment"
                    className="px-4 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Assessment
                  </TabsTrigger>
                  <TabsTrigger 
                    value="citations"
                    className="px-4 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Citations
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl bg-background border-border">
          <DialogHeader>
            <DialogTitle>Edit Learning Object</DialogTitle>
            <DialogDescription>
              Update the title and objective for this learning object.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="font-medium text-foreground">
                Title
              </label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Learning Object Title"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="objective" className="font-medium text-foreground">
                Learning Objective
              </label>
              <Textarea
                id="objective"
                value={editedObjective}
                onChange={(e) => setEditedObjective(e.target.value)}
                className="min-h-[120px] resize-none"
                placeholder="Enter learning objective..."
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Gallery Modal */}
      <Dialog open={mediaGalleryOpen} onOpenChange={setMediaGalleryOpen}>
        <DialogContent className="max-w-7xl w-[95vw] bg-background border-border max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Media Gallery</DialogTitle>
            <DialogDescription>
              Visual review of all media from {scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'} · Identify repeated visuals, themes, and consistency
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenes.map((scene, idx) => (
                <div 
                  key={scene.id}
                  className="group relative bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-lg"
                  onClick={() => {
                    setCurrentPreviewScene(idx);
                    setMediaGalleryOpen(false);
                    setPreviewOpen(true);
                  }}
                >
                  {/* Large preview image */}
                  <div className="aspect-video w-full bg-black">
                    <img
                      src={scene.previewImage}
                      alt={`Scene ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Hover overlay with play icon */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/90 rounded-full p-4">
                      <Play className="w-10 h-10 text-white fill-white" />
                    </div>
                  </div>
                  
                  {/* Scene info bar */}
                  <div className="bg-background/95 backdrop-blur-sm border-t border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Scene {idx + 1}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{scene.transcript}</p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <Badge variant="outline" className="gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatDuration(scene.duration)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaGalleryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl bg-background border-border">
          <DialogHeader>
            <DialogTitle>Learning Object Preview</DialogTitle>
            <DialogDescription>
              Scene {currentPreviewScene + 1} of {scenes.length} · {formatDuration(scenes[currentPreviewScene]?.duration || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Scene Preview */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
              <img
                src={scenes[currentPreviewScene]?.previewImage}
                alt={`Scene ${currentPreviewScene + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Transcript */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="font-medium text-foreground mb-2">Scene Transcript</h4>
              <p className="text-foreground">{scenes[currentPreviewScene]?.transcript}</p>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-center gap-1.5">
              {scenes.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentPreviewScene
                      ? 'w-8 bg-primary'
                      : idx < currentPreviewScene
                      ? 'w-1.5 bg-primary/40'
                      : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousScene}
              disabled={currentPreviewScene === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNextScene}>
              {currentPreviewScene < scenes.length - 1 ? 'Next Scene' : 'Finish Preview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Learning Object Modal */}
      <Dialog open={regenerateModalOpen} onOpenChange={setRegenerateModalOpen}>
        <DialogContent className="max-w-2xl bg-background border-border">
          <DialogHeader>
            <DialogTitle>Regenerate Learning Object</DialogTitle>
            <DialogDescription>
              Use AI to regenerate this learning object with new content based on your prompt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="regenerate-prompt" className="text-foreground">
                Regeneration Prompt
              </Label>
              <Textarea
                id="regenerate-prompt"
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                className="min-h-[120px] resize-none"
                placeholder="Describe how you want to regenerate this learning object... (e.g., 'Make it more concise', 'Add more examples', 'Simplify the language')"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-4 rounded-lg border border-border p-4 bg-muted/30">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="auto-split" className="text-foreground cursor-pointer">
                    Automatically split into scenes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Let AI divide the content into logical scenes
                  </p>
                </div>
                <Switch
                  id="auto-split"
                  checked={autoSplitScenes}
                  onCheckedChange={setAutoSplitScenes}
                />
              </div>

              {autoSplitScenes && (
                <div className="flex items-center justify-between space-x-4 rounded-lg border border-border p-4 bg-muted/30 ml-4">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="auto-visuals" className="text-foreground cursor-pointer">
                      AI find/generate visuals for scenes
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically find or generate appropriate visuals for each scene
                    </p>
                  </div>
                  <Switch
                    id="auto-visuals"
                    checked={autoGenerateVisuals}
                    onCheckedChange={setAutoGenerateVisuals}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRegenerateSubmit}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}