const CATEGORY_COLORS = {
  Project: "project",
  Tool: "tool",
  Site: "site",
  API: "api"
};

const PROJECT_ICON_POOL = [
  "./assets/icons/project-airbnb.svg",
  "./assets/icons/project-behance.svg",
  "./assets/icons/project-blocks.svg",
  "./assets/icons/project-discord.svg",
  "./assets/icons/project-docker.svg",
  "./assets/icons/project-dropbox.svg",
  "./assets/icons/project-figma.svg",
  "./assets/icons/project-firefox.svg",
  "./assets/icons/project-jira.svg",
  "./assets/icons/project-linkedin.svg",
  "./assets/icons/project-netlify.svg",
  "./assets/icons/project-notion.svg",
  "./assets/icons/project-orbit.svg",
  "./assets/icons/project-postman.svg",
  "./assets/icons/project-rainbow.svg",
  "./assets/icons/project-reddit.svg",
  "./assets/icons/project-sketch.svg",
  "./assets/icons/project-slack.svg",
  "./assets/icons/project-spark.svg",
  "./assets/icons/project-spotify.svg",
  "./assets/icons/project-telegram.svg",
  "./assets/icons/project-trello.svg",
  "./assets/icons/project-youtube.svg",
  "./assets/icons/project-zoom.svg"
];

const els = {
  totalCount: document.querySelector("#totalCount"),
  visibleCount: document.querySelector("#visibleCount"),
  liveClock: document.querySelector("#liveClock"),
  activeFilterLabel: document.querySelector("#activeFilterLabel"),
  controlShell: document.querySelector("#controlShell"),
  controlToggle: document.querySelector("#controlToggle"),
  controlClose: document.querySelector("#controlClose"),
  searchInput: document.querySelector("#searchInput"),
  tableView: document.querySelector("#tableView"),
  tableBody: document.querySelector("#tableBody"),
  listView: document.querySelector("#listView"),
  navButtons: [...document.querySelectorAll(".nav-btn")],
  displayButtons: [...document.querySelectorAll(".display-btn[data-cols]")],
  viewButtons: [...document.querySelectorAll(".view-btn")],
  sortButtons: [...document.querySelectorAll(".table-sort")],
  linkCardTemplate: document.querySelector("#linkCardTemplate"),
  listSectionTemplate: document.querySelector("#listSectionTemplate"),
  tableRowTemplate: document.querySelector("#tableRowTemplate")
};

const state = {
  links: cloneDefaults(),
  search: "",
  category: "all",
  cols: 1,
  view: "list",
  sortKey: "name",
  sortDir: "asc",
  controlsOpen: false
};

function cloneDefaults() {
  return window.DEFAULT_LINKS.map((item) => ({
    ...item,
    icon: resolveIcon(item),
    tags: Array.isArray(item.tags) ? [...item.tags] : []
  }));
}

function resolveIcon(item) {
  if (item.icon) return item.icon;
  if (item.category !== "Project") return undefined;
  return PROJECT_ICON_POOL[stableHash(item.id) % PROJECT_ICON_POOL.length];
}

function stableHash(value) {
  return [...String(value)].reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 7);
}

function iconMarkup(item) {
  if (item.icon) {
    return `<img class="icon-image" src="${item.icon}" alt="" loading="lazy" decoding="async" />`;
  }

  return iconForCategory(item.category);
}

function filteredLinks() {
  const query = state.search.trim().toLowerCase();
  const links = state.links.filter((item) => {
    const haystack = [item.name, item.url, item.category].join(" ").toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesCategory = state.category === "all" || item.category === state.category;
    return matchesSearch && matchesCategory;
  });

  return links.sort((a, b) => compareLinks(a, b, state.sortKey, state.sortDir));
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function compareLinks(a, b, key, dir) {
  const modifier = dir === "asc" ? 1 : -1;
  const left = sortableValue(a, key);
  const right = sortableValue(b, key);
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }) * modifier;
}

function sortableValue(item, key) {
  if (key === "url") return item.url || "";
  return item.name || "";
}

function categoryLabel(category) {
  if (category === "Project") return "Projects";
  if (category === "Tool") return "Tools";
  if (category === "Site") return "Sites";
  if (category === "API") return "APIs";
  return "Links";
}

function iconForCategory(category) {
  if (category === "Project") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8.5 12 5l6 3.5v7L12 19l-6-3.5z"/><path d="M12 5v14"/></svg>';
  }
  if (category === "Tool") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6 3.5 3.5-8.5 8.5H6v-3.5z"/><path d="M13 7.5 16.5 11"/></svg>';
  }
  if (category === "Site") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 0 0 14a7 7 0 0 0 0-14Z"/><path d="M5 12h14"/><path d="M12 5c1.8 2 2.7 4.3 2.7 7S13.8 17 12 19c-1.8-2-2.7-4.3-2.7-7S10.2 7 12 5Z"/></svg>';
  }
  if (category === "API") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h8v8H8z"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/></svg>';
}

function attachCardActions(node, item) {
  node.querySelector(".link-jump").href = item.url;
}

