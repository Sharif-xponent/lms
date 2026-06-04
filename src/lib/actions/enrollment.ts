"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { createEnrollmentSchema, updateProgressSchema } from "@/lib/validations/enrollment";

export async function enrollInCourse(data: unknown) {
  try {
    const user = await requireUser();
    const { courseId } = createEnrollmentSchema.parse(data);
    
    // Check if course exists and is published
    const course = await prisma.course.findFirst({
      where: { id: courseId, status: "PUBLISHED" },
    });
    
    if (!course) throw new Error("Course not found or not available");
    
    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId,
        },
      },
    });
    
    if (existingEnrollment) throw new Error("Already enrolled in this course");
    
    // For paid courses, you would integrate payment here
    // For now, we'll just create enrollment for free courses
    if (course.price > 0) {
      // Mock checkout - in production, integrate Stripe/PayPal
      // For now, we'll still allow enrollment (demo purposes)
      console.log("Mock payment for course:", course.title);
    }
    
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: user.id,
        courseId,
        progress: 0,
        completed: false,
      },
      include: {
        course: {
          select: {
            title: true,
            coverImage: true,
          },
        },
      },
    });
    
    return { success: true, data: enrollment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProgress(data: unknown) {
  try {
    const user = await requireUser();
    const { enrollmentId, progress, completed } = updateProgressSchema.parse(data);
    
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId: user.id,
      },
    });
    
    if (!enrollment) throw new Error("Enrollment not found or unauthorized");
    
    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        completed: completed ?? (progress === 100),
      },
    });
    
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserEnrollments() {
  try {
    const user = await requireUser();
    
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: {
          include: {
            instructor: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });
    
    // Manually count lessons for each course
    const enrollmentsWithLessonCount = await Promise.all(
      enrollments.map(async (enrollment) => {
        const lessonCount = await prisma.lesson.count({
          where: {
            section: {
              courseId: enrollment.courseId,
            },
          },
        });
        
        return {
          ...enrollment,
          course: {
            ...enrollment.course,
            _count: {
              lessons: lessonCount,
            },
          },
        };
      })
    );
    
    return { success: true, data: enrollmentsWithLessonCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkEnrollmentStatus(courseId: string) {
  try {
    const user = await requireUser();
    
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId,
        },
      },
    });
    
    return { success: true, data: { isEnrolled: !!enrollment, enrollment } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}