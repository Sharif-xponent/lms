

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  // Create users
  const users = {
    admin: await prisma.user.upsert({
      where: { email: "admin@learnhub.test" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@learnhub.test",
        hashedPassword: password,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    }),
    instructor: await prisma.user.upsert({
      where: { email: "instructor@learnhub.test" },
      update: {},
      create: {
        name: "John Smith",
        email: "instructor@learnhub.test",
        hashedPassword: password,
        role: "INSTRUCTOR",
        emailVerified: new Date(),
      },
    }),
    student: await prisma.user.upsert({
      where: { email: "student@learnhub.test" },
      update: {},
      create: {
        name: "Jane Doe",
        email: "student@learnhub.test",
        hashedPassword: password,
        role: "STUDENT",
        emailVerified: new Date(),
      },
    }),
  };

  console.log("✅ Seeded users");

  // Sample Course 1: Web Development Bootcamp
  const webDevCourse = await prisma.course.create({
    data: {
      title: "Complete Web Development Bootcamp 2024",
      description: "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch. Build real-world projects and become a full-stack developer.",
      coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      category: "Programming",
      level: "Beginner",
      price: 49.99,
      status: "PUBLISHED",
      instructorId: users.instructor.id,
    },
  });
  console.log(`✅ Created course: ${webDevCourse.title}`);

  // Sections for Web Development Course
  const section1 = await prisma.section.create({
    data: {
      title: "JavaScript Fundamentals",
      description: "Master the core concepts of JavaScript programming",
      order: 0,
      courseId: webDevCourse.id,
    },
  });

  const section2 = await prisma.section.create({
    data: {
      title: "React & Modern Frontend",
      description: "Build dynamic user interfaces with React",
      order: 1,
      courseId: webDevCourse.id,
    },
  });

  // Lessons for Section 1
  const lesson1 = await prisma.lesson.create({
    data: {
      title: "Variables and Data Types",
      content: "In this lesson, you'll learn about variables, constants, and different data types in JavaScript including strings, numbers, booleans, arrays, and objects.",
      type: "TEXT",
      order: 0,
      isPreview: true,
      sectionId: section1.id,
      attachments: [],
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      title: "Functions and Scope",
      content: "Learn how to write reusable code with functions, understand function declarations vs expressions, arrow functions, and scope in JavaScript.",
      type: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      order: 1,
      isPreview: false,
      sectionId: section1.id,
      attachments: [],
    },
  });

  const lesson3 = await prisma.lesson.create({
    data: {
      title: "Arrays and Objects",
      content: "Master array methods like map, filter, reduce, and understand how to work with objects and arrays of objects.",
      type: "TEXT",
      order: 2,
      isPreview: false,
      sectionId: section1.id,
      attachments: [],
    },
  });

  // Quiz for Section 1
  const section1Quiz = await prisma.quiz.create({
    data: {
      title: "JavaScript Fundamentals Quiz",
      description: "Test your understanding of JavaScript basics",
      passingScore: 70,
      attemptsAllowed: 3,
      order: 0,
      sectionId: section1.id,
    },
  });

  // Questions for Section 1 Quiz
  await prisma.question.createMany({
    data: [
      {
        text: "What is the correct way to declare a variable in JavaScript?",
        options: ["variable x = 5;", "var x = 5;", "v x = 5;", "x = 5;"],
        correctAnswer: 1,
        points: 10,
        order: 0,
        quizId: section1Quiz.id,
      },
      {
        text: "Which of the following is a JavaScript framework?",
        options: ["React", "Django", "Rails", "Laravel"],
        correctAnswer: 0,
        points: 10,
        order: 1,
        quizId: section1Quiz.id,
      },
      {
        text: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"],
        correctAnswer: 0,
        points: 10,
        order: 2,
        quizId: section1Quiz.id,
      },
    ],
  });

  // Quiz for Lesson 2 (Video lesson)
  const lesson2Quiz = await prisma.quiz.create({
    data: {
      title: "Functions Quiz",
      description: "Test your knowledge about JavaScript functions",
      passingScore: 80,
      attemptsAllowed: 2,
      timeLimit: 10,
      order: 0,
      lessonId: lesson2.id,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        text: "What is the output of console.log(typeof null)?",
        options: ["null", "undefined", "object", "number"],
        correctAnswer: 2,
        points: 10,
        explanation: "In JavaScript, typeof null returns 'object' due to a historical bug.",
        order: 0,
        quizId: lesson2Quiz.id,
      },
      {
        text: "Which method adds an element to the end of an array?",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correctAnswer: 0,
        points: 10,
        order: 1,
        quizId: lesson2Quiz.id,
      },
    ],
  });

  // Lessons for Section 2
  const lesson4 = await prisma.lesson.create({
    data: {
      title: "Introduction to React",
      content: "Learn about React components, JSX, props, and state. Understand the virtual DOM and how React renders components efficiently.",
      type: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      order: 0,
      isPreview: true,
      sectionId: section2.id,
      attachments: [],
    },
  });

  const lesson5 = await prisma.lesson.create({
    data: {
      title: "React Hooks Deep Dive",
      content: "Master useState, useEffect, useContext, and custom hooks. Learn best practices for managing state and side effects.",
      type: "TEXT",
      order: 1,
      isPreview: false,
      sectionId: section2.id,
      attachments: [],
    },
  });

  // Sample Course 2: Data Science Fundamentals
  const dataScienceCourse = await prisma.course.create({
    data: {
      title: "Data Science Fundamentals with Python",
      description: "Learn Python, Pandas, NumPy, Matplotlib, and basic machine learning concepts. Perfect for beginners in data science.",
      coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
      category: "Data Science",
      level: "Intermediate",
      price: 79.99,
      status: "PUBLISHED",
      instructorId: users.instructor.id,
    },
  });
  console.log(`✅ Created course: ${dataScienceCourse.title}`);

  const dsSection1 = await prisma.section.create({
    data: {
      title: "Python Programming Basics",
      description: "Get started with Python programming",
      order: 0,
      courseId: dataScienceCourse.id,
    },
  });

  const dsLesson1 = await prisma.lesson.create({
    data: {
      title: "Python Installation and Setup",
      content: "Install Python, set up your development environment, and write your first Python program.",
      type: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      order: 0,
      isPreview: true,
      sectionId: dsSection1.id,
      attachments: [],
    },
  });

  const dsLesson2 = await prisma.lesson.create({
    data: {
      title: "Python Data Types and Structures",
      content: "Learn about lists, tuples, dictionaries, sets, and how to work with different data types in Python.",
      type: "TEXT",
      order: 1,
      isPreview: false,
      sectionId: dsSection1.id,
      attachments: [],
    },
  });

  // Quiz for Data Science Section
  const dsQuiz = await prisma.quiz.create({
    data: {
      title: "Python Basics Quiz",
      description: "Test your Python knowledge",
      passingScore: 70,
      attemptsAllowed: 3,
      order: 0,
      sectionId: dsSection1.id,
    },
  });

  await prisma.question.createMany({
    data: [
      {
        text: "What is the correct file extension for Python files?",
        options: [".pyth", ".pt", ".py", ".p"],
        correctAnswer: 2,
        points: 10,
        order: 0,
        quizId: dsQuiz.id,
      },
      {
        text: "Which of the following is a mutable data type in Python?",
        options: ["tuple", "string", "list", "int"],
        correctAnswer: 2,
        points: 10,
        order: 1,
        quizId: dsQuiz.id,
      },
    ],
  });

  // Sample Course 3: UI/UX Design (Free Course)
  const designCourse = await prisma.course.create({
    data: {
      title: "UI/UX Design Masterclass",
      description: "Learn user interface and user experience design principles, Figma, prototyping, and design thinking methodology.",
      coverImage: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
      category: "Design",
      level: "Beginner",
      price: 0,
      status: "PUBLISHED",
      instructorId: users.instructor.id,
    },
  });
  console.log(`✅ Created course: ${designCourse.title}`);

  const designSection = await prisma.section.create({
    data: {
      title: "Design Fundamentals",
      description: "Core principles of UI/UX design",
      order: 0,
      courseId: designCourse.id,
    },
  });

  await prisma.lesson.create({
    data: {
      title: "Introduction to Design Thinking",
      content: "Learn the five phases of design thinking: Empathize, Define, Ideate, Prototype, and Test.",
      type: "TEXT",
      order: 0,
      isPreview: true,
      sectionId: designSection.id,
      attachments: [],
    },
  });

  // Enroll student in courses
  await prisma.enrollment.create({
    data: {
      studentId: users.student.id,
      courseId: webDevCourse.id,
      progress: 0,
      completed: false,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: users.student.id,
      courseId: designCourse.id,
      progress: 0,
      completed: false,
    },
  });
  console.log("✅ Enrolled student in sample courses");

  // Add a review for the web development course
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Excellent course! The instructor explains concepts clearly and the projects are very practical.",
      studentId: users.student.id,
      courseId: webDevCourse.id,
    },
  });
  console.log("✅ Added sample review");

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📝 Default Accounts:");
  console.log("   Admin: admin@learnhub.test / Password123!");
  console.log("   Instructor: instructor@learnhub.test / Password123!");
  console.log("   Student: student@learnhub.test / Password123!");
  console.log("\n📚 Sample Courses Created:");
  console.log("   1. Complete Web Development Bootcamp ($49.99)");
  console.log("   2. Data Science Fundamentals with Python ($79.99)");
  console.log("   3. UI/UX Design Masterclass (Free)");
  console.log("\n✅ Each course includes sections, lessons, and quizzes!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });