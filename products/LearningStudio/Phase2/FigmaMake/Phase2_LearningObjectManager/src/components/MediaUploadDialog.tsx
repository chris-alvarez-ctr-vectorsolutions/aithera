import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaSelect: (url: string) => void;
}

const STYLE_OPTIONS = [
  { value: "professional", label: "Professional", description: "Clear and authoritative" },
  { value: "creative", label: "Creative", description: "Artistic and expressive" },
  { value: "minimal", label: "Minimal", description: "Simple and clean" },
  { value: "vibrant", label: "Vibrant", description: "Bold and colorful" },
];

export function MediaUploadDialog({ open, onOpenChange, onMediaSelect }: MediaUploadDialogProps) {
  const [activeTab, setActiveTab] = useState("custom");
  const [uploadUrl, setUploadUrl] = useState("");
  const [generateDescription, setGenerateDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("professional");

  const handleUpload = () => {
    if (!uploadUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    onMediaSelect(uploadUrl);
    setUploadUrl("");
    onOpenChange(false);
    toast.success("Image added successfully");
  };

  const handleGenerate = () => {
    if (!generateDescription.trim()) {
      toast.error("Please enter a description");
      return;
    }
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Generating image...",
        success: () => {
          // Mock generated image
          onMediaSelect("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=600&fit=crop");
          setGenerateDescription("");
          onOpenChange(false);
          return "Image generated successfully";
        },
        error: "Failed to generate image",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-500" />
            Add Media
          </DialogTitle>
          <DialogDescription>
            Upload your own media, choose from stock images, or generate with AI
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[rgba(240,249,255,0.6)] h-9">
            <TabsTrigger value="custom" className="data-[state=active]:bg-white data-[state=active]:text-sky-500 data-[state=active]:shadow-sm">
              Custom Media
            </TabsTrigger>
            <TabsTrigger value="stock" className="data-[state=active]:bg-white data-[state=active]:text-sky-500 data-[state=active]:shadow-sm">
              Stock Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-6 mt-6">
            {/* Upload Section */}
            <div className="space-y-2">
              <Label>Upload Your Image</Label>
              <div 
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-slate-400 transition-colors cursor-pointer"
                onClick={() => {
                  const url = prompt("Enter image URL:");
                  if (url) setUploadUrl(url);
                }}
              >
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Click to upload an image</p>
                    <p className="text-sm text-muted-foreground mt-1">Upload an existing image to edit or animate</p>
                  </div>
                </div>
              </div>
              {uploadUrl && (
                <div className="mt-3">
                  <img src={uploadUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground">Or generate with AI</span>
              </div>
            </div>

            {/* AI Generation */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={generateDescription}
                  onChange={(e) => setGenerateDescription(e.target.value)}
                  placeholder='Describe the image you want to generate... (e.g., "A futuristic cityscape at sunset with flying cars")'
                  className="min-h-[100px] resize-none bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Style</Label>
                <div className="flex gap-2">
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger className="flex-1 bg-white/50">
                      <SelectValue>
                        <div className="text-left">
                          <div className="font-medium">{STYLE_OPTIONS.find(s => s.value === selectedStyle)?.label}</div>
                          <div className="text-xs text-muted-foreground">{STYLE_OPTIONS.find(s => s.value === selectedStyle)?.description}</div>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_OPTIONS.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-xs text-muted-foreground">{style.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>Stock media coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === "custom" && (
            uploadUrl ? (
              <Button onClick={handleUpload}>
                Add Image
              </Button>
            ) : (
              <Button onClick={handleGenerate} disabled={!generateDescription.trim()}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
