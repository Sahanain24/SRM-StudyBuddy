'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/lib/mock-db';
import { getCommunicationFeedback, CommunicationFeedbackOutput } from '@/ai/flows/student-receives-communication-feedback';
import {
  Mic, MicOff, Loader2, Sparkles, FileText, MessageSquare,
  CheckCircle2, AlertTriangle, RotateCcw, ChevronRight, Lightbulb,
  Star, Volume2, PenLine, Info,
} from 'lucide-react';

// ── Practice prompts ───────────────────────────────────────────────────────────
const PROMPTS = [
  'Tell me about yourself and your background.',
  'Describe a time you solved a difficult problem.',
  'What are your greatest strengths and weaknesses?',
  'Why should we hire you for this role?',
  'Where do you see yourself in five years?',
  'Tell me about a challenging team project you worked on.',
  'How do you handle pressure and tight deadlines?',
  'Describe a situation where you showed leadership.',
  'What motivates you to perform at your best?',
  'Explain a technical concept as if I were a non-technical person.',
];

// ── Score ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r   = 22, circ = 2 * Math.PI * r;
  const pct = (score / 10) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={56} height={56}>
        <circle cx={28} cy={28} r={r} stroke="#e2e8f0" strokeWidth={5} fill="none" />
        <circle cx={28} cy={28} r={r} stroke={color} strokeWidth={5} fill="none"
          strokeDasharray={circ} strokeDashoffset={circ - pct}
          strokeLinecap="round" transform="rotate(-90 28 28)" />
        <text x={28} y={33} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>{score}</text>
      </svg>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── Permission banner ──────────────────────────────────────────────────────────
