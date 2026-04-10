import { useState, useEffect } from "react";
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
import { Plus, Trash2, GripVertical, Circle, Hash, CheckCircle, ArrowRight } from "lucide-react";
import { Label } from "./ui/label";

interface Bullet {
  id: string;
  text: string;
  startTime: number;
  duration: number;
}

interface BulletListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bullets: Bullet[];
  onSave: (bullets: Bullet[]) => void;
  bulletStyle?: string;
}

export function BulletListModal({
  open,
  onOpenChange,
  bullets,
  onSave,
  bulletStyle = "disc",
}: BulletListModalProps) {
  const [editedBullets, setEditedBullets] = useState<Bullet[]>(bullets);
  const [editingBulletId, setEditingBulletId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Update edited bullets when modal opens with new bullets
  useEffect(() => {
    if (open) {
      setEditedBullets(bullets);
      setEditingBulletId(null);
      setEditingText("");
    }
  }, [open, bullets]);

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

  const addBullet = () => {
    const newBulletId = editedBullets.length > 0 
      ? String(Math.max(...editedBullets.map((b) => parseInt(b.id))) + 1)
      : "1";
    const lastBullet = editedBullets[editedBullets.length - 1];
    const newStartTime = lastBullet ? lastBullet.startTime + lastBullet.duration : 0;
    
    const newBullet: Bullet = {
      id: newBulletId,
      text: "",
      startTime: newStartTime,
      duration: 3,
    };

    setEditedBullets([...editedBullets, newBullet]);
    // Automatically start editing the new bullet
    setEditingBulletId(newBulletId);
    setEditingText("");
  };

  const updateBullet = (bulletId: string, updates: Partial<Bullet>) => {
    setEditedBullets(editedBullets.map((b) =>
      b.id === bulletId ? { ...b, ...updates } : b
    ));
  };

  const deleteBullet = (bulletId: string) => {
    setEditedBullets(editedBullets.filter((b) => b.id !== bulletId));
    if (editingBulletId === bulletId) {
      setEditingBulletId(null);
      setEditingText("");
    }
  };

  const startEditingBullet = (bullet: Bullet) => {
    setEditingBulletId(bullet.id);
    setEditingText(bullet.text);
  };

  const saveEditingBullet = () => {
    if (editingBulletId) {
      updateBullet(editingBulletId, { text: editingText });
      setEditingBulletId(null);
      setEditingText("");
    }
  };

  const cancelEditingBullet = () => {
    setEditingBulletId(null);
    setEditingText("");
  };

  const handleSave = () => {
    // Save any pending edits
    if (editingBulletId) {
      const finalBullets = editedBullets.map((b) =>
        b.id === editingBulletId ? { ...b, text: editingText } : b
      );
      onSave(finalBullets);
    } else {
      onSave(editedBullets);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEditedBullets(bullets); // Reset to original bullets
    setEditingBulletId(null);
    setEditingText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Bullet Points</DialogTitle>
          <DialogDescription>
            Add, edit, and format your bullet points. Click on a bullet to edit its text with rich formatting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {/* Rich Text Editor for currently editing bullet */}
          {editingBulletId && (
            <div className="mb-4 p-4 rounded-lg border-2 border-primary bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Editing Bullet Point</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={cancelEditingBullet}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEditingBullet}>
                    Done
                  </Button>
                </div>
              </div>
              <RichTextEditor
                value={editingText}
                onChange={setEditingText}
                placeholder="Enter your bullet point text..."
                textAlign="left"
              />
            </div>
          )}

          {/* Bullet List */}
          <div className="space-y-2">
            {editedBullets.map((bullet, index) => (
              <div
                key={bullet.id}
                className={`p-3 rounded-lg border-2 transition-all group ${
                  editingBulletId === bullet.id
                    ? "border-primary/50 bg-primary/5 opacity-50"
                    : "border-gray-200 bg-gray-50 hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-2">
                    {getBulletIcon(bulletStyle)}
                  </div>
                  <div 
                    className="flex-1 min-h-[40px] cursor-pointer"
                    onClick={() => !editingBulletId && startEditingBullet(bullet)}
                  >
                    {bullet.text ? (
                      <div 
                        className="text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: bullet.text }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Click to edit bullet point {index + 1}...
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBullet(bullet.id)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    disabled={!!editingBulletId}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {editedBullets.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm text-muted-foreground">No bullet points yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add Bullet" to get started</p>
              </div>
            )}
          </div>

          {/* Add Bullet Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addBullet}
            className="w-full gap-1.5 h-9"
            disabled={!!editingBulletId}
          >
            <Plus className="w-4 h-4" />
            Add Bullet Point
          </Button>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!editingBulletId}>
            {editingBulletId ? "Finish Editing to Save" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}