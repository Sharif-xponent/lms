"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth-guard";
import { 
  createQuizSchema, 
  updateQuizSchema, 
  submitQuizSchema,
  getQuizAttemptsSchema 
} from "@/lib/validations/quiz";

async function verifyQuizOwnership(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      OR: [
        { section: { course: { instructorId: userId } } },
        { lesson: { section: { course: { instructorId: userId } } } },
      ],
    },
  });
  if (!quiz) throw new Error("Quiz not found or unauthorized");
  return quiz;
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

export async function createQuiz(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { sectionId, lessonId, questions, ...quizData } = createQuizSchema.parse(data);
    
    // Verify ownership and check for existing quiz
    if (sectionId) {
      await verifySectionOwnership(sectionId, user.id);
      
      // Check if quiz already exists for this section
      const existingQuiz = await prisma.quiz.findFirst({
        where: { sectionId },
      });
      if (existingQuiz) throw new Error("A quiz already exists for this section");
    }
    
    if (lessonId) {
      await verifyLessonOwnership(lessonId, user.id);
      
      // Check if quiz already exists for this lesson
      const existingQuiz = await prisma.quiz.findFirst({
        where: { lessonId },
      });
      if (existingQuiz) throw new Error("A quiz already exists for this lesson");
    }
    
    const quiz = await prisma.$transaction(async (tx) => {
      // Create the quiz
      const newQuiz = await tx.quiz.create({
        data: {
          title: quizData.title,
          description: quizData.description,
          timeLimit: quizData.timeLimit,
          passingScore: quizData.passingScore,
          attemptsAllowed: quizData.attemptsAllowed,
          sectionId: sectionId || null,
          lessonId: lessonId || null,
        },
      });
      
      // Create all questions
      await tx.question.createMany({
        data: questions.map(q => ({
          ...q,
          quizId: newQuiz.id,
        })),
      });
      
      // Return quiz with questions
      return await tx.quiz.findUnique({
        where: { id: newQuiz.id },
        include: { questions: true },
      });
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
    
    await verifyQuizOwnership(id, user.id);
    
    // Update quiz and questions in transaction
    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Update quiz basic info
      const updated = await tx.quiz.update({
        where: { id },
        data: {
          title: updateData.title,
          description: updateData.description,
          timeLimit: updateData.timeLimit,
          passingScore: updateData.passingScore,
          attemptsAllowed: updateData.attemptsAllowed,
          // Handle polymorphic updates if needed
          ...(updateData.sectionId !== undefined && { sectionId: updateData.sectionId || null }),
          ...(updateData.lessonId !== undefined && { lessonId: updateData.lessonId || null }),
        },
      });
      
      // If questions provided, replace all questions
      if (questions && questions.length > 0) {
        // Delete existing questions
        await tx.question.deleteMany({ where: { quizId: id } });
        
        // Create new questions
        await tx.question.createMany({
          data: questions.map(q => ({
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
            explanation: q.explanation,
            quizId: id,
          })),
        });
      }
      
      // Return updated quiz with questions
      return await tx.quiz.findUnique({
        where: { id },
        include: { questions: true },
      });
    });
    
    return { success: true, data: updatedQuiz };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuiz(quizId: string) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    await verifyQuizOwnership(quizId, user.id);
    
    // Delete quiz (cascade will delete questions and attempts)
    await prisma.quiz.delete({ where: { id: quizId } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuiz(quizId: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { createdAt: "asc" },
        },
        section: {
          select: {
            id: true,
            title: true,
            course: {
              select: { id: true, title: true, instructorId: true },
            },
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                id: true,
                title: true,
                course: {
                  select: { id: true, title: true, instructorId: true },
                },
              },
            },
          },
        },
        attempts: {
          take: 5,
          orderBy: { startedAt: "desc" },
          include: {
            student: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
    
    if (!quiz) throw new Error("Quiz not found");
    
    // Check if user has permission to view full quiz details
    const user = await requireUser().catch(() => null);
    const isOwner = quiz.section?.course.instructorId === user?.id || 
                    quiz.lesson?.section.course.instructorId === user?.id;
    
    // If not owner, hide correct answers
    if (!isOwner && user?.role !== "ADMIN") {
      const sanitizedQuestions = quiz.questions.map(q => ({
        ...q,
        correctAnswer: undefined, // Hide correct answer from students
      }));
      return { success: true, data: { ...quiz, questions: sanitizedQuestions } };
    }
    
    return { success: true, data: quiz };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuizByParent(parentId: string, type: "section" | "lesson") {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: type === "section" ? { sectionId: parentId } : { lessonId: parentId },
      include: {
        questions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    
    return { success: true, data: quiz };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitQuizAttempt(data: unknown) {
  try {
    const user = await requireUser();
    const { quizId, answers } = submitQuizSchema.parse(data);
    
    // Get quiz with questions and course info
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        section: {
          include: {
            course: {
              select: { id: true, title: true },
            },
          },
        },
        lesson: {
          include: {
            section: {
              include: {
                course: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
    });
    
    if (!quiz) throw new Error("Quiz not found");
    
    // Get course ID
    const courseId = quiz.section?.courseId || quiz.lesson?.section.courseId;
    if (!courseId) throw new Error("Course not found for this quiz");
    
    // Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        courseId: courseId,
      },
    });
    
    if (!enrollment) throw new Error("You must be enrolled in this course to take the quiz");
    
    // Check attempt limits
    const attemptsCount = await prisma.quizAttempt.count({
      where: {
        quizId,
        studentId: user.id,
      },
    });
    
    if (quiz.attemptsAllowed !== -1 && attemptsCount >= quiz.attemptsAllowed) {
      throw new Error(`You have reached the maximum of ${quiz.attemptsAllowed} attempt(s) for this quiz`);
    }
    
    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const answerDetails = [];
    
    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers.find(a => a.questionId === question.id);
      const isCorrect = userAnswer && userAnswer.selectedOption === question.correctAnswer;
      
      if (isCorrect) {
        earnedPoints += question.points;
      }
      
      answerDetails.push({
        questionId: question.id,
        questionText: question.text,
        selectedOption: userAnswer?.selectedOption ?? -1,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect || false,
        pointsEarned: isCorrect ? question.points : 0,
        explanation: question.explanation,
      });
    }
    
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;
    
    // Save attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: user.id,
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        answers: answerDetails,
        completedAt: new Date(),
      },
    });
    
    // Update course progress if needed (optional)
    // You could recalculate overall course progress here
    
    return {
      success: true,
      data: {
        attemptId: attempt.id,
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        passingScore: quiz.passingScore,
        answers: answerDetails,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQuizAttempts(data: unknown) {
  try {
    const user = await requireUser();
    const { quizId, studentId } = getQuizAttemptsSchema.parse(data);
    
    const targetStudentId = studentId || user.id;
    
    // Check if user has permission to view attempts
    let whereClause: any = {
      quizId,
      studentId: targetStudentId,
    };
    
    // Instructors and admins can see all attempts for their quizzes
    if (user.role === "INSTRUCTOR" || user.role === "ADMIN") {
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          OR: [
            { section: { course: { instructorId: user.id } } },
            { lesson: { section: { course: { instructorId: user.id } } } },
          ],
        },
      });
      
      if (quiz) {
        // Instructor can see all attempts for their quiz
        whereClause = { quizId };
      }
    }
    
    const attempts = await prisma.quizAttempt.findMany({
      where: whereClause,
      include: {
        student: {
          select: { name: true, email: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });
    
    return { success: true, data: attempts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentQuizAttempt(quizId: string) {
  try {
    const user = await requireUser();
    
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: user.id,
      },
      orderBy: { startedAt: "desc" },
    });
    
    return { success: true, data: attempt };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function canRetakeQuiz(quizId: string) {
  try {
    const user = await requireUser();
    
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });
    
    if (!quiz) throw new Error("Quiz not found");
    
    if (quiz.attemptsAllowed === -1) {
      return { success: true, data: { canRetake: true, remainingAttempts: Infinity } };
    }
    
    const attemptsCount = await prisma.quizAttempt.count({
      where: {
        quizId,
        studentId: user.id,
      },
    });
    
    const remainingAttempts = Math.max(0, quiz.attemptsAllowed - attemptsCount);
    
    return {
      success: true,
      data: {
        canRetake: remainingAttempts > 0,
        remainingAttempts,
        totalAllowed: quiz.attemptsAllowed,
        attemptsMade: attemptsCount,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// Add this function to your existing quiz actions
export async function reorderQuizzes(data: unknown) {
  try {
    const user = await requireRole("INSTRUCTOR", "ADMIN");
    const { quizzes } = reorderQuizzesSchema.parse(data);
    
    if (quizzes.length === 0) return { success: true };
    
    // Verify ownership of first quiz
    const firstQuiz = await prisma.quiz.findFirst({
      where: {
        id: quizzes[0].id,
        OR: [
          { section: { course: { instructorId: user.id } } },
          { lesson: { section: { course: { instructorId: user.id } } } },
        ],
      },
    });
    
    if (!firstQuiz) throw new Error("Quiz not found or unauthorized");
    
    await Promise.all(
      quizzes.map(({ id, order }) =>
        prisma.quiz.update({
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

export async function getQuizzesByParent(parentId: string, type: "section" | "lesson") {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: type === "section" ? { sectionId: parentId } : { lessonId: parentId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    
    return { success: true, data: quizzes };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}