# CURRENT_PLAN.md

## Goal

Standardize the core product repository without disturbing its existing rendering and export codepaths.

## Tasks

- [ ] Clean stale local worktree artifacts introduced by the workspace move.
- [ ] Create durable planning files and governance logs for the product line.
- [ ] Provide a repo verify entry that prefers typecheck and tests.

## Out Of Scope

- Large rendering refactors.
- Visual or branding redesign.

## Verification

- Run `python3 tools/verify.py`

## Next Candidates

- Define release-quality acceptance criteria.
- Document export-engine boundaries.
- Add typography regression fixtures to the governance loop.
