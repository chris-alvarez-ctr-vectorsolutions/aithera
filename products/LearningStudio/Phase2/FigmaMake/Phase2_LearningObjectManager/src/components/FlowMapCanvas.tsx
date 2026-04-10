import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  X, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  FileText,
  CircleDot,
  CheckSquare,
  CircleHelp,
  Link2,
  GripVertical,
  Trash2,
  Pin,
  PinOff,
  Info,
  Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface Scene {
  id: number;
  title: string;
  transcript: string;
}

type QuestionType = "single-choice" | "multiple-choice" | "true-false" | "matching";

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  answers?: AnswerOption[];
}

interface FlowNode {
  id: string;
  type: 'scene' | 'question' | 'answer';
  position: { x: number; y: number };
  data: {
    sceneId?: number;
    questionId?: string;
    answerId?: string;
    title: string;
    subtitle?: string;
    questionType?: QuestionType;
  };
}

interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface FlowMapCanvasProps {
  scenes: Scene[];
  knowledgeCheckQuestions: Question[];
  assessmentQuestions: Question[];
  onClose: () => void;
}

const QUESTION_TYPE_CONFIG = {
  "single-choice": { label: "Single Choice", icon: CircleDot, color: "bg-blue-100 text-blue-700 border-blue-200" },
  "multiple-choice": { label: "Multiple Choice", icon: CheckSquare, color: "bg-green-100 text-green-700 border-green-200" },
  "true-false": { label: "True/False", icon: CircleHelp, color: "bg-purple-100 text-purple-700 border-purple-200" },
  "matching": { label: "Matching", icon: Link2, color: "bg-orange-100 text-orange-700 border-orange-200" }
};

type PinPosition = 'right' | 'left' | 'top' | 'bottom' | null;