function PermissionBanner({ status }: { status: 'checking'|'granted'|'denied'|'unavailable'|'unknown' }) {
  const [showSteps, setShowSteps] = useState(false);
  if (status === 'granted') return null;

  return (
    <div className={`rounded-xl border text-sm
      ${status === 'denied' ? 'bg-red-50 border-red-200 text-red-800'
        : status === 'unavailable' ? 'bg-orange-50 border-orange-200 text-orange-800'
        : 'bg-amber-50 border-amber-200 text-amber-800'}`}>

      <div className="flex items-start gap-3 px-4 py-3">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {status === 'denied' && (
            <>
              <p className="font-semibold">Microphone access is blocked</p>
              <p className="text-xs mt-0.5 opacity-80">
                Your browser has blocked microphone access for this site. Follow the steps below to fix it.
              </p>
              <button
                onClick={() => setShowSteps(s => !s)}
                className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80">
                {showSteps ? 'Hide steps ▲' : 'How to fix this ▼'}
              </button>
            </>
          )}
          {status === 'unavailable' && (
            <>
              <p className="font-semibold">Voice input not supported in this browser</p>
              <p className="text-xs mt-0.5 opacity-80">
                Open this page in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> for voice recording.
                Use <strong>Type Instead</strong> below to continue now.
              </p>
            </>
          )}
          {(status === 'checking' || status === 'unknown') && (
            <>
              <p className="font-semibold">Microphone permission needed</p>
              <p className="text-xs mt-0.5 opacity-80">
                When you click the mic button, your browser will ask for permission. Click <strong>Allow</strong>.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Step-by-step fix guide */}
      {status === 'denied' && showSteps && (
        <div className="border-t border-red-200 px-4 py-4 space-y-4 bg-white/60 rounded-b-xl">

          {/* Step 1 — Browser */}
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Step 1 — Unblock in Chrome / Edge</p>
            <ol className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
                Look at your browser's address bar. Click the <strong>🔒 lock icon</strong> (or the <strong>ℹ️ info icon</strong>) on the left side.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
                A menu appears. Find <strong>"Microphone"</strong> and change it from <strong>"Block"</strong> to <strong>"Allow"</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
                Click <strong>"Reload"</strong> when the browser asks, or press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">F5</kbd>.
              </li>
            </ol>
            {/* Visual hint */}
            <div className="mt-3 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-600 flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span className="flex-1 truncate">localhost:3000</span>
              <span className="text-slate-400">← click here</span>
            </div>
          </div>

          {/* Step 2 — Windows settings */}
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Step 2 — If still blocked, check Windows settings</p>
            <ol className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Win + I</kbd> to open <strong>Windows Settings</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
                Go to <strong>Privacy &amp; Security → Microphone</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
                Make sure <strong>"Microphone access"</strong> is <strong>On</strong>, and that your browser (Chrome / Edge) is in the allowed list.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">4</span>
                Return to this page and click the mic button again.
              </li>
            </ol>
          </div>

          <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs text-indigo-700">
            <strong>Can't do it right now?</strong> Use the <strong>"Type Instead"</strong> button above — you'll get the same AI feedback by typing your answer.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'recording' | 'processing' | 'result';
type InputMode = 'voice' | 'text';
type PermStatus = 'checking' | 'granted' | 'denied' | 'unavailable' | 'unknown';

export default function CommunicationPractice() {
  const [phase,       setPhase]       = useState<Phase>('idle');
  const [inputMode,   setInputMode]   = useState<InputMode>('voice');
  const [permStatus,  setPermStatus]  = useState<PermStatus>('unknown');
  const [prompt,      setPrompt]      = useState(PROMPTS[0]);
  const [transcript,  setTranscript]  = useState('');
  const [liveText,    setLiveText]    = useState('');
  const [manualText,  setManualText]  = useState('');
  const [timer,       setTimer]       = useState(0);
  const [feedback,    setFeedback]    = useState<CommunicationFeedbackOutput | null>(null);
  const [speechError, setSpeechError] = useState('');

  const recognitionRef  = useRef<any>(null);
  const timerRef        = useRef<NodeJS.Timeout | null>(null);
  const fullTranscript  = useRef('');

  // ── Check Web Speech API support ───────────────────────────────────────────
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  useEffect(() => {
    if (!SpeechRecognition) {
      setPermStatus('unavailable');
      setInputMode('text');
      return;
    }
    // Check permission state if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setPermStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown');
          result.onchange = () => {
            setPermStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown');
          };
        })
        .catch(() => setPermStatus('unknown'));
    }
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = () => {
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const fmtTimer = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  // ── Start recording (Web Speech API) ──────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!SpeechRecognition) { setInputMode('text'); return; }

    setSpeechError('');
    fullTranscript.current = '';
    setLiveText('');
    setTranscript('');

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setPhase('recording');
      setPermStatus('granted');
      startTimer();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final   = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      if (final) fullTranscript.current += final;
      setLiveText(fullTranscript.current + interim);
    };

    recognition.onerror = (event: any) => {
      stopTimer();
      setPhase('idle');
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setPermStatus('denied');
        setSpeechError('Microphone permission denied. Use text input below.');
        setInputMode('text');
      } else if (event.error === 'no-speech') {
        setSpeechError('No speech detected. Please speak louder or move closer to the microphone.');
      } else if (event.error === 'network') {
        setSpeechError('Network error. Check your connection and try again.');
      } else {
        setSpeechError(`Speech recognition error: ${event.error}. Try text input instead.`);
      }
    };

    recognition.onend = () => {
      stopTimer();
      // Only process if we were actually recording (not stopped by error)
      if (phase === 'recording' || fullTranscript.current.trim()) {
        const final = fullTranscript.current.trim();
        if (final) {
          setTranscript(final);
          setPhase('processing');
          analyseTranscript(final);
        } else {
          setPhase('idle');
          setSpeechError('No speech captured. Please try again.');
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setSpeechError('Could not start microphone. Try text input.');
      setInputMode('text');
    }
  }, [SpeechRecognition, phase]);

  // ── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // ── Analyse transcript / text ──────────────────────────────────────────────
  const analyseTranscript = async (text: string) => {
    setPhase('processing');
    try {
      const result = await getCommunicationFeedback({ transcript: text, prompt });
      setFeedback(result);
      setPhase('result');

      // Save to history
      const user = getCurrentUser() as any;
      if (user) {
        const userId = user._id || user.id;
        if (userId) {
          const { db } = await import('@/lib/mock-db');
          await db.createCommunicationHistory({
            userId,
            transcription:  result.transcription,
            sentiment:      result.sentiment,
            overallFeedback: result.overallFeedback,
            date: new Date().toISOString(),
          }).catch(() => {});
        }
      }
    } catch (e: any) {
      setSpeechError('AI analysis failed. Please try again.');
      setPhase('idle');
    }
  };

  const handleTextSubmit = () => {
    const text = manualText.trim();
    if (!text) return;
    setTranscript(text);
    analyseTranscript(text);
  };

  const reset = () => {
    setPhase('idle'); setFeedback(null);
    setTranscript(''); setLiveText(''); setManualText('');
    setSpeechError(''); setTimer(0);
    fullTranscript.current = '';
  };

  const pickRandomPrompt = () => {
    const others = PROMPTS.filter(p => p !== prompt);
    setPrompt(others[Math.floor(Math.random() * others.length)]);
    reset();
  };

  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
            <Mic className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Communication Lab</h1>
            <p className="text-slate-500 text-sm">AI-powered speech coaching for placement interviews</p>
          </div>
        </div>
      </div>

      <PermissionBanner status={permStatus} />

      {/* Error */}
      {speechError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {speechError}
        </div>
      )}

      {/* Prompt card */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-xl bg-indigo-100">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Your Prompt</p>
              <p className="font-semibold text-slate-800 text-lg leading-snug">"{prompt}"</p>
            </div>
          </div>
          {phase === 'idle' && (
            <button onClick={pickRandomPrompt}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 rounded-xl px-3 py-2 bg-white transition-colors flex-shrink-0">
              <RotateCcw className="h-3.5 w-3.5" /> New Prompt
            </button>
          )}
        </div>
        {phase === 'idle' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPTS.filter(p => p !== prompt).slice(0, 4).map(p => (
              <button key={p} onClick={() => { setPrompt(p); reset(); }}
                className="text-xs text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 rounded-lg px-2.5 py-1 transition-colors max-w-[200px] truncate">
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input mode toggle */}
      {phase === 'idle' && (
        <div className="flex gap-2">
          <button onClick={() => setInputMode('voice')} disabled={permStatus === 'unavailable'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
              ${inputMode === 'voice' ? 'bg-rose-600 text-white border-rose-600 shadow' : 'border-slate-200 text-slate-600 hover:border-rose-300 bg-white'}
              ${permStatus === 'unavailable' ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <Mic className="h-4 w-4" /> Voice Input
          </button>
          <button onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
              ${inputMode === 'text' ? 'bg-slate-800 text-white border-slate-800 shadow' : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white'}`}>
            <PenLine className="h-4 w-4" /> Type Instead
          </button>
        </div>
      )}

      {/* ── VOICE RECORDING ── */}
      {inputMode === 'voice' && phase !== 'result' && (
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Mic button */}
          <div className="relative">
            {phase === 'recording' && (
              <>
                <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping scale-125" />
                <div className="absolute inset-0 rounded-full bg-rose-400/15 animate-pulse scale-150" />
              </>
            )}
            <button
              onClick={phase === 'recording' ? stopRecording : startRecording}
              disabled={phase === 'processing'}
              className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-xl transition-all
                ${phase === 'recording'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : phase === 'processing'
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white hover:shadow-rose-200 hover:scale-105'}`}>
              {phase === 'processing'
                ? <Loader2 className="h-10 w-10 animate-spin" />
                : phase === 'recording'
                  ? <MicOff className="h-10 w-10" />
                  : <Mic className="h-10 w-10" />}
            </button>
          </div>

          {/* Status text */}
          <div className="text-center space-y-1">
            <p className="text-2xl font-mono font-bold text-slate-700">
              {phase === 'recording' ? fmtTimer : '0:00'}
            </p>
            <p className="text-slate-500 font-medium">
              {phase === 'idle'       && 'Tap the microphone to start speaking'}
              {phase === 'recording'  && 'Listening… tap again to stop'}
              {phase === 'processing' && 'Analysing your speech with AI…'}
            </p>
            {phase === 'recording' && (
              <p className="text-xs text-slate-400">Speak clearly — your transcript appears below</p>
            )}
          </div>

          {/* Live transcript */}
          {(phase === 'recording' || liveText) && (
            <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[80px]">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Live Transcript</p>
              <p className="text-slate-700 text-sm leading-relaxed">
                {liveText || <span className="text-slate-400 italic">Waiting for speech…</span>}
              </p>
            </div>
          )}

          {/* Tips */}
          {phase === 'idle' && (
            <div className="flex flex-wrap gap-3 justify-center max-w-xl">
              {[
                'Speak at a natural pace',
                'Keep 2–3 min responses',
                'Use structured answers (STAR method)',
              ].map(tip => (
                <span key={tip} className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                  <Info className="h-3 w-3 text-indigo-400" /> {tip}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEXT INPUT ── */}
      {inputMode === 'text' && phase === 'idle' && (
        <div className="space-y-3 max-w-2xl">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <PenLine className="h-4 w-4 text-slate-400" /> Type your response below
          </label>
          <textarea
            rows={6}
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder="Type your answer to the prompt above… (aim for 150–250 words)"
            className="w-full rounded-xl border border-slate-200 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{manualText.split(/\s+/).filter(Boolean).length} words</span>
            <button
              onClick={handleTextSubmit}
              disabled={!manualText.trim() || phase === 'processing'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition-colors">
              {phase === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyse with AI
            </button>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {phase === 'processing' && inputMode === 'text' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-indigo-600" />
          </div>
          <p className="text-slate-600 font-medium">Analysing your response…</p>
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'result' && feedback && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Score row */}
          <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <ScoreRing score={feedback.clarityScore}  label="Clarity"    color="#6366f1" />
            <ScoreRing score={feedback.grammarScore}  label="Grammar"    color="#10b981" />
            <ScoreRing score={feedback.confidenceScore} label="Confidence" color="#f59e0b" />
            <div className="flex-1 border-l border-slate-100 pl-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Overall Verdict</p>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border capitalize
                ${feedback.sentiment === 'positive' ? 'bg-green-50 text-green-700 border-green-200'
                  : feedback.sentiment === 'negative' ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {feedback.sentiment}
              </span>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{feedback.overallFeedback}</p>
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Your Response
            </p>
            <p className="text-sm text-slate-700 leading-relaxed italic">"{feedback.transcription}"</p>
          </div>

          {/* Feedback cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5" /> Clarity
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{feedback.clarityFeedback}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Grammar
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{feedback.grammarFeedback}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Confidence Tips
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{feedback.confidenceTips}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-slate-300 bg-white transition-colors">
              <RotateCcw className="h-4 w-4" /> Try Again
            </button>
            <button onClick={pickRandomPrompt}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
              Next Prompt <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
