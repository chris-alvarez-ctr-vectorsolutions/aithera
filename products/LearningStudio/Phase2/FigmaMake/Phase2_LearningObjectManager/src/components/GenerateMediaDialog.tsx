import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Sparkles, Video, ChevronLeft, ChevronRight, Upload, Search, Plus } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

interface GenerateMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaGenerated: (url: string, type: 'image' | 'video') => void;
  mediaType?: 'image' | 'video';
}

const INITIAL_STYLES = [
  { id: "professional", name: "Professional", description: "Clear and authoritative" },
  { id: "conversational", name: "Conversational", description: "Friendly and casual" },
  { id: "educational", name: "Educational", description: "Informative and engaging" },
  { id: "cinematic", name: "Cinematic", description: "Dramatic and polished" },
  { id: "minimalist", name: "Minimalist", description: "Clean and simple" },
];

const INITIAL_AVATARS = [
  { id: "avatar1", name: "Alex", description: "Young professional" },
  { id: "avatar2", name: "Jordan", description: "Experienced instructor" },
  { id: "avatar3", name: "Sam", description: "Friendly guide" },
];

interface StockImage {
  id: string;
  url: string;
  category: string;
  title: string;
}

const STOCK_IMAGES: StockImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1709715357520-5e1047a2b691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmd8ZW58MXx8fHwxNzYxNTQzODMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "business",
    title: "Business Meeting",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1623715537851-8bc15aa8c145?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MTUxNTU5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "technology",
    title: "Technology Workspace",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NjE1Mjc3MjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "business",
    title: "Team Collaboration",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBwcmVzZW50YXRpb258ZW58MXx8fHwxNzYxNjA2NDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "business",
    title: "Office Presentation",
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1761141426543-1f24f2b113cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjaXR5c2NhcGV8ZW58MXx8fHwxNzYxNTUwNDAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "lifestyle",
    title: "Modern Cityscape",
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGJhY2tncm91bmR8ZW58MXx8fHwxNzYxNTU5MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "abstract",
    title: "Abstract Background",
  },
  {
    id: "7",
    url: "https://images.unsplash.com/photo-1611241893603-3c359704e0ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbnxlbnwxfHx8fDE3NjE2MDY2Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "abstract",
    title: "Creative Design",
  },
  {
    id: "8",
    url: "https://images.unsplash.com/photo-1617634667039-8e4cb277ab46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzYxNTE0NzQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "nature",
    title: "Nature Landscape",
  },
  {
    id: "9",
    url: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjB3b3JraW5nfGVufDF8fHx8MTc2MTYwNzQwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "business",
    title: "People Working",
  },
  {
    id: "10",
    url: "https://images.unsplash.com/photo-1557838923-2985c318be48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nfGVufDF8fHx8MTc2MTU5NzM4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "technology",
    title: "Digital Marketing",
  },
  {
    id: "11",
    url: "https://images.unsplash.com/photo-1594235048794-fae8583a5af5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwb2ZmaWNlfGVufDF8fHx8MTc2MTU4OTg0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "business",
    title: "Startup Office",
  },
  {
    id: "12",
    url: "https://images.unsplash.com/photo-1746021375246-7dc8ab0583f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYxNTgxMzAzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "business",
    title: "Professional Workspace",
  },
];

