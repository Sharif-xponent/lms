import { z } from "zod";

export const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1)).min(2, "At least 2 options required"),
  correctAnswer: z.number().int().min(0),
  points: z.number().int().min(1).default(1),
});

export const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  lessonId: z.string().min(1, "Lesson ID is required"),
  questions: z.array(createQuestionSchema).min(1, "At least one question required"),
});

export const updateQuizSchema = createQuizSchema.partial().extend({
  id: z.string().min(1, "Quiz ID is required"),
});

export const submitQuizAnswersSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOption: z.number().int().min(0),
  })),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type SubmitQuizAnswersInput = z.infer<typeof submitQuizAnswersSchema>;