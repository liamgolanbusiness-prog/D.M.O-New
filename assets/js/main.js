/* DMO Architects — main.js
   Vanilla JS: preloader, scroll progress, reveals, 3D hero, mobile menu,
   counters, project filter, testimonial carousel, form handling, cursor
*/
(() => {
  'use strict';

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = matchMedia('(hover: none), (pointer: coarse)').matches;
  const isSmall = matchMedia('(max-width: 899px)').matches;
  const isLowEnd = (navigator.hardwareConcurrency || 4) <= 4 || navigator.deviceMemory && navigator.deviceMemory <= 4;

  /* ========= Preloader ========= */
  const preloader = document.querySelector('.preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader?.classList.add('is-hidden'), 450);
  });
  // Fallback
  setTimeout(() => preloader?.classList.add('is-hidden'), 2500);

  /* ========= Footer year ========= */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ========= Header scroll state ========= */
  const header = document.getElementById('header');
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 30);

    // progress bar
    const progress = document.querySelector('.scroll-progress span');
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${(y / h) * 100}%`;
    }

    // back to top
    document.getElementById('toTop')?.classList.toggle('is-visible', y > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ========= Smooth section-aware nav active state ========= */
  const links = document.querySelectorAll('.nav__list a[href^="#"]');
  const sections = [...document.querySelectorAll('main section[id]')];
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
  sections.forEach((s) => navObserver.observe(s));

  /* ========= Mobile menu ========= */
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const setMobile = (open) => {
    if (!toggle || !mobileNav) return;
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    mobileNav.dataset.open = String(open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle?.addEventListener('click', () => setMobile(!toggle.classList.contains('is-open')));
  mobileNav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMobile(false)));

  /* ========= Back to top ========= */
  document.getElementById('toTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });

  /* ========= Reveal on scroll ========= */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ========= Counters ========= */
  const counters = document.querySelectorAll('[data-counter]');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.counter, 10);
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target).toString();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => cObs.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = el.dataset.counter));
  }

  /* ========= Project filter ========= */
  const chips = document.querySelectorAll('.projects__filters .chip');
  const cards = document.querySelectorAll('.projects__grid .card');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chips.forEach((c) => {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
      });
      cards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.cat === filter;
        card.hidden = !matches;
      });
    });
  });

  /* ========= Testimonials carousel ========= */
  const track = document.getElementById('testiTrack');
  const prev = document.getElementById('testiPrev');
  const next = document.getElementById('testiNext');
  if (track && prev && next) {
    let index = 0;
    const items = track.children;
    const perView = () => (window.innerWidth < 900 ? 1 : 2);
    const maxIndex = () => Math.max(0, items.length - perView());
    const apply = () => {
      const itemWidth = items[0]?.getBoundingClientRect().width || 0;
      const gap = parseFloat(getComputedStyle(track).gap) || 14;
      // RTL: positive translateX moves right; to slide to next item (visually moving content to the right in RTL) we use +dir
      const dir = getComputedStyle(document.documentElement).direction === 'rtl' ? 1 : -1;
      track.style.transform = `translateX(${index * (itemWidth + gap) * dir}px)`;
    };
    // In RTL, "next" logically means showing the next items from the reader perspective.
    // We keep the same index + / - meaning.
    next.addEventListener('click', () => {
      index = Math.min(maxIndex(), index + 1);
      apply();
    });
    prev.addEventListener('click', () => {
      index = Math.max(0, index - 1);
      apply();
    });
    window.addEventListener('resize', () => {
      index = Math.min(index, maxIndex());
      apply();
    });
    // Auto play
    let auto = setInterval(() => {
      index = index >= maxIndex() ? 0 : index + 1;
      apply();
    }, 6000);
    track.addEventListener('mouseenter', () => clearInterval(auto));
    track.addEventListener('mouseleave', () => {
      auto = setInterval(() => {
        index = index >= maxIndex() ? 0 : index + 1;
        apply();
      }, 6000);
    });
    // swipe
    let sx = 0;
    track.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
    track.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) < 40) return;
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      // In RTL, swiping right should go to previous
      if ((rtl && dx > 0) || (!rtl && dx < 0)) {
        index = Math.min(maxIndex(), index + 1);
      } else {
        index = Math.max(0, index - 1);
      }
      apply();
    }, { passive: true });
    apply();
  }

  /* ========= Form: pretty submit (demo) ========= */
  const form = document.querySelector('.contact__form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    const ok = form.querySelector('.form-ok');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'שולח…';
    setTimeout(() => {
      ok.hidden = false;
      form.reset();
      btn.innerHTML = original;
      btn.disabled = false;
      setTimeout(() => (ok.hidden = true), 5000);
    }, 1100);
  });

  /* ========= Custom cursor (desktop) ========= */
  if (!isCoarse && !prefersReduced) {
    const cursor = document.querySelector('.cursor');
    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.opacity = '1';
    });
    const tick = () => {
      tx += (cx - tx) * 0.18;
      ty += (cy - ty) * 0.18;
      cursor.style.transform = `translate(${tx - 14}px, ${ty - 14}px)`;
      requestAnimationFrame(tick);
    };
    tick();
    document.querySelectorAll('a, button, .card, .service, .chip, .faq__item summary')
      .forEach((el) => {
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
      });
    document.addEventListener('mouseleave', () => (cursor.style.opacity = '0'));
  }

  /* ========= 3D tilt for service cards ========= */
  if (!isCoarse && !prefersReduced) {
    document.querySelectorAll('.service, .card').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `translateY(-4px) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
        el.style.transformStyle = 'preserve-3d';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ========= Parallax for hero grid and about images (desktop only) ========= */
  if (!prefersReduced && !isSmall) {
    const grid = document.querySelector('.hero__grid');
    const aboutMain = document.querySelector('.about__image--main img');
    const aboutSub = document.querySelector('.about__image--sub img');

    let tickScheduled = false;
    const applyParallax = () => {
      tickScheduled = false;
      const y = window.scrollY;
      if (grid) grid.style.transform = `translateY(${y * 0.15}px)`;
      if (aboutMain && y < 1800) aboutMain.style.transform = `translateY(${y * 0.04}px) scale(1.04)`;
      if (aboutSub && y < 1800) aboutSub.style.transform = `translateY(${y * -0.04}px) scale(1.04)`;
    };
    window.addEventListener('scroll', () => {
      if (tickScheduled) return;
      tickScheduled = true;
      requestAnimationFrame(applyParallax);
    }, { passive: true });
  }

  /* =========================================================
     3D HERO — animated architectural wireframe
     Canvas 2D rendering of rotating "building" geometry
     Lightweight, no dependencies
     ========================================================= */
  const canvas = document.getElementById('heroCanvas');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d', { alpha: true });
    // Cap DPR more aggressively on mobile / low-end for performance
    const maxDpr = isSmall || isLowEnd ? 1.4 : 2;
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Build a collection of 3D "buildings" as stacks of rectangles
    const shapes = [];
    const rand = (a, b) => a + Math.random() * (b - a);

    // City grid of small buildings — reduce count on mobile
    const buildingCount = isSmall ? 8 : 14;
    for (let i = 0; i < buildingCount; i++) {
      shapes.push({
        x: rand(-2.2, 2.2),
        y: rand(-1.2, 1.2),
        z: rand(-2, 3),
        w: rand(0.18, 0.4),
        d: rand(0.18, 0.4),
        h: rand(0.4, 1.6),
        color: Math.random() > 0.6 ? 'rgba(201,163,106,0.55)' : 'rgba(236,231,222,0.28)',
      });
    }

    // Floating rings (like the lobby chandelier)
    const rings = [];
    const ringCount = isSmall ? 2 : 4;
    for (let i = 0; i < ringCount; i++) {
      rings.push({
        cx: rand(-1.8, 1.8),
        cy: rand(-0.6, 0.6),
        cz: rand(-1, 2),
        r: rand(0.3, 0.6),
        phase: Math.random() * Math.PI * 2,
      });
    }

    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.6;
      my = (e.clientY / window.innerHeight - 0.5) * 0.6;
    });

    const project = (x, y, z, rotY) => {
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      const xz = x * cy - z * sy;
      const zz = x * sy + z * cy + 5;
      const f = 400 / zz;
      return {
        sx: W / 2 + xz * f,
        sy: H / 2 + y * f,
        scale: f,
        depth: zz,
      };
    };

    const drawBox = (b, rotY) => {
      const hw = b.w / 2, hd = b.d / 2;
      // 8 corners
      const base = [
        { x: b.x - hw, z: b.z - hd, y: b.y },
        { x: b.x + hw, z: b.z - hd, y: b.y },
        { x: b.x + hw, z: b.z + hd, y: b.y },
        { x: b.x - hw, z: b.z + hd, y: b.y },
      ];
      const top = base.map((c) => ({ ...c, y: c.y - b.h }));
      const corners = [...base, ...top].map((c) => project(c.x, c.y, c.z, rotY));

      const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7],
      ];
      ctx.strokeStyle = b.color;
      ctx.lineWidth = Math.max(0.6, 1.1 * (1 / corners[0].depth) * 5);
      ctx.beginPath();
      edges.forEach(([a, c]) => {
        ctx.moveTo(corners[a].sx, corners[a].sy);
        ctx.lineTo(corners[c].sx, corners[c].sy);
      });
      ctx.stroke();
    };

    const drawRing = (r, rotY, t) => {
      const steps = 44;
      ctx.strokeStyle = `rgba(201,163,106,${0.4 + 0.4 * Math.sin(t + r.phase)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x = r.cx + Math.cos(a) * r.r;
        const z = r.cz + Math.sin(a) * r.r;
        const y = r.cy + Math.sin(t * 0.5 + r.phase) * 0.1;
        const p = project(x, y, z, rotY);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
    };

    let t0 = 0;
    let raf;
    const render = (t) => {
      if (!t0) t0 = t;
      const time = (t - t0) / 1000;

      ctx.clearRect(0, 0, W, H);

      const rotY = time * 0.16 + mx * 0.8;

      // Sort by depth for proper painting
      const drawables = shapes.map((s) => ({
        s,
        depth: project(s.x, s.y, s.z, rotY).depth,
      })).sort((a, b) => b.depth - a.depth);

      drawables.forEach(({ s }) => drawBox(s, rotY));
      rings.forEach((r) => drawRing(r, rotY, time));

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    // Pause when offscreen to save battery
    const heroObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) cancelAnimationFrame(raf);
        else raf = requestAnimationFrame(render);
      });
    }, { threshold: 0 });
    heroObs.observe(canvas);
  }

  /* ========= Keyboard accessibility: close mobile nav with ESC ========= */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle?.classList.contains('is-open')) {
      setMobile(false);
    }
  });

})();
