/* DMO Architects — projects-page.js
   Powers projects.html (list + filter) and project.html (detail + lightbox).
   Reads window.DMO_PROJECTS from projects-data.js.
*/
(() => {
  'use strict';

  const projects = window.DMO_PROJECTS || [];
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  /* ===========================================================
     LISTING PAGE — projects.html
     =========================================================== */
  const listEl = document.getElementById('projectsList');
  if (listEl && projects.length) {
    const renderCards = (filter) => {
      const items = filter === 'all' ? projects : projects.filter((p) => p.category === filter);
      if (!items.length) {
        listEl.innerHTML = `<p class="project-empty">לא נמצאו פרויקטים בקטגוריה זו.</p>`;
        return;
      }
      listEl.innerHTML = items.map((p, i) => `
        <a href="project.html?id=${encodeURIComponent(p.slug)}" class="project-card" style="--i:${i}">
          <div class="project-card__media">
            <img src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.title)}" loading="lazy" />
            <span class="project-card__count" aria-label="${p.images.length} תמונות">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              ${p.images.length}
            </span>
          </div>
          <div class="project-card__body">
            <span class="project-card__tag">${escapeHtml(p.categoryLabel)}</span>
            <h3>${escapeHtml(p.title)}</h3>
            <p class="project-card__sum">${escapeHtml(p.summary)}</p>
            <div class="project-card__meta">
              <span>מיקום<strong>${escapeHtml(p.location)}</strong></span>
              <span>היקף<strong>${escapeHtml(p.scope)}</strong></span>
            </div>
            <span class="project-card__cta">
              לצפייה בפרויקט
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 6l-8 6 8 6"/></svg>
            </span>
          </div>
        </a>
      `).join('');
    };

    renderCards('all');

    document.querySelectorAll('.projects-list__filters .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;
        document.querySelectorAll('.projects-list__filters .chip').forEach((c) => {
          c.classList.toggle('is-active', c === chip);
          c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
        });
        renderCards(filter);
      });
    });
  }

  /* ===========================================================
     DETAIL PAGE — project.html?id=<slug>
     =========================================================== */
  const detailEl = document.getElementById('projectContainer');
  if (detailEl) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('id');
    const project = projects.find((p) => p.slug === slug);

    if (!project) {
      detailEl.innerHTML = `
        <div class="project-empty">
          <h2 style="margin-bottom:14px;">הפרויקט לא נמצא</h2>
          <p>הפרויקט שביקשת לא קיים. <a href="projects.html" style="color:var(--accent);text-decoration:underline;">חזרה לרשימת הפרויקטים</a></p>
        </div>
      `;
      return;
    }

    /* Update meta + head fields */
    const SITE_ORIGIN = 'https://dmo-arc.com';
    const heroImage = `${SITE_ORIGIN}/${project.images[0]}`;
    document.title = `${project.title} | DMO אדריכלים`;
    const setMeta = (sel, value) => { const el = document.querySelector(sel); if (el && value != null) el.setAttribute('content', value); };
    setMeta('meta[name="description"]', project.summary);
    setMeta('meta[name="keywords"]', `${project.title}, ${project.categoryLabel}, ${project.location}, DMO, אדריכלים`);
    setMeta('meta[property="og:type"]', 'article');
    setMeta('meta[property="og:title"]', `${project.title} — DMO אדריכלים`);
    setMeta('meta[property="og:description"]', project.summary);
    setMeta('meta[property="og:image"]', heroImage);
    setMeta('meta[property="og:url"]', `${SITE_ORIGIN}/project.html?id=${encodeURIComponent(project.slug)}`);
    setMeta('meta[name="twitter:title"]', `${project.title} — DMO אדריכלים`);
    setMeta('meta[name="twitter:description"]', project.summary);
    setMeta('meta[name="twitter:image"]', heroImage);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', `${SITE_ORIGIN}/project.html?id=${encodeURIComponent(project.slug)}`);

    /* Sub-hero text */
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setText('crumbCurrent', project.title);
    setText('projectEyebrow', project.categoryLabel);
    setText('projectTitle', project.title);
    setText('projectSummary', project.summary);

    /* Build prev/next nav */
    const idx = projects.findIndex((p) => p.slug === project.slug);
    const prev = idx > 0 ? projects[idx - 1] : null;
    const next = idx < projects.length - 1 ? projects[idx + 1] : null;

    /* Body */
    detailEl.innerHTML = `
      <div class="project-detail__top">
        <div class="project-detail__intro">
          <h2>תיאור הפרויקט</h2>
          ${project.description.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
        <dl class="project-meta" aria-label="פרטי הפרויקט">
          <div class="project-meta__item"><dt>מיקום</dt><dd>${escapeHtml(project.location)}</dd></div>
          <div class="project-meta__item"><dt>קטגוריה</dt><dd>${escapeHtml(project.categoryLabel)}</dd></div>
          <div class="project-meta__item"><dt>שנה</dt><dd>${escapeHtml(project.year)}</dd></div>
          <div class="project-meta__item"><dt>היקף השירות</dt><dd>${escapeHtml(project.scope)}</dd></div>
        </dl>
      </div>

      <div class="section-head section-head--split" style="margin-bottom:22px;">
        <div>
          <span class="eyebrow">דגשים</span>
          <h2 class="section-title" style="margin-top:8px;">
            <span class="is-serif">מה ייחד</span> את הפרויקט.
          </h2>
        </div>
      </div>
      <ul class="project-highlights">
        ${project.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
      </ul>

      <div class="section-head section-head--split" style="margin: 50px 0 12px;">
        <div>
          <span class="eyebrow">גלריה</span>
          <h2 class="section-title" style="margin-top:8px;">
            <span class="is-serif">מבט</span> מהשטח.
          </h2>
        </div>
        <span style="color:var(--text-mute);font-size:13px;letter-spacing:.08em;">${project.images.length} תמונות · לחיצה להגדלה</span>
      </div>
      <div class="gallery" id="projectGallery">
        ${project.images.map((src, i) => `
          <button class="gallery__item" data-index="${i}" type="button" aria-label="הגדלת תמונה ${i + 1}">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(project.title)} — תמונה ${i + 1}" loading="lazy" />
          </button>
        `).join('')}
      </div>

      <nav class="project-nav" aria-label="ניווט בין פרויקטים">
        ${prev ? `
          <a href="project.html?id=${encodeURIComponent(prev.slug)}">
            <span><small>הפרויקט הקודם</small><strong>${escapeHtml(prev.title)}</strong></span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          </a>
        ` : '<span></span>'}
        ${next ? `
          <a href="project.html?id=${encodeURIComponent(next.slug)}" style="text-align:start;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
            <span><small>הפרויקט הבא</small><strong>${escapeHtml(next.title)}</strong></span>
          </a>
        ` : '<span></span>'}
      </nav>
    `;

    /* JSON-LD for the project */
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      description: project.summary,
      image: project.images.map((i) => `${SITE_ORIGIN}/${i}`),
      author: { '@type': 'Organization', name: 'די.אם.או. אדריכלים בע"מ', url: SITE_ORIGIN },
      locationCreated: { '@type': 'Place', name: project.location },
      dateCreated: project.year
    });
    document.head.appendChild(ld);

    /* BreadcrumbList JSON-LD */
    const crumbLd = document.createElement('script');
    crumbLd.type = 'application/ld+json';
    crumbLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'בית', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'פרויקטים', item: `${SITE_ORIGIN}/projects.html` },
        { '@type': 'ListItem', position: 3, name: project.title, item: `${SITE_ORIGIN}/project.html?id=${encodeURIComponent(project.slug)}` }
      ]
    });
    document.head.appendChild(crumbLd);

    /* ============== Lightbox ============== */
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lbImg');
    const lbCounter = document.getElementById('lbCounter');
    const lbPrev = document.getElementById('lbPrev');
    const lbNext = document.getElementById('lbNext');
    const lbClose = document.getElementById('lbClose');
    const isRTL = getComputedStyle(document.documentElement).direction === 'rtl';

    let currentIndex = 0;
    let lastFocus = null;

    const showImage = (i) => {
      currentIndex = (i + project.images.length) % project.images.length;
      lbImg.src = project.images[currentIndex];
      lbImg.alt = `${project.title} — תמונה ${currentIndex + 1}`;
      lbCounter.textContent = `${currentIndex + 1} / ${project.images.length}`;
    };

    const openLightbox = (i) => {
      lastFocus = document.activeElement;
      showImage(i);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      lbClose.focus();
    };

    const closeLightbox = () => {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    document.querySelectorAll('#projectGallery .gallery__item').forEach((btn) => {
      btn.addEventListener('click', () => openLightbox(parseInt(btn.dataset.index, 10)));
    });

    lbClose?.addEventListener('click', closeLightbox);
    lb?.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });

    /* In RTL, the visual "prev" arrow (right side) should go to the previous image */
    lbPrev?.addEventListener('click', () => showImage(currentIndex - 1));
    lbNext?.addEventListener('click', () => showImage(currentIndex + 1));

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showImage(currentIndex + (isRTL ? 1 : -1));
      else if (e.key === 'ArrowRight') showImage(currentIndex + (isRTL ? -1 : 1));
    });

    /* swipe on touch devices */
    let touchStartX = 0;
    lb?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lb?.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 40) return;
      if ((isRTL && dx > 0) || (!isRTL && dx < 0)) showImage(currentIndex + 1);
      else showImage(currentIndex - 1);
    }, { passive: true });
  }
})();
