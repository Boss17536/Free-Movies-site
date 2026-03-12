'use strict';

window.Player.init();

const App = {
    // UI Elements
    searchInput: document.getElementById('search-input'),
    langToggle: document.getElementById('lang-toggle'),
    homeContainer: document.getElementById('home-container'),
    searchResults: document.getElementById('search-results'),
    episodesContainer: document.getElementById('episodes-container'),
    
    // State
    currentLang: 'hi',
    currentZone: 'home', // 'home', 'search', 'episodes', 'player'
    navGrid: [], 
    navRow: 0,
    navCol: 0,
    debounceTimer: null,
    
    // Playback state
    currentSeriesData: null,
    
    init() {
        this.langToggle.addEventListener('click', () => {
            this.currentLang = this.currentLang === 'en' ? 'hi' : 'en';
            this.langToggle.textContent = this.currentLang.toUpperCase();
            this.langToggle.classList.toggle('hi-active', this.currentLang === 'hi');
            if (this.searchInput.value.trim()) this.doSearch();
        });

        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.doSearch(), 600);
        });

        // Initialize Home Sections
        this.renderDynamicSections();
        this.loadTopIndian();

        // Setup remote controls
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // Initial focus
        this.setZone('home');
    },

    setZone(zone) {
        this.currentZone = zone;
        this.buildNavGrid();
        
        // Focus search input by default if returning to home/search and it's empty
        if ((zone === 'home' || zone === 'search') && this.navGrid.length > 0) {
            this.navRow = 0;
            this.navCol = 1; // 1 is usually search input
            if(!this.navGrid[0][1]) this.navCol = 0;
        } else {
            this.navRow = 0;
            this.navCol = 0;
        }
        this.updateNav();
    },

    buildNavGrid() {
        this.navGrid = [];
        // Row 0 is always header
        this.navGrid.push([this.langToggle, this.searchInput]);

        if (this.currentZone === 'home') {
            ['cw-section', 'history-section', 'top-indian-section'].forEach(secId => {
                const sec = document.getElementById(secId);
                if (sec && sec.style.display !== 'none') {
                    const items = Array.from(sec.querySelectorAll('.nav-item'));
                    if (items.length > 0) this.navGrid.push(items);
                }
            });
        } else if (this.currentZone === 'search') {
            const items = Array.from(this.searchResults.querySelectorAll('.nav-item'));
            items.forEach(item => this.navGrid.push([item])); // List view
        } else if (this.currentZone === 'episodes') {
            const items = Array.from(this.episodesContainer.querySelectorAll('.nav-item'));
            items.forEach(item => this.navGrid.push([item])); // List view
        } else if (this.currentZone === 'player') {
            const backBtn = document.getElementById('back-btn');
            const items = Array.from(document.getElementById('player-wrapper').querySelectorAll('.source-btn, #next-ep-btn, #fullscreen-btn'));
            const mediaBox = document.getElementById('media-container');
            this.navGrid = [[backBtn], items];
            if (mediaBox) this.navGrid.push([mediaBox]);
        }
    },

    updateNav() {
        document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        
        if (!this.navGrid[this.navRow]) this.navRow = 0;
        if (!this.navGrid[this.navRow] || !this.navGrid[this.navRow][this.navCol]) {
            this.navCol = 0;
        }

        const activeEl = this.navGrid[this.navRow]?.[this.navCol];
        if (activeEl) {
            activeEl.classList.add('active');
            activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
            if (activeEl === this.searchInput) {
                this.searchInput.focus();
            } else {
                document.activeElement.blur();
            }
        }
    },

    handleKeydown(e) {
        // Back / Exit (Escape or Backspace)
        if (e.keyCode === 27 || e.keyCode === 8) {
            if (this.currentZone === 'player') {
                e.preventDefault();
                window.Player.close();
                return;
            }
            if (this.currentZone === 'episodes') {
                e.preventDefault();
                this.episodesContainer.style.display = 'none';
                this.searchResults.style.display = 'block';
                this.setZone('search');
                return;
            }
            if (document.activeElement === this.searchInput && e.keyCode === 8 && this.searchInput.value.length > 0) return;
        }

        if (!this.navGrid.length) return;

        switch (e.keyCode) {
            case 38: // Up
                e.preventDefault();
                if (this.navRow > 0) {
                    this.navRow--;
                    // Map column if previous row is shorter
                    if (this.navCol >= this.navGrid[this.navRow].length) {
                        this.navCol = this.navGrid[this.navRow].length - 1;
                    }
                    this.updateNav();
                }
                break;
            case 40: // Down
                e.preventDefault();
                if (this.navRow < this.navGrid.length - 1) {
                    this.navRow++;
                    if (this.navCol >= this.navGrid[this.navRow].length) {
                        this.navCol = this.navGrid[this.navRow].length - 1;
                    }
                    this.updateNav();
                }
                break;
            case 37: // Left
                e.preventDefault();
                if (this.navCol > 0) {
                    this.navCol--;
                    this.updateNav();
                }
                break;
            case 39: // Right
                e.preventDefault();
                if (this.navCol < this.navGrid[this.navRow].length - 1) {
                    this.navCol++;
                    this.updateNav();
                }
                break;
            case 13: // Enter
                e.preventDefault();
                const activeEl = this.navGrid[this.navRow]?.[this.navCol];
                if (activeEl) {
                    if (activeEl.id === 'media-container') {
                        const vid = document.getElementById('video-player');
                        const ifr = document.getElementById('video-iframe');
                        if (vid) {
                            if(vid.paused) vid.play(); else vid.pause();
                            vid.focus();
                        } else if (ifr) {
                            ifr.focus();
                        }
                        activeEl.style.borderColor = '#ffcc00';
                        setTimeout(() => activeEl.style.borderColor = 'transparent', 500);
                    } else {
                        activeEl.click();
                    }
                }
                break;
        }
    },

    async doSearch() {
        const q = this.searchInput.value.trim();
        if (!q) {
            this.searchResults.innerHTML = '';
            this.homeContainer.style.display = 'block';
            this.setZone('home');
            return;
        }

        this.homeContainer.style.display = 'none';
        this.episodesContainer.style.display = 'none';
        this.searchResults.innerHTML = '<div style="padding:14px;color:#888">Searching...</div>';
        
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&lang=${this.currentLang}`);
            const data = await res.json();
            this.renderSearchResults(data.results || []);
        } catch (err) {
            this.searchResults.innerHTML = `<div style="padding:14px;color:#f55">Error: ${err.message}</div>`;
        }
    },

    renderSearchResults(results) {
        this.searchResults.innerHTML = '';
        if (!results.length) {
            this.searchResults.innerHTML = '<div style="padding:14px;color:#888">No results found</div>';
            return;
        }

        results.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item nav-item';
            
            const badgeMap = {
                'anime': '<span class="hi-badge" style="background:#e63946">ANIME</span>',
                'tv': '<span class="hi-badge" style="background:#2d6a4f">TV</span>',
                'movie': '<span class="hi-badge" style="background:#1d3557">MOVIE</span>'
            };
            const badge = badgeMap[item.media_type] || '';
            const yearStr = item.year && item.year !== 'N/A' ? ` (${item.year})` : '';
            
            div.innerHTML = `[${item.media_type.toUpperCase()}] ${item.title}${yearStr} ${badge}`;
            div.addEventListener('click', () => this.handleResultSelect(item));
            this.searchResults.appendChild(div);
        });

        this.searchResults.style.display = 'block';
        this.setZone('search');
    },

    renderDynamicSections() {
        const cw = window.AppStorage.getContinueWatching();
        const cwContainer = document.getElementById('cw-container');
        if (cw.length > 0) {
            document.getElementById('cw-section').style.display = 'block';
            cwContainer.innerHTML = cw.map(item => `
                <div class="card nav-item" onclick="App.resumeItem('${item.id}')">
                    <div class="title">${item.title}</div>
                    <div class="subtitle">${item.media_type === 'movie' ? 'Movie' : `S${item.season} E${item.episode}`}</div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${(item.timestamp_percentage || 0)*100}%"></div></div>
                </div>
            `).join('');
        } else {
            document.getElementById('cw-section').style.display = 'none';
        }

        const hist = window.AppStorage.getHistory();
        const histContainer = document.getElementById('history-container');
        if (hist.length > 0) {
            document.getElementById('history-section').style.display = 'block';
            histContainer.innerHTML = hist.slice(0, 10).map(item => `
                <div class="card nav-item" onclick="App.handleResultSelect({id:'${item.id}', media_type:'${item.media_type}', title:'${item.title.replace(/'/g, "\\'")}'})">
                    <div class="title">${item.title}</div>
                    <div class="subtitle">${item.media_type.toUpperCase()}</div>
                </div>
            `).join('');
        } else {
            document.getElementById('history-section').style.display = 'none';
        }

        if (this.currentZone === 'home') this.buildNavGrid(); // Rebuild grid if we updated DOM
    },

    resumeItem(id) {
        const cw = window.AppStorage.getContinueWatching().find(i => i.id === id);
        if (!cw) return;
        
        // Setup current series data to allow next episode
        this.currentSeriesData = { id: cw.id, title: cw.title, providerEpisodes: cw.providerEpisodes };
        
        // Simple mock of data to feed into player
        const playData = { sources: [{name: 'Resume', url: cw.url}], type: cw.url.includes('m3u8') ? 'm3u8' : 'iframe' };
        
        let hasNext = false;
        if (cw.media_type !== 'movie' && cw.episode) {
            // Very naive "has next" check based on typical episode lengths if we don't have full list
            if (cw.providerEpisodes && cw.providerEpisodes.length > parseInt(cw.episode)) {
                hasNext = true;
            } else if (!cw.providerEpisodes) {
                hasNext = true; // Assume true for TV, handle error later
            }
        }
        
        const label = cw.media_type === 'movie' ? cw.title : `${cw.title} - S${cw.season}E${cw.episode}`;
        window.Player.open(label, playData, {
            id: cw.id,
            media_type: cw.media_type,
            season: cw.season,
            episode: cw.episode,
            hasNextEpisode: hasNext,
            providerEpisodes: cw.providerEpisodes
        });
    },

    async loadTopIndian() {
        try {
            const res = await fetch('/api/content/top-indian');
            const data = await res.json();
            const container = document.getElementById('top-indian-container');
            container.innerHTML = data.results.slice(0, 10).map(item => `
                <div class="card nav-item" onclick="App.handleResultSelect({id:'${item.id}', media_type:'${item.media_type}', title:'${item.title.replace(/'/g, "\\'")}'})">
                    <div class="title">${item.title}</div>
                    <div class="subtitle">${item.media_type.toUpperCase()}</div>
                </div>
            `).join('');
            if (this.currentZone === 'home') this.buildNavGrid();
        } catch (e) { console.error('Error loading top indian', e); }
    },

    async loadRecommendations(type, id) {
        try {
            const res = await fetch(`/api/content/recommendations/${type}/${id}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const recContainer = document.createElement('div');
                recContainer.innerHTML = `
                    <h3 style="margin:20px 0 10px; color:#ffcc00">Recommended for you</h3>
                    <div class="horizontal-scroll">
                        ${data.results.slice(0, 8).map(item => `
                            <div class="card nav-item" onclick="App.handleResultSelect({id:'${item.id}', media_type:'${item.media_type}', title:'${item.title.replace(/'/g, "\\'")}'})">
                                <div class="title">${item.title}</div>
                                <div class="subtitle">${item.media_type.toUpperCase()}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
                this.episodesContainer.appendChild(recContainer);
                this.buildNavGrid(); // Rebuild with recs
            }
        } catch (e) {}
    },

    async handleResultSelect(item) {
        this.searchResults.style.display = 'none';
        this.homeContainer.style.display = 'none';
        this.episodesContainer.style.display = 'block';
        this.episodesContainer.innerHTML = '<div style="padding:14px;color:#888">Loading...</div>';

        // Add to basic history immediately
        window.AppStorage.addToHistory({ id: item.id, title: item.title, media_type: item.media_type });

        if (item.media_type === 'movie') {
            await this.playMovie(item.id, item.title);
        } else if (item.media_type === 'anime') {
            await this.loadAnime(item.id, item.title);
        } else {
            await this.loadTvSeasons(item.id, item.title);
        }
    },

    async playMovie(id, title) {
        try {
            const langParam = this.currentLang === 'hi' ? '?lang=hi' : '';
            const res = await fetch(`/api/content/movie/${id}${langParam}`);
            const data = await res.json();
            
            // Render back button in episodes view as a placeholder while playing
            this.episodesContainer.innerHTML = `<button class="nav-item" onclick="App.setZone('search')">Back to Search</button>`;
            
            window.Player.open(title, data, { id, media_type: 'movie', hasNextEpisode: false });
        } catch (err) {
            alert('Error: ' + err.message);
        }
    },

    async loadTvSeasons(id, title) {
        try {
            const res = await fetch(`/api/content/tv/${id}`);
            const data = await res.json();
            this.currentSeriesData = { id, title, type: 'tv' };
            this.renderEpisodesList(data.seasons, id, title, 'tv');
            this.loadRecommendations('tv', id);
        } catch (err) {
            this.episodesContainer.innerHTML = `<div style="padding:14px;color:#f55">Error: ${err.message}</div>`;
        }
    },

    async loadAnime(id, title) {
        try {
            const res = await fetch(`/api/content/anime/${id}`);
            const data = await res.json();
            this.currentSeriesData = { id, title, type: 'anime', providerEpisodes: data.seasons[0].providerEpisodes };
            this.renderEpisodesList(data.seasons, id, title, 'anime');
        } catch (err) {
            this.episodesContainer.innerHTML = `<div style="padding:14px;color:#f55">Error: ${err.message}</div>`;
        }
    },

    renderEpisodesList(seasons, seriesId, showTitle, type) {
        this.episodesContainer.innerHTML = `<h2 style="color:#fff; padding:10px;">${showTitle}</h2>`;
        
        seasons.forEach((seasonObj) => {
            const header = document.createElement('div');
            header.className = 'season-header';
            header.textContent = seasonObj.name || `Season ${seasonObj.season}`;
            this.episodesContainer.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'episode-grid';

            if (type === 'anime' && seasonObj.providerEpisodes) {
                seasonObj.providerEpisodes.forEach((ep, idx) => {
                    const li = document.createElement('div');
                    li.className = 'episode-item nav-item';
                    li.textContent = `Ep ${ep.number}`;
                    // Pass the real provider ID for playing
                    li.addEventListener('click', () => this.playEpisode(seriesId, seasonObj.season, idx + 1, `${showTitle} - Ep ${ep.number}`, type, ep.id));
                    grid.appendChild(li);
                });
            } else {
                for (let ep = 1; ep <= seasonObj.episodes; ep++) {
                    const li = document.createElement('div');
                    li.className = 'episode-item nav-item';
                    li.textContent = `S${seasonObj.season}E${ep}`;
                    li.addEventListener('click', () => this.playEpisode(seriesId, seasonObj.season, ep, `${showTitle} - S${seasonObj.season}E${ep}`, type));
                    grid.appendChild(li);
                }
            }
            this.episodesContainer.appendChild(grid);
        });

        this.setZone('episodes');
    },

    async playEpisode(seriesId, season, episodeNum, label, type, providerEpId = null) {
        try {
            let data;
            if (type === 'anime') {
                const res = await fetch(`/api/content/anime/watch/${encodeURIComponent(providerEpId)}`);
                data = await res.json();
            } else {
                const langParam = this.currentLang === 'hi' ? '?lang=hi' : '';
                const res = await fetch(`/api/content/tv/${seriesId}/${season}/${episodeNum}${langParam}`);
                data = await res.json();
            }

            // Figure out if next episode exists
            let hasNext = false;
            if (this.currentSeriesData) {
                this.currentSeriesData.lastSeason = season;
                this.currentSeriesData.lastEpisodeNum = episodeNum;
                this.currentSeriesData.lastType = type;
                
                if (type === 'anime' && this.currentSeriesData.providerEpisodes) {
                    hasNext = episodeNum < this.currentSeriesData.providerEpisodes.length;
                } else {
                    hasNext = true; // For TV, we just assume yes, let the next fetch fail gracefully if not
                }
            }

            window.Player.open(label, data, { 
                id: seriesId, 
                media_type: type, 
                season, 
                episode: episodeNum,
                providerEpisodes: this.currentSeriesData ? this.currentSeriesData.providerEpisodes : null,
                hasNextEpisode: hasNext 
            });
        } catch (err) {
            alert('Error playing episode: ' + err.message);
        }
    },

    playNextEpisode() {
        if (!this.currentSeriesData) return;
        
        let nextEp = parseInt(this.currentSeriesData.lastEpisodeNum) + 1;
        let season = this.currentSeriesData.lastSeason;
        
        // Very basic next episode logic. For TV it assumes season doesn't change yet.
        // A robust system would check the full season list and roll over to season+1
        
        let label = `${this.currentSeriesData.title} - S${season}E${nextEp}`;
        let providerEpId = null;
        
        if (this.currentSeriesData.type === 'anime' && this.currentSeriesData.providerEpisodes) {
            // Episode arrays are usually 0-indexed, so ep 1 is index 0.
            const epData = this.currentSeriesData.providerEpisodes[nextEp - 1]; 
            if (epData) {
                providerEpId = epData.id;
                label = `${this.currentSeriesData.title} - Ep ${epData.number}`;
            } else {
                alert("No more episodes!");
                return;
            }
        }

        this.playEpisode(this.currentSeriesData.id, season, nextEp, label, this.currentSeriesData.type, providerEpId);
    }
};

window.App = App;
window.onload = () => App.init();
