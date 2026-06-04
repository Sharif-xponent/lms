import { z } from "zod";

export const createEnrollmentSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export const updateProgressSchema = z.object({
  enrollmentId: z.string().min(1),
  progress: z.number().int().min(0).max(100),
  completed: z.boolean().optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;