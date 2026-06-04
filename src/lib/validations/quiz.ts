import { z } from "zod";

export const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1)).min(2, "At least 2 options required"),
  correctAnswer: z.number().int().min(0),
  points: z.number().int().min(1).default(1),
  explanation: z.string().optional(),
  order: z.number().int().default(0),
});

export const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  timeLimit: z.number().int().min(0).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  attemptsAllowed: z.number().int().default(1),
  order: z.number().int().default(0),
  questions: z.array(createQuestionSchema).min(1, "At least one question required"),
  
  // Polymorphic: either sectionId or lessonId
  sectionId: z.string().optional(),
  lessonId: z.string().optional(),
}).refine(
  (data) => {
    const hasSectionId = !!data.sectionId;
    const hasLessonId = !!data.lessonId;
    return (hasSectionId && !hasLessonId) || (!hasSectionId && hasLessonId);
  },
  { message: "Either sectionId or lessonId must be provided, but not both" }
);

export const updateQuizSchema = z.object({
  id: z.string().min(1, "Quiz ID is required"),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  timeLimit: z.number().int().min(0).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  attemptsAllowed: z.number().int().optional(),
  order: z.number().int().optional(),
  questions: z.array(createQuestionSchema).optional(),
});

export const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOption: z.number().int().min(0),
  })),
});

export const getQuizAttemptsSchema = z.object({
  quizId: z.string().min(1),
  studentId: z.string().optional(),
});

export const reorderQuizzesSchema = z.object({
  quizzes: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0),
  })),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type GetQuizAttemptsInput = z.infer<typeof getQuizAttemptsSchema>;
export type ReorderQuizzesInput = z.infer<typeof reorderQuizzesSchema>;