export function FlowMapCanvas({ scenes, knowledgeCheckQuestions, assessmentQuestions, onClose }: FlowMapCanvasProps) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tempConnection, setTempConnection] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);

  // Details Panel State
  const [detailsPanelPosition, setDetailsPanelPosition] = useState({ x: window.innerWidth - 420, y: 80 });
  const [detailsPanelPinned, setDetailsPanelPinned] = useState<PinPosition>('right');
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [panelDragStart, setPanelDragStart] = useState({ x: 0, y: 0 });

  // Initialize nodes from scenes and questions
  useEffect(() => {
    const initialNodes: FlowNode[] = [];
    let xOffset = 100;
    let yOffset = 100;

    // Add scene nodes
    scenes.forEach((scene, index) => {
      initialNodes.push({
        id: `scene-${scene.id}`,
        type: 'scene',
        position: { x: xOffset, y: yOffset + (index * 150) },
        data: {
          sceneId: scene.id,
          title: scene.title,
          subtitle: scene.transcript.substring(0, 60) + '...'
        }
      });
    });

    // Add question nodes (knowledge checks)
    knowledgeCheckQuestions.forEach((question, index) => {
      initialNodes.push({
        id: `kc-${question.id}`,
        type: 'question',
        position: { x: xOffset + 400, y: yOffset + (index * 180) },
        data: {
          questionId: question.id,
          title: question.questionText,
          subtitle: 'Knowledge Check',
          questionType: question.type
        }
      });
    });

    // Add assessment question nodes
    assessmentQuestions.forEach((question, index) => {
      initialNodes.push({
        id: `assessment-${question.id}`,
        type: 'question',
        position: { x: xOffset + 800, y: yOffset + (index * 180) },
        data: {
          questionId: question.id,
          title: question.questionText,
          subtitle: 'Assessment',
          questionType: question.type
        }
      });
    });

    setNodes(initialNodes);
  }, [scenes, knowledgeCheckQuestions, assessmentQuestions]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode);
      if (node && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        // Calculate new position accounting for zoom, pan, and initial drag offset
        const newX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
        const newY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
        setNodes(nodes.map(n => 
          n.id === draggingNode 
            ? { ...n, position: { x: newX, y: newY } } 
            : n
        ));
      }
    } else if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const node = nodes.find(n => n.id === connectingFrom);
        if (node) {
          setTempConnection({
            from: { 
              x: (node.position.x + 300) * zoom + pan.x, 
              y: (node.position.y + 40) * zoom + pan.y 
            },
            to: { x: e.clientX - rect.left, y: e.clientY - rect.top }
          });
        }
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
    if (connectingFrom) {
      setConnectingFrom(null);
      setTempConnection(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if ((e.target as HTMLElement).classList.contains('connection-handle')) {
      setConnectingFrom(nodeId);
    } else if (!(e.target as HTMLElement).closest('button')) {
      const node = nodes.find(n => n.id === nodeId);
      if (node && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        // Calculate the offset from the node's top-left corner to the mouse position
        const offsetX = (e.clientX - rect.left - pan.x) / zoom - node.position.x;
        const offsetY = (e.clientY - rect.top - pan.y) / zoom - node.position.y;
        setDragOffset({ x: offsetX, y: offsetY });
        setDraggingNode(nodeId);
        setSelectedNode(nodeId);
      }
    }
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!draggingNode && !connectingFrom) {
      setSelectedNode(nodeId);
    }
  };

  const handleNodeMouseUp = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== nodeId) {
      // Create connection
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        from: connectingFrom,
        to: nodeId
      };
      setConnections([...connections, newConnection]);
      toast.success('Connection created');
    }
    setConnectingFrom(null);
    setTempConnection(null);
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
    toast.success('Node deleted');
  };

  const handleDeleteConnection = (connId: string) => {
    setConnections(connections.filter(c => c.id !== connId));
    toast.success('Connection deleted');
  };

  const getConnectionPath = (from: FlowNode, to: FlowNode) => {
    const startX = from.position.x + 300;
    const startY = from.position.y + 40;
    const endX = to.position.x;
    const endY = to.position.y + 40;
    
    const midX = (startX + endX) / 2;
    
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  };

  // Details Panel Handlers
  const handlePanelMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-drag-handle')) {
      setIsDraggingPanel(true);
      setPanelDragStart({ 
        x: e.clientX - detailsPanelPosition.x, 
        y: e.clientY - detailsPanelPosition.y 
      });
      if (detailsPanelPinned) {
        setDetailsPanelPinned(null);
      }
    }
  };

  const handlePanelMouseMove = (e: MouseEvent) => {
    if (isDraggingPanel) {
      setDetailsPanelPosition({
        x: e.clientX - panelDragStart.x,
        y: e.clientY - panelDragStart.y
      });
    }
  };

  const handlePanelMouseUp = () => {
    setIsDraggingPanel(false);
  };

  useEffect(() => {
    if (isDraggingPanel) {
      window.addEventListener('mousemove', handlePanelMouseMove);
      window.addEventListener('mouseup', handlePanelMouseUp);
      return () => {
        window.removeEventListener('mousemove', handlePanelMouseMove);
        window.removeEventListener('mouseup', handlePanelMouseUp);
      };
    }
  }, [isDraggingPanel, panelDragStart]);

  // Global mouse handlers for node dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingNode && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const node = nodes.find(n => n.id === draggingNode);
        if (node) {
          const newX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
          const newY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
          setNodes(nodes.map(n => 
            n.id === draggingNode 
              ? { ...n, position: { x: newX, y: newY } } 
              : n
          ));
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggingNode || connectingFrom || isPanning) {
        setDraggingNode(null);
        setConnectingFrom(null);
        setTempConnection(null);
        setIsPanning(false);
      }
    };

    if (draggingNode || connectingFrom || isPanning) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [draggingNode, connectingFrom, isPanning, nodes, pan, zoom, dragOffset]);

  const togglePin = (position: PinPosition) => {
    if (detailsPanelPinned === position) {
      setDetailsPanelPinned(null);
    } else {
      setDetailsPanelPinned(position);
      // Set position based on pin location
      switch (position) {
        case 'right':
          setDetailsPanelPosition({ x: window.innerWidth - 420, y: 80 });
          break;
        case 'left':
          setDetailsPanelPosition({ x: 20, y: 80 });
          break;
        case 'top':
          setDetailsPanelPosition({ x: (window.innerWidth - 400) / 2, y: 80 });
          break;
        case 'bottom':
          setDetailsPanelPosition({ x: (window.innerWidth - 400) / 2, y: window.innerHeight - 520 });
          break;
      }
    }
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const getFullNodeData = () => {
    if (!selectedNodeData) return null;
    
    if (selectedNodeData.type === 'scene') {
      return scenes.find(s => s.id === selectedNodeData.data.sceneId);
    } else if (selectedNodeData.type === 'question') {
      const kc = knowledgeCheckQuestions.find(q => q.id === selectedNodeData.data.questionId);
      if (kc) return kc;
      return assessmentQuestions.find(q => q.id === selectedNodeData.data.questionId);
    }
    return null;
  };

  const fullNodeData = getFullNodeData();
  const incomingConnections = connections.filter(c => c.to === selectedNode);
  const outgoingConnections = connections.filter(c => c.from === selectedNode);

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Object Flow Map</h2>
          <p className="text-sm text-muted-foreground">Create scenario-based learning flows</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleResetView} className="h-8 w-8">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close Flow Map
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-move canvas-background"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ 
            width: '100%', 
            height: '100%',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>
          
          {/* Draw connections */}
          {connections.map((conn) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            return (
              <g key={conn.id}>
                <path
                  d={getConnectionPath(fromNode, toNode)}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="pointer-events-auto cursor-pointer hover:stroke-blue-600 hover:stroke-[3px]"
                  onClick={() => handleDeleteConnection(conn.id)}
                />
              </g>
            );
          })}

          {/* Draw temporary connection line */}
          {tempConnection && (
            <line
              x1={tempConnection.from.x / zoom}
              y1={tempConnection.from.y / zoom}
              x2={(tempConnection.to.x - pan.x) / zoom}
              y2={(tempConnection.to.y - pan.y) / zoom}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </svg>

        {/* Render nodes */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const isScene = node.type === 'scene';
            const config = node.data.questionType ? QUESTION_TYPE_CONFIG[node.data.questionType] : null;
            const Icon = config?.icon || FileText;

            return (
              <motion.div
                key={node.id}
                className={`absolute select-none pointer-events-auto ${isSelected ? 'z-10' : 'z-0'}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: 300,
                  cursor: draggingNode === node.id ? 'grabbing' : 'grab'
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                onClick={(e) => handleNodeClick(e, node.id)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  className={`rounded-lg border-2 bg-white shadow-lg hover:shadow-xl transition-all ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="cursor-grab active:cursor-grabbing pt-1">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {isScene ? (
                            <Badge className="bg-sky-100 text-sky-700 border-sky-200 border gap-1.5">
                              <FileText className="w-3 h-3" />
                              Scene
                            </Badge>
                          ) : (
                            <Badge className={`${config?.color} border gap-1.5`}>
                              <Icon className="w-3 h-3" />
                              {node.data.subtitle}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="font-medium text-foreground text-sm mb-1 line-clamp-2">
                          {node.data.title}
                        </p>
                        
                        {node.data.subtitle && isScene && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {node.data.subtitle}
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                      )}
                    </div>

                    {/* Connection handles */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-muted-foreground">
                        {node.type === 'scene' ? 'Scene Node' : 'Question Node'}
                      </div>
                      <div 
                        className="connection-handle w-4 h-4 rounded-full bg-blue-500 hover:bg-blue-600 cursor-crosshair border-2 border-white shadow-md"
                        title="Drag to connect"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {selectedNode && selectedNodeData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-300 z-50"
            style={{
              left: detailsPanelPinned ? 
                (detailsPanelPinned === 'right' ? 'auto' : detailsPanelPinned === 'left' ? '20px' : detailsPanelPosition.x) : 
                detailsPanelPosition.x,
              right: detailsPanelPinned === 'right' ? '20px' : 'auto',
              top: detailsPanelPosition.y,
              width: 400,
              maxHeight: 500
            }}
            onMouseDown={handlePanelMouseDown}
          >
            {/* Panel Header */}
            <div className="panel-drag-handle cursor-move bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4" />
                <h3 className="font-semibold">Node Details</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-blue-700 text-white"
                  onClick={() => togglePin('right')}
                >
                  {detailsPanelPinned === 'right' ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-blue-700 text-white"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Panel Content */}
            <ScrollArea className="h-[calc(500px-52px)]">
              <div className="p-4 space-y-4">
                {/* Node Type Badge */}
                <div className="flex items-center gap-2">
                  {selectedNodeData.type === 'scene' ? (
                    <Badge className="bg-sky-100 text-sky-700 border-sky-200 border gap-1.5">
                      <FileText className="w-3 h-3" />
                      Scene Node
                    </Badge>
                  ) : (
                    <>
                      {selectedNodeData.data.questionType && (
                        <Badge className={`${QUESTION_TYPE_CONFIG[selectedNodeData.data.questionType]?.color} border gap-1.5`}>
                          {React.createElement(QUESTION_TYPE_CONFIG[selectedNodeData.data.questionType]?.icon || Info, { className: "w-3 h-3" })}
                          {QUESTION_TYPE_CONFIG[selectedNodeData.data.questionType]?.label}
                        </Badge>
                      )}
                      <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">
                        {selectedNodeData.data.subtitle}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</label>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedNodeData.data.title}</p>
                </div>

                {/* Content Details */}
                {selectedNodeData.type === 'scene' && fullNodeData && 'transcript' in fullNodeData && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transcript</label>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{fullNodeData.transcript}</p>
                  </div>
                )}

                {selectedNodeData.type === 'question' && fullNodeData && 'questionText' in fullNodeData && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question</label>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{fullNodeData.questionText}</p>
                    </div>

                    {fullNodeData.answers && fullNodeData.answers.length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Answer Options</label>
                        <div className="mt-2 space-y-2">
                          {fullNodeData.answers.map((answer) => (
                            <div 
                              key={answer.id} 
                              className={`p-2 rounded border text-sm ${
                                answer.isCorrect 
                                  ? 'bg-green-50 border-green-200 text-green-800' 
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {answer.isCorrect && <CheckSquare className="w-3.5 h-3.5 text-green-600" />}
                                <span>{answer.text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Connections */}
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Connections</label>
                  <div className="mt-2 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Incoming:</span>
                      <span className="ml-2 text-gray-600">{incomingConnections.length} connection(s)</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Outgoing:</span>
                      <span className="ml-2 text-gray-600">{outgoingConnections.length} connection(s)</span>
                    </div>
                  </div>
                </div>

                {/* Node ID (for debugging) */}
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Node ID</label>
                  <p className="text-xs font-mono text-gray-600 mt-1 bg-gray-50 p-2 rounded">{selectedNode}</p>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Drag nodes to reposition</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Click and drag the blue dot to create connections</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Click connections to delete them</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Drag canvas background to pan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Click nodes to view details</span>
          </div>
        </div>
      </div>
    </div>
  );
}