"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  MoreVertical,
  BookOpen,
  Users,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInstructorCourses, deleteCourse } from "@/lib/actions/course";
import { formatDistanceToNow } from "date-fns";

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  category: string;
  level: string;
  price: number;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
  _count: {
    sections: number;
    enrollments: number;
  };
}

export default function InstructorDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 9;

  useEffect(() => {
    fetchCourses();
  }, [search, category, level, status, sortBy, sortOrder, currentPage]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const result = await getInstructorCourses({
        page: currentPage,
        limit,
        search: search || undefined,
        category: category === "all" ? undefined : category,
        level: level === "all" ? undefined : level,
        status: (status === "all" ? undefined : status) as "DRAFT" | "PUBLISHED" | undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as "asc" | "desc",
      });

      if (result.success) {
        setCourses(result.data as any);
        setTotalPages(result.pagination?.totalPages as any);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      setDeleting(true);
      const result = await deleteCourse(courseToDelete.id);
      
      if (result.success) {
        await fetchCourses();
        setDeleteDialogOpen(false);
        setCourseToDelete(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "PUBLISHED") {
      return <Badge className="bg-green-500">Published</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Instructor Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage your courses and track student progress</p>
          </div>
          <Link href="/instructor/courses/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              
              <Select value={category} onValueChange={(v) => { setCategory(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Programming">Programming</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Photography">Photography</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={level} onValueChange={(v) => { setLevel(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={status} onValueChange={(v) => { setStatus(v); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                const [newSortBy, newSortOrder] = v.split("-");
                setSortBy(newSortBy as any);
                setSortOrder(newSortOrder as any);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
              <p className="text-slate-600 mb-4">Create your first course and start teaching</p>
              <Link href="/instructor/courses/new">
                <Button>Create Course</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-t-lg flex items-center justify-center text-4xl">
                    {course.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={course.coverImage} 
                        alt={course.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-white opacity-50" />
                    )}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(course.status)}
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Category:</span>
                        <span className="font-medium">{course.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Level:</span>
                        <span className="font-medium">{course.level}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Price:</span>
                        <span className="font-medium text-blue-600">{formatPrice(course.price)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Sections:</span>
                        <span>{course._count.sections}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Students:</span>
                        <span>{course._count.enrollments}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Updated:</span>
                        <span>{formatDistanceToNow(new Date(course.updatedAt))} ago</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2">
                    <Link href={`/instructor/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => router.push(`/courses/${course.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Course
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/instructor/courses/${course.id}/curriculum`)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Manage Curriculum
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            setCourseToDelete(course);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone.
              All sections, lessons, and enrollments will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}