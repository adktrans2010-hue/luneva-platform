"""Extract the approved RPP source document into structured JSON.

Usage: python scripts/import-rpp-document.py source.docx output.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from docx import Document


HEADINGS = {
    "Что такое РПП",
    "РПП — это не просто диета",
    "РПП не всегда видно",
    "Какие бывают расстройства пищевого поведения",
    "Нервная анорексия",
    "Нервная булимия",
    "Приступообразное переедание",
    "Другие формы РПП",
    "Почему развивается РПП",
    "Как РПП помогает — и почему потом разрушает",
    "Какие признаки стоит заметить",
    "Почему нельзя просто взять себя в руки",
    "Опасны ли расстройства пищевого поведения",
    "Как лечат РПП",
    "Как психотерапия помогает при РПП",
    "Можно ли полностью восстановиться",
    "Когда нужно обращаться за помощью срочно",
    "Главное",
}


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Expected source DOCX and output JSON paths")

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    paragraphs = [paragraph.text.strip() for paragraph in Document(source).paragraphs]
    paragraphs = [text for text in paragraphs if text]
    if not paragraphs:
        raise SystemExit("The document is empty")

    result: dict[str, object] = {
        "title": paragraphs[0],
        "intro": [],
        "sections": [],
    }
    current: dict[str, object] | None = None

    for text in paragraphs[1:]:
        if text in HEADINGS:
            current = {"heading": text, "paragraphs": []}
            result["sections"].append(current)  # type: ignore[union-attr]
        elif current is None:
            result["intro"].append(text)  # type: ignore[union-attr]
        else:
            current["paragraphs"].append(text)  # type: ignore[union-attr]

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
