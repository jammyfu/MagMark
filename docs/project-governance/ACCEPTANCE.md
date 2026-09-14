# ACCEPTANCE.md

## Current Acceptance Gates

- WeChat paste HTML (`renderWechatHtml`) contains no `text-justify` and only `text-align: left|right|center`.
- WeChat standalone images do not use `<figure>` or fixed widths above the ~677px content column.

- Stale local worktree artifacts are removed.
- Governance and loop files exist.
- Verify script can run typecheck and tests when dependencies are present.
