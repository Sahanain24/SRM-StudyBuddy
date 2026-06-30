# MongoDB Setup Instructions

> **Updated for v2.0** — Two new collections added: `courses` and `examresults` and `aptituderesults`

---

## 1. Environment Variables

Create a `.env.local` file in the **root directory** of the project (not `.env` — Next.js reads `.env.local`):

```env
# Google Gemini AI Key (required for all AI features)
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here

# MongoDB Connection String (required for all data storage)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/srm-study-buddy?retryWrites=true&w=majority

# API URL — change port if needed (default is 9002)
NEXT_PUBLIC_API_URL=http://localhost:9002
```

**Important:** The file must be named `.env.local` exactly. Do NOT use `.env`.
**Never commit** `.env.local` to GitHub — it is already listed in `.gitignore`.

---

## 2. Get a Google Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and paste it as `GOOGLE_GENAI_API_KEY` in `.env.local`

> The project uses `googleai/gemini-2.5-flash` model. Make sure your API key has access to this model.

---

## 3. MongoDB Setup Options

### Option A: MongoDB Atlas — Cloud (Recommended)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Click **Create** → choose **Free M0** tier → click **Create Deployment**
3. Set a **username** and **password** → click **Create Database User**
4. Under **Network Access** → click **Add IP Address** → enter `0.0.0.0/0` → **Confirm**
5. Click **Connect** → **Drivers** → select **Node.js**
6. Copy the connection string — it looks like:
   ```
   mongodb+srv://yourUsername:<password>@cluster0.xxxxx.mongodb.net/
   ```
7. Replace `<password>` with your actual password
8. Add the database name before the `?`:
   ```
   mongodb+srv://yourUsername:yourPassword@cluster0.xxxxx.mongodb.net/srm-study-buddy?retryWrites=true&w=majority
   ```
9. Paste this as `MONGODB_URI` in `.env.local`

### Option B: Local MongoDB

1. Download from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install and start the service:
   - **Windows:** `net start MongoDB`
   - **Mac:** `brew services start mongodb-community`
   - **Linux:** `sudo systemctl start mongod`
3. Use this URI in `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/srm-study-buddy
   ```

### Option C: Docker

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```
Then use `MONGODB_URI=mongodb://localhost:27017/srm-study-buddy`

---

## 4. Database Schema — All Collections

All collections are created **automatically** when the first document is saved. No manual setup required.

### Original Collections (v1.0)

| Collection | Description |
|---|---|
| `users` | Student and teacher accounts (name, email, role) |
| `studylogs` | Study notes and materials created in Study Hub |
| `studysessions` | Study time tracking records |
| `quizresults` | AI Quiz scores and results |
| `codingsubmissions` | Coding Lab submissions with code and pass/fail status |
| `communicationhistories` | Speech practice transcriptions and AI feedback |
| `teacherfeedbacks` | Teacher feedback messages sent to students |

### New Collections (v2.0)

| Collection | Description |
|---|---|
| `courses` | Courses created by teachers with subjects and syllabus |
| `examresults` | Exam Arena results with full Q&A, scores, and isFirstAttempt flag |
| `aptituderesults` | Aptitude Arena results with step-by-step solutions |

---

## 5. Detailed Schema Reference

### `users`
```json
{
  "_id": "ObjectId",
  "name": "Arjun Mehta",
  "email": "arjun@srm.edu.in",
  "role": "student | teacher",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `courses` ← NEW in v2.0
```json
{
  "_id": "ObjectId",
  "name": "B.Tech Computer Science Sem 4",
  "description": "Fourth semester subjects",
  "teacherId": "ObjectId (ref: users)",
  "teacherName": "Dr. Sharma",
  "subjects": [
    {
      "name": "Data Structures",
      "syllabus": "Unit 1: Arrays...\nUnit 2: Linked Lists...",
      "topics": ["Arrays", "Trees", "Sorting"]
    }
  ],
  "isActive": true,
  "createdAt": "Date"
}
```

### `examresults` ← NEW in v2.0
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "userName": "Sahan Kumar",
  "courseId": "string",
  "courseName": "B.Tech CS Sem 4",
  "subjectName": "Data Structures",
  "score": 7,
  "total": 10,
  "percentage": 70,
  "timeTaken": 423,
  "answers": [2, 0, 1, 3],
  "correctAnswers": [2, 1, 1, 3],
  "questions": ["full question objects with explanations"],
  "isFirstAttempt": true,
  "date": "2024-01-15T10:30:00Z",
  "createdAt": "Date"
}
```

