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
    document.addEventListener('mousemove', e => {
        x = e.clientX;
        y = e.clientY;
        glow.style.left = x + 'px';
        glow.style.top  = y + 'px';
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

// ── PARALLAX HERO ─────────────────────────────
function initParallax() {
    const hero = document.querySelector('.hero-full');
    if (!hero) return;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        hero.style.backgroundPositionY = y * 0.4 + 'px';
    }, { passive: true });
}

// ── NAV SCROLL EFFECT ─────────────────────────
function initNavScroll() {
    const nav = document.querySelector('header');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
}

// ── MAGNETIC BUTTONS ──────────────────────────
function initMagneticButtons() {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const x = (e.clientX - r.left - r.width  / 2) * 0.25;
            const y = (e.clientY - r.top  - r.height / 2) * 0.25;
            btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

// ── STAGGER GRID ──────────────────────────────
function initStaggerGrid() {
    document.querySelectorAll('.projekt-link').forEach((el, i) => {
        el.style.transitionDelay = `${i * 60}ms`;
    });
}

// ── PAGE TRANSITIONS ──────────────────────────
function initPageTransitions() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.35s ease';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    });

    document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
        if (a.target === '_blank') return;

        // Check if this is a same-page hash navigation (e.g. index.html#section)
        const targetPage = href.split('#')[0];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const isSamePage = (targetPage === currentPage || targetPage === '');

        if (isSamePage) {
            // Don't fade — just scroll
            return;
        }

        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => { window.location.href = href; }, 350);
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

// ── HERO PARTICLES ────────────────────────────
function initHeroParticles() {
    const hero = document.querySelector('.hero-full');
    if (!hero) return;

    function spawnParticle() {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        const size = 2 + Math.random() * 3;
        const startX = Math.random() * 100;
        const duration = 4000 + Math.random() * 6000;
        const delay = Math.random() * 3000;
        Object.assign(p.style, {
            width: size + 'px',
            height: size + 'px',
            left: startX + '%',
            animationDuration: duration + 'ms',
            animationDelay: delay + 'ms'
        });
        hero.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
    }

    for (let i = 0; i < 18; i++) spawnParticle();
    setInterval(() => spawnParticle(), 800);
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
// Fallback totals (updated 2026-06-09) used while live fetch loads
const CF_FALLBACK_TOTAL = 4387;
const CF_API_KEY  = '$2a$10$18EzVoXptI4IRb80MWRly.mrE5Qt.pEb9hm510WZCJMcjQF0X4bEu';
const CF_MOD_IDS  = [1286312, 1539858, 1532694]; // boat-fix, underwater-torch, all-stacks-to-67

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

async function fetchCurseForgeStats() {
    const el = document.getElementById('stat-downloads');
    if (!el) return;

    // Show fallback immediately — replaced if live fetch succeeds
    animateStatNumber(el, CF_FALLBACK_TOTAL);

    try {
        const results = await Promise.allSettled(
            CF_MOD_IDS.map(id =>
                fetch(`https://api.curseforge.com/v1/mods/${id}`, {
                    headers: { 'x-api-key': CF_API_KEY, 'Accept': 'application/json' }
                }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
            )
        );

        const liveTotal = results.reduce((sum, r) => {
            if (r.status === 'fulfilled' && r.value?.data?.downloadCount) {
                return sum + r.value.data.downloadCount;
            }
            return sum;
        }, 0);

        if (liveTotal > 0) {
            animateStatNumber(el, liveTotal);
        }
    } catch {
        // Fallback already shown — nothing to do
    }
}

async function pollCurseForgeStats() {
    await fetchCurseForgeStats();
    // Re-fetch every 5 minutes (CurseForge itself batches updates ~every 10-60 min)
    setInterval(fetchCurseForgeStats, 5 * 60 * 1000);
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

// ── INIT ALL ──────────────────────────────────
function initEffects() {
    initPageTransitions();
    initFavicon();
    initActiveNav();
    initBackToTop();
    initCounters();
    initCardSpotlight();
    initHeroParticles();
    initCursorGlow();
    initHeroCanvas();
    initTypewriter();
    initScrollAnimations();
    initCardTilt();
    initSkillBars();
    initParallax();
    initNavScroll();
    initMagneticButtons();
    initStaggerGrid();
    initProjectFilter();
    pollCurseForgeStats();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEffects);
} else {
    initEffects();
}
