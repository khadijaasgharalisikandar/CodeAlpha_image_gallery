// ==========================================================
// Lumen Gallery — data, rendering, filters, lightbox
// ==========================================================

const images = [
  // Nature
  { id: 1,  title: "Misty Forest Path",     category: "nature",       src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80&auto=format&fit=crop" },
  { id: 2,  title: "Golden Mountain Ridge", category: "nature",       src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80&auto=format&fit=crop" },
  { id: 3,  title: "Calm Lake Reflection",  category: "nature",       src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80&auto=format&fit=crop" },
  { id: 4,  title: "Autumn Woodland",       category: "nature",       src: "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=900&q=80&auto=format&fit=crop" },

  // Architecture
  { id: 5,  title: "Modern Glass Facade",   category: "architecture", src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80&auto=format&fit=crop" },
  { id: 6,  title: "Spiral Staircase",      category: "architecture", src: "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=900&q=80&auto=format&fit=crop" },
  { id: 7,  title: "Minimalist Interior",   category: "architecture", src: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&q=80&auto=format&fit=crop" },
  { id: 8,  title: "Symmetry in Concrete",  category: "architecture", src: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=900&q=80&auto=format&fit=crop" },

  // Travel
  { id: 9,  title: "Old Town Alley",        category: "travel",       src: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=900&q=80&auto=format&fit=crop" },
  { id: 10, title: "Coastal Village",       category: "travel",       src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80&auto=format&fit=crop" },
  { id: 11, title: "Desert Road Trip",      category: "travel",       src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=900&q=80&auto=format&fit=crop" },
  { id: 12, title: "City Lights at Dusk",   category: "travel",       src: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=900&q=80&auto=format&fit=crop" },

  // Food
  { id: 13, title: "Fresh Pasta Bowl",      category: "food",         src: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&q=80&auto=format&fit=crop" },
  { id: 14, title: "Morning Coffee",        category: "food",         src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80&auto=format&fit=crop" },
  { id: 15, title: "Rustic Bread Loaf",     category: "food",         src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80&auto=format&fit=crop" },
  { id: 16, title: "Garden Fresh Salad",    category: "food",         src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80&auto=format&fit=crop" }
];

const galleryEl = document.getElementById('gallery');
const filterButtons = document.querySelectorAll('.filter-btn');
const filtersCount = document.getElementById('filtersCount');
const uploadInput = document.getElementById('uploadInput');

let currentFilter = 'all';
let currentIndex = 0;

// ---- Render gallery cards ----
function renderGallery(){
  galleryEl.innerHTML = '';
  const visible = images.filter(img => currentFilter === 'all' || img.category === currentFilter);
  filtersCount.textContent = `${visible.length} photo${visible.length !== 1 ? 's' : ''}`;

  images.forEach((img, index) => {
    const isVisible = currentFilter === 'all' || img.category === currentFilter;
    const card = document.createElement('div');
    card.className = 'card' + (isVisible ? '' : ' hidden');
    card.style.animationDelay = (index % 8) * 0.06 + 's';
    card.dataset.index = index;
    card.innerHTML = `
      <img class="card__img" src="${img.src}" alt="${img.title}" loading="lazy">
      <div class="card__frame"></div>
      <span class="card__view">&#8599;</span>
      ${img.uploaded ? `<button class="card__delete" data-id="${img.id}" title="Delete">&times;</button>` : ''}
      <div class="card__overlay">
        <span class="card__tag">${img.category}</span>
        <span class="card__title">${img.title}</span>
      </div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card__delete')) return;
      openLightbox(index);
    });
    galleryEl.appendChild(card);
  });

  // Wire delete buttons (only present on uploaded photos)
  galleryEl.querySelectorAll('.card__delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      await deleteUploadedImage(id);
      const idx = images.findIndex(i => i.id === id);
      if (idx !== -1) images.splice(idx, 1);
      renderGallery();
    });
  });
}

// ==========================================================
// Local, per-browser storage for uploaded photos (IndexedDB)
// Note: uploads are saved only in the uploader's own browser —
// there is no shared server, so other visitors won't see them.
// ==========================================================

const DB_NAME = 'lumen-gallery';
const STORE_NAME = 'uploads';
let nextUploadId = 100000; // keep well above the built-in image ids

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveUploadedImage(record){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteUploadedImage(id){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadUploadedImages(){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function fileToDataURL(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---- Handle new uploads ----
uploadInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  for (const file of files){
    const dataUrl = await fileToDataURL(file);
    const record = {
      id: nextUploadId++,
      title: file.name.replace(/\.[^/.]+$/, ''),
      category: 'mine',
      src: dataUrl,
      uploaded: true
    };
    await saveUploadedImage(record);
    images.push(record);
  }
  uploadInput.value = '';
  renderGallery();
});

// ---- On page load, restore previously uploaded photos ----
async function restoreUploads(){
  try{
    const stored = await loadUploadedImages();
    stored.forEach(record => {
      images.push(record);
      if (record.id >= nextUploadId) nextUploadId = record.id + 1;
    });
  } catch(err){
    console.warn('Could not load saved uploads:', err);
  }
  renderGallery();
}

// ---- Filtering ----
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderGallery();
  });
});

// ---- Lightbox ----
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCategory = document.getElementById('lightboxCategory');
const lightboxDots = document.getElementById('lightboxDots');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

function getVisibleIndices(){
  return images
    .map((img, i) => ({ img, i }))
    .filter(({ img }) => currentFilter === 'all' || img.category === currentFilter)
    .map(({ i }) => i);
}

function openLightbox(index){
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(){
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function updateLightbox(){
  const img = images[currentIndex];
  lightboxImg.src = img.src.includes('w=900') ? img.src.replace('w=900', 'w=1400') : img.src;
  lightboxImg.alt = img.title;
  lightboxTitle.textContent = img.title;
  lightboxCategory.textContent = img.category;

  const visibleIdx = getVisibleIndices();
  const pos = visibleIdx.indexOf(currentIndex);

  lightboxDots.innerHTML = visibleIdx
    .map((_, i) => `<span class="lightbox__dot${i === pos ? ' active' : ''}"></span>`)
    .join('');
}

function showNext(){
  const visibleIdx = getVisibleIndices();
  const pos = visibleIdx.indexOf(currentIndex);
  const nextPos = (pos + 1) % visibleIdx.length;
  currentIndex = visibleIdx[nextPos];
  updateLightbox();
}

function showPrev(){
  const visibleIdx = getVisibleIndices();
  const pos = visibleIdx.indexOf(currentIndex);
  const prevPos = (pos - 1 + visibleIdx.length) % visibleIdx.length;
  currentIndex = visibleIdx[prevPos];
  updateLightbox();
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxNext.addEventListener('click', showNext);
lightboxPrev.addEventListener('click', showPrev);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// ---- Keyboard support ----
window.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});

restoreUploads();
