import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { SceneCard } from './SceneCard';
import { GripVertical } from 'lucide-react';

interface DraggableSceneCardProps {
  sceneId: number;
  sceneNumber: number;
  transcript: string;
  isActive: boolean;
  completed: boolean;
  status: "in-progress" | "in-review" | "ready";
  onSelect: () => void;
  onTranscriptChange: (value: string) => void;
  onStatusChange?: (status: "in-progress" | "in-review" | "ready") => void;
  duration: number;
  onAddBefore?: () => void;
  onAddAfter?: () => void;
  onToggleComplete: () => void;
  onDelete?: () => void;
  onMoveTo?: (targetIndex: number) => void;
  totalScenes?: number;
  index: number;
  moveScene: (dragIndex: number, hoverIndex: number) => void;
}

const ITEM_TYPE = 'SCENE_CARD';

export function DraggableSceneCard({
  sceneId,
  sceneNumber,
  transcript,
  isActive,
  completed,
  status,
  onSelect,
  onTranscriptChange,
  onStatusChange,
  duration,
  onAddBefore,
  onAddAfter,
  onToggleComplete,
  onDelete,
  onMoveTo,
  totalScenes,
  index,
  moveScene,
}: DraggableSceneCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index, sceneId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: { index: number; sceneId: number }, monitor) => {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveScene(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Separate the drag handle from the preview
  const dragHandleRef = useRef<HTMLDivElement>(null);
  drag(dragHandleRef);
  drop(preview(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`relative transition-opacity ${isOver ? 'scale-[1.02]' : ''} flex gap-2`}
    >
      {/* Drag Handle Column - Always Visible */}
      <div
        ref={dragHandleRef}
        className="w-8 flex-shrink-0 flex items-start justify-center pt-6 cursor-grab active:cursor-grabbing"
      >
        <div className="glass-elevated rounded-lg p-1.5 hover:bg-white/60 transition-colors">
          <GripVertical className="w-4 h-4 text-foreground/70" />
        </div>
      </div>

      {/* Scene Card */}
      <div className="flex-1">
        <SceneCard
          sceneNumber={sceneNumber}
          transcript={transcript}
          isActive={isActive}
          completed={completed}
          status={status}
          onSelect={onSelect}
          onTranscriptChange={onTranscriptChange}
          onStatusChange={onStatusChange}
          duration={duration}
          onAddBefore={onAddBefore}
          onAddAfter={onAddAfter}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onMoveTo={onMoveTo}
          totalScenes={totalScenes}
        />
      </div>
    </div>
  );
}