### `aptituderesults` ← NEW in v2.0
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "userName": "Sahan Kumar",
  "topic": "Time & Work",
  "score": 8,
  "total": 10,
  "percentage": 80,
  "timeTaken": 387,
  "answers": [2, 1, 3, 0],
  "correctAnswers": [2, 1, 3, 1],
  "questions": ["full question objects with stepByStep, formula, explanation"],
  "date": "2024-01-15T10:30:00Z",
  "createdAt": "Date"
}
```

### `teacherfeedbacks`
```json
{
  "_id": "ObjectId",
  "teacherId": "ObjectId (ref: users)",
  "studentId": "ObjectId (ref: users)",
  "message": "Focus more on linked list deletions...",
  "read": false,
  "date": "2024-01-15T10:30:00Z"
}
```

---

## 6. All API Endpoints

### Original Endpoints (v1.0)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create a new user (register) |
| POST | `/api/users/login` | Login by email |
| GET/POST | `/api/study-logs` | Study log CRUD |
| GET/POST | `/api/study-sessions` | Study session tracking |
| GET/POST | `/api/quiz-results` | Quiz results |
| GET/POST | `/api/coding-submissions` | Coding submissions |
| GET/POST | `/api/communication-history` | Speech records |
| GET/POST | `/api/teacher-feedback` | Teacher feedback |

### New Endpoints (v2.0)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses` | Get all active courses (filter by `?teacherId=`) |
| POST | `/api/courses` | Create a new course |
| PUT | `/api/courses/[id]` | Update course (add/edit subjects) |
| DELETE | `/api/courses/[id]` | Soft-delete a course |
| GET | `/api/exam-results` | Get exam results (filter by `?userId=`, `?firstOnly=1`, `?leaderboard=1`) |
| POST | `/api/exam-results` | Save exam result (auto-detects first attempt) |
| GET | `/api/aptitude-results` | Get aptitude results (filter by `?userId=`) |
| POST | `/api/aptitude-results` | Save aptitude result |

---

## 7. Query Examples

### Get leaderboard (best score per student per subject):
```
GET /api/exam-results?leaderboard=1
```

### Get only first attempts for a course:
```
GET /api/exam-results?firstOnly=1
```

### Get all exam results for a specific student:
```
GET /api/exam-results?userId=64abc123...
```

### Get all aptitude results for a student:
```
GET /api/aptitude-results?userId=64abc123...
```

---

## 8. Development Setup (Complete Steps)

```bash
# 1. Clone the project
git clone https://github.com/Sivabalan-tech/StudyBuddy.git
cd StudyBuddy

# 2. Install dependencies
npm install

# 3. Create .env.local with your keys (see Section 1)

# 4. Kill any process using port 9002 if needed
npx kill-port 9002

# 5. Start the development server
npm run dev

# 6. Open in browser
# http://localhost:9002
```

## 9. Verify MongoDB is Connected

After running `npm run dev`, check the terminal output. You should NOT see any MongoDB connection errors. To verify collections are being created:

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Click your cluster → **Browse Collections**
3. Select the `srm-study-buddy` database
4. After registering a user, you should see the `users` collection
5. After taking an exam, you should see `examresults` and `courses` collections

---

## 10. Common Issues and Fixes

| Error | Cause | Fix |
|---|---|---|
| `MongoServerError: bad auth` | Wrong password in URI | Re-check `MONGODB_URI` in `.env.local` |
| `MongoNetworkError: connection refused` | IP not whitelisted | Go to Atlas → Network Access → Add `0.0.0.0/0` |
| `MONGODB_URI is not defined` | Using `.env` not `.env.local` | Rename to `.env.local` exactly |
| `Port 9002 already in use` | Previous server still running | Run `npx kill-port 9002` then restart |
| `404 Not Found for gemini model` | Wrong model name in flow | Ensure no `model:` override in AI flows — inherit from `genkit.ts` |
| `429 Too Many Requests` | Gemini quota exceeded | Wait 1 minute and retry — retry logic is built in |
| `503 Service Unavailable` | Gemini temporarily overloaded | Retry logic waits 3s, 6s automatically |