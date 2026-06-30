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

import shlex
import subprocess
from pathlib import Path

import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import telemetry
from .agent import Agent
from .llm import LLM
from .vault import Vault

ROOT = Path(__file__).resolve().parent.parent
_ = load_dotenv(ROOT / ".env")

_raw_config = (
    yaml.safe_load((ROOT / "config.yaml").read_text())
    if (ROOT / "config.yaml").exists()
    else {}
)
CONFIG = _raw_config if isinstance(_raw_config, dict) else {}
VAULT_DIR = ROOT / str(CONFIG.get("vault_dir", "vault"))

vault = Vault(str(VAULT_DIR))
llm_cfg = CONFIG.get("llm", {})
llm = LLM(llm_cfg if isinstance(llm_cfg, dict) else {})
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


def _safe_workdir(raw_workdir: object) -> Path:
    """Resolve and constrain project workdir to the repository root."""
    p = Path(str(raw_workdir or ROOT))
    if not p.is_absolute():
        p = ROOT / p
    resolved = p.resolve()
    try:
        _ = resolved.relative_to(ROOT)
    except ValueError as exc:
        raise HTTPException(400, "workdir must stay inside the project root") from exc
    if not resolved.exists() or not resolved.is_dir():
        raise HTTPException(400, "workdir does not exist or is not a directory")
    return resolved


def _parse_command(raw_cmd: object) -> list[str]:
    if not isinstance(raw_cmd, str) or not raw_cmd.strip():
        raise HTTPException(
            400, "this note has no valid `run:` command in its frontmatter"
        )
    try:
        argv = shlex.split(raw_cmd)
    except ValueError as exc:
        raise HTTPException(400, f"invalid run command: {exc}") from exc
    if not argv:
        raise HTTPException(
            400, "this note has no valid `run:` command in its frontmatter"
        )
    return argv


@app.post("/api/project/run")
def run_project(body: RunBody):
    """Runs the `run:` command declared in a project note's frontmatter.
    Command execution is shell-free and constrained to this project directory."""
    n = vault.get(body.note_id)
    if not n:
        raise HTTPException(404, "note not found")

    raw_cmd = n.frontmatter.get("run")
    argv = _parse_command(raw_cmd)
    workdir = _safe_workdir(n.frontmatter.get("workdir", str(ROOT)))

    try:
        proc = subprocess.run(
            argv,
            shell=False,
            cwd=str(workdir),
            capture_output=True,
            text=True,
            timeout=int(CONFIG.get("run_timeout", 120)),
        )
        return {
            "command": raw_cmd,
            "returncode": proc.returncode,
            "stdout": proc.stdout[-20000:],
            "stderr": proc.stderr[-8000:],
        }
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(408, "project run timed out") from exc


@app.get("/api/metrics")
def metrics(limit: int = 1000):
    safe_limit = max(1, min(limit, 5000))
    return telemetry.summarize(limit=safe_limit)


@app.get("/api/health")
def health():
    ready, reason = llm.available()
    return {
        "vault": str(VAULT_DIR),
        "agent_ready": ready,
        "agent_reason": reason,
        "backend": llm.backend,
    }


# ---- static dashboard (mounted last so /api/* wins) ----
STATIC = Path(__file__).resolve().parent / "static"


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


app.mount("/", StaticFiles(directory=str(STATIC)), name="static")
