import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { AnswerCheckbox } from "./ui/answer-checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { MediaUploadDialog } from "./MediaUploadDialog";
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  GripVertical, 
  Image as ImageIcon, 
  MoreVertical, 
  Edit2, 
  Copy,
  CircleDot,
  CheckSquare,
  CircleHelp,
  Link2,
  X
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type QuestionType = "single-choice" | "multiple-choice" | "true-false" | "matching";

interface AnswerOption {
  id: string;
  text: string;
  image?: string;
  isCorrect: boolean;
  feedback?: string;
}

interface MatchingPair {
  id: string;
  left: string;
  leftImage?: string;
  right: string;
  rightImage?: string;
}

interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  questionImage?: string;
  answers?: AnswerOption[];
  matchingPairs?: MatchingPair[];
}

interface QuestionBuilderProps {
  type: "knowledge-check" | "assessment";
  scenes?: Array<{ id: number; title: string; transcript: string }>;
  searchQuery?: string;
  onResultCountChange?: (count: number) => void;
  initialQuestion?: Question;
  onSave?: (question: Question) => void;
  onCancel?: () => void;
}

const QUESTION_TYPE_CONFIG = {
  "single-choice": {
    label: "Single Choice",
    icon: CircleDot,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    description: "One correct answer"
  },
  "multiple-choice": {
    label: "Multiple Choice",
    icon: CheckSquare,
    color: "bg-green-100 text-green-700 border-green-200",
    description: "Multiple correct answers"
  },
  "true-false": {
    label: "True/False",
    icon: CircleHelp,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    description: "True or false question"
  },
  "matching": {
    label: "Matching",
    icon: Link2,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    description: "Match pairs of items"
  }
};

