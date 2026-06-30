from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app import main


def _note(run: str, workdir: str | None = None) -> SimpleNamespace:
    fm = {"run": run}
    if workdir is not None:
        fm["workdir"] = workdir
    return SimpleNamespace(frontmatter=fm)


def test_run_project_rejects_workdir_outside_repo() -> None:
    with patch.object(
        main.vault, "get", lambda _note_id: _note("python demo.py", "/tmp")
    ):
        try:
            main.run_project(main.RunBody(note_id="n1"))
            raised = False
        except HTTPException as ex:
            raised = True
            assert ex.status_code == 400
            assert "inside the project root" in str(ex.detail)

    assert raised


def test_run_project_uses_shell_false_and_argv() -> None:
    calls: dict[str, object] = {}

    def fake_run(args: list[str], **kwargs: object) -> SimpleNamespace:
        calls["args"] = args
        calls["kwargs"] = kwargs
        return SimpleNamespace(returncode=0, stdout="ok", stderr="")

    with (
        patch.object(
            main.vault,
            "get",
            lambda _note_id: _note("python projects/prompt_injection_lab/demo.py", "."),
        ),
        patch.object(main.subprocess, "run", fake_run),
    ):
        out = main.run_project(main.RunBody(note_id="n1"))

    assert isinstance(calls["args"], list)
    kwargs = calls["kwargs"]
    assert isinstance(kwargs, dict)
    assert kwargs.get("shell") is False
    assert out["returncode"] == 0


def test_metrics_endpoint_exists() -> None:
    out = main.metrics(limit=20)
    assert "events" in out
    assert "recent" in out
