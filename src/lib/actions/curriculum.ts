"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
} from "@/lib/validations/curriculum";

async function verifyCourseOwnership(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId: userId },
  });
  if (!course) throw new Error("Course not found or unauthorized");
  return course;
}

async function verifySectionOwnership(sectionId: string, userId: string) {
  const section = await prisma.section.findFirst({
    where: {
      id: sectionId,
      course: { instructorId: userId },
    },
  });
  if (!section) throw new Error("Section not found or unauthorized");
  return section;
}

async function verifyLessonOwnership(lessonId: string, userId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      section: { course: { instructorId: userId } },
    },
  });
  if (!lesson) throw new Error("Lesson not found or unauthorized");
  return lesson;
}

// Section CRUD
export async function createSection(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { courseId, ...sectionData } = createSectionSchema.parse(data);
    
    await verifyCourseOwnership(courseId, user.id);
    
    const maxOrder = await prisma.section.aggregate({
      where: { courseId },
      _max: { order: true },
    });
    
    const section = await prisma.section.create({
      data: {
        ...sectionData,
        courseId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    
    return { success: true, data: section };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSection(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { id, ...updateData } = updateSectionSchema.parse(data);
    
    await verifySectionOwnership(id, user.id);
    
    const section = await prisma.section.update({
      where: { id },
      data: updateData,
    });
    
    return { success: true, data: section };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSection(sectionId: string) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    await verifySectionOwnership(sectionId, user.id);
    
    await prisma.section.delete({ where: { id: sectionId } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reorderSections(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { sections } = reorderSectionsSchema.parse(data);
    
    if (sections.length === 0) return { success: true };
    
    // Verify ownership of first section to ensure all belong to user
    await verifySectionOwnership(sections[0]!.id, user.id);
    
    await Promise.all(
      sections.map(({ id, order }) =>
        prisma.section.update({
          where: { id },
          data: { order },
        })
      )
    );
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Lesson CRUD
export async function createLesson(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { sectionId, ...lessonData } = createLessonSchema.parse(data);
    
    const section = await prisma.section.findFirst({
      where: { id: sectionId, course: { instructorId: user.id } },
    });
    
    if (!section) throw new Error("Section not found or unauthorized");
    
    const maxOrder = await prisma.lesson.aggregate({
      where: { sectionId },
      _max: { order: true },
    });
    
    const lesson = await prisma.lesson.create({
      data: {
        ...lessonData,
        sectionId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    
    return { success: true, data: lesson };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLesson(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { id, ...updateData } = updateLessonSchema.parse(data);
    
    await verifyLessonOwnership(id, user.id);
    
    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });
    
    return { success: true, data: lesson };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLesson(lessonId: string) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    await verifyLessonOwnership(lessonId, user.id);
    
    await prisma.lesson.delete({ where: { id: lessonId } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reorderLessons(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { lessons } = reorderLessonsSchema.parse(data);
    
    if (lessons.length === 0) return { success: true };
    
    await verifyLessonOwnership(lessons[0]!.id, user.id);
    
    await Promise.all(
      lessons.map(({ id, order }) =>
        prisma.lesson.update({
          where: { id },
          data: { order },
        })
      )
    );
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



// Add this to your existing curriculum actions file
export async function getSectionWithLessons(sectionId: string) {
  try {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          include: {
            quizzes: {  // Changed from 'quiz' to 'quizzes'
              include: {
                questions: true,
              },
              orderBy: { order: "asc" },
            },
          },
        },
        quizzes: {  // Include section quizzes
          include: {
            questions: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });
    
    if (!section) throw new Error("Section not found");
    
    return { success: true, data: section };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}