/* ===========================================================
   Ponnoy Bazar — App Logic
   Data layer uses localStorage as a stand-in "database" so the
   whole site works instantly with zero setup. Swap PB.db's
   methods for real Firebase calls when ready — see FIREBASE
   NOTES at the bottom of this file.
   =========================================================== */

const PB = (() => {

  const LS_KEYS = {
    products: 'pb_products',
    cart: 'pb_cart',
    orders: 'pb_orders',
    messages: 'pb_messages',
    user: 'pb_user',
    theme: 'pb_theme'
  };

  /* ---------------- Seed data ---------------- */
  const SEED_PRODUCTS = [
    { id:'p1', name:'Premium Cotton Panjabi', price:1450, oldPrice:1800, category:'Fashion', img:'https://images.unsplash.com/photo-1622445275576-721325763afe?w=500&q=80', badge:'Sale', stock:24 },
    { id:'p2', name:'Wireless Bluetooth Earbuds', price:1990, oldPrice:null, category:'Electronics', img:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80', badge:'New', stock:40 },
    { id:'p3', name:'Ceramic Coffee Mug Set (4pc)', price:850, oldPrice:1050, category:'Home & Living', img:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80', badge:'Sale', stock:18 },
    { id:'p4', name:'Leather Office Bag', price:3200, oldPrice:null, category:'Fashion', img:'https://images.unsplash.com/photo-1547949003-9792a18a2645?w=500&q=80', badge:null, stock:12 },
    { id:'p5', name:'Smart Watch Series X', price:4500, oldPrice:5200, category:'Electronics', img:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', badge:'Sale', stock:9 },
    { id:'p6', name:'Scented Candle Trio', price:650, oldPrice:null, category:'Home & Living', img:'https://images.unsplash.com/photo-1602874801006-94c0bdf9b7fe?w=500&q=80', badge:null, stock:30 },
    { id:'p7', name:'Kids Building Blocks Set', price:990, oldPrice:1200, category:'Toys', img:'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=500&q=80', badge:'Sale', stock:21 },
    { id:'p8', name:'Skincare Glow Combo', price:1390, oldPrice:null, category:'Beauty', img:'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', badge:'New', stock:33 },
    { id:'p9', name:'Stainless Steel Water Bottle', price:480, oldPrice:600, category:'Home & Living', img:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80', badge:'Sale', stock:50 },
    { id:'p10', name:'Men\'s Sports Sneakers', price:2750, oldPrice:null, category:'Fashion', img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', badge:null, stock:16 },
    { id:'p11', name:'Bluetooth Party Speaker', price:2300, oldPrice:2800, category:'Electronics', img:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80', badge:'Sale', stock:14 },
    { id:'p12', name:'Wooden Wall Clock', price:1100, oldPrice:null, category:'Home & Living', img:'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&q=80', badge:null, stock:20 }
  ];

  function seed(){
    if(!localStorage.getItem(LS_KEYS.products)){
      localStorage.setItem(LS_KEYS.products, JSON.stringify(SEED_PRODUCTS));
    }
    if(!localStorage.getItem(LS_KEYS.cart)) localStorage.setItem(LS_KEYS.cart, JSON.stringify([]));
    if(!localStorage.getItem(LS_KEYS.orders)) localStorage.setItem(LS_KEYS.orders, JSON.stringify([]));
    if(!localStorage.getItem(LS_KEYS.messages)) localStorage.setItem(LS_KEYS.messages, JSON.stringify([]));
  }
  seed();

  /* ---------------- helpers ---------------- */
  const read = k => JSON.parse(localStorage.getItem(k) || '[]');
  const write = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const money = n => '৳' + Number(n).toLocaleString('en-BD');
  const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);

  /* ---------------- DB layer ---------------- */
  const db = {
    getProducts: () => read(LS_KEYS.products),
    getProduct: id => read(LS_KEYS.products).find(p=>p.id===id),
    saveProduct(p){
      const list = read(LS_KEYS.products);
      const i = list.findIndex(x=>x.id===p.id);
      if(i>-1) list[i]=p; else { p.id = p.id || uid(); list.unshift(p); }
      write(LS_KEYS.products, list);
      return p;
    },
    deleteProduct(id){
      write(LS_KEYS.products, read(LS_KEYS.products).filter(p=>p.id!==id));
    },
    getOrders: () => read(LS_KEYS.orders),
    saveOrder(order){
      const list = read(LS_KEYS.orders);
      order.id = 'PB' + (1000 + list.length);
      order.createdAt = new Date().toISOString();
      order.status = 'Pending';
      list.unshift(order);
      write(LS_KEYS.orders, list);
      return order;
    },
    updateOrderStatus(id, status){
      const list = read(LS_KEYS.orders).map(o => o.id===id ? {...o, status} : o);
      write(LS_KEYS.orders, list);
    },
    getMessages: () => read(LS_KEYS.messages),
    saveMessage(msg){
      const list = read(LS_KEYS.messages);
      msg.id = uid(); msg.createdAt = new Date().toISOString();
      list.unshift(msg);
      write(LS_KEYS.messages, list);
      return msg;
    }
  };

  /* ---------------- Cart ---------------- */
  const cart = {
    get: () => read(LS_KEYS.cart),
    add(productId, qty=1){
      const items = read(LS_KEYS.cart);
      const existing = items.find(i=>i.id===productId);
      if(existing) existing.qty += qty;
      else items.push({ id: productId, qty });
      write(LS_KEYS.cart, items);
      updateCartBadge();
    },
    setQty(productId, qty){
      let items = read(LS_KEYS.cart);
      if(qty<=0) items = items.filter(i=>i.id!==productId);
      else items = items.map(i => i.id===productId ? {...i, qty} : i);
      write(LS_KEYS.cart, items);
      updateCartBadge();
    },
    remove(productId){
      write(LS_KEYS.cart, read(LS_KEYS.cart).filter(i=>i.id!==productId));
      updateCartBadge();
    },
    clear(){ write(LS_KEYS.cart, []); updateCartBadge(); },
    detailed(){
      const products = db.getProducts();
      return cart.get().map(i => {
        const p = products.find(p=>p.id===i.id);
        return p ? { ...p, qty:i.qty, lineTotal: p.price * i.qty } : null;
      }).filter(Boolean);
    },
    subtotal(){ return cart.detailed().reduce((s,i)=>s+i.lineTotal,0); },
    count(){ return cart.get().reduce((s,i)=>s+i.qty,0); },
    deliveryCharge(area){
      // simple flat-rate model; tune as needed
      const sub = cart.subtotal();
      if(sub===0) return 0;
      if(area === 'inside_dhaka') return 70;
      if(area === 'outside_dhaka') return 130;
      return 100; // default / not chosen yet
    }
  };

  function updateCartBadge(){
    document.querySelectorAll('[data-cart-count]').forEach(el=>{
      el.textContent = cart.count();
    });
  }

  /* ---------------- Toast ---------------- */
  function toast(message, type='default'){
    let wrap = document.getElementById('toast-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(()=>{
      el.classList.add('out');
      setTimeout(()=>el.remove(), 250);
    }, 2600);
  }

  /* ---------------- Theme ---------------- */
  function initTheme(){
    const saved = localStorage.getItem(LS_KEYS.theme) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }
  function toggleTheme(){
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(LS_KEYS.theme, next);
    updateThemeIcon(next);
  }
  function updateThemeIcon(mode){
    document.querySelectorAll('[data-theme-icon]').forEach(el=>{
      el.innerHTML = mode === 'dark'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    });
  }

  /* ---------------- Auth (mock — swap for Firebase Auth) ---------------- */
  const auth = {
    current: () => JSON.parse(localStorage.getItem(LS_KEYS.user) || 'null'),
    loginWithGoogle(){
      // Placeholder mock. Replace with firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
      const fakeUser = { name:'Customer User', email:'customer@gmail.com', avatar:'https://i.pravatar.cc/100?img=12', via:'google' };
      localStorage.setItem(LS_KEYS.user, JSON.stringify(fakeUser));
      return fakeUser;
    },
    loginAdmin(email, pass){
      if(email === 'admin@ponnoybazar.com' && pass === 'admin123'){
        const u = { name:'Admin', email, role:'admin' };
        localStorage.setItem(LS_KEYS.user, JSON.stringify(u));
        return u;
      }
      return null;
    },
    logout(){ localStorage.removeItem(LS_KEYS.user); }
  };

  return { db, cart, toast, initTheme, toggleTheme, updateCartBadge, auth, money, uid };
})();

/* ===========================================================
   Shared UI wiring — runs on every page
   =========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  PB.initTheme();
  PB.updateCartBadge();

  // Loader
  const loader = document.getElementById('loader');
  if(loader){ window.addEventListener('load', ()=> setTimeout(()=>loader.classList.add('hide'), 350)); setTimeout(()=>loader.classList.add('hide'), 1200); }

  // Theme toggle buttons
  document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{
    btn.addEventListener('click', PB.toggleTheme);
  });

  // Mobile nav burger
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  if(burger && navLinks){
    burger.addEventListener('click', ()=> navLinks.classList.toggle('open'));
  }

  // Cart drawer
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  function renderDrawer(){
    if(!drawer) return;
    const itemsWrap = drawer.querySelector('.drawer-items');
    const items = PB.cart.detailed();
    if(items.length === 0){
      itemsWrap.innerHTML = `<div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l.4 2M7 13h10l3-8H5.6M7 13L5.4 5M7 13l-1.5 4h11M9 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <h3>Your basket is empty</h3><p>Add a few things you like.</p></div>`;
    } else {
      itemsWrap.innerHTML = items.map(i => `
        <div class="drawer-item">
          <img src="${i.img}" alt="${i.name}">
          <div class="drawer-item-info">
            <h4>${i.name}</h4>
            <div class="row">
              <div class="qty-stepper">
                <button data-qty-down="${i.id}">−</button>
                <span>${i.qty}</span>
                <button data-qty-up="${i.id}">+</button>
              </div>
              <b>${PB.money(i.lineTotal)}</b>
            </div>
            <a href="#" class="remove-link" data-remove="${i.id}">Remove</a>
          </div>
        </div>`).join('');
    }
    const subtotal = PB.cart.subtotal();
    drawer.querySelector('[data-subtotal]').textContent = PB.money(subtotal);
    drawer.querySelector('[data-checkout-link]').classList.toggle('disabled-link', subtotal===0);
  }
  function openDrawer(){ renderDrawer(); drawer?.classList.add('open'); overlay?.classList.add('open'); }
  function closeDrawer(){ drawer?.classList.remove('open'); overlay?.classList.remove('open'); }
  document.querySelectorAll('[data-open-cart]').forEach(b=>b.addEventListener('click', openDrawer));
  document.querySelectorAll('[data-close-cart]').forEach(b=>b.addEventListener('click', closeDrawer));
  overlay?.addEventListener('click', closeDrawer);

  drawer?.addEventListener('click', e=>{
    const up = e.target.closest('[data-qty-up]');
    const down = e.target.closest('[data-qty-down]');
    const rm = e.target.closest('[data-remove]');
    if(up){ const i = PB.cart.get().find(x=>x.id===up.dataset.qtyUp); PB.cart.setQty(up.dataset.qtyUp, (i?.qty||0)+1); renderDrawer(); }
    if(down){ const i = PB.cart.get().find(x=>x.id===down.dataset.qtyDown); PB.cart.setQty(down.dataset.qtyDown, (i?.qty||0)-1); renderDrawer(); }
    if(rm){ e.preventDefault(); PB.cart.remove(rm.dataset.remove); renderDrawer(); }
  });

  // Expose for pages that need to refresh drawer after add-to-cart
  window.PB_renderDrawer = renderDrawer;
  window.PB_openDrawer = openDrawer;

  // Add to cart buttons (delegated, works for any product grid)
  document.addEventListener('click', e=>{
    const addBtn = e.target.closest('[data-add-to-cart]');
    if(addBtn){
      PB.cart.add(addBtn.dataset.addToCart, 1);
      PB.toast('Added to your basket', 'success');
      if(typeof window.onAddToCart === 'function') window.onAddToCart();
    }
  });

  // Generic nav search -> redirect to products.html?q=
  document.querySelectorAll('[data-nav-search]').forEach(form=>{
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const q = form.querySelector('input').value.trim();
      window.location.href = `products.html${q ? '?q='+encodeURIComponent(q) : ''}`;
    });
  });

  // Auth-aware nav icon
  const user = PB.auth.current();
  document.querySelectorAll('[data-user-state]').forEach(el=>{
    el.href = user ? (user.role==='admin' ? 'admin.html' : 'login.html') : 'login.html';
    el.title = user ? `Signed in as ${user.name}` : 'Sign in';
  });
});

/* ===========================================================
   FIREBASE NOTES (for production use)
   ===========================================================
   This build runs entirely on localStorage so it works with zero
   setup. To wire in real Firebase services:

   1. Add the SDK to every HTML page <head>:
      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js"></script>

   2. Initialize with your project config (from Firebase console):
      firebase.initializeApp({ apiKey:"...", authDomain:"...", projectId:"...", storageBucket:"..." });

   3. Replace PB.db methods with Firestore calls, e.g.:
      getProducts: async () => (await firebase.firestore().collection('products').get())
                                  .docs.map(d=>({id:d.id, ...d.data()}))

   4. Replace PB.auth.loginWithGoogle with:
      firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())

   5. Use Firebase Storage for product image uploads in admin.html
      instead of pasting image URLs.

   Everything else (UI, cart logic, rendering) stays the same —
   only the data layer functions in PB.db / PB.auth need swapping.
   =========================================================== */
