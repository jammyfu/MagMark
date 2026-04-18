#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIRED_FILES = [
    "PROJECT_BRIEF.md",
    "MASTER_PLAN.md",
    "CURRENT_PLAN.md",
    "TODO_BACKLOG.md",
    "docs/project-governance/WORKLOG.md",
    "docs/project-governance/DECISIONS.md",
    "docs/project-governance/ACCEPTANCE.md",
    "docs/project-governance/CHANGELOG.md",
    "docs/AUTOMATION_COMMANDS.md",
    "docs/LONG_RUNNING_AUTONOMY.md",
    "tools/next_plan.py",
]
VERIFY_MODE = 'node'
COMMANDS = [
        'npm run typecheck',
        'npm run test'
]
RUN_CHECKS_BY_DEFAULT = False


def run(cmd: str) -> int:
    print(f"$ {cmd}")
    completed = subprocess.run(cmd, cwd=ROOT, shell=True)
    return completed.returncode


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify repository governance files and optional repo checks.")
    parser.add_argument("--deep", action="store_true", help="Run repo-specific deeper verification commands.")
    args = parser.parse_args()

    missing = [path for path in REQUIRED_FILES if not (ROOT / path).exists()]
    if missing:
        print("Missing governance files:")
        for path in missing:
            print(f"  - {path}")
        return 1

    failures = 0
    skipped: list[str] = []
    should_run_commands = RUN_CHECKS_BY_DEFAULT or args.deep

    if VERIFY_MODE == "node":
        if not should_run_commands:
            skipped.append("deep repo checks skipped by default; rerun with --deep")
        elif COMMANDS and (ROOT / "package.json").exists() and (ROOT / "node_modules").exists():
            for cmd in COMMANDS:
                failures += int(run(cmd) != 0)
        elif COMMANDS:
            skipped.append("node checks skipped because package.json or node_modules is missing")

    if VERIFY_MODE == "python_markdown":
        if should_run_commands:
            for cmd in COMMANDS:
                failures += int(run(cmd) != 0)
        required_dirs = ["00_Inbox", "01_Indexes", "02_Models", "03_Tools", "04_Platforms", "05_Infrastructure", "06_Topics"]
        for rel in required_dirs:
            if not (ROOT / rel).exists():
                print(f"Missing knowledge-base directory: {rel}")
                failures += 1

    if VERIFY_MODE == "python_node_optional":
        if should_run_commands:
            for cmd in COMMANDS:
                failures += int(run(cmd) != 0)
        else:
            skipped.append("deep repo checks skipped by default; rerun with --deep")

    if VERIFY_MODE == "flutter_optional":
        if not should_run_commands:
            skipped.append("deep repo checks skipped by default; rerun with --deep")
        elif shutil.which("flutter"):
            for cmd in COMMANDS:
                failures += int(run(cmd) != 0)
        else:
            skipped.append("flutter checks skipped because flutter is not installed")

    if skipped:
        print("Skipped checks:")
        for item in skipped:
            print(f"  - {item}")

    if failures:
        print(f"Verification failed with {failures} failing check(s).")
        return 1

    print("Verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
