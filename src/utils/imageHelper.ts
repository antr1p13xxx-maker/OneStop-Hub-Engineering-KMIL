/**
 * Resizes and compresses an uploaded image file so it fits comfortably
 * inside browser localStorage while keeping sharp retina-ready quality.
 */
export async function processLogoImageFile(file: File, maxDimension: number = 256): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File yang dipilih bukan gambar yang valid (PNG, JPG, WebP, GIF, SVG).');
  }

  // Max raw upload guard: 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ukuran file gambar terlalu besar (maksimal 10 MB).');
  }

  // If SVG and reasonably small, read directly as data URL
  if (file.type === 'image/svg+xml' && file.size <= 150 * 1024) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Gagal membaca file SVG.'));
      reader.readAsDataURL(file);
    });
  }

  // Load into Image and downscale via offscreen Canvas
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Gagal memuat pratinjau gambar. Pastikan format file didukung.'));
      image.src = objectUrl;
    });

    let targetWidth = img.naturalWidth || maxDimension;
    let targetHeight = img.naturalHeight || maxDimension;

    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.round((targetHeight / targetWidth) * maxDimension);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth / targetHeight) * maxDimension);
        targetHeight = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, targetWidth);
    canvas.height = Math.max(1, targetHeight);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser tidak mendukung pemrosesan gambar Canvas.');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // WebP keeps transparency and compresses ~3x smaller than PNG
    const webpDataUrl = canvas.toDataURL('image/webp', 0.9);
    if (webpDataUrl.startsWith('data:image/webp')) {
      return webpDataUrl;
    }

    // Fallback to PNG if browser doesn't support WebP encoding
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
