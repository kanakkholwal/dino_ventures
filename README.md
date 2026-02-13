# DinoTV – Video Player

A premium, mobile-first video player application built with **React + Vite + TypeScript + Tailwind CSS**. Features a YouTube-like experience with custom controls, gesture-based interactions, and a persistent mini-player.

---

## ✨ Features

### 1. Home Page – Video Feed
- Responsive grid layout with video cards
- Each card shows: **thumbnail, title, duration, category badge**
- Horizontal scrollable category filter bar
- Smooth hover animations and play icon overlay

### 2. Full-Page Video Player
- **Auto-play** on video open
- **Custom controls** (YouTube native controls disabled):
  - Play / Pause toggle
  - Skip forward (+10s) and backward (-10s) with visual feedback animation
  - **Seekable progress bar** (custom-styled range input)
  - **Current time / total duration** display
- Controls auto-hide after 3 seconds, re-appear on tap
- Fully responsive for mobile and desktop

### 3. In-Player Video List
- **Same-category filtering**: Only related videos from the same category are shown
- Scroll down below the video to reveal the "Up Next" list
- Clicking a related video **immediately switches playback** and auto-plays
- List updates when category changes

### 4. Drag-to-Minimize Video Player
- **Drag down** on the full-screen player to minimize
- Video **docks into a bottom mini-player bar**
- Mini-player shows:
  - Small video preview (continues playing)
  - Video title
  - Play / Pause control
  - Close button
- **Persists** while browsing the home feed
- **Tap mini-player** to restore full-screen

### 5. Bonus Features
- **Auto-play Next**: 3-second countdown with cancel/play-now options when a video ends
- **Visual Feedback**: Skip ±10s shows animated text feedback
- **Dark mode** enabled by default

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [ShadCN UI](https://ui.shadcn.com/) |
| State | [Zustand](https://docs.pmnd.rs/zustand) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Video | YouTube IFrame Player API (programmatic control) |
| Font | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dino-ventures

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📱 Gestures & Interactions

| Gesture | Action |
|---|---|
| Click video card | Opens full-screen player |
| Drag player down | Minimizes to bottom mini-player |
| Tap mini-player | Restores full-screen |
| Tap video area | Show / hide custom controls |
| Tap skip buttons | Skip ±10 seconds with animation |
| Drag seekbar | Seek to position |
| Scroll below video | Reveal related videos list |
| Auto-play countdown | Cancel or play next immediately |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── ui/                    # ShadCN primitives (Button, Card, Badge, etc.)
│   ├── player/
│   │   └── PlayerOverlay.tsx  # Full player + mini-player + controls
│   ├── Layout.tsx             # App shell with header
│   ├── VideoCard.tsx          # Feed video card (thumbnail, title, badge)
│   └── CategoryPill.tsx       # Category filter chip
├── hooks/
│   └── useYouTubePlayer.ts    # YouTube IFrame API React hook
├── lib/
│   ├── data.ts                # Dataset + type definitions + helpers
│   ├── store.ts               # Zustand global player state
│   └── utils.ts               # cn() class merge utility
├── pages/
│   └── Home.tsx               # Main feed page
├── App.tsx                    # Router setup
├── main.tsx                   # Entry point
└── index.css                  # Tailwind + theme + custom styles
```

---

## 🎨 Design Decisions

- **YouTube IFrame Player API** – Loaded programmatically for full control (play, pause, seek, time tracking) while hiding YouTube's native controls
- **Zustand** – Minimal global state for player persistence across navigation
- **Framer Motion** – Spring-based animations for player transitions and gesture handling
- **Dark mode first** – Modern, premium feel with carefully tuned color palette
- **Mobile-first** – Touch gestures, tap-to-show controls, responsive grid
- **Same-category filtering** – Related videos always match the current video's category
