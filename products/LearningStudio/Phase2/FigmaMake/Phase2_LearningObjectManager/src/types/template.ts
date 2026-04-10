export interface BaseTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
}

export interface TextOverlayTemplate extends BaseTemplate {
  type: "text-overlay";
  params: {
    placement: "left" | "right";
    color: string;
    opacity: number;
    text: string;
  };
}

export interface LowerThirdTemplate extends BaseTemplate {
  type: "lower-third";
  params: {
    title: string;
    subtitle: string;
    color: string;
    position: "bottom" | "top";
  };
}

export interface FullScreenTemplate extends BaseTemplate {
  type: "full-screen";
  params: {
    backgroundColor: string;
    opacity: number;
    text: string;
    textAlign: "left" | "center" | "right";
  };
}

export interface BulletedListTemplate extends BaseTemplate {
  type: "bulleted-list";
  params: {
    bullets: {
      id: string;
      text: string;
      startTime: number;
      duration: number;
    }[];
    position: "left" | "right" | "center";
    color: string;
    bulletStyle: "disc" | "number" | "check" | "arrow";
    animation: "fade" | "slide-up" | "slide-left" | "scale";
    stacked: boolean; // If true, bullets accumulate; if false, they replace each other
  };
}

export type Template =
  | TextOverlayTemplate
  | LowerThirdTemplate
  | FullScreenTemplate
  | BulletedListTemplate;

// Image Effects
export interface BaseImageEffect {
  id: string;
  name: string;
  description: string;
  type: string;
}

export interface PanAndZoomEffect extends BaseImageEffect {
  type: "pan-and-zoom";
  params: {
    zoomDirection: "in" | "out";
    zoomPercentage: number; // 0-100
    panDirection: "up-left" | "up" | "up-right" | "left" | "center" | "right" | "down-left" | "down" | "down-right";
  };
}

export type ImageEffect = PanAndZoomEffect;

export const DEFAULT_IMAGE_EFFECTS: ImageEffect[] = [
  {
    id: "pan-and-zoom",
    name: "Pan and Zoom",
    description: "Zoom with directional panning",
    type: "pan-and-zoom",
    params: {
      zoomDirection: "in",
      zoomPercentage: 20,
      panDirection: "center",
    },
  },
];

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "text-overlay",
    name: "Text Overlay",
    description: "Side-aligned text overlay",
    type: "text-overlay",
    params: {
      placement: "left",
      color: "#3B82F6",
      opacity: 0.8,
      text: "Your Message Here",
    },
  },
  {
    id: "lower-third",
    name: "Lower Third",
    description: "Title and subtitle bar",
    type: "lower-third",
    params: {
      title: "Speaker Name",
      subtitle: "Title or Description",
      color: "#3B82F6",
      position: "bottom",
    },
  },
  {
    id: "full-screen",
    name: "Full Screen Overlay",
    description: "Full screen text overlay",
    type: "full-screen",
    params: {
      backgroundColor: "#1F2937",
      opacity: 0.9,
      text: "Full Screen Message",
      textAlign: "center",
    },
  },
  {
    id: "bulleted-list",
    name: "Bulleted List",
    description: "Animated bullet points with timeline control",
    type: "bulleted-list",
    params: {
      bullets: [],
      position: "left",
      color: "#3B82F6",
      bulletStyle: "disc",
      animation: "fade",
      stacked: true,
    },
  },
];