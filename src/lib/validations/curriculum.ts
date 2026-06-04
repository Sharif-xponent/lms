import { z } from "zod";

export const createSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional(),
  courseId: z.string().min(1, "Course ID is required"),
});

export const updateSectionSchema = createSectionSchema.partial().extend({
  id: z.string().min(1, "Section ID is required"),
});

export const reorderSectionsSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0),
  })),
});

export const createLessonSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().nullable(),
  attachments: z.array(z.string().url()).default([]),
  type: z.enum(["TEXT", "VIDEO"]).default("TEXT"),
  isPreview: z.boolean().default(false),
  sectionId: z.string().min(1, "Section ID is required"),
});

export const updateLessonSchema = createLessonSchema.partial().extend({
  id: z.string().min(1, "Lesson ID is required"),
});

export const reorderLessonsSchema = z.object({
  lessons: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0),
  })),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;