import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { MessageSquare, ArrowLeft, Check, Pencil, ChevronLeft, ChevronRight, MoreVertical, Circle, CheckCircle2, Sparkles, Search, Network, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

interface Section {
  id: number;
  title: string;
  learningObjects: any[];
}

interface LearningObject {
  id: number;
  title: string;
  objective: string;
}

interface WizardHeaderProps {
  sections: Section[];
  currentSectionId: number;
  currentLearningObject: LearningObject;
  onSectionChange: (sectionId: number) => void;
  onTitleChange?: (newTitle: string) => void;
  onObjectiveChange?: (newObjective: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  previousTitle?: string;
  nextTitle?: string;
  previousSectionTitle?: string;
  nextSectionTitle?: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  regenerateModalOpen: boolean;
  setRegenerateModalOpen: (open: boolean) => void;
  onOpenFlowMap?: () => void;
}

export default function WizardHeader({ 
  sections, 
  currentSectionId, 
  currentLearningObject, 
  onSectionChange, 
  onTitleChange, 
  onObjectiveChange,
  onNavigate,
  previousTitle,
  nextTitle,
  previousSectionTitle,
  nextSectionTitle,
  isCompleted,
  onToggleComplete,
  regenerateModalOpen,
  setRegenerateModalOpen,
  onOpenFlowMap
}: WizardHeaderProps) {
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [timeSinceLastSave, setTimeSinceLastSave] = useState<string>("just now");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(currentLearningObject.title);
  const [editedObjective, setEditedObjective] = useState(currentLearningObject.objective);

  // Get current section title
  const currentSection = sections.find(s => s.id === currentSectionId);
  const currentSectionTitle = currentSection?.title || "";

  const handleStartEdit = () => {
    setEditedTitle(currentLearningObject.title);
    setEditedObjective(currentLearningObject.objective);
    setEditModalOpen(true);
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
    setEditedTitle(currentLearningObject.title);
    setEditedObjective(currentLearningObject.objective);
    setEditModalOpen(false);
  };

  // Simulate autosave every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      setLastSaved(new Date());
    }, 30000);

    return () => clearInterval(saveInterval);
  }, []);

  // Update the time since last save display
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
      
      if (diffInSeconds < 10) {
        setTimeSinceLastSave("just now");
      } else if (diffInSeconds < 60) {
        setTimeSinceLastSave(`${diffInSeconds}s ago`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeSinceLastSave(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeSinceLastSave(`${hours}h ago`);
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [lastSaved]);

  return (
    <>
      <div className="relative h-[56px] w-full shrink-0 shadow-[0px_2px_8px_rgba(0,0,0,0.1),0px_1px_4px_rgba(0,0,0,0.06)] z-40" data-name="Wizard Header" style={{ backgroundImage: "linear-gradient(90deg, rgba(245, 249, 253, 0.05) 0%, rgba(245, 249, 253, 0.05) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)"}}>
        <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(28,55,90,0.16)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
        <div className="flex flex-row items-center size-full">
          <div className="box-border content-stretch flex items-center justify-between px-[24px] py-0 relative size-full">
            {/* Left section - Back button and Learning Object Title */}
            <div className="flex items-center gap-3 flex-1">
              {/* Back button - icon only */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-[#0271ce] hover:bg-gray-100"
                      onClick={() => window.location.href = 'https://dream-scale-39115659.figma.site'}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Course Overview</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Vertical divider */}
              <div className="h-6 w-px bg-gray-300" />

              {/* Section and Learning Object titles */}
              <div className="flex flex-col gap-0.5">
                <div className="text-xs text-muted-foreground">
                  {currentSectionTitle}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {currentLearningObject.title}
                </div>
              </div>

              {/* Edit button */}
              {onTitleChange && onObjectiveChange && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleStartEdit}
                        className="h-7 w-7 hover:bg-gray-100"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Edit Title/Objective</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Vertical divider */}
              <div className="h-6 w-px bg-gray-300" />

              {/* Navigation buttons */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onNavigate('prev')}
                      disabled={!previousTitle}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  {previousTitle && (
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium">{previousSectionTitle}</p>
                      <p className="text-xs mt-0.5">Previous: {previousTitle}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onNavigate('next')}
                      disabled={!nextTitle}
                      className="h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  {nextTitle && (
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium">{nextSectionTitle}</p>
                      <p className="text-xs mt-0.5">Next: {nextTitle}</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                {/* Learning Object Preview */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        // TODO: Implement learning object level preview that respects flow map arrangement
                        toast.info("Learning object preview coming soon");
                      }}
                      className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Preview Learning Object</p>
                  </TooltipContent>
                </Tooltip>

                {/* More Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onToggleComplete}>
                      {isCompleted ? (
                        <>
                          <Circle className="w-4 h-4 mr-2" />
                          Mark Incomplete
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </DropdownMenuItem>
                    {onTitleChange && onObjectiveChange && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setRegenerateModalOpen(true)}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Regenerate Learning Object
                        </DropdownMenuItem>
                      </>
                    )}
                    {onOpenFlowMap && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onOpenFlowMap}>
                          <Network className="w-4 h-4 mr-2" />
                          Open Flow Map
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>

            {/* Center section - Search */}
            <div className="flex items-center justify-center flex-shrink-0 px-4">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search scenes, transcripts, and media..."
                  className="pl-9 h-9 bg-gray-50/50 border-gray-200 focus-visible:ring-1 focus-visible:ring-sky-500"
                />
              </div>
            </div>

            {/* Right section - Autosave indicator & Comments */}
            <div className="flex items-center gap-[24px] flex-1 justify-end">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-600" />
                <span>Saved {timeSinceLastSave}</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-[36px] px-[8px] gap-[4px]"
                    >
                      <MessageSquare className="w-4 h-4 text-[#3d4543]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Comments</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              <Label htmlFor="title" className="font-medium text-foreground">
                Title
              </Label>
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
              <Label htmlFor="objective" className="font-medium text-foreground">
                Learning Objective
              </Label>
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
    </>
  );
}