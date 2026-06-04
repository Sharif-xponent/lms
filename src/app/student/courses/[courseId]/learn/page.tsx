"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle,
  Circle,
  PlayCircle,
  FileText,
  Video,
  HelpCircle as QuizIcon,
  Award,
  Loader2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCourseById } from "@/lib/actions/course";
import { checkEnrollmentStatus, updateProgress } from "@/lib/actions/enrollment";
import { getQuizByParent, submitQuizAttempt, canRetakeQuiz, getStudentQuizAttempt } from "@/lib/actions/quiz";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  type: "TEXT" | "VIDEO";
  isPreview: boolean;
  order: number;
  quiz: any | null;
}

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
  quiz: any | null;
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [enrollment, setEnrollment] = useState<any>(null);
  
  // Quiz states
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Get course with full curriculum
      const courseResult = await getCourseById(courseId, false);
      if (!courseResult.success) {
        setError(courseResult.error);
        return;
      }
      setCourse(courseResult.data);
      setSections(courseResult.data.sections || []);
      
      // Check enrollment
      const enrollmentResult = await checkEnrollmentStatus(courseId);
      if (enrollmentResult.success && enrollmentResult.data.isEnrolled) {
        setEnrollment(enrollmentResult.data.enrollment);
        
        // Load completed lessons from enrollment data
        if (enrollmentResult.data.enrollment.completedItems) {
          setCompletedLessons(new Set(enrollmentResult.data.enrollment.completedItems));
        }
      }
      
      // Set first lesson as current
      if (courseResult.data.sections && courseResult.data.sections.length > 0) {
        const firstSection = courseResult.data.sections[0];
        if (firstSection.lessons && firstSection.lessons.length > 0) {
          setCurrentLesson(firstSection.lessons[0]);
          setCurrentSectionId(firstSection.id);
        }
      }
    } catch (err) {
      setError("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (completedLessons.has(lessonId)) return;
    
    const newCompleted = new Set(completedLessons);
    newCompleted.add(lessonId);
    setCompletedLessons(newCompleted);
    
    // Update progress in database
    const totalLessons = sections.reduce((acc, section) => acc + section.lessons.length, 0);
    const newProgress = Math.round((newCompleted.size / totalLessons) * 100);
    
    if (enrollment) {
      await updateProgress({
        enrollmentId: enrollment.id,
        progress: newProgress,
        completed: newProgress === 100,
      });
    }
  };

  const handleOpenQuiz = (quiz: any, parentTitle: string) => {
    setCurrentQuiz({ ...quiz, parentTitle });
    setQuizAnswers({});
    setQuizResult(null);
    setQuizDialogOpen(true);
  };

  const handleSubmitQuiz = async () => {
    if (!currentQuiz) return;
    
    // Check if all questions are answered
    if (currentQuiz.questions.length !== Object.keys(quizAnswers).length) {
      alert(`Please answer all ${currentQuiz.questions.length} questions`);
      return;
    }
    
    setSubmittingQuiz(true);
    
    const answers = Object.entries(quizAnswers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));
    
    const result = await submitQuizAttempt({ quizId: currentQuiz.id, answers });
    if (result.success) {
      setQuizResult(result.data);
      if (result.data.passed && currentLesson) {
        await handleLessonComplete(currentLesson.id);
      }
    } else {
      alert(result.error);
    }
    
    setSubmittingQuiz(false);
  };

  const renderLessonContent = () => {
    if (!currentLesson) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No lesson selected</h3>
          <p className="text-slate-600">Select a lesson from the sidebar to start learning</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{currentLesson.title}</h1>
          <div className="flex items-center gap-2">
            {currentLesson.type === "VIDEO" ? (
              <Badge variant="outline" className="text-blue-600">
                <Video className="w-3 h-3 mr-1" />
                Video Lesson
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-600">
                <FileText className="w-3 h-3 mr-1" />
                Text Lesson
              </Badge>
            )}
            {currentLesson.isPreview && (
              <Badge variant="secondary">Preview</Badge>
            )}
          </div>
        </div>
        
        {currentLesson.type === "VIDEO" && currentLesson.videoUrl && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={currentLesson.videoUrl.replace("watch?v=", "embed/")}
              title={currentLesson.title}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        )}
        
        {currentLesson.type === "TEXT" && currentLesson.content && (
          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                {currentLesson.content.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => {
              // Navigate to previous lesson
              const flatLessons = sections.flatMap(s => s.lessons);
              const currentIndex = flatLessons.findIndex(l => l.id === currentLesson.id);
              if (currentIndex > 0) {
                setCurrentLesson(flatLessons[currentIndex - 1]);
                window.scrollTo(0, 0);
              }
            }}
            disabled={!currentLesson}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-3">
            {currentLesson.quiz && (
              <Button
                variant="outline"
                onClick={() => handleOpenQuiz(currentLesson.quiz, currentLesson.title)}
              >
                <QuizIcon className="w-4 h-4 mr-2" />
                Take Quiz
              </Button>
            )}
            
            <Button
              onClick={async () => {
                await handleLessonComplete(currentLesson.id);
                // Navigate to next lesson
                const flatLessons = sections.flatMap(s => s.lessons);
                const currentIndex = flatLessons.findIndex(l => l.id === currentLesson.id);
                if (currentIndex < flatLessons.length - 1) {
                  setCurrentLesson(flatLessons[currentIndex + 1]);
                  window.scrollTo(0, 0);
                }
              }}
            >
              {completedLessons.has(currentLesson.id) ? "Completed" : "Mark Complete"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{course?.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {enrollment && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.id} className="border-b">
                <div className="p-4 bg-slate-50">
                  <h3 className="font-medium">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                  )}
                </div>
                <div className="divide-y">
                  {section.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setCurrentLesson(lesson);
                        setCurrentSectionId(section.id);
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                        currentLesson?.id === lesson.id ? "bg-blue-50" : ""
                      }`}
                    >
                      {completedLessons.has(lesson.id) ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      {lesson.type === "VIDEO" ? (
                        <Video className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                      <span className={`text-sm flex-1 ${
                        currentLesson?.id === lesson.id ? "font-medium" : ""
                      }`}>
                        {lesson.title}
                      </span>
                      {lesson.quiz && (
                        <QuizIcon className="w-3 h-3 text-purple-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                  
                  {section.quiz && (
                    <button
                      onClick={() => handleOpenQuiz(section.quiz, section.title)}
                      className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center gap-3 border-t"
                    >
                      <Award className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-sm">Section Quiz: {section.quiz.title}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b p-4 sticky top-0 z-40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 mr-2" />
            Menu
          </Button>
        </div>
        
        {/* Lesson Content */}
        <div className="p-6 lg:p-8">
          {renderLessonContent()}
        </div>
      </div>
      
      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz: {currentQuiz?.parentTitle}</DialogTitle>
            <DialogDescription>
              Test your knowledge on this {currentQuiz?.parentType}
            </DialogDescription>
          </DialogHeader>
          
          {quizResult ? (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className={`text-6xl mb-4 ${quizResult.passed ? "text-green-500" : "text-red-500"}`}>
                  {quizResult.passed ? "🎉" : "📚"}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {quizResult.passed ? "Congratulations!" : "Keep Learning!"}
                </h3>
                <p className="text-slate-600 mb-4">
                  You scored {quizResult.percentage.toFixed(1)}% ({quizResult.score}/{quizResult.totalPoints} points)
                </p>
                <div className="bg-slate-100 rounded-lg p-4">
                  <p className="text-sm">
                    Passing score: {quizResult.passingScore}% • 
                    {quizResult.passed ? " You passed!" : " Try again next time"}
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setQuizDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-6 py-4">
                {currentQuiz?.questions?.map((question: any, index: number) => (
                  <div key={question.id} className="space-y-3">
                    <div className="font-medium">
                      Question {index + 1}: {question.text}
                      <span className="text-sm text-slate-500 ml-2">
                        ({question.points} point{question.points > 1 ? "s" : ""})
                      </span>
                    </div>
                    <div className="space-y-2 ml-4">
                      {question.options.map((option: string, optIndex: number) => (
                        <label key={optIndex} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={optIndex}
                            checked={quizAnswers[question.id] === optIndex}
                            onChange={() => setQuizAnswers({
                              ...quizAnswers,
                              [question.id]: optIndex
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuizDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitQuiz} disabled={submittingQuiz}>
                  {submittingQuiz && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Quiz
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}