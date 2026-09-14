/**
 * Keep Markdown formatting from rewriting HTML attributes and code spans.
 * This is a token guard, NOT an HTML sanitizer. Callers still need a trust policy.
 */
export function protectInlineContent(
    text: string,
    renderCode: (code: string) => string,
    resolveImageSrc: (src: string) => string = src => src,
) {
    const tokens: string[] = [];
    let prefix = '\uE000MM';
    while (text.includes(prefix)) prefix += 'M';
    const protect = (html: string) => `${prefix}${tokens.push(html) - 1}\uE001`;

    // Index whole backtick runs once. A closing run must have exactly the
    // opener's length; backslashes inside a code span do not escape its ticks.
    const runsByLength = new Map<number, number[]>();
    for (const match of text.matchAll(/`+/g)) {
        const length = match[0].length;
        const positions = runsByLength.get(length) ?? [];
        positions.push(match.index!);
        runsByLength.set(length, positions);
    }
    const findClosingRun = (length: number, start: number): number => {
        const positions = runsByLength.get(length) ?? [];
        let low = 0;
        let high = positions.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (positions[mid] < start) low = mid + 1;
            else high = mid;
        }
        return positions[low] ?? -1;
    };

    // Escapes and raw HTML are opaque. An opener before HTML takes precedence:
    // ` <img src="x"> ` is code, not an image that should be resolved.
    const matcher = /\\[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]|`+|<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s+(?:[^'">]|"[^"]*"|'[^']*')*)?\s*\/?>/g;
    const parts: string[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(text)) !== null) {
        parts.push(text.slice(cursor, match.index));
        let token = match[0];
        if (token.startsWith('\\')) {
            // Keep an escaped delimiter out of downstream regex formatting.
            const literal = token.slice(1)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            parts.push(protect(literal));
        } else if (token.startsWith('`')) {
            const end = findClosingRun(token.length, matcher.lastIndex);
            if (end === -1) {
                // Do not let a later regex reinterpret a shorter part of this run.
                parts.push(protect(token));
            } else {
                let code = text.slice(matcher.lastIndex, end).replace(/\r\n?|\n/g, ' ');
                // CommonMark: remove ONE edge space only when both are present
                // and the span is not made entirely of ASCII spaces.
                if (code.startsWith(' ') && code.endsWith(' ') && /[^ ]/.test(code)) {
                    code = code.slice(1, -1);
                }
                parts.push(protect(renderCode(code)));
                matcher.lastIndex = end + token.length;
            }
        } else {
            if (/^<img\b/i.test(token)) {
                token = token.replace(/(\ssrc\s*=\s*)(["'])(.*?)\2/i,
                    (original, attr: string, _quote: string, src: string) => {
                        const resolved = resolveImageSrc(src);
                        return resolved === src ? original : `${attr}"${resolved.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
                    });
            }
            parts.push(protect(token));
        }
        cursor = matcher.lastIndex;
    }
    parts.push(text.slice(cursor));
    return {
        text: parts.join(''),
        protect,
        restore: (html: string) => {
            const pattern = new RegExp(`${prefix}(\\d+)\uE001`, 'g');
            // A later protected link/image can contain an earlier escaped/code
            // token. Expand in creation order, without recursion or cycles.
            const restored: string[] = [];
            for (const token of tokens) {
                restored.push(token.replace(pattern,
                    (original, index: string) => restored[Number(index)] ?? original));
            }
            return html.replace(pattern,
                (original, index: string) => restored[Number(index)] ?? original);
        },
    };
}
