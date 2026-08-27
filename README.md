# Teacher-Student Classroom App 🎓

A cross-platform (Android, iOS, Windows) live classroom app built with Flutter, Supabase, and LiveKit.

## Features

- 👩‍🏫 **Teacher**: Create & manage classrooms, host live video sessions
- 👩‍🎓 **Student**: Join classes via room code or live class list
- 🎥 **Live Video Calls** powered by LiveKit (up to 100 participants)
- 🔇 **Teacher Controls**: Mute any student's mic
- 📷 **Video Control**: Turn on/off any student's camera
- 🚪 **Kick**: Remove a student from the class
- 🔐 **Supabase Auth**: Separate Teacher/Student login
- 🔴 **Realtime Updates**: Supabase Realtime for live participant state

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/teacher-student-app.git
cd teacher-student-app
```

### 2. Configure environment
Copy `.env` and fill in your credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 3. Setup Supabase Database
Run the migration in Supabase SQL Editor:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Deploy Supabase Edge Function
```bash
supabase functions deploy generate-livekit-token
supabase secrets set LIVEKIT_API_KEY=your_key LIVEKIT_API_SECRET=your_secret
```

### 5. Install dependencies
```bash
flutter pub get
```

### 6. Run the app
```bash
# Android
flutter run -d android

# iOS
flutter run -d ios

# Windows
flutter run -d windows
```

## Architecture

```
lib/
├── core/               # Supabase client, router, constants
├── features/
│   ├── auth/           # Login, Register, Role Select screens
│   ├── dashboard/      # Teacher & Student dashboards
│   └── classroom/      # Video call screen + controls
├── models/             # User, Room, Participant models
supabase/
├── functions/          # Edge functions (LiveKit token gen)
└── migrations/         # Database schema
```

## Tech Stack

| | Technology |
|---|---|
| Framework | Flutter 3.x |
| Auth & DB | Supabase |
| Video Calls | LiveKit |
| State | Riverpod |
| Navigation | go_router |
