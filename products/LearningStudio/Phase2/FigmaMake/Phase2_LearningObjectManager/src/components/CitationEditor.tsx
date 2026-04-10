import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X, Check, Link2 } from "lucide-react";

interface Citation {
  id: number;
  text: string;
}

interface CitationEditorProps {
  citation?: Citation;
  onSave: (citation: Citation) => void;
  onCancel: () => void;
}

export function CitationEditor({ citation, onSave, onCancel }: CitationEditorProps) {
  const [text, setText] = useState(citation?.text || "");

  const handleSave = () => {
    if (!text.trim()) {
      return;
    }

    const savedCitation: Citation = {
      id: citation?.id || Date.now(),
      text: text.trim(),
    };

    onSave(savedCitation);
  };

  const isEditing = !!citation;

  // If no citation is being edited, show placeholder
  if (!citation && text === "") {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-gradient-to-br from-sky-50 to-cyan-50">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center">
            <Link2 className="w-10 h-10 text-sky-600" />
          </div>
          <h3 className="text-2xl font-medium text-foreground mb-3">Citations</h3>
          <p className="text-muted-foreground mb-6">
            Select a citation from the list to edit it, or click "Add" to create a new citation.
          </p>
          <div className="glass-card p-4 rounded-lg text-left">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Tip:</strong> Citations help provide proper attribution and credibility to your content.
            </p>
            <p className="text-xs text-muted-foreground">
              Use standard formats like APA, MLA, or Chicago for consistency.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 px-6 py-4 border-b-2 border-white/40 flex items-center justify-between flex-shrink-0 bg-white"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
        }}
      >
        <h3 className="text-lg font-medium text-foreground">
          {isEditing ? "Edit Citation" : "Add Citation"}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!text.trim()}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="glass-card p-6 rounded-xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="citation-text" className="text-sm font-medium">
                  Citation Text
                </Label>
                <Textarea
                  id="citation-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter citation text in your preferred format (e.g., APA, MLA, Chicago)..."
                  className="min-h-[200px] resize-none"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full citation including author(s), year, title, source, and other relevant details.
                </p>
              </div>

              {/* Citation Format Examples */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg">
                <h4 className="text-sm font-medium text-sky-900 mb-2">Example Formats:</h4>
                <div className="space-y-2 text-xs text-sky-700">
                  <div>
                    <strong>APA:</strong> Smith, J. (2023). The Future of Video Production. <em>Journal of Media</em>, 45(3), 234-256.
                  </div>
                  <div>
                    <strong>MLA:</strong> Smith, John. "The Future of Video Production." <em>Journal of Media</em>, vol. 45, no. 3, 2023, pp. 234-256.
                  </div>
                  <div>
                    <strong>Chicago:</strong> Smith, John. "The Future of Video Production." <em>Journal of Media</em> 45, no. 3 (2023): 234-256.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
