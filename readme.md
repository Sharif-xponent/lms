# LearnHub - Course Authoring & Discovery Platform

A full-stack Learning Management System (LMS) built with Next.js 15, TypeScript, Prisma, MongoDB, and NextAuth.js. Instructors can create courses with sections, lessons, and quizzes, while students can discover, enroll, and track their learning progress.

## 🚀 Features

### For Instructors
- Course CRUD operations (title, description, cover image, category, level, price)
- Curriculum builder with drag-and-drop section/lesson ordering
- Multiple lesson types (text and video)
- Multiple quiz support per section/lesson
- Course status management (draft/published)
- Server-side pagination, sorting, search, and filtering

### For Students
- Public course catalog with search and filters
- Course enrollment (free courses + mock checkout for paid)
- Interactive learning interface with progress tracking
- Quiz taking with scoring and attempt limits
- Course reviews and ratings
- Personal dashboard with enrolled courses

### Authentication
- Email/Password authentication
- Google OAuth integration
- Role-based access control (Admin, Instructor, Student)
- Protected routes and server actions

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Google OAuth credentials (optional, for social login)

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB with Prisma ORM
- **Authentication:** NextAuth.js (Auth.js v5)
- **Styling:** TailwindCSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **Drag & Drop:** dnd-kit
- **Icons:** Lucide React

## 📦 Installation

### 1. Clone the repository
```bash
git clone https://github.com/Sharif-xponent/lms.git
cd learnhub
npm install
cp .env.example .env

# Database
DATABASE_URL="mongodb://localhost:27017/learnhub"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Generate Prisma client
npx prisma generate

# Push the schema to MongoDB
npx prisma db push

npm run db:seed

npm run dev

# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:seed         # Seed database with sample data

# Code quality
npm run lint            # Run ESLint