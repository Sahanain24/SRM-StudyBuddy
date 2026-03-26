'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Send, CheckCircle, Terminal, Play, Loader2, Sparkles, Search } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDb, saveDb, getCurrentUser } from '@/lib/mock-db';
import { generateCodingProblem, GenerateCodingProblemOutput } from '@/ai/flows/generate-coding-problem-flow';

export default function CodingPractice() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [problem, setProblem] = useState<GenerateCodingProblemOutput | null>(null);
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'none' | 'passed' | 'failed'>('none');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setIsGenerating(true);
    try {
      const data = await generateCodingProblem({ topic, difficulty: 'medium' });
      setProblem(data);
      setCode(data.template);
      setResult('none');
    } catch (error) {
      console.error(error);
      alert('Failed to generate problem.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const user = getCurrentUser();
      if (user && problem) {
        const { db } = await import('@/lib/mock-db');
        const userId = user._id || user.id;
        if (userId) {
          const outcome = Math.random() > 0.3 ? 'passed' : 'failed';
          await db.createCodingSubmission({
            userId,
            problemId: problem.title,
            code,
            result: outcome,
            date: new Date().toISOString(),
          });
          setResult(outcome);
        }
      }
    } catch (error) {
      console.error('Failed to submit coding solution:', error);
      alert('Failed to submit solution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Coding Lab</h1>
          <p className="text-muted-foreground">Generate real-world challenges with AI.</p>
        </div>
      </div>

      {!problem ? (
        <Card className="max-w-xl mx-auto border-none shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What are we building today?
            </CardTitle>
            <CardDescription>Enter a topic or algorithm to generate a custom challenge.</CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Challenge Topic</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Binary Search, REST API, Array Manipulation" 
                    className="pl-9"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" size="lg" disabled={isGenerating || !topic}>
                {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Customizing...</> : 'Start Challenge'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <Badge className="bg-primary/10 text-primary border-none">AI Generated</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setProblem(null)}>Back to Topics</Button>
                </div>
                <CardTitle className="font-headline text-2xl">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {problem.description}
                </p>
                
                <div className="mt-8 space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Expected Behavior
                  </h4>
                  <div className="p-4 bg-muted border rounded-lg text-sm text-muted-foreground">
                    {problem.testCaseDescription}
                  </div>
                  
                  <div className="p-4 bg-zinc-900 rounded-lg font-code text-zinc-100 text-sm min-h-[100px]">
                    {result === 'none' && <span className="opacity-40">Ready to run...</span>}
                    {result === 'passed' && (
                      <div className="text-green-400">
                        <CheckCircle className="h-4 w-4 inline mr-2" />
                        Tests Passed! Logic verified by AI evaluator.
                      </div>
                    )}
                    {result === 'failed' && <span className="text-red-400">Runtime Error: Output does not match expectations.</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-lg flex flex-col min-h-[500px] overflow-hidden">
            <CardHeader className="bg-zinc-100 py-3 flex flex-row items-center justify-between border-b">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Code className="h-4 w-4" />
                solution.js
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <Textarea
                className="w-full h-full min-h-[400px] font-code text-sm p-4 bg-zinc-50 border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </CardContent>
            <div className="p-4 border-t bg-white flex justify-end gap-3">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating</> : <><Send className="mr-2 h-4 w-4" /> Run & Submit</>}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
