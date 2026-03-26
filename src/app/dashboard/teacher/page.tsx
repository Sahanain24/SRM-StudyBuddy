
'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, Award, Code, Mic, MessageSquare, Send, User, ChevronDown, Search, Users, BarChart, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { getDb, saveDb, getCurrentUser } from '@/lib/mock-db';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const loadData = async () => {
    try {
      const { db } = await import('@/lib/mock-db');
      const allStudents = await db.getUsers();
      const students = allStudents.filter((u: any) => u.role === 'student');
      
      const enrichedStudents = await Promise.all(
        students.map(async (s: any) => {
          const userId = s._id || s.id;
          if (userId) {
            const [sessions, quizzes, logs, coding, speech, feedback] = await Promise.all([
              db.getStudySessions(userId),
              db.getQuizResults(userId),
              db.getStudyLogs(userId),
              db.getCodingSubmissions(userId),
              db.getCommunicationHistory(userId),
              db.getTeacherFeedback(userId) // Add this line to load teacher feedback for each student
            ]);
            
            const totalTime = sessions.reduce((acc: number, cur: any) => acc + cur.duration, 0);
            const avgScore = quizzes.length > 0 
              ? Math.round(quizzes.reduce((acc: number, cur: any) => acc + (cur.score / cur.total), 0) / quizzes.length * 100)
              : 0;

            return {
              ...s,
              avgScore,
              activityCount: sessions.length + quizzes.length,
              logsCount: logs.length,
              logs,
              quizzes,
              coding,
              speech,
              feedback // Add feedback to the returned student object
            };
          }
          return s;
        })
      );

      setStudents(enrichedStudents);
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendFeedback = async () => {
    if (!selectedStudent || !feedbackMsg) return;
    const teacher = getCurrentUser();
    if (!teacher) return;

    try {
      const { db } = await import('@/lib/mock-db');
      const teacherId = teacher._id || teacher.id;
      const studentId = selectedStudent._id || selectedStudent.id;
      
      if (teacherId && studentId) {
        await db.createTeacherFeedback({
          teacherId,
          studentId,
          message: feedbackMsg,
          date: new Date().toISOString(),
          read: false
        });
        
        toast({ title: "Feedback Sent", description: `Feedback sent to ${selectedStudent.name} successfully.` });
        setFeedbackMsg('');
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
      toast({ title: "Error", description: "Failed to send feedback. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Student Analytics</h1>
          <p className="text-muted-foreground">Monitor performance and provide targeted feedback to your class.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search student name or email..." 
            className="pl-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Class Performance Overview
          </CardTitle>
          <CardDescription>Comprehensive overview of student activity and performance metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Details</TableHead>
                <TableHead>Study Logs</TableHead>
                <TableHead>Avg. Quiz Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No students found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student._id || student.id}>
                    <TableCell>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{student.logsCount} Logs</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${student.avgScore}%` }} />
                        </div>
                        <span className="text-sm font-medium">{student.avgScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View & Feedback
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
              <User className="h-6 w-6 text-primary" />
              {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>{selectedStudent?.email} • SRM Study Buddy Platform Academic Year 2024</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col mt-4">
            <Tabs defaultValue="logs" className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 shrink-0">
                <TabsTrigger value="logs" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Study Logs
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Quizzes
                </TabsTrigger>
                <TabsTrigger value="coding" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Coding
                </TabsTrigger>
                <TabsTrigger value="speech" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Speech
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </TabsTrigger>
              </TabsList>

              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={scrollToBottom} className="text-xs text-primary hover:bg-primary/5">
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Scroll to Feedback
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto mt-2 pr-2" ref={scrollRef}>
                <TabsContent value="logs" className="space-y-4 m-0">
                  {selectedStudent?.logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 text-center">No study logs created yet.</p>
                  ) : (
                    selectedStudent?.logs.map((log: any) => (
                      <div key={log._id || log.id} className="p-4 border rounded-xl bg-muted/20">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-sm font-bold flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            {log.title}
                          </h5>
                          <span className="text-[10px] text-muted-foreground bg-white px-2 py-1 rounded border">
                            {format(new Date(log.date), 'PPP')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{log.content}</p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="quizzes" className="space-y-3 m-0">
                  {selectedStudent?.quizzes.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 text-center">No quiz history available.</p>
                  ) : (
                    selectedStudent?.quizzes.map((q: any) => (
                      <div key={q._id || q.id} className="flex justify-between items-center p-4 border rounded-xl bg-white shadow-sm">
                        <div>
                          <div className="text-sm font-bold">{q.subject}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(q.date), 'PPp')}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant={q.score / q.total >= 0.7 ? 'default' : 'secondary'} className="text-sm">
                            {q.score} / {q.total}
                          </Badge>
                          <div className="text-[10px] mt-1 text-muted-foreground">Accuracy: {Math.round((q.score/q.total)*100)}%</div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="coding" className="space-y-3 m-0">
                  {selectedStudent?.coding.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 text-center">No coding submissions found.</p>
                  ) : (
                    selectedStudent?.coding.map((c: any) => (
                      <div key={c._id || c.id} className="flex justify-between items-center p-4 border rounded-xl bg-white shadow-sm">
                        <div>
                          <div className="text-sm font-bold">{c.problemId}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(c.date), 'PPp')}</div>
                        </div>
                        <Badge variant={c.result === 'passed' ? 'default' : 'destructive'}>
                          {c.result.toUpperCase()}
                        </Badge>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="speech" className="space-y-3 m-0">
                  {selectedStudent?.speech.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 text-center">No speech practice history recorded.</p>
                  ) : (
                    selectedStudent?.speech.map((m: any) => (
                      <div key={m._id || m.id} className="p-4 border rounded-xl bg-muted/10">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="outline" className="capitalize">{m.sentiment} Sentiment</Badge>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(m.date), 'PPp')}</span>
                        </div>
                        <p className="text-xs italic text-muted-foreground mb-3 line-clamp-2 border-l-2 pl-2">"{m.transcription}"</p>
                        <div className="text-xs">
                          <span className="font-bold text-primary">AI Insight: </span>
                          <span className="text-muted-foreground">{m.overallFeedback.substring(0, 180)}...</span>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4 m-0">
                  {selectedStudent?.feedback?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 text-center">No teacher feedback available.</p>
                  ) : (
                    selectedStudent?.feedback.map((feedback: any) => (
                      <div key={feedback._id || feedback.id} className="p-4 border rounded-xl bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {feedback.read ? 'Read' : 'Unread'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(feedback.date), 'PPp')}</span>
                          </div>
                          <span className="font-medium text-sm">{feedback.teacherName}</span>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm leading-relaxed">{feedback.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <Label className="text-base font-bold">Provide Performance Feedback</Label>
            </div>
            <Textarea 
              placeholder="Write targeted feedback for the student based on their performance above..."
              value={feedbackMsg}
              onChange={(e) => setFeedbackMsg(e.target.value)}
              className="min-h-[100px] bg-muted/20"
            />
          </div>

          <DialogFooter className="mt-4 shrink-0">
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>Close Profile</Button>
            <Button onClick={sendFeedback} disabled={!feedbackMsg}>
              <Send className="mr-2 h-4 w-4" />
              Send Feedback Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
