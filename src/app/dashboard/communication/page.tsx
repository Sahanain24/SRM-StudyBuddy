
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, PlayCircle, MessageSquare, Sparkles, FileText } from 'lucide-react';
import { getCommunicationFeedback, CommunicationFeedbackOutput } from '@/ai/flows/student-receives-communication-feedback';
import { getDb, saveDb, getCurrentUser } from '@/lib/mock-db';

export default function CommunicationPractice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<CommunicationFeedbackOutput | null>(null);
  const [timer, setTimer] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          processAudio(base64Audio);
        };
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setTimer(0);
      timerInterval.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
  };

  const processAudio = async (base64Data: string) => {
    setIsProcessing(true);
    try {
      const result = await getCommunicationFeedback({
        audioDataUri: base64Data,
      });
      setFeedback(result);

      // Save to history
      const user = getCurrentUser();
      if (user) {
        const { db } = await import('@/lib/mock-db');
        const userId = user._id || user.id;
        if (userId) {
          await db.createCommunicationHistory({
            userId,
            transcription: result.transcription,
            sentiment: result.sentiment,
            overallFeedback: result.overallFeedback,
            date: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error(error);
      alert('Failed to get AI feedback. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Communication Lab</h1>
        <p className="text-muted-foreground">Master the art of speech with direct AI evaluation.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Live Practice</CardTitle>
            <CardDescription>Prompt: "Tell me about a time you solved a difficult problem."</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-8">
            <div className={`relative ${isRecording ? 'animate-pulse' : ''}`}>
              <div className={`absolute inset-0 rounded-full bg-primary/20 scale-150 ${isRecording ? 'animate-ping' : 'hidden'}`}></div>
              <Button 
                onClick={isRecording ? stopRecording : startRecording} 
                disabled={isProcessing}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className="w-24 h-24 rounded-full relative z-10"
              >
                {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              </Button>
            </div>
            
            <div className="text-center">
              <p className="font-medium text-xl font-mono">{isRecording ? formatTime(timer) : "0:00"}</p>
              <p className="font-medium mt-2">{isRecording ? "Recording your voice..." : "Tap the mic to start speaking"}</p>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 text-primary font-medium animate-in fade-in slide-in-from-bottom-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Transcribing & Analyzing...
              </div>
            )}
          </CardContent>
        </Card>

        {feedback ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto max-h-[70vh] pr-2">
            <Card className="border-none shadow-lg border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-headline text-xl">Analysis Report</CardTitle>
                <Badge variant={feedback.sentiment === 'positive' ? 'default' : 'secondary'}>
                  {feedback.sentiment.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-sm">Transcription</h4>
                  </div>
                  <p className="text-sm italic text-muted-foreground leading-relaxed">
                    "{feedback.transcription}"
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full mt-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Speech Clarity</h4>
                      <p className="text-sm text-muted-foreground">{feedback.clarityFeedback}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-full mt-1">
                      <MessageSquare className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Grammar & Syntax</h4>
                      <p className="text-sm text-muted-foreground">{feedback.grammarFeedback}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary text-primary-foreground rounded-lg">
                  <h4 className="font-bold text-sm mb-1">Coach's Summary</h4>
                  <p className="text-sm leading-relaxed opacity-90">
                    {feedback.overallFeedback}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => setFeedback(null)}>Start New Session</Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          !isProcessing && (
            <div className="flex items-center justify-center p-8 bg-muted/30 rounded-xl border-2 border-dashed border-muted">
              <div className="text-center text-muted-foreground max-w-xs">
                <PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Speak clearly into your microphone. Your AI coach will transcribe and evaluate your response in real-time.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
