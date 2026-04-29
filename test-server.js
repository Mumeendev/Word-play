const http = require('http');
const fs = require('fs');
const path = require('path');

// Read game files
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
const csv = fs.readFileSync(path.join(__dirname, 'questions.csv'), 'utf8');

// Create simple HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    } else if (req.url === '/game.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(js);
    } else if (req.url === '/style.css') {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(css);
    } else if (req.url === '/questions.csv') {
        res.writeHead(200, { 'Content-Type': 'text/csv' });
        res.end(csv);
    } else if (req.url === '/api/leaderboard') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, scores: [] }));
    } else if (req.url === '/api/auth') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Mock auth success' }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3001, () => {
    console.log('Test server running at http://localhost:3001');
    console.log('Open this in your browser and check the console for errors');
    console.log('Press Ctrl+C to stop');
});
