'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { User, getCurrentUser } from '@/lib/mock-db';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  const [examActive, setExamActive] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/auth');
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [router]);

  // Reset examActive whenever the user navigates away from the exam/aptitude pages
  useEffect(() => {
    const isExamPage = pathname === '/dashboard/exam' || pathname === '/dashboard/aptitude';
    if (!isExamPage) setExamActive(false);
  }, [pathname]);

  // Listen for the custom 'examActive' event dispatched by the exam page
  useEffect(() => {
    const handler = (e: Event) => {
      setExamActive((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener('examActiveChange', handler);
    return () => window.removeEventListener('examActiveChange', handler);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Hide sidebar only during an active exam/aptitude session, or on the video call page
  const isCallPage   = pathname.startsWith('/dashboard/mentor/call/');
  const hideSidebar  = examActive || isCallPage;
  const noPadding    = isCallPage;

  return (
    <div className="flex bg-background min-h-screen">
      {!hideSidebar && <Sidebar user={user} />}
      <main className={`flex-1 overflow-y-auto max-h-screen ${noPadding ? 'p-0' : 'pt-16 md:pt-0 px-4 py-4 md:p-8'}`}>
        <div className={noPadding ? 'h-full' : 'max-w-6xl mx-auto'}>
          {children}
        </div>
      </main>
    </div>
  );
}
