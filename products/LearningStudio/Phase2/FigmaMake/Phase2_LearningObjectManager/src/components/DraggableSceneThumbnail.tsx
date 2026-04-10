import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { SceneThumbnail } from './SceneThumbnail';

interface DraggableSceneThumbnailProps {
  sceneId: number;
  sceneNumber: number;
  title: string;
  previewImage: string;
  templateColor: string;
  isActive: boolean;
  onClick: () => void;
  duration: number;
  index: number;
  moveScene: (dragIndex: number, hoverIndex: number) => void;
}

const ITEM_TYPE = 'SCENE';

export function DraggableSceneThumbnail({
  sceneId,
  sceneNumber,
  title,
  previewImage,
  templateColor,
  isActive,
  onClick,
  duration,
  index,
  moveScene,
}: DraggableSceneThumbnailProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
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

      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the left
      const hoverClientX = clientOffset!.x - hoverBoundingRect.left;

      // Only perform the move when the mouse has crossed half of the items width
      // When dragging right, only move when the cursor is past 50%
      // When dragging left, only move when the cursor is before 50%

      // Dragging right
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }

      // Dragging left
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
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

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
      className={`transition-opacity ${isOver ? 'scale-105' : ''}`}
    >
      <SceneThumbnail
        sceneNumber={sceneNumber}
        title={title}
        previewImage={previewImage}
        templateColor={templateColor}
        isActive={isActive}
        onClick={onClick}
        duration={duration}
      />
    </div>
  );
}
