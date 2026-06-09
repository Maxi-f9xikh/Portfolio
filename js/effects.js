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
    // Fade in on load
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    });
    // Fade out before navigating
    document.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
        if (a.target === '_blank') return;
        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => { window.location.href = href; }, 350);
    });
}

// ── ANIMATED COUNTERS ─────────────────────────
function initCounters() {
    const els = document.querySelectorAll('[data-count], .stat-number');
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

// ── INIT ALL ──────────────────────────────────
function initEffects() {
    initPageTransitions();
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEffects);
} else {
    initEffects();
}
