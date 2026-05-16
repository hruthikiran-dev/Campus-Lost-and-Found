const BASE_URL = 'https://campus-lost-and-found-g6bi.onrender.com/api';
// ── AUTH ──────────────────────────────────────

async function register() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const msg = document.getElementById('register-message');

  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'index.html';
  } else {
    msg.className = 'message error';
    msg.textContent = data.message;
  }
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const msg = document.getElementById('login-message');

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'index.html';
  } else {
    msg.className = 'message error';
    msg.textContent = data.message;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function updateNav() {
  const token = localStorage.getItem('token');
  const authLinks = document.getElementById('auth-links');
  const logoutBtn = document.getElementById('logout-btn');
  if (token) {
    if (authLinks) authLinks.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    if (authLinks) authLinks.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// ── STATS ─────────────────────────────────────

async function loadStats() {
  try {
    const [allRes, lostRes, foundRes] = await Promise.all([
      fetch(`${BASE_URL}/items`),
      fetch(`${BASE_URL}/items?type=lost`),
      fetch(`${BASE_URL}/items?type=found`)
    ]);
    const [all, lost, found] = await Promise.all([allRes.json(), lostRes.json(), foundRes.json()]);

    animateCount('total-count', all.length);
    animateCount('lost-count', lost.length);
    animateCount('found-count', found.length);
  } catch (err) {
    console.log('Stats error:', err);
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let count = 0;
  const step = Math.ceil(target / 20);
  const interval = setInterval(() => {
    count = Math.min(count + step, target);
    el.textContent = count;
    if (count >= target) clearInterval(interval);
  }, 40);
}

// ── ITEMS ─────────────────────────────────────

async function loadItems() {
  const type     = document.getElementById('filter-type')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const search   = document.getElementById('search-input')?.value || '';
  const grid     = document.getElementById('items-grid');

  let url = `${BASE_URL}/items?`;
  if (type)     url += `type=${type}&`;
  if (category) url += `category=${category}&`;
  if (search)   url += `search=${encodeURIComponent(search)}&`;

  try {
    const res   = await fetch(url);
    const items = await res.json();

    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>No items found. Be the first to post!</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map((item, i) => `
      <div class="item-card ${item.type}" style="animation-delay:${i * 0.06}s" onclick="window.location='item.html?id=${item._id}'">
        ${item.imageUrl
          ? `<img src="${item.imageUrl}" alt="${item.title}" class="item-image" />`
          : `<div class="no-image">📦</div>`}
        <div class="item-info">
          <div class="item-info-top">
            <span class="badge ${item.type}">${item.type}</span>
            <span class="item-date">${timeAgo(item.createdAt)}</span>
          </div>
          <h3>${item.title}</h3>
          <p class="item-desc">${item.description.substring(0, 90)}${item.description.length > 90 ? '...' : ''}</p>
          <div class="item-meta">
            <div class="meta-row"><span class="meta-icon">📍</span>${item.location}</div>
            <div class="meta-row"><span class="meta-icon">🏷️</span>${item.category}</div>
            <div class="meta-row"><span class="meta-icon">✉️</span>${item.contactEmail}</div>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Error loading items. Make sure the server is running.</p>
      </div>`;
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

// ── POST ITEM ─────────────────────────────────

async function postItem() {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  const formData = new FormData();
  formData.append('type',         document.getElementById('item-type').value);
  formData.append('title',        document.getElementById('title').value);
  formData.append('description',  document.getElementById('description').value);
  formData.append('category',     document.getElementById('category').value);
  formData.append('location',     document.getElementById('location').value);
  formData.append('contactEmail', document.getElementById('contactEmail').value);

  const imageFile = document.getElementById('image').files[0];
  if (imageFile) formData.append('image', imageFile);

  const msg = document.getElementById('post-message');
  const btn = document.getElementById('post-btn');
  btn.textContent = 'Posting...';
  btn.disabled = true;

  const res  = await fetch(`${BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const data = await res.json();

  if (res.ok) {
    msg.className = 'message success';
    msg.textContent = '✓ Item posted successfully! Redirecting...';
    setTimeout(() => window.location.href = 'index.html', 1500);
  } else {
    msg.className = 'message error';
    msg.textContent = data.message;
    btn.textContent = 'Post Item →';
    btn.disabled = false;
  }
}

// ── ITEM DETAIL PAGE ──────────────────────────

async function loadItemDetail() {
  const id   = new URLSearchParams(window.location.search).get('id');
  const wrap = document.getElementById('item-detail');
  if (!id) { wrap.innerHTML = '<p>Item not found.</p>'; return; }

  const res  = await fetch(`${BASE_URL}/items/${id}`);
  const item = await res.json();

  const user      = JSON.parse(localStorage.getItem('user') || 'null');
  const isOwner   = user && item.postedBy && (item.postedBy._id === user.id || item.postedBy === user.id);
  const token     = localStorage.getItem('token');

  wrap.innerHTML = `
    <div class="detail-card">
      ${item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.title}" class="detail-image" />`
        : `<div class="detail-no-image">📦</div>`}
      <div class="detail-body">
        <div class="detail-top">
          <span class="badge ${item.type}">${item.type}</span>
          <span class="item-date">${timeAgo(item.createdAt)}</span>
        </div>
        <h1 class="detail-title">${item.title}</h1>
        <p class="detail-desc">${item.description}</p>
        <div class="detail-meta">
          <div class="detail-meta-row"><span>📍</span><span>${item.location}</span></div>
          <div class="detail-meta-row"><span>🏷️</span><span>${item.category}</span></div>
          <div class="detail-meta-row"><span>✉️</span><a href="mailto:${item.contactEmail}">${item.contactEmail}</a></div>
          <div class="detail-meta-row"><span>👤</span><span>Posted by ${item.postedBy?.name || 'Unknown'}</span></div>
          <div class="detail-meta-row"><span>📅</span><span>${new Date(item.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</span></div>
        </div>
        <div class="detail-status ${item.status}">
          ${item.status === 'resolved' ? '✅ This item has been resolved' : '🟢 Still active'}
        </div>
        ${isOwner && item.status === 'active' ? `
          <button class="btn-resolve" onclick="resolveItem('${item._id}')">
            ✓ Mark as Resolved
          </button>` : ''}
        <a href="index.html" class="btn-back">← Back to all items</a>
      </div>
    </div>`;
}

async function resolveItem(id) {
  const token = localStorage.getItem('token');
  const res   = await fetch(`${BASE_URL}/items/${id}/resolve`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    alert('Item marked as resolved!');
    window.location.reload();
  }
}