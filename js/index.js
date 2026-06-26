// ── PROJEKT-ARRAY ──────────────────────────────────────────────────
// Format: [Name, Beschreibung, Status, Featured, Link, Type]
// Format: [Name, Beschreibung, Status, Featured, CurseForgeLink, Type, ModrinthLink?]
const ProjektArray = [
    ["Nextblog Test",           "Erster Website-Test",                                    "fertig",   false, "Projekte/nextblog/index.html",                                  "web"],
    ["Javaskript Test",         "Taschenrechner-Test in JavaScript",                      "fertig",   false, "Projekte/Javaskript/index.html",                                "web"],
    ["innerhtml_test",          "Druckplatten-Test in JavaScript",                        "fertig",   false, "Projekte/innerhtml_test/index.html",                            "web"],
    ["Boatfix – Minecraft Mod", "Fixt den bekannten Bug beim Essen im Boot",              "fertig",   true,  "https://www.curseforge.com/minecraft/mc-mods/boat-fix",         "minecraft", "https://modrinth.com/mod/boatfix"],
    ["Underwater Torch",        "Ermöglicht das Platzieren von Fackeln unter Wasser",    "fertig",   false, "https://www.curseforge.com/minecraft/mc-mods/underwater-torch", "minecraft", "https://modrinth.com/mod/underwater-torch"],
    ["All Stacks to 67",        "Stapelt alle Items auf maximal 67",                      "fertig",   false, "https://www.curseforge.com/minecraft/mc-mods/all-stacks-to-67", "minecraft", "https://modrinth.com/mod/all-stacks-to-67"],
    ["Place on Path (PoP)",     "Lets you place any block on a path and the path stays.", "fertig",   false, "https://www.curseforge.com/minecraft/mc-mods/place-on-path-pop","minecraft"],
    ["Horror Game",             "Unity Horror Game – in Entwicklung",                     "inarbeit", true,  "#",                                                             "unity"],
    ["Ultimate Apple Mod",      "Viele neue Minecraft-Äpfel",                            "inarbeit", false, "#",                                                             "minecraft"],
    ["Recraft – Minecraft Mod", "Fertige Items zurückcraften",                            "pausiert", false, "#",                                                             "minecraft"],
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

    const statusOrder = { fertig: 0, inarbeit: 1, pausiert: 2 };
    const sorted = [...ProjektArray].sort((a, b) => (statusOrder[a[2]] ?? 3) - (statusOrder[b[2]] ?? 3));

    sorted.forEach(([name, beschreibung, status, featured, link, type = 'default', modrinthLink = null]) => {
        if (featuredOnly && !featured) return;

        const hasPlatformChoice = !!(modrinthLink && link && link !== '#');
        const statusText = getStatusText(status);
        const icon = getProjectIcon(type);

        const karte = hasPlatformChoice
            ? document.createElement('div')
            : document.createElement('a');
        karte.className = 'projekt-link fade-up';

        if (!hasPlatformChoice) {
            if (link !== '#') { karte.href = link; karte.target = '_blank'; karte.rel = 'noopener noreferrer'; }
            else { karte.href = '#'; }
        }

        karte.innerHTML = `
            <div class="projekt-card${hasPlatformChoice ? ' has-platform-choice' : ''}" data-type="${type}">
                <div class="projekt-card-header">
                    <span class="projekt-card-icon">${icon}</span>
                </div>
                <div class="projekt-card-body">
                    <h3>${name}</h3>
                    <p>${beschreibung}</p>
                    <span class="status ${status}">${statusText}</span>
                </div>
                ${hasPlatformChoice ? `
                <div class="platform-overlay">
                    <span class="platform-overlay-hint">Open on</span>
                    <a href="${link}" target="_blank" rel="noopener noreferrer" class="platform-btn platform-cf">CurseForge</a>
                    <a href="${modrinthLink}" target="_blank" rel="noopener noreferrer" class="platform-btn platform-mr">Modrinth</a>
                </div>` : ''}
            </div>`;

        if (hasPlatformChoice) {
            karte.addEventListener('click', () => {
                const overlay = karte.querySelector('.platform-overlay');
                const isActive = overlay.classList.contains('active');
                document.querySelectorAll('.platform-overlay.active').forEach(o => o.classList.remove('active'));
                if (!isActive) overlay.classList.add('active');
            });
            karte.querySelectorAll('.platform-btn').forEach(btn => btn.addEventListener('click', e => e.stopPropagation()));
        }

        container.appendChild(karte);
    });

    if (typeof initScrollAnimations === 'function') initScrollAnimations();
    if (typeof initCardTilt === 'function') initCardTilt();
}

renderProjekte('projekte_rein', false);
renderProjekte('projekte_rein_featured', true);

// Close platform overlays when clicking outside
document.addEventListener('click', e => {
    if (!e.target.closest('.has-platform-choice')) {
        document.querySelectorAll('.platform-overlay.active').forEach(o => o.classList.remove('active'));
    }
});


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
