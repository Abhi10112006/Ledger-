import { L_LOGO_BASE64, L_LOGO_SVG } from './logoData';

let cachedImage: HTMLImageElement | null = null;

/**
 * Returns an HTMLImageElement of the official "L" logo ready for Canvas rendering.
 */
export const getAppLogoImage = async (): Promise<HTMLImageElement | null> => {
  if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0) {
    return cachedImage;
  }

  // 1. Try loading from inline SVG Data URL (Zero network/IO latency, 100% reliable)
  try {
    const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(L_LOGO_SVG)}`;
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = svgDataUri;
    });

    if (img && img.width > 0) {
      cachedImage = img;
      return img;
    }
  } catch {
    // Fall back to PNG base64
  }

  // 2. Try loading from Base64 PNG
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = L_LOGO_BASE64;
    });

    if (img && img.naturalWidth > 0) {
      cachedImage = img;
      return img;
    }
  } catch {
    // Fall back to disk path
  }

  // 3. Fall back to asset path
  const paths = ['/app_logo.png', 'app_logo.png', './app_logo.png'];
  for (const p of paths) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = p;
      });

      if (img && img.naturalWidth > 0) {
        cachedImage = img;
        return img;
      }
    } catch {
      // Continue
    }
  }

  return null;
};

/**
 * Returns Base64 PNG data URL of the official "L" logo for PDF embedding.
 */
export const getAppLogoBase64 = async (): Promise<string> => {
  return L_LOGO_BASE64;
};
