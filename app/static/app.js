// BBAP-Sec Knowledge Hub — dashboard logic (vanilla JS, no build step)
async function api(p, opts) {
  const res = await fetch("/api" + p, {
    cache: "no-store",
    ...opts,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = { detail: text || `HTTP ${res.status}` };
  }

  if (!res.ok) {
    const msg =
      data && data.detail ? String(data.detail) : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
const $ = (s) => document.querySelector(s);
const el = (t, c) => {
  const e = document.createElement(t);
  if (c) e.className = c;
  return e;
};

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function sanitizeUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("#") || s.startsWith("/")) return s;
  try {
    const u = new URL(s, window.location.origin);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch (_) {}
  return null;
}

function sanitizeHtml(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;

  const allowedTags = new Set([
    "a",
    "p",
    "div",
    "span",
    "br",
    "hr",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "strong",
    "em",
    "b",
    "i",
  ]);
  const allowedAttrs = new Set([
    "href",
    "title",
    "class",
    "data-note",
    "target",
    "rel",
  ]);

  const walk = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        const txt = document.createTextNode(node.textContent || "");
        node.replaceWith(txt);
        return;
      }

      [...node.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (!allowedAttrs.has(name) || name.startsWith("on")) {
          node.removeAttribute(attr.name);
          return;
        }
        if (name === "href") {
          const safe = sanitizeUrl(attr.value);
          if (!safe) node.removeAttribute("href");
          else node.setAttribute("href", safe);
        }
      });
    }
    [...node.childNodes].forEach(walk);
  };

  [...tpl.content.childNodes].forEach(walk);
  return tpl.innerHTML;
}

let NOTES = []; // summaries
let STATE = { view: "dashboard" };

// ---------- view switching ----------
function stopGraph() {
  if (G) {
    cancelAnimationFrame(G);
    G = null;
  }
  drag = null;
  const canvas = $("#graph-canvas");
  if (canvas) {
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
  }
}

function show(view) {
  if (view !== "graph") stopGraph();
  STATE.view = view;
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  $("#view-" + view).classList.remove("hidden");
  document
    .querySelectorAll(".nav li")
    .forEach((li) => li.classList.toggle("active", li.dataset.view === view));
  if (view === "graph") drawGraph();
}
document
  .querySelectorAll(".nav li")
  .forEach((li) => li.addEventListener("click", () => show(li.dataset.view)));

// ---------- boot ----------
async function boot() {
  const [stats, cats, health] = await Promise.all([
    api("/stats"),
    api("/categories"),
    api("/health"),
  ]);
  NOTES = await api("/notes");
  renderStats(stats);
  renderCategories(cats);
  renderProjects();
  renderLearning();
  renderHealth(health);
}

function renderHealth(h) {
  const p = $("#agent-status");
  p.textContent = h.agent_ready ? `agent · ${h.backend}` : "agent · setup";
  p.className = "pill " + (h.agent_ready ? "ok" : "off");
  p.title = h.agent_ready ? `Ready (${h.backend})` : h.agent_reason;
}

function renderStats(s) {
  const row = $("#stat-row");
  clear(row);
  const items = [
    ["Notes", s.notes],
    ["Projects", s.projects],
    ["Categories", s.categories],
    ["Connections", s.links],
  ];

  items.forEach(([label, value]) => {
    const card = el("div", "stat");
    const n = el("div", "n");
    n.textContent = String(value ?? 0);
    const l = el("div", "l");
    l.textContent = label;
    card.appendChild(n);
    card.appendChild(l);
    row.appendChild(card);
  });
}

function renderCategories(cats) {
  const tree = $("#category-tree");
  clear(tree);

  Object.entries(cats).forEach(([cat, notes]) => {
    const label = cat.replace(/^\d+-/, "").replace(/-/g, " ");
    const catRow = el("div", "cat");
    const left = el("span");
    left.textContent = label;
    const right = el("span");
    right.textContent = String(notes.length);
    catRow.appendChild(left);
    catRow.appendChild(right);
    tree.appendChild(catRow);

    notes.forEach((n) => {
      const leaf = el("div", "leaf" + (n.type === "project" ? " project" : ""));
      leaf.textContent = n.title;
      leaf.onclick = () => openNote(n.id);
      tree.appendChild(leaf);
    });
  });
}

