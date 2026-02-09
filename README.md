# Canvas Calendar - Frontend

A React-based calendar application that syncs with Canvas LMS to display assignments.

## Features

- 📅 Calendar view with color-coded assignments
- ✅ Task panel with upcoming and completed assignments
- 🔄 Auto-sync every 15 minutes while app is open
- 🎯 Manual sync button
- 📱 Movable task panel (left/right)
- 🔗 Direct links to Canvas assignments

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **The app will open at:**
   ```
   http://localhost:3000
   ```

## Getting Your Canvas Token

1. Log into Canvas
2. Go to **Account → Settings**
3. Scroll down to **"Approved Integrations"**
4. Click **"+ New Access Token"**
5. Give it a purpose name and expiration date
6. Copy the token (you'll only see it once!)

## Usage

1. Click the pulsating **"Connect Canvas"** button
2. Enter your Canvas URL (e.g., `https://canvas.instructure.com`)
3. Paste your Canvas access token
4. Click **"Connect"**
5. Your assignments will sync and appear in the calendar!

## Tech Stack

- React 18
- react-big-calendar (calendar component)
- moment.js (date handling)
- axios (API calls)

## Project Structure

```
Frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Calendar.js
│   │   ├── TaskPanel.js
│   │   ├── SyncIndicator.js
│   │   └── TokenModal.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── index.js
│   └── index.css
└── package.json
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner

## Backend Requirement

This frontend requires the Canvas Calendar backend to be running on `http://localhost:8000`

Make sure the backend is running before using this app!
