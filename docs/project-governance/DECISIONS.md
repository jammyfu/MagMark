# DECISIONS.md

## 2026-09-14

- WeChat export HTML (`src/wechat/*`) is a separate paste path from magazine preview. Only this path is sanitized for 公众号「内容结构检测」.
- Safe `text-align` values for WeChat paste: `left` | `right` | `center` | omit. Never emit `justify`, `start`, `end`, or `text-justify`.
- Standalone images use one centering method: a `<p style="text-align:center">` wrapper and `max-width:100%` on the img. No `<figure>`, no `display:block` + `margin:auto`, no fixed pixel widths.
- Magazine (Han/Paged) rendering in `editor.ts` stays on its own figure/justify typography.

## 2026-04-18

- Adopt `CURRENT_PLAN.md` as the only current execution entry for `MagMark`.
- Keep the repository-specific product or technical direction unchanged during governance bootstrap.
- Use `python3 tools/verify.py` as the canonical verification entrypoint.
