"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth-guard";
import { createCourseSchema, updateCourseSchema, getCoursesSchema } from "@/lib/validations/course";

export async function createCourse(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const validated = createCourseSchema.parse(data);
    
    const course = await prisma.course.create({
      data: {
        ...validated,
        instructorId: user.id,
      },
    });
    
    return { success: true, data: course };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCourse(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { id, ...updateData } = updateCourseSchema.parse(data);
    
    const existing = await prisma.course.findFirst({
      where: { id, instructorId: user.id },
    });
    
    if (!existing) throw new Error("Course not found or unauthorized");
    
    const course = await prisma.course.update({
      where: { id },
      data: updateData,
    });
    
    return { success: true, data: course };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    
    const existing = await prisma.course.findFirst({
      where: { id: courseId, instructorId: user.id },
    });
    
    if (!existing) throw new Error("Course not found or unauthorized");
    
    await prisma.course.delete({ where: { id: courseId } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInstructorCourses(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { page, limit, search, category, level, status, sortBy, sortOrder } = getCoursesSchema.parse(data);
    
    const skip = (page - 1) * limit;
    
    const where: any = { instructorId: user.id };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;
    if (level) where.level = level;
    if (status) where.status = status;
    
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { sections: true, enrollments: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);
    
    return {
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPublicCourses(data: unknown) {
  try {
    const { page, limit, search, category, level, sortBy, sortOrder } = getCoursesSchema.parse(data);
    
    const skip = (page - 1) * limit;
    
    const where: any = { status: "PUBLISHED" };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;
    if (level) where.level = level;
    
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          instructor: {
            select: { name: true, email: true },
          },
          _count: {
            select: { enrollments: true, reviews: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);
    
    // Calculate average rating
    const coursesWithRating = courses.map(course => ({
      ...course,
      avgRating: course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0,
    }));
    
    return {
      success: true,
      data: coursesWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCourseById(courseId: string, forEdit: boolean = false) {
  try {
    let whereClause: any = { id: courseId };
    
    if (forEdit) {
      const user = await requireRole("INSTRUCTOR", "ADMIN");
      whereClause = { id: courseId, instructorId: user.id };
    } else {
      whereClause = { id: courseId, status: "PUBLISHED" };
    }
    
    const course = await prisma.course.findFirst({
      where: whereClause,
      include: {
        instructor: {
          select: { name: true, email: true },
        },
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                quizzes: {  // Changed from 'quiz' to 'quizzes'
                  include: {
                    questions: {
                      orderBy: { order: "asc" },
                    },
                  },
                  orderBy: { order: "asc" },
                },
              },
            },
            quizzes: {  // Include section quizzes
              include: {
                questions: {
                  orderBy: { order: "asc" },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        reviews: {
          include: {
            student: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });
    
    if (!course) throw new Error("Course not found");
    
    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
      : 0;
    
    return {
      success: true,
      data: { ...course, avgRating },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}