"""
main.py — the BBAP-Sec Knowledge Hub server.

Run:  uvicorn app.main:app --reload --port 8787
Then open http://localhost:8787

It serves:
  - the dashboard (static/)
  - a read-only API over your vault (notes, graph, search, stats)
  - the AI study agent (/api/agent/ask)
  - a project runner that executes the `run:` command from a project note's
    frontmatter and returns its output to the dashboard
"""
from __future__ import annotations
import os
import subprocess
from pathlib import Path

import yaml
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .vault import Vault
from .llm import LLM
from .agent import Agent

ROOT = Path(__file__).resolve().parent.parent
CONFIG = yaml.safe_load((ROOT / "config.yaml").read_text()) if (ROOT / "config.yaml").exists() else {}
VAULT_DIR = ROOT / CONFIG.get("vault_dir", "vault")

vault = Vault(str(VAULT_DIR))
llm = LLM(CONFIG.get("llm", {}))
agent = Agent(vault, llm)

app = FastAPI(title="BBAP-Sec Knowledge Hub")


class AskBody(BaseModel):
    question: str


class RunBody(BaseModel):
    note_id: str


@app.get("/api/stats")
def stats():
    return vault.stats()


@app.get("/api/notes")
def notes():
    return vault.all_summaries()


@app.get("/api/categories")
def categories():
    return vault.categories()


@app.get("/api/projects")
def projects():
    return vault.projects()


@app.get("/api/graph")
def graph():
    return vault.graph()


@app.get("/api/note/{note_id}")
def note(note_id: str):
    n = vault.get(note_id)
    if not n:
        raise HTTPException(404, "note not found")
    d = n.to_summary()
    d["html"] = n.html
    return d


@app.post("/api/reload")
def reload():
    vault.reload()
    agent.reindex()
    return {"ok": True, **vault.stats()}


@app.post("/api/agent/ask")
def ask(body: AskBody):
    if not body.question.strip():
        raise HTTPException(400, "empty question")
    return agent.ask(body.question.strip())


@app.post("/api/project/run")
def run_project(body: RunBody):
    """Runs the `run:` command declared in a project note's frontmatter.
    Only the command stored in YOUR note is executed — never free text from
    the UI — so the dashboard cannot be tricked into running arbitrary input."""
    n = vault.get(body.note_id)
    if not n:
        raise HTTPException(404, "note not found")
    cmd = n.frontmatter.get("run")
    if not cmd:
        raise HTTPException(400, "this note has no `run:` command in its frontmatter")
    workdir = n.frontmatter.get("workdir", str(ROOT))
    try:
        proc = subprocess.run(
            cmd, shell=True, cwd=workdir, capture_output=True,
            text=True, timeout=CONFIG.get("run_timeout", 120),
        )
        return {
            "command": cmd,
            "returncode": proc.returncode,
            "stdout": proc.stdout[-20000:],
            "stderr": proc.stderr[-8000:],
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(408, "project run timed out")


@app.get("/api/health")
def health():
    ready, reason = llm.available()
    return {"vault": str(VAULT_DIR), "agent_ready": ready, "agent_reason": reason,
            "backend": llm.backend}


# ---- static dashboard (mounted last so /api/* wins) ----
STATIC = Path(__file__).resolve().parent / "static"


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


app.mount("/", StaticFiles(directory=str(STATIC)), name="static")
