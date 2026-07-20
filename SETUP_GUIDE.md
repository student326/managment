# Student Fee Management System - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Firebase account (Free Spark Plan)
- npm or yarn

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** > Sign-in method > **Email/Password**
4. Enable **Storage** > Get started (default rules)
5. Enable **Hosting** if you plan to deploy

### Create Admin Account

In Firebase Console > Authentication > Users > Add User:
- Email: `admin@globalacademy.com`
- Password: Choose a strong password

### Set Storage Rules

Deploy or manually copy from `firebase/storage.rules`:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /excel/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Environment Setup

1. Copy `.env.example` to `.env` in the `frontend/` directory
2. Fill in your Firebase project credentials:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### How to find Firebase credentials:
1. Firebase Console > Project Settings > General > Your apps
2. Click "Add app" > Web
3. Copy the `firebaseConfig` values

## Installation

```bash
cd frontend
npm install
```

## Run Locally

```bash
npm run dev
```

The app will start at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize hosting (from the `firebase/` directory):
```bash
cd ../firebase
firebase init hosting
```
- Select your Firebase project
- Set public directory to `../frontend/dist`
- Configure as single-page app: Yes
- Set up automatic builds: No

4. Deploy:
```bash
firebase deploy
```

Or from the project root:
```bash
cd frontend && npm run build
cd ../firebase && firebase deploy
```

## Testing Checklist

- [ ] Firebase Authentication works (login/logout)
- [ ] Dashboard loads with stats
- [ ] Student list displays correctly
- [ ] Add student form works
- [ ] Edit student updates records
- [ ] Delete student removes record
- [ ] Fee management records payments
- [ ] Excel upload processes correctly
- [ ] Download Excel exports data
- [ ] Column management (add/rename/remove)
- [ ] Reports display correct data
- [ ] Profile page shows user info
- [ ] Protected routes redirect to login
- [ ] Mobile responsive layout works
- [ ] Search/filter/sort works on students page

## Sample Excel File

Use the `generate-sample-excel.js` script to create a sample Excel file:

```bash
cd ..
node generate-sample-excel.js
```

This creates `sample_students.xlsx` with 8 sample student records.
