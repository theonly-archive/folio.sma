const DB_NAME = 'FolioSmasaDB';
const DB_VERSION = 1;
const STORE_NAME = 'dokumen';
const PROFILE_STORAGE_KEY = 'folio_smasa_profile';

const DEFAULT_PROFILE = {
  nama: 'Nama Pelajar',
  instansi: 'SMA Negeri 1 Madiun',
  bio: 'Arsip portofolio dan rekam prestasi pelajar'
};

let dbInstance = null;
let selectedUploadFile = null;
let activePreviewUrl = null;
let currentFilter = 'Semua';
let currentSearch = '';
let cachedRecords = [];
let editingRecordId = null;

function getSavedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PROFILE };
    }
    const parsed = JSON.parse(raw);
    return {
      nama: parsed && parsed.nama ? String(parsed.nama) : DEFAULT_PROFILE.nama,
      instansi: parsed && parsed.instansi ? String(parsed.instansi) : DEFAULT_PROFILE.instansi,
      bio: parsed && parsed.bio ? String(parsed.bio) : DEFAULT_PROFILE.bio
    };
  } catch (error) {
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfileToStorage(profile) {
  const cleanProfile = {
    nama: profile && profile.nama ? String(profile.nama).trim() : DEFAULT_PROFILE.nama,
    instansi: profile && profile.instansi ? String(profile.instansi).trim() : DEFAULT_PROFILE.instansi,
    bio: profile && profile.bio ? String(profile.bio).trim() : DEFAULT_PROFILE.bio
  };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(cleanProfile));
  return cleanProfile;
}

function openDatabase() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('kategori', 'kategori', { unique: false });
      }
    };
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function getAllDocuments() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result || [];
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      resolve(items);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveDocument(record) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onsuccess = () => {
      resolve(record);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function deleteDocumentById(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) {
    return '0 KB';
  }
  if (bytes < 1024 * 1024) {
    return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
}

function normalizeKategori(jenis) {
  if (jenis === 'Sertifikat Lomba' || jenis === 'Lomba') {
    return 'Lomba';
  }
  if (jenis === 'Kepanitiaan') {
    return 'Kepanitiaan';
  }
  if (jenis === 'Organisasi') {
    return 'Organisasi';
  }
  return 'Lomba';
}

function normalizeJenisLabel(jenis) {
  if (jenis === 'Lomba' || jenis === 'Sertifikat Lomba') {
    return 'Sertifikat Lomba';
  }
  if (jenis === 'Kepanitiaan') {
    return 'Kepanitiaan';
  }
  if (jenis === 'Organisasi') {
    return 'Organisasi';
  }
  return jenis || 'Sertifikat Lomba';
}

function sanitizeSegment(text) {
  return String(text || '')
    .replace(/&/g, ' ')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildAutoFileName(tahun, jenis, bidang, originalName) {
  const dotIndex = originalName.lastIndexOf('.');
  const rawBase = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  const ext = dotIndex > 0 ? originalName.slice(dotIndex).toLowerCase() : '.pdf';
  const jenisSlug = sanitizeSegment(normalizeKategori(jenis));
  const bidangSlug = sanitizeSegment(bidang);
  const nameSlug = sanitizeSegment(rawBase) || 'Dokumen';
  return `${tahun}_${jenisSlug}-${bidangSlug}_${nameSlug}${ext}`;
}

function extractReadableTitle(fileName) {
  const parts = fileName.split('_');
  const rawName = parts.length >= 3 ? parts.slice(2).join('_') : fileName;
  const withoutExt = rawName.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[-_]+/g, ' ').trim() || fileName;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function initNavbar() {
  const navToggle = document.getElementById('navToggle');
  const navbarMenu = document.getElementById('navbarMenu');
  if (!navToggle || !navbarMenu) {
    return;
  }
  navToggle.addEventListener('click', () => {
    navbarMenu.classList.toggle('is-open');
  });
}

function initPillGroups(rootElement) {
  const scope = rootElement || document;
  const groups = scope.querySelectorAll('[data-pill-group]');
  groups.forEach((group) => {
    group.addEventListener('click', (event) => {
      const btn = event.target.closest('.pill-btn');
      if (!btn) {
        return;
      }
      group.querySelectorAll('.pill-btn').forEach((item) => {
        item.classList.remove('active');
      });
      btn.classList.add('active');
    });
  });
}

function getSelectedPillValue(groupName, fallback) {
  const group = document.querySelector(`[data-pill-group="${groupName}"]`);
  if (!group) {
    return fallback;
  }
  const activeBtn = group.querySelector('.pill-btn.active');
  return activeBtn ? activeBtn.getAttribute('data-value') : fallback;
}

function setSelectedPillValue(groupName, value) {
  const group = document.querySelector(`[data-pill-group="${groupName}"]`);
  if (!group) {
    return;
  }
  const buttons = group.querySelectorAll('.pill-btn');
  let matched = false;
  buttons.forEach((btn) => {
    const btnVal = btn.getAttribute('data-value');
    if (btnVal === value) {
      btn.classList.add('active');
      matched = true;
    } else {
      btn.classList.remove('active');
    }
  });
  if (!matched && buttons.length > 0) {
    buttons[0].classList.add('active');
  }
}

function isSupportedFile(file) {
  if (!file) {
    return false;
  }
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.type)) {
    return true;
  }
  const lower = file.name.toLowerCase();
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.pdf');
}

