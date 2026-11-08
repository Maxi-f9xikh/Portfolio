// ── PROJEKT-ARRAY ──────────────────────────────────────────────────
// Format: [Name, Beschreibung, Status, Featured, Link (CurseForge for mods), Type, ModrinthLink?]
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

// Line icons (SVG) instead of emoji, they follow the text colour
const PROJECT_ICONS = {
    minecraft: '<g transform="rotate(-45 12 12)"><path d="M4 8.5c4-3.5 12-3.5 16 0"/><path d="M12 6.5V21"/></g>',
    unity: '<rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6.5 12h4M8.5 10v4"/><path d="M15 11h.01M17.5 13.5h.01"/>',
    web: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    default: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>'
};

function getProjectIcon(type) {
    const paths = PROJECT_ICONS[type] || PROJECT_ICONS.default;
    return `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

// CurseForge project ids by URL slug → download counts from data/curseforge.json
const CF_IDS = { 'boat-fix': 1286312, 'underwater-torch': 1539858, 'all-stacks-to-67': 1532694, 'place-on-path-pop': 1586696 };
const cfId = link => CF_IDS[(link.match(/curseforge\.com\/minecraft\/mc-mods\/([^/?#]+)/) || [])[1]];

const DOWNLOAD_ICON = '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';

function renderProjekte(containerId, featuredOnly, { excludeType = null } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const statusOrder = { fertig: 0, inarbeit: 1, pausiert: 2 };
    const sorted = [...ProjektArray].sort((a, b) => (statusOrder[a[2]] ?? 3) - (statusOrder[b[2]] ?? 3));

    sorted.forEach(([name, beschreibung, status, featured, link, type = 'default', modrinthLink = null]) => {
        if (featuredOnly && !featured) return;
        if (excludeType && type === excludeType) return;

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
        } else {
            // div with a choice overlay → make it reachable and usable by keyboard
            karte.tabIndex = 0;
            karte.setAttribute('role', 'button');
            karte.setAttribute('aria-label', `${name}: auf CurseForge oder Modrinth öffnen`);
        }
        const modId = cfId(link);

        karte.innerHTML = `
            <div class="projekt-card${hasPlatformChoice ? ' has-platform-choice' : ''}" data-type="${type}">
                <div class="projekt-card-header">
                    <span class="projekt-card-icon">${icon}</span>
                </div>
                <div class="projekt-card-body">
                    <h3>${name}</h3>
                    <p>${beschreibung}</p>
                    <div class="card-foot">
                        <span class="status ${status}">${statusText}</span>
                        ${modId ? `<span class="dl-badge" data-mod="${modId}" hidden>${DOWNLOAD_ICON}<span></span></span>` : ''}
                    </div>
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
            karte.addEventListener('keydown', e => {
                if ((e.key === 'Enter' || e.key === ' ') && e.target === karte) { e.preventDefault(); karte.click(); }
            });
        }

        container.appendChild(karte);
    });

    if (typeof initCardTilt === 'function') initCardTilt();
}

// Small experiments as a compact list (home page)
function renderMiniProjekte(containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = ProjektArray.filter(p => p[5] === type).map(([name, beschreibung, , , link]) => `
        <a class="mini-project" href="${link}">
            <span class="mini-icon">${getProjectIcon(type)}</span>
            <span><span class="mini-title">${name}</span><span class="mini-desc">${beschreibung}</span></span>
        </a>`).join('');
}

// Fill in the per-mod download counts (data refreshed every 3 h by a GitHub Action)
async function loadModDownloads() {
    const badges = document.querySelectorAll('.dl-badge[data-mod]');
    if (!badges.length) return;
    for (const url of ['https://raw.githubusercontent.com/Maxi-f9xikh/Portfolio/main/data/curseforge.json', 'data/curseforge.json']) {
        try {
            const r = await fetch(url, { cache: 'no-cache' });
            if (!r.ok) continue;
            const { mods } = await r.json();
            badges.forEach(b => {
                const m = mods[b.dataset.mod];
                if (!m) return;
                b.querySelector('span').textContent = `${m.downloads.toLocaleString('de-DE')} Downloads`;
                b.hidden = false;
            });
            return;
        } catch { /* try the next source */ }
    }
}

const onHome = !!document.getElementById('projekte_klein');
renderProjekte('projekte_rein', false, { excludeType: onHome ? 'web' : null });
renderProjekte('projekte_rein_featured', true);
renderMiniProjekte('projekte_klein', 'web');
loadModDownloads();

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
        link.href = 'styles/darkstyles.css?v=3';
    } else {
        // Light Mode: Dark-Override entfernen
        if (link) link.remove();
    }
}

function updateImages() {
    const map = [
        ['img[alt="Bildungs Zeitstrahl!"]', 'images/Bildung_dark.png',     'images/Bildung.png'],
        ['img.coffee-bild',                 'images/bmacoffe_dark.png',    'images/bmacoffe.png'],
    ];
    map.forEach(([selector, darkSrc, lightSrc]) => {
        const el = document.querySelector(selector);
        if (el) el.src = darkmode ? darkSrc : lightSrc;
    });
}

function updateDarkBtn() {
    if (!darkBtn) return;
    darkBtn.innerHTML = `<img src="images/${darkmode ? 'light_mode' : 'Darkmode'}.png" alt="" class="nav-item">`;
    darkBtn.setAttribute('aria-label', darkmode ? 'Hellmodus einschalten' : 'Dunkelmodus einschalten');
    darkBtn.setAttribute('aria-pressed', String(darkmode));
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
