"""Offline-only DOCX/PPTX text extraction helper.

Run this against private files outside the public repository. The output is
intended for human review before any claim is added to the demo graph.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
from zipfile import ZipFile
from xml.etree import ElementTree as ET

W_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
A_NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}


def extract_docx(path: Path) -> list[dict[str, str]]:
    with ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    result: list[dict[str, str]] = []
    for index, paragraph in enumerate(root.findall(".//w:p", W_NS), 1):
        text = "".join(node.text or "" for node in paragraph.findall(".//w:t", W_NS)).strip()
        if text:
            result.append({"source_file": path.name, "locator": f"paragraph:{index}", "text": text})
    return result


def extract_pptx(path: Path) -> list[dict[str, str]]:
    with ZipFile(path) as archive:
        slide_pattern = re.compile(r"^ppt/slides/slide(\d+)\.xml$")
        indexed_slides = [
            (int(match.group(1)), name)
            for name in archive.namelist()
            if (match := slide_pattern.match(name))
        ]
        slides = [name for _, name in sorted(indexed_slides)]
        result: list[dict[str, str]] = []
        for number, name in enumerate(slides, 1):
            root = ET.fromstring(archive.read(name))
            text = " ".join(node.text or "" for node in root.findall(".//a:t", A_NS)).strip()
            if text:
                result.append({"source_file": path.name, "locator": f"slide:{number}", "text": text})
        return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.input.suffix.lower() == ".docx":
        records = extract_docx(args.input)
    elif args.input.suffix.lower() == ".pptx":
        records = extract_pptx(args.input)
    else:
        raise SystemExit("Only .docx and .pptx are supported")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
