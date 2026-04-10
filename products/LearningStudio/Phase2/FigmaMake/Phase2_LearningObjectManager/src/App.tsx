import { GenerateMediaDialog } from "./components/GenerateMediaDialog";
import { GenerateAllAudioDialog } from "./components/GenerateAllAudioDialog";
import { QuestionBuilder } from "./components/QuestionBuilder";
import { CitationEditor } from "./components/CitationEditor";
import { DraggableSceneCard } from "./components/DraggableSceneCard";
import { SceneCard } from "./components/SceneCard";
import { DraggableSceneThumbnail } from "./components/DraggableSceneThumbnail";
import { SceneThumbnail } from "./components/SceneThumbnail";
import { PreviewCanvas } from "./components/PreviewCanvas";
import { TemplateControls } from "./components/TemplateControls";
import { TimelinePanel } from "./components/TimelinePanel";
import { FlowMapCanvas } from "./components/FlowMapCanvas";
import WizardHeader from "./components/WizardHeader";
import LeftSidebar from "./components/LeftSidebar";
import { ScrollArea } from "./components/ui/scroll-area";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Textarea } from "./components/ui/textarea";
import { Input } from "./components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { Upload, Image, Sparkles, Plus, ChevronLeft, ChevronRight, LayoutTemplate, CheckCircle, Circle, PanelLeftClose, PanelLeftOpen, AlignLeft, Image as ImageIcon, Play, FileText, Rows3, Trash2, Search, X, Clock, Edit2, Copy, CircleDot, CheckSquare, CircleHelp, Link2, MoreVertical, GripVertical } from "lucide-react";
import { Template, DEFAULT_TEMPLATES, ImageEffect, DEFAULT_IMAGE_EFFECTS } from "./types/template";
import { Toaster } from "./components/ui/sonner";
import { useState, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Resizable } from "re-resizable";
import { StockModal } from "./components/StockModal";
import { VideoUploadDialog } from "./components/VideoUploadDialog";
import { toast } from "sonner@2.0.3";

interface MediaParams {
  position: { x: number; y: number };
  scale: number;
  opacity: number;
  fit: 'cover' | 'contain' | 'fill';
  imageEffect: ImageEffect | null;
}

interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  startTime: number;
  duration: number;
  params: MediaParams;
}

interface Scene {
  id: number;
  title: string;
  transcript: string;
  previewImage: string;
  template: Template | null;
  mediaParams: MediaParams;
  duration: number; // Duration in seconds
  completed: boolean;
  status: "in-progress" | "in-review" | "ready"; // Scene status
  videoFile: string | null;
  audioFile: string | null;
  avatarId?: string | null; // Avatar used for presenter-led scenes
  mediaFiles?: MediaFile[]; // Array of additional media files
}

interface LearningObject {
  id: number;
  title: string;
  objective: string;
  isCompleted: boolean;
  scenes: Scene[];
}

interface Section {
  id: number;
  title: string;
  learningObjects: LearningObject[];
}

interface Citation {
  id: number;
  text: string;
}

type QuestionType = "single-choice" | "multiple-choice" | "true-false" | "matching";

interface AnswerOption {
  id: string;
  text: string;
  image?: string;
  isCorrect: boolean;
  feedback?: string;
}

interface MatchingPair {
  id: string;
  left: string;
  leftImage?: string;
  right: string;
  rightImage?: string;
}

interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  questionImage?: string;
  answers?: AnswerOption[];
  matchingPairs?: MatchingPair[];
}

const QUESTION_TYPE_CONFIG = {
  "single-choice": {
    label: "Single Choice",
    icon: CircleDot,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    description: "One correct answer"
  },
  "multiple-choice": {
    label: "Multiple Choice",
    icon: CheckSquare,
    color: "bg-green-100 text-green-700 border-green-200",
    description: "Multiple correct answers"
  },
  "true-false": {
    label: "True/False",
    icon: CircleHelp,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    description: "True or false question"
  },
  "matching": {
    label: "Matching",
    icon: Link2,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    description: "Match pairs of items"
  }
};

