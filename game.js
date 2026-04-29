(function() {
    'use strict';

    // Letter distribution and point values (Scrabble-style)
    var LETTER_DISTRIBUTION = {
        A: { count: 9, points: 1 }, B: { count: 2, points: 3 }, C: { count: 2, points: 3 },
        D: { count: 4, points: 2 }, E: { count: 12, points: 1 }, F: { count: 2, points: 4 },
        G: { count: 3, points: 2 }, H: { count: 2, points: 4 }, I: { count: 9, points: 1 },
        J: { count: 1, points: 8 }, K: { count: 1, points: 5 }, L: { count: 4, points: 1 },
        M: { count: 2, points: 3 }, N: { count: 6, points: 1 }, O: { count: 8, points: 1 },
        P: { count: 2, points: 3 }, Q: { count: 1, points: 10 }, R: { count: 6, points: 1 },
        S: { count: 4, points: 1 }, T: { count: 6, points: 1 }, U: { count: 4, points: 1 },
        V: { count: 2, points: 4 }, W: { count: 2, points: 4 }, X: { count: 1, points: 8 },
        Y: { count: 2, points: 4 }, Z: { count: 1, points: 10 }
    };

    // Game state
    var gameState = {
        playerName: '',
        score: 0,
        round: 1,
        maxRounds: 15,
        currentLetters: [],
        usedLetters: [],
        wordsFormed: [],
        gameActive: false,
        questions: [],
        usedQuestionIndices: [],
        currentQuestion: null,
        authAction: 'login' // 'login' or 'signup'
    };

    // DOM element references
    var el = {};

    // Check if running on file:// protocol or GitHub Pages (no server-side API support)
    var isLocalFile = window.location.protocol === 'file:';
    var isGitHubPages = window.location.hostname.indexOf('github.io') !== -1;
    var useLocalStorage = isLocalFile || isGitHubPages;

    // ===== INITIALIZATION =====
    function init() {
        // Get all DOM elements
        el.startScreen = document.getElementById('startScreen');
        el.endScreen = document.getElementById('endScreen');
        el.startGameBtn = document.getElementById('startGame');
        el.playerNameInput = document.getElementById('playerName');
        el.playerPasswordInput = document.getElementById('playerPassword');
        el.authTitle = document.getElementById('authTitle');
        el.authToggle = document.getElementById('authToggle');
        el.playerDisplay = document.getElementById('playerDisplay');
        el.scoreDisplay = document.getElementById('score');
        el.roundDisplay = document.getElementById('round');
        el.maxRoundsDisplay = document.getElementById('maxRounds');
        el.clueContainer = document.getElementById('clueContainer');
        el.clueText = document.getElementById('clueText');
        el.lettersContainer = document.getElementById('lettersContainer');
        el.wordInput = document.getElementById('wordInput');
        el.submitWordBtn = document.getElementById('submitWord');
        el.clearWordBtn = document.getElementById('clearWord');
        el.shuffleLettersBtn = document.getElementById('shuffleLetters');
        el.newRoundBtn = document.getElementById('newRound');
        el.message = document.getElementById('message');
        el.wordList = document.getElementById('wordList');
        el.leaderboard = document.getElementById('leaderboard');
        el.refreshLeaderboard = document.getElementById('refreshLeaderboard');
        el.finalScore = document.getElementById('finalScore');
        el.saveScoreBtn = document.getElementById('saveScore');
        el.playAgainBtn = document.getElementById('playAgain');

        // Set max rounds display
        el.maxRoundsDisplay.textContent = gameState.maxRounds;

        // === EVENT LISTENERS ===
        // Auth Toggle
        el.authToggle.addEventListener('click', function() {
            if (gameState.authAction === 'login') {
                gameState.authAction = 'signup';
                el.authTitle.textContent = 'Sign Up for Word Play';
                el.authToggle.textContent = 'Already have an account? Login';
                el.startGameBtn.textContent = 'Sign Up & Start';
            } else {
                gameState.authAction = 'login';
                el.authTitle.textContent = 'Login to Play';
                el.authToggle.textContent = "Don't have an account? Sign up";
                el.startGameBtn.textContent = 'Login & Start';
            }
        });

        // Start Game button
        el.startGameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            startGame();
        }, false);

        // Enter key on password input starts the game
        el.playerPasswordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                startGame();
            }
        });

        el.submitWordBtn.addEventListener('click', submitWord);
        el.clearWordBtn.addEventListener('click', clearWord);
        el.shuffleLettersBtn.addEventListener('click', shuffleLetters);
        el.newRoundBtn.addEventListener('click', startNewRound);
        el.wordInput.addEventListener('input', handleWordInput);
        el.wordInput.addEventListener('keydown', handleEnterKey);
        el.saveScoreBtn.addEventListener('click', saveScore);
        el.playAgainBtn.addEventListener('click', resetGame);
        el.refreshLeaderboard.addEventListener('click', fetchLeaderboard);

        // Load leaderboard
        fetchLeaderboard();

        console.log('Word Play game initialized successfully!');
    }

    // ===== FETCH QUESTIONS =====
    async function fetchQuestions() {
        try {
            var response = await fetch('questions.csv');
            var csvText = await response.text();
            var lines = csvText.split('\n');
            var questions = [];
            
            // Improved CSV parse to handle potential commas in clues
            for (var i = 1; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;
                
                var lastCommaIndex = line.lastIndexOf(',');
                if (lastCommaIndex !== -1) {
                    var clue = line.substring(0, lastCommaIndex).trim();
                    var answer = line.substring(lastCommaIndex + 1).trim().toUpperCase();
                    
                    // Remove quotes if present
                    if (clue.startsWith('"') && clue.endsWith('"')) {
                        clue = clue.substring(1, clue.length - 1);
                    }
                    if (answer.startsWith('"') && answer.endsWith('"')) {
                        answer = answer.substring(1, answer.length - 1);
                    }
                    
                    questions.push({
                        clue: clue,
                        answer: answer
                    });
                }
            }
            
            gameState.questions = questions;
            shuffleArray(gameState.questions);
            console.log('Loaded and shuffled ' + questions.length + ' questions from CSV');
        } catch (e) {
            console.error('Error loading questions:', e);
            // Fallback questions if CSV fails
            gameState.questions = [
                { clue: "A fruit that is often associated with New York City", answer: "APPLE" },
                { clue: "The opposite of hot", answer: "COLD" },
                { clue: "A large animal with a trunk", answer: "ELEPHANT" }
            ];
            shuffleArray(gameState.questions);
        }
    }

    // ===== SHUFFLE ARRAY HELPER =====
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    // ===== START GAME =====
    async function startGame() {
        var playerName = el.playerNameInput.value.trim();
        var password = el.playerPasswordInput.value.trim();

        if (!playerName || !password) {
            showMessage('Username and password are required!', 'error');
            return;
        }

        // --- AUTHENTICATION ---
        el.startGameBtn.disabled = true;
        el.startGameBtn.textContent = 'Authenticating...';

        var authSuccess = false;

        if (useLocalStorage) {
            authSuccess = authLocal(gameState.authAction, playerName, password);
        } else {
            try {
                var response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: gameState.authAction,
                        playerName: playerName,
                        password: password
                    })
                });
                var result = await response.json();
                if (result.success) {
                    authSuccess = true;
                } else {
                    showMessage(result.error || 'Authentication failed', 'error');
                }
            } catch (e) {
                console.error('Auth API Error:', e);
                // Fallback to local auth if server fails
                authSuccess = authLocal(gameState.authAction, playerName, password);
            }
        }

        if (!authSuccess) {
            el.startGameBtn.disabled = false;
            el.startGameBtn.textContent = (gameState.authAction === 'login' ? 'Login & Start' : 'Sign Up & Start');
            return;
        }

        // --- LOAD QUESTIONS ---
        if (gameState.questions.length === 0) {
            await fetchQuestions();
        }

        gameState.playerName = playerName;
        gameState.gameActive = true;
        gameState.score = 0;
        gameState.round = 1;
        gameState.wordsFormed = [];
        gameState.usedQuestionIndices = [];

        // Update player display
        el.playerDisplay.textContent = playerName;

        // Hide start screen overlay
        el.startScreen.classList.add('hidden');
        el.clueContainer.classList.remove('hidden');

        updateDisplay();
        generateLetters();
        enableGameControls();
        showMessage('Welcome ' + playerName + '! Solve the clue to advance.', 'info');
        
        el.startGameBtn.disabled = false;
        el.startGameBtn.textContent = (gameState.authAction === 'login' ? 'Login & Start' : 'Sign Up & Start');
    }

    // ===== LOCAL AUTH HELPER =====
    function authLocal(action, playerName, password) {
        var users = JSON.parse(localStorage.getItem('wordPlayUsers') || '{}');
        
        if (action === 'signup') {
            if (users[playerName]) {
                showMessage('Username already taken!', 'error');
                return false;
            }
            users[playerName] = password;
            localStorage.setItem('wordPlayUsers', JSON.stringify(users));
            showMessage('Account created successfully!', 'success');
            return true;
        } else {
            if (!users[playerName]) {
                showMessage('User not found. Please sign up!', 'error');
                return false;
            }
            if (users[playerName] !== password) {
                showMessage('Incorrect password!', 'error');
                return false;
            }
            return true;
        }
    }

    // ===== GENERATE LETTERS =====
    function generateLetters() {
        gameState.currentLetters = [];
        gameState.usedLetters = [];

        // Pick a random question that hasn't been used yet
        var availableIndices = [];
        for (var i = 0; i < gameState.questions.length; i++) {
            if (gameState.usedQuestionIndices.indexOf(i) === -1) {
                availableIndices.push(i);
            }
        }

        if (availableIndices.length === 0) {
            // All questions used, reset or end game
            gameState.usedQuestionIndices = [];
            availableIndices = Array.from({length: gameState.questions.length}, (_, i) => i);
        }

        var randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        gameState.usedQuestionIndices.push(randomIndex);
        gameState.currentQuestion = gameState.questions[randomIndex];

        // Display the clue
        el.clueText.textContent = gameState.currentQuestion.clue;

        // Build letter pool from the answer
        var pool = [];
        var answer = gameState.currentQuestion.answer;
        for (var j = 0; j < answer.length; j++) {
            var letter = answer[j];
            pool.push({
                letter: letter,
                points: (LETTER_DISTRIBUTION[letter] ? LETTER_DISTRIBUTION[letter].points : 1)
            });
        }

        // Add some random letters to fill up to at least 7 letters if needed
        if (pool.length < 7) {
            var extraCount = 7 - pool.length;
            var allLetters = Object.keys(LETTER_DISTRIBUTION);
            for (var k = 0; k < extraCount; k++) {
                var randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)];
                pool.push({
                    letter: randomLetter,
                    points: LETTER_DISTRIBUTION[randomLetter].points
                });
            }
        }

        // Shuffle the pool
        pool.sort(function() { return Math.random() - 0.5; });
        gameState.currentLetters = pool;

        renderLetters();

        el.wordInput.value = '';
        el.wordInput.disabled = false;
        el.submitWordBtn.disabled = false;
        el.newRoundBtn.disabled = true;
        el.wordInput.focus();
    }

    // ===== RENDER LETTER TILES =====
    function renderLetters() {
        el.lettersContainer.innerHTML = '';

        for (var i = 0; i < gameState.currentLetters.length; i++) {
            (function(index) {
                var item = gameState.currentLetters[index];
                var tile = document.createElement('div');
                tile.className = 'letter-tile';
                if (gameState.usedLetters.indexOf(index) !== -1) {
                    tile.classList.add('used');
                }
                tile.innerHTML = item.letter + '<span class="points">' + item.points + '</span>';
                tile.addEventListener('click', function() {
                    useLetter(index);
                });
                el.lettersContainer.appendChild(tile);
            })(i);
        }
    }

    // ===== USE LETTER =====
    function useLetter(index) {
        if (gameState.usedLetters.indexOf(index) !== -1) return;
        if (!gameState.gameActive) return;

        gameState.usedLetters.push(index);
        el.wordInput.value += gameState.currentLetters[index].letter;
        renderLetters();
    }

    // ===== INPUT HANDLERS =====
    function handleWordInput() {
        el.wordInput.value = el.wordInput.value.toUpperCase();
    }

    function clearWord() {
        el.wordInput.value = '';
        gameState.usedLetters = [];
        renderLetters();
        el.wordInput.focus();
    }

    function handleEnterKey(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitWord();
        }
    }

    function shuffleLetters() {
        gameState.currentLetters.sort(function() { return Math.random() - 0.5; });
        renderLetters();
    }

    // ===== SUBMIT WORD =====
    async function submitWord() {
        var word = el.wordInput.value.trim().toUpperCase();

        if (!word) {
            showMessage('Type a word first!', 'error');
            return;
        }
        if (word.length < 2) {
            showMessage('Word must be at least 2 letters!', 'error');
            return;
        }
        if (!canFormWord(word)) {
            showMessage("You don't have the right letters for this word!", 'error');
            return;
        }

        // Check if it matches the current question's answer
        var isClueAnswer = (word === gameState.currentQuestion.answer);
        
        var isValid = isClueAnswer || await validateWord(word);
        if (!isValid) {
            showMessage('Invalid word! Try again.', 'error');
            return;
        }

        var wordScore = calculateWordScore(word);
        
        if (isClueAnswer) {
            wordScore += 50; // Big bonus for solving the clue
            showMessage('AMAZING! You solved the clue! +50 bonus!', 'success');
            el.newRoundBtn.disabled = false;
            // Highlight the fact that they solved it
            gameState.wordsFormed.push({ word: word + ' (SOLVED)', score: wordScore });
        } else {
            gameState.wordsFormed.push({ word: word, score: wordScore });
            showMessage('+' + wordScore + ' points! "' + word + '" is valid!', 'success');
        }

        gameState.score += wordScore;

        // Reset
        gameState.usedLetters = [];
        el.wordInput.value = '';

        updateDisplay();
        renderLetters();
        updateWordList();
        
        if (isClueAnswer) {
            // Optional: Auto-advance to next round after a delay?
            // For now, let them click "New Round"
            el.wordInput.disabled = true;
            el.submitWordBtn.disabled = true;
        }
    }

    // ===== CHECK IF WORD CAN BE FORMED =====
    function canFormWord(word) {
        var available = [];
        for (var i = 0; i < gameState.currentLetters.length; i++) {
            available.push(gameState.currentLetters[i].letter);
        }
        for (var j = 0; j < word.length; j++) {
            var idx = available.indexOf(word[j]);
            if (idx === -1) return false;
            available.splice(idx, 1);
        }
        return true;
    }

    // ===== VALIDATE WORD =====
    async function validateWord(word) {
        try {
            var response = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + word.toLowerCase());
            return response.ok;
        } catch (e) {
            return word.length >= 3;
        }
    }

    // ===== CALCULATE SCORE =====
    function calculateWordScore(word) {
        var score = 0;
        var counts = {};

        for (var i = 0; i < word.length; i++) {
            counts[word[i]] = (counts[word[i]] || 0) + 1;
        }

        for (var letter in counts) {
            if (counts.hasOwnProperty(letter) && LETTER_DISTRIBUTION[letter]) {
                score += LETTER_DISTRIBUTION[letter].points * counts[letter];
            }
        }

        // Bonus for longer words
        if (word.length >= 5) score += 5;
        if (word.length >= 7) score += 10;

        return score;
    }

    // ===== NEW ROUND =====
    function startNewRound() {
        if (gameState.round >= gameState.maxRounds) {
            endGame();
            return;
        }

        gameState.round++;
        gameState.usedLetters = [];
        gameState.currentLetters = [];

        updateDisplay();
        generateLetters();
        showMessage('Round ' + gameState.round + '! New letters generated.', 'info');
    }

    // ===== END GAME =====
    function endGame() {
        gameState.gameActive = false;
        el.endScreen.classList.remove('hidden');
        el.finalScore.textContent = gameState.score;
        el.wordInput.disabled = true;
        el.submitWordBtn.disabled = true;
        el.newRoundBtn.disabled = true;
    }

    // ===== UPDATE DISPLAY =====
    function updateDisplay() {
        el.scoreDisplay.textContent = gameState.score;
        el.roundDisplay.textContent = gameState.round;
    }

    // ===== ENABLE CONTROLS =====
    function enableGameControls() {
        el.wordInput.disabled = false;
        el.submitWordBtn.disabled = false;
        el.newRoundBtn.disabled = true;
    }

    // ===== UPDATE WORD LIST =====
    function updateWordList() {
        el.wordList.innerHTML = '';

        for (var i = 0; i < gameState.wordsFormed.length; i++) {
            var entry = gameState.wordsFormed[i];
            var li = document.createElement('li');
            li.innerHTML = entry.word + '<span class="word-points">+' + entry.score + '</span>';
            el.wordList.appendChild(li);
        }
    }

    // ===== SHOW MESSAGE =====
    function showMessage(text, type) {
        el.message.textContent = text;
        el.message.className = 'message ' + type;

        if (type === 'success' && text.includes('solved')) {
            playSuccessSound();
        }

        setTimeout(function() {
            el.message.textContent = '';
            el.message.className = 'message';
        }, 3000);
    }

    // ===== SOUND EFFECTS =====
    function playSuccessSound() {
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            var ctx = new AudioContext();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            var now = ctx.currentTime;
            
            // "Catchy" Arpeggio
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6
            
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            osc.start(now);
            osc.stop(now + 0.5);
        } catch (e) {
            console.log('Audio not supported or blocked');
        }
    }

    // ===== RESET GAME =====
    function resetGame() {
        el.endScreen.classList.add('hidden');
        el.startScreen.classList.remove('hidden');
        el.clueContainer.classList.add('hidden');
        el.playerDisplay.textContent = '---';

        gameState = {
            playerName: '',
            score: 0,
            round: 1,
            maxRounds: 5,
            currentLetters: [],
            usedLetters: [],
            wordsFormed: [],
            gameActive: false,
            questions: gameState.questions, // Keep loaded questions
            usedQuestionIndices: [],
            currentQuestion: null
        };

        el.wordList.innerHTML = '';
        el.wordInput.value = '';
        el.playerPasswordInput.value = '';
        el.lettersContainer.innerHTML = '';
        updateDisplay();
    }

    // ===== SAVE SCORE =====
    async function saveScore() {
        el.saveScoreBtn.disabled = true;
        el.saveScoreBtn.textContent = 'Saving...';

        var scoreData = {
            playerName: gameState.playerName,
            score: gameState.score,
            roundsPlayed: gameState.round,
            wordsFormed: gameState.wordsFormed.length,
            wordsList: gameState.wordsFormed
        };

        if (useLocalStorage) {
            saveScoreToLocal(scoreData);
            showMessage('Score saved to your device!', 'success');
            fetchLeaderboard();
            el.saveScoreBtn.textContent = 'Saved!';
            return;
        }

        try {
            var response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scoreData)
            });

            var result = await response.json();

            if (result.success) {
                showMessage('Score and participant details saved!', 'success');
                fetchLeaderboard();
                el.saveScoreBtn.textContent = 'Saved!';
            } else {
                throw new Error(result.error || 'Failed to save');
            }
        } catch (e) {
            console.error('API Save Error:', e);
            // Fallback to local if API fails
            saveScoreToLocal(scoreData);
            showMessage('Server error. Score saved to your device instead.', 'info');
            fetchLeaderboard();
            el.saveScoreBtn.textContent = 'Saved!';
        }
    }

    // ===== LOCAL STORAGE HELPERS =====
    function saveScoreToLocal(data) {
        var scores = JSON.parse(localStorage.getItem('wordPlayScores') || '[]');
        
        // Update or add participant
        var existing = scores.find(function(s) { return s.player_name === data.playerName; });
        if (existing) {
            existing.total_games++;
            existing.total_score += data.score;
            existing.score = Math.max(existing.score, data.score);
            existing.total_words_formed += data.wordsFormed;
        } else {
            scores.push({
                player_name: data.playerName,
                score: data.score,
                total_games: 1,
                total_score: data.score,
                total_words_formed: data.wordsFormed,
                created_at: new Date().toISOString()
            });
        }
        
        // Sort by score
        scores.sort(function(a, b) { return b.score - a.score; });
        localStorage.setItem('wordPlayScores', JSON.stringify(scores.slice(0, 50)));
    }

    // ===== FETCH LEADERBOARD =====
    async function fetchLeaderboard() {
        if (useLocalStorage) {
            var localScores = JSON.parse(localStorage.getItem('wordPlayScores') || '[]');
            if (localScores.length > 0) {
                displayLeaderboard(localScores);
            } else {
                el.leaderboard.innerHTML = '<li class="loading">No scores yet. Be the first!</li>';
            }
            return;
        }

        el.leaderboard.innerHTML = '<li class="loading">Loading leaderboard...</li>';

        try {
            var response = await fetch('/api/leaderboard');
            var result = await response.json();

            if (result.success && result.scores && result.scores.length > 0) {
                displayLeaderboard(result.scores);
            } else {
                // If API returns success but no scores, try local
                fetchLeaderboardLocal();
            }
        } catch (e) {
            console.error('API Fetch Error:', e);
            fetchLeaderboardLocal();
        }
    }

    function fetchLeaderboardLocal() {
        var localScores = JSON.parse(localStorage.getItem('wordPlayScores') || '[]');
        if (localScores.length > 0) {
            displayLeaderboard(localScores);
        } else {
            el.leaderboard.innerHTML = '<li class="loading">No scores yet. Be the first!</li>';
        }
    }

    // ===== DISPLAY LEADERBOARD =====
    function displayLeaderboard(scores) {
        el.leaderboard.innerHTML = '';

        for (var i = 0; i < scores.length; i++) {
            var entry = scores[i];
            var li = document.createElement('li');
            if (i < 3) li.className = 'top-rank';

            var details = '';
            if (entry.total_games) {
                details = '<div class="player-details">' +
                    '<span class="player-games">' + entry.total_games + ' game' + (entry.total_games > 1 ? 's' : '') + '</span>' +
                    '<span class="player-total">' + entry.total_score + ' total pts</span>' +
                    '<span class="player-words">' + (entry.total_words_formed || 0) + ' words</span>' +
                    '</div>';
            }

            li.innerHTML =
                '<span class="rank-number">#' + (i + 1) + '</span>' +
                '<div class="player-info-wrapper">' +
                    '<span class="player-name">' + escapeHtml(entry.player_name) + '</span>' +
                    details +
                '</div>' +
                '<span class="player-score">' + entry.score + ' pts</span>';

            el.leaderboard.appendChild(li);
        }
    }

    // ===== ESCAPE HTML =====
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== BOOT =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
