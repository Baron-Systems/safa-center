// ضغط الصور في المتصفح قبل رفعها.

/**
 * يصغّر الصورة في المتصفح إلى WebP (عرض أقصاه maxWidth، افتراضياً 1600px) قبل الرفع، ويخفّض الجودة/الأبعاد
 * تدريجياً حتى يصبح الحجم أقل من الحد المسموح — عادةً 150–400KB للصورة.
 */
export async function compressImage(file: File, maxBytes: number, maxWidth = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const attempts: [number, number][] = [
    [maxWidth, 0.8],
    [maxWidth, 0.65],
    [Math.round(maxWidth * 0.8), 0.6],
    [Math.round(maxWidth * 0.64), 0.55],
  ];
  let smallest: Blob | null = null;
  for (const [maxW, quality] of attempts) {
    const scale = Math.min(1, maxW / bmp.width, maxW / bmp.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    // بعض المتصفحات القديمة لا تدعم WebP فتُرجع PNG — لذلك نجرّب JPEG كبديل
    let blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
    if (!blob || blob.type !== "image/webp") blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) continue;
    if (blob.size <= maxBytes / 2) return blob;
    if (!smallest || blob.size < smallest.size) smallest = blob;
  }
  if (smallest && smallest.size <= maxBytes) return smallest;
  throw new Error("الصورة كبيرة جداً حتى بعد الضغط. جرّب صورة أصغر.");
}

/** يرفع صورة مضغوطة ويُرجع رابطها. */
export async function uploadImage(
  file: File,
  maxBytes: number,
  api: <T>(url: string, init?: RequestInit) => Promise<T>,
  maxWidth?: number,
): Promise<string> {
  const blob = await compressImage(file, maxBytes, maxWidth);
  const form = new FormData();
  form.append("file", blob, blob.type === "image/webp" ? "image.webp" : "image.jpg");
  const { url } = await api<{ url: string }>("/api/admin/upload/", { method: "POST", body: form });
  return url;
}
