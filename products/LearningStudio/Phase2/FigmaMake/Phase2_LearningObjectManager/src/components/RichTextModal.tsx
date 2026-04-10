import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { RichTextEditor } from "./RichTextEditor";

interface RichTextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (value: string) => void;
  title?: string;
  description?: string;
  textAlign?: "left" | "center" | "right";
  onTextAlignChange?: (align: "left" | "center" | "right") => void;
  showTextAlignment?: boolean;
}

export function RichTextModal({
  open,
  onOpenChange,
  value,
  onSave,
  title = "Format Text",
  description = "Add formatting to your text using the toolbar below.",
  textAlign = "left",
  onTextAlignChange,
  showTextAlignment = false,
}: RichTextModalProps) {
  const [editedValue, setEditedValue] = useState(value);

  // Update edited value when modal opens with new value
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setEditedValue(value);
    }
    onOpenChange(newOpen);
  };

  const handleSave = () => {
    onSave(editedValue);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEditedValue(value); // Reset to original value
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RichTextEditor
            value={editedValue}
            onChange={setEditedValue}
            placeholder="Enter your formatted text..."
            textAlign={textAlign}
            onTextAlignChange={onTextAlignChange}
            showTextAlignment={showTextAlignment}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}