"use client";

import { useState, useEffect } from "react";
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
  Save,
  Loader2,
  Clock,
  Target,
  Award
} from "lucide-react";
import { 
  getQuizByParent, 
  createQuiz, 
  updateQuiz, 
  deleteQuiz 
} from "@/lib/actions/quiz";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
}

interface QuizManagerProps {
  parentId: string;
  parentType: "section" | "lesson";
  onQuizChange?: () => void;
}

export function QuizManager({ parentId, parentType, onQuizChange }: QuizManagerProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  useEffect(() => {
    fetchQuiz();
  }, [parentId, parentType]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const result = await getQuizByParent(parentId, parentType);
      if (result.success && result.data) {
        setQuiz(result.data);
        setQuizForm({
          title: result.data.title,
          description: result.data.description || "",
          timeLimit: result.data.timeLimit,
          passingScore: result.data.passingScore,
          attemptsAllowed: result.data.attemptsAllowed,
        });
        setQuestions(result.data.questions);
      } else {
        setQuiz(null);
      }
    } catch (error) {
      console.error("Failed to fetch quiz:", error);
    } finally {
      setLoading(false);
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
        questions,
        [parentType === "section" ? "sectionId" : "lessonId"]: parentId,
      };

      let result;
      if (quiz) {
        result = await updateQuiz({ id: quiz.id, ...data });
      } else {
        result = await createQuiz(data);
      }

      if (result.success) {
        await fetchQuiz();
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

  const handleDeleteQuiz = async () => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
    
    try {
      const result = await deleteQuiz(quiz.id);
      if (result.success) {
        setQuiz(null);
        onQuizChange?.();
      } else {
        setError(result.error);
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete quiz");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading quiz...
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-600" />
          <h4 className="font-semibold text-sm">Quiz</h4>
          {quiz && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
              {quiz.questions?.length || 0} questions
            </Badge>
          )}
        </div>
        
        {!quiz ? (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Quiz
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteQuiz}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      {quiz && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{quiz.title}</span>
          </div>
          {quiz.description && (
            <p className="text-xs text-slate-600">{quiz.description}</p>
          )}
          <div className="flex gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>Pass: {quiz.passingScore}%</span>
            </div>
            {quiz.timeLimit && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{quiz.timeLimit} min</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>Attempts: {quiz.attemptsAllowed === -1 ? "∞" : quiz.attemptsAllowed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Creation/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{quiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
            <DialogDescription>
              Create a quiz to test your students' knowledge
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
                  placeholder="e.g., JavaScript Fundamentals Quiz"
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
              {quiz ? "Update Quiz" : "Create Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}