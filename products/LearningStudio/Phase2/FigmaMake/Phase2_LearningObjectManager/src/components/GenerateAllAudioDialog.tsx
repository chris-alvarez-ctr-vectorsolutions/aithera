import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Wand2, CheckCircle2, Loader2, Music, Lock } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Scene {
  id: number;
  transcript: string;
  audioFile: string | null;
  avatarId?: string | null;
}

interface GenerateAllAudioDialogProps {
  scenes: Scene[];
  onAudioGenerated: (sceneId: number, audioUrl: string) => void;
}

const INITIAL_VOICES = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and friendly" },
  { id: "fable", name: "Fable", description: "Expressive and dynamic" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Energetic and engaging" },
  { id: "shimmer", name: "Shimmer", description: "Soft and clear" },
];

const AVATARS = [
  { id: "avatar1", name: "Alex" },
  { id: "avatar2", name: "Jordan" },
  { id: "avatar3", name: "Sam" },
];

export function GenerateAllAudioDialog({
  scenes,
  onAudioGenerated,
}: GenerateAllAudioDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [completedScenes, setCompletedScenes] = useState<number[]>([]);
  const [voiceMode, setVoiceMode] = useState<"single" | "individual">("single");
  const [globalVoice, setGlobalVoice] = useState(INITIAL_VOICES[0].id);

  const scenesWithoutAudio = scenes.filter(scene => !scene.audioFile && scene.transcript.trim());
  const totalScenes = scenesWithoutAudio.length;

  // Initialize voice selections for each scene
  const [sceneVoices, setSceneVoices] = useState<Record<number, string>>(() => {
    const initialVoices: Record<number, string> = {};
    scenesWithoutAudio.forEach(scene => {
      initialVoices[scene.id] = INITIAL_VOICES[0].id; // Default to first voice
    });
    return initialVoices;
  });

  // Update voice selections when scenes change
  const handleVoiceChange = (sceneId: number, voiceId: string) => {
    setSceneVoices(prev => ({
      ...prev,
      [sceneId]: voiceId
    }));
  };

  // Handle global voice change
  const handleGlobalVoiceChange = (voiceId: string) => {
    setGlobalVoice(voiceId);
    // Apply to all non-locked scenes
    const updatedVoices: Record<number, string> = { ...sceneVoices };
    scenesWithoutAudio.forEach(scene => {
      if (!scene.avatarId) {
        updatedVoices[scene.id] = voiceId;
      }
    });
    setSceneVoices(updatedVoices);
  };

  const handleGenerateAll = async () => {
    if (totalScenes === 0) {
      toast.error("All scenes already have audio or are missing transcripts");
      return;
    }

    setIsGenerating(true);
    setCurrentScene(0);
    setCompletedScenes([]);

    // Simulate generating audio for each scene
    for (let i = 0; i < scenesWithoutAudio.length; i++) {
      const scene = scenesWithoutAudio[i];
      const voiceId = sceneVoices[scene.id];
      const voice = INITIAL_VOICES.find(v => v.id === voiceId) || INITIAL_VOICES[0];
      setCurrentScene(i + 1);

      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock audio URL with voice info
      const mockAudioUrl = `generated-audio-scene-${scene.id}-${voice.id}.mp3`;
      onAudioGenerated(scene.id, mockAudioUrl);
      
      setCompletedScenes(prev => [...prev, scene.id]);
    }

    setIsGenerating(false);
    toast.success(`Generated audio for ${totalScenes} scene${totalScenes > 1 ? 's' : ''}`);
    
    // Close dialog after a brief delay
    setTimeout(() => {
      setOpen(false);
      setCompletedScenes([]);
      setCurrentScene(0);
    }, 1000);
  };

  const progressPercentage = totalScenes > 0 ? (currentScene / totalScenes) * 100 : 0;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 px-3"
        onClick={() => setOpen(true)}
        title="Generate audio"
      >
        <Wand2 className="w-4 h-4 mr-1.5" />
        Generate Audio
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>Generate Audio for All Scenes</DialogTitle>
            <DialogDescription>
              AI will generate audio narration for all scenes that don't already have audio files.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!isGenerating ? (
              <>
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600 shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Ready to generate
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {totalScenes === 0 ? (
                          "All scenes already have audio or are missing transcripts."
                        ) : (
                          <>
                            {totalScenes} scene{totalScenes > 1 ? 's' : ''} will have audio generated from {totalScenes > 1 ? 'their' : 'its'} transcript text.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {totalScenes > 0 && (
                  <div className="space-y-4">
                    {/* Voice Mode Selection */}
                    <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                      <Label className="text-sm font-medium text-foreground">Voice Selection</Label>
                      <RadioGroup value={voiceMode} onValueChange={(value: "single" | "individual") => setVoiceMode(value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="single" />
                          <Label htmlFor="single" className="text-sm font-normal cursor-pointer">
                            Same voice for all scenes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual" className="text-sm font-normal cursor-pointer">
                            Individual voice per scene
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Global Voice Selector */}
                      {voiceMode === "single" && (
                        <div className="flex items-center gap-3 pt-2">
                          <Label className="text-sm text-muted-foreground whitespace-nowrap">Select Voice:</Label>
                          <Select value={globalVoice} onValueChange={handleGlobalVoiceChange}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INITIAL_VOICES.map((voice) => (
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
                      )}
                    </div>

                    {/* Individual Scene Voice Configuration */}
                    {voiceMode === "individual" && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Configure Voice for Each Scene</p>
                        <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                          {scenesWithoutAudio.map((scene) => {
                            const isAvatarLocked = !!scene.avatarId;
                            const avatar = AVATARS.find(a => a.id === scene.avatarId);
                            
                            return (
                              <div key={scene.id} className="flex items-center gap-2 p-2 rounded-md bg-background border border-border min-w-0">
                                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                  <span className="text-sm font-medium text-foreground">
                                    Scene {scene.id}
                                  </span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {scene.transcript.substring(0, 40)}...
                                  </span>
                                </div>
                                {isAvatarLocked ? (
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 shrink-0">
                                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="text-xs font-medium text-amber-900">
                                      Presenter
                                    </span>
                                  </div>
                                ) : (
                                  <Select
                                    value={sceneVoices[scene.id] || INITIAL_VOICES[0].id}
                                    onValueChange={(value) => handleVoiceChange(scene.id, value)}
                                  >
                                    <SelectTrigger className="w-[100px] h-8 shrink-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {INITIAL_VOICES.map((voice) => (
                                        <SelectItem key={voice.id} value={voice.id}>
                                          {voice.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Scene Summary for Single Voice Mode */}
                    {voiceMode === "single" && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Scenes to Generate</p>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
                          {scenesWithoutAudio.map((scene) => {
                            const isAvatarLocked = !!scene.avatarId;
                            const voiceToUse = isAvatarLocked ? "Presenter" : INITIAL_VOICES.find(v => v.id === globalVoice)?.name;
                            
                            return (
                              <div key={scene.id} className="flex items-center gap-2 p-2 rounded-md bg-background border border-border/50 min-w-0">
                                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                  <span className="text-sm font-medium text-foreground">
                                    Scene {scene.id}
                                  </span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {scene.transcript.substring(0, 50)}...
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-50 border border-purple-200 shrink-0">
                                  {isAvatarLocked && <Lock className="w-3 h-3 text-amber-600" />}
                                  <span className="text-xs font-medium text-purple-900">
                                    {voiceToUse}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Generating audio... ({currentScene} of {totalScenes})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scene {scenesWithoutAudio[currentScene - 1]?.id}
                    </p>
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                
                {completedScenes.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {completedScenes.map(sceneId => (
                      <div key={sceneId} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span>Scene {sceneId} complete</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating || totalScenes === 0}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Audio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}