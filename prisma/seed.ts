import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const accounts = [
    { name: "Admin User", email: "admin@learnhub.test", role: "ADMIN" as const },
    { name: "Instructor User", email: "instructor@learnhub.test", role: "INSTRUCTOR" as const },
    { name: "Student User", email: "student@learnhub.test", role: "STUDENT" as const },
  ];

  for (const a of accounts) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: { ...a, hashedPassword: password, emailVerified: new Date() },
    });
    console.log(`Seeded ${a.role}: ${a.email}`);
  }

  console.log("\nAll seed accounts use password: Password123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
