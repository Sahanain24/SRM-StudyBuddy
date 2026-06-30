'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/mock-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Code2, Loader2, RefreshCw, ArrowRight, Search, Filter, X,
} from 'lucide-react';

const PROGRAMS = ['BCA','BCA(DS)','BCom','MSc(ADS)','MCom','MCA','MCA GenAI'];
const YEARS    = [1, 2, 3, 4];
const SECTIONS = ['A','B','C','D','E','F','G','H','I','J'];

interface CodingTestSummary {
  _id: string; title: string; teacherName?: string; durationMins: number;
  problems: { problemId: string; marks: number }[];
  targetPrograms: string[]; targetYears: number[]; targetSections: string[];
  createdAt: string;
}

const MANAGEMENT_ROLES = ['hod', 'dean', 'deputy_dean', 'pro_vc', 'admin'];

export default function CodingTestResultsListPage() {
  const router = useRouter();
  const user = getCurrentUser() as any;
  const [tests, setTests]   = useState<CodingTestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]           = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterYear, setFilterYear]       = useState('');
  const [filterSection, setFilterSection] = useState('');

  const load = async () => {
    setLoading(true);
    const isManagement = MANAGEMENT_ROLES.includes(user?.role);
    const teacherId = !isManagement ? (user?._id || user?.id) : null;
    const url = teacherId ? `/api/coding-tests?teacherId=${teacherId}` : '/api/coding-tests';
    const res = await fetch(url);
    const data = await res.json();
    setTests(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const hasFilters = search || filterProgram || filterYear || filterSection;
  const clearFilters = () => { setSearch(''); setFilterProgram(''); setFilterYear(''); setFilterSection(''); };

  const filtered = tests.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !(t.teacherName || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProgram) {
      if (t.targetPrograms.length > 0 && !t.targetPrograms.includes(filterProgram)) return false;
    }
    if (filterYear) {
      const y = Number(filterYear);
      if (t.targetYears.length > 0 && !t.targetYears.includes(y)) return false;
    }
    if (filterSection) {
      if (t.targetSections.length > 0 && !t.targetSections.includes(filterSection)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
            <Code2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Coding Test Results</h1>
            <p className="text-slate-500 text-sm">View student scores for every scheduled coding test</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5 rounded-xl">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by title or teacher…" className="pl-9 h-9 rounded-xl text-sm"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterProgram || '__all__'} onValueChange={v => setFilterProgram(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9 w-36 rounded-xl text-sm">
                <Filter className="h-3.5 w-3.5 mr-1 text-slate-400" />
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Programs</SelectItem>
                {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterYear || '__all__'} onValueChange={v => setFilterYear(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9 w-28 rounded-xl text-sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Years</SelectItem>
                {YEARS.map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSection || '__all__'} onValueChange={v => setFilterSection(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9 w-32 rounded-xl text-sm">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Sections</SelectItem>
                {SECTIONS.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-slate-500 text-xs h-9">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
          {hasFilters && (
            <p className="text-xs text-slate-400 mt-2 pl-1">
              Showing {filtered.length} of {tests.length} tests
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-2">
            <Code2 className="h-12 w-12 text-slate-300" />
            <p className="text-sm text-slate-400">{tests.length === 0 ? 'No coding tests have been scheduled yet.' : 'No tests match your filters.'}</p>
            {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs mt-1">Clear filters</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <Card key={t._id} className="border-slate-200 shadow-sm">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{t.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{t.problems?.length || 0} problem(s)</Badge>
                      {t.teacherName && <span className="text-xs text-slate-400">By {t.teacherName}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/coding-test/results/${t._id}`)} className="gap-1.5 rounded-xl text-xs">
                    View Scores <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(t.targetPrograms?.length > 0 ? t.targetPrograms : ['All Programs']).map(p => (
                    <Badge key={p} variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{p}</Badge>
                  ))}
                  {t.targetYears?.map(y => (
                    <Badge key={y} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Year {y}</Badge>
                  ))}
                  {t.targetSections?.length > 0
                    ? t.targetSections.map(s => <Badge key={s} variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">Section {s}</Badge>)
                    : <Badge variant="outline" className="text-[10px] text-slate-500">All Sections</Badge>
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
