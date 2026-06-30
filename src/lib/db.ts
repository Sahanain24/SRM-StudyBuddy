export type UserRole = 'student' | 'teacher' | 'hod' | 'dean' | 'deputy_dean' | 'pro_vc' | 'admin';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface StudyLog {
  _id?: string;
  id?: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  date: string;
}

export interface StudySession {
  _id?: string;
  id?: string;
  userId: string;
  subject: string;
  duration: number; // in seconds
  date: string;
}

export interface QuizResult {
  _id?: string;
  id?: string;
  userId: string;
  subject: string;
  score: number;
  total: number;
  date: string;
}

export interface CodingSubmission {
  _id?: string;
  id?: string;
  userId: string;
  problemId: string;
  code: string;
  result: 'passed' | 'failed';
  date: string;
}

export interface CommunicationHistory {
  _id?: string;
  id?: string;
  userId: string;
  transcription: string;
  sentiment: string;
  overallFeedback: string;
  date: string;
}

export interface TeacherFeedback {
  _id?: string;
  id?: string;
  teacherId: string;
  studentId: string;
  message: string;
  date: string;
  read: boolean;
}

// Database API functions
class DatabaseAPI {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // User operations
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/api/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async createUser(user: Omit<User, '_id' | 'id'>): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  async loginUser(email: string): Promise<User | null> {
    const response = await fetch(`${this.baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) return null;
    return response.json();
  }

  // Study Log operations
  async getStudyLogs(userId?: string): Promise<StudyLog[]> {
    const url = userId ? `${this.baseUrl}/api/study-logs?userId=${userId}` : `${this.baseUrl}/api/study-logs`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch study logs');
    return response.json();
  }

  async createStudyLog(log: Omit<StudyLog, '_id' | 'id'>): Promise<StudyLog> {
    const response = await fetch(`${this.baseUrl}/api/study-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!response.ok) throw new Error('Failed to create study log');
    return response.json();
  }

  // Study Session operations
  async getStudySessions(userId?: string): Promise<StudySession[]> {
    const url = userId ? `${this.baseUrl}/api/study-sessions?userId=${userId}` : `${this.baseUrl}/api/study-sessions`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch study sessions');
    return response.json();
  }

  async createStudySession(session: Omit<StudySession, '_id' | 'id'>): Promise<StudySession> {
    const response = await fetch(`${this.baseUrl}/api/study-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!response.ok) throw new Error('Failed to create study session');
    return response.json();
  }

  // Quiz Result operations
  async getQuizResults(userId?: string): Promise<QuizResult[]> {
    const url = userId ? `${this.baseUrl}/api/quiz-results?userId=${userId}` : `${this.baseUrl}/api/quiz-results`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch quiz results');
    return response.json();
  }

  async createQuizResult(result: Omit<QuizResult, '_id' | 'id'>): Promise<QuizResult> {
    const response = await fetch(`${this.baseUrl}/api/quiz-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    if (!response.ok) throw new Error('Failed to create quiz result');
    return response.json();
  }

  // Coding Submission operations
  async getCodingSubmissions(userId?: string): Promise<CodingSubmission[]> {
    const url = userId ? `${this.baseUrl}/api/coding-submissions?userId=${userId}` : `${this.baseUrl}/api/coding-submissions`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch coding submissions');
    return response.json();
  }

  async createCodingSubmission(submission: Omit<CodingSubmission, '_id' | 'id'>): Promise<CodingSubmission> {
    const response = await fetch(`${this.baseUrl}/api/coding-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (!response.ok) throw new Error('Failed to create coding submission');
    return response.json();
  }

  // Communication History operations
  async getCommunicationHistory(userId?: string): Promise<CommunicationHistory[]> {
    const url = userId ? `${this.baseUrl}/api/communication-history?userId=${userId}` : `${this.baseUrl}/api/communication-history`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch communication history');
    return response.json();
  }

  async createCommunicationHistory(entry: Omit<CommunicationHistory, '_id' | 'id'>): Promise<CommunicationHistory> {
    const response = await fetch(`${this.baseUrl}/api/communication-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) throw new Error('Failed to create communication entry');
    return response.json();
  }

  // Teacher Feedback operations
  async getTeacherFeedback(studentId?: string): Promise<TeacherFeedback[]> {
    const url = studentId ? `${this.baseUrl}/api/teacher-feedback?studentId=${studentId}` : `${this.baseUrl}/api/teacher-feedback`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch teacher feedback');
    return response.json();
  }

  async createTeacherFeedback(feedback: Omit<TeacherFeedback, '_id' | 'id'>): Promise<TeacherFeedback> {
    const response = await fetch(`${this.baseUrl}/api/teacher-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    if (!response.ok) throw new Error('Failed to create teacher feedback');
    return response.json();
  }
}

export const db = new DatabaseAPI();

// Current user management (still using localStorage for session management)
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('srm_current_user');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('srm_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('srm_current_user');
  }
};

// Legacy compatibility functions
export const getDb = () => {
  // This is maintained for backward compatibility
  // but the new approach is to use the db API directly
  return {
    users: [],
    studyLogs: [],
    studySessions: [],
    quizResults: [],
    codingSubmissions: [],
    communicationHistory: [],
    teacherFeedback: [],
  };
};

export const saveDb = () => {
  // No-op for MongoDB
};
