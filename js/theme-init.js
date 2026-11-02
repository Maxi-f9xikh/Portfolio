// Loads the dark stylesheet before the first paint so dark mode never flashes white.
// Must stay a plain, blocking <script src> in <head> (document.write only works there).
try {
    if (localStorage.getItem('darkMode') === 'true') {
        document.write('<link rel="stylesheet" href="styles/darkstyles.css?v=3" data-theme="true">');
    }
} catch (e) { /* storage blocked → light mode */ }
