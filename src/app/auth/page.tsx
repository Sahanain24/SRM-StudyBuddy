
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, Loader2 } from 'lucide-react';
import { getDb, saveDb, setCurrentUser, UserRole } from '@/lib/mock-db';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState(searchParams.get('tab') || 'login');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', role: 'student' as UserRole });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { db } = await import('@/lib/mock-db');
      const user = await db.loginUser(loginData.email);
      
      if (user) {
        setCurrentUser(user);
        router.push('/dashboard');
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { db } = await import('@/lib/mock-db');
      const newUser = await db.createUser(registerData);
      
      setCurrentUser(newUser);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white mb-4 shadow-lg">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-headline font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SRM Study Buddy</h1>
          <p className="text-sm text-slate-600 mt-2">Your AI-powered academic companion</p>
        </div>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">Login</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader className="space-y-2">
                <CardTitle className="font-headline text-2xl text-slate-900">Welcome Back</CardTitle>
                <CardDescription className="text-slate-600">Login to your account to continue studying.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="alex@smartstudy.edu" 
                      required 
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      required 
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300" type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader className="space-y-2">
                <CardTitle className="font-headline text-2xl text-slate-900">Create Account</CardTitle>
                <CardDescription className="text-slate-600">Join our community and start learning.</CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Alex Johnson" 
                      required 
                      value={registerData.name}
                      onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input 
                      id="reg-email" 
                      type="email" 
                      placeholder="alex@smartstudy.edu" 
                      required 
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input 
                      id="reg-password" 
                      type="password" 
                      required 
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>I am a:</Label>
                    <RadioGroup 
                      defaultValue="student" 
                      onValueChange={(val) => setRegisterData({...registerData, role: val as UserRole})}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="r-student" />
                        <Label htmlFor="r-student">Student</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="teacher" id="r-teacher" />
                        <Label htmlFor="r-teacher">Teacher</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300" type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
