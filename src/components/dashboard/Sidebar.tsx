
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Code, 
  Mic, 
  LayoutDashboard, 
  LogOut, 
  GraduationCap, 
  CheckSquare,
  Users,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, setCurrentUser } from '@/lib/mock-db';
import { Button } from '../ui/button';

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    setCurrentUser(null);
    router.push('/');
  };

  const navItems = [
    { name: 'Overview', icon: LayoutDashboard, href: '/dashboard', roles: ['student'] },
    { name: 'Study Hub', icon: BookOpen, href: '/dashboard/study', roles: ['student'] },
    { name: 'Coding Lab', icon: Code, href: '/dashboard/coding', roles: ['student'] },
    { name: 'Speech Practice', icon: Mic, href: '/dashboard/communication', roles: ['student'] },
    { name: 'Smart Quizzes', icon: CheckSquare, href: '/dashboard/quiz', roles: ['student'] },
    { name: 'Study History', icon: History, href: '/dashboard/history', roles: ['student'] },
    { name: 'Teacher Insights', icon: Users, href: '/dashboard/teacher', roles: ['teacher'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-gradient-to-b from-white to-slate-50 border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white group-hover:shadow-lg transition-all duration-300">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-headline font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">SRM Study Buddy</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
              pathname === item.href
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="px-4 py-3 mb-2 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
          <p className="text-xs text-slate-600 truncate capitalize">{user.role}</p>
        </div>
        <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
