import { ArrowUpLeft, ArrowUp, ArrowUpRight, ArrowLeft, Circle, ArrowRight, ArrowDownLeft, ArrowDown, ArrowDownRight } from "lucide-react";
import { cn } from "../lib/utils";

type PanDirection = "up-left" | "up" | "up-right" | "left" | "center" | "right" | "down-left" | "down" | "down-right";

interface PanDirectionSelectorProps {
  value: PanDirection;
  onChange: (direction: PanDirection) => void;
  invertArrows?: boolean;
}

export function PanDirectionSelector({ value, onChange, invertArrows = false }: PanDirectionSelectorProps) {
  const DirectionButton = ({ 
    direction, 
    Icon, 
    rotateClass = "" 
  }: { 
    direction: PanDirection; 
    Icon: any; 
    rotateClass?: string;
  }) => {
    const isSelected = value === direction;
    
    return (
      <button
        type="button"
        onClick={() => onChange(direction)}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] transition-colors",
          isSelected ? "bg-[#0065ba] text-white" : "bg-white text-[#192434] hover:bg-gray-50"
        )}
      >
        <Icon className={cn("w-4 h-4", rotateClass)} />
      </button>
    );
  };

  // Invert icons for zoom out
  const UpLeftIcon = invertArrows ? ArrowDownRight : ArrowUpLeft;
  const UpIcon = invertArrows ? ArrowDown : ArrowUp;
  const UpRightIcon = invertArrows ? ArrowDownLeft : ArrowUpRight;
  const LeftIcon = invertArrows ? ArrowRight : ArrowLeft;
  const RightIcon = invertArrows ? ArrowLeft : ArrowRight;
  const DownLeftIcon = invertArrows ? ArrowUpRight : ArrowDownLeft;
  const DownIcon = invertArrows ? ArrowUp : ArrowDown;
  const DownRightIcon = invertArrows ? ArrowUpLeft : ArrowDownRight;

  return (
    <div className="inline-flex flex-col gap-1">
      {/* Top Row */}
      <div className="flex gap-1">
        <DirectionButton direction="up-left" Icon={UpLeftIcon} />
        <DirectionButton direction="up" Icon={UpIcon} />
        <DirectionButton direction="up-right" Icon={UpRightIcon} />
      </div>

      {/* Middle Row */}
      <div className="flex gap-1">
        <DirectionButton direction="left" Icon={LeftIcon} />
        <DirectionButton direction="center" Icon={Circle} />
        <DirectionButton direction="right" Icon={RightIcon} />
      </div>

      {/* Bottom Row */}
      <div className="flex gap-1">
        <DirectionButton direction="down-left" Icon={DownLeftIcon} />
        <DirectionButton direction="down" Icon={DownIcon} />
        <DirectionButton direction="down-right" Icon={DownRightIcon} />
      </div>
    </div>
  );
}
