// CloudDatabase.js - Realtime Cloud Database Storage & Global Leaderboard Engine
const CLOUD_DB_URL = "https://dungeon-crawl-default-rtdb.firebaseio.com/players";

const CloudDatabase = {
    // Save hero data to cloud DB by unique username/hero name
    saveToCloud: async function(username, saveData) {
        if (!username || username.trim() === '') {
            throw new Error("Please enter a valid Hero Name to save to the Cloud Database!");
        }

        const cleanName = username.trim().replace(/[^a-zA-Z0-9_]/g, '_');
        const payload = {
            username: cleanName,
            timestamp: new Date().toLocaleString(),
            updatedAt: Date.now(),
            stage: saveData.currentStage || 1,
            level: saveData.playerData ? saveData.playerData.level : 1,
            classType: saveData.playerData ? saveData.playerData.classType : 'Warrior',
            gold: saveData.playerData ? saveData.playerData.gold : 0,
            saveData: saveData
        };

        try {
            const res = await fetch(`${CLOUD_DB_URL}/${encodeURIComponent(cleanName)}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Cloud DB network response was not ok");
            return payload;
        } catch (err) {
            console.warn("Cloud DB fallback to local store:", err);
            localStorage.setItem(`cloud_db_backup_${cleanName}`, JSON.stringify(payload));
            return payload;
        }
    },

    // Load hero data from cloud DB
    loadFromCloud: async function(username) {
        if (!username || username.trim() === '') {
            throw new Error("Please enter a valid Hero Name to load from Cloud Database!");
        }

        const cleanName = username.trim().replace(/[^a-zA-Z0-9_]/g, '_');

        try {
            const res = await fetch(`${CLOUD_DB_URL}/${encodeURIComponent(cleanName)}.json`);
            if (!res.ok) throw new Error("Could not reach Cloud DB");
            const data = await res.json();

            if (!data || !data.saveData) {
                // Check local backup
                const backup = localStorage.getItem(`cloud_db_backup_${cleanName}`);
                if (backup) return JSON.parse(backup);
                throw new Error(`No Cloud DB record found for hero '${cleanName}'!`);
            }

            return data;
        } catch (err) {
            const backup = localStorage.getItem(`cloud_db_backup_${cleanName}`);
            if (backup) return JSON.parse(backup);
            throw err;
        }
    },

    // Retrieve Global Online Leaderboard (Top Players worldwide)
    fetchLeaderboard: async function() {
        try {
            const res = await fetch(`${CLOUD_DB_URL}.json`);
            if (!res.ok) return [];
            const data = await res.json();
            if (!data) return [];

            const list = Object.values(data).filter(p => p && p.username);
            // Sort by Stage descending, then Level descending, then Gold descending
            list.sort((a, b) => {
                if (b.stage !== a.stage) return b.stage - a.stage;
                if (b.level !== a.level) return b.level - a.level;
                return b.gold - a.gold;
            });

            return list.slice(0, 10);
        } catch (err) {
            console.error("Leaderboard fetch error:", err);
            return [];
        }
    }
};
