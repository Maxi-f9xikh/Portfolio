// ── PROJEKT-ARRAY ──────────────────────────────────────────────────
// Format: [Name, Beschreibung, Status, Featured, Link, Type]
const ProjektArray = [
    ["Boatfix – Minecraft Mod",   "Fixt den bekannten Bug beim Essen im Boot",      "fertig",  true,  "https://www.curseforge.com/minecraft/mc-mods/boat-fix", "minecraft"],
    ["Nextblog",                   "Blog-Website mit Dark/Light Mode",               "fertig",  false, "Projekte/nextblog/index.html",                          "web"],
    ["Javaskript",                 "Taschenrechner in JavaScript",                   "fertig",  false, "Projekte/Javaskript/index.html",                        "web"],
    ["innerhtml_test",             "Druckplatten-Test in JavaScript",                "fertig",  false, "Projekte/innerhtml_test/index.html",                    "web"],
    ["Horror Game",                "Unity Horror Game – in Entwicklung",             "inarbeit",true,  "#",                                                     "unity"],
    ["Ultimate Apple Mod",         "Viele neue Minecraft-Äpfel",                "pausiert",false, "#",                                                     "minecraft"],
    ["Recraft – Minecraft Mod","Fertige Items zurückcraften",              "pausiert",false, "#",                                                     "minecraft"],
];

function getStatusText(status) {
    switch (status) {
        case 'fertig':   return 'Fertiggestellt';
        case 'inarbeit': return 'In Arbeit';
        case 'pausiert': return 'Pausiert';
        default:         return status;
    }
}

function getProjectIcon(type) {
    const icons = { minecraft: '⛏️', unity: '👾', web: '🌐' };
    return icons[type] || '💻';
}

function renderProjekte(containerId, featuredOnly) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    ProjektArray.forEach(([name, beschreibung, status, featured, link, type = 'default']) => {
        if (featuredOnly && !featured) return;

        const statusText = getStatusText(status);
        const icon = getProjectIcon(type);
        const karte = document.createElement('a');
        karte.href = link;
        karte.className = 'projekt-link fade-up';
        if (link.startsWith('http')) {
            karte.target = '_blank';
            karte.rel = 'noopener noreferrer';
        }
        karte.innerHTML = `
            <div class="projekt-card" data-type="${type}">
                <div class="projekt-card-header">
                    <span class="projekt-card-icon">${icon}</span>
                </div>
                <div class="projekt-card-body">
                    <h3>${name}</h3>
                    <p>${beschreibung}</p>
                    <span class="status ${status}">${statusText}</span>
                </div>
            </div>`;
        container.appendChild(karte);
    });

    // Re-run scroll animations after dynamic render
    if (typeof initScrollAnimations === 'function') initScrollAnimations();
    if (typeof initCardTilt === 'function') initCardTilt();
}

renderProjekte('projekte_rein', false);
renderProjekte('projekte_rein_featured', true);


// ── DARKMODE ────────────────────────────────────────────────────────
let darkmode = localStorage.getItem('darkMode') === 'true';
const darkBtn = document.getElementById('Dark');

function applyStylesheet() {
    let link = document.querySelector('link[data-theme]');
    if (darkmode) {
        // Dark Mode: darkstyles.css als Override hinzufügen
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            link.setAttribute('data-theme', 'true');
            document.head.appendChild(link);
        }
        link.href = 'styles/darkstyles.css?v=2';
    } else {
        // Light Mode: Dark-Override entfernen
        if (link) link.remove();
    }
}

function updateImages() {
    const map = [
        ['img[alt="Bildungs Zeitstrahl!"]', 'images/Bildung_dark.png',     'images/Bildung.png'],
        ['img[alt="buy me a coffe! "]',     'images/bmacoffe_dark.png',    'images/bmacoffe.png'],
    ];
    map.forEach(([selector, darkSrc, lightSrc]) => {
        const el = document.querySelector(selector);
        if (el) el.src = darkmode ? darkSrc : lightSrc;
    });
}

function updateDarkBtn() {
    if (!darkBtn) return;
    darkBtn.innerHTML = darkmode
        ? `<div class="nav-item"><img src="images/light_mode.png" alt="Lightmode an machen?" class="nav-item"></div>`
        : `<div class="nav-item"><img src="images/Darkmode.png"   alt="Darkmode an machen?"  class="nav-item"></div>`;
}

function applyDarkmode() {
    document.body.classList.toggle('dark-mode',  darkmode);
    document.body.classList.toggle('light-mode', !darkmode);
    applyStylesheet();
    updateImages();
    updateDarkBtn();
}

applyDarkmode();

if (darkBtn) {
    darkBtn.addEventListener('click', () => {
        darkmode = !darkmode;
        localStorage.setItem('darkMode', darkmode.toString());
        applyDarkmode();
    });
}
