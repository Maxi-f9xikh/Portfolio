/* ═══════════════════════════════════════════════
   Portfolio Effects — Maximilian Stickel
   Canvas grid · Typewriter · Cursor glow · Scroll animations · Card tilt · Skill bars
═══════════════════════════════════════════════ */

// ── CURSOR GLOW ───────────────────────────────
function initCursorGlow() {
    // Only on non-touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let x = -999, y = -999;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;   // off-screen until the mouse moves
    document.addEventListener('mousemove', e => {
        x = e.clientX;
        y = e.clientY;
        // transform only moves the existing layer (no repaint), left/top repainted 500px every move
        glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
}

// ── HERO CANVAS GRID ──────────────────────────
function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let dots = [];
    let W, H, animId;

    function buildDots() {
        dots = [];
        const spacing = 44;
        const cols = Math.ceil(W / spacing) + 1;
        const rows = Math.ceil(H / spacing) + 1;
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                dots.push({
                    x: c * spacing,
                    y: r * spacing,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.003 + Math.random() * 0.004
                });
            }
        }
    }

    function resize() {
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
        buildDots();
    }

    // Detect dark mode
    function isDark() {
        return document.body.classList.contains('dark-mode');
    }

    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        const dark = isDark();
        dots.forEach(d => {
            const alpha = 0.06 + 0.07 * Math.sin(frame * d.speed + d.phase);
            ctx.beginPath();
            ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = dark
                ? `rgba(67,97,238,${alpha})`
                : `rgba(67,97,238,${alpha * 0.7})`;
            ctx.fill();
        });
        frame++;
        animId = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();
    draw();
}

// ── TYPEWRITER ────────────────────────────────
function initTypewriter() {
    const el = document.getElementById('typed-text');
    if (!el) return;

    const phrases = [
        'Minecraft Mod Developer',
        'Horror Game Creator',
        'Web Developer',
        'Java Programmierer'
    ];

    let pi = 0, ci = 0, deleting = false;

    function tick() {
        const word = phrases[pi];
        if (deleting) {
            el.textContent = word.slice(0, ci - 1);
            ci--;
        } else {
            el.textContent = word.slice(0, ci + 1);
            ci++;
        }

        let delay = deleting ? 45 : 95;
        if (!deleting && ci === word.length)  { delay = 2200; deleting = true; }
        else if (deleting && ci === 0)        { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
        setTimeout(tick, delay);
    }
    setTimeout(tick, 600);
}

// ── SCROLL ANIMATIONS ─────────────────────────
function initScrollAnimations() {
    const els = document.querySelectorAll('.fade-up');
    if (!els.length) return;

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => obs.observe(el));
}

