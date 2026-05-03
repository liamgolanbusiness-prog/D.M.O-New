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

  /* ========= Testimonials — continuous marquee with drag ========= */
  const track = document.getElementById('testiTrack');
  const prev = document.getElementById('testiPrev');
  const next = document.getElementById('testiNext');
  const viewport = track?.parentElement;
  if (track && viewport) {
    // Duplicate cards so the loop is seamless
    Array.from(track.children).forEach((el) => {
      const c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });

    const isRtl = getComputedStyle(document.documentElement).direction === 'rtl';
    // In RTL we want testimonials to drift right-to-left in reading order, which
    // means the track translates to the +x direction over time. In LTR we go negative.
    const sign = isRtl ? 1 : -1;
    const SPEED = 22; // px/sec — slow

    let offset = 0;
    let halfWidth = 0;
    const recalc = () => { halfWidth = track.scrollWidth / 2; };
    recalc();
    window.addEventListener('resize', recalc);

    const apply = () => {
      track.style.transform = `translateX(${sign * offset}px)`;
    };

    const wrap = () => {
      while (offset >= halfWidth) offset -= halfWidth;
      while (offset < 0) offset += halfWidth;
    };

    let paused = false;
    let pauseTimer = 0;
    const resumeAuto = (delay = 1500) => {
      clearTimeout(pauseTimer);
      pauseTimer = setTimeout(() => { paused = false; lastT = performance.now(); }, delay);
    };
    const holdAuto = () => {
      paused = true;
      clearTimeout(pauseTimer);
    };

    let lastT = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      if (!paused && !document.hidden && !prefersReduced) {
        offset += SPEED * dt;
        wrap();
        apply();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Hover pause
    viewport.addEventListener('mouseenter', holdAuto);
    viewport.addEventListener('mouseleave', () => resumeAuto(200));

    // Mouse drag
    let dragging = false;
    let startX = 0;
    let startOffset = 0;
    viewport.addEventListener('mousedown', (e) => {
      dragging = true;
      startX = e.clientX;
      startOffset = offset;
      viewport.classList.add('is-dragging');
      holdAuto();
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      // In RTL, dragging content rightward (positive dx) advances reading (offset grows).
      // sign*offset = sign*startOffset + dx  =>  offset = startOffset + dx/sign  =>  startOffset + dx*sign
      offset = startOffset + dx * sign;
      wrap();
      apply();
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      resumeAuto(2000);
    };
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('mouseleave', endDrag);

    // Touch drag
    let touching = false;
    let tStartX = 0;
    let tStartOffset = 0;
    viewport.addEventListener('touchstart', (e) => {
      touching = true;
      tStartX = e.touches[0].clientX;
      tStartOffset = offset;
      holdAuto();
    }, { passive: true });
    viewport.addEventListener('touchmove', (e) => {
      if (!touching) return;
      const dx = e.touches[0].clientX - tStartX;
      offset = tStartOffset + dx * sign;
      wrap();
      apply();
    }, { passive: true });
    const endTouch = () => {
      if (!touching) return;
      touching = false;
      resumeAuto(2000);
    };
    viewport.addEventListener('touchend', endTouch, { passive: true });
    viewport.addEventListener('touchcancel', endTouch, { passive: true });

    // Prev / next buttons nudge the offset by one card width
    const stepSize = () => {
      const card = track.children[0];
      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      return (card?.getBoundingClientRect().width || 320) + gap;
    };
    next?.addEventListener('click', () => {
      offset += stepSize();
      wrap();
      apply();
      holdAuto();
      resumeAuto(3500);
    });
    prev?.addEventListener('click', () => {
      offset -= stepSize();
      wrap();
      apply();
      holdAuto();
      resumeAuto(3500);
    });

    apply();
  }

  /* ========= Gallery strip — slow auto-rotating photo marquee ========= */
  const galleryTrack = document.getElementById('galleryTrack');
  const galleryViewport = document.getElementById('galleryViewport');
  if (galleryTrack && galleryViewport) {
    Array.from(galleryTrack.children).forEach((el) => {
      const c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      galleryTrack.appendChild(c);
    });

    const isRtlG = getComputedStyle(document.documentElement).direction === 'rtl';
    const signG = isRtlG ? 1 : -1;
    const SPEEDG = 28;

    let offsetG = 0;
    let halfG = 0;
    const recalcG = () => { halfG = galleryTrack.scrollWidth / 2; };
    recalcG();
    window.addEventListener('resize', recalcG);
    window.addEventListener('load', recalcG);

    const applyG = () => {
      galleryTrack.style.transform = `translateX(${signG * offsetG}px)`;
    };
    const wrapG = () => {
      while (offsetG >= halfG) offsetG -= halfG;
      while (offsetG < 0) offsetG += halfG;
    };

    let pausedG = false;
    let pauseTimerG = 0;
    const resumeG = (delay = 1500) => {
      clearTimeout(pauseTimerG);
      pauseTimerG = setTimeout(() => { pausedG = false; lastTG = performance.now(); }, delay);
    };
    const holdG = () => { pausedG = true; clearTimeout(pauseTimerG); };

    let lastTG = performance.now();
    const tickG = (t) => {
      const dt = Math.min(0.05, (t - lastTG) / 1000);
      lastTG = t;
      if (!pausedG && !document.hidden && !prefersReduced) {
        offsetG += SPEEDG * dt;
        wrapG();
        applyG();
      }
      requestAnimationFrame(tickG);
    };
    requestAnimationFrame(tickG);

    galleryViewport.addEventListener('mouseenter', holdG);
    galleryViewport.addEventListener('mouseleave', () => resumeG(200));

    let dragG = false;
    let dxStartG = 0;
    let dxStartOffsetG = 0;
    galleryViewport.addEventListener('mousedown', (e) => {
      dragG = true;
      dxStartG = e.clientX;
      dxStartOffsetG = offsetG;
      galleryViewport.classList.add('is-dragging');
      holdG();
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragG) return;
      const dx = e.clientX - dxStartG;
      offsetG = dxStartOffsetG + dx * signG;
      wrapG();
      applyG();
    });
    const endDragG = () => {
      if (!dragG) return;
      dragG = false;
      galleryViewport.classList.remove('is-dragging');
      resumeG(2000);
    };
    window.addEventListener('mouseup', endDragG);
    window.addEventListener('mouseleave', endDragG);

    let touchG = false;
    let tdxStartG = 0;
    let tdxStartOffsetG = 0;
    galleryViewport.addEventListener('touchstart', (e) => {
      touchG = true;
      tdxStartG = e.touches[0].clientX;
      tdxStartOffsetG = offsetG;
      holdG();
    }, { passive: true });
    galleryViewport.addEventListener('touchmove', (e) => {
      if (!touchG) return;
      const dx = e.touches[0].clientX - tdxStartG;
      offsetG = tdxStartOffsetG + dx * signG;
      wrapG();
      applyG();
    }, { passive: true });
    const endTouchG = () => {
      if (!touchG) return;
      touchG = false;
      resumeG(2000);
    };
    galleryViewport.addEventListener('touchend', endTouchG, { passive: true });
    galleryViewport.addEventListener('touchcancel', endTouchG, { passive: true });

    applyG();
  }

  /* ========= Form: real submit via Web3Forms ========= */
  const form = document.querySelector('.contact__form');
  if (form) {
    const btn = form.querySelector('button[type="submit"]');
    const ok = form.querySelector('.form-ok');
    const originalBtn = btn?.innerHTML;

    const showStatus = (el, msg, isError) => {
      if (!el) return;
      el.textContent = msg;
      el.hidden = false;
      el.classList.toggle('is-error', !!isError);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      btn.disabled = true;
      btn.innerHTML = 'שולח…';
      ok && (ok.hidden = true);

      const formData = new FormData(form);
      const accessKey = formData.get('access_key');
      const isPlaceholder = !accessKey || /YOUR_WEB3FORMS_ACCESS_KEY_HERE/.test(accessKey);

      try {
        if (isPlaceholder) throw new Error('access_key_missing');
        const res = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          showStatus(ok, 'תודה! ההודעה נשלחה. נחזור אליכם בהקדם.', false);
          form.reset();
          setTimeout(() => (ok.hidden = true), 6000);
        } else {
          throw new Error(data.message || 'submit_failed');
        }
      } catch (err) {
        const name = encodeURIComponent(formData.get('name') || '');
        const phone = encodeURIComponent(formData.get('phone') || '');
        const email = encodeURIComponent(formData.get('email') || '');
        const service = encodeURIComponent(formData.get('service') || '');
        const message = encodeURIComponent(formData.get('message') || '');
        const body = `שם: ${decodeURIComponent(name)}%0Aטלפון: ${decodeURIComponent(phone)}%0Aאימייל: ${decodeURIComponent(email)}%0Aתחום: ${decodeURIComponent(service)}%0A%0A${decodeURIComponent(message)}`;
        const mailto = `mailto:dmoarc@gmail.com?subject=${encodeURIComponent('פנייה מהאתר')}&body=${body}`;
        showStatus(
          ok,
          'שליחה דרך השרת נכשלה. פותחים עבורכם הודעת אימייל...',
          true
        );
        window.location.href = mailto;
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtn;
      }
    });
  }

  /* Custom cursor and 3D card tilt removed for the bright/professional theme */

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

  /* ========= Hero slideshow ========= */
  {
    const wrap = document.getElementById('heroSlides');
    if (wrap) {
      const slides = Array.from(wrap.querySelectorAll('.hero__slide'));
      if (slides.length > 1) {
        let i = 0;
        const interval = prefersReduced ? 7000 : 5000;
        let timer = setInterval(next, interval);

        function next() {
          slides[i].classList.remove('is-active');
          i = (i + 1) % slides.length;
          slides[i].classList.add('is-active');
        }

        const obs = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              if (!timer) timer = setInterval(next, interval);
            } else {
              clearInterval(timer); timer = null;
            }
          });
        }, { threshold: 0 });
        obs.observe(wrap);
      }
    }
  }

  /* ========= Keyboard accessibility: close mobile nav with ESC ========= */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle?.classList.contains('is-open')) {
      setMobile(false);
    }
  });

})();