export default function App() {
  // Helper function to format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const defaultMediaParams: MediaParams = {
    position: { x: 0, y: 0 },
    scale: 1,
    opacity: 1,
    fit: 'cover',
    imageEffect: null
  };

  const initialSections: Section[] = [
    {
      id: 1,
      title: "Getting Started",
      learningObjects: [
        {
          id: 1,
          title: "Introduction to Video Creation",
          objective: "Learn how to create professional video content using AI-powered tools and templates to enhance your content strategy and engage your audience effectively.",
          isCompleted: false,
          scenes: [
        {
          id: 1,
          title: "Scene 1",
          transcript: "Welcome to our presentation. Today we'll be discussing the future of video creation and how AI is transforming the industry.",
          previewImage: "https://images.unsplash.com/photo-1764663908321-495a7145ad3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwdmlkZW8lMjBwcm9kdWN0aW9ufGVufDF8fHx8MTc2NTQ2MzcyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[0],
          mediaParams: defaultMediaParams,
          duration: 5,
          completed: false,
          status: "in-progress",
          videoFile: null,
          audioFile: null,
        },
        {
          id: 2,
          title: "Scene 2",
          transcript: "Our platform offers three main advantages: speed, quality, and ease of use. Let's explore each of these in detail.",
          previewImage: "https://images.unsplash.com/photo-1764663908343-f0ec582a527a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW50JTIwY3JlYXRpb24lMjB0b29sc3xlbnwxfHx8fDE3NjU0NjM3Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[1],
          mediaParams: defaultMediaParams,
          duration: 7,
          completed: false,
          status: "in-review",
          videoFile: null,
          audioFile: null,
          avatarId: "avatar1", // Presenter-led scene with Alex avatar
        },
        {
          id: 3,
          title: "Scene 3",
          transcript: "Work seamlessly with your team. Share projects, get feedback, and iterate faster than ever before.",
          previewImage: "https://images.unsplash.com/photo-1758873272921-4b64aef3c32b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHRlYW0lMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY1NDI2MzQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[0],
          mediaParams: defaultMediaParams,
          duration: 6,
          completed: false,
          status: "ready",
          videoFile: null,
          audioFile: null,
        },
        {
          id: 4,
          title: "Scene 4",
          transcript: "Thank you for watching. Start creating professional videos today and transform your content strategy.",
          previewImage: "https://images.unsplash.com/photo-1627244714766-94dab62ed964?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGVkaXRpbmclMjBzdHVkaW98ZW58MXx8fHwxNzY1NDYzNzI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[2],
          mediaParams: defaultMediaParams,
          duration: 4,
          completed: false,
          status: "in-progress",
          videoFile: null,
          audioFile: null,
          avatarId: "avatar2", // Presenter-led scene with Jordan avatar
        },
      ]
        },
      ]
    },
    {
      id: 2,
      title: "Advanced Techniques",
      learningObjects: [
        {
          id: 2,
          title: "Advanced Template Customization",
          objective: "Master advanced template techniques including text overlays, lower thirds, and full screen overlays to create professional-grade video content.",
          isCompleted: false,
          scenes: [
        {
          id: 5,
          title: "Scene 1",
          transcript: "Welcome to advanced template customization. In this module, we'll explore how to leverage templates for maximum visual impact.",
          previewImage: "https://images.unsplash.com/photo-1695634183046-fc26d69149ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwdGVtcGxhdGVzfGVufDF8fHx8MTc2NTQ2MzcyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[1],
          mediaParams: defaultMediaParams,
          duration: 6,
          completed: false,
          status: "ready",
          videoFile: null,
          audioFile: null,
        },
        {
          id: 6,
          title: "Scene 2",
          transcript: "Split-screen layouts allow you to display multiple elements simultaneously, perfect for before-and-after comparisons or feature showcases.",
          previewImage: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMGVkaXRpbmclMjB0aW1lbGluZXxlbnwxfHx8fDE3NjU0NjM3Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[0],
          mediaParams: defaultMediaParams,
          duration: 8,
          completed: false,
          status: "in-progress",
          videoFile: null,
          audioFile: null,
        },
        {
          id: 7,
          title: "Scene 3",
          transcript: "Corner badges are excellent for branding, adding episode numbers, or displaying important information without obstructing your main content.",
          previewImage: "https://images.unsplash.com/photo-1604727199378-bf5dd08726ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYnJhbmRpbmclMjBkZXNpZ258ZW58MXx8fHwxNzY1NDAyMTIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[1],
          mediaParams: defaultMediaParams,
          duration: 7,
          completed: false,
          status: "in-review",
          videoFile: null,
          audioFile: null,
        },
      ]
        },
        {
          id: 3,
          title: "AI-Powered Media Generation",
          objective: "Discover how to leverage AI tools for generating images, videos, and audio content to streamline your video creation workflow.",
          isCompleted: false,
          scenes: [
        {
          id: 8,
          title: "Scene 1",
          transcript: "AI-powered media generation opens up new possibilities for content creators. Let's explore how you can use these tools effectively.",
          previewImage: "https://images.unsplash.com/photo-1764664281863-f736f2d942bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMGNvbnRlbnQlMjBjcmVhdGlvbnxlbnwxfHx8fDE3NjU0NjM3Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[2],
          mediaParams: defaultMediaParams,
          duration: 6,
          completed: false,
          status: "ready",
          videoFile: null,
          audioFile: null,
        },
        {
          id: 9,
          title: "Scene 2",
          transcript: "Generate stunning visuals with AI image generation. Simply describe what you need, and let the AI create professional-quality images.",
          previewImage: "https://images.unsplash.com/photo-1763931504269-d66c27e8c5f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwY3JlYXRpb258ZW58MXx8fHwxNzY1MzkxMjk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
          template: DEFAULT_TEMPLATES[0],
          mediaParams: defaultMediaParams,
          duration: 7,
          completed: false,
          status: "in-progress",
          videoFile: null,
          audioFile: null,
        },
      ]
        }
      ]
    }
  ];

  const [sections, setSections] = useState<Section[]>(initialSections);
  const [currentSectionId, setCurrentSectionId] = useState(1);
  const [currentLearningObjectId, setCurrentLearningObjectId] = useState(1);
  
  const currentSection = sections.find(s => s.id === currentSectionId) || sections[0];
  const allLearningObjects = sections.flatMap(s => s.learningObjects);
  const currentLearningObject = allLearningObjects.find(lo => lo.id === currentLearningObjectId) || allLearningObjects[0];
  const [activeTab, setActiveTab] = useState("scenes");
  const [activePanel, setActivePanel] = useState<string | null>("scenes");
  const [scenes, setScenes] = useState<Scene[]>(currentLearningObject.scenes);

  const [activeSceneId, setActiveSceneId] = useState(currentLearningObject.scenes[0]?.id || 1);
  const [stockModalOpen, setStockModalOpen] = useState(false);

  // Citations state
  const [citations, setCitations] = useState<Citation[]>([
    { id: 1, text: "Smith, J. (2023). The Future of Video Production: AI and Automation. Journal of Media Technology, 45(3), 234-256." },
    { id: 2, text: "Johnson, M. & Lee, S. (2024). Transforming Content Creation with Artificial Intelligence. Digital Media Quarterly, 12(1), 78-95." },
    { id: 3, text: "Brown, A. (2023). Video Editing in the Modern Age. New York: Media Press." },
    { id: 4, text: "Williams, K. (2024). AI-Powered Media Generation: Best Practices and Case Studies. Retrieved from https://www.contentcreationresearch.org/ai-media" },
  ]);
  const [editingCitation, setEditingCitation] = useState<Citation | null>(null);

  // Questions state
  const [knowledgeCheckQuestions, setKnowledgeCheckQuestions] = useState<Question[]>([]);
  const [assessmentQuestions, setAssessmentQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<{ type: 'knowledge-check' | 'assessment'; question?: Question } | null>(null);
  
  // Flow Map state
  const [isFlowMapOpen, setIsFlowMapOpen] = useState(false);

  // Sync scenes back to learning objects whenever scenes change
  useEffect(() => {
    setSections(sections.map(section => ({
      ...section,
      learningObjects: section.learningObjects.map(lo => 
        lo.id === currentLearningObjectId 
          ? { ...lo, scenes } 
          : lo
      )
    })));
  }, [scenes]);

  // Sync bulleted list template bullets with timeline items
  useEffect(() => {
    const activeScene = scenes.find(s => s.id === activeSceneId);
    if (activeScene?.template?.type === 'bulleted-list') {
      const template = activeScene.template;
      const bulletTimelineItems = template.params.bullets.map((bullet: any, index: number) => ({
        id: `bullet-${bullet.id}`,
        type: 'text' as const,
        content: bullet.text,
        startTime: bullet.startTime,
        duration: bullet.duration,
        track: index, // Each bullet gets its own track
        transitionIn: template.params.animation as any,
        transitionOut: template.params.animation as any,
        transitionDuration: 0.3,
      }));
      
      // Only update if the timeline items are different
      const currentBulletItems = timelineItems.filter(item => item.id.startsWith('bullet-'));
      const hasChanged = bulletTimelineItems.length !== currentBulletItems.length ||
        bulletTimelineItems.some((item, idx) => {
          const current = currentBulletItems[idx];
          return !current || 
            current.content !== item.content ||
            current.startTime !== item.startTime ||
            current.duration !== item.duration;
        });
      
      if (hasChanged) {
        // Remove old bullet items and add new ones
        const nonBulletItems = timelineItems.filter(item => !item.id.startsWith('bullet-'));
        setTimelineItems([...nonBulletItems, ...bulletTimelineItems]);
      }
    } else {
      // Remove bullet items if template is not bulleted-list
      const nonBulletItems = timelineItems.filter(item => !item.id.startsWith('bullet-'));
      if (nonBulletItems.length !== timelineItems.length) {
        setTimelineItems(nonBulletItems);
      }
    }
  }, [activeSceneId, scenes]);

  // Sync scene elements (media, template, audio) with timeline items
  useEffect(() => {
    const activeScene = scenes.find(s => s.id === activeSceneId);
    if (!activeScene) return;

    const sceneItems = [];
    
    // Individual media files from the scene
    if (activeScene.mediaFiles && activeScene.mediaFiles.length > 0) {
      activeScene.mediaFiles.forEach((mediaFile) => {
        sceneItems.push({
          id: `media-${mediaFile.id}`,
          type: 'media' as const,
          content: mediaFile.name,
          startTime: mediaFile.startTime,
          duration: mediaFile.duration,
          track: 0,
        });
      });
    } else if (activeScene.previewImage) {
      // Fallback to background media if no individual media files
      sceneItems.push({
        id: 'scene-media',
        type: 'media' as const,
        content: 'Background Media',
        startTime: 0,
        duration: activeScene.duration,
        track: 0,
      });
    }
    
    // Template item (if template is selected)
    if (activeScene.template) {
      sceneItems.push({
        id: 'scene-template',
        type: 'template' as const,
        content: activeScene.template.name,
        startTime: 0,
        duration: activeScene.duration,
        track: 0,
      });
    }
    
    // Audio item (if audio exists)
    if (activeScene.audioFile) {
      sceneItems.push({
        id: 'scene-audio',
        type: 'audio' as const,
        content: 'Scene Audio',
        startTime: 0,
        duration: activeScene.duration,
        track: 0,
      });
    }
    
    // Keep bullet items from the separate sync
    const bulletItems = timelineItems.filter(item => item.id.startsWith('bullet-'));
    setTimelineItems([...sceneItems, ...bulletItems]);
  }, [activeSceneId, scenes]);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [templatePanelCollapsed, setTemplatePanelCollapsed] = useState(false);
  const [transcriptPanelCollapsed, setTranscriptPanelCollapsed] = useState(false);
  const [transcriptPanelWidth, setTranscriptPanelWidth] = useState(450);
  const [transcriptView, setTranscriptView] = useState<'text' | 'media'>('text');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPreviewScene, setCurrentPreviewScene] = useState(0);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [questionMatchCount, setQuestionMatchCount] = useState(0);
  
  const filteredScenes = searchQuery 
    ? scenes.filter(scene => 
        scene.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (scene.previewImage && scene.previewImage.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : scenes;

  // Timeline state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineItems, setTimelineItems] = useState<Array<{
    id: string;
    type: "text" | "graphic" | "media" | "template" | "audio";
    content: string;
    startTime: number;
    duration: number;
    track: number;
    transitionIn?: "none" | "fade" | "dissolve" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "wipe";
    transitionOut?: "none" | "fade" | "dissolve" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "wipe";
    transitionDuration?: number;
  }>>([]);
  
  // Selected timeline element for properties panel
  const [selectedTimelineItemId, setSelectedTimelineItemId] = useState<string | null>(null);

  const moveScene = useCallback((dragIndex: number, hoverIndex: number) => {
    setScenes((prevScenes) => {
      const newScenes = [...prevScenes];
      const draggedScene = newScenes[dragIndex];
      newScenes.splice(dragIndex, 1);
      newScenes.splice(hoverIndex, 0, draggedScene);
      return newScenes;
    });
  }, []);

  const activeMatchCount = activeTab === 'scenes' ? filteredScenes.length : questionMatchCount;

  const handleTranscriptChange = (sceneId: number, transcript: string) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, transcript } : scene
      )
    );
  };

  const handleTemplateSelect = (template: Template | null) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId ? { ...scene, template } : scene
      )
    );
  };

  const handleTemplateParamsChange = (params: any) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId && scene.template
          ? { ...scene, template: { ...scene.template, params } }
          : scene
      )
    );
  };

  const handleStockImageSelect = (imageUrl: string) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId ? { ...scene, previewImage: imageUrl } : scene
      )
    );
  };

  const handleMediaUpload = (mediaUrl: string, transcript?: string) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId 
          ? { 
              ...scene, 
              previewImage: mediaUrl,
              ...(transcript && { transcript })
            } 
          : scene
      )
    );
  };

  const handleMediaGenerated = (url: string, type: 'image' | 'video') => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId 
          ? { ...scene, previewImage: url } 
          : scene
      )
    );
  };

  const handleMediaParamsChange = (params: MediaParams) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId ? { ...scene, mediaParams: params } : scene
      )
    );
  };

  const handleMediaDelete = () => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId 
          ? { ...scene, previewImage: "" } 
          : scene
      )
    );
  };

  const handleToggleSceneComplete = (sceneId: number) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === sceneId 
          ? { ...scene, completed: !scene.completed } 
          : scene
      )
    );
  };

  const handleSceneStatusChange = (sceneId: number, status: "in-progress" | "in-review" | "ready") => {
    setScenes(
      scenes.map((scene) =>
        scene.id === sceneId 
          ? { ...scene, status } 
          : scene
      )
    );
  };

  const handleAddSceneBefore = (sceneId: number) => {
    const newSceneId = Math.max(...scenes.map(s => s.id)) + 1;
    const newScene: Scene = {
      id: newSceneId,
      title: `Scene ${newSceneId}`,
      transcript: "",
      previewImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYxNTI5NTM2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      template: null,
      mediaParams: defaultMediaParams,
      duration: 5,
      completed: false,
      status: "in-progress",
      videoFile: null,
      audioFile: null,
    };
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    const newScenes = [...scenes];
    newScenes.splice(sceneIndex, 0, newScene);
    setScenes(newScenes);
    setActiveSceneId(newSceneId);
  };

  const handleAddSceneAfter = (sceneId: number) => {
    const newSceneId = Math.max(...scenes.map(s => s.id)) + 1;
    const newScene: Scene = {
      id: newSceneId,
      title: `Scene ${newSceneId}`,
      transcript: "",
      previewImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYxNTI5NTM2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      template: null,
      mediaParams: defaultMediaParams,
      duration: 5,
      completed: false,
      status: "in-progress",
      videoFile: null,
      audioFile: null,
    };
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    const newScenes = [...scenes];
    newScenes.splice(sceneIndex + 1, 0, newScene);
    setScenes(newScenes);
    setActiveSceneId(newSceneId);
  };

  const handleDeleteScene = (sceneId: number) => {
    if (scenes.length <= 1) {
      // Don't delete if it's the last scene
      return;
    }
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    const newScenes = scenes.filter(s => s.id !== sceneId);
    setScenes(newScenes);
    
    // Update active scene if we deleted the active one
    if (sceneId === activeSceneId) {
      // Set to the previous scene, or the next one if we deleted the first
      const newActiveScene = newScenes[Math.max(0, sceneIndex - 1)];
      setActiveSceneId(newActiveScene.id);
    }
  };

  const handleMoveSceneTo = (sceneId: number, targetIndex: number) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === targetIndex) return;
    
    const newScenes = [...scenes];
    const [movedScene] = newScenes.splice(sceneIndex, 1);
    newScenes.splice(targetIndex, 0, movedScene);
    setScenes(newScenes);
  };

  const handleAddScene = () => {
    const newSceneId = Math.max(...scenes.map(s => s.id)) + 1;
    const newScene: Scene = {
      id: newSceneId,
      title: `Scene ${newSceneId}`,
      transcript: "",
      previewImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYxNTI5NTM2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      template: DEFAULT_TEMPLATES[0],
      mediaParams: defaultMediaParams,
      duration: 5,
    };
    setScenes([...scenes, newScene]);
    setActiveSceneId(newSceneId);
  };

  // Calculate total duration
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  const handleToggleComplete = () => {
    setSections(sections.map(section => ({
      ...section,
      learningObjects: section.learningObjects.map(lo => 
        lo.id === currentLearningObjectId 
          ? { ...lo, isCompleted: !lo.isCompleted } 
          : lo
      )
    })));
  };

  const handleNavigateLearningObject = (direction: 'prev' | 'next') => {
    const currentIndex = allLearningObjects.findIndex(lo => lo.id === currentLearningObjectId);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < allLearningObjects.length) {
      const newLearningObject = allLearningObjects[newIndex];
      const newSection = sections.find(s => s.learningObjects.some(lo => lo.id === newLearningObject.id));
      
      setCurrentLearningObjectId(newLearningObject.id);
      if (newSection) {
        setCurrentSectionId(newSection.id);
      }
      setScenes(newLearningObject.scenes);
      setActiveSceneId(newLearningObject.scenes[0]?.id || 1);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setSections(sections.map(section => ({
      ...section,
      learningObjects: section.learningObjects.map(lo => 
        lo.id === currentLearningObjectId 
          ? { ...lo, title: newTitle } 
          : lo
      )
    })));
  };

  const handleObjectiveChange = (newObjective: string) => {
    setSections(sections.map(section => ({
      ...section,
      learningObjects: section.learningObjects.map(lo => 
        lo.id === currentLearningObjectId 
          ? { ...lo, objective: newObjective } 
          : lo
      )
    })));
  };

  const handleSectionChange = (newSectionId: number) => {
    setCurrentSectionId(newSectionId);
    const newSection = sections.find(s => s.id === newSectionId);
    if (newSection && newSection.learningObjects.length > 0) {
      const firstLO = newSection.learningObjects[0];
      setCurrentLearningObjectId(firstLO.id);
      setScenes(firstLO.scenes);
      setActiveSceneId(firstLO.scenes[0]?.id || 1);
    }
  };

  const handleVideoUpload = (url: string) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId 
          ? { ...scene, videoFile: url } 
          : scene
      )
    );
  };

  const handleAudioUpload = (url: string) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId 
          ? { ...scene, audioFile: url } 
          : scene
      )
    );
  };

  const handleVideoRemove = () => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId 
          ? { ...scene, videoFile: null } 
          : scene
      )
    );
  };

  const handleAudioRemove = () => {
    setScenes(
      scenes.map((scene) =>
        scene.id === activeSceneId 
          ? { ...scene, audioFile: null } 
          : scene
      )
    );
  };

  const handleBatchAudioGenerated = (sceneId: number, audioUrl: string) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === sceneId 
          ? { ...scene, audioFile: audioUrl } 
          : scene
      )
    );
  };

  const handleAddCitation = () => {
    setEditingCitation({ id: 0, text: "" }); // id 0 indicates new citation
  };

  const handleEditCitation = (citation: Citation) => {
    setEditingCitation(citation);
  };

  const handleSaveCitation = (citation: Citation) => {
    if (citation.id === 0) {
      // New citation
      const newCitationId = citations.length > 0 ? Math.max(...citations.map(c => c.id)) + 1 : 1;
      setCitations([...citations, { ...citation, id: newCitationId }]);
    } else {
      // Update existing citation
      setCitations(citations.map(c => c.id === citation.id ? citation : c));
    }
    setEditingCitation(null);
  };

  const handleCancelEditCitation = () => {
    setEditingCitation(null);
  };

  const handleDeleteCitation = (citationId: number) => {
    setCitations(citations.filter(c => c.id !== citationId));
  };

  // Question handlers
  const handleAddQuestion = (type: 'knowledge-check' | 'assessment') => {
    setEditingQuestion({ type, question: undefined });
  };

  const handleEditQuestion = (type: 'knowledge-check' | 'assessment', question: Question) => {
    setEditingQuestion({ type, question });
  };

  const handleSaveQuestion = (type: 'knowledge-check' | 'assessment', question: Question) => {
    if (type === 'knowledge-check') {
      if (editingQuestion?.question) {
        setKnowledgeCheckQuestions(knowledgeCheckQuestions.map(q => q.id === question.id ? question : q));
      } else {
        setKnowledgeCheckQuestions([...knowledgeCheckQuestions, question]);
      }
    } else {
      if (editingQuestion?.question) {
        setAssessmentQuestions(assessmentQuestions.map(q => q.id === question.id ? question : q));
      } else {
        setAssessmentQuestions([...assessmentQuestions, question]);
      }
    }
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (type: 'knowledge-check' | 'assessment', questionId: string) => {
    if (type === 'knowledge-check') {
      setKnowledgeCheckQuestions(knowledgeCheckQuestions.filter(q => q.id !== questionId));
    } else {
      setAssessmentQuestions(assessmentQuestions.filter(q => q.id !== questionId));
    }
    toast.success("Question deleted");
  };

  const handleDuplicateQuestion = (type: 'knowledge-check' | 'assessment', question: Question) => {
    const duplicate = {
      ...question,
      id: Date.now().toString(),
    };
    if (type === 'knowledge-check') {
      setKnowledgeCheckQuestions([...knowledgeCheckQuestions, duplicate]);
    } else {
      setAssessmentQuestions([...assessmentQuestions, duplicate]);
    }
    toast.success("Question duplicated");
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestion(null);
  };

  // Timeline handlers
  const handleTimeChange = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleAddTimelineItem = (item: Omit<typeof timelineItems[0], "id">) => {
    const newId = timelineItems.length > 0 
      ? String(Math.max(...timelineItems.map(i => parseInt(i.id))) + 1)
      : "1";
    setTimelineItems([...timelineItems, { ...item, id: newId }]);
  };

  const handleTimelineItemUpdate = (id: string, updates: Partial<typeof timelineItems[0]>) => {
    // Update timeline items
    setTimelineItems(timelineItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    
    // If it's a bullet item, also update the template bullets
    if (id.startsWith('bullet-')) {
      const bulletId = id.replace('bullet-', '');
      setScenes(scenes.map(scene => {
        if (scene.id === activeSceneId && scene.template?.type === 'bulleted-list') {
          const updatedBullets = scene.template.params.bullets.map((bullet: any) => {
            if (bullet.id === bulletId) {
              return {
                ...bullet,
                ...(updates.startTime !== undefined && { startTime: updates.startTime }),
                ...(updates.duration !== undefined && { duration: updates.duration }),
                ...(updates.content !== undefined && { text: updates.content }),
              };
            }
            return bullet;
          });
          
          return {
            ...scene,
            template: {
              ...scene.template,
              params: {
                ...scene.template.params,
                bullets: updatedBullets,
              },
            },
          };
        }
        return scene;
      }));
    }
  };

  const handleTimelineItemDelete = (id: string) => {
    setTimelineItems(timelineItems.filter(item => item.id !== id));
  };

  const handleStartPreview = () => {
    setCurrentPreviewScene(0);
    setPreviewOpen(true);
  };

  const getTemplateColor = (template: Template | null) => {
    if (!template) return "#3B82F6";
    
    switch (template.type) {
      case "text-overlay":
        return template.params.color;
      case "lower-third":
        return template.params.color;
      case "full-screen":
        return template.params.backgroundColor;
      default:
        return "#3B82F6";
    }
  };

  const currentIndex = allLearningObjects.findIndex(lo => lo.id === currentLearningObjectId);
  const previousLearningObject = currentIndex > 0 ? allLearningObjects[currentIndex - 1] : null;
  const nextLearningObject = currentIndex < allLearningObjects.length - 1 ? allLearningObjects[currentIndex + 1] : null;
  
  // Get section for previous and next learning objects
  const previousSection = previousLearningObject 
    ? sections.find(s => s.learningObjects.some(lo => lo.id === previousLearningObject.id))
    : null;
  const nextSection = nextLearningObject 
    ? sections.find(s => s.learningObjects.some(lo => lo.id === nextLearningObject.id))
    : null;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundImage: "linear-gradient(140.604deg, rgba(125, 205, 238, 0.5) 4.1701%, rgba(213, 236, 181, 0.5) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      {/* Secondary Toolbar */}
      <WizardHeader 
        sections={sections}
        currentSectionId={currentSectionId}
        currentLearningObject={currentLearningObject}
        onSectionChange={handleSectionChange}
        onTitleChange={handleTitleChange}
        onObjectiveChange={handleObjectiveChange}
        onNavigate={handleNavigateLearningObject}
        previousTitle={previousLearningObject?.title}
        nextTitle={nextLearningObject?.title}
        previousSectionTitle={previousSection?.title}
        nextSectionTitle={nextSection?.title}
        isCompleted={currentLearningObject.isCompleted}
        onToggleComplete={handleToggleComplete}
        regenerateModalOpen={regenerateModalOpen}
        setRegenerateModalOpen={setRegenerateModalOpen}
        onOpenFlowMap={() => setIsFlowMapOpen(true)}
      />

      {/* HIDDEN: Search result banner
      {searchQuery && (
        <div className="w-full relative z-20 px-12 py-3 bg-sky-50/95 backdrop-blur-sm border-b border-sky-200/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-sky-800">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100">
              <Sparkles className="w-3 h-3 text-sky-600" />
            </div>
            <span>
              Found {activeMatchCount} {activeMatchCount === 1 ? (activeTab === 'scenes' ? 'scene' : 'question') : (activeTab === 'scenes' ? 'scenes' : 'questions')} for "{searchQuery}"
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-100"
            onClick={() => setSearchQuery("")}
          >
            Clear filter
          </Button>
        </div>
      )}
      */}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <LeftSidebar activePanel={activePanel} onPanelChange={setActivePanel} />
        
        {/* Slide-out Panel for Scenes */}
        {activePanel === "scenes" && (
          <div className="relative z-10" style={{ width: `${transcriptPanelWidth}px` }}>
            <Resizable
              size={{ width: transcriptPanelWidth, height: '100%' }}
              onResizeStop={(e, direction, ref, d) => {
                setTranscriptPanelWidth(transcriptPanelWidth + d.width);
              }}
              enable={{
                right: true,
                top: false,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: false,
                bottomLeft: false,
                topLeft: false,
              }}
              minWidth={300}
              maxWidth={600}
              className="h-full flex flex-col border-r-2 border-white"
              style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(14, 165, 233, 0.2), 0 4px 16px rgba(14, 165, 233, 0.15)',
              backgroundColor: 'rgba(240, 249, 255, 0.95)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(34, 211, 238, 0.08) 0px, transparent 50%)`,
              backgroundPosition: '0 0, 0 0, 100% 0, 100% 100%, 0 100%'
            }}
            handleStyles={{
              right: {
                width: '8px',
                right: '-4px',
                cursor: 'ew-resize',
              }
            }}
          >
            <div 
              className="sticky top-0 z-20 px-4 py-4 border-b-2 border-white/40 flex items-center justify-between flex-shrink-0 bg-white"
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
              }}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTranscriptPanelCollapsed(true)}
                  className="h-7 w-7 hover:bg-white/30"
                  title="Close Transcript"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-foreground">Scenes</h3>
                <Badge variant="secondary" className="gap-1.5 bg-white/70 border-white/40 shadow-sm ml-2">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(totalDuration)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <ToggleGroup 
                  type="single" 
                  value={transcriptView} 
                  onValueChange={(value) => value && setTranscriptView(value as 'text' | 'media')}
                  className="h-7 bg-white/60 border border-white/40"
                >
                  <ToggleGroupItem value="text" aria-label="Text view" className="h-6 px-2">
                    <AlignLeft className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="media" aria-label="Media view" className="h-6 px-2">
                    <ImageIcon className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <ScrollArea className="flex-1 h-full">
                {/* HIDDEN: Search result banner in transcript panel
                {searchQuery && (
                  <div className="sticky top-0 z-30 px-6 py-3 bg-sky-50/95 backdrop-blur-sm border-b border-sky-200/50 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-medium text-sky-800">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100">
                        <Sparkles className="w-3 h-3 text-sky-600" />
                      </div>
                      <span>Found {filteredScenes.length} results for "{searchQuery}"</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-100"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear filter
                    </Button>
                  </div>
                )}
                */}
                <DndProvider backend={HTML5Backend}>
                  {transcriptView === 'text' ? (
                    <div className="p-6 pr-6 pl-6 pb-20 space-y-4">
                      <div className="mb-4">
                        <GenerateAllAudioDialog
                          scenes={scenes}
                          onAudioGenerated={handleBatchAudioGenerated}
                        />
                      </div>
                      {searchQuery ? (
                         filteredScenes.length > 0 ? (
                           filteredScenes.map((scene) => (
                             <div key={scene.id} className="flex gap-2" onClick={() => setActiveSceneId(scene.id)}>
                               {/* Spacer to align with drag handle column */}
                               <div className="w-8 flex-shrink-0"></div>
                               <div className="flex-1">
                                 <SceneCard
                                   sceneNumber={scene.id}
                                   transcript={scene.transcript}
                                   isActive={scene.id === activeSceneId}
                                   completed={scene.completed}
                                   onSelect={() => setActiveSceneId(scene.id)}
                                   onTranscriptChange={(transcript) =>
                                     handleTranscriptChange(scene.id, transcript)
                                   }
                                   duration={scene.duration}
                                   onToggleComplete={() => handleToggleSceneComplete(scene.id)}
                                   totalScenes={scenes.length}
                                 />
                               </div>
                             </div>
                           ))
                         ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                              <Search className="w-8 h-8 mb-2 opacity-20" />
                              <p>No scenes found matching "{searchQuery}"</p>
                            </div>
                         )
                      ) : (
                        scenes.map((scene, index) => (
                          <DraggableSceneCard
                            key={scene.id}
                            sceneId={scene.id}
                            sceneNumber={scene.id}
                            transcript={scene.transcript}
                            isActive={scene.id === activeSceneId}
                            completed={scene.completed}
                            status={scene.status}
                            onSelect={() => setActiveSceneId(scene.id)}
                            onTranscriptChange={(transcript) =>
                              handleTranscriptChange(scene.id, transcript)
                            }
                            onStatusChange={(status) => handleSceneStatusChange(scene.id, status)}
                            duration={scene.duration}
                            onAddBefore={() => handleAddSceneBefore(scene.id)}
                            onAddAfter={() => handleAddSceneAfter(scene.id)}
                            onToggleComplete={() => handleToggleSceneComplete(scene.id)}
                            onDelete={scenes.length > 1 ? () => handleDeleteScene(scene.id) : undefined}
                            onMoveTo={(targetIndex) => handleMoveSceneTo(scene.id, targetIndex)}
                            totalScenes={scenes.length}
                            index={index}
                            moveScene={moveScene}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="p-6 pr-6 pl-6 pb-20 space-y-4">
                      <div className="mb-4">
                        <GenerateAllAudioDialog
                          scenes={scenes}
                          onAudioGenerated={handleBatchAudioGenerated}
                        />
                      </div>
                      {searchQuery ? (
                         filteredScenes.length > 0 ? (
                           filteredScenes.map((scene) => (
                              <SceneThumbnail
                                key={scene.id}
                                sceneNumber={scene.id}
                                title={scene.title}
                                previewImage={scene.previewImage}
                                templateColor={getTemplateColor(scene.template)}
                                isActive={scene.id === activeSceneId}
                                onClick={() => setActiveSceneId(scene.id)}
                                duration={scene.duration}
                              />
                           ))
                         ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                              <Search className="w-8 h-8 mb-2 opacity-20" />
                              <p>No scenes found matching "{searchQuery}"</p>
                            </div>
                         )
                      ) : (
                        scenes.map((scene, index) => (
                          <DraggableSceneThumbnail
                            key={scene.id}
                            sceneId={scene.id}
                            sceneNumber={scene.id}
                            title={scene.title}
                            previewImage={scene.previewImage}
                            templateColor={getTemplateColor(scene.template)}
                            isActive={scene.id === activeSceneId}
                            onClick={() => setActiveSceneId(scene.id)}
                            duration={scene.duration}
                            index={index}
                            moveScene={moveScene}
                          />
                        ))
                      )}
                    </div>
                  )}
                </DndProvider>
              </ScrollArea>
          </Resizable>
        </div>
        )}

        {/* Slide-out Panel for Knowledge Checks */}
        {activePanel === "knowledge-checks" && (
          <div className="relative z-10" style={{ width: `${transcriptPanelWidth}px` }}>
            <Resizable
              size={{ width: transcriptPanelWidth, height: '100%' }}
              onResizeStop={(e, direction, ref, d) => {
                setTranscriptPanelWidth(transcriptPanelWidth + d.width);
              }}
              enable={{
                right: true,
                top: false,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: false,
                bottomLeft: false,
                topLeft: false,
              }}
              minWidth={300}
              maxWidth={600}
              className="h-full flex flex-col border-r-2 border-white"
              style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(14, 165, 233, 0.2), 0 4px 16px rgba(14, 165, 233, 0.15)',
              backgroundColor: 'rgba(240, 249, 255, 0.95)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(34, 211, 238, 0.08) 0px, transparent 50%)`,
              backgroundPosition: '0 0, 0 0, 100% 0, 100% 100%, 0 100%'
            }}
            handleStyles={{
              right: {
                width: '8px',
                right: '-4px',
                cursor: 'ew-resize',
              }
            }}
          >
            <div 
              className="sticky top-0 z-20 px-4 py-4 border-b-2 border-white/40 flex items-center justify-between flex-shrink-0 bg-white"
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
              }}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActivePanel(null)}
                  className="h-7 w-7 hover:bg-white/30"
                  title="Close Panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-foreground">Knowledge Checks</h3>
                <Badge variant="secondary" className="gap-1.5 bg-white/70 border-white/40 shadow-sm ml-2">
                  {knowledgeCheckQuestions.length}
                </Badge>
              </div>
              <Button 
                onClick={() => handleAddQuestion('knowledge-check')} 
                size="sm" 
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            <ScrollArea className="flex-1 h-full">
              <div className="p-6 pr-6 pl-6 pb-20 space-y-4">
                {knowledgeCheckQuestions.length > 0 ? (
                  knowledgeCheckQuestions.map((question) => {
                    const config = QUESTION_TYPE_CONFIG[question.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={question.id}
                        className={`bg-white rounded-lg border-2 overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                          editingQuestion?.question?.id === question.id ? 'border-sky-500 shadow-md' : 'border-gray-200'
                        }`}
                        style={{
                          boxShadow: editingQuestion?.question?.id === question.id 
                            ? "0 4px 12px rgba(14, 165, 233, 0.3)" 
                            : "0 2px 8px rgba(0, 0, 0, 0.08)"
                        }}
                        onClick={() => handleEditQuestion('knowledge-check', question)}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${config.color} border gap-1.5`}>
                                  <Icon className="w-3 h-3" />
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-foreground text-sm mb-2 line-clamp-2">{question.questionText}</p>
                              <div className="text-xs text-muted-foreground">
                                {question.type === "matching" 
                                  ? `${question.matchingPairs?.length || 0} pairs`
                                  : `${question.answers?.length || 0} options`
                                }
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditQuestion('knowledge-check', question);
                                }}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateQuestion('knowledge-check', question);
                                }}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteQuestion('knowledge-check', question.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <CircleHelp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="mb-2">No knowledge checks yet</p>
                    <p className="text-sm">Click "Add" to create your first question</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Resizable>
        </div>
        )}

        {/* Slide-out Panel for Assessment */}
        {activePanel === "assessment" && (
          <div className="relative z-10" style={{ width: `${transcriptPanelWidth}px` }}>
            <Resizable
              size={{ width: transcriptPanelWidth, height: '100%' }}
              onResizeStop={(e, direction, ref, d) => {
                setTranscriptPanelWidth(transcriptPanelWidth + d.width);
              }}
              enable={{
                right: true,
                top: false,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: false,
                bottomLeft: false,
                topLeft: false,
              }}
              minWidth={300}
              maxWidth={600}
              className="h-full flex flex-col border-r-2 border-white"
              style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(14, 165, 233, 0.2), 0 4px 16px rgba(14, 165, 233, 0.15)',
              backgroundColor: 'rgba(240, 249, 255, 0.95)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(34, 211, 238, 0.08) 0px, transparent 50%)`,
              backgroundPosition: '0 0, 0 0, 100% 0, 100% 100%, 0 100%'
            }}
            handleStyles={{
              right: {
                width: '8px',
                right: '-4px',
                cursor: 'ew-resize',
              }
            }}
          >
            <div 
              className="sticky top-0 z-20 px-4 py-4 border-b-2 border-white/40 flex items-center justify-between flex-shrink-0 bg-white"
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
              }}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActivePanel(null)}
                  className="h-7 w-7 hover:bg-white/30"
                  title="Close Panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-foreground">Assessment</h3>
                <Badge variant="secondary" className="gap-1.5 bg-white/70 border-white/40 shadow-sm ml-2">
                  {assessmentQuestions.length}
                </Badge>
              </div>
              <Button 
                onClick={() => handleAddQuestion('assessment')} 
                size="sm" 
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            <ScrollArea className="flex-1 h-full">
              <div className="p-6 pr-6 pl-6 pb-20 space-y-4">
                {assessmentQuestions.length > 0 ? (
                  assessmentQuestions.map((question) => {
                    const config = QUESTION_TYPE_CONFIG[question.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={question.id}
                        className={`bg-white rounded-lg border-2 overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                          editingQuestion?.question?.id === question.id ? 'border-sky-500 shadow-md' : 'border-gray-200'
                        }`}
                        style={{
                          boxShadow: editingQuestion?.question?.id === question.id 
                            ? "0 4px 12px rgba(14, 165, 233, 0.3)" 
                            : "0 2px 8px rgba(0, 0, 0, 0.08)"
                        }}
                        onClick={() => handleEditQuestion('assessment', question)}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${config.color} border gap-1.5`}>
                                  <Icon className="w-3 h-3" />
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-foreground text-sm mb-2 line-clamp-2">{question.questionText}</p>
                              <div className="text-xs text-muted-foreground">
                                {question.type === "matching" 
                                  ? `${question.matchingPairs?.length || 0} pairs`
                                  : `${question.answers?.length || 0} options`
                                }
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditQuestion('assessment', question);
                                }}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateQuestion('assessment', question);
                                }}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteQuestion('assessment', question.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <CircleHelp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="mb-2">No assessment questions yet</p>
                    <p className="text-sm">Click "Add" to create your first question</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Resizable>
        </div>
        )}

        {/* Slide-out Panel for Citations */}
        {activePanel === "citations" && (
          <div className="relative z-10" style={{ width: `${transcriptPanelWidth}px` }}>
            <Resizable
              size={{ width: transcriptPanelWidth, height: '100%' }}
              onResizeStop={(e, direction, ref, d) => {
                setTranscriptPanelWidth(transcriptPanelWidth + d.width);
              }}
              enable={{
                right: true,
                top: false,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: false,
                bottomLeft: false,
                topLeft: false,
              }}
              minWidth={300}
              maxWidth={600}
              className="h-full flex flex-col border-r-2 border-white"
              style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(14, 165, 233, 0.2), 0 4px 16px rgba(14, 165, 233, 0.15)',
              backgroundColor: 'rgba(240, 249, 255, 0.95)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.12) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(34, 211, 238, 0.08) 0px, transparent 50%)`,
              backgroundPosition: '0 0, 0 0, 100% 0, 100% 100%, 0 100%'
            }}
            handleStyles={{
              right: {
                width: '8px',
                right: '-4px',
                cursor: 'ew-resize',
              }
            }}
          >
            {/* Citation List View - Always show in left panel */}
            <div 
              className="sticky top-0 z-20 px-4 py-4 border-b-2 border-white/40 flex items-center justify-between flex-shrink-0 bg-white"
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
              }}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActivePanel(null)}
                  className="h-7 w-7 hover:bg-white/30"
                  title="Close Panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-foreground">Citations</h3>
                <Badge variant="secondary" className="gap-1.5 bg-white/70 border-white/40 shadow-sm ml-2">
                  {citations.length}
                </Badge>
              </div>
              <Button 
                onClick={handleAddCitation} 
                size="sm" 
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            <ScrollArea className="flex-1 h-full">
              <div className="p-6 pr-6 pl-6 pb-20 space-y-4">
                {citations.length > 0 ? (
                  citations.map((citation, index) => (
                    <div
                      key={citation.id}
                      className={`bg-white rounded-lg border-2 overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                        editingCitation?.id === citation.id ? 'border-sky-500 shadow-md' : 'border-gray-200'
                      }`}
                      style={{
                        boxShadow: editingCitation?.id === citation.id 
                          ? "0 4px 12px rgba(14, 165, 233, 0.3)" 
                          : "0 2px 8px rgba(0, 0, 0, 0.08)"
                      }}
                      onClick={() => handleEditCitation(citation)}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {index + 1}
                              </Badge>
                            </div>
                            <p className="text-sm text-foreground line-clamp-3">{citation.text}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEditCitation(citation);
                              }}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCitation(citation.id);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Link2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="mb-2">No citations yet</p>
                    <p className="text-sm">Click "Add" to create your first citation</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Resizable>
        </div>
        )}

        {/* Right Section - Canvas - Always Visible */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Canvas Workspace - Surface Level */}
          <div className="flex-1 overflow-hidden min-h-0 bg-transparent">
            <div className="h-full flex overflow-hidden">
              {/* Canvas Area */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Stock Modal */}
                <StockModal
                  open={stockModalOpen}
                  onOpenChange={setStockModalOpen}
                  onSelectImage={handleStockImageSelect}
                />

                {/* Media Upload Modal */}
                <VideoUploadDialog
                  open={uploadModalOpen}
                  onOpenChange={setUploadModalOpen}
                  onVideoUpload={handleMediaUpload}
                  sceneNumber={activeSceneId}
                />

                {/* Generate Media Modal */}
                <GenerateMediaDialog
                  open={generateModalOpen}
                  onOpenChange={setGenerateModalOpen}
                  onMediaGenerated={handleMediaGenerated}
                />

                {/* Canvas Content - Scrollable */}
                <div className="flex-1 overflow-auto min-h-0 flex flex-col">
                  {editingQuestion ? (
                    /* Question Builder View - Editing Mode */
                    <QuestionBuilder
                      type={editingQuestion.type}
                      scenes={scenes}
                      initialQuestion={editingQuestion.question}
                      onSave={(question) => handleSaveQuestion(editingQuestion.type, question)}
                      onCancel={handleCancelEditQuestion}
                    />
                  ) : (activePanel === "knowledge-checks" || activePanel === "assessment") ? (
                    /* Question Builder View - List Mode */
                    <div className="h-full">
                      <QuestionBuilder
                        type={activePanel === "knowledge-checks" ? "knowledge-check" : "assessment"}
                        scenes={scenes}
                      />
                    </div>
                  ) : (editingCitation || activePanel === "citations") ? (
                    /* Citation Editor View */
                    <div className="h-full">
                      <CitationEditor
                        citation={editingCitation && editingCitation.id !== 0 ? editingCitation : undefined}
                        onSave={handleSaveCitation}
                        onCancel={handleCancelEditCitation}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Media Actions Toolbar - Right Side */}
                      <div className="px-6 pt-4 pb-2 flex justify-end items-center flex-shrink-0">
                        <div className="glass-card rounded-xl">
                          <div className="flex flex-wrap gap-2 p-2">
                            <Button 
                              variant="outline" 
                              className="gap-2 relative overflow-hidden bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-fuchsia-500/10 hover:from-purple-500/20 hover:via-violet-500/20 hover:to-fuchsia-500/20 border-purple-300 text-purple-700 hover:text-purple-900 hover:border-purple-400 transition-all" 
                              onClick={() => setGenerateModalOpen(true)}
                            >
                              <Sparkles className="w-4 h-4" />
                              Add Media
                            </Button>

                            <Button 
                              variant="outline" 
                              className="gap-2"
                              onClick={handleStartPreview}
                            >
                              <Play className="w-4 h-4" />
                              Preview
                            </Button>

                            <Button 
                              variant={activeScene.completed ? "default" : "outline"} 
                              className={`gap-2 ${activeScene.completed ? 'bg-green-500 hover:bg-green-600 text-white border-green-400' : ''}`}
                              onClick={() => handleToggleSceneComplete(activeSceneId)}
                            >
                              {activeScene.completed ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                              {activeScene.completed ? "Completed" : "Complete Scene"}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Preview Canvas */}
                      <div className="flex-1 px-6 py-2 flex items-center justify-center min-h-0">
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-full h-full max-h-full flex items-center justify-center">
                            <div className="w-full max-h-full" style={{ aspectRatio: '16/9' }}>
                              <PreviewCanvas
                                previewImage={activeScene.previewImage}
                                template={activeScene.template}
                                mediaParams={activeScene.mediaParams}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* Properties Panel - Contextual based on selected timeline element */}
              {selectedTimelineItemId && (
                <div 
                  className="relative z-5 border-l-2 border-white bg-white shadow-[-8px_0_32px_rgba(14,165,233,0.25)] transition-all duration-300 h-full flex-shrink-0 w-80"
                  style={{ 
                    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(14, 165, 233, 0.2), 0 4px 16px rgba(14, 165, 233, 0.15)'
                  }}
                >
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="px-6 py-3 flex items-center justify-between flex-shrink-0 border-b border-gray-200">
                      <h3 className="text-foreground font-medium">
                        {selectedTimelineItemId.startsWith('scene-media') || selectedTimelineItemId.startsWith('media-') ? 'Media Properties' :
                         selectedTimelineItemId.startsWith('scene-template') ? 'Template Properties' :
                         selectedTimelineItemId.startsWith('scene-audio') ? 'Audio Properties' :
                         'Element Properties'}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTimelineItemId(null)}
                        className="h-8 w-8 hover:bg-gray-100"
                        title="Close Properties"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {/* Show Media controls when media element is selected */}
                      {(selectedTimelineItemId.startsWith('scene-media') || selectedTimelineItemId.startsWith('media-')) && (
                        <TemplateControls
                          templates={DEFAULT_TEMPLATES}
                          selectedTemplate={null}
                          onTemplateSelect={() => {}}
                          onTemplateParamsChange={() => {}}
                          mediaParams={activeScene.mediaParams}
                          onMediaParamsChange={handleMediaParamsChange}
                          mediaFile={activeScene.previewImage}
                          onMediaDelete={handleMediaDelete}
                        />
                      )}
                      
                      {/* Show Template controls when template element is selected */}
                      {selectedTimelineItemId.startsWith('scene-template') && (
                        <TemplateControls
                          templates={DEFAULT_TEMPLATES}
                          selectedTemplate={activeScene.template}
                          onTemplateSelect={handleTemplateSelect}
                          onTemplateParamsChange={handleTemplateParamsChange}
                          mediaParams={activeScene.mediaParams}
                          onMediaParamsChange={() => {}}
                          mediaFile={activeScene.previewImage}
                          onMediaDelete={() => {}}
                        />
                      )}
                      
                      {/* Show Audio controls when audio element is selected */}
                      {selectedTimelineItemId.startsWith('scene-audio') && (
                        <div className="p-6 space-y-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Audio File</h4>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                              <p className="text-sm text-gray-700">Scene Audio</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            onClick={handleAudioRemove}
                          >
                            Remove Audio
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Panel - Below Canvas */}
          {activePanel !== "knowledge-checks" && activePanel !== "assessment" && activePanel !== "citations" && (
            <TimelinePanel
              duration={totalDuration}
              currentTime={currentTime}
              onTimeChange={handleTimeChange}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onAddItem={handleAddTimelineItem}
              items={timelineItems}
              onItemUpdate={handleTimelineItemUpdate}
              onItemDelete={handleTimelineItemDelete}
              selectedItemId={selectedTimelineItemId}
              onItemSelect={setSelectedTimelineItemId}
            />
          )}
        </div>
      </div>
      {/* End Main Content Layout */}

      <Toaster />

      {/* Flow Map Canvas */}
      {isFlowMapOpen && (
        <FlowMapCanvas
          scenes={scenes}
          knowledgeCheckQuestions={knowledgeCheckQuestions}
          assessmentQuestions={assessmentQuestions}
          onClose={() => setIsFlowMapOpen(false)}
        />
      )}
    </div>
  );
}