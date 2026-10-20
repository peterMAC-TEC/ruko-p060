// Browser-only: shrink a photo to about 1600px on its long side before upload.

const MAX_SIDE = 1600;

export async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    // Busy receipts can still be large: one more, smaller pass.
    if (blob && blob.size > 1.5 * 1024 * 1024) blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.65));
    return blob ?? file;
  } catch {
    // Formats the browser can't draw (some HEIC photos): send the original.
    return file;
  }
}