function renderProjects() {
  const list = $("#project-list");
  clear(list);
  const projects = NOTES.filter((n) => n.type === "project");
  $("#proj-count").textContent = String(projects.length);

  if (!projects.length) {
    const hint = el("div", "hint");
    hint.appendChild(
      document.createTextNode("No projects yet. Add a note with "),
    );
    const code = el("code");
    code.textContent = "type: project";
    hint.appendChild(code);
    hint.appendChild(document.createTextNode("."));
    list.appendChild(hint);
    return;
  }

  projects.forEach((p) => {
    const card = el("div", "project");
    const hasRun = p.frontmatter && p.frontmatter.run;

    const title = el("div", "pt");
    title.textContent = p.title;
    title.onclick = () => openNote(p.id);

    const meta = el("div", "meta-row");
    const badge = el("span", `badge ${p.status || ""}`.trim());
    badge.textContent = p.status || "project";
    meta.appendChild(badge);

    (p.tags || []).slice(0, 3).forEach((t) => {
      const tag = el("span", "tag");
      tag.textContent = t;
      meta.appendChild(tag);
    });

    if (hasRun) {
      const btn = el("button", "run-btn");
      btn.textContent = "▷ Run";
      btn.onclick = () => runProject(p.id, btn);
      meta.appendChild(btn);
    }

    card.appendChild(title);
    card.appendChild(meta);
    list.appendChild(card);
  });
}

function renderLearning() {
  const list = $("#learning-list");
  clear(list);
  const learning = NOTES.filter((n) =>
    ["learning", "review"].includes(n.status),
  ).slice(0, 8);

  if (!learning.length) {
    const hint = el("div", "hint");
    hint.textContent = "Nothing in progress.";
    list.appendChild(hint);
    return;
  }

  learning.forEach((n) => {
    const mi = el("div", "mi");
    const dot = el("span", "dot");
    const title = el("span");
    title.textContent = n.title;
    const badge = el("span", `badge ${n.status || ""}`.trim());
    badge.style.marginLeft = "auto";
    badge.textContent = n.status || "";
    mi.appendChild(dot);
    mi.appendChild(title);
    mi.appendChild(badge);
    mi.onclick = () => openNote(n.id);
    list.appendChild(mi);
  });
}

