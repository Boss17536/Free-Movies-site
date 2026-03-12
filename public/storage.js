// Manage LocalStorage for "Continue Watching" and "Watch History"
const Storage = {
    KEYS: {
        CONTINUE_WATCHING: 'continue_watching',
        HISTORY: 'watch_history'
    },

    get(key) {
        try { return JSON.parse(localStorage.getItem(key)) || []; } 
        catch (e) { return []; }
    },

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    saveProgress(itemData) {
        // itemData: { id, title, media_type, type (iframe/m3u8), season, episode, url, timestamp, duration, timestamp_percentage }
        const cw = this.get(this.KEYS.CONTINUE_WATCHING);
        
        // Remove existing entry for same ID
        const filtered = cw.filter(i => i.id !== itemData.id);
        
        // If progress > 95%, remove it entirely (User finished it)
        if (itemData.timestamp_percentage >= 0.95) {
            this.set(this.KEYS.CONTINUE_WATCHING, filtered);
        } else {
            // Keep top 10
            filtered.unshift({ ...itemData, savedAt: Date.now() });
            this.set(this.KEYS.CONTINUE_WATCHING, filtered.slice(0, 10));
        }

        this.addToHistory(itemData);
    },

    addToHistory(itemData) {
        const history = this.get(this.KEYS.HISTORY);
        const filtered = history.filter(i => i.id !== itemData.id);
        filtered.unshift({
            id: itemData.id,
            title: itemData.title,
            media_type: itemData.media_type,
            playedAt: Date.now()
        });
        // Keep top 20
        this.set(this.KEYS.HISTORY, filtered.slice(0, 20));
    },

    getContinueWatching() {
        return this.get(this.KEYS.CONTINUE_WATCHING);
    },

    getHistory() {
        return this.get(this.KEYS.HISTORY);
    }
};

window.AppStorage = Storage;