function detectMimeType(file) {
  if (file.type) {
    return file.type;
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  return 'application/pdf';
}

function initIndexPage() {
  const dropZone = document.getElementById('dropZone');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const fileInput = document.getElementById('fileInput');
  const uploadModal = document.getElementById('uploadModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const saveArchiveBtn = document.getElementById('saveArchiveBtn');
  const detectedFileName = document.getElementById('detectedFileName');
  const detectedFileExt = document.getElementById('detectedFileExt');

  if (!dropZone || !fileInput || !uploadModal) {
    return;
  }

  initPillGroups(uploadModal);

  function openUploadModal(file) {
    if (!isSupportedFile(file)) {
      showToast('Format file harus JPG, PNG, atau PDF.');
      return;
    }
    selectedUploadFile = file;
    if (detectedFileName) {
      detectedFileName.textContent = file.name;
    }
    if (detectedFileExt) {
      const ext = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : 'FILE';
      detectedFileExt.textContent = ext;
    }
    uploadModal.classList.add('is-open');
    uploadModal.setAttribute('aria-hidden', 'false');
  }

  function closeUploadModal() {
    uploadModal.classList.remove('is-open');
    uploadModal.setAttribute('aria-hidden', 'true');
    selectedUploadFile = null;
    fileInput.value = '';
  }

  if (selectFileBtn) {
    selectFileBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      fileInput.click();
    });
  }

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      openUploadModal(fileInput.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (event) => {
    const files = event.dataTransfer && event.dataTransfer.files;
    if (files && files[0]) {
      openUploadModal(files[0]);
    }
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeUploadModal);
  }
  if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', closeUploadModal);
  }
  uploadModal.addEventListener('click', (event) => {
    if (event.target === uploadModal) {
      closeUploadModal();
    }
  });

  if (saveArchiveBtn) {
    saveArchiveBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      if (!selectedUploadFile) {
        showToast('Pilih file terlebih dahulu.');
        return;
      }

      const jenis = getSelectedPillValue('jenis', 'Sertifikat Lomba');
      const bidang = getSelectedPillValue('bidang', 'Akademik');
      const tahun = getSelectedPillValue('tahun', '2026');
      const kategori = normalizeKategori(jenis);
      const mimeType = detectMimeType(selectedUploadFile);
      const autoFileName = buildAutoFileName(tahun, jenis, bidang, selectedUploadFile.name);

      saveArchiveBtn.style.pointerEvents = 'none';
      saveArchiveBtn.style.opacity = '0.7';

      try {
        const record = {
          id: 'doc-' + Date.now(),
          fileName: autoFileName,
          originalName: selectedUploadFile.name,
          jenis: normalizeJenisLabel(jenis),
          kategori: kategori,
          bidang: bidang,
          tahun: tahun,
          mimeType: mimeType,
          size: selectedUploadFile.size,
          fileBlob: selectedUploadFile,
          createdAt: Date.now()
        };
        await saveDocument(record);
        window.location.href = 'arsip.html?baru=1';
      } catch (error) {
        saveArchiveBtn.style.pointerEvents = '';
        saveArchiveBtn.style.opacity = '';
        showToast('Gagal menyimpan dokumen ke arsip.');
      }
    });
  }
}

