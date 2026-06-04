import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  coverImage: z.string().url().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  price: z.number().min(0, "Price cannot be negative"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  id: z.string().min(1, "Course ID is required"),
});

export const getCoursesSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  sortBy: z.enum(["createdAt", "title", "price", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type GetCoursesInput = z.infer<typeof getCoursesSchema>;