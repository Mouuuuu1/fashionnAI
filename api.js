/* ─── FashionAI API Client ─── shared across all pages ─────── */
(function () {
  const BASE = 'http://localhost:3001/api';

  const FA = window.FashionAPI = {
    get token() { return localStorage.getItem('fashionai_token'); },
    get user()  {
      try { return JSON.parse(localStorage.getItem('fashionai_user')); } catch { return null; }
    },
    isLoggedIn() { return !!this.token; },
    isAdmin()    { return this.user?.role === 'admin'; },

    async req(method, path, body) {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (this.token) opts.headers['Authorization'] = 'Bearer ' + this.token;
      if (body !== undefined) opts.body = JSON.stringify(body);
      const res = await fetch(BASE + path, opts);
      const data = await res.json();
      if (!res.ok) { const e = new Error(data.error || 'Request failed'); e.status = res.status; e.data = data; throw e; }
      return data;
    },
    get(path)        { return this.req('GET', path); },
    post(path, body) { return this.req('POST', path, body); },
    put(path, body)  { return this.req('PUT', path, body); },
    del(path)        { return this.req('DELETE', path); },

    requireAuth(adminOnly = false) {
      if (!this.isLoggedIn()) {
        location.href = '/login.html?redirect=' + encodeURIComponent(location.pathname + location.search);
        return false;
      }
      if (adminOnly && !this.isAdmin()) {
        location.href = '/admin/login.html';
        return false;
      }
      return true;
    },

    logout() {
      localStorage.removeItem('fashionai_token');
      localStorage.removeItem('fashionai_user');
      location.href = '/login.html';
    },

    /* Formatting helpers */
    fmt(n)    { return 'EGP ' + Number(n || 0).toLocaleString(); },
    fmtDate(d){ return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); },
    stars(r)  { const n = Math.round(r||0); return '★'.repeat(n) + '☆'.repeat(5-n); },
    initials(name) { return (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); },
    statusBadge(s) {
      return `<span class="status-badge status-${s}"><span class="status-dot"></span>${s.charAt(0).toUpperCase()+s.slice(1)}</span>`;
    },

    /* Renders a standard product card HTML string */
    productCardHTML(p) {
      const price      = p.sale_price ?? p.price;
      const salePct    = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0;
      const img        = (Array.isArray(p.images) ? p.images[0] : p.image)
                        || `https://placehold.co/400x533/d1d0cb/6e6353?text=${encodeURIComponent(p.name)}`;
      const badge      = p.stock === 0 ? '<span class="product-badge badge-out">Sold Out</span>'
                        : salePct > 0  ? `<span class="product-badge badge-sale">−${salePct}%</span>` : '';
      const overlay    = p.stock > 0
        ? `<div class="product-overlay">
             <button class="overlay-btn" onclick="event.preventDefault();quickAddToCart(${p.id},event)">Add to Cart</button>
             <a href="try-on.html" class="overlay-btn icon">
               <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M3 21a9 9 0 0 1 18 0"/></svg>
             </a>
           </div>` : '';
      return `<div class="product-card">
        <div class="product-img">
          ${badge}
          <img src="${img}" alt="${p.name}" loading="lazy" ${p.stock===0?'style="opacity:.6;"':''}/>
          ${overlay}
          <button class="wishlist-btn" data-pid="${p.id}" onclick="event.preventDefault();toggleWishlist(${p.id},this)">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <a href="product.html?id=${p.id}" class="product-info" style="display:block;">
          <div class="product-brand">${p.brand}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-price-row">
            <span class="product-price"><span class="egp">EGP</span>${Number(price).toLocaleString()}</span>
            ${p.sale_price ? `<span class="product-price-old">EGP ${Number(p.price).toLocaleString()}</span>` : ''}
          </div>
          <div class="product-rating"><span class="stars">${this.stars(p.rating)}</span><span class="rating-count">(${p.reviews_count||0})</span></div>
        </a>
      </div>`;
    },

    /* Quick add-to-cart with size/color picker modal */
    async quickAddToCart(productId, evt) {
      if (!this.isLoggedIn()) {
        location.href = '/login.html?redirect=' + encodeURIComponent(location.pathname + location.search);
        return;
      }
      try {
        const p = await this.get('/products/' + productId);
        const size  = p.sizes[0];
        const color = p.colors[0];
        const data  = await this.post('/cart', { product_id: productId, quantity: 1, size, color });
        localStorage.setItem('fashionai_cart_count', data.item_count);
        if (window.fashionAI?.refreshBadges) window.fashionAI.refreshBadges();
        if (window.fashionAI?.toast) window.fashionAI.toast('Added to cart', 'success');
      } catch(e) {
        if (window.fashionAI?.toast) window.fashionAI.toast(e.message, 'error');
      }
    },

    /* Toggle wishlist */
    async toggleWishlist(productId, btn) {
      if (!this.isLoggedIn()) {
        location.href = '/login.html?redirect=' + encodeURIComponent(location.pathname + location.search);
        return;
      }
      const isActive = btn.classList.contains('active');
      try {
        if (isActive) {
          await this.del('/wishlist/' + productId);
          btn.classList.remove('active');
          btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
          if (window.fashionAI?.toast) window.fashionAI.toast('Removed from wishlist');
        } else {
          await this.post('/wishlist', { product_id: productId });
          btn.classList.add('active');
          btn.innerHTML = '<svg width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
          if (window.fashionAI?.toast) window.fashionAI.toast('Added to wishlist', 'success');
        }
      } catch(e) {
        if (window.fashionAI?.toast) window.fashionAI.toast(e.message, 'error');
      }
    },
  };

  /* Shortcut globals used in onclick handlers */
  window.quickAddToCart = (id, e) => FA.quickAddToCart(id, e);
  window.toggleWishlist = (id, btn) => FA.toggleWishlist(id, btn);
})();
