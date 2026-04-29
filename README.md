# Word Play Game

A Scrabble-like word game where players form words based on clues and compete for the highest score!

## Features
- 🎮 Interactive word game with letter tiles
- 🧩 Clue-based gameplay (solve the clue to advance!)
- 🔊 Catchy sound effects when you solve a clue
- 📊 5-round gameplay with scoring system
- 🏆 Persistent leaderboard (Local Storage or PostgreSQL)
- 📱 Fully responsive design (Mobile-friendly)

## How to Play
1. Enter your name and click "Start Game"
2. You'll receive a clue and a set of scrambled letters each round
3. Form the correct word to solve the clue and earn a **+50 point bonus**
4. You can also form other valid English words for extra points
5. Solve the clue to unlock the "New Round" button
6. Complete 5 rounds and save your score to the leaderboard!

## Scoring
- Each letter has a point value (shown on tile)
- **Solving the Clue**: +50 bonus points
- **Word Length Bonus**:
  - 5+ letters: +5 bonus
  - 7+ letters: +10 bonus
- Rare letters (Q, Z, J, X) are worth more points

## Deployment to GitHub Pages

1. **Push to GitHub**: Make sure your code is in a GitHub repository.
2. **Enable Pages**:
   - Go to your repository **Settings**
   - Click **Pages** in the left sidebar
   - Select the branch (usually `main`) and folder (`/root`)
   - Click **Save**
3. **Leaderboard Note**: When running on GitHub Pages, the game uses `localStorage` to save your scores on your own device. For a shared global leaderboard, a backend like Vercel or Supabase is required.

## Local Development

```bash
# Just open index.html in your browser, or use a local server:
npx serve .
```

## Project Structure
```
Word play/
├── index.html          # Main HTML file
├── style.css           # Responsive styles
├── game.js             # Game logic & sound effects
├── questions.csv       # Game questions and clues
├── api/                # Optional: Vercel API endpoints
└── README.md           # Documentation
```

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Audio:** Web Audio API (Synthesized sounds)
- **Storage:** LocalStorage (Default) / PostgreSQL (Optional)

## License
MIT
