# SRM Study Buddy

SRM Study Buddy is an AI-powered academic companion designed for students and teachers at SRM University.

## Features

- **Study Hub**: Create study logs from your personal notes.
- **AI Quizzes**: Generate personalized quizzes based on your study logs.
- **Coding Lab**: Practice programming with dynamically generated challenges.
- **Communication Lab**: Improve your speech with real-time AI transcription and feedback.
- **Teacher Insights**: Comprehensive analytics for educators to monitor student progress and provide feedback.

## Local Development

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
GOOGLE_GENAI_API_KEY=your_api_key_here
```

### 4. Run the Application
```bash
npm run dev
```
Open [http://localhost:9002](http://localhost:9002) in your browser.

### 5. AI Debugging (Genkit)
To explore and test AI flows independently:
```bash
npm run genkit:dev
```

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI**: Genkit with Google Gemini
- **Styling**: Tailwind CSS & Shadcn UI
- **Icons**: Lucide React
