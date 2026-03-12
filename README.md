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

### Installation

1. **Clone and Install:**
   ```bash
   npm install
   ```

2. **Configuration:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your **TMDB API v3 Key** to the `TMDB_API_KEY` field in `.env`.

3. **Launch:**
   - **Development:** `npm run dev` (uses nodemon)
   - **Production:** `npm start`

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
