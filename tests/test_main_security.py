from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app import main


def _note(run: str, workdir: str | None = None) -> SimpleNamespace:
    fm = {"run": run}
    if workdir is not None:
        fm["workdir"] = workdir
    return SimpleNamespace(frontmatter=fm)


def test_run_project_rejects_workdir_outside_repo(monkeypatch) -> None:
    monkeypatch.setattr(
        main.vault, "get", lambda _note_id: _note("python demo.py", "/tmp")
    )

    with pytest.raises(HTTPException) as ex:
        main.run_project(main.RunBody(note_id="n1"))

    assert ex.value.status_code == 400
    assert "inside the project root" in ex.value.detail


def test_run_project_uses_shell_false_and_argv(monkeypatch) -> None:
    calls: dict[str, object] = {}

    def fake_run(args, **kwargs):
        calls["args"] = args
        calls["kwargs"] = kwargs
        return SimpleNamespace(returncode=0, stdout="ok", stderr="")

    monkeypatch.setattr(
        main.vault,
        "get",
        lambda _note_id: _note("python projects/prompt_injection_lab/demo.py", "."),
    )
    monkeypatch.setattr(main.subprocess, "run", fake_run)

    out = main.run_project(main.RunBody(note_id="n1"))

    assert isinstance(calls["args"], list)
    assert calls["kwargs"]["shell"] is False
    assert out["returncode"] == 0


def test_metrics_endpoint_exists() -> None:
    out = main.metrics(limit=20)
    assert "events" in out
    assert "recent" in out
