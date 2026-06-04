# Next.js Developer (Full Stack) — Coding Test

## Project Name

**LearnHub — Course Authoring & Discovery (LMS Slice)**

Build the instructor-side course authoring experience and the student-side course discovery and enrollment experience for an online learning platform. Instructors create and manage their own courses (with sections, lessons, and quizzes); students browse a public catalog, view course details, and enrol. **Authentication, roles, and route protection are already provided as a starter template** — your job begins at the application modules below.

---

## Required Tech Stack

The following stack is mandatory and is already wired into the starter where relevant.

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (strict mode)
- **ORM:** Prisma
- **Database:** MongoDB
- **Authentication:** NextAuth (Auth.js) — _provided in the starter_
- **Styling:** TailwindCSS
- **Component Library:** Shadcn UI
- **Validation:** Zod
- **Forms:** React Hook Form
- **Icons:** Lucide

You may add additional libraries (drag-and-drop, charts, rich-text editor, file/video storage SDKs, etc.), but be prepared to justify each dependency in your README.

---

## Starter Template

You are given an authentication starter (see the accompanying package and its README). It includes a working Auth.js v5 setup (Credentials + Google), a Prisma/MongoDB schema with a `Role` enum (`STUDENT`, `INSTRUCTOR`, `ADMIN`), edge-safe route protection, a sign-up server action, server-side role guards, and a seed script with one account per role.

- **Do not rebuild authentication.** Build the sign-in / sign-up **UI** (React Hook Form + Zod + shadcn) against the provided actions and config, then build the two modules below.
- **Extend the Prisma schema** with your own LearnHub models (courses, sections, lessons, quizzes, enrolments, reviews, etc.).
- The server is the source of truth for access control — use the provided guards (`requireUser`, `requireRole`) on every protected operation.

---

## Modules & Features

### Module 1 — Course Authoring (Instructor)

- Instructor dashboard scoped strictly to that instructor's own courses.
- Course CRUD: title, description, cover image, category, level, price (or free), and status (draft/published).
- Curriculum builder: sections and lessons, with drag-and-drop ordering.
- Lesson content types: text/rich content and video URL, plus downloadable attachments.
- Quizzes attached to lessons or sections, with multiple-choice questions and correct answers.
- Server-side pagination, sorting, search, and filtering of the instructor's courses.

### Module 2 — Course Discovery & Enrollment (Student)

- Public course catalog with search, category/level filters, and sorting.
- Course detail page with curriculum preview, instructor info, and aggregate rating.
- Enrollment flow (free enrollment; paid courses may use a mock checkout step).
- "My Courses" view listing enrolled courses with progress indicators.

---

## Non-Functional Requirements

These are not optional and carry significant weight.

- **Database design:** A thoughtful Prisma schema extending the starter — appropriate relations, embedded vs. referenced data decisions, and indexes suited to MongoDB and the query patterns above (catalog search/filter, instructor-scoped lists, ordering).
- **Authorization:** Every server action / route handler verifies both authentication and the caller's permission (instructor owns the course, student is enrolled, etc.) using the server as the source of truth.
- **Validation:** Zod schemas shared between client and server. The server validates every input independently — never trust the client.
- **Ordering integrity:** Drag-and-drop section/lesson order must persist correctly and remain stable across reads.
- **Rendering strategy:** Deliberate use of Server Components, Client Components, Server Actions, and Route Handlers, with a clear rationale.
- **Caching & data freshness:** A clear caching and revalidation strategy, especially for the public catalog.
- **UX states:** Proper loading, error, and empty states throughout.
- **Accessibility:** Keyboard navigation (including the drag-and-drop interactions), focus management, semantic markup, and ARIA where appropriate.
- **Responsiveness:** Works well on mobile, tablet, and desktop.
- **Type safety:** Strict TypeScript, with no use of `any` to escape the type system.
- **Project structure:** Clean, scalable organization with clear separation of concerns.
- **Security:** Protection against the common web vulnerabilities relevant to this stack.

---

## Deliverables

1. A **Git repository** (public or with access granted to our team) with a clean, meaningful commit history, building on the provided starter.
2. A **README** containing:
   - Setup and run instructions, including required environment variables.
   - A database seed script (extend the provided one) with at least one instructor, one student, and a few sample courses with sections, lessons, and a quiz.
   - A short write-up of your architectural decisions and trade-offs, what you would improve with more time, and any known limitations.
3. _(Optional)_ A deployed, working live link.

---

## Evaluation Criteria

- **Database modeling** — how well you extend the schema; relations, indexing, and query/index appropriateness for MongoDB.
- **Authorization** — correct, server-enforced ownership and enrollment checks built on the provided guards.
- **Authoring UX** — a usable curriculum builder, reliable drag-and-drop ordering, and clean course CRUD.
- **Discovery UX** — effective server-side catalog search, filtering, sorting, and pagination.
- **Next.js proficiency** — correct, intentional use of App Router primitives (Server/Client Components, Server Actions, caching, revalidation).
- **Validation & data integrity** — shared, robust Zod validation with the server as the source of truth.
- **UI/UX & accessibility** — polish, responsiveness, thoughtful states, and a11y.
- **Code quality & architecture** — structure, readability, separation of concerns, naming, consistency.
- **Engineering judgment** — sensible trade-offs, dependency choices, and prioritization.
- **Documentation & communication** — clarity of the README and your explanation of decisions.

---

## Guidelines & Expectations

- **Scope:** Focused on two modules so you can go deep rather than wide. A smaller, polished, secure implementation is stronger than a broad but broken one. Document anything you choose to skip and why.
- **Time:** Roughly **4 hours** of focused work, since authentication is already provided. Prioritize and timebox; tell us what you would build next.
- **Media & payments:** Real video hosting and real payments are not required — video URLs and a mock checkout step are sufficient.
- **AI tools:** Permitted, but you own and must be able to fully explain every line you submit. Expect a follow-up technical discussion walking through your code and decisions.
- **Ambiguity:** If any requirement is unclear, make a reasonable assumption, document it, and proceed.
