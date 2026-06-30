from pathlib import Path

from app.vault import Vault


def _write_note(path: Path, title: str, body: str = "") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    _ = path.write_text(
        f"---\ntitle: {title}\ntype: note\n---\n{body}\n",
        encoding="utf-8",
    )


def test_duplicate_stems_do_not_overwrite(tmp_path: Path) -> None:
    _write_note(tmp_path / "10-ai-ml" / "_index.md", "AI/ML Index")
    _write_note(tmp_path / "20-ai-security" / "_index.md", "AI Security Index")

    vault = Vault(str(tmp_path))

    assert len(vault.notes) == 2
    ids = list(vault.notes.keys())
    assert len(set(ids)) == 2

    rel_to_id = {n.rel_path: n.id for n in vault.notes.values()}
    assert rel_to_id["10-ai-ml/_index.md"] != rel_to_id["20-ai-security/_index.md"]


def test_extensionless_note_is_indexed(tmp_path: Path) -> None:
    _write_note(tmp_path / "10-ai-ml" / "supervised & unsupervised", "S/U")

    vault = Vault(str(tmp_path))

    assert len(vault.notes) == 1
    only = next(iter(vault.notes.values()))
    assert only.rel_path == "10-ai-ml/supervised & unsupervised"
    assert only.title == "S/U"
