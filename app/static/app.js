// BBAP-Sec Knowledge Hub — dashboard logic (vanilla JS, no build step)
const api = (p, opts) => fetch("/api" + p, opts).then((r) => r.json());
const $ = (s) => document.querySelector(s);
const el = (t, c, h) => {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (h != null) e.innerHTML = h;
  return e;
};

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

  const sanitizeUrl = (url) => {
    if (!url) return null;
    const s = String(url).trim();
    if (s.startsWith("#") || s.startsWith("/")) return s;
    try {
      const u = new URL(s, window.location.origin);
      if (u.protocol === "http:" || u.protocol === "https:")
        return u.toString();
    } catch (_) {}
    return null;
  };

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
  row.innerHTML = "";
  const items = [
    ["Notes", s.notes],
    ["Projects", s.projects],
    ["Categories", s.categories],
    ["Connections", s.links],
  ];
  items.forEach(([l, n]) =>
    row.appendChild(
      el("div", "stat", `<div class="n">${n}</div><div class="l">${l}</div>`),
    ),
  );
}

function renderCategories(cats) {
  const tree = $("#category-tree");
  tree.innerHTML = "";
  Object.entries(cats).forEach(([cat, notes]) => {
    const label = cat.replace(/^\d+-/, "").replace(/-/g, " ");
    tree.appendChild(
      el("div", "cat", `<span>${label}</span><span>${notes.length}</span>`),
    );
    notes.forEach((n) => {
      const leaf = el(
        "div",
        "leaf" + (n.type === "project" ? " project" : ""),
        n.title,
      );
      leaf.onclick = () => openNote(n.id);
      tree.appendChild(leaf);
    });
  });
}

function renderProjects() {
  const list = $("#project-list");
  list.innerHTML = "";
  const projects = NOTES.filter((n) => n.type === "project");
  $("#proj-count").textContent = projects.length;
  if (!projects.length) {
    list.innerHTML =
      '<div class="hint">No projects yet. Add a note with <code>type: project</code>.</div>';
    return;
  }
  projects.forEach((p) => {
    const card = el("div", "project");
    const hasRun = p.frontmatter && p.frontmatter.run;
    card.innerHTML = `<div class="pt">${p.title}</div>
      <div class="meta-row">
        <span class="badge ${p.status}">${p.status || "project"}</span>
        ${(p.tags || [])
          .slice(0, 3)
          .map((t) => `<span class="tag">${t}</span>`)
          .join("")}
      </div>`;
    card.querySelector(".pt").onclick = () => openNote(p.id);
    if (hasRun) {
      const btn = el("button", "run-btn", "▷ Run");
      btn.onclick = () => runProject(p.id, btn);
      card.querySelector(".meta-row").appendChild(btn);
    }
    list.appendChild(card);
  });
}

function renderLearning() {
  const list = $("#learning-list");
  list.innerHTML = "";
  const learning = NOTES.filter((n) =>
    ["learning", "review"].includes(n.status),
  ).slice(0, 8);
  if (!learning.length) {
    list.innerHTML = '<div class="hint">Nothing in progress.</div>';
    return;
  }
  learning.forEach((n) => {
    const mi = el(
      "div",
      "mi",
      `<span class="dot"></span><span>${n.title}</span>
      <span class="badge ${n.status}" style="margin-left:auto">${n.status}</span>`,
    );
    mi.onclick = () => openNote(n.id);
    list.appendChild(mi);
  });
}

// ---------- note view ----------
async function openNote(id) {
  const n = await api("/note/" + id);
  if (n.detail) return;
  $("#note-body").innerHTML = sanitizeHtml(n.html || "");
  // wikilinks -> open within app
  $("#note-body")
    .querySelectorAll("a.wikilink[data-note]")
    .forEach(
      (a) =>
        (a.onclick = (e) => {
          e.preventDefault();
          openNote(a.dataset.note);
        }),
    );

  const src = $("#note-sources");
  src.innerHTML =
    n.sources && n.sources.length
      ? n.sources
          .map(
            (u) =>
              `<li><a href="${u}" target="_blank" rel="noopener">${shortUrl(u)}</a></li>`,
          )
          .join("")
      : '<li class="hint">none</li>';

  const links = $("#note-links");
  links.innerHTML = "";
  n.links_out.forEach((t) => {
    const c = chip(t, "out");
    if (c) links.appendChild(c);
  });
  n.links_in.forEach((t) => {
    const c = chip(t, "in");
    if (c) links.appendChild(c);
  });
  if (!links.children.length)
    links.innerHTML = '<span class="hint">no connections yet</span>';

  $("#note-meta").innerHTML = `
    <div><b>Type</b> · ${n.type}</div>
    <div><b>Status</b> · ${n.status || "—"}</div>
    <div><b>File</b> · <code>${n.rel_path}</code></div>
    <div style="margin-top:8px">${(n.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>`;
  show("note");
}
function chip(id, dir) {
  const note = NOTES.find((x) => x.id === id);
  if (!note) return null;
  const c = el("span", "link-chip " + dir, note.title);
  c.onclick = () => openNote(id);
  return c;
}
function shortUrl(u) {
  try {
    const x = new URL(u);
    return x.hostname.replace("www.", "") + x.pathname.slice(0, 18);
  } catch {
    return u;
  }
}

