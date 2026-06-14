# BBAP-Sec Knowledge Hub 🪲

Your personal, file-based knowledge base + AI study agent for **AI/ML and AI
Security Engineering**. Notes are plain Markdown you edit in **VS Code** (or
Obsidian). A local dashboard reads them, draws a knowledge graph, runs your
projects, and an AI agent answers questions *from your own notes*.

Built for personal use now, structured so it can grow into a product later.

---

## Why this design

| Your requirement | How it's met |
|---|---|
| Categorized topics, projects, PDF/notes/YouTube/site links | Markdown files in category folders; YAML frontmatter holds `type`, `tags`, `status`, `sources` (any URL or PDF path) |
| Connect related info (Obsidian/Notion-style) | `[[wikilinks]]` between notes → backlinks + a force-directed **knowledge graph** |
| Edit in VS Code, handle Markdown | The vault is just `.md` files. `.vscode/` recommends the **Foam** extension = Obsidian-like wikilinks/graph *inside VS Code* |
| AI agent that learns from my info | RAG agent retrieves the most relevant note chunks and answers grounded in them, citing sources |
| Dashboard showing notes, info, projects + their output | Web dashboard: stats, project runner with live output, note viewer, graph, agent chat |
| BBAP-Sec branding, black + emerald | Dark emerald theme with copper/gold accents; your logo in the header |
| Private now, sellable later | Local-first, no lock-in; swap the LLM backend to fully-local Ollama; clean module boundaries |

---

## Quick start

```bash
cd bbapsec-hub
python3.12 -m venv .venv && source .venv/bin/activate      # optional but recommended
pip install -r requirements.txt

# (optional, to enable the agent) use Claude:
cp .env.example .env        # then put your ANTHROPIC_API_KEY in .env
# ...or run a fully local model instead — see "Going fully local" below

uvicorn app.main:app --reload --port 8787
#or
python -m uvicorn app.main:app --reload --port 8787
```

Open **http://localhost:8787**. Edit notes in VS Code (`code .`); click **⟳ Sync**
in the dashboard to pick up changes.

---

## How you use it day to day

1. **Capture** — drop a quick note in `vault/00-inbox/`.
2. **Organize** — move it to a category folder (`10-ai-ml`, `20-ai-security`, …)
   and fill in frontmatter. Copy `vault/templates/note-template.md` to start.
3. **Connect** — reference other notes with `[[Title]]`. They become graph edges.
4. **Track sources** — put YouTube/article/PDF links under `sources:`.
5. **Projects** — set `type: project` and a `run:` command; the dashboard runs it
   and shows the output.
6. **Ask** — open the **Study Agent** and ask anything; it answers from your vault.

### Note frontmatter

```yaml
---
title: Prompt Injection
type: note          # note | project | resource
tags: [ai-security, llm]
status: learning    # idea | learning | review | done
sources:
  - https://owasp.org/...
  - https://youtube.com/watch?v=...
  - /path/to/paper.pdf
run: ""             # projects only: shell command to execute
---
```

---

## Going fully local (recommended for sensitive security notes)

Install [Ollama](https://ollama.com), pull a model, then in `config.yaml`:

```yaml
llm:
  backend: ollama
  model: llama3.1      # or qwen2.5, mistral, etc.
```

Now nothing leaves your machine — no API key, no cloud.

---

## Project layout

```
bbapsec-hub/
├── vault/                  ← your knowledge (edit in VS Code / Obsidian)
│   ├── 00-inbox/ 10-ai-ml/ 20-ai-security/ 30-projects/ 40-resources/
│   └── templates/
├── projects/               ← code for runnable projects
├── app/
│   ├── main.py             ← FastAPI server + endpoints
│   ├── vault.py            ← markdown/frontmatter/wikilink parser + graph
│   ├── agent.py            ← RAG study agent (BM25 retrieval)
│   ├── llm.py              ← Claude / Ollama adapter
│   └── static/             ← dashboard (index.html, style.css, app.js, logo.png)
├── .vscode/                ← recommends Foam + markdown extensions
├── config.yaml  requirements.txt  .env.example
```

---

## Roadmap toward a product

- **Semantic search**: swap BM25 for embeddings (Chroma + sentence-transformers
  or Voyage). Hook is marked in `app/agent.py`.
- **Auth + multi-user**: add login, scope vaults per user.
- **Spaced repetition**: a `review` queue from `status: review` notes.
- **Editing from the UI**: today the dashboard is read-only (VS Code is the editor);
  add a write API when you want in-browser editing.
- **Packaging**: wrap with Tauri/Electron for a one-click desktop app to sell.

---
*BBAP-Sec — built to learn, hardened to ship.*
