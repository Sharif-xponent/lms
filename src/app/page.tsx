import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  Trophy, 
  ArrowRight, 
  CheckCircle,
  Star,
  PlayCircle,
  GraduationCap,
  BarChart3,
  Sparkles,
  Menu,
  X
} from "lucide-react";
import Image from "next/image";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;
  
  const isInstructor = user?.role === "INSTRUCTOR";
  const isStudent = user?.role === "STUDENT";
  const isAdmin = user?.role === "ADMIN";

  // Dashboard link based on role
  const getDashboardLink = () => {
    if (isInstructor) return "/instructor/dashboard";
    if (isStudent) return "/student/my-courses";
    if (isAdmin) return "/admin/dashboard";
    return null;
  };

  const dashboardLink = getDashboardLink();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LearnHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 transition">
                Features
              </Link>
              <Link href="courses" className="text-slate-600 hover:text-slate-900 transition">
                Courses
              </Link>
              <Link href="#instructors" className="text-slate-600 hover:text-slate-900 transition">
                Instructors
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-slate-900 transition">
                Pricing
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  {dashboardLink && (
                    <Link href={dashboardLink}>
                      <Button variant="default" className="hidden sm:flex">
                        {isInstructor && "Instructor Dashboard"}
                        {isStudent && "My Dashboard"}
                        {isAdmin && "Admin Panel"}
                      </Button>
                    </Link>
                  )}
                  <form action={async () => {
                    'use server';
                    const { signOut } = await import("@/auth");
                    await signOut({ redirectTo: "/" });
                  }}>
                    <Button type="submit" variant="outline">
                      Sign Out
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/signin">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Welcome to LearnHub</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Learn Anything, Anytime, Anywhere
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Join thousands of students and instructors in the world's most innovative learning platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="text-lg">
                      Start Learning Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button size="lg" variant="outline" className="text-lg">
                      Browse Courses
                    </Button>
                  </Link>
                </>
              )}
              {user && dashboardLink && (
                <Link href={dashboardLink}>
                  <Button size="lg" className="text-lg">
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-8 border-t border-slate-200">
              <div>
                <div className="text-3xl font-bold text-slate-900">50K+</div>
                <div className="text-sm text-slate-600">Active Students</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">2K+</div>
                <div className="text-sm text-slate-600">Expert Instructors</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">1K+</div>
                <div className="text-sm text-slate-600">Courses</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">98%</div>
                <div className="text-sm text-slate-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose LearnHub?</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything you need to master new skills and advance your career
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Content</h3>
              <p className="text-slate-600">
                Expert-led courses with practical, real-world projects and hands-on learning.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Support</h3>
              <p className="text-slate-600">
                Join a vibrant community of learners and get support from peers and mentors.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Certification</h3>
              <p className="text-slate-600">
                Earn certificates upon completion and showcase your achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Instructors Section */}
      <section id="instructors" className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full mb-4">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">For Instructors</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Share Your Knowledge with the World
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Become an instructor and reach millions of students worldwide. Create courses, 
                build your brand, and earn revenue doing what you love.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Powerful course creation tools",
                  "Detailed analytics and insights",
                  "Dedicated support and resources",
                  "Fair revenue sharing model"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {!isInstructor && (
                <Link href="/signup?role=INSTRUCTOR">
                  <Button size="lg" variant="outline">
                    Become an Instructor
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="flex-1">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-lg mb-4">
                  "Teaching on LearnHub has been life-changing. The platform is intuitive, 
                  and the support team is incredible!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm opacity-90">Top Instructor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses Preview */}
      <section id="courses" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Courses</h2>
            <p className="text-xl text-slate-600">
              Start learning from our most popular courses today
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Web Development Bootcamp",
                students: "15,234 students",
                rating: "4.8",
                image: "💻"
              },
              {
                title: "Data Science & AI",
                students: "12,847 students",
                rating: "4.9",
                image: "📊"
              },
              {
                title: "UI/UX Design Masterclass",
                students: "8,921 students",
                rating: "4.7",
                image: "🎨"
              }
            ].map((course, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition">
                <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-6xl">
                  {course.image}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <span>{course.students}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/courses">
              <Button variant="link">
                View All Courses
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of learners and start building your future today
            </p>
            {!user && (
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="text-blue-600">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
            {user && dashboardLink && (
              <Link href={dashboardLink}>
                <Button size="lg" variant="secondary" className="text-blue-600">
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold">LearnHub</span>
              </div>
              <p className="text-slate-400 text-sm">
                Empowering learners worldwide with quality education.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">Courses</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition">Twitter</Link></li>
                <li><Link href="#" className="hover:text-white transition">LinkedIn</Link></li>
                <li><Link href="#" className="hover:text-white transition">GitHub</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 LearnHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}