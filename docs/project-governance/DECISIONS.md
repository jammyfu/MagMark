# DECISIONS.md

## 2026-09-15 — less-is-more workspace

Simplify discovery rather than delete capability. The shell owns independent colors, workspace views and inspector state. Existing renderers and control IDs remain authoritative; source, image-directory, image-edit and target-specific export contracts are preserved.

CodeMirror adapts one textarea instance. It does not mutate browser prototypes or normalize source automatically. External source changes are narrow and undoable; composition guards do not substitute for real operating-system IME validation.

A native export dialog groups copy and file actions. State must not imply durable saving, uploading, publication or complete PNG output when the known page diagnostics indicate otherwise. Article styles remain independent from the light workspace.

Build the actual web entry by default and preserve an explicit optional library build. Keep strictness and include root entries. Lower-level unimplemented export backends return explicit unavailable results, never fake file bytes. Shared sanitization and parser migration remain open work.

Integration is restricted to the approved feature branch. One-time write-enabled helpers are removed after verified use; ordinary CI has contents:read, pinned actions and no persisted checkout credentials. No merge, deployment or WeChat account action.

## Inherited decisions

The complete earlier decisions are preserved byte-for-byte in [2026-09-14-DECISIONS.md](archive/2026-09-14-DECISIONS.md). In particular retain exact-range image editing, local-directory permission boundaries, native WeChat tables, 24px/20px paper insets, separate Word/WeChat output paths and the existing emphasis fix. Later entries in that historical document supersede its earlier workarounds.
