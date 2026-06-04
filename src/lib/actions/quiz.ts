"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth-guard";
import { createQuizSchema, updateQuizSchema, submitQuizAnswersSchema } from "@/lib/validations/quiz";

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

export async function createQuiz(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { lessonId, questions, ...quizData } = createQuizSchema.parse(data);
    
    await verifyLessonOwnership(lessonId, user.id);
    
    // Check if quiz already exists for this lesson
    const existingQuiz = await prisma.quiz.findUnique({
      where: { lessonId },
    });
    
    if (existingQuiz) throw new Error("Quiz already exists for this lesson");
    
    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        lessonId,
        questions: {
          create: questions,
        },
      },
      include: {
        questions: true,
      },
    });
    
    return { success: true, data: quiz };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateQuiz(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { id, questions, ...updateData } = updateQuizSchema.parse(data);
    
    const quiz = await prisma.quiz.findFirst({
      where: {
        id,
        lesson: { section: { course: { instructorId: user.id } } },
      },
    });
    
    if (!quiz) throw new Error("Quiz not found or unauthorized");
    
    // Update quiz and questions in transaction
    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Update quiz
      const updated = await tx.quiz.update({
        where: { id },
        data: updateData,
      });
      
      // If questions provided, replace all questions
      if (questions) {
        await tx.question.deleteMany({ where: { quizId: id } });
        await tx.question.createMany({
          data: questions.map(q => ({ ...q, quizId: id })),
        });
      }
      
      return updated;
    });
    
    return { success: true, data: updatedQuiz };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuiz(quizId: string) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        lesson: { section: { course: { instructorId: user.id } } },
      },
    });
    
    if (!quiz) throw new Error("Quiz not found or unauthorized");
    
    await prisma.quiz.delete({ where: { id: quizId } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitQuiz(data: unknown) {
  try {
    const user = await requireUser();
    const { quizId, answers } = submitQuizAnswersSchema.parse(data);
    
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });
    
    if (!quiz) throw new Error("Quiz not found");
    
    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        courseId: quiz.lesson.section.courseId,
      },
    });
    
    if (!enrollment) throw new Error("You must be enrolled to take this quiz");
    
    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    
    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers.find(a => a.questionId === question.id);
      if (userAnswer && userAnswer.selectedOption === question.correctAnswer) {
        earnedPoints += question.points;
      }
    }
    
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;
    
    // Store quiz attempt (simplified - just return result)
    // In production, you'd store this in a QuizAttempt model
    
    return {
      success: true,
      data: {
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        passingScore: quiz.passingScore,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuizByLesson(lessonId: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: true,
      },
    });
    
    return { success: true, data: quiz };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}