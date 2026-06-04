const STORAGE_KEY = 'linklitchi-links-v1';
const els = {
  totalCount: document.querySelector('#totalCount'),
  categoryCount: document.querySelector('#categoryCount'),
  resultMeta: document.querySelector('#resultMeta'),
  searchInput: document.querySelector('#searchInput'),
  categoryFilter: document.querySelector('#categoryFilter'),
  tagFilters: document.querySelector('#tagFilters'),
  cardGrid: document.querySelector('#cardGrid'),
  cardTemplate: document.querySelector('#cardTemplate'),
  linkModal: document.querySelector('#linkModal'),
  openModalBtn: document.querySelector('#openModalBtn'),
  closeModalBtn: document.querySelector('#closeModalBtn'),
  addDemoBtn: document.querySelector('#addDemoBtn'),
  exportBtn: document.querySelector('#exportBtn'),
  importInput: document.querySelector('#importInput'),
  linkForm: document.querySelector('#linkForm'),
  modalTitle: document.querySelector('#modalTitle'),
  deleteBtn: document.querySelector('#deleteBtn'),
  linkId: document.querySelector('#linkId'),
  nameInput: document.querySelector('#nameInput'),
  urlInput: document.querySelector('#urlInput'),
  categoryInput: document.querySelector('#categoryInput'),
  descriptionInput: document.querySelector('#descriptionInput'),
  tagsInput: document.querySelector('#tagsInput')
};

const state = {
  links: loadLinks(),
  search: '',
  category: 'all',
  tag: 'all'
};

function loadLinks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...window.DEFAULT_LINKS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...window.DEFAULT_LINKS];
  } catch {
    return [...window.DEFAULT_LINKS];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.links));
}

function uniqueCategories() {
  return [...new Set(state.links.map((item) => item.category))].sort();
}

function uniqueTags() {
  return [...new Set(state.links.flatMap((item) => item.tags || []))].sort();
}

function filteredLinks() {
  const q = state.search.trim().toLowerCase();
  return state.links.filter((item) => {
    const matchesSearch = !q || [item.name, item.description, item.url, ...(item.tags || [])]
      .join(' ')
      .toLowerCase()
      .includes(q);
    const matchesCategory = state.category === 'all' || item.category === state.category;
    const matchesTag = state.tag === 'all' || (item.tags || []).includes(state.tag);
    return matchesSearch && matchesCategory && matchesTag;
  });
}

function renderCategoryFilter() {
  const current = state.category;
  els.categoryFilter.innerHTML = '<option value="all">全部分類</option>';
  uniqueCategories().forEach((category) => {
    const opt = document.createElement('option');
    opt.value = category;
    opt.textContent = category;
    if (category === current) opt.selected = true;
    els.categoryFilter.appendChild(opt);
  });
}

function renderTagFilters() {
  const tags = ['all', ...uniqueTags()];
  els.tagFilters.innerHTML = '';
  tags.forEach((tag) => {
    const btn = document.createElement('button');
    btn.className = `pill ${state.tag === tag ? 'active' : ''}`;
    btn.textContent = tag === 'all' ? '全部標籤' : `#${tag}`;
    btn.addEventListener('click', () => {
      state.tag = tag;
      render();
    });
    els.tagFilters.appendChild(btn);
  });
}

function renderCards() {
  const links = filteredLinks();
  els.cardGrid.innerHTML = '';

  if (!links.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state glass';
    empty.innerHTML = '<strong>找不到結果</strong><p>試試別的關鍵字，或直接新增一筆。</p>';
    els.cardGrid.appendChild(empty);
    return;
  }

  links.forEach((item) => {
    const node = els.cardTemplate.content.cloneNode(true);
    node.querySelector('.category-pill').textContent = item.category;
    node.querySelector('.card-title').textContent = item.name;
    node.querySelector('.card-description').textContent = item.description || '沒有描述';
    const openLink = node.querySelector('.open-link');
    openLink.href = item.url;
    node.querySelector('.url-preview').textContent = item.url.replace(/^https?:\/\//, '');

    const tagList = node.querySelector('.tag-list');
    (item.tags || []).forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.textContent = `#${tag}`;
      tagList.appendChild(span);
    });

    node.querySelector('.edit-btn').addEventListener('click', () => openModal(item));
    els.cardGrid.appendChild(node);
  });
}

function updateStats() {
  const links = filteredLinks();
  els.totalCount.textContent = state.links.length;
  els.categoryCount.textContent = uniqueCategories().length;
  els.resultMeta.textContent = `${links.length} 筆結果`;
}

function render() {
  renderCategoryFilter();
  renderTagFilters();
  renderCards();
  updateStats();
  persist();
}

function resetForm() {
  els.linkForm.reset();
  els.linkId.value = '';
  els.categoryInput.value = 'Project';
  els.deleteBtn.classList.add('hidden');
}

function openModal(item = null) {
  if (!item) {
    resetForm();
    els.modalTitle.textContent = '新增連結';
  } else {
    els.modalTitle.textContent = '編輯連結';
    els.linkId.value = item.id;
    els.nameInput.value = item.name;
    els.urlInput.value = item.url;
    els.categoryInput.value = item.category;
    els.descriptionInput.value = item.description || '';
    els.tagsInput.value = (item.tags || []).join(', ');
    els.deleteBtn.classList.remove('hidden');
  }
  els.linkModal.showModal();
}

function closeModal() {
  els.linkModal.close();
  resetForm();
}

function saveLink(event) {
  event.preventDefault();
  const payload = {
    id: els.linkId.value || crypto.randomUUID(),
    name: els.nameInput.value.trim(),
    url: els.urlInput.value.trim(),
    category: els.categoryInput.value,
    description: els.descriptionInput.value.trim(),
    tags: els.tagsInput.value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  };

  const idx = state.links.findIndex((item) => item.id === payload.id);
  if (idx >= 0) state.links[idx] = payload;
  else state.links.unshift(payload);

  closeModal();
  render();
}

function deleteCurrent() {
  const id = els.linkId.value;
  if (!id) return;
  state.links = state.links.filter((item) => item.id !== id);
  closeModal();
  render();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.links, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'linklitchi-links.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('invalid');
    state.links = data;
    state.search = '';
    state.category = 'all';
    state.tag = 'all';
    els.searchInput.value = '';
    render();
  } catch {
    alert('JSON 格式不對，匯入失敗。');
  } finally {
    event.target.value = '';
  }
}

els.searchInput.addEventListener('input', (e) => {
  state.search = e.target.value;
  render();
});
els.categoryFilter.addEventListener('change', (e) => {
  state.category = e.target.value;
  render();
});
els.openModalBtn.addEventListener('click', () => openModal());
els.closeModalBtn.addEventListener('click', closeModal);
els.linkForm.addEventListener('submit', saveLink);
els.deleteBtn.addEventListener('click', deleteCurrent);
els.exportBtn.addEventListener('click', exportJson);
els.importInput.addEventListener('change', importJson);
els.addDemoBtn.addEventListener('click', () => {
  state.links = [...window.DEFAULT_LINKS];
  state.search = '';
  state.category = 'all';
  state.tag = 'all';
  els.searchInput.value = '';
  render();
});

render();
