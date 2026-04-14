const { pool } = require('./db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Fetch top 50 players by best score
            const result = await pool.query(`
                SELECT 
                    player_name,
                    best_score AS score,
                    total_games,
                    total_score,
                    total_words_formed,
                    total_rounds_played,
                    created_at
                FROM participants 
                ORDER BY best_score DESC 
                LIMIT 50
            `);

            return res.status(200).json({
                success: true,
                scores: result.rows
            });

        } else if (req.method === 'POST') {
            // Save a new game session and update participant stats
            const { playerName, score, roundsPlayed, wordsFormed, wordsList } = req.body;

            if (!playerName || score === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Player name and score are required'
                });
            }

            if (typeof score !== 'number' || score < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid score value'
                });
            }

            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Insert or update participant
                const participantResult = await client.query(`
                    INSERT INTO participants (player_name, total_games, total_score, best_score, total_words_formed, total_rounds_played, updated_at)
                    VALUES ($1, 1, $2, $2, $3, $4, NOW())
                    ON CONFLICT (player_name) DO UPDATE SET
                        total_games = participants.total_games + 1,
                        total_score = participants.total_score + $2,
                        best_score = GREATEST(participants.best_score, $2),
                        total_words_formed = participants.total_words_formed + $3,
                        total_rounds_played = participants.total_rounds_played + $4,
                        updated_at = NOW()
                    RETURNING id
                `, [playerName.trim(), score, wordsFormed || 0, roundsPlayed || 1]);

                const participantId = participantResult.rows[0].id;

                // Insert game session
                await client.query(`
                    INSERT INTO game_sessions (participant_id, score, rounds_played, words_formed_count, words_list)
                    VALUES ($1, $2, $3, $4, $5)
                `, [participantId, score, roundsPlayed || 1, wordsFormed || 0, JSON.stringify(wordsList || [])]);

                await client.query('COMMIT');

                return res.status(201).json({
                    success: true,
                    message: 'Score and participant details saved successfully',
                    participantId: participantId
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } else {
            return res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
