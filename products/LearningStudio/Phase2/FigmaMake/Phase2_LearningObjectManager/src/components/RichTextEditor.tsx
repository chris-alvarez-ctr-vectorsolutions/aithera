import { useRef, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Bold, Italic, Underline, X, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  textAlign?: "left" | "center" | "right";
  onTextAlignChange?: (align: "left" | "center" | "right") => void;
  showTextAlignment?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  label,
  className = "",
  textAlign = "left",
  onTextAlignChange,
  showTextAlignment = true,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
    // Trigger change after formatting
    handleInput();
  };

  const clearFormatting = () => {
    document.execCommand("removeFormat", false, undefined);
    editorRef.current?.focus();
    handleInput();
  };

  const isFormatActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  const applyTextAlign = (align: "left" | "center" | "right") => {
    document.execCommand("justify" + align.charAt(0).toUpperCase() + align.slice(1), false, undefined);
    editorRef.current?.focus();
    handleInput();
    if (onTextAlignChange) {
      onTextAlignChange(align);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && <Label>{label}</Label>}
      <div
        className={`rounded-lg border-2 transition-colors ${
          isFocused
            ? "border-primary shadow-sm"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${
              isFormatActive("bold") ? "bg-primary/10 text-primary" : ""
            }`}
            onClick={() => applyFormat("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${
              isFormatActive("italic") ? "bg-primary/10 text-primary" : ""
            }`}
            onClick={() => applyFormat("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${
              isFormatActive("underline") ? "bg-primary/10 text-primary" : ""
            }`}
            onClick={() => applyFormat("underline")}
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={clearFormatting}
            title="Clear Formatting"
          >
            <X className="h-4 w-4" />
          </Button>
          {showTextAlignment && (
            <>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${
                  textAlign === "left" ? "bg-primary/10 text-primary" : ""
                }`}
                onClick={() => applyTextAlign("left")}
                title="Align Left (Ctrl+L)"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${
                  textAlign === "center" ? "bg-primary/10 text-primary" : ""
                }`}
                onClick={() => applyTextAlign("center")}
                title="Align Center (Ctrl+E)"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${
                  textAlign === "right" ? "bg-primary/10 text-primary" : ""
                }`}
                onClick={() => applyTextAlign("right")}
                title="Align Right (Ctrl+R)"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Editable Content Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="px-3 py-2 min-h-[80px] max-h-[200px] overflow-y-auto bg-white outline-none text-sm"
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      </div>
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        [contenteditable] {
          position: relative;
        }
      `}</style>
    </div>
  );
}