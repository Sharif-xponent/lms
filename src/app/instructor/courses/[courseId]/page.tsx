"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCourseSchema, type UpdateCourseInput } from "@/lib/validations/course";
import { getCourseById, updateCourse } from "@/lib/actions/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, BookOpen, Users, Settings } from "lucide-react";
import Link from "next/link";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<UpdateCourseInput>({
    resolver: zodResolver(updateCourseSchema),
  });
  
  useEffect(() => {
    fetchCourse();
  }, [courseId]);
  
  const fetchCourse = async () => {
    try {
      setFetching(true);
      const result = await getCourseById(courseId, true);
      
      if (result.success) {
        const course = result.data!;
        reset({
          id: course.id,
          title: course.title,
          description: course.description,
          coverImage: course.coverImage || "",
          category: course.category,
          level: course.level as any,
          price: course.price,
          status: course.status,
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load course");
    } finally {
      setFetching(false);
    }
  };
  
  const onSubmit = async (data: UpdateCourseInput) => {
    try {
      setLoading(true);
      setError("");
      
      const result = await updateCourse({ ...data, id: courseId });
      
      if (result.success) {
        router.push("/instructor/dashboard");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to update course");
    } finally {
      setLoading(false);
    }
  };
  
  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/instructor/dashboard" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">
              <Settings className="w-4 h-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="curriculum">
              <BookOpen className="w-4 h-4 mr-2" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Users className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Edit Course</CardTitle>
                <CardDescription>
                  Update your course information
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title *</Label>
                    <Input
                      id="title"
                      {...register("title")}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      rows={5}
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coverImage">Cover Image URL</Label>
                    <Input
                      id="coverImage"
                      {...register("coverImage")}
                    />
                    {errors.coverImage && (
                      <p className="text-sm text-red-500">{errors.coverImage.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={watch("category")} 
                        onValueChange={(v) => setValue("category", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Programming">Programming</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Photography">Photography</SelectItem>
                          <SelectItem value="Music">Music</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-500">{errors.category.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="level">Level *</Label>
                      <Select 
                        value={watch("level")} 
                        onValueChange={(v) => setValue("level", v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.level && (
                        <p className="text-sm text-red-500">{errors.level.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("price", { valueAsNumber: true })}
                      />
                      {errors.price && (
                        <p className="text-sm text-red-500">{errors.price.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={watch("status")} 
                        onValueChange={(v) => setValue("status", v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                
                <div className="px-6 pb-6 flex gap-3">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Link href="/instructor/dashboard">
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                </div>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  Manage sections, lessons, and quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Curriculum Builder</h3>
                  <p className="text-slate-600 mb-4">
                    Click below to manage your course structure
                  </p>
                  <Link href={`/instructor/courses/${courseId}/curriculum`}>
                    <Button>Manage Curriculum</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Course Analytics</CardTitle>
                <CardDescription>
                  Track your course performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  Analytics dashboard coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}