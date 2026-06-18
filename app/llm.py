"""
llm.py — a thin adapter so the agent doesn't care which model answers.

Two backends:
  - "anthropic"  : Claude via the Anthropic API (needs ANTHROPIC_API_KEY)
  - "ollama"     : a fully local model (e.g. llama3, qwen) via Ollama, no API key,
                   nothing leaves your machine. Good for sensitive security notes.

Pick the backend in config.yaml -> llm.backend
"""
from __future__ import annotations
import os
import json
import urllib.request


class LLM:
    def __init__(self, cfg: dict):
        self.backend = cfg.get("backend", "anthropic")
        self.model = cfg.get("model")
        self.ollama_host = cfg.get("ollama_host", "http://localhost:11434")
        self.last_usage: dict = {}   # populated after each chat() call

    def available(self) -> tuple[bool, str]:
        """Return (ready, reason). Lets the UI show a friendly message."""
        if self.backend == "anthropic":
            if not os.environ.get("ANTHROPIC_API_KEY"):
                return False, "ANTHROPIC_API_KEY is not set (see .env.example)."
            try:
                import anthropic  # noqa
            except ImportError:
                return False, "Run: pip install anthropic"
            return True, ""
        if self.backend == "ollama":
            return True, ""  # checked lazily at call time
        return False, f"Unknown backend '{self.backend}'."

    def chat(self, system: str, user: str) -> str:
        if self.backend == "anthropic":
            return self._anthropic(system, user)
        if self.backend == "ollama":
            return self._ollama(system, user)
        raise ValueError(f"Unknown backend {self.backend}")

    def _anthropic(self, system: str, user: str) -> str:
        import anthropic
        client = anthropic.Anthropic()
        resp = client.messages.create(
            model=self.model or "claude-opus-4-8",
            max_tokens=1500,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        u = getattr(resp, "usage", None)
        self.last_usage = {
            "input_tokens": getattr(u, "input_tokens", 0),
            "output_tokens": getattr(u, "output_tokens", 0),
            "backend": "anthropic",
        }
        return "".join(b.text for b in resp.content if b.type == "text")

    def _ollama(self, system: str, user: str) -> str:
        payload = json.dumps({
            "model": self.model or "llama3.1",
            "system": system,
            "prompt": user,
            "stream": False,
        }).encode()
        req = urllib.request.Request(
            f"{self.ollama_host}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=120) as r:
            data = json.loads(r.read())
        eval_count = data.get("eval_count", 0)
        eval_ns = data.get("eval_duration", 0) or 0
        self.last_usage = {
            "input_tokens": data.get("prompt_eval_count", 0),
            "output_tokens": eval_count,
            "tokens_per_sec": round(eval_count / (eval_ns / 1e9), 1) if eval_ns else 0,
            "backend": "ollama",
        }
        return data["response"]