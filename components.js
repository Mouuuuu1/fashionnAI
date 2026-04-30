/* ─── Shared nav + footer injection ─────────────────────────── */
(function () {
  const isAdmin = location.pathname.includes('/admin/');
  const root = isAdmin ? '../' : '';

  /* ── Navigation ── */
  const navHTML = `
<nav id="main-nav">
  <div class="nav-logo">
    <a href="${root}index.html">FASHIONAI</a>
    <span>CREATE BEAUTY STUDIO · EST. 2023</span>
  </div>
  <ul class="nav-links">
    <li><a href="${root}catalog.html?cat=women" data-path="women">Women</a></li>
    <li><a href="${root}catalog.html?cat=men" data-path="men">Men</a></li>
    <li><a href="${root}catalog.html?cat=kids" data-path="kids">Kids</a></li>
    <li><a href="${root}catalog.html?cat=accessories" data-path="accessories">Accessories</a></li>
    <li><a href="${root}catalog.html?sale=1" data-path="sale">Sale</a></li>
  </ul>
  <div class="nav-actions">
    <div class="nav-search">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" placeholder="Search garments, brands…" id="nav-search-input" />
    </div>
    <a href="${root}wishlist.html" class="nav-icon" title="Wishlist">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <span class="badge" id="wishlist-count">0</span>
    </a>
    <a href="${root}cart.html" class="nav-icon" title="Cart">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      <span class="badge" id="cart-count">0</span>
    </a>
    <div id="nav-auth-slot"></div>
  </div>
</nav>`;

  /* ── Footer ── */
  const footerHTML = `
<footer id="main-footer">
  <div class="footer-grid">
    <div>
      <div class="footer-logo">FASHIONAI</div>
      <div class="footer-logo-sub">Create Beauty Studio · Est. 2023</div>
      <p class="footer-about">The first Egyptian fashion platform with AI-powered virtual try-on. Wear it before you buy it.</p>
      <div class="footer-social">
        <a class="social-btn" href="#" title="Instagram" aria-label="Instagram">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
        </a>
        <a class="social-btn" href="#" title="TikTok" aria-label="TikTok">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.44a8.28 8.28 0 0 0 4.83 1.54V7.54a4.85 4.85 0 0 1-1.06-.85z"/></svg>
        </a>
        <a class="social-btn" href="#" title="Pinterest" aria-label="Pinterest">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.19-2.38.04-3.4l1.36-5.77s-.35-.69-.35-1.71c0-1.61.93-2.81 2.09-2.81.99 0 1.46.74 1.46 1.63 0 .99-.63 2.48-.96 3.86-.27 1.15.58 2.09 1.71 2.09 2.05 0 3.42-2.6 3.42-5.67 0-2.35-1.59-4-4.34-4a4.93 4.93 0 0 0-5.2 4.97c0 .93.27 1.57.67 2.13.19.23.21.32.15.58-.05.18-.16.63-.2.8-.06.25-.24.34-.45.25-1.66-.68-2.43-2.5-2.43-4.56 0-3.5 2.88-7.53 8.62-7.53 4.54 0 7.57 3.25 7.57 6.74 0 4.52-2.52 7.89-6.23 7.89-1.22 0-2.38-.66-2.77-1.42l-.75 2.92c-.27 1.04-1 2.35-1.49 3.14A12 12 0 0 0 24 12 12 12 0 0 0 12 0z"/></svg>
        </a>
      </div>
    </div>
    <div>
      <div class="footer-col-title">Shop</div>
      <ul class="footer-links">
        <li><a href="${root}catalog.html?cat=women"><span>→</span> Women</a></li>
        <li><a href="${root}catalog.html?cat=men"><span>→</span> Men</a></li>
        <li><a href="${root}catalog.html?cat=kids"><span>→</span> Kids</a></li>
        <li><a href="${root}catalog.html?cat=accessories"><span>→</span> Accessories</a></li>
        <li><a href="${root}catalog.html?sale=1"><span>→</span> Sale</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-col-title">Features</div>
      <ul class="footer-links">
        <li><a href="${root}try-on.html"><span>→</span> AI Virtual Try-On</a></li>
        <li><a href="${root}wishlist.html"><span>→</span> Wishlist</a></li>
        <li><a href="${root}orders.html"><span>→</span> Order Tracking</a></li>
        <li><a href="${root}profile.html"><span>→</span> My Account</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-col-title">Support</div>
      <ul class="footer-links">
        <li><a href="${root}help.html"><span>→</span> Help Centre</a></li>
        <li><a href="${root}returns.html"><span>→</span> Returns & Refunds</a></li>
        <li><a href="${root}size-guide.html"><span>→</span> Size Guide</a></li>
        <li><a href="${root}contact.html"><span>→</span> Contact Us</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-copyright">© 2025 FashionAI — Create Beauty Studio. All rights reserved.</div>
    <div class="footer-legal">
      <a href="${root}privacy-policy.html">Privacy Policy</a>
      <a href="${root}terms.html">Terms of Service</a>
      <a href="${root}cookie-policy.html">Cookie Policy</a>
    </div>
  </div>
</footer>`;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
  if (!isAdmin) document.body.insertAdjacentHTML('beforeend', footerHTML);

  /* ── Auth nav slot ── */
  function renderAuthNav() {
    const slot = document.getElementById('nav-auth-slot');
    if (!slot) return;
    let token = null;
    try { token = localStorage.getItem('fashionai_token'); } catch {}
    if (token) {
      let user = null;
      try { user = JSON.parse(localStorage.getItem('fashionai_user')); } catch {}
      const initial = user && user.name ? user.name.trim()[0].toUpperCase() : '?';
      slot.innerHTML = `
        <a href="${root}profile.html" class="nav-icon" title="My Account">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </a>
        <button class="nav-icon" id="nav-logout-btn" title="Sign Out" style="background:none;border:none;padding:0;cursor:none;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>`;
      document.getElementById('nav-logout-btn').addEventListener('click', function () {
        localStorage.removeItem('fashionai_token');
        localStorage.removeItem('fashionai_user');
        location.href = root + 'login.html';
      });
    } else {
      slot.innerHTML = `
        <a href="${root}login.html" class="nav-icon" title="Sign In" style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign In
        </a>`;
    }
  }
  renderAuthNav();

  /* ── Active nav link ── */
  const path = location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (path === root + 'index.html' || path === '/') return;
    const href = a.getAttribute('href');
    if (href && path.includes('catalog') && a.getAttribute('data-path') === new URLSearchParams(location.search).get('cat')) {
      a.classList.add('active');
    }
  });

  /* ── Scroll effect ── */
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));

  /* ── Custom cursor ── */
  const cursor = document.createElement('div'); cursor.className = 'cursor'; cursor.id = 'cursor';
  const trail  = document.createElement('div'); trail.className  = 'cursor-trail'; trail.id = 'cursorTrail';
  document.body.prepend(trail); document.body.prepend(cursor);
  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  });
  function animateTrail() {
    tx += (mx - tx) * .12; ty += (my - ty) * .12;
    trail.style.left = tx + 'px'; trail.style.top = ty + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a,button,input,select,textarea,.product-card,.cat-card,.size-btn,.color-swatch,.filter-checkbox,.tab,.page-btn')) {
      cursor.classList.add('hovering');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a,button,input,select,textarea,.product-card,.cat-card,.size-btn,.color-swatch,.filter-checkbox,.tab,.page-btn')) {
      cursor.classList.remove('hovering');
    }
  });

  /* ── Reveal on scroll ── */
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => el.classList.add('hidden'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.remove('hidden');
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: .05, rootMargin: '100px 0px 0px 0px' });
  reveals.forEach(el => observer.observe(el));

  /* ── Wishlist heart toggle ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    btn.classList.toggle('active');
    const isActive = btn.classList.contains('active');
    btn.innerHTML = isActive
      ? `<svg width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
      : `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    const current = parseInt(localStorage.getItem('fashionai_wishlist_count') || '0');
    const next = isActive ? current + 1 : Math.max(0, current - 1);
    localStorage.setItem('fashionai_wishlist_count', next);
    refreshBadges();
    if (window.fashionAI && window.fashionAI.toast) {
      window.fashionAI.toast(isActive ? 'Added to wishlist' : 'Removed from wishlist', isActive ? 'success' : '');
    }
  });

  /* ── Nav search redirect ── */
  const searchInput = document.getElementById('nav-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        location.href = root + 'search.html?q=' + encodeURIComponent(searchInput.value.trim());
      }
    });
  }

  /* ── Cart / Wishlist badge counts (localStorage) ── */
  if (!localStorage.getItem('fashionai_cart_count')) localStorage.setItem('fashionai_cart_count', '2');
  if (!localStorage.getItem('fashionai_wishlist_count')) localStorage.setItem('fashionai_wishlist_count', '3');
  function refreshBadges() {
    const cc = document.getElementById('cart-count');
    const wc = document.getElementById('wishlist-count');
    const c = parseInt(localStorage.getItem('fashionai_cart_count') || '0');
    const w = parseInt(localStorage.getItem('fashionai_wishlist_count') || '0');
    if (cc) { cc.textContent = c; cc.style.display = c > 0 ? '' : 'none'; }
    if (wc) { wc.textContent = w; wc.style.display = w > 0 ? '' : 'none'; }
  }
  refreshBadges();
  window.fashionAI = window.fashionAI || {};
  window.fashionAI.updateCartCount = function(n) { localStorage.setItem('fashionai_cart_count', Math.max(0,n)); refreshBadges(); };
  window.fashionAI.updateWishlistCount = function(n) { localStorage.setItem('fashionai_wishlist_count', Math.max(0,n)); refreshBadges(); };
  window.fashionAI.refreshBadges = refreshBadges;

  /* ── Toast notification system ── */
  const toastCSS = `
    #fa-toast-container { position:fixed; bottom:32px; right:32px; z-index:9990; display:flex; flex-direction:column; gap:12px; pointer-events:none; }
    .fa-toast { background:var(--ink); color:var(--white); padding:14px 20px; font-size:12px; font-weight:600; letter-spacing:.04em; display:flex; align-items:center; gap:10px; border-left:3px solid var(--brown); box-shadow: 0 8px 32px rgba(46,46,46,.24), 0 2px 8px rgba(46,46,46,.16); opacity:0; transform:translateY(12px); transition:opacity .25s, transform .25s; pointer-events:all; max-width:340px; }
    .fa-toast.show { opacity:1; transform:translateY(0); }
    .fa-toast.success { border-left-color:var(--success); }
    .fa-toast.error { border-left-color:var(--danger); }
  `;
  const toastStyleEl = document.createElement('style'); toastStyleEl.textContent = toastCSS; document.head.appendChild(toastStyleEl);
  const toastContainer = document.createElement('div'); toastContainer.id = 'fa-toast-container'; document.body.appendChild(toastContainer);
  window.fashionAI.toast = function(msg, type = '') {
    const t = document.createElement('div'); t.className = 'fa-toast' + (type ? ' ' + type : '');
    const icon = type === 'success' ? '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
                : type === 'error'   ? '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
                : '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    t.innerHTML = icon + msg;
    toastContainer.appendChild(t);
    requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
  };
})();
