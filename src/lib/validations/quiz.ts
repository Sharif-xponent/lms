import { z } from "zod";

export const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1)).min(2, "At least 2 options required"),
  correctAnswer: z.number().int().min(0),
  points: z.number().int().min(1).default(1),
  explanation: z.string().optional(),
});

// Base quiz schema without the refine
const baseQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  timeLimit: z.number().int().min(0).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  attemptsAllowed: z.number().int().default(1),
  questions: z.array(createQuestionSchema).min(1, "At least one question required"),
  sectionId: z.string().optional(),
  lessonId: z.string().optional(),
});

// Create schema with validation that either sectionId or lessonId is provided
export const createQuizSchema = baseQuizSchema.refine(
  (data) => {
    const hasSectionId = !!data.sectionId;
    const hasLessonId = !!data.lessonId;
    return (hasSectionId && !hasLessonId) || (!hasSectionId && hasLessonId);
  },
  { 
    message: "Either sectionId or lessonId must be provided, but not both",
    path: ["sectionId"] // This helps with error reporting
  }
);

// Update schema - make all fields optional except id
export const updateQuizSchema = z.object({
  id: z.string().min(1, "Quiz ID is required"),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().optional(),
  timeLimit: z.number().int().min(0).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  attemptsAllowed: z.number().int().optional(),
  questions: z.array(createQuestionSchema).min(1, "At least one question required").optional(),
  sectionId: z.string().optional(),
  lessonId: z.string().optional(),
}).refine(
  (data) => {
    // If both sectionId and lessonId are provided, that's an error
    if (data.sectionId && data.lessonId) {
      return false;
    }
    return true;
  },
  {
    message: "Cannot provide both sectionId and lessonId",
    path: ["sectionId"],
  }
);

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

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type GetQuizAttemptsInput = z.infer<typeof getQuizAttemptsSchema>;