const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
// Optional: Your self-hosted consumet instance or public proxy
const CONSUMET_URL = process.env.CONSUMET_URL || 'https://consumet-api-clone.vercel.app/anime/gogoanime';

// Simple in-memory cache for API requests
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 mins
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) { cache.set(key, { data, ts: Date.now() }); }

router.get('/', async (req, res) => {
  try {
    const { q, lang } = req.query;
    if (!q) return res.json({ results: [] });

    const cacheKey = `search_${q}_${lang}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json({ results: cached });

    // 1. Search TMDB (Movies & Series)
    const tmdbParams = { api_key: TMDB_API_KEY, query: q };
    if (lang === 'hi') {
      tmdbParams.language = 'hi-IN';
      tmdbParams.region = 'IN';
    }
    
    const tmdbReq = axios.get(`${TMDB_BASE}/search/multi`, { params: tmdbParams }).catch(() => ({ data: { results: [] } }));
    
    // 2. Search Consumet (Anime)
    // Wrap in try-catch so it doesn't break if consumet is down
    const animeReq = axios.get(`${CONSUMET_URL}/${q}`).catch(() => ({ data: { results: [] } }));

    const [tmdbRes, animeRes] = await Promise.all([tmdbReq, animeReq]);

    const results = [];

    // Parse TMDB Results
    if (tmdbRes.data && tmdbRes.data.results) {
      const tmdbItems = tmdbRes.data.results
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
        .map(item => ({
          id: item.id.toString(),
          media_type: item.media_type,
          title: item.title || item.name,
          year: (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A',
          lang: item.original_language,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null,
          provider: 'tmdb'
        }));
      results.push(...tmdbItems);
    }

    // Parse Consumet Anime Results
    if (animeRes.data && animeRes.data.results) {
      const animeItems = animeRes.data.results.map(item => ({
        id: item.id,
        media_type: 'anime', // custom tag for frontend
        title: item.title,
        year: item.releaseDate || 'N/A',
        lang: 'ja',
        poster: item.image || null,
        provider: 'consumet'
      }));
      // Limit anime results so they don't flood TMDB results
      results.push(...animeItems.slice(0, 5)); 
    }

    setCache(cacheKey, results);
    res.json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
