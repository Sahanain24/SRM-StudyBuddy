'use client';

import { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/mock-db';
import { format } from 'date-fns';
import {
  GraduationCap, MessageSquare,
  Send, Search, Users, BarChart2,
  ChevronRight, Eye,
  Download, FileSpreadsheet, Code2, Loader2, RefreshCw, Filter, X,
  LineChart,
} from 'lucide-react';
import { AITestComparison } from '@/components/dashboard/AITestComparison';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AptitudeAttempt {
  _id: string; userName: string; topic: string;
  score: number; total: number; percentage: number; timeTaken: number;
  answers: number[]; correctAnswers: number[]; questions: any[];
  date: string;
}

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
function pctColor(p: number) {
  return p >= 80 ? 'text-green-600' : p >= 60 ? 'text-yellow-600' : 'text-red-500';
}

// ── Excel Download Functions ──────────────────────────────────────────────────

// Styles used across sheets
const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { fgColor: { rgb: '4F46E5' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top:    { style: 'thin', color: { rgb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
    left:   { style: 'thin', color: { rgb: 'CCCCCC' } },
    right:  { style: 'thin', color: { rgb: 'CCCCCC' } },
  },
};

const SUBHEADER_STYLE = {
  font: { bold: true, sz: 10 },
  fill: { fgColor: { rgb: 'EEF2FF' }, patternType: 'solid' },
  alignment: { horizontal: 'center', vertical: 'center' },
};

function applyStyle(ws: XLSX.WorkSheet, cellRef: string, style: any) {
  if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
  ws[cellRef].s = style;
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// helper used in download functions
function getFirstAptAttemptsForUser(attempts: AptitudeAttempt[], userName: string): AptitudeAttempt[] {
  const userAttempts = attempts.filter(a => a.userName === userName);
  const map = new Map<string, AptitudeAttempt>();
  [...userAttempts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach(a => { if (!map.has(a.topic)) map.set(a.topic, a); });
  return Array.from(map.values());
}

// ── Download: Full Class Report ───────────────────────────────────────────────
function downloadClassReport(
  students: any[],
  aptAttempts: AptitudeAttempt[]
) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Class Overview ──────────────────────────────────────────────────
  const overviewRows: any[][] = [
    ['SRM Study Buddy — Student Performance Report'],
    [`Generated on: ${format(new Date(), 'PPP p')}`],
    [],
    ['#', 'Student Name', 'Email', 'Role', 'Exam 1st Attempt (%)', 'Aptitude Avg (%)', 'Overall Status'],
  ];

  students.forEach((student, idx) => {
    const sFirstApt = getFirstAptAttemptsForUser(aptAttempts, student.name);
    const sApt      = aptAttempts.filter(a => a.userName === student.name);
    const examAvg   = sFirstApt.length ? Math.round(sFirstApt.reduce((a, e) => a + e.percentage, 0) / sFirstApt.length) : null;
    const aptAvg    = sApt.length ? Math.round(sApt.reduce((a, e) => a + e.percentage, 0) / sApt.length) : null;

    // Overall status based on available data
    const scores = [examAvg, aptAvg].filter(s => s !== null) as number[];
    const overall = scores.length === 0 ? 'No Data' : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const status  = typeof overall === 'number'
      ? overall >= 80 ? 'Excellent' : overall >= 60 ? 'Satisfactory' : 'Needs Improvement'
      : 'No Data';

    overviewRows.push([
      idx + 1,
      student.name,
      student.email,
      student.role,
      examAvg !== null ? examAvg : 'Not Taken',
      aptAvg  !== null ? aptAvg  : 'Not Taken',
      status,
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(overviewRows);
  ws1['A1'] = { t: 's', v: 'SRM Study Buddy — Student Performance Report', s: { font: { bold: true, sz: 14, color: { rgb: '4F46E5' } } } };
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  setColWidths(ws1, [4, 22, 28, 10, 22, 16, 20]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Class Overview');

  // ── Sheet 2: Aptitude Results ─────────────────────────────────────────────
  const aptRows: any[][] = [
    ['Student Name', 'Topic', 'Score', 'Total', 'Percentage (%)', 'Time Taken', 'Date'],
  ];
  aptAttempts.forEach(a => {
    aptRows.push([
      a.userName,
      a.topic,
      a.score,
      a.total,
      Math.round(a.percentage),
      fmt(a.timeTaken),
      format(new Date(a.date), 'PP'),
    ]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(aptRows);
  setColWidths(ws2, [22, 30, 8, 8, 16, 12, 14]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Aptitude Arena Results');

  // Save
  const fileName = `SRM_StudyBuddy_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ── Download: Single Student Report ──────────────────────────────────────────
function downloadStudentReport(
  student: any,
  aptAttempts: AptitudeAttempt[]
) {
  const wb = XLSX.utils.book_new();
  const selApt     = aptAttempts.filter(a => a.userName === student.name);
  const selFirstApt = getFirstAptAttemptsForUser(aptAttempts, student.name);

  // ── Sheet 1: Student Summary ──────────────────────────────────────────────
  const examAvg = selFirstApt.length ? Math.round(selFirstApt.reduce((a, e) => a + e.percentage, 0) / selFirstApt.length) : null;
  const aptAvg  = selApt.length      ? Math.round(selApt.reduce((a, e) => a + e.percentage, 0) / selApt.length)           : null;

  const summaryRows = [
    [`Student Report — ${student.name}`],
    [`Email: ${student.email}`],
    [`Report Generated: ${format(new Date(), 'PPP p')}`],
    [],
    ['Module', 'Performance', 'Details'],
    ['Exam (Aptitude 1st Attempt)', examAvg !== null ? `${examAvg}% (1st attempt avg)` : 'Not taken', `${selFirstApt.length} topic(s)`],
    ['Aptitude Arena',              aptAvg  !== null ? `${aptAvg}% average` : 'Not taken',             `${selApt.length} total test(s)`],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1['A1'] = { t: 's', v: `Student Report — ${student.name}`, s: { font: { bold: true, sz: 14, color: { rgb: '4F46E5' } } } };
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
  ];
  setColWidths(ws1, [22, 30, 35]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // ── Sheet 2: Aptitude Attempts ─────────────────────────────────────────────
  if (selApt.length > 0) {
    const aptRows: any[][] = [
      [`Aptitude Arena Results — ${student.name}`],
      [],
      ['Topic', 'Score', 'Total', 'Percentage (%)', 'Time Taken', 'Date'],
    ];
    selApt.forEach(a => {
      aptRows.push([
        a.topic, a.score, a.total,
        Math.round(a.percentage), fmt(a.timeTaken),
        format(new Date(a.date), 'PP'),
      ]);
    });

    // Question-level detail
    aptRows.push([], ['── Detailed Question Analysis ──']);
    selApt.forEach((a, ai) => {
      aptRows.push([]);
      aptRows.push([`Attempt ${ai + 1}: ${a.topic} — ${format(new Date(a.date), 'PP')} — Score: ${a.score}/${a.total} (${Math.round(a.percentage)}%)`]);
      aptRows.push(['Q#', 'Question', 'Sub-Topic', 'Student Answer', 'Correct Answer', 'Result']);
      a.questions?.forEach((q: any, qi: number) => {
        const ua       = a.answers[qi];
        const correct  = a.correctAnswers[qi];
        const isRight  = ua === correct;
        const isSkip   = ua === -1;
        aptRows.push([
          qi + 1,
          q.question,
          q.topic ?? '',
          isSkip ? 'Skipped' : q.options?.[ua] ?? `Option ${ua + 1}`,
          q.options?.[correct] ?? `Option ${correct + 1}`,
          isSkip ? 'Skipped' : isRight ? 'Correct ✓' : 'Wrong ✗',
        ]);
      });
    });

    const ws3 = XLSX.utils.aoa_to_sheet(aptRows);
    setColWidths(ws3, [30, 8, 8, 16, 12, 14]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Aptitude Results');
  }

  // Save
  const safeN   = student.name.replace(/[^a-z0-9]/gi, '_');
  const fileName = `SRM_Report_${safeN}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [students, setStudents]               = useState<any[]>([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [filterProgram, setFilterProgram]     = useState('');
  const [filterYear, setFilterYear]           = useState('');
  const [filterSection, setFilterSection]     = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [feedbackMsg, setFeedbackMsg]         = useState('');
  const [sendingFb, setSendingFb]             = useState(false);
  const [downloading, setDownloading]         = useState(false);
  const [codingTests, setCodingTests]         = useState<any[]>([]);
  const [codingResults, setCodingResults]     = useState<Record<string, any[]>>({});
  const [codingLoading, setCodingLoading]     = useState(true);
  const [expandedTestId, setExpandedTestId]   = useState<string | null>(null);
  const [perf, setPerf]                       = useState<any>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { db } = await import('@/lib/mock-db');
        const allUsers    = await db.getUsers();
        const studentList = allUsers.filter((u: any) => u.role === 'student');
        const enriched    = await Promise.all(studentList.map(async (s: any) => {
          const uid = s._id || s.id;
          if (!uid) return s;
          const [sessions, quizzes, logs, coding, speech, feedback] = await Promise.all([
            db.getStudySessions(uid), db.getQuizResults(uid), db.getStudyLogs(uid),
            db.getCodingSubmissions(uid), db.getCommunicationHistory(uid), db.getTeacherFeedback(uid),
          ]);

          const quizAvg = quizzes.length
            ? Math.round(quizzes.reduce((a: number, q: any) => a + (q.score / q.total), 0) / quizzes.length * 100) : 0;
          return { ...s, sessions, quizzes, logs, coding, speech, feedback, quizAvg };
        }));
        setStudents(enriched);
      } catch (e) { console.error(e); }
    })();

    (async () => {
      try {
        setCodingLoading(true);
        const teacher = getCurrentUser() as any;
        const teacherId = teacher?._id || teacher?.id;
        if (!teacherId) return;
        const res = await fetch(`/api/coding-tests?teacherId=${teacherId}`);
        const data = await res.json();
        const tests = Array.isArray(data) ? data : [];
        setCodingTests(tests);
        const resultsMap: Record<string, any[]> = {};
        await Promise.all(tests.map(async (t: any) => {
          const r = await fetch(`/api/coding-tests/${t._id}/results`);
          const subs = await r.json();
          resultsMap[t._id] = Array.isArray(subs) ? subs : [];
        }));
        setCodingResults(resultsMap);
      } catch (e) { console.error(e); }
      finally { setCodingLoading(false); }
    })();

    (async () => {
      try {
        const teacher = getCurrentUser() as any;
        const teacherId = teacher?._id || teacher?.id;
        if (!teacherId) return;
        const res = await fetch(`/api/analytics/performance?teacherId=${teacherId}`);
        setPerf(await res.json());
      } catch (e) { console.error(e); }
    })();
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const programs  = [...new Set(students.map(s => s.program).filter(Boolean))].sort();
  const years     = [...new Set(students.map(s => String(s.year)).filter(Boolean))].sort();
  const sections  = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase();
    if (q && !s.name?.toLowerCase().includes(q) && !s.email?.toLowerCase().includes(q)) return false;
    if (filterProgram && s.program !== filterProgram) return false;
    if (filterYear    && String(s.year) !== filterYear) return false;
    if (filterSection && s.section !== filterSection) return false;
    return true;
  });
  const hasFilters = searchQuery || filterProgram || filterYear || filterSection;

  // ── Download handlers ─────────────────────────────────────────────────────
  const handleDownloadClass = () => {
    setDownloading(true);
    try {
      downloadClassReport(students, []);
      toast({ title: 'Class report downloaded', description: 'Check your Downloads folder.' });
    } catch (e) {
      toast({ title: 'Download failed', variant: 'destructive' });
    } finally { setDownloading(false); }
  };

  const handleDownloadStudent = (student: any) => {
    try {
      downloadStudentReport(student, []);
      toast({ title: `${student.name}'s report downloaded` });
    } catch (e) {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  // ── Send feedback ─────────────────────────────────────────────────────────
  const sendFeedback = async () => {
    if (!selectedStudent || !feedbackMsg.trim()) return;
    setSendingFb(true);
    try {
      const teacher = getCurrentUser();
      if (!teacher) return;
      const { db } = await import('@/lib/mock-db');
      await db.createTeacherFeedback({
        teacherId: (teacher as any)._id || (teacher as any).id,
        studentId: selectedStudent._id || selectedStudent.id,
        message:   feedbackMsg,
        date:      new Date().toISOString(),
        read:      false,
      });
      toast({ title: 'Feedback sent', description: `Sent to ${selectedStudent.name}` });
      setFeedbackMsg('');
    } catch {
      toast({ title: 'Error sending feedback', variant: 'destructive' });
    } finally { setSendingFb(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-headline font-bold text-primary">Student Performance Hub</h1>
          <p className="text-muted-foreground">Evaluate students across all modules and send targeted feedback.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Class-level download */}
          <Button
            onClick={handleDownloadClass}
            disabled={downloading || students.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {downloading ? 'Generating…' : 'Download Class Report'}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Students',   value: students.length,                        icon: Users,    color: 'text-blue-600 bg-blue-50' },
          { label: 'Exam Pass Rate',   value: `${perf?.overview?.examPassRate ?? 0}%`, icon: LineChart, color: 'text-rose-600 bg-rose-50' },
          { label: 'Coding Tests',     value: codingTests.length,                     icon: Code2,    color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Coding Submissions', value: Object.values(codingResults).reduce((s, r) => s + r.length, 0), icon: BarChart2, color: 'text-indigo-600 bg-indigo-50' },
        ].map(s => (
          <Card key={s.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-3 pt-5 pb-5">
              <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="font-headline flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Class Overview
              {hasFilters && (
                <Badge className="ml-1 bg-indigo-100 text-indigo-700 text-xs font-normal">
                  {filtered.length} of {students.length}
                </Badge>
              )}
            </CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-slate-500"
                onClick={() => { setSearchQuery(''); setFilterProgram(''); setFilterYear(''); setFilterSection(''); }}>
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>
          <CardDescription>
            Click <strong>View & Feedback</strong> to see full performance and send feedback.
            Exam scores show <strong>first attempt only</strong> for fair evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search name or email…" className="pl-9 h-9 rounded-xl text-sm"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterProgram || '__all__'} onValueChange={v => setFilterProgram(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9 w-36 rounded-xl text-sm">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Programs</SelectItem>
                {programs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterYear || '__all__'} onValueChange={v => setFilterYear(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9 w-28 rounded-xl text-sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Years</SelectItem>
                {years.map(y => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSection || '__all__'} onValueChange={v => setFilterSection(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9 w-32 rounded-xl text-sm">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Sections</SelectItem>
                {sections.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Batch / Section</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No students found.</TableCell>
                </TableRow>
              ) : filtered.map(student => {
                return (
                  <TableRow key={student._id || student.id}>
                    <TableCell>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.program && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{student.program}</Badge>}
                        {student.year    && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Y{student.year}</Badge>}
                        {student.section && <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">§{student.section}</Badge>}
                        {!student.program && !student.year && !student.section && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm"
                          onClick={() => { setSelectedStudent(student); setFeedbackMsg(''); }}>
                          <Eye className="h-4 w-4 mr-1" />View
                        </Button>
                        <Button variant="outline" size="sm"
                          onClick={() => handleDownloadStudent(student)}
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          title="Download student Excel report">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* AI Test Progress Comparison */}
      <AITestComparison />

      {/* Coding Test Reports */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Code2 className="h-5 w-5" /> Coding Test Reports
          </CardTitle>
          <CardDescription>
            Detailed results for the coding tests you have scheduled. Click a test to view per-student scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codingLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
          ) : codingTests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No coding tests scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {codingTests.map(t => {
                const totalMarks = (t.problems || []).reduce((s: number, p: any) => s + (p.marks || 0), 0);
                const subs = codingResults[t._id] || [];
                const isOpen = expandedTestId === t._id;
                return (
                  <div key={t._id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => setExpandedTestId(isOpen ? null : t._id)}
                      className="w-full flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">{t.title}</p>
                        <Badge variant="outline" className="text-[10px]">{(t.problems || []).length} problem(s)</Badge>
                        <Badge variant="outline" className="text-[10px]">Total: {totalMarks} marks</Badge>
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700">{subs.length} submission(s)</Badge>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="p-3 space-y-2">
                        {subs.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No students have submitted this test yet.</p>
                        ) : (
                          subs
                            .slice()
                            .sort((a: any, b: any) => b.obtainedMarks - a.obtainedMarks)
                            .map((r: any) => (
                              <div key={r._id} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm text-slate-900">{r.studentName}</p>
                                  <span className="text-xs text-slate-400">{r.rollNumber}</span>
                                  {r.section && <Badge variant="outline" className="text-[10px]">{r.program} Y{r.year} §{r.section}</Badge>}
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                    {r.obtainedMarks}/{r.totalMarks} marks
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                                  {(r.answers || []).map((a: any) => {
                                    const p = (t.problems || []).find((x: any) => x.problemId === a.problemId);
                                    return (
                                      <span key={a.problemId} className="px-2 py-0.5 rounded-full bg-white border border-slate-200">
                                        {p?.title || 'Problem'}: {a.marksAwarded}/{p?.marks ?? 0} ({a.passedCount}/{a.totalCount} tests)
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Student Detail Dialog ── */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />{selectedStudent?.name}
                </DialogTitle>
                <DialogDescription>{selectedStudent?.email}</DialogDescription>
              </div>
              {/* Download from inside dialog */}
              <Button variant="outline" size="sm"
                onClick={() => selectedStudent && handleDownloadStudent(selectedStudent)}
                className="text-green-700 border-green-300 hover:bg-green-50 rounded-xl flex items-center gap-2">
                <Download className="h-4 w-4" /> Download Report
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1" ref={scrollRef}>
            {/* Feedback */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <Label className="text-base font-bold">Send Feedback to {selectedStudent?.name}</Label>
              </div>
              <p className="text-xs text-slate-500">Review their performance above, then write specific feedback. This appears as a notification on their dashboard.</p>
              <Textarea
                placeholder={`e.g. "Good improvement! First attempt on Data Structures was 45% — focus on linked list deletions. Aptitude in Time & Work (60%) needs more formula-based practice."`}
                value={feedbackMsg}
                onChange={e => setFeedbackMsg(e.target.value)}
                className="min-h-[110px] rounded-xl"
              />
              {selectedStudent?.feedback?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Previously sent</p>
                  {selectedStudent.feedback.slice(0, 3).map((f: any) => (
                    <div key={f._id || f.id} className="p-3 bg-slate-50 rounded-xl border text-xs text-slate-600">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-slate-700">You</span>
                        <span className="text-slate-400">{new Date(f.date).toLocaleDateString()}</span>
                      </div>
                      {f.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 shrink-0 border-t mt-2">
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>Close</Button>
            <Button onClick={sendFeedback} disabled={!feedbackMsg.trim() || sendingFb}
              className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {sendingFb ? 'Sending…' : <><Send className="h-4 w-4 mr-2" />Send Feedback</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}