"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { createReviewSchema, updateReviewSchema } from "@/lib/validations/review";

export async function createReview(data: unknown) {
  try {
    const user = await requireUser();
    const { courseId, rating, comment } = createReviewSchema.parse(data);
    
    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        courseId,
      },
    });
    
    if (!enrollment) throw new Error("You must be enrolled to review this course");
    
    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId,
        },
      },
    });
    
    if (existingReview) throw new Error("You have already reviewed this course");
    
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        studentId: user.id,
        courseId,
      },
      include: {
        student: {
          select: { name: true },
        },
      },
    });
    
    return { success: true, data: review };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateReview(data: unknown) {
  try {
    const user = await requireUser();
    const { reviewId, rating, comment } = updateReviewSchema.parse(data);
    
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        studentId: user.id,
      },
    });
    
    if (!review) throw new Error("Review not found or unauthorized");
    
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { rating, comment },
    });
    
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteReview(reviewId: string) {
  try {
    const user = await requireUser();
    
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        studentId: user.id,
      },
    });
    
    if (!review) throw new Error("Review not found or unauthorized");
    
    await prisma.review.delete({ where: { id: reviewId } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCourseReviews(courseId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { courseId },
      include: {
        student: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    return {
      success: true,
      data: {
        reviews,
        averageRating: avgRating,
        totalReviews: reviews.length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}