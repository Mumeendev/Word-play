const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialize database tables
async function initDB() {
    const client = await pool.connect();
    try {
        // Participants table - stores unique player info and aggregate stats
        await client.query(`
            CREATE TABLE IF NOT EXISTS participants (
                id SERIAL PRIMARY KEY,
                player_name VARCHAR(50) NOT NULL UNIQUE,
                total_games INTEGER DEFAULT 0,
                total_score INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                total_words_formed INTEGER DEFAULT 0,
                total_rounds_played INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Game sessions table - stores each individual game played
        await client.query(`
            CREATE TABLE IF NOT EXISTS game_sessions (
                id SERIAL PRIMARY KEY,
                participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                rounds_played INTEGER NOT NULL,
                words_formed_count INTEGER NOT NULL,
                words_list JSONB DEFAULT '[]',
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes for fast queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_participants_best ON participants(best_score DESC);
            CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(player_name);
            CREATE INDEX IF NOT EXISTS idx_sessions_score ON game_sessions(score DESC);
            CREATE INDEX IF NOT EXISTS idx_sessions_participant ON game_sessions(participant_id);
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        client.release();
    }
}

// Initialize on first load
initDB();

module.exports = { pool, initDB };
