/** Keep Markdown emphasis from rewriting URLs, HTML attributes and code. */
export function protectInlineContent(
    text: string,
    renderCode: (code: string) => string,
    resolveImageSrc: (src: string) => string = src => src,
) {
    const tokens: string[] = [];
    let prefix = '\uE000MM';
    while (text.includes(prefix)) prefix += 'M';
    const protect = (html: string) => `${prefix}${tokens.push(html) - 1}\uE001`;
    const protectedText = text.replace(
        /`([^`]+)`|<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s+(?:[^'">]|"[^"]*"|'[^']*')*)?\s*\/?>/g,
        (match, code: string | undefined) => {
            if (code !== undefined) return protect(renderCode(code));
            if (/^<img\b/i.test(match)) {
                match = match.replace(/(\ssrc\s*=\s*)(["'])(.*?)\2/i,
                    (original, attr, _quote, src) => {
                        const resolved = resolveImageSrc(src);
                        return resolved === src ? original : `${attr}"${resolved.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
                    });
            }
            return protect(match);
        },
    );
    return {
        text: protectedText,
        protect,
        restore: (html: string) => html.replace(new RegExp(`${prefix}(\\d+)\uE001`, 'g'), (_m, index) => tokens[Number(index)]),
    };
}
