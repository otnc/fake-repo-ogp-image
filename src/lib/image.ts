// アップロード画像 (data URL) を共有 URL に載せられるよう小さく圧縮する。
// 透過は背景色で塗りつぶしてカードに馴染ませ、JPEG で軽くする。クライアント専用。
export function shrinkForShare(src: string, bg: string, max = 120): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const outSize = Math.max(1, Math.min(side, max));
      const canvas = document.createElement("canvas");
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unavailable"));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, outSize, outSize);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}
