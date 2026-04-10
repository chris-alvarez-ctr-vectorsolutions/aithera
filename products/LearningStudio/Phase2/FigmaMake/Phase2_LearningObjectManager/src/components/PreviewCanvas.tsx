import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Template } from "../types/template";
import { Circle, Hash, CheckCircle, ArrowRight } from "lucide-react";

interface MediaParams {
  position: { x: number; y: number };
  scale: number;
  opacity: number;
  fit: 'cover' | 'contain' | 'fill';
}

interface PreviewCanvasProps {
  previewImage: string;
  template: Template | null;
  mediaParams: MediaParams;
}

export function PreviewCanvas({ previewImage, template, mediaParams }: PreviewCanvasProps) {
  const getTextColor = (bgColor: string) => {
    // Simple luminance check for text color
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "small":
        return "px-3 py-1 text-xs";
      case "large":
        return "px-6 py-3";
      default:
        return "px-4 py-2";
    }
  };

  const getCornerClasses = (corner: string) => {
    switch (corner) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "top-4 right-4";
    }
  };

  return (
    <div className="w-full h-full">
      <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${mediaParams.position.x}%, ${mediaParams.position.y}%) scale(${mediaParams.scale})`,
            opacity: mediaParams.opacity,
          }}
        >
          <ImageWithFallback
            src={previewImage}
            alt="Preview"
            className="w-full h-full"
            style={{ objectFit: mediaParams.fit }}
          />
        </div>

        {/* Render template overlays based on type */}
        {template && (
          <>
            {/* Text Overlay Template */}
            {template.type === "text-overlay" && template.params.text && (
              <div
                className={`absolute top-0 bottom-0 w-1/3 flex items-center justify-center p-8 ${
                  template.params.placement === "left" ? "left-0" : "right-0"
                }`}
                style={{
                  backgroundColor: template.params.color,
                  opacity: template.params.opacity,
                }}
              >
                <div
                  className="text-center"
                  style={{
                    color: getTextColor(template.params.color),
                  }}
                  dangerouslySetInnerHTML={{ __html: template.params.text }}
                />
              </div>
            )}

            {/* Lower Third Template */}
            {template.type === "lower-third" && (
              <div
                className={`absolute left-0 right-0 px-8 py-4 ${
                  template.params.position === "bottom" ? "bottom-0" : "top-0"
                }`}
                style={{
                  backgroundColor: template.params.color,
                }}
              >
                <div
                  className="mb-1"
                  style={{ color: getTextColor(template.params.color) }}
                  dangerouslySetInnerHTML={{ __html: template.params.title }}
                />
                <div
                  className="opacity-90"
                  style={{ color: getTextColor(template.params.color) }}
                  dangerouslySetInnerHTML={{ __html: template.params.subtitle }}
                />
              </div>
            )}

            {/* Split Screen Template */}
            {template.type === "split-screen" && (
              <>
                <div
                  className="absolute top-0 bottom-0 left-0 flex items-center justify-center p-8"
                  style={{
                    width: `${template.params.splitRatio}%`,
                    backgroundColor: template.params.leftColor,
                    opacity: 0.9,
                  }}
                >
                  <div
                    className="text-center"
                    style={{
                      color: getTextColor(template.params.leftColor),
                    }}
                    dangerouslySetInnerHTML={{ __html: template.params.leftText }}
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 right-0 flex items-center justify-center p-8"
                  style={{
                    width: `${100 - template.params.splitRatio}%`,
                    backgroundColor: template.params.rightColor,
                    opacity: 0.9,
                  }}
                >
                  <div
                    className="text-center"
                    style={{
                      color: getTextColor(template.params.rightColor),
                    }}
                    dangerouslySetInnerHTML={{ __html: template.params.rightText }}
                  />
                </div>
              </>
            )}

            {/* Corner Badge Template */}
            {template.type === "corner-badge" && template.params.text && (
              <div
                className={`absolute ${getCornerClasses(
                  template.params.corner
                )} ${getSizeClasses(template.params.size)} rounded-md`}
                style={{
                  backgroundColor: template.params.color,
                }}
              >
                <span
                  style={{
                    color: getTextColor(template.params.color),
                  }}
                  dangerouslySetInnerHTML={{ __html: template.params.text }}
                />
              </div>
            )}

            {/* Full Screen Template */}
            {template.type === "full-screen" && template.params.text && (
              <div
                className="absolute inset-0 flex items-center justify-center p-12"
                style={{
                  backgroundColor: template.params.backgroundColor,
                  opacity: template.params.opacity,
                }}
              >
                <div
                  className={`text-${template.params.textAlign}`}
                  style={{
                    color: getTextColor(template.params.backgroundColor),
                    textAlign: template.params.textAlign,
                  }}
                  dangerouslySetInnerHTML={{ __html: template.params.text }}
                />
              </div>
            )}

            {/* Bulleted List Template */}
            {template.type === "bulleted-list" && (() => {
              const getBulletIcon = (style: string, index: number) => {
                const iconClass = "w-5 h-5 mr-3 flex-shrink-0";
                const iconStyle = { color: getTextColor(template.params.color) };
                
                switch (style) {
                  case "disc":
                    return <Circle className={iconClass} style={iconStyle} fill="currentColor" />;
                  case "number":
                    return <span className="mr-3 flex-shrink-0" style={iconStyle}>{index + 1}.</span>;
                  case "check":
                    return <CheckCircle className={iconClass} style={iconStyle} />;
                  case "arrow":
                    return <ArrowRight className={iconClass} style={iconStyle} />;
                  default:
                    return <Circle className={iconClass} style={iconStyle} fill="currentColor" />;
                }
              };

              const getPositionClasses = () => {
                switch (template.params.position) {
                  case "left":
                    return "items-start";
                  case "right":
                    return "items-end";
                  case "center":
                  default:
                    return "items-center";
                }
              };

              const getAlignmentClasses = () => {
                switch (template.params.position) {
                  case "left":
                    return "text-left";
                  case "right":
                    return "text-right";
                  case "center":
                  default:
                    return "text-center";
                }
              };

              // For preview, show all bullets in stacked mode or just the first 3
              const displayBullets = template.params.stacked 
                ? template.params.bullets.slice(0, 3) 
                : template.params.bullets.slice(0, 1);

              return (
                <div 
                  className={`absolute inset-0 flex flex-col ${getPositionClasses()} justify-center p-12`}
                  style={{
                    backgroundColor: template.params.color,
                    opacity: 0.92,
                  }}
                >
                  <div className="space-y-4 max-w-2xl w-full">
                    {displayBullets.map((bullet: any, index: number) => (
                      <div 
                        key={bullet.id}
                        className={`flex items-start ${template.params.position === 'right' ? 'flex-row-reverse' : ''}`}
                      >
                        {getBulletIcon(template.params.bulletStyle, index)}
                        <p 
                          className={`flex-1 ${getAlignmentClasses()}`}
                          style={{ color: getTextColor(template.params.color) }}
                        >
                          {bullet.text}
                        </p>
                      </div>
                    ))}
                    {template.params.bullets.length > (template.params.stacked ? 3 : 1) && (
                      <p 
                        className={`text-sm opacity-70 ${getAlignmentClasses()}`}
                        style={{ color: getTextColor(template.params.color) }}
                      >
                        +{template.params.bullets.length - (template.params.stacked ? 3 : 1)} more...
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}