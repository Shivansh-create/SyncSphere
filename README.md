# SyncSphere

A real-time watch party web app built with React and Node.js. It syncs YouTube or local video playback across multiple clients using Socket.io, and includes built-in WebRTC for live audio, video, and text chat.

## Features

- **Real-Time Video Synchronization:** Paste a YouTube link or select a local video file to watch in perfect sync with others.
- **WebRTC A/V Chat:** Native peer-to-peer audio and video communication while watching.
- **Live Text Chat:** Integrated messaging with support for private whispering to specific users.
- **Responsive Layout:** A clean, modern interface that scales perfectly from desktop monitors down to mobile viewports.
- **Dynamic Room Management:** Create private theaters and invite friends via a simple 7-character room code.

## Tech Stack

- **Frontend:** React, Vite, Zustand (State Management), React Router, Lucide React (Icons)
- **Backend:** Node.js, Express, Socket.io
- **WebRTC:** Native browser APIs for peer-to-peer media streaming

## Prerequisites

Before running this project locally, ensure you have the following installed:
- Node.js (v16.x or higher)
- npm (v7.x or higher)

## Local Setup

This repository contains both the client and server codebases. You will need to start both to run the application locally.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YourUsername/SyncSphere.git
   cd SyncSphere
   ```

2. **Install dependencies:**
   Install the root dependencies first (this includes `concurrently` to run both servers at once).
   ```bash
   npm install
   ```
   Then install the frontend and backend dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Run the application:**
   From the root of the project, run the dev script to start both the React frontend and Node.js backend simultaneously:
   ```bash
   npm run dev
   ```

   - The React frontend will be available at `http://localhost:5173`
   - The Socket.io backend will be running on `http://localhost:3001`

## Project Structure

```text
SyncSphere/
├── client/           # React frontend (Vite)
│   ├── src/          # UI components, pages, and custom hooks
│   └── vercel.json   # Deployment configuration for Vercel
├── server/           # Node.js backend
│   └── index.js      # Express server and Socket.io event handlers
└── package.json      # Root configuration for concurrently running both servers
```
