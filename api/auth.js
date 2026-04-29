const { pool } = require('./db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { action, playerName, password } = req.body;

    if (!playerName || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    try {
        const client = await pool.connect();

        try {
            if (action === 'signup') {
                // Check if user exists
                const existing = await client.query('SELECT id FROM participants WHERE player_name = $1', [playerName.trim()]);
                
                if (existing.rows.length > 0) {
                    return res.status(400).json({ success: false, error: 'Username already taken' });
                }

                // Create new user
                const result = await client.query(
                    'INSERT INTO participants (player_name, password) VALUES ($1, $2) RETURNING id',
                    [playerName.trim(), password]
                );

                return res.status(201).json({
                    success: true,
                    message: 'User created successfully',
                    userId: result.rows[0].id
                });

            } else if (action === 'login') {
                // Check credentials
                const result = await client.query(
                    'SELECT id, password FROM participants WHERE player_name = $1',
                    [playerName.trim()]
                );

                if (result.rows.length === 0) {
                    return res.status(401).json({ success: false, error: 'User not found' });
                }

                if (result.rows[0].password !== password) {
                    return res.status(401).json({ success: false, error: 'Incorrect password' });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    userId: result.rows[0].id
                });

            } else {
                return res.status(400).json({ success: false, error: 'Invalid action' });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Auth API Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