function attachTableActions(node, item) {
  const nameLink = node.querySelector(".table-name-link");
  const urlButton = node.querySelector(".table-url-button");

  nameLink.href = item.url;

  urlButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      const urlText = node.querySelector(".table-url");
      const original = urlText.textContent;
      urlText.textContent = "Copied";
      window.setTimeout(() => {
        urlText.textContent = original;
      }, 1200);
    } catch {
      alert("無法複製網址。");
    }
  });
}

function renderCards() {
  const links = filteredLinks();
  els.listView.innerHTML = "";
  els.listView.dataset.cols = String(resolveCols());

  if (!links.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No links";
    els.listView.appendChild(empty);
    return;
  }

  const grouped = new Map();
  links.forEach((item) => {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category).push(item);
  });

  [...grouped.entries()].forEach(([category, items]) => {
    const sectionNode = els.listSectionTemplate.content.cloneNode(true);
    const section = sectionNode.querySelector(".list-section");
    const list = sectionNode.querySelector(".section-list");
    section.dataset.cols = String(resolveCols());
    sectionNode.querySelector(".section-title").textContent = categoryLabel(category);

    items.forEach((item) => {
      const node = els.linkCardTemplate.content.cloneNode(true);
      const card = node.querySelector(".link-card");
      card.dataset.category = item.category;
      card.dataset.tone = CATEGORY_COLORS[item.category] || "default";
      node.querySelector(".icon-glyph").innerHTML = iconMarkup(item);
      node.querySelector(".card-title").textContent = item.name;
      node.querySelector(".link-host").textContent = hostnameOf(item.url);
      attachCardActions(node, item);
      list.appendChild(node);
    });

    els.listView.appendChild(sectionNode);
  });
}

function renderTable() {
  const links = filteredLinks();
  els.tableBody.innerHTML = "";

  if (!links.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td class="table-empty" colspan="2">No links</td>';
    els.tableBody.appendChild(row);
    return;
  }

  links.forEach((item) => {
    const node = els.tableRowTemplate.content.cloneNode(true);
    node.querySelector(".table-title").textContent = item.name;
    node.querySelector(".table-url").textContent = item.url.replace(/^https?:\/\//, "");
    attachTableActions(node, item);
    els.tableBody.appendChild(node);
  });
}

function updateStats() {
  const visible = filteredLinks();
  els.totalCount.textContent = String(state.links.length);
  els.visibleCount.textContent = String(visible.length);
  els.activeFilterLabel.textContent = state.category === "all" ? "All" : state.category;
}

function syncNav() {
  els.navButtons.forEach((button) => {
    const active = button.dataset.category === state.category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.dataset.tone = CATEGORY_COLORS[button.dataset.category] || "default";
  });
}

function syncCols() {
  els.displayButtons.forEach((button) => {
    const active = Number(button.dataset.cols) === state.cols;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = state.view === "table";
  });
}

function resolveCols() {
  const width = window.innerWidth;
  if (width <= 560) return Math.min(state.cols, 2);
  if (width <= 900) return Math.min(state.cols, 3);
  return state.cols;
}

function syncView() {
  els.viewButtons.forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const isTable = state.view === "table";
  els.listView.classList.toggle("hidden", isTable);
  els.tableView.classList.toggle("hidden", !isTable);
}

function syncSort() {
  els.sortButtons.forEach((button) => {
    const active = button.dataset.sortKey === state.sortKey;
    button.classList.toggle("active", active);
    button.dataset.dir = active ? state.sortDir : "";
    button.setAttribute("aria-pressed", String(active));
  });
}

function syncControls() {
  els.controlShell.classList.toggle("hidden", !state.controlsOpen);
  els.controlToggle.setAttribute("aria-expanded", String(state.controlsOpen));
}

function render() {
  renderCards();
  renderTable();
  updateStats();
  syncNav();
  syncCols();
  syncView();
  syncSort();
  syncControls();
}

function updateClock() {
  const formatter = new Intl.DateTimeFormat("zh-HK", {
    hour: "2-digit",
    minute: "2-digit"
  });
  els.liveClock.textContent = formatter.format(new Date());
}

function installEventListeners() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });

  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      render();
    });
  });

  els.displayButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.cols = Number(button.dataset.cols);
      render();
    });
  });

  els.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  els.controlToggle.addEventListener("click", () => {
    state.controlsOpen = !state.controlsOpen;
    render();
    if (state.controlsOpen) els.searchInput.focus();
  });

  els.controlClose.addEventListener("click", () => {
    state.controlsOpen = false;
    render();
  });

  els.sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.sortKey;
      if (state.sortKey === nextKey) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = nextKey;
        state.sortDir = "asc";
      }
      render();
    });
  });

  window.addEventListener("resize", render);

  document.addEventListener("keydown", (event) => {
    const isTypingTarget =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement;

    if (event.key === "/" && !isTypingTarget) {
      event.preventDefault();
      state.controlsOpen = true;
      render();
      els.searchInput.focus();
    }

    if (event.key === "Escape" && state.controlsOpen) {
      state.controlsOpen = false;
      render();
    }
  });
}

installEventListeners();
updateClock();
window.setInterval(updateClock, 60000);
render();
