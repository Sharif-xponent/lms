"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Filter,
  BookOpen,
  Star,
  Users,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  X,
  SlidersHorizontal
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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
import { getPublicCourses } from "@/lib/actions/course";
import { enrollInCourse, checkEnrollmentStatus } from "@/lib/actions/enrollment";
import { formatDistanceToNow } from "date-fns";

interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  category: string;
  level: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  instructor: {
    name: string | null;
    email: string;
  };
  _count: {
    enrollments: number;
    reviews: number;
  };
  avgRating: number;
  isEnrolled?: boolean;
}

export default function CoursesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  const limit = 12;

  useEffect(() => {
    fetchCourses();
  }, [search, category, level, sortBy, sortOrder, currentPage]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const result = await getPublicCourses({
        page: currentPage,
        limit,
        search: search || undefined,
        category: category === "all" ? undefined : category,
        level: level === "all" ? undefined : level,
        sortBy: sortBy as any,
        sortOrder: sortOrder as "asc" | "desc",
      });

      if (result.success) {
        const coursesWithEnrollment = await Promise.all(
          result.data.map(async (course: Course) => {
            if (session?.user) {
              const enrollmentResult = await checkEnrollmentStatus(course.id);
              if (enrollmentResult.success) {
                return { ...course, isEnrolled: enrollmentResult.data.isEnrolled };
              }
            }
            return { ...course, isEnrolled: false };
          })
        );
        setCourses(coursesWithEnrollment);
        setTotalPages(result.pagination.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (course: Course) => {
    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }
    
    setSelectedCourse(course);
    setEnrollDialogOpen(true);
  };

  const confirmEnroll = async () => {
    if (!selectedCourse) return;
    
    try {
      setEnrolling(selectedCourse.id);
      const result = await enrollInCourse({ courseId: selectedCourse.id });
      
      if (result.success) {
        setEnrollSuccess(true);
        // Update the course in the list
        setCourses(prev => prev.map(c => 
          c.id === selectedCourse.id ? { ...c, isEnrolled: true } : c
        ));
        setTimeout(() => {
          setEnrollDialogOpen(false);
          setEnrollSuccess(false);
          setSelectedCourse(null);
        }, 2000);
      } else {
        setError(result.error);
        setEnrollDialogOpen(false);
      }
    } catch (err) {
      setError("Failed to enroll in course");
    } finally {
      setEnrolling(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-300"
            }`}
          />
        ))}
        <span className="text-xs text-slate-500 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price}`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-700";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-700";
      case "Advanced":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setLevel("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Filter sidebar component
  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {["all", "Programming", "Design", "Business", "Marketing", "Photography", "Music"].map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat}
                checked={category === cat}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm capitalize">{cat === "all" ? "All Categories" : cat}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold mb-3">Level</h3>
        <div className="space-y-2">
          {["all", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
            <label key={lvl} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="level"
                value={lvl}
                checked={level === lvl}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm capitalize">{lvl === "all" ? "All Levels" : lvl}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold mb-3">Sort By</h3>
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
          const [newSortBy, newSortOrder] = v.split("-");
          setSortBy(newSortBy);
          setSortOrder(newSortOrder);
          setCurrentPage(1);
        }}>
          <SelectTrigger>
            <SelectValue />
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
      
      <Button variant="outline" onClick={clearFilters} className="w-full">
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Discover Your Next Course
            </h1>
            <p className="text-lg opacity-90 mb-6">
              Explore thousands of courses taught by expert instructors. 
              Learn at your own pace and advance your career.
            </p>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search for courses..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-12 pr-4 py-6 text-lg bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <FilterSidebar />
            </div>
          </div>
          
          {/* Mobile Filter Button */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <p className="text-sm text-slate-600">
              {courses.length} courses found
            </p>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your course search
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                  <FilterSidebar />
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button className="w-full">Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Courses Grid */}
          <div className="flex-1">
            {/* Results count */}
            <div className="hidden lg:block mb-4">
              <p className="text-sm text-slate-600">
                Showing {courses.length} of {totalPages * limit} courses
              </p>
            </div>
            
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                    <CardHeader>
                      <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                  <p className="text-slate-600 mb-4">
                    Try adjusting your search or filters to find what you're looking for
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow flex flex-col">
                      {/* Course Image */}
                      <Link href={`/courses/${course.id}`}>
                        <div className="relative h-48 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-t-lg flex items-center justify-center overflow-hidden">
                          {course.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={course.coverImage}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-16 h-16 text-white opacity-50" />
                          )}
                          {course.isEnrolled && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Enrolled
                              </Badge>
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      <CardHeader>
                        <Link href={`/courses/${course.id}`}>
                          <CardTitle className="line-clamp-1 hover:text-blue-600 transition-colors">
                            {course.title}
                          </CardTitle>
                        </Link>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="flex-1">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Instructor:</span>
                            <span className="font-medium">
                              {course.instructor.name || course.instructor.email.split('@')[0]}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{course.category}</Badge>
                            <Badge className={getLevelColor(course.level)}>
                              {course.level}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{course._count.enrollments} students</span>
                            </div>
                            {renderStars(course.avgRating)}
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-2xl font-bold text-blue-600">
                              {formatPrice(course.price)}
                            </span>
                            {!course.isEnrolled ? (
                              <Button
                                size="sm"
                                onClick={() => handleEnroll(course)}
                                disabled={enrolling === course.id}
                              >
                                {enrolling === course.id && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Enroll Now
                              </Button>
                            ) : (
                              <Link href={`/student/courses/${course.id}/learn`}>
                                <Button size="sm" variant="outline">
                                  Continue Learning
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
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
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span>...</span>
                          <Button
                            variant="outline"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-10"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
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
        </div>
      </div>
      
      {/* Enrollment Confirmation Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {enrollSuccess ? "Successfully Enrolled!" : "Confirm Enrollment"}
            </DialogTitle>
            <DialogDescription>
              {enrollSuccess 
                ? "You have been successfully enrolled in the course."
                : `Are you sure you want to enroll in "${selectedCourse?.title}"?`
              }
            </DialogDescription>
          </DialogHeader>
          
          {!enrollSuccess && selectedCourse && (
            <div className="py-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Price:</span>
                  <span className="font-semibold">
                    {selectedCourse.price === 0 ? "Free" : `$${selectedCourse.price}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Level:</span>
                  <span>{selectedCourse.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Duration:</span>
                  <span>Self-paced</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {!enrollSuccess ? (
              <>
                <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmEnroll} disabled={enrolling === selectedCourse?.id}>
                  {enrolling === selectedCourse?.id && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Confirm Enrollment
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setEnrollDialogOpen(false);
                setSelectedCourse(null);
              }}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}