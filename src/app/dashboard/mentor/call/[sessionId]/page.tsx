'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/mock-db';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PhoneOff, ExternalLink, AlertTriangle } from 'lucide-react';

interface Session {
  _id: string; status: string; roomUrl?: string; roomName?: string;
  studentName: string; teacherName: string; teacherId: string;
  scheduledAt: string; durationMins: number; topic: string;
}

export default function MentorCallPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router         = useRouter();
  const { toast }      = useToast();
  const user           = getCurrentUser() as any;
  const userId         = user?._id || user?.id;
  const isTeacher      = user?.role === 'teacher';

  const [session, setSession]   = useState<Session | null>(null);
  const [loading, setLoading]   = useState(true);
  const [ending, setEnding]     = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    fetch(`/api/mentor/sessions/${sessionId}`)
      .then(r => r.json())
      .then(data => { setSession(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const endSession = async () => {
    if (!confirm('End the session and save the recording?')) return;
    setEnding(true);
    const res  = await fetch(`/api/mentor/sessions/${sessionId}/end`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: 'Error ending session', description: data.error, variant: 'destructive' });
    } else {
      toast({ title: 'Session ended', description: data.recordingUrl ? 'Recording saved.' : 'Recording will be available shortly.' });
    }
    setEnding(false);
    // Redirect teacher to session detail to fill assessment
    router.push(isTeacher ? `/dashboard/mentor/teacher/${sessionId}` : `/dashboard/mentor/student/${sessionId}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );

  if (!session?.roomUrl) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <p className="font-semibold text-slate-700">Room not available yet</p>
      <p className="text-sm text-slate-400">
        {session?.status === 'requested'
          ? 'This session has not been approved yet.'
          : 'The video room could not be loaded. Contact your teacher.'}
      </p>
      <Button variant="outline" onClick={() => router.back()} className="rounded-xl">Go back</Button>
    </div>
  );

  // Build the Daily.co prebuilt URL
  // The roomUrl from Daily is like https://yourname.daily.co/roomname
  // We add ?userName= and optionally ?t= for token
  const callUrl = `${session.roomUrl}?showLeaveButton=true&showFullscreenButton=true&userName=${encodeURIComponent(user?.name || 'Guest')}`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium">
            {isTeacher ? `Session with ${session.studentName}` : `Session with ${session.teacherName}`}
          </span>
          {session.topic && <span className="text-xs text-slate-400">· {session.topic}</span>}
        </div>
        <div className="flex items-center gap-2">
          <a href={session.roomUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded">
            <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
          </a>
          {isTeacher && (
            <Button size="sm" onClick={endSession} disabled={ending}
              className="gap-1.5 rounded-xl h-8 bg-red-600 hover:bg-red-700 text-white text-xs">
              {ending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneOff className="h-3.5 w-3.5" />}
              End & Save Recording
            </Button>
          )}
        </div>
      </div>

      {/* Daily.co iframe */}
      {iframeError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-800 text-white">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
          <p className="font-medium">Could not load the video room in-browser.</p>
          <a href={callUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm font-medium transition-colors">
            <ExternalLink className="h-4 w-4" /> Open in a new tab instead
          </a>
        </div>
      ) : (
        <iframe
          src={callUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
          className="flex-1 w-full border-0"
          title="Mentor Video Call"
          onError={() => setIframeError(true)}
        />
      )}
    </div>
  );
}
