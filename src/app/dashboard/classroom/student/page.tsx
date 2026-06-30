'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/mock-db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, GraduationCap, BookOpen, ArrowRight, Users, ChevronDown, Layers } from 'lucide-react';

interface Batch {
  _id: string; name: string; program: string; year: number;
  section: string; subject: string; studentCount: number;
}

export default function StudentClassroomPage() {
  const router = useRouter();
  const user   = getCurrentUser() as any;
  const userId = user?._id || user?.id;

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Group batches by Program → Year for batchwise organization
  const groups = batches.reduce((acc, batch) => {
    const programKey = batch.program || 'Other';
    const yearKey    = `Year ${batch.year}${batch.section ? ` · Section ${batch.section}` : ''}`;
    acc[programKey] ??= {};
    acc[programKey][yearKey] ??= [];
    acc[programKey][yearKey].push(batch);
    return acc;
  }, {} as Record<string, Record<string, Batch[]>>);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/classroom/batches?studentId=${userId}`)
      .then(r => r.json())
      .then(d => setBatches(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Classrooms</h1>
          <p className="text-slate-500 text-sm">View announcements, materials, assignments and polls from your teachers</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <GraduationCap className="h-14 w-14 text-slate-300" />
            <p className="font-semibold text-slate-600">No classrooms yet</p>
            <p className="text-sm text-slate-400">Your teacher will enroll you in a batch. Check back soon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([program, sections]) => (
            <div key={program} className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleGroup(program)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  <Layers className="h-4 w-4 text-emerald-600" /> {program}
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {Object.values(sections).reduce((n, b) => n + b.length, 0)} batches
                  </Badge>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${collapsed.has(program) ? '' : 'rotate-180'}`} />
              </button>

              {!collapsed.has(program) && (
                <div className="p-4 space-y-4 bg-white">
                  {Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([section, sectionBatches]) => (
                    <div key={section}>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{section}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {sectionBatches.map(batch => (
                          <Card key={batch._id} className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <CardContent className="pt-5 pb-5">
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow w-fit mb-3">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{batch.name}</h3>
                              {batch.subject && <p className="text-sm text-slate-500 mb-2">{batch.subject}</p>}
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                <Badge variant="outline" className="text-[10px]">{batch.program}</Badge>
                                <Badge variant="outline" className="text-[10px]">Year {batch.year}</Badge>
                                {batch.section && <Badge variant="outline" className="text-[10px]">Sec {batch.section}</Badge>}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Users className="h-3.5 w-3.5" /> {batch.studentCount} students
                                </span>
                                <Button size="sm"
                                  onClick={() => router.push(`/dashboard/classroom/student/${batch._id}`)}
                                  className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                                  Open <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
