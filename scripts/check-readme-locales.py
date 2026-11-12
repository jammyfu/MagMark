from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
files = ["README.md", "README.en.md", "README.zh-Hant.md", "README.ja.md", "README.ko.md"]
for name in files:
    text = (root / name).read_text()
    for target in files:
        if target != name:
            assert target in text, (name, "missing language", target)
    assert len(text.encode()) > 2000, (name, "incomplete guide")
    assert "npm" in text and "LICENSE" in text, (name, "missing usage/license")
    for link in re.findall(r"(?:\]\(|(?:src|href|srcset)=\")([^\s\)\"]+)", text):
        if "://" in link or link.startswith(("#", "mailto:")): continue
        target = link.split("#")[0]
        if target: assert (root / target).exists(), (name, "missing local target", target)
print("Five-language navigation, substantive content and local file links passed")
