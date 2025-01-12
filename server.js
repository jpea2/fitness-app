const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the home.html file
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to serve the progress.html file
app.get('/progress', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'progress.html'));
});

// Route to serve the settings.html file
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Default route to redirect to home
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
