import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Rows3, Brain, ClipboardCheck, BookOpen } from "lucide-react";

interface LeftSidebarProps {
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
}

export default function LeftSidebar({ activePanel, onPanelChange }: LeftSidebarProps) {
  const handlePanelClick = (panel: string) => {
    if (activePanel === panel) {
      onPanelChange(null);
    } else {
      onPanelChange(panel);
    }
  };

  const iconButtons = [
    { id: "scenes", icon: Rows3, label: "Scenes" },
    { id: "knowledge-checks", icon: Brain, label: "Knowledge Checks" },
    { id: "assessment", icon: ClipboardCheck, label: "Assessment" },
    { id: "citations", icon: BookOpen, label: "Citations" },
  ];

  return (
    <div 
      className="relative z-20 h-full w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 shadow-sm"
      style={{
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)'
      }}
    >
      <TooltipProvider>
        {iconButtons.map((button) => (
          <Tooltip key={button.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === button.id ? "default" : "ghost"}
                size="icon"
                className={`w-12 h-12 ${
                  activePanel === button.id
                    ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => handlePanelClick(button.id)}
              >
                <button.icon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{button.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
