'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/mock-db';
import { GraduationCap, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const PROGRAMS  = ['BCA','BCA(DS)','BCom','MSc(ADS)','MCom','MCA','MCA GenAI'];
const YEARS     = [1, 2, 3];
const SECTORS   = ['IT','Banking & Finance','Government Jobs','Entrepreneurship'];
const ASPIRATIONS = ['Higher Studies','Job','Entrepreneurship'];
const TRAINING  = [
  'Resume Writing & Interview Skills',
  'Spoken English & Communication',
  'Coding & Technical Training',
  'Industry Internships',
  'Entrepreneurship Development',
  'Leadership & Soft Skills',
  'Others',
];
const MODES = ['Online','Offline','Hybrid','No Preference'];

const SKILLS = [
  { key: 'communicationSkills',   label: 'Communication Skills',       desc: 'Ability to express ideas clearly, both verbally and in writing' },
  { key: 'problemSolving',        label: 'Problem Solving',             desc: 'Ability to analyse situations and find effective solutions' },
  { key: 'technicalKnowledge',    label: 'Technical / Domain Knowledge',desc: 'Subject matter expertise relevant to your field of study' },
  { key: 'teamworkCollaboration', label: 'Teamwork & Collaboration',    desc: 'Ability to work effectively with others toward a shared goal' },
  { key: 'timeManagement',        label: 'Time Management',             desc: 'Ability to plan and prioritize tasks to meet deadlines' },
  { key: 'leadershipSkills',      label: 'Leadership Skills',           desc: 'Ability to guide and motivate others to achieve objectives' },
  { key: 'criticalThinking',      label: 'Critical Thinking',           desc: 'Ability to evaluate information and form reasoned judgments' },
  { key: 'emotionalIntelligence', label: 'Emotional Intelligence',      desc: 'Awareness and management of your own and others\' emotions' },
  { key: 'industryReadiness',     label: 'Industry Readiness',          desc: 'How prepared you feel to enter the professional world' },
];

const RATING_LABELS = ['','Very Low','Low','Moderate','High','Very High'];
const RATING_COLORS = ['','bg-red-500','bg-orange-400','bg-yellow-400','bg-blue-500','bg-green-500'];
const STEP_LABELS   = ['Welcome','Academic Profile','Skill Self-Assessment','Career Preferences','Training Needs','Open Questions','Review & Submit'];
const TOTAL_STEPS   = 7;

// ── Sub-component: Skill Rating ────────────────────────────────────────────────
function SkillRating({ skill, value, onChange }: { skill: any; value: number; onChange: (v: number) => void }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{skill.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{skill.desc}</p>
        </div>
        {value > 0 && (
          <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-white text-xs font-bold ${RATING_COLORS[value]}`}>
            {RATING_LABELS[value]}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-150
              ${value === n
                ? `${RATING_COLORS[n]} text-white border-transparent shadow-md scale-105`
                : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50'
              }`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
        <span>Very Low</span><span>Very High</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router  = useRouter();
  const [step, setStep]       = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [userId, setUserId]   = useState('');

  // Form state
  const [sA, setSA] = useState({ program: '', yearOfStudy: 0, cgpa: '', careerAspiration: '' });
  const [sB, setSB] = useState<Record<string, number>>({});
  const [sC, setSC] = useState({ preferredSector: '' });
  const [sE, setSE] = useState({ trainingNeeds: [] as string[], trainingMode: '' });
  const [sF, setSF] = useState({ skillGapOpinion: '', institutionSuggestion: '' });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { router.push('/auth'); return; }
    if ((user as any).selfAssessmentCompleted) { router.push('/dashboard'); return; }
    setUserId((user as any)._id || (user as any).id || '');
  }, [router]);

  const updateSB = (key: string, val: number) => setSB(prev => ({ ...prev, [key]: val }));
  const toggleTraining = (t: string) => {
    setSE(prev => ({
      ...prev,
      trainingNeeds: prev.trainingNeeds.includes(t)
        ? prev.trainingNeeds.filter(x => x !== t)
        : [...prev.trainingNeeds, t],
    }));
  };

  // Step validation
  const canProceed = () => {
    if (step === 2) return sA.program && sA.yearOfStudy && sA.cgpa && sA.careerAspiration;
    if (step === 3) return SKILLS.every(s => (sB[s.key] || 0) > 0);
    if (step === 4) return sC.preferredSector;
    if (step === 5) return sE.trainingNeeds.length > 0 && sE.trainingMode;
    if (step === 6) return sF.skillGapOpinion.trim().length >= 20 && sF.institutionSuggestion.trim().length >= 20;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/self-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sectionA: { ...sA, yearOfStudy: Number(sA.yearOfStudy), cgpa: parseFloat(sA.cgpa) },
          sectionB: sB,
          sectionC: sC,
          sectionE: sE,
          sectionF: sF,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      // Update local user state
      const user = getCurrentUser();
      if (user) {
        const updated = { ...user, selfAssessmentCompleted: true };
        localStorage.setItem('srm_current_user', JSON.stringify(updated));
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-slate-900">Student Self-Assessment</h1>
          <p className="text-slate-500 text-sm mt-1">Complete this form to unlock your dashboard. This takes about 5 minutes.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-indigo-600">{STEP_LABELS[step - 1]}</span>
            <span className="text-xs text-slate-400">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            {STEP_LABELS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i + 1 <= step ? 'bg-indigo-500' : 'bg-slate-300'}`} />
            ))}
          </div>
        </div>

        <Card className="border-slate-200 shadow-xl">

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-indigo-700">Welcome! 👋</CardTitle>
                <CardDescription className="text-base mt-2 text-slate-600">
                  Before accessing the platform, please complete this Self-Assessment Form.
                  Your responses help us understand your academic profile and design better support for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: '📋', title: 'What this covers', desc: 'Academic profile, skill levels, career preferences, training needs, and your suggestions' },
                  { icon: '🔒', title: 'Confidentiality', desc: 'Your responses are used only for institutional analytics and are never shared with third parties' },
                  { icon: '⏱️', title: 'Time required', desc: 'Approximately 5–8 minutes. You cannot pause and resume, so complete it in one sitting' },
                  { icon: '✅', title: 'One-time submission', desc: 'You can submit this form only once. Answer honestly for accurate results' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </>
          )}

          {/* ── Step 2: Section A — Academic Profile ── */}
          {step === 2 && (
            <>
              <CardHeader>
                <Badge className="w-fit mb-2 bg-indigo-100 text-indigo-700">Section A</Badge>
                <CardTitle className="font-headline text-xl">Academic Profile</CardTitle>
                <CardDescription>Tell us about your academic background.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Program */}
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Program of Study <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROGRAMS.map(p => (
                      <button key={p} type="button" onClick={() => setSA(s => ({ ...s, program: p }))}
                        className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left
                          ${sA.program === p ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Year of Study <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    {YEARS.map(y => (
                      <button key={y} type="button" onClick={() => setSA(s => ({ ...s, yearOfStudy: y }))}
                        className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                          ${sA.yearOfStudy === y ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                        {y === 1 ? '1st Year' : y === 2 ? '2nd Year' : '3rd Year'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CGPA */}
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">CGPA <span className="text-red-500">*</span></Label>
                  <Input type="number" min="0" max="10" step="0.01" placeholder="e.g. 7.85"
                    value={sA.cgpa}
                    onChange={e => setSA(s => ({ ...s, cgpa: e.target.value }))}
                    className="rounded-xl" />
                  <p className="text-xs text-slate-400">Enter your current CGPA (0.00 – 10.00)</p>
                </div>

                {/* Career Aspiration */}
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Career Aspiration <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPIRATIONS.map(a => (
                      <button key={a} type="button" onClick={() => setSA(s => ({ ...s, careerAspiration: a }))}
                        className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                          ${sA.careerAspiration === a ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 3: Section B — Skill Self-Assessment ── */}
          {step === 3 && (
            <>
              <CardHeader>
                <Badge className="w-fit mb-2 bg-violet-100 text-violet-700">Section B</Badge>
                <CardTitle className="font-headline text-xl">Skill Self-Assessment</CardTitle>
                <CardDescription>Rate yourself honestly on each skill from 1 (Very Low) to 5 (Very High). All fields are required.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {SKILLS.map(skill => (
                  <SkillRating key={skill.key} skill={skill}
                    value={sB[skill.key] || 0}
                    onChange={val => updateSB(skill.key, val)} />
                ))}
              </CardContent>
            </>
          )}

          {/* ── Step 4: Section C ── */}
          {step === 4 && (
            <>
              <CardHeader>
                <div className="flex gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-700">Section C</Badge>
                </div>
                <CardTitle className="font-headline text-xl">Career Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Preferred Career Sector <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-slate-500">Select only one sector you are most interested in.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTORS.map(s => (
                      <button key={s} type="button" onClick={() => setSC({ preferredSector: s })}
                        className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                          ${sC.preferredSector === s ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 5: Section E — Training Needs ── */}
          {step === 5 && (
            <>
              <CardHeader>
                <Badge className="w-fit mb-2 bg-orange-100 text-orange-700">Section E</Badge>
                <CardTitle className="font-headline text-xl">Training & Development Needs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">
                    What type of training would you like to receive? <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500">Select all that apply.</p>
                  <div className="space-y-2">
                    {TRAINING.map(t => (
                      <button key={t} type="button" onClick={() => toggleTraining(t)}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm transition-all
                          ${sE.trainingNeeds.includes(t) ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-200 text-slate-600 hover:border-orange-300'}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${sE.trainingNeeds.includes(t) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                          {sE.trainingNeeds.includes(t) && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Preferred Training Mode <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODES.map(m => (
                      <button key={m} type="button" onClick={() => setSE(prev => ({ ...prev, trainingMode: m }))}
                        className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                          ${sE.trainingMode === m ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-200 text-slate-600 hover:border-orange-300'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 6: Section F — Open Questions ── */}
          {step === 6 && (
            <>
              <CardHeader>
                <Badge className="w-fit mb-2 bg-rose-100 text-rose-700">Section F</Badge>
                <CardTitle className="font-headline text-xl">Open-Ended Questions</CardTitle>
                <CardDescription>Share your genuine thoughts. Minimum 20 characters per answer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">
                    What are the key skill gaps that need to be addressed to improve employability? <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="In my opinion, students at our institution face challenges in areas such as..."
                    value={sF.skillGapOpinion}
                    onChange={e => setSF(p => ({ ...p, skillGapOpinion: e.target.value }))}
                    className="min-h-[120px] rounded-xl"
                    maxLength={1000}
                  />
                  <p className="text-xs text-slate-400 text-right">{sF.skillGapOpinion.length}/1000 · min 20 chars</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">
                    What support or changes would you suggest your institution make to enhance student employability? <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="I would suggest the institution consider..."
                    value={sF.institutionSuggestion}
                    onChange={e => setSF(p => ({ ...p, institutionSuggestion: e.target.value }))}
                    className="min-h-[120px] rounded-xl"
                    maxLength={1000}
                  />
                  <p className="text-xs text-slate-400 text-right">{sF.institutionSuggestion.length}/1000 · min 20 chars</p>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step 7: Review & Submit ── */}
          {step === 7 && (
            <>
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />Review & Submit
                </CardTitle>
                <CardDescription>Review your responses before submitting. You cannot edit after submission.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[55vh] overflow-y-auto">
                {[
                  { label: 'Program', value: sA.program },
                  { label: 'Year', value: `${sA.yearOfStudy}${sA.yearOfStudy === 1 ? 'st' : sA.yearOfStudy === 2 ? 'nd' : 'rd'} Year` },
                  { label: 'CGPA', value: sA.cgpa },
                  { label: 'Career Aspiration', value: sA.careerAspiration },
                  { label: 'Preferred Sector', value: sC.preferredSector },
                  { label: 'Training Mode', value: sE.trainingMode },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">{r.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{r.value}</span>
                  </div>
                ))}

                <div className="py-2 border-b border-slate-100">
                  <p className="text-sm text-slate-500 mb-2">Skill Ratings</p>
                  <div className="grid grid-cols-2 gap-1">
                    {SKILLS.map(s => (
                      <div key={s.key} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 truncate">{s.label}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded font-bold text-white text-[10px] ${RATING_COLORS[sB[s.key] || 0]}`}>
                          {sB[s.key] || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="py-2">
                  <p className="text-sm text-slate-500 mb-1">Training Needs</p>
                  <div className="flex flex-wrap gap-1">
                    {sE.trainingNeeds.map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="rounded-xl">
              <ChevronLeft className="h-4 w-4 mr-1" />Previous
            </Button>
            {step < TOTAL_STEPS ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}
                className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-8">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {submitting ? 'Submitting…' : 'Submit Assessment'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}