export function GenerateMediaDialog({ open, onOpenChange, onMediaGenerated, mediaType: initialMediaType }: GenerateMediaDialogProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video'>(initialMediaType || 'image');
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentView, setCurrentView] = useState<'generate' | 'preview'>('generate');
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState("");
  
  // Revision tracking
  const [revisions, setRevisions] = useState<string[]>([]);
  const [currentRevisionIndex, setCurrentRevisionIndex] = useState(0);
  
  // Selections
  const [selectedStyle, setSelectedStyle] = useState(INITIAL_STYLES[0].id);
  const [selectedAvatar, setSelectedAvatar] = useState(INITIAL_AVATARS[0].id);

  // Stock media state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setProgress(0);

    // Simulate generation progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    // Simulate AI generation delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      
      const styleName = INITIAL_STYLES.find(s => s.id === selectedStyle)?.name || "Professional";
      const avatarName = INITIAL_AVATARS.find(a => a.id === selectedAvatar)?.name || "Alex";
      
      // Generate a sample image or video URL based on the prompt
      // In a real implementation, this would call an AI generation API with style and avatar
      const sampleMedia = mediaType === 'image' 
        ? `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1579546929662-711aa81148cf' : '1501594907352-04cda38ebc29'}?w=1200&h=800&fit=crop`
        : `https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?w=1200&h=800&fit=crop`;
      
      setTimeout(() => {
        setGeneratedMediaUrl(sampleMedia);
        setRevisions([sampleMedia]);
        setCurrentRevisionIndex(0);
        setIsGenerating(false);
        setProgress(0);
        setCurrentView('preview');
        
        toast.success(
          mediaType === 'image' 
            ? `Image generated with ${styleName} style`
            : `Video generated with ${styleName} style and ${avatarName} avatar`
        );
      }, 500);
    }, 3000);
  };

  const handleAddToScene = () => {
    onMediaGenerated(generatedMediaUrl, mediaType);
    handleClose();
  };

  const handleRegenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setProgress(0);

    // Simulate generation progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    // Simulate AI generation delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      
      const styleName = INITIAL_STYLES.find(s => s.id === selectedStyle)?.name || "Professional";
      const avatarName = INITIAL_AVATARS.find(a => a.id === selectedAvatar)?.name || "Alex";
      
      // Generate a sample image or video URL based on the prompt
      const sampleMedia = mediaType === 'image' 
        ? `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1579546929662-711aa81148cf' : '1501594907352-04cda38ebc29'}?w=1200&h=800&fit=crop&t=${Date.now()}`
        : `https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?w=1200&h=800&fit=crop&t=${Date.now()}`;
      
      setTimeout(() => {
        setGeneratedMediaUrl(sampleMedia);
        // Add new revision to the list
        setRevisions(prev => [...prev, sampleMedia]);
        setCurrentRevisionIndex(revisions.length);
        setIsGenerating(false);
        setProgress(0);
        
        toast.success(
          mediaType === 'image' 
            ? `Image regenerated with ${styleName} style`
            : `Video regenerated with ${styleName} style and ${avatarName} avatar`
        );
      }, 500);
    }, 3000);
  };

  const handlePreviousRevision = () => {
    if (currentRevisionIndex > 0) {
      const newIndex = currentRevisionIndex - 1;
      setCurrentRevisionIndex(newIndex);
      setGeneratedMediaUrl(revisions[newIndex]);
    }
  };

  const handleNextRevision = () => {
    if (currentRevisionIndex < revisions.length - 1) {
      const newIndex = currentRevisionIndex + 1;
      setCurrentRevisionIndex(newIndex);
      setGeneratedMediaUrl(revisions[newIndex]);
    }
  };

  const handleClose = () => {
    setCurrentView('generate');
    setGeneratedMediaUrl("");
    setPrompt("");
    setProgress(0);
    setRevisions([]);
    setCurrentRevisionIndex(0);
    onOpenChange(false);
  };

  const handleDialogChange = (newOpen: boolean) => {
    if (!isGenerating) {
      if (!newOpen) {
        handleClose();
      } else {
        onOpenChange(newOpen);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Create a URL for the uploaded image
    const uploadedUrl = URL.createObjectURL(file);
    
    // Set it as the generated media and go to preview
    setGeneratedMediaUrl(uploadedUrl);
    setRevisions([uploadedUrl]);
    setCurrentRevisionIndex(0);
    setCurrentView('preview');
    
    toast.success('Image uploaded successfully');
  };

  const handleStockImageClick = (imageUrl: string) => {
    // Set the stock image as generated media and go to preview
    setGeneratedMediaUrl(imageUrl);
    setRevisions([imageUrl]);
    setCurrentRevisionIndex(0);
    setMediaType('image');
    setCurrentView('preview');
    
    toast.success('Stock image selected');
  };

  const filteredStockImages = STOCK_IMAGES.filter((image) => {
    const matchesSearch = image.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || image.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="bg-background border sm:max-w-[900px] max-h-[90vh] flex flex-col">
        {currentView === 'generate' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Add Media
              </DialogTitle>
              <DialogDescription>
                Upload your own media, choose from stock images, or generate with AI
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="custom" className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="custom">Custom Media</TabsTrigger>
                <TabsTrigger value="stock">Stock Media</TabsTrigger>
              </TabsList>

              <TabsContent value="custom" className="space-y-6 py-4">
                {/* Progress Bar */}
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Generating {mediaType}...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Upload Option */}
                <div className="space-y-2">
                  <Label>Upload Your Image</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-muted-foreground/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isGenerating}
                      className="hidden"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload" 
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium text-foreground mb-1">
                        Click to upload an image
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Upload an existing image to use in your scene
                      </span>
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or generate with AI</span>
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="space-y-3">
                  <Label htmlFor="prompt">Description</Label>
                  <Textarea
                    id="prompt"
                    placeholder={`Describe the ${mediaType} you want to generate... (e.g., "A futuristic cityscape at sunset with flying cars")`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle} disabled={isGenerating}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INITIAL_STYLES.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          <div className="flex flex-col">
                            <span>{style.name}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Avatar Selection - Only for Video (Optional) */}
                {mediaType === 'video' && (
                  <div className="space-y-2">
                    <Label>Avatar (Optional)</Label>
                    <Select value={selectedAvatar} onValueChange={setSelectedAvatar} disabled={isGenerating}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INITIAL_AVATARS.map((avatar) => (
                          <SelectItem key={avatar.id} value={avatar.id}>
                            <div className="flex flex-col">
                              <span>{avatar.name}</span>
                              <span className="text-xs text-muted-foreground">{avatar.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleDialogChange(false)}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="stock" className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2 border rounded-md px-3 bg-background">
                  <Search className="text-muted-foreground w-4 h-4 flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Category Tabs */}
                <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="business">Business</TabsTrigger>
                    <TabsTrigger value="technology">Technology</TabsTrigger>
                    <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                    <TabsTrigger value="nature">Nature</TabsTrigger>
                    <TabsTrigger value="abstract">Abstract</TabsTrigger>
                  </TabsList>

                  {/* Image Grid */}
                  <TabsContent value={selectedCategory} className="mt-4">
                    <ScrollArea className="h-[500px]">
                      <div className="grid grid-cols-3 gap-4 pr-4">
                        {filteredStockImages.map((image) => (
                          <button
                            key={image.id}
                            onClick={() => handleStockImageClick(image.url)}
                            className="group relative aspect-video overflow-hidden rounded-xl border-2 border-border hover:border-primary transition-all"
                          >
                            <img
                              src={image.url}
                              alt={image.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white text-sm">{image.title}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {filteredStockImages.length === 0 && (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                          No images found
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </>
        ) : currentView === 'preview' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Preview & Edit {mediaType === 'image' ? 'Image' : 'Video'}
              </DialogTitle>
              <DialogDescription>
                Review and refine your generated media before adding it to your scene
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="py-4 space-y-4 pr-6">
                {/* Large Preview with Revision Navigation */}
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden bg-muted border">
                    {mediaType === 'image' ? (
                      <img 
                        src={generatedMediaUrl} 
                        alt="Generated media" 
                        className="w-full h-auto object-contain max-h-[400px]"
                      />
                    ) : (
                      <div className="relative w-full aspect-video max-h-[400px]">
                        <img 
                          src={generatedMediaUrl} 
                          alt="Video thumbnail" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-white/90 rounded-full p-4">
                            <Video className="w-8 h-8 text-primary" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Revision Navigation */}
                  <div className="flex items-center justify-center gap-2">
                    {revisions.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handlePreviousRevision}
                          disabled={currentRevisionIndex === 0}
                          className="h-8 w-8"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Revision {currentRevisionIndex + 1} of {revisions.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNextRevision}
                          disabled={currentRevisionIndex === revisions.length - 1}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar (when regenerating) */}
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Regenerating {mediaType}...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Editable Prompt with Regenerate */}
                <div className="space-y-2">
                  <Label htmlFor="edit-prompt">Edit Description</Label>
                  <Textarea
                    id="edit-prompt"
                    placeholder={`Describe the ${mediaType} you want to generate...`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    className="min-h-[80px] resize-none"
                  />
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle} disabled={isGenerating}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INITIAL_STYLES.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          <div className="flex flex-col">
                            <span>{style.name}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Avatar Selection - Only for Video (Optional) */}
                {mediaType === 'video' && (
                  <div className="space-y-2">
                    <Label>Avatar (Optional)</Label>
                    <Select value={selectedAvatar} onValueChange={setSelectedAvatar} disabled={isGenerating}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INITIAL_AVATARS.map((avatar) => (
                          <SelectItem key={avatar.id} value={avatar.id}>
                            <div className="flex flex-col">
                              <span>{avatar.name}</span>
                              <span className="text-xs text-muted-foreground">{avatar.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button
                onClick={handleAddToScene}
                disabled={isGenerating}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add to Scene
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