function initArsipPage() {
  const archiveGrid = document.getElementById('archiveGrid');
  if (!archiveGrid) {
    return;
  }

  const confirmBanner = document.getElementById('confirmBanner');
  const confirmOkBtn = document.getElementById('confirmOkBtn');
  const changeCategoryBtn = document.getElementById('changeCategoryBtn');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const importJsonBtn = document.getElementById('importJsonBtn');
  const importFileInput = document.getElementById('importFileInput');

  const previewModal = document.getElementById('previewModal');
  const closePreviewBtn = document.getElementById('closePreviewBtn');
  const closePreviewFooterBtn = document.getElementById('closePreviewFooterBtn');
  const previewFileName = document.getElementById('previewFileName');
  const previewFileBadge = document.getElementById('previewFileBadge');
  const previewStage = document.getElementById('previewStage');

  const editCategoryModal = document.getElementById('editCategoryModal');
  const closeEditCategoryBtn = document.getElementById('closeEditCategoryBtn');
  const cancelEditCategoryBtn = document.getElementById('cancelEditCategoryBtn');
  const saveCategoryBtn = document.getElementById('saveCategoryBtn');

  initPillGroups(editCategoryModal);

  const params = new URLSearchParams(window.location.search);
  const isNewlyAdded = params.get('baru') === '1';

  if (confirmBanner) {
    confirmBanner.style.display = isNewlyAdded ? 'flex' : 'none';
  }

  function clearBaruQueryParam() {
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  if (confirmOkBtn) {
    confirmOkBtn.addEventListener('click', () => {
      if (confirmBanner) {
        confirmBanner.style.display = 'none';
      }
      clearBaruQueryParam();
      showToast('Penempatan folder dikonfirmasi.');
    });
  }

  if (changeCategoryBtn) {
    changeCategoryBtn.addEventListener('click', () => {
      if (cachedRecords.length > 0) {
        const latest = cachedRecords[0];
        editingRecordId = latest.id;
        setSelectedPillValue('edit-jenis', normalizeKategori(latest.jenis));
        setSelectedPillValue('edit-bidang', latest.bidang || 'Akademik');
      } else {
        editingRecordId = null;
      }
      if (editCategoryModal) {
        editCategoryModal.classList.add('is-open');
        editCategoryModal.setAttribute('aria-hidden', 'false');
      }
    });
  }

  function closeEditCategoryModal() {
    if (editCategoryModal) {
      editCategoryModal.classList.remove('is-open');
      editCategoryModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (closeEditCategoryBtn) {
    closeEditCategoryBtn.addEventListener('click', closeEditCategoryModal);
  }
  if (cancelEditCategoryBtn) {
    cancelEditCategoryBtn.addEventListener('click', closeEditCategoryModal);
  }
  if (editCategoryModal) {
    editCategoryModal.addEventListener('click', (event) => {
      if (event.target === editCategoryModal) {
        closeEditCategoryModal();
      }
    });
  }

  if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener('click', async () => {
      const newJenisShort = getSelectedPillValue('edit-jenis', 'Lomba');
      const newBidang = getSelectedPillValue('edit-bidang', 'Akademik');
      const newJenisLabel = normalizeJenisLabel(newJenisShort);
      const newKategori = normalizeKategori(newJenisShort);

      if (editingRecordId) {
        const target = cachedRecords.find((item) => item.id === editingRecordId);
        if (target) {
          target.jenis = newJenisLabel;
          target.kategori = newKategori;
          target.bidang = newBidang;
          target.fileName = buildAutoFileName(
            target.tahun || '2026',
            newJenisLabel,
            newBidang,
            target.originalName || target.fileName
          );
          await saveDocument(target);
          await refreshArchiveView();
        }
      }

      closeEditCategoryModal();
      if (confirmBanner) {
        confirmBanner.style.display = 'none';
      }
      clearBaruQueryParam();
      showToast('Kategori dokumen diperbarui.');
    });
  }

  function revokeActivePreviewUrl() {
    if (activePreviewUrl) {
      URL.revokeObjectURL(activePreviewUrl);
      activePreviewUrl = null;
    }
  }

  function openPreviewModal(record) {
    if (!previewModal || !previewStage || !record) {
      return;
    }
    revokeActivePreviewUrl();

    const title = record.fileName || 'Dokumen';
    const badgeText = normalizeJenisLabel(record.jenis || record.kategori);

    if (previewFileName) {
      previewFileName.textContent = title;
    }
    if (previewFileBadge) {
      previewFileBadge.textContent = badgeText;
    }

    previewStage.innerHTML = '';

    if (record.fileBlob instanceof Blob) {
      activePreviewUrl = URL.createObjectURL(record.fileBlob);
      const mime = record.mimeType || record.fileBlob.type || '';
      if (mime.startsWith('image/')) {
        previewStage.style.height = '380px';
        const img = document.createElement('img');
        img.src = activePreviewUrl;
        img.alt = title;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        previewStage.appendChild(img);
      } else {
        previewStage.style.height = '420px';
        const embed = document.createElement('embed');
        embed.src = activePreviewUrl;
        embed.type = 'application/pdf';
        embed.style.width = '100%';
        embed.style.height = '100%';
        embed.style.border = 'none';
        previewStage.appendChild(embed);
      }
    } else {
      previewStage.style.height = '260px';
      previewStage.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px;text-align:center;">
          <i data-lucide="file-text" width="48" height="48"></i>
          <span style="font-size:0.875rem;color:#57534E;">Berkas pratinjau tidak tersedia</span>
        </div>
      `;
    }

    previewModal.classList.add('is-open');
    previewModal.setAttribute('aria-hidden', 'false');
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  function closePreviewModal() {
    if (!previewModal) {
      return;
    }
    previewModal.classList.remove('is-open');
    previewModal.setAttribute('aria-hidden', 'true');
    if (previewStage) {
      previewStage.innerHTML = '';
    }
    revokeActivePreviewUrl();
  }

  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', closePreviewModal);
  }
  if (closePreviewFooterBtn) {
    closePreviewFooterBtn.addEventListener('click', closePreviewModal);
  }
  if (previewModal) {
    previewModal.addEventListener('click', (event) => {
      if (event.target === previewModal) {
        closePreviewModal();
      }
    });
  }

  function renderEmptyDatabaseState() {
    archiveGrid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="archive" width="36" height="36"></i>
        <h3>Belum ada dokumen tersimpan</h3>
        <a href="index.html" class="btn btn-primary">
          <i data-lucide="plus" width="18" height="18"></i>
          <span>Unggah Dokumen</span>
        </a>
      </div>
    `;
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  function renderArchiveCards(records) {
    if (!records || records.length === 0) {
      renderEmptyDatabaseState();
      return;
    }

    const filtered = records.filter((item) => {
      const cat = normalizeKategori(item.kategori || item.jenis);
      const matchesCategory = currentFilter === 'Semua' || cat === currentFilter;
      const haystack = `${item.fileName} ${item.bidang} ${item.jenis} ${item.tahun}`.toLowerCase();
      const matchesSearch = !currentSearch || haystack.includes(currentSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      archiveGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="folder-open" width="36" height="36"></i>
          <h3>Dokumen Tidak Ditemukan</h3>
          <p>Ubah kata kunci pencarian atau pilih kategori lain.</p>
        </div>
      `;
      if (window.lucide) {
        lucide.createIcons();
      }
      return;
    }

    archiveGrid.innerHTML = filtered
      .map((item) => {
        const kategori = normalizeKategori(item.kategori || item.jenis);
        const jenisLabel = normalizeJenisLabel(item.jenis || item.kategori);
        const ext = item.fileName.includes('.')
          ? item.fileName.split('.').pop().toUpperCase()
          : 'PDF';
        const sizeLabel = formatFileSize(item.size);
        const safeId = escapeHtml(item.id);
        const safeFileName = escapeHtml(item.fileName);
        const safeJenisLabel = escapeHtml(jenisLabel);
        const safeBidang = escapeHtml(item.bidang || 'Akademik');
        const safeTahun = escapeHtml(item.tahun || '2026');
        const safeKategori = escapeHtml(kategori);

        return `
          <article class="bento-card bento-half" data-id="${safeId}" data-category="${safeKategori}" data-title="${safeFileName}">
            <div class="bento-card-header">
              <span class="badge badge-apricot">${safeJenisLabel}</span>
              <span class="bento-card-date">${safeTahun}</span>
            </div>
            <div class="bento-card-body">
              <h2 class="bento-card-title">${safeFileName}</h2>
              <p class="bento-card-desc">Bidang ${safeBidang} · ${ext} · ${sizeLabel}</p>
            </div>
            <div class="bento-card-footer">
              <div class="bento-student">
                <span class="bento-student-name">${safeBidang}</span>
                <span class="bento-student-class">Folder ${safeKategori}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="btn btn-secondary btn-icon" data-action="preview" aria-label="Pratinjau Dokumen">
                  <i data-lucide="eye" width="18" height="18"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-icon" data-action="delete" aria-label="Hapus Dokumen">
                  <i data-lucide="trash-2" width="18" height="18"></i>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  async function refreshArchiveView() {
    cachedRecords = await getAllDocuments();
    renderArchiveCards(cachedRecords);
  }

  archiveGrid.addEventListener('click', async (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) {
      return;
    }
    const card = actionBtn.closest('.bento-card');
    if (!card) {
      return;
    }
    const docId = card.getAttribute('data-id');
    const action = actionBtn.getAttribute('data-action');
    const dbItem = cachedRecords.find((item) => item.id === docId);

    if (!dbItem) {
      return;
    }

    if (action === 'preview') {
      openPreviewModal(dbItem);
    } else if (action === 'delete') {
      await deleteDocumentById(docId);
      await refreshArchiveView();
      showToast('Dokumen dihapus dari arsip.');
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value.trim();
      renderArchiveCards(cachedRecords);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('click', (event) => {
      const pill = event.target.closest('.pill-btn');
      if (!pill) {
        return;
      }
      categoryFilter.querySelectorAll('.pill-btn').forEach((btn) => {
        btn.classList.remove('active');
      });
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter') || 'Semua';
      renderArchiveCards(cachedRecords);
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', async () => {
      const records = await getAllDocuments();
      const currentProfile = getSavedProfile();
      const serialized = await Promise.all(
        records.map(async (item) => {
          const copy = {
            id: item.id,
            fileName: item.fileName,
            originalName: item.originalName,
            jenis: item.jenis,
            kategori: item.kategori,
            bidang: item.bidang,
            tahun: item.tahun,
            mimeType: item.mimeType,
            size: item.size,
            createdAt: item.createdAt,
            dataUrl: null
          };
          if (item.fileBlob instanceof Blob) {
            copy.dataUrl = await blobToDataUrl(item.fileBlob);
          }
          return copy;
        })
      );

      const backupData = {
        app: 'folio.smasa',
        exportedAt: new Date().toISOString(),
        profil: currentProfile,
        dokumen: serialized
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `folio-smasa-cadangan-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('Data arsip dan profil berhasil diekspor.');
    });
  }

  if (importJsonBtn && importFileInput) {
    importJsonBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', async () => {
      const file = importFileInput.files && importFileInput.files[0];
      if (!file) {
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const hasProfile = parsed && typeof parsed === 'object' && parsed.profil && typeof parsed.profil === 'object';
        const list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.dokumen) ? parsed.dokumen : null;

        if (!list && !hasProfile) {
          showToast('Format berkas JSON tidak valid.');
          importFileInput.value = '';
          return;
        }

        if (hasProfile) {
          saveProfileToStorage(parsed.profil);
        }

        if (list && list.length > 0) {
          for (const item of list) {
            const record = {
              id: item.id || 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
              fileName: item.fileName || 'Dokumen.pdf',
              originalName: item.originalName || item.fileName || 'Dokumen.pdf',
              jenis: normalizeJenisLabel(item.jenis || item.kategori),
              kategori: normalizeKategori(item.kategori || item.jenis),
              bidang: item.bidang || 'Akademik',
              tahun: item.tahun || '2026',
              mimeType: item.mimeType || 'application/pdf',
              size: item.size || 0,
              fileBlob: item.dataUrl ? dataUrlToBlob(item.dataUrl) : null,
              createdAt: item.createdAt || Date.now()
            };
            await saveDocument(record);
          }
        }

        await refreshArchiveView();
        const importedCount = list ? list.length : 0;
        showToast(`${importedCount} dokumen berhasil diimpor.`);
      } catch (error) {
        showToast('Gagal membaca berkas JSON.');
      }
      importFileInput.value = '';
    });
  }

  refreshArchiveView();
}

function initPortofolioPage() {
  const showcaseGrid = document.getElementById('showcaseGrid');
  if (!showcaseGrid) {
    return;
  }

  const profileInstitutionEl = document.getElementById('profileInstitution');
  const profileNameEl = document.getElementById('profileName');
  const profileBioEl = document.getElementById('profileBio');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const editProfileModal = document.getElementById('editProfileModal');
  const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const profileForm = document.getElementById('profileForm');
  const inputProfileName = document.getElementById('inputProfileName');
  const inputProfileInstitution = document.getElementById('inputProfileInstitution');
  const inputProfileBio = document.getElementById('inputProfileBio');

  const presentationModeBtn = document.getElementById('presentationModeBtn');
  const printPdfBtn = document.getElementById('printPdfBtn');
  const navbar = document.querySelector('.navbar');
  const footer = document.querySelector('.footer');

  function applyProfileToDom(profile) {
    if (profileNameEl) {
      profileNameEl.textContent = profile.nama;
    }
    if (profileInstitutionEl) {
      profileInstitutionEl.textContent = profile.instansi;
    }
    if (profileBioEl) {
      profileBioEl.textContent = profile.bio;
    }
  }

  applyProfileToDom(getSavedProfile());

  function openEditProfileModal() {
    const current = getSavedProfile();
    if (inputProfileName) {
      inputProfileName.value = current.nama;
    }
    if (inputProfileInstitution) {
      inputProfileInstitution.value = current.instansi;
    }
    if (inputProfileBio) {
      inputProfileBio.value = current.bio;
    }
    if (editProfileModal) {
      editProfileModal.classList.add('is-open');
      editProfileModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeEditProfileModal() {
    if (editProfileModal) {
      editProfileModal.classList.remove('is-open');
      editProfileModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openEditProfileModal);
  }
  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener('click', closeEditProfileModal);
  }
  if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', closeEditProfileModal);
  }
  if (editProfileModal) {
    editProfileModal.addEventListener('click', (event) => {
      if (event.target === editProfileModal) {
        closeEditProfileModal();
      }
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const updated = saveProfileToStorage({
        nama: inputProfileName ? inputProfileName.value : DEFAULT_PROFILE.nama,
        instansi: inputProfileInstitution ? inputProfileInstitution.value : DEFAULT_PROFILE.instansi,
        bio: inputProfileBio ? inputProfileBio.value : DEFAULT_PROFILE.bio
      });
      applyProfileToDom(updated);
      closeEditProfileModal();
      showToast('Profil berhasil disimpan.');
    });
  }

  let isPresentationMode = false;
  const createdShowcaseUrls = [];

  function setPresentationState(active) {
    isPresentationMode = active;
    if (navbar) {
      navbar.style.display = active ? 'none' : '';
    }
    if (footer) {
      footer.style.display = active ? 'none' : '';
    }
    if (printPdfBtn) {
      printPdfBtn.style.display = active ? 'none' : '';
    }
    if (editProfileBtn) {
      editProfileBtn.style.display = active ? 'none' : '';
    }
    if (presentationModeBtn) {
      presentationModeBtn.innerHTML = active
        ? '<i data-lucide="minimize-2" width="18" height="18"></i><span>Keluar Presentasi</span>'
        : '<i data-lucide="presentation" width="18" height="18"></i><span>Mode Presentasi</span>';
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }

  if (presentationModeBtn) {
    presentationModeBtn.addEventListener('click', () => {
      setPresentationState(!isPresentationMode);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isPresentationMode) {
      setPresentationState(false);
    }
  });

  function updatePortfolioStats(records) {
    const totalCount = records.length;
    const akademikCount = records.filter((item) => (item.bidang || '').toLowerCase() === 'akademik').length;
    const kepanitiaanCount = records.filter((item) => normalizeKategori(item.kategori || item.jenis) === 'Kepanitiaan').length;
    const organisasiCount = records.filter((item) => normalizeKategori(item.kategori || item.jenis) === 'Organisasi').length;

    const statCards = document.querySelectorAll('.main-content > .container > .bento-grid:first-of-type .bento-card');
    statCards.forEach((card) => {
      const labelEl = card.querySelector('.stat-label');
      const valueEl = card.querySelector('.stat-value');
      if (!labelEl || !valueEl) {
        return;
      }
      const label = labelEl.textContent.trim();
      if (label === 'Total Dokumen') {
        valueEl.textContent = String(totalCount);
      } else if (label === 'Akademik') {
        valueEl.textContent = String(akademikCount);
      } else if (label === 'Kepanitiaan') {
        valueEl.textContent = String(kepanitiaanCount);
      } else if (label === 'Organisasi') {
        valueEl.textContent = String(organisasiCount);
      }
    });
  }

  function renderShowcaseCards(records) {
    while (createdShowcaseUrls.length > 0) {
      const oldUrl = createdShowcaseUrls.pop();
      URL.revokeObjectURL(oldUrl);
    }

    if (!records || records.length === 0) {
      showcaseGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="award" width="36" height="36"></i>
          <h3>Belum ada pencapaian tersimpan</h3>
          <a href="index.html" class="btn btn-primary">
            <i data-lucide="plus" width="18" height="18"></i>
            <span>Unggah Dokumen</span>
          </a>
        </div>
      `;
      if (window.lucide) {
        lucide.createIcons();
      }
      return;
    }

    showcaseGrid.innerHTML = records
      .map((item, index) => {
        let spanClass = 'bento-half';
        if (index === 0) {
          spanClass = 'bento-wide';
        } else if (index === 1) {
          spanClass = '';
        }

        const jenisLabel = escapeHtml(normalizeJenisLabel(item.jenis || item.kategori));
        const readableTitle = escapeHtml(extractReadableTitle(item.fileName));
        const safeBidang = escapeHtml(item.bidang || 'Akademik');
        const safeTahun = escapeHtml(item.tahun || '2026');
        const mime = item.mimeType || (item.fileBlob && item.fileBlob.type) || '';
        const isPdf = mime === 'application/pdf' || String(item.fileName || '').toLowerCase().endsWith('.pdf');
        let previewHtml = '';

        if (item.fileBlob instanceof Blob && mime.startsWith('image/')) {
          const imgUrl = URL.createObjectURL(item.fileBlob);
          createdShowcaseUrls.push(imgUrl);
          previewHtml = `
            <div class="bento-card-preview">
              <img src="${imgUrl}" alt="${readableTitle}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px;">
            </div>
          `;
        } else if (item.fileBlob instanceof Blob && isPdf) {
          const pdfUrl = URL.createObjectURL(item.fileBlob);
          createdShowcaseUrls.push(pdfUrl);
          previewHtml = `
            <div class="bento-card-preview">
              <iframe src="${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0" title="${readableTitle}" style="width: 100%; height: 180px; border: none; border-radius: 10px; pointer-events: none;"></iframe>
            </div>
          `;
        } else {
          previewHtml = `
            <div class="bento-card-preview" style="flex-direction: column; gap: 10px; padding: 20px;">
              <i data-lucide="file-check-2" width="40" height="40" style="color: #92140C;"></i>
              <span style="font-size: 0.85rem; font-weight: 600; color: #1E1E24; text-align: center;">${readableTitle}</span>
            </div>
          `;
        }

        return `
          <article class="bento-card ${spanClass}">
            <div class="bento-card-header">
              <span class="badge badge-apricot">${jenisLabel}</span>
              <span class="bento-card-date">${safeTahun}</span>
            </div>
            ${previewHtml}
            <div class="bento-card-body">
              <h3 class="bento-card-title">${readableTitle}</h3>
              <p class="bento-card-desc">Bidang ${safeBidang} • ${safeTahun}</p>
            </div>
          </article>
        `;
      })
      .join('');

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  getAllDocuments().then((records) => {
    updatePortfolioStats(records);
    renderShowcaseCards(records);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initIndexPage();
  initArsipPage();
  initPortofolioPage();
  if (window.lucide) {
    lucide.createIcons();
  }
});
