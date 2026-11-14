import sharp from "sharp";

/** Loads a local image as a PNG data URL. Rejects unreadable or unsupported images. */
export const loadAvatar = async (path: string) => {
  const image = await sharp(path).rotate().png().toBuffer();
  return `data:image/png;base64,${image.toString("base64")}`;
};
