"""
vault.py — reads the markdown knowledge base.

The "vault" is just a folder of .md files (edit them in VS Code / Obsidian).
This module turns that folder into structured data the dashboard + agent use:

  - YAML frontmatter   -> metadata (type, tags, status, sources, ...)
  - [[wikilinks]]      -> connections between notes (the knowledge graph)
  - body text          -> rendered HTML + chunks for the AI agent

Nothing here writes to your files. It is read-only by design.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from pathlib import Path
from re import Match
from typing import Any, Callable

import markdown as md_lib
import yaml

WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)

JsonMap = dict[str, Any]


@dataclass
class Note:
    id: str  # slug, e.g. "prompt-injection"
    title: str
    path: str  # absolute path on disk
    rel_path: str  # path relative to the vault root
    category: str  # top-level folder, e.g. "20-ai-security"
    type: str = "note"  # note | project | resource (from frontmatter)
    tags: list[str] = field(default_factory=list)
    status: str = ""  # e.g. learning | done | idea
    sources: list[str] = field(default_factory=list)  # urls (youtube, sites, pdfs)
    links_out: list[str] = field(default_factory=list)  # ids this note points to
    links_in: list[str] = field(default_factory=list)  # ids pointing here
    frontmatter: JsonMap = field(default_factory=dict)
    body: str = ""  # raw markdown (without frontmatter)
    html: str = ""  # rendered html
    mtime: float = 0.0

    def to_summary(self) -> JsonMap:
        d: JsonMap = asdict(self)
        d.pop("body", None)
        d.pop("html", None)
        return d


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _as_list(v: Any) -> list[Any]:
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def _parse_file(path: Path, vault_root: Path) -> Note:
    raw = path.read_text(encoding="utf-8", errors="replace")
    fm: JsonMap = {}
    body = raw

    m = FRONTMATTER_RE.match(raw)
    if m:
        try:
            loaded = yaml.safe_load(m.group(1)) or {}
            fm = loaded if isinstance(loaded, dict) else {}
        except yaml.YAMLError:
            fm = {}
        body = raw[m.end() :]

    rel = path.relative_to(vault_root).as_posix()
    category = rel.split("/")[0] if "/" in rel else "root"
    fm_title = fm.get("title")
    title = (
        str(fm_title)
        if fm_title
        else path.stem.replace("-", " ").replace("_", " ").title()
    )

    links_out: list[str] = []
    for lm in WIKILINK_RE.finditer(body):
        links_out.append(_slugify(lm.group(1)))

    return Note(
        id=_slugify(path.stem),
        title=title,
        path=str(path),
        rel_path=rel,
        category=category,
        type=str(fm.get("type", "note")),
        tags=[str(t) for t in _as_list(fm.get("tags"))],
        status=str(fm.get("status", "")),
        sources=[str(s) for s in _as_list(fm.get("sources"))],
        links_out=sorted(set(links_out)),
        frontmatter=fm,
        body=body,
        mtime=path.stat().st_mtime,
    )


def _render_html(
    note: Note,
    by_id: dict[str, Note],
    resolve_link: Callable[[str], str | None],
) -> str:
    # turn [[wikilinks]] into clickable internal links before markdown rendering
    def repl(m: Match[str]) -> str:
        requested = _slugify(m.group(1))
        resolved = resolve_link(requested)
        label = m.group(2) or m.group(1)
        if resolved and resolved in by_id:
            return f'<a class="wikilink" href="#" data-note="{resolved}">{label}</a>'
        return f'<span class="wikilink missing" title="note not found">{label}</span>'

    text = WIKILINK_RE.sub(repl, note.body)
    return md_lib.markdown(
        text,
        extensions=["fenced_code", "tables", "toc", "sane_lists", "nl2br"],
    )


class Vault:
    """Loads and indexes the whole vault. Call .reload() to pick up edits."""

    def __init__(self, root: str):
        self.root: Path = Path(root).resolve()
        self.notes: dict[str, Note] = {}
        self.reload()

    def reload(self) -> None:
        notes: dict[str, Note] = {}
        stem_aliases: dict[str, list[str]] = {}
        title_aliases: dict[str, list[str]] = {}

        for path in sorted(self.root.rglob("*.md")):
            if any(part.startswith(".") for part in path.parts):
                continue
            if "templates" in path.relative_to(self.root).parts:
                continue  # templates are scaffolding, not knowledge

            note = _parse_file(path, self.root)
            stem_key = note.id

            # Ensure unique IDs so duplicate filenames (e.g. many _index.md files)
            # never overwrite each other in memory.
            unique_id = note.id
            if unique_id in notes:
                unique_id = _slugify(note.rel_path.rsplit(".", 1)[0])
            if unique_id in notes:
                i = 2
                while f"{unique_id}-{i}" in notes:
                    i += 1
                unique_id = f"{unique_id}-{i}"
            note.id = unique_id

            notes[note.id] = note
            stem_aliases.setdefault(stem_key, []).append(note.id)
            title_aliases.setdefault(_slugify(note.title), []).append(note.id)

        def resolve_link(target: str) -> str | None:
            if target in notes:
                return target
            by_stem = stem_aliases.get(target, [])
            if len(by_stem) == 1:
                return by_stem[0]
            by_title = title_aliases.get(target, [])
            if len(by_title) == 1:
                return by_title[0]
            return None

        # build backlinks
        for note in notes.values():
            for target in note.links_out:
                resolved = resolve_link(target)
                if resolved and resolved in notes:
                    notes[resolved].links_in.append(note.id)
        for note in notes.values():
            note.links_in = sorted(set(note.links_in))

        # render html (needs all notes present for link resolution)
        for note in notes.values():
            note.html = _render_html(note, notes, resolve_link)

        self.notes = notes

    # ---- queries used by the API ----
    def get(self, note_id: str) -> Note | None:
        return self.notes.get(note_id)

    def all_summaries(self) -> list[JsonMap]:
        return [
            n.to_summary()
            for n in sorted(self.notes.values(), key=lambda n: n.title.lower())
        ]

    def categories(self) -> dict[str, list[JsonMap]]:
        out: dict[str, list[JsonMap]] = {}
        for n in self.notes.values():
            out.setdefault(n.category, []).append(n.to_summary())
        for k in out:
            out[k].sort(key=lambda d: str(d["title"]).lower())
        return dict(sorted(out.items()))

    def projects(self) -> list[JsonMap]:
        return [n.to_summary() for n in self.notes.values() if n.type == "project"]

    def graph(self) -> JsonMap:
        nodes: list[JsonMap] = [
            {"id": n.id, "title": n.title, "category": n.category, "type": n.type}
            for n in self.notes.values()
        ]
        edges: list[JsonMap] = []
        seen: set[tuple[str, str]] = set()
        stem_aliases: dict[str, list[str]] = {}
        title_aliases: dict[str, list[str]] = {}
        for n in self.notes.values():
            stem_aliases.setdefault(_slugify(Path(n.rel_path).stem), []).append(n.id)
            title_aliases.setdefault(_slugify(n.title), []).append(n.id)

        def resolve_link(target: str) -> str | None:
            if target in self.notes:
                return target
            by_stem = stem_aliases.get(target, [])
            if len(by_stem) == 1:
                return by_stem[0]
            by_title = title_aliases.get(target, [])
            if len(by_title) == 1:
                return by_title[0]
            return None

        for n in self.notes.values():
            for t in n.links_out:
                resolved = resolve_link(t)
                if resolved and resolved in self.notes and (n.id, resolved) not in seen:
                    edges.append({"source": n.id, "target": resolved})
                    seen.add((n.id, resolved))
        return {"nodes": nodes, "edges": edges}

    def stats(self) -> JsonMap:
        all_tags: dict[str, int] = {}
        for n in self.notes.values():
            for t in n.tags:
                all_tags[t] = all_tags.get(t, 0) + 1
        return {
            "notes": len(self.notes),
            "projects": len(self.projects()),
            "categories": len(self.categories()),
            "links": sum(len(n.links_out) for n in self.notes.values()),
            "tags": dict(sorted(all_tags.items(), key=lambda x: -x[1])),
        }