// ── CARD TILT ─────────────────────────────────
function initCardTilt() {
    document.querySelectorAll('.projekt-card').forEach(card => {
        const link = card.closest('a');
        if (!link) return;

        link.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width  - 0.5;
            const y = (e.clientY - r.top)  / r.height - 0.5;
            card.style.transition = 'transform 0.05s ease, border-color 0.3s ease, box-shadow 0.3s ease';
            card.style.transform  = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(8px)`;
        });

        link.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.45s ease, border-color 0.3s ease, box-shadow 0.3s ease';
            card.style.transform  = 'perspective(700px) rotateY(0deg) rotateX(0deg) translateZ(0)';
        });
    });
}

// ── SKILL BARS ────────────────────────────────
function initSkillBars() {
    const bars = document.querySelectorAll('.skill-level .bar.filled');
    if (!bars.length) return;

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('animate');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.5 });

    bars.forEach(b => obs.observe(b));
}

// ── NAV SCROLL EFFECT ─────────────────────────
function initNavScroll() {
    const nav = document.querySelector('header');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
}

// ── STAGGER GRID ──────────────────────────────
function initStaggerGrid() {
    document.querySelectorAll('.projekt-link').forEach((el, i) => {
        el.style.transitionDelay = `${i * 60}ms`;
    });
}

// ── ANIMATED COUNTERS ─────────────────────────
function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const target = parseInt(el.dataset.count || el.textContent, 10);
            if (isNaN(target)) return;
            let start = 0;
            const duration = 1200;
            const step = timestamp => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                el.textContent = Math.floor(progress * target);
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target;
            };
            requestAnimationFrame(step);
            obs.unobserve(el);
        });
    }, { threshold: 0.5 });

    els.forEach(el => obs.observe(el));
}

// ── CARD SPOTLIGHT ────────────────────────────
function initCardSpotlight() {
    document.querySelectorAll('.projekt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            card.style.setProperty('--sx', x + 'px');
            card.style.setProperty('--sy', y + 'px');
            card.classList.add('spotlight-active');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('spotlight-active');
        });
    });
}

// ── PROJECT FILTER ────────────────────────────
function initProjectFilter() {
    const btns = document.querySelectorAll('.filter-btn');
    if (!btns.length) return;

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            document.querySelectorAll('.projekt-link').forEach(link => {
                const card = link.querySelector('.projekt-card');
                const type = card ? card.dataset.type : '';
                if (filter === 'all' || type === filter) {
                    link.classList.remove('hidden');
                } else {
                    link.classList.add('hidden');
                }
            });
        });
    });
}

// ── CURSEFORGE STATS ──────────────────────────
// Download counts come from data/curseforge.json, refreshed every 3 h by a GitHub Action
// (tools/curseforge_stats.py) — the API key stays a GitHub secret and is never in this file.
const CF_FALLBACK_TOTAL = 16312;   // updated 2026-11-02, shown if the file can't be loaded
const CF_STATS_URLS = [
    'https://raw.githubusercontent.com/Maxi-f9xikh/Portfolio/main/data/curseforge.json',
    'data/curseforge.json',
];

function animateStatNumber(el, total) {
    const duration = 1500;
    const startTime = performance.now();
    const step = (now) => {
        const p = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * total).toLocaleString('de-DE');
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = total.toLocaleString('de-DE');
    };
    requestAnimationFrame(step);
}

let cfShownTotal = null;

async function fetchCurseForgeStats() {
    const el = document.getElementById('stat-downloads');
    if (!el) return;

    let total = null;
    for (const url of CF_STATS_URLS) {
        try {
            const r = await fetch(url, { cache: 'no-cache' });
            if (r.ok) { total = (await r.json()).total; break; }
        } catch { /* try the next source */ }
    }
    total = total || CF_FALLBACK_TOTAL;
    if (total !== cfShownTotal) {
        cfShownTotal = total;
        animateStatNumber(el, total);
    }
}

async function pollCurseForgeStats() {
    await fetchCurseForgeStats();
    setInterval(fetchCurseForgeStats, 15 * 60 * 1000);
}

// ── FAVICON ───────────────────────────────────
function initFavicon() {
    if (document.querySelector('link[rel="icon"]')) return;
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%234361ee'/%3E%3Ctext y='74' x='50' text-anchor='middle' font-size='60' font-family='system-ui%2Csans-serif' fill='white' font-weight='900'%3EMS%3C/text%3E%3C/svg%3E";
    document.head.appendChild(link);
}

// ── ACTIVE NAV ────────────────────────────────
function initActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(a => {
        const href = a.getAttribute('href') || '';
        // Skip section links (e.g. index.html#scroll-Projekte) — not page links
        if (href.includes('#')) return;
        const page = href.split('/').pop();
        if (page === current || (current === 'index.html' && page === '')) {
            a.classList.add('nav-active');
        }
    });
}

// ── BACK TO TOP ───────────────────────────────
function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Nach oben scrollen');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ── MOBILE NAV (HAMBURGER) ────────────────────
function initMobileNav() {
    const header = document.querySelector('header');
    const nav    = header ? header.querySelector('nav') : null;
    if (!nav) return;

    // Hamburger button
    const btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Menü öffnen');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(btn);

    // Mobile dark mode button (shown in header on mobile, hidden on desktop via CSS)
    const mobileDark = document.createElement('button');
    mobileDark.className = 'mobile-dark-btn';
    const isDarkNow = () => document.body.classList.contains('dark-mode');
    const updateMobileIcon = () => {
        const dark = isDarkNow();
        mobileDark.innerHTML = `<img src="images/${dark ? 'light_mode' : 'Darkmode'}.png" alt="" style="width:22px;height:22px;opacity:0.6;">`;
        mobileDark.setAttribute('aria-label', dark ? 'Hellmodus einschalten' : 'Dunkelmodus einschalten');
    };
    updateMobileIcon();
    header.appendChild(mobileDark); // after hamburger → right side of header

    mobileDark.addEventListener('click', e => {
        e.stopPropagation();
        const darkEl = document.getElementById('Dark');
        if (darkEl) darkEl.click();
        setTimeout(() => updateMobileIcon(), 10);
    });

    // Keep mobile icon in sync when dark mode toggled elsewhere
    document.body.addEventListener('classChange', () => updateMobileIcon());
    new MutationObserver(() => updateMobileIcon()).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    function close() {
        nav.classList.remove('nav-open');
        btn.classList.remove('active');
        btn.setAttribute('aria-label', 'Menü öffnen');
        btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = nav.classList.toggle('nav-open');
        btn.classList.toggle('active', isOpen);
        btn.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
        btn.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

    document.addEventListener('click', e => { if (!header.contains(e.target)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) close(); });
}

// ── INIT ALL ──────────────────────────────────
function initEffects() {
    initMobileNav();
    initFavicon();
    initActiveNav();
    initBackToTop();
    initCounters();
    initCardSpotlight();
    initCursorGlow();
    initHeroCanvas();
    initTypewriter();
    initScrollAnimations();
    initCardTilt();
    initSkillBars();
    initNavScroll();
    initStaggerGrid();
    initProjectFilter();
    pollCurseForgeStats();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEffects);
} else {
    initEffects();
}