// ---------- project runner ----------
async function runProject(id, btn) {
  const out = $("#run-output");
  show("dashboard");
  out.textContent = "Running…";
  if (btn) {
    btn.disabled = true;
  }
  try {
    const r = await api("/project/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_id: id }),
    });
    if (r.detail) {
      out.innerHTML = `<span class="err">${r.detail}</span>`;
      return;
    }
    out.innerHTML =
      `<b>$ ${r.command}</b>\n\n${escapeHtml(r.stdout || "")}` +
      (r.stderr ? `\n<span class="err">${escapeHtml(r.stderr)}</span>` : "") +
      `\n\n<span class="hint">exit code ${r.returncode}</span>`;
  } catch (e) {
    out.innerHTML = `<span class="err">${e}</span>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}
function escapeHtml(s) {
  return s.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
  );
}

// ---------- search ----------
const searchBox = $("#search"),
  searchRes = $("#search-results");
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
  searchRes.innerHTML = hits.length
    ? hits
        .map(
          (n) =>
            `<div class="row" data-id="${n.id}"><div class="t">${n.title}</div><div class="c">${n.category.replace(/^\d+-/, "")} · ${n.type}</div></div>`,
        )
        .join("")
    : '<div class="row"><div class="c">no matches</div></div>';
  searchRes.classList.remove("hidden");
  searchRes.querySelectorAll(".row[data-id]").forEach(
    (r) =>
      (r.onclick = () => {
        openNote(r.dataset.id);
        searchRes.classList.add("hidden");
        searchBox.value = "";
      }),
  );
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) searchRes.classList.add("hidden");
});

// ---------- agent chat ----------
const chatLog = $("#chat-log"),
  chatBox = $("#chat-box");
function addMsg(text, who, sources) {
  const m = document.createElement("div");
  m.className = "msg " + who;
  m.textContent = text == null ? "" : String(text);
  if (sources && sources.length) {
    const s = el(
      "div",
      "sources",
      "Sources: " +
        sources.map((x) => `<a data-id="${x.id}">${x.title}</a>`).join(""),
    );
    s.querySelectorAll("a").forEach(
      (a) => (a.onclick = () => openNote(a.dataset.id)),
    );
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
  await api("/reload", { method: "POST" });
  await boot();
};

// ---------- canvas force graph (tiny, dependency-free) ----------
let G = null,
  drag = null;
async function drawGraph() {
  const data = await api("/graph");
  const canvas = $("#graph-canvas");
  const dpr = window.devicePixelRatio || 1;
  const fit = () => {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  };
  fit();
  const W = canvas.clientWidth,
    H = canvas.clientHeight;
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
    // repulsion
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j];
        let dx = a.x - b.x,
          dy = a.y - b.y,
          d2 = dx * dx + dy * dy + 0.01;
        const f = 1800 / d2;
        dx *= f;
        dy *= f;
        a.vx += dx;
        a.vy += dy;
        b.vx -= dx;
        b.vy -= dy;
      }
    // springs
    edges.forEach((e) => {
      const a = nodes[idx[e.source]],
        b = nodes[idx[e.target]];
      const dx = b.x - a.x,
        dy = b.y - a.y,
        d = Math.hypot(dx, dy) || 1;
      const f = (d - 120) * 0.01;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f;
      b.vy -= (dy / d) * f;
    });
    nodes.forEach((n) => {
      n.vx += (W / 2 - n.x) * 0.0008;
      n.vy += (H / 2 - n.y) * 0.0008; // gentle centering
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
      const a = nodes[idx[e.source]],
        b = nodes[idx[e.target]];
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