// ---------- note view ----------
async function openNote(id) {
  const n = await api("/note/" + id);
  if (n.detail) return;

  const noteBody = $("#note-body");
  noteBody.innerHTML = sanitizeHtml(n.html || "");
  noteBody.querySelectorAll("a.wikilink[data-note]").forEach((a) => {
    a.onclick = (e) => {
      e.preventDefault();
      openNote(a.dataset.note);
    };
  });

  const src = $("#note-sources");
  clear(src);
  if (n.sources && n.sources.length) {
    n.sources.forEach((u) => {
      const li = el("li");
      const a = el("a");
      const safeHref = sanitizeUrl(u);
      if (safeHref) {
        a.href = safeHref;
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.textContent = shortUrl(u);
      li.appendChild(a);
      src.appendChild(li);
    });
  } else {
    const li = el("li", "hint");
    li.textContent = "none";
    src.appendChild(li);
  }

  const links = $("#note-links");
  clear(links);
  n.links_out.forEach((t) => {
    const c = chip(t, "out");
    if (c) links.appendChild(c);
  });
  n.links_in.forEach((t) => {
    const c = chip(t, "in");
    if (c) links.appendChild(c);
  });
  if (!links.children.length) {
    const hint = el("span", "hint");
    hint.textContent = "no connections yet";
    links.appendChild(hint);
  }

  const meta = $("#note-meta");
  clear(meta);

  const typeRow = el("div");
  const typeLabel = el("b");
  typeLabel.textContent = "Type";
  typeRow.appendChild(typeLabel);
  typeRow.appendChild(document.createTextNode(` · ${n.type}`));
  meta.appendChild(typeRow);

  const statusRow = el("div");
  const statusLabel = el("b");
  statusLabel.textContent = "Status";
  statusRow.appendChild(statusLabel);
  statusRow.appendChild(document.createTextNode(` · ${n.status || "—"}`));
  meta.appendChild(statusRow);

  const fileRow = el("div");
  const fileLabel = el("b");
  fileLabel.textContent = "File";
  const fileCode = el("code");
  fileCode.textContent = n.rel_path;
  fileRow.appendChild(fileLabel);
  fileRow.appendChild(document.createTextNode(" · "));
  fileRow.appendChild(fileCode);
  meta.appendChild(fileRow);

  const tagsRow = el("div");
  tagsRow.style.marginTop = "8px";
  (n.tags || []).forEach((t) => {
    const tag = el("span", "tag");
    tag.textContent = t;
    tagsRow.appendChild(tag);
  });
  meta.appendChild(tagsRow);

  show("note");
}

function chip(id, dir) {
  const note = NOTES.find((x) => x.id === id);
  if (!note) return null;
  const c = el("span", "link-chip " + dir);
  c.textContent = note.title;
  c.onclick = () => openNote(id);
  return c;
}

function shortUrl(u) {
  try {
    const x = new URL(u);
    return x.hostname.replace("www.", "") + x.pathname.slice(0, 18);
  } catch {
    return String(u);
  }
}

// ---------- project runner ----------
async function runProject(id, btn) {
  const out = $("#run-output");
  show("dashboard");
  out.textContent = "Running…";
  if (btn) btn.disabled = true;

  try {
    const r = await api("/project/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_id: id }),
    });

    if (r.detail) {
      out.textContent = String(r.detail);
      return;
    }

    let text = `$ ${r.command || ""}\n\n${r.stdout || ""}`;
    if (r.stderr) text += `\n${r.stderr}`;
    text += `\n\nexit code ${r.returncode}`;
    out.textContent = text;
  } catch (e) {
    out.textContent = `Error: ${String(e)}`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---------- search ----------
const searchBox = $("#search");
const searchRes = $("#search-results");

searchBox.addEventListener("input", () => {
  const q = searchBox.value.toLowerCase().trim();
  if (!q) {
    searchRes.classList.add("hidden");
    return;
  }

  const hits = NOTES.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      n.category.includes(q),
  ).slice(0, 8);

  clear(searchRes);
  if (hits.length) {
    hits.forEach((n) => {
      const row = el("div", "row");
      row.dataset.id = n.id;

      const t = el("div", "t");
      t.textContent = n.title;

      const c = el("div", "c");
      c.textContent = `${n.category.replace(/^\d+-/, "")} · ${n.type}`;

      row.appendChild(t);
      row.appendChild(c);
      row.onclick = () => {
        openNote(row.dataset.id);
        searchRes.classList.add("hidden");
        searchBox.value = "";
      };
      searchRes.appendChild(row);
    });
  } else {
    const row = el("div", "row");
    const c = el("div", "c");
    c.textContent = "no matches";
    row.appendChild(c);
    searchRes.appendChild(row);
  }

  searchRes.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) searchRes.classList.add("hidden");
});

// ---------- agent chat ----------
const chatLog = $("#chat-log");
const chatBox = $("#chat-box");

function addMsg(text, who, sources) {
  const m = el("div", "msg " + who);
  m.textContent = text == null ? "" : String(text);

  if (sources && sources.length) {
    const s = el("div", "sources");
    s.appendChild(document.createTextNode("Sources: "));
    sources.forEach((src, i) => {
      const a = el("a");
      a.textContent = src.title;
      a.onclick = () => openNote(src.id);
      s.appendChild(a);
      if (i !== sources.length - 1) s.appendChild(document.createTextNode(" "));
    });
    m.appendChild(s);
  }

  chatLog.appendChild(m);
  chatLog.scrollTop = chatLog.scrollHeight;
  return m;
}

