# MongoDB Setup Instructions

## 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/srm-study-buddy

# Optional: For MongoDB Atlas (cloud database)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/srm-study-buddy?retryWrites=true&w=majority

# API URL (for client-side API calls)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 2. Local MongoDB Setup

### Option A: Install MongoDB locally
1. Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   - Windows: `net start MongoDB`
   - Mac/Linux: `sudo systemctl start mongod` or `brew services start mongodb-community`

### Option B: Use Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option C: Use MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string and add it to `.env.local`

## 3. Database Schema

The following collections will be created automatically:

- `users` - Student and teacher accounts
- `studylogs` - Study notes and materials
- `studysessions` - Study time tracking
- `quizresults` - Quiz scores and results
- `codingsubmissions` - Programming exercise submissions
- `communicationhistories` - Speech practice records
- `teacherfeedbacks` - Teacher comments and feedback

## 4. Migration Notes

- All existing localStorage data will be migrated to MongoDB
- User authentication now uses MongoDB instead of localStorage
- Session management still uses localStorage for user session state
- All CRUD operations now go through MongoDB API endpoints

## 5. API Endpoints

The following API routes are available:

- `GET/POST /api/users` - User management
- `POST /api/users/login` - User authentication
- `GET/POST /api/study-logs` - Study log CRUD
- `GET/POST /api/study-sessions` - Study session tracking
- `GET/POST /api/quiz-results` - Quiz results
- `GET/POST /api/coding-submissions` - Coding submissions
- `GET/POST /api/communication-history` - Communication records
- `GET/POST /api/teacher-feedback` - Teacher feedback

## 6. Development

1. Install dependencies: `npm install`
2. Set up environment variables
3. Start MongoDB (local or cloud)
4. Run the app: `npm run dev`
5. The app will automatically connect to MongoDB and create collections as needed
