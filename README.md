# Word Play Game

A Scrabble-like word game where players form words with given letters and compete for the highest score!

## Features
- 🎮 Interactive word game with letter tiles
- 📊 5-round gameplay with scoring system
- 🏆 Persistent leaderboard using PostgreSQL
- 🎨 Clean design with white, blue, and black color scheme
- 📱 Fully responsive design

## How to Play
1. Enter your name and click "Start Game"
2. You'll receive 7 random letter tiles each round
3. Click letters or type to form words
4. Submit valid English words to earn points
5. Complete 5 rounds and save your score to the leaderboard!

## Scoring
- Each letter has a point value (shown on tile)
- Longer words get bonus points:
  - 5+ letters: +5 bonus
  - 7+ letters: +10 bonus
- Rare letters (Q, Z, J, X) worth more points

## Deployment to Vercel

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: Vercel Dashboard
1. Push code to GitHub
2. Import repository on Vercel
3. Add environment variable:
   - Name: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_fJONCK8Fe6Ez@ep-frosty-firefly-anqcqzvx-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
4. Deploy!

### Option 3: Direct Deployment
```bash
# Navigate to project folder
cd "C:\Users\DELL\Desktop\Word play"

# Install dependencies
npm install

# Deploy to Vercel
vercel --prod
```

## Local Development

```bash
# Install dependencies
npm install

# Run locally
vercel dev
```

## Project Structure
```
Word play/
├── index.html          # Main HTML file
├── style.css           # Styles
├── game.js             # Game logic
├── api/
│   ├── db.js           # Database connection
│   └── leaderboard.js  # API endpoint
├── vercel.json         # Vercel configuration
└── package.json        # Dependencies
```

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** PostgreSQL (Neon)
- **Hosting:** Vercel

## Database Schema

### `participants` Table
Stores unique player info and aggregate stats across all games:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| player_name | VARCHAR(50) | Unique player name |
| total_games | INTEGER | Total games played |
| total_score | INTEGER | Sum of all scores |
| best_score | INTEGER | Highest single-game score |
| total_words_formed | INTEGER | Total words formed across all games |
| total_rounds_played | INTEGER | Total rounds played |
| created_at | TIMESTAMP | First game date |
| updated_at | TIMESTAMP | Last game date |

### `game_sessions` Table
Stores each individual game played:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| participant_id | INTEGER | FK to participants |
| score | INTEGER | Final score for this game |
| rounds_played | INTEGER | Rounds played in this game |
| words_formed_count | INTEGER | Words formed in this game |
| words_list | JSONB | Array of `{word, score}` objects |
| played_at | TIMESTAMP | When the game was played |

## API Endpoints

### GET /api/leaderboard
Fetch top 50 players by best score
**Response:**
```json
{
  "success": true,
  "scores": [
    {
      "player_name": "John",
      "score": 150,
      "total_games": 5,
      "total_score": 620,
      "total_words_formed": 42,
      "total_rounds_played": 25,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/leaderboard
Save a new score with participant details
**Body:**
```json
{
  "playerName": "Jane",
  "score": 120,
  "roundsPlayed": 5,
  "wordsFormed": 8,
  "wordsList": [
    {"word": "HELLO", "score": 15},
    {"word": "WORLD", "score": 18}
  ]
}
```

## License
MIT