async function sendChat() {
  const q = chatBox.value.trim();
  if (!q) return;
  addMsg(q, "user");
  chatBox.value = "";

  const thinking = addMsg("thinking…", "bot");
  thinking.classList.add("typing");
  try {
    const r = await api("/agent/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    thinking.remove();
    addMsg(r.answer || r.detail || "(no answer)", "bot", r.sources);
  } catch (e) {
    thinking.remove();
    addMsg("Error: " + e, "bot");
  }
}

$("#chat-send").onclick = sendChat;
chatBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
});

// ---------- sync ----------
$("#reload-btn").onclick = async () => {
  const btn = $("#reload-btn");
  const runOut = $("#run-output");
  btn.disabled = true;
  try {
    await api("/reload", { method: "POST" });
    await boot();
    if (runOut) runOut.textContent = "Sync complete ✔";
  } catch (e) {
    if (runOut) runOut.textContent = `Sync failed: ${String(e)}`;
  } finally {
    btn.disabled = false;
  }
};

// ---------- canvas force graph (tiny, dependency-free) ----------
let G = null;
let drag = null;

async function drawGraph() {
  const data = await api("/graph");
  const canvas = $("#graph-canvas");
  const dpr = window.devicePixelRatio || 1;

  const fit = () => {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  };
  fit();

  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const colors = {
    "10-ai-ml": "#34e3a8",
    "20-ai-security": "#c98a57",
    "30-projects": "#d4af37",
    "40-resources": "#7fa093",
    "00-inbox": "#5c7a6d",
  };

  const nodes = data.nodes.map((n) => ({
    ...n,
    x: W / 2 + (Math.random() - 0.5) * 300,
    y: H / 2 + (Math.random() - 0.5) * 300,
    vx: 0,
    vy: 0,
  }));
  const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
  const edges = data.edges.filter(
    (e) => idx[e.source] != null && idx[e.target] != null,
  );

  const ctx = canvas.getContext("2d");

  function tick() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const d2 = dx * dx + dy * dy + 0.01;
        const f = 1800 / d2;
        dx *= f;
        dy *= f;
        a.vx += dx;
        a.vy += dy;
        b.vx -= dx;
        b.vy -= dy;
      }
    }

    edges.forEach((e) => {
      const a = nodes[idx[e.source]];
      const b = nodes[idx[e.target]];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - 120) * 0.01;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f;
      b.vy -= (dy / d) * f;
    });

    nodes.forEach((n) => {
      n.vx += (W / 2 - n.x) * 0.0008;
      n.vy += (H / 2 - n.y) * 0.0008;
      if (n !== drag) {
        n.x += n.vx *= 0.85;
        n.y += n.vy *= 0.85;
      }
    });

    render();
    G = requestAnimationFrame(tick);
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(16,185,129,.25)";

    edges.forEach((e) => {
      const a = nodes[idx[e.source]];
      const b = nodes[idx[e.target]];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    nodes.forEach((n) => {
      const r = n.type === "project" ? 9 : 6;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 7);
      ctx.fillStyle = colors[n.category] || "#10b981";
      ctx.fill();
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#cfe9de";
      ctx.font = "11px -apple-system,sans-serif";
      ctx.fillText(n.title.slice(0, 22), n.x + r + 3, n.y + 3);
    });
  }

  if (G) cancelAnimationFrame(G);

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.onmousedown = (e) => {
    const p = pos(e);
    drag = nodes.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < 12);
  };
  canvas.onmousemove = (e) => {
    if (drag) {
      const p = pos(e);
      drag.x = p.x;
      drag.y = p.y;
      drag.vx = drag.vy = 0;
    }
  };
  canvas.onmouseup = (e) => {
    const p = pos(e);
    const hit = nodes.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < 12);
    if (hit && drag === hit && Math.hypot(hit.vx, hit.vy) < 2) openNote(hit.id);
    drag = null;
  };

  tick();
}

boot();
