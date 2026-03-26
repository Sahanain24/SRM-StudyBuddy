
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Brain, Code, MessageSquare, Clock, TrendingUp, CheckCircle2, UserCircle, Bell } from 'lucide-react';
import { getDb, getCurrentUser, User, TeacherFeedback } from '@/lib/mock-db';
import Link from 'next/link';

export default function DashboardOverview() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [feedbacks, setFeedbacks] = useState<TeacherFeedback[]>([]);
  const [stats, setStats] = useState({
    totalStudyHours: 0,
    quizzesTaken: 0,
    codingDone: 0,
    logsCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { db } = await import('@/lib/mock-db');
        const u = getCurrentUser();
        
        if (u?.role === 'teacher') {
          router.push('/dashboard/teacher');
          return;
        }

        setUser(u);
        
        if (u) {
          // Fetch all data in parallel
          const [
            userSessions,
            userQuizzes,
            userCoding,
            userLogs,
            userFeedback
          ] = await Promise.all([
            db.getStudySessions(u.id || u._id),
            db.getQuizResults(u.id || u._id),
            db.getCodingSubmissions(u.id || u._id),
            db.getStudyLogs(u.id || u._id),
            db.getTeacherFeedback(u.id || u._id)
          ]);

          const totalDuration = userSessions.reduce((acc: number, s: any) => acc + s.duration, 0);
          
          setFeedbacks(userFeedback);
          setStats({
            totalStudyHours: Math.round(totalDuration / 3600 * 10) / 10,
            quizzesTaken: userQuizzes.length,
            codingDone: userCoding.length,
            logsCount: userLogs.length,
          });
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      }
    };

    fetchData();
  }, [router]);

  if (!user || user.role === 'teacher') return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Academic Overview</h1>
          <p className="text-slate-600 mt-1">Welcome back, {user.name}! 🎓</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <Link href="/dashboard/study">
            <BookOpen className="mr-2 h-4 w-4" />
            Manage Study Logs
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50 border border-blue-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Study Logs</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold text-slate-900">{stats.logsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Ready for quizzes</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-indigo-50 border border-indigo-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Quizzes Taken</CardTitle>
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold text-slate-900">{stats.quizzesTaken}</div>
            <p className="text-xs text-slate-500 mt-1">Goal: 5 per week</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Coding Exercises</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold text-slate-900">{stats.codingDone}</div>
            <p className="text-xs text-slate-500 mt-1">Building history</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-purple-50 border border-purple-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">User Role</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <UserCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold capitalize text-slate-900">{user.role}</div>
            <p className="text-xs text-slate-500 mt-1">SRM Study Buddy Platform</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50 border border-blue-100">
          <CardHeader className="pb-4">
            <CardTitle className="font-headline flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Bell className="h-5 w-5" />
              </div>
              Teacher Feedback & Notifications
            </CardTitle>
            <CardDescription className="text-slate-600">Targeted advice from your educators.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbacks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>No feedback received yet. Keep studying!</p>
                </div>
              ) : (
                feedbacks.map((f) => (
                  <div key={f._id || f.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-sm mb-2 text-slate-700">{f.message}</p>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Teacher • {new Date(f.date).toLocaleDateString()}</span>
                      {!f.read && <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] h-4">New</Badge>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 border border-slate-200">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Recommended Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {stats.logsCount === 0 ? (
                <li className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl flex items-center justify-between hover:shadow-md transition-all duration-300">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">Create your first Study Log</h5>
                    <p className="text-xs text-slate-600 mt-1">Add notes to generate personalized quizzes.</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild><Link href="/dashboard/study">Start</Link></Button>
                </li>
              ) : (
                <li className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-between hover:shadow-md transition-all duration-300">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">Test your knowledge</h5>
                    <p className="text-xs text-slate-600 mt-1">Take a quiz based on your latest study log.</p>
                  </div>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild><Link href="/dashboard/quiz">Quiz Me</Link></Button>
                </li>
              )}
              <li className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-between hover:shadow-md transition-all duration-300">
                <div>
                  <h5 className="font-bold text-sm text-slate-900">Practice Coding</h5>
                  <p className="text-xs text-slate-600 mt-1">Generate a challenge to improve logic.</p>
                </div>
                <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50" asChild><Link href="/dashboard/coding">Practice</Link></Button>
              </li>
              <li className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl flex items-center justify-between hover:shadow-md transition-all duration-300">
                <div>
                  <h5 className="font-bold text-sm text-slate-900">Speech Analysis</h5>
                  <p className="text-xs text-slate-600 mt-1">Perfect your technical communication.</p>
                </div>
                <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50" asChild><Link href="/dashboard/communication">Go</Link></Button>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
