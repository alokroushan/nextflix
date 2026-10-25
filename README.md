# 🎬 NEXTFLIX — Full-Stack Streaming Platform & Netflix Clone

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-Better--SQLite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-E50914?style=for-the-badge)](LICENSE)
[![Render Ready](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)

> **NEXTFLIX** is a full-stack video streaming platform and authentic Netflix recreation built with pure Vanilla JavaScript, Node.js, Express, and SQLite. Featuring HTTP Range streaming, dynamic video seek, Netflix-style multi-profile management with custom vector avatars & PIN protection, and an integrated Content Management Admin Studio.

---

## 🌟 Key Features

### 1. 🍿 Authentic Netflix Onboarding & Landing Experience
- **Cinematic Video Hero**: Autoplay hero background preview with dark vignette gradients.
- **Interactive Onboarding**: Email subscription capture, real-time input floating labels, and FAQ accordion.
- **Authentication & Sign In**: Full Sign In / Sign Up modal flow with session persistence.

### 2. 👤 "Who's watching?" Multi-Profile System
- **Character Art Avatars**: Pixel-perfect vector character avatars (Red Superhero, Green Alien, Ronnie Monster Kid, Blue Smiley, Purple Shades).
- **Interactive "Manage Profiles" Mode**: Toggle into manage mode to reveal centered edit pencil overlays `✎` and prominent white `[ DONE ]` controls.
- **Dedicated Profile Editor Modal**:
  - Profile name customization.
  - Avatar gallery picker featuring character SVGs, anime covers, and custom image uploads.
  - Maturity audience ratings (*All Maturity Ratings / Teens & Kids / Kids only*).
  - 4-digit PIN lock for private profiles.
  - Profile deletion safeguards.
- **Seamless Navigation**: Includes `← Return to Home` header navigation and intelligent browser history handling (`popstate`) so back navigation never exits unexpectedly.

### 3. 🎥 High-Performance Streaming Engine
- **HTTP 206 Partial Content**: Supports instant seek, scrub, and buffer for `.mp4`, `.mkv`, and `.webm` files.
- **Dynamic Content Rows**: Trending Now, Top 10 Today, Continue Watching with progress bars, and My List bookmarks.
- **Modern Video Player Modal**:
  - Playback speed adjustment (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x).
  - 15s forward & backward scrub buttons.
  - YouTube trailer preview integration.
  - Progress tracker synced to individual active profiles.

### 4. 🛠️ Complete Content Management & Admin Studio
- **Direct Video Upload**: Client-side canvas video frame capture for automated high-res poster generation.
- **Bulk Folder Ingestion**: Scan and import local directories of movies and web series with automatic metadata detection.
- **Live Metadata Editor**: Edit title, category, year, age ratings, banner feature flags, and trailer URLs with instant updates.
- **Admin Security**: Secure credential verification with crypto-salted password hashing.

---

## 🏗️ Architecture & Project Structure

The project features a clean, unified full-stack architecture with no confusing subfolder fragmentation:

```text
nextflix/
├── public/                  # Complete frontend client assets & web pages
│   ├── index.html           # Landing page with video background & onboarding
│   ├── signup.html          # Authentication / Sign Up / Sign In
│   ├── browse.html          # Streaming catalog, video player & profile manager
│   ├── admin.html           # Content Management & Admin Studio
│   ├── admin-settings.html  # Admin security credentials settings
│   ├── app.js               # Streaming catalog, video player & profile logic
│   ├── script.js            # Landing page interactivity & FAQ accordion
│   ├── streamflix.css       # Main streaming UI & profile styling
│   ├── styles.css           # Landing page styles & responsive layout
│   └── images/              # Visual assets, logos, movie artwork
│       └── avatars/         # Vector character avatars (SVG)
├── uploads/                 # Media storage directory & uploaded posters
├── nextflix.db              # SQLite database (migrated tables & seed catalog)
├── server.js                # Express streaming backend & REST API
├── package.json             # Root dependencies & npm scripts
├── render.yaml              # Render 1-click deployment configuration
└── .gitignore               # Excludes large video binaries (>100MB) & node_modules
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### 1. Clone the repository
```bash
git clone https://github.com/alokroushan/nextflix.git
cd nextflix
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the application
```bash
npm start
```

### 4. Open in browser
Visit **`http://localhost:3000`** in your browser.
- **Landing Page**: `http://localhost:3000/`
- **Streaming Platform**: `http://localhost:3000/browse`
- **Admin Studio**: `http://localhost:3000/admin` *(Default password: `admin123`)*

---

## ☁️ Deployment Guide: Render

Render provides out-of-the-box support for persistent Node.js Web Services, SQLite database persistence, and HTTP Range streaming:

1. Create a free account at [render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `https://github.com/alokroushan/nextflix`.
4. Configure the service:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Click **Create Web Service**. Your streaming platform will be live in minutes!

*(Alternatively, use the included [`render.yaml`](render.yaml) for automated Blueprint deployment).*

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/videos` | Fetch videos filtered by audience (`kids`, `teens`, `adults`) and search query | No |
| `POST` | `/api/videos/:id/view` | Increment view counter for a title | No |
| `POST` | `/api/login` | Authenticate admin studio | No |
| `GET` | `/api/session` | Validate admin authentication token | Yes |
| `POST` | `/api/videos` | Upload new video with custom poster and metadata | Yes |
| `PUT` | `/api/videos/:id` | Update metadata, banner feature flag, or age rating | Yes |
| `DELETE` | `/api/videos/:id` | Permanently remove a video and associated poster | Yes |
| `POST` | `/api/import-folder` | Bulk scan and ingest files from server filesystem | Yes |

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Modern Flexbox & CSS Grid), Vanilla ES6+ JavaScript.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 via `better-sqlite3`.
- **Media Processing**: Multer, HTTP 206 Partial Content Range streaming.
- **Security**: Node.js `crypto` with `scrypt` salt-hashing for admin authentication.

---

## 👤 Author

**Alok Roushan**
- GitHub: [@alokroushan](https://github.com/alokroushan)
- Project Repository: [https://github.com/alokroushan/nextflix](https://github.com/alokroushan/nextflix)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

