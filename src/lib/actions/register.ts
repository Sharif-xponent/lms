"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

export async function registerUser(values: SignUpInput) {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid fields. Please check your input." };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, hashedPassword, role },
  });

  return { success: "Account created. You can now sign in." };
}
