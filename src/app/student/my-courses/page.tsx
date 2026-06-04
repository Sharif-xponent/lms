"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Star,
  PlayCircle,
  ChevronRight,
  Calendar,
  BarChart3,
  Target,
  Users,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserEnrollments, updateProgress } from "@/lib/actions/enrollment";
import { getCourseById } from "@/lib/actions/course";
import { getQuizAttempts } from "@/lib/actions/quiz";
import { formatDistanceToNow, format } from "date-fns";

interface Enrollment {
  id: string;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  lastAccessedAt: string;
  course: {
    id: string;
    title: string;
    description: string;
    coverImage: string | null;
    category: string;
    level: string;
    price: number;
    instructor: {
      name: string | null;
    };
    _count: {
      lessons: number;
      sections: number;
    };
  };
}

interface QuizStats {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  bestScore: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    filterEnrollments();
  }, [search, statusFilter, enrollments]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user enrollments
      const enrollmentsResult = await getUserEnrollments();
      if (!enrollmentsResult.success) {
        setError(enrollmentsResult.error);
        return;
      }
      
      const userEnrollments = enrollmentsResult.data;
      setEnrollments(userEnrollments as any);
      setFilteredEnrollments(userEnrollments as any);
      
      // Calculate quiz statistics across all enrolled courses
      let totalQuizzes = 0;
      let completedQuizzes = 0;
      let totalScore = 0;
      let bestScore = 0;
      
      // This would be better with a dedicated API endpoint
      // For now, we'll show placeholder stats
      // In production, you'd aggregate quiz attempts per course
      
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const filterEnrollments = () => {
    let filtered = [...enrollments];
    
    // Filter by search
    if (search) {
      filtered = filtered.filter(e => 
        e.course.title.toLowerCase().includes(search.toLowerCase()) ||
        e.course.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter === "in-progress") {
      filtered = filtered.filter(e => e.progress > 0 && e.progress < 100 && !e.completed);
    } else if (statusFilter === "completed") {
      filtered = filtered.filter(e => e.completed || e.progress === 100);
    } else if (statusFilter === "not-started") {
      filtered = filtered.filter(e => e.progress === 0);
    }
    
    setFilteredEnrollments(filtered);
  };

  const getCourseStatus = (enrollment: Enrollment) => {
    if (enrollment.completed || enrollment.progress === 100) {
      return { label: "Completed", color: "bg-green-500", icon: CheckCircle };
    } else if (enrollment.progress > 0) {
      return { label: "In Progress", color: "bg-blue-500", icon: PlayCircle };
    } else {
      return { label: "Not Started", color: "bg-slate-500", icon: Clock };
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Calculate overall stats
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.completed || e.progress === 100).length;
  const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const averageProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Track your learning progress and continue where you left off
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Courses</p>
                  <p className="text-3xl font-bold mt-1">{totalCourses}</p>
                </div>
                <BookOpen className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Completed</p>
                  <p className="text-3xl font-bold mt-1">{completedCourses}</p>
                </div>
                <Award className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">In Progress</p>
                  <p className="text-3xl font-bold mt-1">{inProgressCourses}</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Average Progress</p>
                  <p className="text-3xl font-bold mt-1">{averageProgress}%</p>
                </div>
                <Target className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search your courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Courses */}
        {filteredEnrollments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
              <p className="text-slate-600 mb-4">
                Start your learning journey by enrolling in a course
              </p>
              <Link href="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredEnrollments.map((enrollment) => {
              const status = getCourseStatus(enrollment);
              const StatusIcon = status.icon;
              const progressColor = getProgressColor(enrollment.progress);
              
              return (
                <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    {/* Course Image */}
                    <div className="md:w-64 h-48 md:h-auto bg-gradient-to-r from-blue-400 to-indigo-400 rounded-t-lg md:rounded-l-lg md:rounded-t-none flex items-center justify-center">
                      {enrollment.course.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={enrollment.course.coverImage}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                        />
                      ) : (
                        <BookOpen className="w-16 h-16 text-white opacity-50" />
                      )}
                    </div>
                    
                    {/* Course Details */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{enrollment.course.category}</Badge>
                            <Badge variant="outline">{enrollment.course.level}</Badge>
                            <Badge className={status.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          
                          <Link href={`/courses/${enrollment.course.id}`}>
                            <h3 className="text-xl font-semibold hover:text-blue-600 transition-colors mb-2">
                              {enrollment.course.title}
                            </h3>
                          </Link>
                          
                          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                            {enrollment.course.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>Instructor: {enrollment.course.instructor.name || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Enrolled: {formatDate(enrollment.enrolledAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Last accessed: {formatDate(enrollment.lastAccessedAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Link href={`/student/courses/${enrollment.course.id}/learn`}>
                          <Button className="whitespace-nowrap">
                            {enrollment.progress === 0 ? "Start Learning" : "Continue Learning"}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Course Progress</span>
                          <span className="font-medium">{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className={`h-2 ${progressColor}`} />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}