export function QuestionBuilder({ type, scenes, searchQuery = "", onResultCountChange, initialQuestion, onSave, onCancel }: QuestionBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm] = useState(!!initialQuestion || !!onSave);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(initialQuestion || null);
  const [questionType, setQuestionType] = useState<QuestionType>(initialQuestion?.type || "single-choice");
  const [questionText, setQuestionText] = useState(initialQuestion?.questionText || "");
  const [questionImage, setQuestionImage] = useState<string | undefined>(initialQuestion?.questionImage);
  const [answers, setAnswers] = useState<AnswerOption[]>(
    initialQuestion?.answers || [
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
    ]
  );
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>(
    initialQuestion?.matchingPairs || [
      { id: "1", left: "", right: "" },
      { id: "2", left: "", right: "" },
    ]
  );
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [numTotalAnswers, setNumTotalAnswers] = useState(initialQuestion?.answers?.length || 4);
  const [numCorrectAnswers, setNumCorrectAnswers] = useState(
    initialQuestion?.answers?.filter(a => a.isCorrect).length || 1
  );
  const [showMediaDialog, setShowMediaDialog] = useState(false);

  // Filter questions based on search query
  const filteredQuestions = searchQuery
    ? questions.filter(q => 
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answers?.some(a => a.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
        q.matchingPairs?.some(p => 
          p.left.toLowerCase().includes(searchQuery.toLowerCase()) || 
          p.right.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : questions;

  useEffect(() => {
    if (onResultCountChange) {
      onResultCountChange(searchQuery ? filteredQuestions.length : 0);
    }
  }, [searchQuery, filteredQuestions.length, onResultCountChange]);

  const handleCreateQuestion = () => {
    setQuestionType("single-choice");
    setQuestionText("");
    setQuestionImage(undefined);
    setNumTotalAnswers(4);
    setNumCorrectAnswers(1);
    setAnswers([
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
      { id: "3", text: "", isCorrect: false },
      { id: "4", text: "", isCorrect: false },
    ]);
    setMatchingPairs([
      { id: "1", left: "", right: "" },
      { id: "2", left: "", right: "" },
    ]);
    setGeneratePrompt("");
    setCurrentQuestion(null);
    setShowForm(true);
  };

  const handleEditQuestion = (question: Question) => {
    setQuestionType(question.type);
    setQuestionText(question.questionText);
    setQuestionImage(question.questionImage);
    setAnswers(question.answers || []);
    setMatchingPairs(question.matchingPairs || []);
    setCurrentQuestion(question);
    setShowForm(true);
  };

  const handleSaveQuestion = () => {
    if (!questionText.trim()) {
      toast.error("Please enter a question");
      return;
    }

    if (questionType === "matching") {
      const validPairs = matchingPairs.filter(p => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) {
        toast.error("Please add at least 2 matching pairs");
        return;
      }
    } else {
      const validAnswers = answers.filter(a => a.text.trim());
      if (validAnswers.length < 2) {
        toast.error("Please add at least 2 answer options");
        return;
      }
      
      const hasCorrect = validAnswers.some(a => a.isCorrect);
      if (!hasCorrect) {
        toast.error("Please mark at least one correct answer");
        return;
      }
    }

    const newQuestion: Question = {
      id: currentQuestion?.id || initialQuestion?.id || Date.now().toString(),
      type: questionType,
      questionText,
      questionImage,
      answers: questionType !== "matching" ? answers.filter(a => a.text.trim()) : undefined,
      matchingPairs: questionType === "matching" ? matchingPairs.filter(p => p.left.trim() && p.right.trim()) : undefined,
    };

    if (onSave) {
      // If used as standalone editor (from App.tsx)
      onSave(newQuestion);
      toast.success(initialQuestion ? "Question updated" : "Question added");
    } else {
      // Original list-based behavior
      if (currentQuestion) {
        setQuestions(questions.map(q => q.id === currentQuestion.id ? newQuestion : q));
        toast.success("Question updated");
      } else {
        setQuestions([...questions, newQuestion]);
        toast.success("Question added");
      }
      setShowForm(false);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    toast.success("Question deleted");
  };

  const handleDuplicateQuestion = (question: Question) => {
    const duplicate = {
      ...question,
      id: Date.now().toString(),
    };
    setQuestions([...questions, duplicate]);
    toast.success("Question duplicated");
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { id: Date.now().toString(), text: "", isCorrect: false }]);
  };

  const handleRemoveAnswer = (id: string) => {
    if (answers.length > 2) {
      setAnswers(answers.filter(a => a.id !== id));
    }
  };

  const handleAnswerChange = (id: string, text: string) => {
    setAnswers(answers.map(a => a.id === id ? { ...a, text } : a));
  };

  const handleAnswerFeedbackChange = (id: string, feedback: string) => {
    setAnswers(answers.map(a => a.id === id ? { ...a, feedback } : a));
  };

  const handleAnswerCorrectChange = (id: string, isCorrect: boolean) => {
    if (questionType === "single-choice" || questionType === "true-false") {
      setAnswers(answers.map(a => ({ ...a, isCorrect: a.id === id ? isCorrect : false })));
    } else {
      setAnswers(answers.map(a => a.id === id ? { ...a, isCorrect } : a));
    }
  };

  const handleAddMatchingPair = () => {
    setMatchingPairs([...matchingPairs, { id: Date.now().toString(), left: "", right: "" }]);
  };

  const handleRemoveMatchingPair = (id: string) => {
    if (matchingPairs.length > 2) {
      setMatchingPairs(matchingPairs.filter(p => p.id !== id));
    }
  };

  const handleMatchingPairChange = (id: string, side: "left" | "right", value: string) => {
    setMatchingPairs(matchingPairs.map(p => 
      p.id === id ? { ...p, [side]: value } : p
    ));
  };

  const handleGenerateQuestion = () => {
    // Get transcript from scenes
    const transcript = scenes?.map(s => s.transcript).join(" ") || "";
    
    if (!transcript.trim()) {
      toast.error("No transcript available to generate questions from");
      return;
    }

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Generating question from transcript...",
        success: () => {
          // Generate based on question type and parameters
          if (questionType === "single-choice") {
            setQuestionText("What is the main advantage of using AI-powered tools for video creation?");
            setAnswers([
              { id: "1", text: "Speed and efficiency", isCorrect: true, feedback: "Correct! AI tools significantly reduce production time." },
              { id: "2", text: "Higher costs", isCorrect: false, feedback: "Actually, AI tools can reduce costs." },
              { id: "3", text: "Limited features", isCorrect: false, feedback: "AI tools typically offer extensive features." },
              { id: "4", text: "Complex workflows", isCorrect: false, feedback: "AI tools simplify workflows." },
            ].slice(0, numTotalAnswers));
          } else if (questionType === "multiple-choice") {
            setQuestionText("Which of the following are benefits of the platform? (Select all that apply)");
            setAnswers([
              { id: "1", text: "Speed", isCorrect: true, feedback: "Correct! Speed is one of the main advantages." },
              { id: "2", text: "Quality", isCorrect: true, feedback: "Correct! Quality is emphasized." },
              { id: "3", text: "Ease of use", isCorrect: true, feedback: "Correct! Ease of use is a key feature." },
              { id: "4", text: "Higher complexity", isCorrect: false, feedback: "The platform simplifies creation." },
            ].slice(0, numTotalAnswers));
          } else if (questionType === "true-false") {
            setQuestionText("The platform offers seamless team collaboration features.");
            setAnswers([
              { id: "1", text: "True", isCorrect: true, feedback: "Correct! The platform emphasizes team collaboration." },
              { id: "2", text: "False", isCorrect: false, feedback: "The platform does offer collaboration features." },
            ]);
          } else if (questionType === "matching") {
            setQuestionText("Match each template feature with its primary use case:");
            setMatchingPairs([
              { id: "1", left: "Text overlays", right: "Side-aligned messaging" },
              { id: "2", left: "Lower thirds", right: "Speaker identification" },
              { id: "3", left: "Full screen overlays", right: "Title cards and transitions" },
            ]);
          }
          
          return "Question generated successfully. You can now edit the fields as needed.";
        },
        error: "Failed to generate question",
      }
    );
  };

  const moveQuestion = (dragIndex: number, hoverIndex: number) => {
    const dragQuestion = questions[dragIndex];
    const newQuestions = [...questions];
    newQuestions.splice(dragIndex, 1);
    newQuestions.splice(hoverIndex, 0, dragQuestion);
    setQuestions(newQuestions);
  };

  const QuestionCard = ({ question, index }: { question: Question; index: number }) => {
    const [{ isDragging }, drag] = useDrag({
      type: "question",
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: "question",
      hover: (item: { index: number }) => {
        if (item.index !== index) {
          moveQuestion(item.index, index);
          item.index = index;
        }
      },
    });

    const config = QUESTION_TYPE_CONFIG[question.type];
    const Icon = config.icon;

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`bg-white rounded-lg border-2 border-gray-200 overflow-hidden transition-all ${
          isDragging ? "opacity-50" : "opacity-100"
        }`}
        style={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="cursor-move pt-1">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${config.color} border gap-1.5`}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </Badge>
              </div>
              
              <p className="text-foreground mb-3">{question.questionText}</p>
              
              {question.questionImage && (
                <div className="mb-3 rounded-md overflow-hidden border border-gray-200 w-32 h-20">
                  <img 
                    src={question.questionImage} 
                    alt="Question" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-1.5 text-sm">
                {question.type === "matching" ? (
                  <div className="space-y-1">
                    {question.matchingPairs?.map((pair) => (
                      <div key={pair.id} className="flex items-center gap-2 text-muted-foreground">
                        <Link2 className="w-3 h-3" />
                        <span>{pair.left}</span>
                        <span>→</span>
                        <span>{pair.right}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {question.answers?.map((answer) => (
                      <div key={answer.id} className="flex items-center gap-2">
                        {question.type === "single-choice" || question.type === "true-false" ? (
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            answer.isCorrect ? "border-green-600 bg-green-600" : "border-gray-300"
                          }`}>
                            {answer.isCorrect && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        ) : (
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            answer.isCorrect ? "border-green-600 bg-green-600" : "border-gray-300"
                          }`}>
                            {answer.isCorrect && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                        <span className={answer.isCorrect ? "text-green-700 font-medium" : "text-muted-foreground"}>
                          {answer.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditQuestion(question)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicateQuestion(question)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-8 pb-24">
            {!onSave && (
              <>
            {/* Questions List - Always show if there are questions */}
            {(questions.length > 0 || searchQuery) && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-foreground">
                      {searchQuery ? `${filteredQuestions.length} Results` : `${questions.length} ${questions.length === 1 ? "Question" : "Questions"}`}
                    </h3>
                  </div>
                  {!showForm && !searchQuery && (
                    <Button onClick={handleCreateQuestion} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Question
                    </Button>
                  )}
                </div>

                {filteredQuestions.length > 0 ? (
                  <DndProvider backend={HTML5Backend}>
                    <div className="space-y-3">
                      {filteredQuestions.map((question, index) => (
                        <QuestionCard key={question.id} question={question} index={index} />
                      ))}
                    </div>
                  </DndProvider>
                ) : (
                   searchQuery ? (
                     <div className="text-center py-12 text-muted-foreground">
                        <p>No questions found matching "{searchQuery}"</p>
                     </div>
                   ) : null
                )}
              </div>
            )}

            {/* Empty State - Only show when no questions and no form */}
            {questions.length === 0 && !showForm && !searchQuery && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 mb-4">
                  <CircleHelp className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="text-foreground mb-2">No questions yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create questions manually or use AI to generate them
                </p>
                <Button onClick={handleCreateQuestion} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </div>
            )}
              </>
            )}

            {/* Question Form - Show at bottom when adding/editing */}
            {(showForm || onSave) && (
              // Question Form View
              <div className="max-w-4xl mx-auto">
                {/* Header for standalone mode */}
                {onSave && (
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-foreground">
                      {initialQuestion ? "Edit Question" : "Add Question"}
                    </h2>
                    {onCancel && (
                      <Button variant="ghost" onClick={onCancel} className="gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
                {/* Single Container with all inputs */}
                <div 
                  className="rounded-xl p-6 transition-all space-y-6"
                  style={{
                    boxShadow: '0 20px 70px rgba(0, 0, 0, 0.15), 0 8px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(163, 163, 163, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  {/* Question Type and Generate Button */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label className="text-foreground">Question Type</Label>
                      <Select value={questionType} onValueChange={(value) => {
                        setQuestionType(value as QuestionType);
                        if (value === "true-false") {
                          setAnswers([
                            { id: "1", text: "True", isCorrect: false },
                            { id: "2", text: "False", isCorrect: false },
                          ]);
                          setNumTotalAnswers(2);
                        } else if (value === "matching") {
                          setMatchingPairs([
                            { id: "1", left: "", right: "" },
                            { id: "2", left: "", right: "" },
                          ]);
                        } else if (value === "single-choice") {
                          setNumCorrectAnswers(1);
                          setNumTotalAnswers(4);
                          setAnswers([
                            { id: "1", text: "", isCorrect: false },
                            { id: "2", text: "", isCorrect: false },
                            { id: "3", text: "", isCorrect: false },
                            { id: "4", text: "", isCorrect: false },
                          ]);
                        } else if (value === "multiple-choice") {
                          setNumTotalAnswers(4);
                          setNumCorrectAnswers(1);
                          setAnswers([
                            { id: "1", text: "", isCorrect: false },
                            { id: "2", text: "", isCorrect: false },
                            { id: "3", text: "", isCorrect: false },
                            { id: "4", text: "", isCorrect: false },
                          ]);
                        }
                      }}>
                        <SelectTrigger className="bg-white/60 border-white/40 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(QUESTION_TYPE_CONFIG).map(([type, config]) => {
                            const Icon = config.icon;
                            return (
                              <SelectItem key={type} value={type}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  <span>{config.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dynamic Parameters based on question type */}
                    {questionType === "single-choice" && (
                      <div className="w-32 space-y-2">
                        <Label className="text-foreground text-xs">Total Answers</Label>
                        <Select value={numTotalAnswers.toString()} onValueChange={(value) => {
                          const total = parseInt(value);
                          setNumTotalAnswers(total);
                          // Update answers array to match total
                          const newAnswers = Array.from({ length: total }, (_, i) => {
                            const existingAnswer = answers[i];
                            return existingAnswer || { id: Date.now().toString() + i, text: "", isCorrect: false };
                          });
                          setAnswers(newAnswers);
                        }}>
                          <SelectTrigger className="bg-white/60 border-white/40 shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5].map((num) => (
                              <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {questionType === "multiple-choice" && (
                      <>
                        <div className="w-32 space-y-2">
                          <Label className="text-foreground text-xs">Total Answers</Label>
                          <Select value={numTotalAnswers.toString()} onValueChange={(value) => {
                            const total = parseInt(value);
                            setNumTotalAnswers(total);
                            if (numCorrectAnswers >= total) {
                              setNumCorrectAnswers(Math.max(1, total - 1));
                            }
                            // Update answers array to match total
                            const newAnswers = Array.from({ length: total }, (_, i) => {
                              const existingAnswer = answers[i];
                              return existingAnswer || { id: Date.now().toString() + i, text: "", isCorrect: false };
                            });
                            setAnswers(newAnswers);
                          }}>
                            <SelectTrigger className="bg-white/60 border-white/40 shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-32 space-y-2">
                          <Label className="text-foreground text-xs">Correct Answers</Label>
                          <Select value={numCorrectAnswers.toString()} onValueChange={(value) => setNumCorrectAnswers(parseInt(value))}>
                            <SelectTrigger className="bg-white/60 border-white/40 shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: numTotalAnswers - 1 }, (_, i) => i + 1).map((num) => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <Button
                      onClick={handleGenerateQuestion}
                      variant="outline"
                      className="gap-2 bg-white/40 border-white/40 hover:bg-white/60"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </Button>
                  </div>

                  {/* Question Text and Image - Single Row */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Question Text</Label>
                    <div className="flex gap-3 items-start">
                      <Textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter your question..."
                        className="flex-1 min-h-[80px] bg-white/60 border-white/40 shadow-sm resize-none"
                      />
                      <div className="flex flex-col gap-2">
                        {questionImage ? (
                          <div className="relative w-32 h-20 rounded-lg overflow-hidden border-2 border-white/40 bg-white shadow-sm group">
                            <img src={questionImage} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 bg-white/20 hover:bg-white/30"
                                onClick={() => setShowMediaDialog(true)}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-white" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 bg-white/20 hover:bg-white/30"
                                onClick={() => setQuestionImage(undefined)}
                              >
                                <X className="w-3.5 h-3.5 text-white" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setShowMediaDialog(true)}
                            className="w-32 h-20 flex-col gap-1 bg-white/40 border-white/40 hover:bg-white/60 border-2 border-dashed"
                          >
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Add Image</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Answer Options */}
                  {questionType === "matching" ? (
                    <div className="space-y-3">
                      <Label className="text-foreground">Matching Pairs</Label>
                      {matchingPairs.map((pair, index) => (
                        <div key={pair.id} className="p-4 rounded-lg bg-white/30 border border-white/30 space-y-2">
                          <div className="flex gap-3 items-start">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs text-foreground/70">Left Item</Label>
                              <Input
                                placeholder={`Left item ${index + 1}`}
                                value={pair.left}
                                onChange={(e) => handleMatchingPairChange(pair.id, "left", e.target.value)}
                                className="bg-white/60 border-white/40"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs text-foreground/70">Right Item</Label>
                              <Input
                                placeholder={`Right item ${index + 1}`}
                                value={pair.right}
                                onChange={(e) => handleMatchingPairChange(pair.id, "right", e.target.value)}
                                className="bg-white/60 border-white/40"
                              />
                            </div>
                            {matchingPairs.length > 2 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMatchingPair(pair.id)}
                                className="shrink-0 mt-5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={handleAddMatchingPair} className="w-full bg-white/40 border-white/40 hover:bg-white/60">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Pair
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-foreground">Answer Options</Label>
                      
                      {/* Header Row */}
                      <div className="grid grid-cols-[60px_1fr] gap-3 px-4 pb-2">
                        <Label className="text-xs text-foreground/70">Correct</Label>
                        <Label className="text-xs text-foreground/70">Answer</Label>
                      </div>

                      {answers.map((answer, index) => (
                        <div key={answer.id} className="p-4 rounded-lg bg-white/30 border border-white/30 shadow-sm space-y-3">
                          <div className="grid grid-cols-[60px_1fr] gap-3 items-start">
                            <div className="flex justify-center pt-2">
                              {questionType === "single-choice" || questionType === "true-false" ? (
                                <RadioGroup value={answers.find(a => a.isCorrect)?.id || ""}>
                                  <RadioGroupItem
                                    value={answer.id}
                                    onClick={() => handleAnswerCorrectChange(answer.id, true)}
                                  />
                                </RadioGroup>
                              ) : (
                                <AnswerCheckbox
                                  checked={answer.isCorrect}
                                  onCheckedChange={(checked) => handleAnswerCorrectChange(answer.id, checked as boolean)}
                                />
                              )}
                            </div>
                            <div className="space-y-1">
                              <Input
                                placeholder={`Answer option ${index + 1}`}
                                value={answer.text}
                                onChange={(e) => handleAnswerChange(answer.id, e.target.value)}
                                disabled={questionType === "true-false"}
                                className="bg-white border-gray-300 shadow-sm"
                              />
                            </div>
                          </div>
                          <div className="pl-[72px]">
                            <Label className="text-xs text-foreground/70">Feedback (optional)</Label>
                            <Textarea
                              placeholder="Explain why this answer is correct or incorrect"
                              value={answer.feedback || ""}
                              onChange={(e) => handleAnswerFeedbackChange(answer.id, e.target.value)}
                              className="min-h-[60px] text-sm bg-white border-gray-300 shadow-sm resize-none mt-1"
                            />
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-foreground/60">
                        {questionType === "single-choice" || questionType === "true-false"
                          ? "Select the correct answer"
                          : "Select all correct answers"}
                      </p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex gap-2 pt-6 border-t border-white/30">
                    <Button 
                      variant="outline" 
                      onClick={onCancel || (() => setShowForm(false))}
                      className="bg-white/40 border-white/40 hover:bg-white/60"
                    >
                      Cancel
                    </Button>
                    <div className="flex-1" />
                    <Button 
                      onClick={handleSaveQuestion}
                      className="px-6"
                    >
                      {(currentQuestion || initialQuestion) ? "Save Changes" : "Add Question"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Media Upload Dialog */}
      <MediaUploadDialog 
        open={showMediaDialog}
        onOpenChange={setShowMediaDialog}
        onMediaSelect={(url) => setQuestionImage(url)}
      />
    </div>
  );
}