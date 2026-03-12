// Player handling logic
const Player = {
    wrapper: document.getElementById('player-wrapper'),
    titleEl: document.getElementById('player-title'),
    view: document.getElementById('player-view'),
    searchView: document.getElementById('search-view'),
    
    currentItem: null,
    progressInterval: null,
    
    // Fallback tracker for iframes
    fakeProgress: 0, 

    init() {
        // Listen to messages from iframes (e.g., VidLink might send time updates)
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'timeupdate' && this.currentItem) {
                const percentage = e.data.currentTime / e.data.duration;
                this.saveState(e.data.currentTime, e.data.duration, percentage);
            }
        });
    },

    open(title, data, itemContext) {
        this.currentItem = { ...itemContext, title, data };
        this.titleEl.textContent = title;
        this.wrapper.innerHTML = '';
        this.fakeProgress = 0; // Reset fake progress

        const sources = data.sources || [{ name: 'Default', url: data.url }];
        
        const sourceBtns = sources.map((s, i) => 
            `<button class="source-btn" data-url="${s.url}" data-type="${data.type}">${s.name}</button>`
        ).join('');

        this.wrapper.innerHTML = `
            <div id="source-selector">
                <span style="color: #888; font-size: 0.9rem;">Servers:</span>
                ${sourceBtns}
                <button id="fullscreen-btn" class="source-btn nav-item" style="background:#1d3557; margin-left:15px;">Full Screen</button>
                ${itemContext.hasNextEpisode ? '<button id="next-ep-btn" class="source-btn nav-item" style="background:#2d6a4f; margin-left:20px;">Next Episode >></button>' : ''}
            </div>
            <div id="media-container" class="nav-item" style="width:100%; height:calc(100% - 60px); border: 4px solid transparent; box-sizing: border-box;"></div>
        `;

        this.searchView.style.display = 'none';
        this.view.style.display = 'flex';

        const fsBtn = this.wrapper.querySelector('#fullscreen-btn');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => {
                const container = document.getElementById('media-container');
                if (!document.fullscreenElement) {
                    container.requestFullscreen().catch(err => console.error(err));
                } else {
                    document.exitFullscreen();
                }
            });
        }

        const btns = Array.from(this.wrapper.querySelectorAll('.source-btn:not(#next-ep-btn)'));
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                btns.forEach(b => b.classList.remove('active-source'));
                e.target.classList.add('active-source');
                this.loadMedia(e.target.dataset.url, e.target.dataset.type);
            });
        });

        const nextBtn = this.wrapper.querySelector('#next-ep-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.close();
                window.App.playNextEpisode();
            });
        }

        if (btns.length > 0) {
            btns[0].classList.add('active-source');
            this.loadMedia(btns[0].dataset.url, data.type);
        }

        // Start fallback progress tracker (adds 1% every 30 seconds for iframes that don't emit events)
        this.progressInterval = setInterval(() => {
            this.fakeProgress = Math.min(this.fakeProgress + 0.01, 1);
            this.saveState(this.fakeProgress * 3000, 3000, this.fakeProgress); // Fake 50min duration
        }, 30000); 

        window.App.setZone('player');
    },

    loadMedia(url, type) {
        const container = document.getElementById('media-container');
        if (type === 'm3u8') {
            container.innerHTML = `<video id="video-player" src="${url}" controls autoplay style="width:100%;height:100%;background:#000;outline:none;"></video>`;
            const video = container.querySelector('video');
            video.addEventListener('timeupdate', () => {
                if (video.duration) {
                    const percentage = video.currentTime / video.duration;
                    this.saveState(video.currentTime, video.duration, percentage);
                    // Auto play next episode if close to end
                    if (percentage > 0.98 && this.currentItem.hasNextEpisode) {
                        this.close();
                        window.App.playNextEpisode();
                    }
                }
            });
        } else {
            // Iframe
            container.innerHTML = `<iframe id="video-iframe" src="${url}" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:100%;border:none;outline:none;"></iframe>`;
        }
        setTimeout(() => window.App.buildNavGrid(), 100);
    },

    saveState(time, duration, percentage) {
        if (!this.currentItem) return;
        window.AppStorage.saveProgress({
            id: this.currentItem.id,
            title: this.currentItem.title,
            media_type: this.currentItem.media_type,
            season: this.currentItem.season,
            episode: this.currentItem.episode,
            url: this.currentItem.data.url,
            providerEpisodes: this.currentItem.providerEpisodes,
            timestamp_percentage: percentage
        });
    },

    close() {
        if (this.progressInterval) clearInterval(this.progressInterval);
        this.wrapper.innerHTML = '';
        this.view.style.display = 'none';
        this.searchView.style.display = 'flex';
        this.currentItem = null;
        window.App.renderDynamicSections(); // Refresh Continue Watching
        
        if (window.App.episodesContainer.style.display === 'block') {
            window.App.setZone('episodes');
        } else if (window.App.searchResults.style.display === 'block') {
            window.App.setZone('search');
        } else {
            window.App.setZone('home');
        }
    }
};

window.Player = Player;
