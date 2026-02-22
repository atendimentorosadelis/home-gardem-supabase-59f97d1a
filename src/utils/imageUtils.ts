export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export function validateImageDimensions(
  actual: { width: number; height: number },
  expected: { width: number; height: number },
  tolerance: number = 0
): { valid: boolean; message?: string } {
  const widthValid = Math.abs(actual.width - expected.width) <= tolerance;
  const heightValid = Math.abs(actual.height - expected.height) <= tolerance;

  if (widthValid && heightValid) {
    return { valid: true };
  }

  return {
    valid: false,
    message: `Dimensões incorretas: ${actual.width}×${actual.height}px. Esperado: ${expected.width}×${expected.height}px`
  };
}

export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const imgRatio = img.width / img.height;
      const targetRatio = targetWidth / targetHeight;

      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/webp',
        quality
      );

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function convertToWebP(
  file: File,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => { blob ? resolve(blob) : reject(new Error('Failed to create blob')); },
        'image/webp',
        quality
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => { reject(new Error('Failed to load image')); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  });
}
