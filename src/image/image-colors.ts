/** Bake appearance into pixels so clipboard and exported files retain it. */
export function isSvgSource(src: string): boolean {
    return /^data:image\/svg\+xml[;,]/i.test(src) || /\.svg(?:[?#]|$)/i.test(src);
}

export async function colorizeImage(src: string, ink: string, background: string): Promise<string> {
    if (!ink && !background) return src;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = src;
    await image.decode();
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 4096 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器无法处理图片颜色');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    if (ink) {
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = ink;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (background) {
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas.toDataURL('image/png');
}

export function contrastingInk(background: string): string {
    const values = background.match(/[\d.]+/g)?.map(Number) || [255, 255, 255];
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722 < 145 ? '#f6f8fa' : '#24352d';
}
