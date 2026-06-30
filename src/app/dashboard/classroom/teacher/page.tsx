'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/mock-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap, Plus, Users, BookOpen, Loader2, Trash2, ArrowRight, ChevronDown, Layers,
} from 'lucide-react';

const PROGRAMS = ['BCA', 'BCA(DS)', 'BCom', 'MSc(ADS)', 'MCom', 'MCA', 'MCA GenAI'];
const YEARS    = [1, 2, 3, 4];

interface Batch {
  _id: string;
  name: string;
  program: string;
  year: number;
  section: string;
  subject: string;
  description: string;
  studentCount: number;
  createdAt: string;
}

export default function TeacherClassroomPage() {
  const router   = useRouter();
  const { toast } = useToast();

  const [batches, setBatches]   = useState<Batch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    name: '', program: 'BCA', year: '1', section: '', description: '',
  });

  const user   = getCurrentUser() as any;
  const userId = user?._id || user?.id;

  const loadBatches = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/classroom/batches?teacherId=${userId}`);
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { loadBatches(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.program || !form.year) return;
    setCreating(true);
    try {
      const res  = await fetch('/api/classroom/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, teacherId: userId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: 'Batch created' });
      setShowForm(false);
      setForm({ name: '', program: 'BCA', year: '1', section: '', description: '' });
      loadBatches();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Group batches by Program → Year → Section for batchwise organization
  const groups = batches.reduce((acc, batch) => {
    const programKey = batch.program || 'Other';
    const yearKey    = `Year ${batch.year}`;
    const sectionKey = batch.section ? `Section ${batch.section}` : 'No Section';
    acc[programKey] ??= {};
    acc[programKey][yearKey] ??= {};
    acc[programKey][yearKey][sectionKey] ??= [];
    acc[programKey][yearKey][sectionKey].push(batch);
    return acc;
  }, {} as Record<string, Record<string, Record<string, Batch[]>>>);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete batch "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/classroom/batches/${id}`, { method: 'DELETE' });
    setBatches(b => b.filter(x => x._id !== id));
    toast({ title: 'Batch deleted' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Classrooms</h1>
            <p className="text-slate-500 text-sm">Manage batches, post announcements, share materials and assignments</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Batch
        </Button>
      </div>

      {/* Batch grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : batches.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <GraduationCap className="h-14 w-14 text-slate-300" />
            <div>
              <p className="font-semibold text-slate-600 text-lg">No classrooms yet</p>
              <p className="text-sm text-slate-400 mt-1">Create a batch to start posting announcements and materials</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 mt-2">
              <Plus className="h-4 w-4" /> Create your first batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([program, years]) => (
            <div key={program} className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleGroup(program)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  <Layers className="h-4 w-4 text-emerald-600" /> {program}
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {Object.values(years).reduce((n, secs) => n + Object.values(secs).reduce((m, b) => m + b.length, 0), 0)} batches
                  </Badge>
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${collapsed.has(program) ? '' : 'rotate-180'}`} />
              </button>

              {!collapsed.has(program) && (
                <div className="p-4 space-y-4 bg-white">
                  {Object.entries(years).sort(([a], [b]) => a.localeCompare(b)).map(([year, sections]) => {
                    const yearKey = `${program}__${year}`;
                    return (
                      <div key={year} className="border border-slate-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleGroup(yearKey)}
                          className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-100 transition-colors"
                        >
                          <span className="font-semibold text-slate-700 text-sm">{year}</span>
                          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${collapsed.has(yearKey) ? '' : 'rotate-180'}`} />
                        </button>

                        {!collapsed.has(yearKey) && (
                          <div className="p-3.5 space-y-4">
                            {Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([section, sectionBatches]) => (
                              <div key={section}>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{section}</p>
                                <div className="flex flex-wrap gap-3">
                                  {sectionBatches.map(batch => (
                                    <Card key={batch._id} className="border-slate-200 shadow-sm hover:shadow-md transition-all group w-full sm:w-[260px]">
                                      <CardContent className="p-3.5 flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow flex-shrink-0">
                                          <BookOpen className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{batch.name}</h3>
                                          {batch.subject && <p className="text-xs text-slate-500 truncate">{batch.subject}</p>}
                                          <span className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                            <Users className="h-3 w-3" /> {batch.studentCount} students
                                          </span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                          <button
                                            onClick={() => handleDelete(batch._id, batch.name)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                          <Button
                                            size="icon"
                                            onClick={() => router.push(`/dashboard/classroom/teacher/${batch._id}`)}
                                            className="rounded-lg h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                                          >
                                            <ArrowRight className="h-3.5 w-3.5" />
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
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create batch dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Batch Name *</Label>
              <Input
                placeholder="e.g. BCA 2023 – Section A"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Program *</Label>
                <Select value={form.program} onValueChange={v => setForm(f => ({ ...f, program: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year *</Label>
                <Select value={form.year} onValueChange={v => setForm(f => ({ ...f, year: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Input placeholder="A / B / C" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input placeholder="Optional" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={creating} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Batch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
