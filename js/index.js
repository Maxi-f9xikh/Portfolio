// ── PROJEKT-ARRAY ──────────────────────────────────────────────────
// Format: [Name, Beschreibung, Status, Featured, Link]
const ProjektArray = [
    ["Nextblog",              "Ein Blogpost Website",                 "fertig",  false, "Projekte/nextblog/index.html"],
    ["Javaskript",            "Ein Taschenrechner",                   "fertig",  false, "Projekte/Javaskript/index.html"],
    ["innerhtml_test",        "Druckplatte Test",                     "fertig",  false, "Projekte/innerhtml_test/index.html"],
    ["Boatfix - Minecraft Mod", "Fixt dem Bug im Boot zu essen",      "fertig",  true,  "https://www.curseforge.com/minecraft/mc-mods/boat-fix"],
    ["Ultimate Apple Mod",    "Viele neue Minecraft \u00C4pfel",      "pausiert",false, "#"],
    ["Recraft - Minecraft Mod","Fertige Items zur\u00FCckcraften",    "pausiert",false, "#"]
];

function getStatusText(status) {
    switch (status) {
        case 'fertig':   return 'Fertiggestellt';
        case 'inarbeit': return 'In Arbeit';
        case 'pausiert': return 'Pausiert';
        default:         return status;
    }
}

function renderProjekte(containerId, featuredOnly) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    ProjektArray.forEach(([name, beschreibung, status, featured, link]) => {
        if (featuredOnly && !featured) return;

        const statusText = getStatusText(status);
        const karte = document.createElement('a');
        karte.href = link;
        karte.className = 'projekt-link';
        if (link.startsWith('http')) {
            karte.target = '_blank';
            karte.rel = 'noopener noreferrer';
        }
        karte.innerHTML = `
            <div class="text-block">
                <h3>${name}</h3>
                <p>${beschreibung}</p>
                <span class="status ${status}">${statusText}</span>
            </div>`;
        container.appendChild(karte);
    });
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
