import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { 
  AlignLeft, 
  AlignRight, 
  AlignCenter,
  Image,
  LayoutTemplate,
  X,
  Type,
  Plus,
  Trash2,
  GripVertical,
  Circle,
  Hash,
  CheckCircle,
  ArrowRight,
  Layers,
  Edit,
} from "lucide-react";
import { PanDirectionSelector } from "./PanDirectionSelector";
import { Template, ImageEffect, DEFAULT_IMAGE_EFFECTS } from "../types/template";
import { RichTextModal } from "./RichTextModal";
import { BulletListModal } from "./BulletListModal";
import { useState } from "react";

interface MediaParams {
  position: { x: number; y: number };
  scale: number;
  opacity: number;
  fit: 'cover' | 'contain' | 'fill';
  imageEffect: ImageEffect | null;
}

interface TemplateControlsProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template | null) => void;
  onTemplateParamsChange: (params: any) => void;
  mediaParams: MediaParams;
  onMediaParamsChange: (params: MediaParams) => void;
  mediaFile?: string;
  onMediaDelete?: () => void;
}

interface ColorDropdownProps {
  colors: { name: string; value: string }[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  label?: string;
}

function ColorDropdown({ colors, selectedColor, onColorSelect }: ColorDropdownProps) {
  const selectedColorName = colors.find(c => c.value === selectedColor)?.name || "Select color";
  
  return (
    <Select value={selectedColor} onValueChange={onColorSelect}>
      <SelectTrigger className="bg-gray-50 border-gray-200">
        <div className="flex items-center gap-2">
          <div 
            className="w-5 h-5 rounded border border-gray-300 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
          <SelectValue>
            {selectedColorName}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white border-gray-200">
        {colors.map((color) => (
          <SelectItem key={color.value} value={color.value}>
            <div className="flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded border border-gray-300 shadow-sm"
                style={{ backgroundColor: color.value }}
              />
              <span>{color.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface CornerPositionSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

function CornerPositionSelector({ value, onValueChange }: CornerPositionSelectorProps) {
  const positions = [
    { value: 'top-left', arrow: '↖' },
    { value: 'top-right', arrow: '↗' },
    { value: 'bottom-left', arrow: '↙' },
    { value: 'bottom-right', arrow: '↘' },
  ];

  return (
    <div className="inline-flex gap-1.5">
      {positions.map((pos) => (
        <button
          key={pos.value}
          onClick={() => onValueChange(pos.value)}
          className={`w-10 h-10 rounded border-2 transition-all flex items-center justify-center ${
            value === pos.value
              ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'border-gray-300 bg-gray-50 hover:border-primary/60 hover:bg-gray-100'
          }`}
          title={pos.value.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        >
          <span className="text-lg leading-none">{pos.arrow}</span>
        </button>
      ))}
    </div>
  );
}

interface VerticalPositionSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

function VerticalPositionSelector({ value, onValueChange }: VerticalPositionSelectorProps) {
  const positions = [
    { value: 'top', arrow: '↑', label: 'Top' },
    { value: 'bottom', arrow: '↓', label: 'Bottom' },
  ];

  return (
    <div className="inline-flex gap-1.5">
      {positions.map((pos) => (
        <button
          key={pos.value}
          onClick={() => onValueChange(pos.value)}
          className={`w-10 h-10 rounded border-2 transition-all flex items-center justify-center ${
            value === pos.value
              ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'border-gray-300 bg-gray-50 hover:border-primary/60 hover:bg-gray-100'
          }`}
          title={pos.label}
        >
          <span className="text-lg leading-none">{pos.arrow}</span>
        </button>
      ))}
    </div>
  );
}

export function TemplateControls({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onTemplateParamsChange,
  mediaParams,
  onMediaParamsChange,
  mediaFile,
  onMediaDelete,
}: TemplateControlsProps) {
  const [richTextModal, setRichTextModal] = useState<{
    isOpen: boolean;
    fieldKey: string;
    value: string;
    textAlign?: "left" | "center" | "right";
    showTextAlignment: boolean;
  }>({
    isOpen: false,
    fieldKey: "",
    value: "",
    textAlign: "left",
    showTextAlignment: false,
  });

  const [bulletListModal, setBulletListModal] = useState<{
    isOpen: boolean;
    bullets: { id: string; text: string; startTime: number; duration: number }[];
    bulletStyle: string;
    color: string;
    animation: string;
    position: string;
    stacked: boolean;
  }>({
    isOpen: false,
    bullets: [],
    bulletStyle: "disc",
    color: "#4f46e5",
    animation: "fade",
    position: "left",
    stacked: false,
  });

  const updateParam = (key: string, value: any) => {
    if (!selectedTemplate) return;
    onTemplateParamsChange({
      ...selectedTemplate.params,
      [key]: value,
    });
  };

  const updateMediaParam = (key: keyof MediaParams, value: any) => {
    onMediaParamsChange({
      ...mediaParams,
      [key]: value,
    });
  };

  const updateImageEffectParam = (key: string, value: any) => {
    if (!mediaParams.imageEffect) return;
    onMediaParamsChange({
      ...mediaParams,
      imageEffect: {
        ...mediaParams.imageEffect,
        params: {
          ...mediaParams.imageEffect.params,
          [key]: value,
        },
      },
    });
  };

  const colors = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
  ];

  const getBulletIcon = (style: string) => {
    const iconClass = "w-3.5 h-3.5 text-muted-foreground";
    switch (style) {
      case "disc":
        return <Circle className={iconClass} />;
      case "number":
        return <Hash className={iconClass} />;
      case "check":
        return <CheckCircle className={iconClass} />;
      case "arrow":
        return <ArrowRight className={iconClass} />;
      default:
        return <Circle className={iconClass} />;
    }
  };

  const handleRichTextModalOpen = (fieldKey: string, value: string, textAlign?: "left" | "center" | "right", showTextAlignment: boolean = false) => {
    setRichTextModal({
      isOpen: true,
      fieldKey,
      value,
      textAlign,
      showTextAlignment,
    });
  };

  const handleRichTextModalClose = () => {
    setRichTextModal({
      isOpen: false,
      fieldKey: "",
      value: "",
      textAlign: "left",
      showTextAlignment: false,
    });
  };

  const handleRichTextModalSave = (value: string) => {
    updateParam(richTextModal.fieldKey, value);
    handleRichTextModalClose();
  };

  const handleBulletListModalOpen = () => {
    if (!selectedTemplate || selectedTemplate.type !== "bulleted-list") return;
    setBulletListModal({
      isOpen: true,
      bullets: selectedTemplate.params.bullets,
      bulletStyle: selectedTemplate.params.bulletStyle,
      color: selectedTemplate.params.color,
      animation: selectedTemplate.params.animation,
      position: selectedTemplate.params.position,
      stacked: selectedTemplate.params.stacked,
    });
  };

  const handleBulletListModalClose = () => {
    setBulletListModal({
      isOpen: false,
      bullets: [],
      bulletStyle: "disc",
      color: "#4f46e5",
      animation: "fade",
      position: "left",
      stacked: false,
    });
  };

  const handleBulletListModalSave = (bullets: { id: string; text: string; startTime: number; duration: number }[]) => {
    updateParam("bullets", bullets);
    handleBulletListModalClose();
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="media" className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 border-gray-200">
            <TabsTrigger value="media" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Image className="w-4 h-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
              <LayoutTemplate className="w-4 h-4" />
              Template
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Media Tab */}
        <TabsContent value="media" className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-5">
          {/* Media File Display */}
          {mediaFile && (
            <div className="space-y-2.5">
              <Label>Current Media</Label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border-2 border-gray-200">
                <span className="text-sm truncate flex-1 mr-2">
                  {decodeURIComponent(mediaFile.split('/').pop()?.split('?')[0] || 'Unknown file')}
                </span>
                {onMediaDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMediaDelete}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Image Effects */}
            <div className="space-y-2.5">
              <Label>Image Effect</Label>
              <Select
                value={mediaParams.imageEffect?.id || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    updateMediaParam('imageEffect', null);
                  } else {
                    const effect = DEFAULT_IMAGE_EFFECTS.find((e) => e.id === value);
                    if (effect) updateMediaParam('imageEffect', effect);
                  }
                }}
              >
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Choose an effect..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="none">None</SelectItem>
                  {DEFAULT_IMAGE_EFFECTS.map((effect) => (
                    <SelectItem key={effect.id} value={effect.id}>
                      {effect.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mediaParams.imageEffect && (
                <p className="text-sm text-muted-foreground">
                  {mediaParams.imageEffect.description}
                </p>
              )}
            </div>

            {/* Image Effect Parameters */}
            {mediaParams.imageEffect && (
              <>
                <Separator className="bg-gray-200 my-2" />
                <div className="space-y-5">
                  <Label>Effect Parameters</Label>

                  {/* Pan and Zoom Effect Parameters */}
                  {mediaParams.imageEffect.type === "pan-and-zoom" && (
                    <>
                      <div className="space-y-2.5">
                        <Label>Zoom Direction</Label>
                        <RadioGroup 
                          value={mediaParams.imageEffect.params.zoomDirection} 
                          onValueChange={(value) => updateImageEffectParam("zoomDirection", value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="in" id="zoom-in" />
                            <Label htmlFor="zoom-in">Zoom In</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="out" id="zoom-out" />
                            <Label htmlFor="zoom-out">Zoom Out</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center gap-2">
                          <Label>Zoom Percentage</Label>
                          <span className="text-muted-foreground">{mediaParams.imageEffect.params.zoomPercentage}%</span>
                        </div>
                        <Slider
                          value={[mediaParams.imageEffect.params.zoomPercentage]}
                          onValueChange={(values) => updateImageEffectParam("zoomPercentage", values[0])}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Pan Direction</Label>
                        <PanDirectionSelector
                          value={mediaParams.imageEffect.params.panDirection}
                          onChange={(direction) => updateImageEffectParam("panDirection", direction)}
                          invertArrows={mediaParams.imageEffect.params.zoomDirection === "out"}
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template" className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-5">
            {/* Template Selection */}
            <div className="space-y-2.5">
              <Label>Select Template</Label>
            <Select
              value={selectedTemplate?.id || "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  onTemplateSelect(null);
                } else {
                  const template = templates.find((t) => t.id === value);
                  if (template) onTemplateSelect(template);
                }
              }}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="none">None</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            {!selectedTemplate && (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No template selected</p>
                <p className="text-sm text-muted-foreground mt-1">Choose a template to add overlays to your scene</p>
              </div>
            )}

            {selectedTemplate && (
              <>
                <Separator className="bg-gray-200 my-2" />

                {/* Template-specific Parameters */}
                <div className="space-y-5">
                  <Label>Template Parameters</Label>

                  {/* Text Overlay Parameters */}
                  {selectedTemplate.type === "text-overlay" && (
                    <>
                      <div className="space-y-2.5">
                        <Label>Placement</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedTemplate.params.placement === "left" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => updateParam("placement", "left")}
                        >
                          <AlignLeft className="w-4 h-4" />
                          Left
                        </Button>
                        <Button
                          variant={selectedTemplate.params.placement === "right" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => updateParam("placement", "right")}
                        >
                          <AlignRight className="w-4 h-4" />
                          Right
                        </Button>
                      </div>
                    </div>

                      <div className="space-y-2.5">
                        <Label>Color</Label>
                        <ColorDropdown
                          colors={colors}
                          selectedColor={selectedTemplate.params.color}
                          onColorSelect={(color) => updateParam("color", color)}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between">
                          <Label>Opacity</Label>
                          <span className="text-muted-foreground">{Math.round(selectedTemplate.params.opacity * 100)}%</span>
                        </div>
                        <Slider
                          value={[selectedTemplate.params.opacity * 100]}
                          onValueChange={(values) => updateParam("opacity", values[0] / 100)}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label>Text</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRichTextModalOpen("text", selectedTemplate.params.text, selectedTemplate.params.textAlign, true)}
                          >
                            <Type className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={selectedTemplate.params.text.replace(/<[^>]*>/g, '')}
                          onChange={(e) => updateParam("text", e.target.value)}
                          placeholder="Overlay text..."
                          className="bg-white border-white/40 min-h-[80px] resize-none shadow-md border-2 hover:border-sky-300 focus:border-sky-400 focus:shadow-lg transition-all"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Text Alignment</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedTemplate.params.textAlign === "left" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => updateParam("textAlign", "left")}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedTemplate.params.textAlign === "center" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => updateParam("textAlign", "center")}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedTemplate.params.textAlign === "right" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => updateParam("textAlign", "right")}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                      </div>
                    </>
                  )}

                  {/* Lower Third Parameters */}
                  {selectedTemplate.type === "lower-third" && (
                    <>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label>Title</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRichTextModalOpen("title", selectedTemplate.params.title)}
                          >
                            <Type className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={selectedTemplate.params.title.replace(/<[^>]*>/g, '')}
                          onChange={(e) => updateParam("title", e.target.value)}
                          placeholder="Main title..."
                          className="bg-white border-white/40 min-h-[60px] resize-none shadow-md border-2 hover:border-sky-300 focus:border-sky-400 focus:shadow-lg transition-all"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label>Subtitle</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRichTextModalOpen("subtitle", selectedTemplate.params.subtitle)}
                          >
                            <Type className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={selectedTemplate.params.subtitle.replace(/<[^>]*>/g, '')}
                          onChange={(e) => updateParam("subtitle", e.target.value)}
                          placeholder="Subtitle or description..."
                          className="bg-white border-white/40 min-h-[60px] resize-none shadow-md border-2 hover:border-sky-300 focus:border-sky-400 focus:shadow-lg transition-all"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Color</Label>
                        <ColorDropdown
                          colors={colors}
                          selectedColor={selectedTemplate.params.color}
                          onColorSelect={(color) => updateParam("color", color)}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Position</Label>
                        <VerticalPositionSelector
                          value={selectedTemplate.params.position}
                          onValueChange={(value) => updateParam("position", value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Split Screen Parameters */}
                  {selectedTemplate.type === "split-screen" && (
                    <>
                      <div className="space-y-2.5">
                        <div className="flex justify-between">
                          <Label>Split Ratio</Label>
                          <span className="text-muted-foreground">{selectedTemplate.params.splitRatio}%</span>
                        </div>
                        <Slider
                          value={[selectedTemplate.params.splitRatio]}
                          onValueChange={(values) => updateParam("splitRatio", values[0])}
                          min={20}
                          max={80}
                          step={5}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Left Color</Label>
                        <ColorDropdown
                          colors={colors}
                          selectedColor={selectedTemplate.params.leftColor}
                          onColorSelect={(color) => updateParam("leftColor", color)}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label>Left Text</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRichTextModalOpen("leftText", selectedTemplate.params.leftText)}
                          >
                            <Type className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={selectedTemplate.params.leftText.replace(/<[^>]*>/g, '')}
                          onChange={(e) => updateParam("leftText", e.target.value)}
                          placeholder="Left side text..."
                          className="bg-white border-white/40 min-h-[60px] resize-none"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Right Color</Label>
                        <ColorDropdown
                          colors={colors}
                          selectedColor={selectedTemplate.params.rightColor}
                          onColorSelect={(color) => updateParam("rightColor", color)}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label>Right Text</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRichTextModalOpen("rightText", selectedTemplate.params.rightText)}
                          >
                            <Type className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={selectedTemplate.params.rightText.replace(/<[^>]*>/g, '')}
                          onChange={(e) => updateParam("rightText", e.target.value)}
                          placeholder="Right side text..."
                          className="bg-white border-white/40 min-h-[60px] resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Corner Badge Parameters */}
                  {selectedTemplate.type === "corner-badge" && (
                    <>
                      <div className="space-y-2.5">
                        <Label>Corner Position</Label>
                        <CornerPositionSelector
                          value={selectedTemplate.params.corner}
                          onValueChange={(value) => updateParam("corner", value)}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Color</Label>
                        <ColorDropdown
                          colors={colors}
                          selectedColor={selectedTemplate.params.color}
                          onColorSelect={(color) => updateParam("color", color)}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label>Text</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRichTextModalOpen("text", selectedTemplate.params.text)}
                          >
                            <Type className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={selectedTemplate.params.text.replace(/<[^>]*>/g, '')}
                          onChange={(e) => updateParam("text", e.target.value)}
                          placeholder="Badge text..."
                          className="bg-white border-white/40 min-h-[60px] resize-none"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Size</Label>
                        <RadioGroup
                          value={selectedTemplate.params.size}
                          onValueChange={(value) => updateParam("size", value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="small" id="small" />
                            <Label htmlFor="small">Small</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="medium" id="medium" />
                            <Label htmlFor="medium">Medium</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="large" id="large" />
                            <Label htmlFor="large">Large</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </>
                  )}

                  {/* Full Screen Parameters */}
                  {selectedTemplate.type === "full-screen" && (
                    <>
                      <div className="space-y-2.5">
                        <Label>Background Color</Label>
                        <ColorDropdown
                          colors={colors}
                          selectedColor={selectedTemplate.params.backgroundColor}
                          onColorSelect={(color) => updateParam("backgroundColor", color)}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between">
                          <Label>Opacity</Label>
                          <span className="text-muted-foreground">{Math.round(selectedTemplate.params.opacity * 100)}%</span>
                        </div>
                        <Slider
                          value={[selectedTemplate.params.opacity * 100]}
                          onValueChange={(values) => updateParam("opacity", values[0] / 100)}
                          max={100}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label>Text</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRichTextModalOpen("text", selectedTemplate.params.text, selectedTemplate.params.textAlign, true)}
                          >
                            <Type className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Textarea
                          value={selectedTemplate.params.text.replace(/<[^>]*>/g, '')}
                          onChange={(e) => updateParam("text", e.target.value)}
                          placeholder="Full screen text..."
                          className="bg-white border-white/40 min-h-[80px] resize-none shadow-md border-2 hover:border-sky-300 focus:border-sky-400 focus:shadow-lg transition-all"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label>Text Alignment</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedTemplate.params.textAlign === "left" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => updateParam("textAlign", "left")}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedTemplate.params.textAlign === "center" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => updateParam("textAlign", "center")}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={selectedTemplate.params.textAlign === "right" ? "default" : "outline"}
                          className="flex-1 gap-2"
                          onClick={() => updateParam("textAlign", "right")}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                      </div>
                    </>
                  )}

                  {/* Bulleted List Parameters */}
                  {selectedTemplate.type === "bulleted-list" && (
                    <>
                      {/* Bullet Style and Position in same row */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-2.5">
                          <Label>Bullet Style</Label>
                          <Select
                            value={selectedTemplate.params.bulletStyle}
                            onValueChange={(value) => updateParam("bulletStyle", value)}
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                              <SelectItem value="disc">
                                <div className="flex items-center gap-2">
                                  <Circle className="w-3.5 h-3.5" />
                                  <span>Disc</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="number">
                                <div className="flex items-center gap-2">
                                  <Hash className="w-3.5 h-3.5" />
                                  <span>Number</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="check">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Checkmark</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="arrow">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  <span>Arrow</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2.5">
                          <Label>Position</Label>
                          <div className="flex gap-1">
                            <Button
                              variant={selectedTemplate.params.position === "left" ? "default" : "outline"}
                              className="flex-1 px-2"
                              onClick={() => updateParam("position", "left")}
                            >
                              <AlignLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={selectedTemplate.params.position === "center" ? "default" : "outline"}
                              className="flex-1 px-2"
                              onClick={() => updateParam("position", "center")}
                            >
                              <AlignCenter className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={selectedTemplate.params.position === "right" ? "default" : "outline"}
                              className="flex-1 px-2"
                              onClick={() => updateParam("position", "right")}
                            >
                              <AlignRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Color and Animation in same row */}
                      <div className="flex gap-2.5">
                        <div className="space-y-2.5 w-24">
                          <Label>Color</Label>
                          <Select
                            value={selectedTemplate.params.color}
                            onValueChange={(value) => updateParam("color", value)}
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <div 
                                className="w-4 h-4 rounded border border-gray-300 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: selectedTemplate.params.color }}
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                              {colors.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded border border-gray-300 shadow-sm"
                                      style={{ backgroundColor: color.value }}
                                    />
                                    <span>{color.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2.5 flex-1">
                          <Label>Animation</Label>
                          <Select
                            value={selectedTemplate.params.animation}
                            onValueChange={(value) => updateParam("animation", value)}
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                              <SelectItem value="fade">Fade</SelectItem>
                              <SelectItem value="slide-up">Slide Up</SelectItem>
                              <SelectItem value="slide-left">Slide Left</SelectItem>
                              <SelectItem value="scale">Scale</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <Label>Display Mode</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={selectedTemplate.params.stacked ? "default" : "outline"}
                            className="flex-1 gap-2"
                            onClick={() => updateParam("stacked", true)}
                          >
                            <Layers className="w-4 h-4" />
                            Stacked
                          </Button>
                          <Button
                            variant={!selectedTemplate.params.stacked ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => updateParam("stacked", false)}
                          >
                            Single
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedTemplate.params.stacked 
                            ? "Bullets accumulate and remain visible" 
                            : "Only one bullet shows at a time"}
                        </p>
                      </div>

                      <Separator className="bg-gray-200" />

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label>Bullet Points ({selectedTemplate.params.bullets.length})</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulletListModalOpen}
                            className="gap-1.5 h-8"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit Bullets
                          </Button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {selectedTemplate.params.bullets.map((bullet: any, index: number) => (
                            <div
                              key={bullet.id}
                              className="p-3 rounded-lg bg-white border-2 border-gray-200 cursor-pointer hover:border-primary/30 transition-colors"
                              onClick={handleBulletListModalOpen}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-1">
                                  {getBulletIcon(selectedTemplate.params.bulletStyle)}
                                </div>
                                <div className="flex-1 min-h-[40px]">
                                  {bullet.text ? (
                                    <div 
                                      className="text-sm prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: bullet.text }}
                                    />
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                      Empty bullet point {index + 1}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {selectedTemplate.params.bullets.length === 0 && (
                            <div 
                              className="py-12 text-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={handleBulletListModalOpen}
                            >
                              <p className="text-sm text-muted-foreground">No bullet points yet</p>
                              <p className="text-xs text-muted-foreground mt-1">Click "Edit Bullets" or click here to get started</p>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Drag bullets on the timeline to adjust timing
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <RichTextModal
        open={richTextModal.isOpen}
        onOpenChange={(open) => {
          if (!open) handleRichTextModalClose();
        }}
        value={richTextModal.value}
        onSave={handleRichTextModalSave}
        textAlign={richTextModal.textAlign}
        onTextAlignChange={(align) => updateParam("textAlign", align)}
        showTextAlignment={richTextModal.showTextAlignment}
      />
      <BulletListModal
        open={bulletListModal.isOpen}
        onOpenChange={(open) => {
          if (!open) handleBulletListModalClose();
        }}
        bullets={bulletListModal.bullets}
        bulletStyle={selectedTemplate?.params.bulletStyle || "disc"}
        onSave={handleBulletListModalSave}
      />
    </div>
  );
}