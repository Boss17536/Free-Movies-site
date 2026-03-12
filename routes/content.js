const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const CONSUMET_URL = process.env.CONSUMET_URL || 'https://consumet-api-clone.vercel.app/anime/gogoanime';

// Cache helper
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) { cache.set(key, { data, ts: Date.now() }); }

async function tmdbGet(path, params = {}) {
  const cacheKey = path + JSON.stringify(params);
  const cached = getCache(cacheKey);
  if (cached) return cached;
  const res = await axios.get(`${TMDB_BASE}${path}`, { params: { api_key: TMDB_API_KEY, ...params } });
  setCache(cacheKey, res.data);
  return res.data;
}

// 1. Top 100 Indian Movies & Shows
router.get('/top-indian', async (req, res) => {
  try {
    const cached = getCache('top_indian');
    if (cached) return res.json(cached);

    const [movies, tv] = await Promise.all([
      tmdbGet('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc', page: 1 }),
      tmdbGet('/discover/tv', { with_original_language: 'hi', sort_by: 'popularity.desc', page: 1 })
    ]);

    const formatItems = (items, type) => items.map(item => ({
      id: item.id.toString(),
      media_type: type,
      title: item.title || item.name,
      year: (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A',
      lang: item.original_language,
      provider: 'tmdb'
    }));

    const results = [...formatItems(movies.results, 'movie'), ...formatItems(tv.results, 'tv')];
    // Sort combined by popularity (approximate)
    setCache('top_indian', { results });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Top 100' });
  }
});

// 2. Recommendations
router.get('/recommendations/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    if (type === 'anime') return res.json({ results: [] }); // Stub for anime recs
    const data = await tmdbGet(`/${type}/${id}/recommendations`);
    const results = data.results.slice(0, 10).map(item => ({
      id: item.id.toString(),
      media_type: type,
      title: item.title || item.name,
      year: (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A'
    }));
    res.json({ results });
  } catch (err) {
    res.json({ results: [] });
  }
});

// 3. Streaming Links: Movie
router.get('/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isHindi = req.query.lang === 'hi';
    const sources = [];
    if (isHindi) {
        sources.push({ name: 'VidLink (Dual)', url: `https://vidlink.pro/movie/${id}` });
        sources.push({ name: 'AutoEmbed (HI)', url: `https://player.autoembed.cc/embed/movie/${id}?server=2` });
        sources.push({ name: 'VidSrc ME', url: `https://vidsrc.me/embed/movie?tmdb=${id}` });
    } else {
        sources.push({ name: 'VidLink (Dual)', url: `https://vidlink.pro/movie/${id}` });
        sources.push({ name: 'AutoEmbed (EN)', url: `https://player.autoembed.cc/embed/movie/${id}?dub=1` });
        sources.push({ name: 'VidSrc PRO', url: `https://vidsrc.pro/embed/movie/${id}` });
    }
    res.json({ type: 'iframe', sources, url: sources[0].url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie sources' });
  }
});

// 4. TV Seasons List
router.get('/tv/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const show = await tmdbGet(`/tv/${id}`);
    const seasons = show.seasons
      .filter(s => s.season_number > 0)
      .map(s => ({ season: s.season_number, episodes: s.episode_count || 0, name: s.name || `Season ${s.season_number}` }));
    res.json({ id, title: show.name, seasons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Streaming Links: TV Episode
router.get('/tv/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const isHindi = req.query.lang === 'hi';
    const sources = [];
    if (isHindi) {
        sources.push({ name: 'VidLink (Dual)', url: `https://vidlink.pro/tv/${id}/${season}/${episode}` });
        sources.push({ name: 'AutoEmbed (HI)', url: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}?server=2` });
        sources.push({ name: 'VidSrc ME', url: `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&ep=${episode}` });
    } else {
        sources.push({ name: 'VidLink (Dual)', url: `https://vidlink.pro/tv/${id}/${season}/${episode}` });
        sources.push({ name: 'AutoEmbed (EN)', url: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}?dub=1` });
        sources.push({ name: 'VidSrc PRO', url: `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}` });
    }
    res.json({ type: 'iframe', sources, url: sources[0].url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch TV sources' });
  }
});

// 6. Anime Info & Episodes (Consumet)
router.get('/anime/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const animeRes = await axios.get(`${CONSUMET_URL}/info/${id}`);
    const data = animeRes.data;
    const episodes = data.episodes || [];
    // Convert to standard season structure for frontend
    res.json({
      id,
      title: data.title,
      seasons: [{ season: 1, episodes: episodes.length, name: 'Episodes', providerEpisodes: episodes }]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Anime info' });
  }
});

// 7. Streaming Links: Anime Episode
router.get('/anime/watch/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    // Note: To map properly, episodeId should be the consumet episode id (e.g., "naruto-episode-1")
    const streamRes = await axios.get(`${CONSUMET_URL}/watch/${episodeId}`);
    const sources = streamRes.data.sources.map(s => ({ name: s.quality, url: s.url }));
    // Consumet usually returns raw m3u8. We need a player for it or we can just send the highest quality.
    // For minimal setup, we can use a basic HTML5 video player wrapper.
    res.json({ type: 'm3u8', sources, url: sources.find(s => s.quality === 'default' || s.quality === '1080p')?.url || sources[0].url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Anime stream' });
  }
});

module.exports = router;
