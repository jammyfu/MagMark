"""Apply the reviewed continuation patch; commit only after the workflow gates pass."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import sys

HELPER = Path('tools/continuation-20260915')
WORKFLOW = '.github/workflows/continuation-integration.yml'
BRANCH = 'refs/heads/feat/cjk-publishing-upgrade-20260914'
BASE = 'e0b0a5c89ca8d6a12f533c396a0e1b43fd33526c'
PATCH_HASH = '5421f72da6a1300311ab75930742eea72003b550674d11c939b6736214938990'


def git(*args: str, data: bytes | None = None) -> bytes:
    return subprocess.run(['git', *args], input=data, stdout=subprocess.PIPE, check=True).stdout


def blob(data: bytes) -> str:
    return hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()


def load_payload() -> tuple[dict, bytes]:
    manifest = json.loads((HELPER / 'manifest.json').read_text())
    if manifest['base'] != BASE or manifest['sha256'] != PATCH_HASH:
        raise RuntimeError('Unexpected patch identity')
    if len(manifest['parts']) != 8 or len(manifest['files']) != 25:
        raise RuntimeError('Unexpected manifest scope')
    for path in manifest['files']:
        parsed = PurePosixPath(path)
        if parsed.is_absolute() or '..' in parsed.parts or any(c.isspace() for c in path):
            raise RuntimeError('Unsafe path in manifest')
    parts = []
    for i, part in enumerate(manifest['parts'], 1):
        if part['path'] != f'part-{i:02}.patch':
            raise RuntimeError('Unexpected patch part')
        path = HELPER / part['path']
        if path.is_symlink():
            raise RuntimeError('Patch part must be a regular file')
        content = path.read_bytes()
        if blob(content) != part['git_blob']:
            raise RuntimeError(f'Patch part failed content verification: {path}')
        parts.append(content)
    patch = b''.join(parts)
    if len(patch) != 119623 or len(patch) != manifest['size'] or hashlib.sha256(patch).hexdigest() != PATCH_HASH:
        raise RuntimeError('Patch failed complete content verification')
    return manifest, patch


def verify_result(manifest: dict) -> None:
    if set(manifest['result_blobs']) != set(manifest['files']):
        raise RuntimeError('Result manifest does not cover exactly the reviewed files')
    for name, expected in manifest['result_blobs'].items():
        path = Path(name)
        if expected is None:
            if path.exists() or path.is_symlink():
                raise RuntimeError(f'Deleted file is still present: {name}')
        elif path.is_symlink() or not path.is_file() or blob(path.read_bytes()) != expected:
            raise RuntimeError(f'Result differs from locally tested bytes: {name}')
    staged = set(git('diff', '--cached', '--name-only').decode().splitlines())
    if staged != set(manifest['files']):
        raise RuntimeError('Staged files differ from the reviewed manifest')
    git('diff', '--exit-code')
    git('diff', '--cached', '--check')


def main() -> None:
    if os.environ.get('GITHUB_REPOSITORY') != 'jammyfu/MagMark' or os.environ.get('GITHUB_REF') != BRANCH:
        raise RuntimeError('This helper is restricted to the approved repository and branch')
    head = git('rev-parse', 'HEAD').decode().strip()
    if head != os.environ.get('GITHUB_SHA'):
        raise RuntimeError('Checkout does not match the workflow event')
    if git('rev-parse', 'HEAD^').decode().strip() != BASE:
        raise RuntimeError('Branch advanced from an unexpected parent; reconcile before retrying')
    manifest, patch = load_payload()
    if sys.argv[1:] == ['--apply']:
        allowed = {WORKFLOW, str(HELPER / 'manifest.json'), str(HELPER / 'integrate.py')}
        allowed.update(str(HELPER / part['path']) for part in manifest['parts'])
        changed = set(git('diff', '--name-only', BASE, 'HEAD').decode().splitlines())
        if changed != allowed:
            raise RuntimeError('Transport commit contains unexpected changes')
        git('diff', '--exit-code'); git('diff', '--cached', '--exit-code')
        paths = {line.split('\t', 2)[2] for line in git('apply', '--numstat', '-', data=patch).decode().splitlines()}
        if paths != set(manifest['files']):
            raise RuntimeError('Patch paths differ from the reviewed manifest')
        git('apply', '--check', '-', data=patch)
        git('apply', '-', data=patch)
        git('add', '--', *manifest['files'])
        verify_result(manifest)
        print('Exact reviewed patch applied; no branch update has been performed.')
    elif sys.argv[1:] == ['--commit']:
        verify_result(manifest)
        # Remove only this one-time helper; normal publishing CI stays read-only.
        git('rm', '-r', '--', str(HELPER), WORKFLOW)
        git('diff', '--cached', '--check')
        git('config', 'user.name', 'github-actions[bot]')
        git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
        git('commit', '-m', 'feat: secure article content and refine quiet dialogs and preview identity')
        print('Validated commit:', git('rev-parse', 'HEAD').decode().strip())
    else:
        raise RuntimeError('Expected --apply or --commit')


if __name__ == '__main__':
    main()
