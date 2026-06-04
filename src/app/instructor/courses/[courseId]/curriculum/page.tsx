"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { getCourseById } from "@/lib/actions/course";
import {
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "@/lib/actions/curriculum";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Video,
  FileText,
  Loader2,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

// Sortable Section Component
function SortableSectionItem({ section, onEdit, onDelete, onAddLesson, onEditLesson, onDeleteLesson }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className="border-2 hover:border-blue-200 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{section.title}</h3>
                <Badge variant="outline">
                  {section.lessons?.length || 0} lessons
                </Badge>
              </div>
              {section.description && (
                <p className="text-sm text-slate-600">{section.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(section)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(section.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="ml-8 space-y-2">
            {/* Lessons List */}
            <div className="space-y-2">
              {section.lessons && section.lessons.length > 0 ? (
                <SortableContext
                  items={section.lessons.map((l: any) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {section.lessons.map((lesson: any) => (
                    <SortableLessonItem
                      key={lesson.id}
                      lesson={lesson}
                      sectionId={section.id}
                      onEdit={onEditLesson}
                      onDelete={onDeleteLesson}
                    />
                  ))}
                </SortableContext>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  No lessons yet. Click "Add Lesson" to get started.
                </div>
              )}
            </div>
            
            {/* Add Lesson Button */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-blue-600"
              onClick={() => onAddLesson(section)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Lesson
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable Lesson Component
function SortableLessonItem({ lesson, onEdit, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      {lesson.type === "VIDEO" ? (
        <Video className="w-4 h-4 text-blue-600" />
      ) : (
        <FileText className="w-4 h-4 text-green-600" />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{lesson.title}</span>
          {lesson.isPreview && (
            <Badge variant="secondary" className="text-xs">Preview</Badge>
          )}
          {lesson.quiz && (
            <Badge variant="outline" className="text-xs">Quiz</Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(lesson)}
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600"
          onClick={() => onDelete(lesson.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function CurriculumPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Dialog states
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [sectionForm, setSectionForm] = useState({ title: "", description: "" });
  
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [currentSectionId, setCurrentSectionId] = useState("");
  const [lessonForm, setLessonForm] = useState({
    title: "",
    content: "",
    videoUrl: "",
    type: "TEXT" as "TEXT" | "VIDEO",
    isPreview: false,
  });
  
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const result = await getCourseById(courseId, true);
      if (result.success) {
        setCourse(result.data);
        setSections(result.data.sections || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  // Section Handlers
  const handleAddSection = () => {
    setEditingSection(null);
    setSectionForm({ title: "", description: "" });
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: any) => {
    setEditingSection(section);
    setSectionForm({ title: section.title, description: section.description || "" });
    setSectionDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      setError("Section title is required");
      return;
    }
    
    try {
      setSubmitting(true);
      let result;
      if (editingSection) {
        result = await updateSection({
          id: editingSection.id,
          title: sectionForm.title,
          description: sectionForm.description,
        });
      } else {
        result = await createSection({
          title: sectionForm.title,
          description: sectionForm.description,
          courseId,
        });
      }
      
      if (result.success) {
        await fetchCourse();
        setSectionDialogOpen(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to save section");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section and all its lessons?")) return;
    
    try {
      const result = await deleteSection(sectionId);
      if (result.success) {
        await fetchCourse();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to delete section");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over?.id);
      
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      
      // Update order on server
      const updates = newSections.map((section, index) => ({
        id: section.id,
        order: index,
      }));
      
      await reorderSections({ sections: updates });
    }
  };

  // Lesson Handlers
  const handleAddLesson = (section: any) => {
    setEditingLesson(null);
    setCurrentSectionId(section.id);
    setLessonForm({
      title: "",
      content: "",
      videoUrl: "",
      type: "TEXT",
      isPreview: false,
    });
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setCurrentSectionId(lesson.sectionId);
    setLessonForm({
      title: lesson.title,
      content: lesson.content || "",
      videoUrl: lesson.videoUrl || "",
      type: lesson.type,
      isPreview: lesson.isPreview,
    });
    setLessonDialogOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      setError("Lesson title is required");
      return;
    }
    
    if (lessonForm.type === "VIDEO" && !lessonForm.videoUrl) {
      setError("Video URL is required for video lessons");
      return;
    }
    
    try {
      setSubmitting(true);
      let result;
      if (editingLesson) {
        result = await updateLesson({
          id: editingLesson.id,
          title: lessonForm.title,
          content: lessonForm.content,
          videoUrl: lessonForm.videoUrl || null,
          type: lessonForm.type,
          isPreview: lessonForm.isPreview,
        });
      } else {
        result = await createLesson({
          ...lessonForm,
          sectionId: currentSectionId,
          attachments: [],
        });
      }
      
      if (result.success) {
        await fetchCourse();
        setLessonDialogOpen(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to save lesson");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    
    try {
      const result = await deleteLesson(lessonId);
      if (result.success) {
        await fetchCourse();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to delete lesson");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/instructor/courses/${courseId}`} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course Details
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Curriculum Builder</h1>
              <p className="text-slate-600 mt-1">
                {course?.title} - Organize your course content
              </p>
            </div>
            <Button onClick={handleAddSection}>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Curriculum Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Curriculum Tips</h3>
                <p className="text-sm text-blue-700">
                  Drag and drop sections and lessons to reorder them. Each section can contain multiple lessons.
                  Lessons can be text-based or video-based. You can add quizzes to lessons later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections List */}
        {sections.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">No sections yet</h3>
              <p className="text-slate-600 mb-4">
                Start building your course by adding your first section
              </p>
              <Button onClick={handleAddSection}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Section
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {sections.map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    onEdit={handleEditSection}
                    onDelete={handleDeleteSection}
                    onAddLesson={handleAddLesson}
                    onEditLesson={handleEditLesson}
                    onDeleteLesson={handleDeleteLesson}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Section Dialog */}
        <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSection ? "Edit Section" : "Add New Section"}
              </DialogTitle>
              <DialogDescription>
                Sections help organize your course into logical modules.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Section Title *</label>
                <Input
                  placeholder="e.g., Introduction to Programming"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  placeholder="What will students learn in this section?"
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSection} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingSection ? "Update" : "Create"} Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lesson Dialog */}
        <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? "Edit Lesson" : "Add New Lesson"}
              </DialogTitle>
              <DialogDescription>
                Create engaging lessons for your students.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lesson Title *</label>
                <Input
                  placeholder="e.g., Setting up your development environment"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Lesson Type</label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={lessonForm.type === "TEXT" ? "default" : "outline"}
                    onClick={() => setLessonForm({ ...lessonForm, type: "TEXT", videoUrl: "" })}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Text Lesson
                  </Button>
                  <Button
                    type="button"
                    variant={lessonForm.type === "VIDEO" ? "default" : "outline"}
                    onClick={() => setLessonForm({ ...lessonForm, type: "VIDEO" })}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Video Lesson
                  </Button>
                </div>
              </div>
              
              {lessonForm.type === "TEXT" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Write your lesson content here..."
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    rows={10}
                  />
                </div>
              )}
              
              {lessonForm.type === "VIDEO" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video URL *</label>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Support YouTube, Vimeo, or direct video URLs
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPreview"
                  checked={lessonForm.isPreview}
                  onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="isPreview" className="text-sm font-medium">
                  Make this lesson available as free preview
                </label>
              </div>
              <p className="text-xs text-slate-500 ml-6">
                Free preview lessons can be watched by students before enrollment
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLesson} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingLesson ? "Update" : "Create"} Lesson
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}