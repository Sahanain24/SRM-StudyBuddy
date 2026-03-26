
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Code, Mic, BarChart3, GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-white/20 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <Link className="flex items-center justify-center group" href="/">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white group-hover:shadow-lg transition-all duration-300">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="ml-3 text-2xl font-headline font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">SRM Study Buddy</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors duration-200" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors duration-200" href="/auth">
            Login
          </Link>
          <Button asChild variant="default" size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300">
            <Link href="/auth?tab=register">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10"></div>
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  🎓 AI-Powered Academic Excellence
                </div>
                <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Elevate Your Learning Journey
                </h1>
                <p className="mx-auto max-w-[700px] text-lg md:text-xl text-slate-600 font-body leading-relaxed">
                  SRM Study Buddy is your all-in-one companion for mastering coding, improving communication, and tracking your academic progress.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button asChild size="lg" className="px-8 h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <Link href="/auth?tab=register">Join Now</Link>
                </Button>
                <Button variant="outline" size="lg" className="px-8 h-14 text-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-headline font-bold bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent mb-4">
                Powerful Learning Tools
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Everything you need to excel in your academic journey
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold text-slate-900">Study Tracker</h3>
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Log your study hours and visualize your focus areas with beautiful analytics.
                </p>
              </div>
              <div className="group relative flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Mic className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold text-slate-900">AI Speech Coach</h3>
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Practice communication and get instant AI feedback on grammar and clarity.
                </p>
              </div>
              <div className="group relative flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold text-slate-900">Coding Lab</h3>
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Solve real-world programming challenges and track your problem-solving growth.
                </p>
              </div>
              <div className="group relative flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold text-slate-900">Teacher Insights</h3>
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Teachers get a bird's-eye view of student performance and engagement.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <p className="text-xs text-slate-600">© 2024 SRM Study Buddy. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors duration-200" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs text-slate-600 hover:text-blue-600 transition-colors duration-200" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
