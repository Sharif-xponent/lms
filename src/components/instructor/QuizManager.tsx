"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Trash2, 
  Edit, 
  HelpCircle, 
  X, 
  GripVertical,
  Loader2,
  Clock,
  Target,
  Award
} from "lucide-react";
import { 
  getQuizzesByParent, 
  createQuiz, 
  updateQuiz, 
  deleteQuiz,
  reorderQuizzes
} from "@/lib/actions/quiz";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  attemptsAllowed: number;
  order: number;
  questions: Question[];
}

interface QuizManagerProps {
  parentId: string;
  parentType: "section" | "lesson";
  onQuizChange?: () => void;
}

// Sortable Quiz Item Component
function SortableQuizItem({ quiz, onEdit, onDelete, index }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quiz.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Quiz {index + 1}:</span>
            <span className="text-sm">{quiz.title}</span>
            <Badge variant="outline" className="text-xs">
              {quiz.questions?.length || 0} questions
            </Badge>
          </div>
          <div className="flex gap-3 mt-1 text-xs text-slate-500">
            <span>Pass: {quiz.passingScore}%</span>
            {quiz.timeLimit && <span>⏱ {quiz.timeLimit} min</span>}
            <span>Attempts: {quiz.attemptsAllowed === -1 ? "∞" : quiz.attemptsAllowed}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onEdit(quiz)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(quiz.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function QuizManager({ parentId, parentType, onQuizChange }: QuizManagerProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", options: ["", ""], correctAnswer: 0, points: 1 }
  ]);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    timeLimit: null as number | null,
    passingScore: 70,
    attemptsAllowed: 1,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchQuizzes();
  }, [parentId, parentType]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const result = await getQuizzesByParent(parentId, parentType);
      if (result.success) {
        setQuizzes(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({
      title: "",
      description: "",
      timeLimit: null,
      passingScore: 70,
      attemptsAllowed: 1,
    });
    setQuestions([{ text: "", options: ["", ""], correctAnswer: 0, points: 1 }]);
    setError("");
    setDialogOpen(true);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description || "",
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      attemptsAllowed: quiz.attemptsAllowed,
    });
    setQuestions(quiz.questions);
    setError("");
    setDialogOpen(true);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
    
    try {
      const result = await deleteQuiz(quizId);
      if (result.success) {
        await fetchQuizzes();
        onQuizChange?.();
      } else {
        setError(result.error);
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete quiz");
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", ""], correctAnswer: 0, points: 1 }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      setError("You need at least one question");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
    setError("");
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleAddOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push("");
    setQuestions(updated);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length <= 2) {
      setError("At least 2 options are required");
      return;
    }
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
    if (updated[questionIndex].correctAnswer >= updated[questionIndex].options.length) {
      updated[questionIndex].correctAnswer = 0;
    }
    setQuestions(updated);
    setError("");
  };

  const validateQuiz = () => {
    if (!quizForm.title.trim()) {
      setError("Please enter a quiz title");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1} text is required`);
        return false;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Option ${j + 1} in question ${i + 1} is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSaveQuiz = async () => {
    if (!validateQuiz()) return;

    try {
      setSubmitting(true);
      setError("");
      
      const data = {
        ...quizForm,
        questions: questions.map((q, idx) => ({ ...q, order: idx })),
        [parentType === "section" ? "sectionId" : "lessonId"]: parentId,
        order: editingQuiz?.order ?? quizzes.length,
      };

      let result;
      if (editingQuiz) {
        result = await updateQuiz({ id: editingQuiz.id, ...data });
      } else {
        result = await createQuiz(data);
      }

      if (result.success) {
        await fetchQuizzes();
        setDialogOpen(false);
        onQuizChange?.();
      } else {
        setError(result.error);
      }
    } catch (error: any) {
      setError(error.message || "Failed to save quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = quizzes.findIndex((q) => q.id === active.id);
      const newIndex = quizzes.findIndex((q) => q.id === over?.id);
      
      const newQuizzes = arrayMove(quizzes, oldIndex, newIndex);
      setQuizzes(newQuizzes);
      
      // Update order on server
      const updates = newQuizzes.map((quiz, index) => ({
        id: quiz.id,
        order: index,
      }));
      
      await reorderQuizzes({ quizzes: updates });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading quizzes...
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-600" />
          <h4 className="font-semibold text-sm">Quizzes</h4>
          {quizzes.length > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
              {quizzes.length} quiz{quizzes.length > 1 ? "zes" : ""}
            </Badge>
          )}
        </div>
        
        <Button size="sm" onClick={handleAddQuiz}>
          <Plus className="w-4 h-4 mr-1" />
          Add Quiz
        </Button>
      </div>
      
      {quizzes.length === 0 ? (
        <div className="text-center py-4 text-slate-500 text-sm">
          No quizzes yet. Click "Add Quiz" to create one.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={quizzes.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {quizzes.map((quiz, index) => (
                <SortableQuizItem
                  key={quiz.id}
                  quiz={quiz}
                  index={index}
                  onEdit={handleEditQuiz}
                  onDelete={handleDeleteQuiz}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Quiz Creation/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDialogOpen(false);
          setError("");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
            <DialogDescription>
              {editingQuiz 
                ? "Edit your quiz questions and settings" 
                : `Create a new quiz for this ${parentType}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Quiz Settings */}
            <div className="space-y-4">
              <div>
                <Label>Quiz Title *</Label>
                <Input
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder={`e.g., ${parentType === "section" ? "Section" : "Lesson"} Quiz 1`}
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  placeholder="Describe what this quiz covers..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) })}
                  />
                </div>
                
                <div>
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="No limit"
                    value={quizForm.timeLimit || ""}
                    onChange={(e) => setQuizForm({ ...quizForm, timeLimit: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
                
                <div>
                  <Label>Attempts Allowed</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={quizForm.attemptsAllowed}
                    onChange={(e) => setQuizForm({ ...quizForm, attemptsAllowed: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-slate-500 mt-1">Use -1 for unlimited</p>
                </div>
              </div>
            </div>
            
            {/* Questions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg">Questions</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </Button>
              </div>
              
              {questions.map((question, qIndex) => (
                <Card key={qIndex} className="relative">
                  <CardContent className="pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-red-600"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Question {qIndex + 1}</Label>
                        <Input
                          value={question.text}
                          onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                          placeholder="Enter your question"
                        />
                      </div>
                      
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => handleQuestionChange(qIndex, "points", parseInt(e.target.value))}
                          className="w-24"
                        />
                      </div>
                      
                      <div>
                        <Label>Options</Label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex gap-2 mt-2">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveOption(qIndex, oIndex)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleAddOption(qIndex)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Correct Answer</Label>
                        <select
                          className="w-full p-2 border rounded-md bg-white"
                          value={question.correctAnswer}
                          onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", parseInt(e.target.value))}
                        >
                          {question.options.map((option, oIndex) => (
                            <option key={oIndex} value={oIndex}>
                              Option {oIndex + 1}: {option || "Empty"}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                          value={question.explanation || ""}
                          onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)}
                          placeholder="Explain why this answer is correct"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuiz} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingQuiz ? "Update Quiz" : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}