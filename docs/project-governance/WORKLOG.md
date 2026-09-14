# WORKLOG.md

## 2026-09-14

- Fixed WeChat Official Account paste HTML so 内容结构检测 stops flagging long articles.
- Removed `text-align:justify` / `text-justify` from WeChat themes (editor #2.6 / spec #1.6).
- Replaced `<figure>` + `margin:auto` image blocks with a single `text-align:center` paragraph + `max-width:100%` img (spec #1.4).
- Added `sanitizeWechatPasteHtml` on `renderWechatHtml` / `copyWechatHtml` and unit tests in `tests/wechat-paste-html.test.ts`.
- Magazine Han/Paged preview path was left unchanged.

## 2026-04-18

- Bootstrapped the repository into the `continuous-project-loop` structure.
- Added durable planning files, governance logs, and a repo-level verification entry.
- Standardized the README entry section and automation guidance for `MagMark`.
