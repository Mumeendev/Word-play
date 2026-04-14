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
        maxRounds: 5,
        currentLetters: [],
        usedLetters: [],
        wordsFormed: [],
        gameActive: false
    };

    // DOM element references
    var el = {};

    // Check if running on file:// protocol (no server)
    var isLocalFile = window.location.protocol === 'file:';

    // ===== INITIALIZATION =====
    function init() {
        // Get all DOM elements
        el.startScreen = document.getElementById('startScreen');
        el.endScreen = document.getElementById('endScreen');
        el.startGameBtn = document.getElementById('startGame');
        el.playerNameInput = document.getElementById('playerName');
        el.playerDisplay = document.getElementById('playerDisplay');
        el.scoreDisplay = document.getElementById('score');
        el.roundDisplay = document.getElementById('round');
        el.maxRoundsDisplay = document.getElementById('maxRounds');
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
        // Start Game button
        el.startGameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            startGame();
        }, false);

        // Enter key on name input starts the game
        el.playerNameInput.addEventListener('keydown', function(e) {
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

    // ===== START GAME =====
    function startGame() {
        var playerName = el.playerNameInput.value.trim();

        if (!playerName) {
            showMessage('Please enter your name to start!', 'error');
            el.playerNameInput.focus();
            return;
        }

        gameState.playerName = playerName;
        gameState.gameActive = true;
        gameState.score = 0;
        gameState.round = 1;
        gameState.wordsFormed = [];

        // Update player display
        el.playerDisplay.textContent = playerName;

        // Hide start screen overlay
        el.startScreen.classList.add('hidden');

        updateDisplay();
        generateLetters();
        enableGameControls();
        showMessage('Welcome ' + playerName + '! Form words with your letters.', 'info');
    }

    // ===== GENERATE LETTERS =====
    function generateLetters() {
        gameState.currentLetters = [];
        gameState.usedLetters = [];

        // Build letter pool
        var pool = [];
        for (var letter in LETTER_DISTRIBUTION) {
            if (LETTER_DISTRIBUTION.hasOwnProperty(letter)) {
                var data = LETTER_DISTRIBUTION[letter];
                for (var i = 0; i < data.count; i++) {
                    pool.push(letter);
                }
            }
        }

        // Pick 7 random letters
        for (var j = 0; j < 7; j++) {
            var randomIndex = Math.floor(Math.random() * pool.length);
            var selectedLetter = pool[randomIndex];
            gameState.currentLetters.push({
                letter: selectedLetter,
                points: LETTER_DISTRIBUTION[selectedLetter].points
            });
            pool.splice(randomIndex, 1);
        }

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

        var isValid = await validateWord(word);
        if (!isValid) {
            showMessage('Invalid word! Try again.', 'error');
            return;
        }

        var wordScore = calculateWordScore(word);
        gameState.score += wordScore;
        gameState.wordsFormed.push({ word: word, score: wordScore });

        // Reset
        gameState.usedLetters = [];
        el.wordInput.value = '';

        updateDisplay();
        renderLetters();
        updateWordList();
        showMessage('+' + wordScore + ' points! "' + word + '" is valid!', 'success');
        el.newRoundBtn.disabled = false;
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

        setTimeout(function() {
            el.message.textContent = '';
            el.message.className = 'message';
        }, 3000);
    }

    // ===== RESET GAME =====
    function resetGame() {
        el.endScreen.classList.add('hidden');
        el.startScreen.classList.remove('hidden');
        el.playerDisplay.textContent = '---';

        gameState = {
            playerName: '',
            score: 0,
            round: 1,
            maxRounds: 5,
            currentLetters: [],
            usedLetters: [],
            wordsFormed: [],
            gameActive: false
        };

        el.wordList.innerHTML = '';
        el.wordInput.value = '';
        el.lettersContainer.innerHTML = '';
        updateDisplay();
    }

    // ===== SAVE SCORE =====
    async function saveScore() {
        if (isLocalFile) {
            showMessage('Leaderboard requires a server. Deploy to Vercel to enable!', 'error');
            return;
        }

        el.saveScoreBtn.disabled = true;
        el.saveScoreBtn.textContent = 'Saving...';

        try {
            var response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName: gameState.playerName,
                    score: gameState.score,
                    roundsPlayed: gameState.round,
                    wordsFormed: gameState.wordsFormed.length,
                    wordsList: gameState.wordsFormed
                })
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
            showMessage('Error saving score. Please try again.', 'error');
            el.saveScoreBtn.disabled = false;
            el.saveScoreBtn.textContent = 'Save to Leaderboard';
        }
    }

    // ===== FETCH LEADERBOARD =====
    async function fetchLeaderboard() {
        // Skip if running without a server (file:// protocol)
        if (isLocalFile) {
            el.leaderboard.innerHTML = '<li class="loading">Leaderboard requires a server. Deploy to Vercel to enable!</li>';
            return;
        }

        el.leaderboard.innerHTML = '<li class="loading">Loading leaderboard...</li>';

        try {
            var response = await fetch('/api/leaderboard');
            var result = await response.json();

            if (result.success && result.scores && result.scores.length > 0) {
                displayLeaderboard(result.scores);
            } else {
                el.leaderboard.innerHTML = '<li class="loading">No scores yet. Be the first!</li>';
            }
        } catch (e) {
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
