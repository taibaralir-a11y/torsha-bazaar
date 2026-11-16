/**
 * Compresses a customer-selected image file client-side into a compact JPEG data URL
 * suitable for storing within Firestore document size limits without paid Cloud Storage.
 */
export async function compressImageFileToDataUrl(
  file: File,
  maxDimension = 720,
  quality = 0.65
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file (JPG, PNG, or WebP).');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image is too large (max 10 MB before compression).');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read selected image.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Invalid or unsupported image file.'));
    image.src = rawDataUrl;
  });

  const scale = Math.min(1, maxDimension / Math.max(img.width || 1, img.height || 1));
  const targetWidth = Math.max(1, Math.round(img.width * scale));
  const targetHeight = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return rawDataUrl;
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const compressed = canvas.toDataURL('image/jpeg', quality);
  if (compressed.length > 350_000) {
    return canvas.toDataURL('image/jpeg', 0.45);
  }
  return compressed;
}
