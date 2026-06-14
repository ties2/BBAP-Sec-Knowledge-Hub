"""
agent.py — your study assistant. It answers questions using *your own notes*
(retrieval-augmented generation), so it learns from the vault as you grow it.

Retrieval here is BM25 (keyword relevance). It needs no downloads and no GPU,
which keeps the starter light. When your vault gets large or you want semantic
search, swap _Retriever for an embeddings-based one (see UPGRADE note at bottom).
"""
from __future__ import annotations
import re
from dataclasses import dataclass

from rank_bm25 import BM25Okapi

from .vault import Vault, Note
from .llm import LLM


def _chunk(text: str, size: int = 900, overlap: int = 150) -> list[str]:
    text = text.strip()
    if len(text) <= size:
        return [text] if text else []
    out, i = [], 0
    while i < len(text):
        out.append(text[i:i + size])
        i += size - overlap
    return out


@dataclass
class Chunk:
    note_id: str
    title: str
    rel_path: str
    text: str


class _Retriever:
    def __init__(self, vault: Vault):
        self.chunks: list[Chunk] = []
        self.bm25: BM25Okapi | None = None
        self.build(vault)

    @staticmethod
    def _tok(s: str) -> list[str]:
        return re.findall(r"[a-z0-9]+", s.lower())

    def build(self, vault: Vault) -> None:
        self.chunks = []
        for n in vault.notes.values():
            for c in _chunk(n.body):
                self.chunks.append(Chunk(n.id, n.title, n.rel_path, c))
        corpus = [self._tok(f"{c.title} {c.text}") for c in self.chunks]
        self.bm25 = BM25Okapi(corpus) if corpus else None

    def search(self, query: str, k: int = 5) -> list[Chunk]:
        if not self.bm25 or not self.chunks:
            return []
        scores = self.bm25.get_scores(self._tok(query))
        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        return [self.chunks[i] for i in ranked[:k] if scores[i] > 0]


SYSTEM = """You are the BBAP-Sec study agent, a focused mentor for AI/ML and \
AI Security Engineering. Answer using the CONTEXT from the user's personal \
knowledge vault when it is relevant, and say when you are going beyond it. \
Be precise and practical. Cite the note titles you used. If the vault lacks \
the answer, say so and give your best expert guidance, then suggest what note \
the user should create to capture it."""


class Agent:
    def __init__(self, vault: Vault, llm: LLM):
        self.vault = vault
        self.llm = llm
        self.retriever = _Retriever(vault)

    def reindex(self) -> None:
        self.retriever.build(self.vault)

    def ask(self, question: str) -> dict:
        hits = self.retriever.search(question, k=5)
        context = "\n\n".join(
            f"### {h.title}  ({h.rel_path})\n{h.text}" for h in hits
        ) or "(no matching notes found in the vault)"
        ready, reason = self.llm.available()
        if not ready:
            return {
                "answer": f"Agent is not configured yet: {reason}",
                "sources": [{"id": h.note_id, "title": h.title} for h in hits],
                "configured": False,
            }
        user = f"CONTEXT FROM VAULT:\n{context}\n\n---\nQUESTION: {question}"
        answer = self.llm.chat(SYSTEM, user)
        # dedupe sources preserving order
        seen, sources = set(), []
        for h in hits:
            if h.note_id not in seen:
                seen.add(h.note_id)
                sources.append({"id": h.note_id, "title": h.title})
        return {"answer": answer, "sources": sources, "configured": True}


# UPGRADE to semantic search later:
#   pip install chromadb sentence-transformers
#   embed each chunk with a local model (e.g. all-MiniLM-L6-v2) into Chroma,
#   then replace _Retriever.search with a vector similarity query.
#   The rest of the agent stays the same.
