/**
 * Image processing and validation utilities
 * Single source of truth for image handling logic
 */

export interface ImageValidationError {
  type: 'size' | 'dimensions' | 'format' | 'unknown';
  message: string;
  solution: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DIMENSION = 512;
const TARGET_DIMENSION = 512;
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validate image file before processing
 * Throws ImageValidationError if invalid, returns null if valid
 */
export async function validateImage(file: File): Promise<ImageValidationError | null> {
  // Check format
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return {
      type: 'format',
      message: `Invalid format: ${file.type}`,
      solution: 'Please upload a JPEG, PNG, or WebP image'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: 'size',
      message: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      solution: `Please upload an image smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check dimensions
  try {
    const dimensions = await getFileDimensions(file);
    if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
      return {
        type: 'dimensions',
        message: `Image too small: ${dimensions.width}x${dimensions.height}px`,
        solution: `Please upload an image at least ${MIN_DIMENSION}x${MIN_DIMENSION}px`
      };
    }
  } catch {
    return {
      type: 'unknown',
      message: 'Could not read image dimensions',
      solution: 'Please try a different image file'
    };
  }

  return null;
}

/**
 * Get image dimensions from File
 */
export function getFileDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Calculate aspect ratio fit dimensions
 */
export function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
}

/**
 * Convert ImageBitmap to JPEG Blob
 * Removes alpha channel to prevent model issues
 */
export async function bmpToBlob(bmp: ImageBitmap): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Draw with white background to remove alpha channel
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0);

  // Export as JPEG (no alpha) instead of PNG (has alpha)
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, 'image/jpeg', 0.95)
  );
  return blob;
}

/**
 * Process image file: validate, resize, convert to base64
 */
export async function processImageFile(file: File): Promise<string> {
  // Validate
  const validationError = await validateImage(file);
  if (validationError) {
    throw validationError;
  }

  // Get dimensions
  const { width, height } = await getFileDimensions(file);

  // Resize if needed
  const { width: resizeWidth, height: resizeHeight } = calculateAspectRatioFit(
    width,
    height,
    TARGET_DIMENSION,
    TARGET_DIMENSION
  );

  const bmp = await createImageBitmap(file, {
    resizeWidth,
    resizeHeight
  });

  const blob = await bmpToBlob(bmp);
  if (!blob) throw new Error('Failed to create blob');

  // Convert to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert image URL/base64 to downloadable blob
 */
export async function downloadImage(dataUrl: string, filename: string): Promise<void> {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate filename for downloaded image
 */
export function generateImageFilename(hairstyle: string, color: string, shade: string): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitized = `${hairstyle}-${shade}-${color}`.toLowerCase().replace(/\s+/g, '-');
  return `hairdo-${sanitized}-${timestamp}.jpg`;
}
