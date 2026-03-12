# Minimal Streaming Web App

**THIS PROJECT CONTAINS NO PIRATED CONTENT — YOU MUST PROVIDE LEGAL STREAM URLs OR USE LEGITIMATE EMBED ENDPOINTS.**

An optimized, minimalist streaming web application featuring a fast Node.js/Express backend and a responsive frontend UI. Designed for performance, clean navigation, and ease of deployment on any web server.

## Key Features
- **High-Performance UI:** Fast, responsive interface built with vanilla JS and CSS for zero-bloat performance.
- **Optimized Metadata Parser:** TMDB API integration with intelligent caching and rate-limiting.
- **Clean Architecture:** Simple search-to-stream workflow with minimal dependencies.
- **Privacy-First:** Local storage for user preferences and state.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js (v14+)**

### 🚀 Deployment (Vercel)

1. **Push to GitHub:** Your code is already prepared for Vercel with `vercel.json`.
2. **Connect to Vercel:** Import your repository.
3. **CRITICAL: Set Environment Variables:** 
   In Vercel, go to **Settings** > **Environment Variables** and add:
   - `TMDB_API_KEY`: Your TMDB API v3 Key.
   - *Without this, search results will be empty on the live site.*

---

## 🖥️ Usage

1. Open your browser to `http://localhost:3000`.
2. Use the search bar to find content.
3. Select a title to view details and start streaming.

### Keyboard & Mouse Navigation
- **Fully Optimized:** Supports both mouse/touch and keyboard navigation (Arrow keys/Enter) for a seamless experience on any device.

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Metadata:** TMDB API
- **Frontend:** Vanilla HTML5/CSS3/JavaScript
- **Compression:** Gzip/Brotli via Express compression
- **Security:** Helmet.js for secure HTTP headers

---

*Note: This is a developer-centric prototype. Ensure all content sources comply with local regulations.*
