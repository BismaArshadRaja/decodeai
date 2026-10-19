/**
 * Client-side image compression and resizing utility (Pure JavaScript).
 * Downscales images exceeding 1600px dimension and compresses to JPEG ~0.84
 * to ensure rapid uploads (<1-2 MB) with crisp text for OCR.
 */
export async function processAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1600;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original base64
          resolve({
            base64: reader.result,
            mimeType: file.type || 'image/jpeg',
          });
          return;
        }

        // Fill white background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
        resolve({
          base64: compressedDataUrl,
          mimeType: 'image/jpeg',
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
