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

// ── INIT ALL ──────────────────────────────────
function initEffects() {
    initCursorGlow();
    initHeroCanvas();
    initTypewriter();
    initScrollAnimations();
    initCardTilt();
    initSkillBars();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEffects);
} else {
    initEffects();
}
