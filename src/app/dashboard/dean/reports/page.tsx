'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/mock-db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
  Download, FileSpreadsheet, Loader2, Users, BarChart2,
  Brain, Target, GraduationCap, RefreshCw, CheckCircle2,
  FileText, TrendingUp,
} from 'lucide-react';

const ALLOWED = ['dean', 'deputy_dean', 'pro_vc', 'hod', 'admin'];

interface ReportCard {
  id:          string;
  title:       string;
  description: string;
  icon:        typeof Download;
  color:       string;
  generate:    (data: any) => void;
}

export default function ReportsPage() {
  const router   = useRouter();
  const { toast } = useToast();

  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState<string | null>(null);
  const [summary,     setSummary]     = useState<any>(null);
  const [programData, setProgramData] = useState<any[]>([]);
  const [heatmap,     setHeatmap]     = useState<any[]>([]);
  const [aspirations, setAspirations] = useState<any[]>([]);
  const [training,    setTraining]    = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allAssessments, setAllAssessments] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, h, a, t, students, assessments] = await Promise.all([
        fetch('/api/analytics?type=summary').then(r => r.json()),
        fetch('/api/analytics?type=program-wise').then(r => r.json()),
        fetch('/api/analytics?type=skill-heatmap').then(r => r.json()),
        fetch('/api/analytics?type=career-aspirations').then(r => r.json()),
        fetch('/api/analytics?type=training-demand').then(r => r.json()),
        fetch('/api/users?role=student').then(r => r.json()),
        fetch('/api/analytics').then(r => r.json()),
      ]);
      setSummary(s);
      setProgramData(Array.isArray(p) ? p : []);
      setHeatmap(Array.isArray(h) ? h : []);
      setAspirations(Array.isArray(a) ? a : []);
      setTraining(Array.isArray(t) ? t : []);
      setAllStudents(Array.isArray(students) ? students : []);
      setAllAssessments(Array.isArray(assessments) ? assessments : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const user = getCurrentUser() as any;
    if (!user || !ALLOWED.includes(user.role)) { router.push('/dashboard'); return; }
    load();
  }, []);

  // Sanitise a row so every cell is a string/number, never undefined/null/object
  const clean = (row: any[]) =>
    row.map(cell => (cell === null || cell === undefined) ? '' : cell);

  const dl = (wb: any, filename: string) => {
    // type:'binary' returns a binary string — safest across xlsx versions
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const buf   = new ArrayBuffer(wbout.length);
    const view  = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xff;
    }
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Report downloaded!' });
  };

  // ── Report generators ──────────────────────────────────────────────────────

  const genExecutiveSummary = () => {
    const wb   = XLSX.utils.book_new();
    const rate = allStudents.length
      ? Math.round((allAssessments.length / allStudents.length) * 100) : 0;
    const rows = [
      clean(['SRM Study Buddy — Executive Summary Report']),
      clean([`Generated: ${format(new Date(), 'PPP p')}`]),
      clean([]),
      clean(['METRIC', 'VALUE']),
      clean(['Total Registered Students',   allStudents.length]),
      clean(['Self-Assessments Completed',  allAssessments.length]),
      clean(['Completion Rate (%)',          rate]),
      clean(['Average CGPA',                summary?.avgCGPA  ?? 0]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Executive Summary');
    dl(wb, 'Executive_Summary');
  };

  const genProgramReport = () => {
    const wb   = XLSX.utils.book_new();
    const rows = [
      clean(['Program-wise Analytics Report']),
      clean([`Generated: ${format(new Date(), 'PPP p')}`]),
      clean([]),
      clean(['Program', 'Students', 'Avg CGPA', 'Avg Communication', 'Avg Technical', 'Avg Leadership']),
      ...programData.map((p: any) => clean([
        p._id,
        p.count,
        +(p.avgCGPA || 0).toFixed(2),
        +(p.avgComm  || 0).toFixed(2),
        +(p.avgTech  || 0).toFixed(2),
        +(p.avgLead  || 0).toFixed(2),
      ])),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Program Analytics');

    const hRows = [
      clean(['Skill Heatmap (Average Score out of 5)']),
      clean([]),
      clean(['Program', 'Communication', 'Problem Solving', 'Technical', 'Teamwork',
             'Time Mgmt', 'Leadership', 'Critical Thinking', 'Emotional Intell.', 'Industry Ready', 'Students']),
      ...heatmap.map((h: any) => clean([
        h._id,
        +(h.communication         || 0).toFixed(2),
        +(h.problemSolving        || 0).toFixed(2),
        +(h.technical             || 0).toFixed(2),
        +(h.teamwork              || 0).toFixed(2),
        +(h.timeManagement        || 0).toFixed(2),
        +(h.leadership            || 0).toFixed(2),
        +(h.criticalThinking      || 0).toFixed(2),
        +(h.emotionalIntelligence || 0).toFixed(2),
        +(h.industryReadiness     || 0).toFixed(2),
        h.count,
      ])),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hRows), 'Skill Heatmap');
    dl(wb, 'Program_Analytics');
  };

  const genStudentMasterlist = () => {
    const wb = XLSX.utils.book_new();

    const stuRows = [
      clean(['Student Masterlist']),
      clean([`Generated: ${format(new Date(), 'PPP p')}`]),
      clean([]),
      clean(['Name', 'Roll Number', 'Program', 'Year', 'Section', 'Batch', 'Email']),
      ...allStudents.map((s: any) => clean([
        s.name, s.rollNumber, s.program, s.year, s.section, s.batch, s.email,
      ])),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stuRows), 'All Students');

    const assessed = new Set(allAssessments.map((a: any) => a.rollNumber));
    const aRows = [
      clean(['Assessed Students']),
      clean([]),
      clean(['Name', 'Roll Number', 'Program', 'Year', 'Section',
             'CGPA', 'Career Aspiration']),
      ...allAssessments.map((a: any) => clean([
        a.studentName, a.rollNumber,
        a.sectionA?.program,
        a.sectionA?.yearOfStudy,
        a.sectionA?.section,
        a.sectionA?.cgpa,
        a.sectionA?.careerAspiration,
      ])),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aRows), 'With Assessment');

    const notAssessed = allStudents.filter((s: any) => !assessed.has(s.rollNumber));
    const naRows = [
      clean(['Students Yet to Complete Assessment']),
      clean([]),
      clean(['Name', 'Roll Number', 'Program', 'Year', 'Section']),
      ...notAssessed.map((s: any) => clean([s.name, s.rollNumber, s.program, s.year, s.section])),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(naRows), 'Pending Assessment');
    dl(wb, 'Student_Masterlist');
  };

  const genCareerReport = () => {
    const wb   = XLSX.utils.book_new();
    const rows = [
      clean(['Career Aspirations & Training Demand Report']),
      clean([`Generated: ${format(new Date(), 'PPP p')}`]),
      clean([]),
      clean(['CAREER ASPIRATIONS']),
      clean(['Career Path', 'Student Count']),
      ...aspirations.map((a: any) => clean([a._id, a.count])),
      clean([]),
      clean(['TOP TRAINING DEMANDS']),
      clean(['Training Type', 'Demand Count']),
      ...training.map((t: any) => clean([t._id, t.count])),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Career & Training');
    dl(wb, 'Career_Training_Report');
  };

  // ── Report cards config ──────────────────────────────────────────────────────

  const REPORTS: ReportCard[] = [
    {
      id: 'executive',
      title: 'Executive Summary',
      description: 'High-level KPIs — total students, completion rate, average CGPA.',
      icon: FileText,
      color: 'from-blue-500 to-indigo-600',
      generate: genExecutiveSummary,
    },
    {
      id: 'program',
      title: 'Program Analytics',
      description: 'Skill heatmap with averages for all 9 competencies, by program.',
      icon: BarChart2,
      color: 'from-violet-500 to-purple-600',
      generate: genProgramReport,
    },
    {
      id: 'students',
      title: 'Student Masterlist',
      description: 'Full student list (3 sheets): all students, those with completed assessments, and those pending.',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      generate: genStudentMasterlist,
    },
    {
      id: 'career',
      title: 'Career & Training Report',
      description: 'Career aspiration distribution and top training demands across all programs.',
      icon: Target,
      color: 'from-amber-500 to-orange-600',
      generate: genCareerReport,
    },
  ];

  const handleGenerate = async (report: ReportCard) => {
    setGenerating(report.id);
    try {
      report.generate(null);
    } catch (e: any) {
      toast({ title: 'Failed to generate report', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  );

  const totalStudents    = allStudents.length;
  const totalAssessed    = allAssessments.length;
  const completionRate   = totalStudents ? Math.round((totalAssessed / totalStudents) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
            <Download className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-500 text-sm">Download institution-wide reports as Excel spreadsheets</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5 rounded-xl">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students',    value: totalStudents,    icon: Users,        color: 'bg-blue-50 text-blue-600' },
          { label: 'Assessments Done',  value: totalAssessed,    icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
          { label: 'Completion Rate',   value: `${completionRate}%`, icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Programs',          value: programData.length, icon: GraduationCap, color: 'bg-violet-50 text-violet-600' },
        ].map(s => (
          <Card key={s.label} className="border-slate-200 shadow-sm">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Available Reports (Excel .xlsx)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {REPORTS.map(report => {
            const Icon = report.icon;
            const busy = generating === report.id;
            return (
              <Card key={report.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${report.color} text-white shadow flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{report.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{report.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGenerate(report)}
                    disabled={!!generating || loading}
                    className="w-full gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white h-9 text-sm"
                  >
                    {busy
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                      : <><Download className="h-4 w-4" /> Download</>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <FileSpreadsheet className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          All reports are generated from live data and downloaded directly to your device as Excel (.xlsx) files.
          No data is sent to any external server.
        </p>
      </div>
    </div>
  );
}
