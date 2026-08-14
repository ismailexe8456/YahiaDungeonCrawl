// CloudDatabase.js - Official Supabase PostgreSQL Database Storage Engine & Online Leaderboard
const SUPABASE_URL = "https://hjwxeghthjzdknqzzohx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqd3hlZ2h0aGp6ZGtucXp6b2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDU5ODAsImV4cCI6MjEwMjI4MTk4MH0.zD0nvtQnyl1Hdao2dQxIgl6s6QnGpLf_hv1imRi5LV4";

const CloudDatabase = {
    // Save hero data to Supabase Database (UPSERT via REST API)
    saveToCloud: async function(username, saveData) {
        if (!username || username.trim() === '') {
            throw new Error("Please enter a valid Hero Account Name!");
        }

        const cleanName = username.trim().replace(/[^a-zA-Z0-9_]/g, '_');
        const pData = saveData.playerData || {};

        const payload = {
            username: cleanName,
            class_type: pData.classType || 'Warrior',
            level: pData.level || 1,
            stage: saveData.currentStage || 1,
            gold: pData.gold || 0,
            save_data: saveData,
            updated_at: new Date().toISOString()
        };

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                if (errJson.code === 'PGRST205') {
                    throw new Error("Supabase table 'players' not created yet! Run the SQL snippet in Supabase SQL Editor.");
                }
                throw new Error(errJson.message || "Supabase DB connection error");
            }

            // Save local backup
            localStorage.setItem(`supabase_backup_${cleanName}`, JSON.stringify(payload));
            return payload;
        } catch (err) {
            console.warn("Supabase Save Error, saving to local cloud backup:", err);
            localStorage.setItem(`supabase_backup_${cleanName}`, JSON.stringify(payload));
            throw err;
        }
    },

    // Load hero data from Supabase Database
    loadFromCloud: async function(username) {
        if (!username || username.trim() === '') {
            throw new Error("Please enter a valid Hero Account Name!");
        }

        const cleanName = username.trim().replace(/[^a-zA-Z0-9_]/g, '_');

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/players?username=eq.${encodeURIComponent(cleanName)}`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!res.ok) throw new Error("Could not reach Supabase Database");
            const list = await res.json();

            if (!list || list.length === 0) {
                // Check local backup
                const backup = localStorage.getItem(`supabase_backup_${cleanName}`);
                if (backup) {
                    const parsed = JSON.parse(backup);
                    return { saveData: parsed.save_data || parsed.saveData };
                }
                throw new Error(`No Supabase save record found for hero '${cleanName}'!`);
            }

            return { saveData: list[0].save_data };
        } catch (err) {
            const backup = localStorage.getItem(`supabase_backup_${cleanName}`);
            if (backup) {
                const parsed = JSON.parse(backup);
                return { saveData: parsed.save_data || parsed.saveData };
            }
            throw err;
        }
    },

    // Retrieve Global Online Leaderboard from Supabase DB
    fetchLeaderboard: async function() {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/players?select=username,class_type,level,stage,gold&order=stage.desc,level.desc,gold.desc&limit=10`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!res.ok) return [];
            const list = await res.json();

            return list.map(item => ({
                username: item.username,
                classType: item.class_type,
                level: item.level,
                stage: item.stage,
                gold: item.gold
            }));
        } catch (err) {
            console.error("Supabase Leaderboard Fetch Error:", err);
            return [];
        }
    }
};
