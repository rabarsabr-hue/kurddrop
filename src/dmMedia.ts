/**
 * پەستاندنی وێنە/ڤیدیۆ بۆ نامەی تایبەت
 * ئامانج: کوالێتی نزیک لە واتساپ + ناردنی خێرا (یەک encodeی باش، بێ پەستانی زۆر).
 */

/** ئامانجی قەبارە — ~١MB وەک فۆتۆی چات */
const DM_IMAGE_MAX_BYTES = 1024 * 1024
/** سنووری سەخت — ئەگەر پێویست بوو کەمێک گەورەتر */
const DM_IMAGE_HARD_MAX_BYTES = 1536 * 1024
/** درێژترین لایەن — ڕوون و گونجاو بۆ مۆبایل */
const DM_IMAGE_MAX_SIDE = 1600
/** کوالێتی سەرەکی JPEG */
const DM_IMAGE_QUALITY = 0.84
const DM_VIDEO_MAX_BYTES = 5 * 1024 * 1024

export { DM_IMAGE_MAX_BYTES, DM_VIDEO_MAX_BYTES, DM_IMAGE_HARD_MAX_BYTES, DM_IMAGE_MAX_SIDE }

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const name = (file.name || '').toLowerCase()
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(name)
}

function fitMaxSide(width: number, height: number, maxSide: number): { w: number; h: number } {
  const m = Math.max(width, height)
  if (m <= maxSide) return { w: Math.max(1, width), h: Math.max(1, height) }
  const scale = maxSide / m
  return {
    w: Math.max(1, Math.round(width * scale)),
    h: Math.max(1, Math.round(height * scale)),
  }
}

/** خوێندنەوەی قەبارە لە سەری JPEG بێ decodeی تەواو */
function jpegSizeFromHeader(buf: ArrayBuffer): { w: number; h: number } | null {
  const u8 = new Uint8Array(buf)
  if (u8.length < 4 || u8[0] !== 0xff || u8[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < u8.length) {
    if (u8[i] !== 0xff) { i += 1; continue }
    const marker = u8[i + 1]
    if (marker === 0xd9 || marker === 0xda) break
    const len = (u8[i + 2] << 8) | u8[i + 3]
    if (len < 2) break
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    if (isSof && i + 8 < u8.length) {
      const h = (u8[i + 5] << 8) | u8[i + 6]
      const w = (u8[i + 7] << 8) | u8[i + 8]
      if (w > 0 && h > 0) return { w, h }
    }
    i += 2 + len
  }
  return null
}

async function probeImageSize(file: File): Promise<{ w: number; h: number } | null> {
  try {
    if (file.type === 'image/jpeg' || file.type === 'image/jpg' || /\.jpe?g$/i.test(file.name || '')) {
      const head = await file.slice(0, Math.min(file.size, 128 * 1024)).arrayBuffer()
      const jpeg = jpegSizeFromHeader(head)
      if (jpeg) return jpeg
    }
  } catch { /* ignore */ }
  return null
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => { if (b && b.size > 0) resolve(b); else reject(new Error('blob')) },
      'image/jpeg',
      quality,
    )
  })
}

type ImageSource = {
  width: number
  height: number
  drawable: CanvasImageSource
  close?: () => void
}

async function loadImageSource(file: File): Promise<ImageSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        width: bitmap.width,
        height: bitmap.height,
        drawable: bitmap,
        close: () => { try { bitmap.close() } catch { /* ignore */ } },
      }
    } catch { /* fallback */ }
  }

  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    drawable: img,
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('img'))
    img.src = src
  })
}

async function decodeAndResize(
  file: File,
  maxSide: number,
): Promise<{ drawable: CanvasImageSource; width: number; height: number; close: () => void }> {
  const probed = await probeImageSize(file)

  if (typeof createImageBitmap === 'function') {
    try {
      if (probed) {
        const fit = fitMaxSide(probed.w, probed.h, maxSide)
        // resize لە کاتی decode — خێراتر + کوالێتی بەرز
        const bitmap = await createImageBitmap(file, {
          resizeWidth: fit.w,
          resizeHeight: fit.h,
          resizeQuality: 'high',
        })
        return {
          drawable: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          close: () => { try { bitmap.close() } catch { /* ignore */ } },
        }
      }

      const full = await createImageBitmap(file)
      const fit = fitMaxSide(full.width, full.height, maxSide)
      if (fit.w === full.width && fit.h === full.height) {
        return {
          drawable: full,
          width: full.width,
          height: full.height,
          close: () => { try { full.close() } catch { /* ignore */ } },
        }
      }
      try {
        const resized = await createImageBitmap(full, {
          resizeWidth: fit.w,
          resizeHeight: fit.h,
          resizeQuality: 'high',
        })
        try { full.close() } catch { /* ignore */ }
        return {
          drawable: resized,
          width: resized.width,
          height: resized.height,
          close: () => { try { resized.close() } catch { /* ignore */ } },
        }
      } catch {
        return {
          drawable: full,
          width: fit.w,
          height: fit.h,
          close: () => { try { full.close() } catch { /* ignore */ } },
        }
      }
    } catch { /* fallback below */ }
  }

  const source = await loadImageSource(file)
  const fit = fitMaxSide(source.width, source.height, maxSide)
  return {
    drawable: source.drawable,
    width: fit.w,
    height: fit.h,
    close: () => { source.close?.() },
  }
}

/**
 * پەستاندنی وێنە بۆ DM — کوالێتی بەرز، زۆرینە یەک encode.
 * onProgress: 0–100
 */
export async function compressImageToMaxBytes(
  file: File,
  maxBytes = DM_IMAGE_MAX_BYTES,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  if (!isLikelyImageFile(file) && file.type && !file.type.startsWith('image/')) {
    throw new Error('تکایە تەنها فایلی وێنە هەڵبژێرە')
  }

  onProgress?.(8)
  const type = (file.type || '').toLowerCase()

  // GIF بچووک — وەک خۆی (ئەنیمەیشن بمێنێتەوە)
  if ((type === 'image/gif' || /\.gif$/i.test(file.name || '')) && file.size <= maxBytes) {
    onProgress?.(100)
    return file
  }

  // JPEG/WebP ئامادە — ئەگەر قەبارە و لایەن گونجاو بن، بێ encodeی دووبارە
  if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/webp') {
    if (file.size <= maxBytes) {
      const probed = await probeImageSize(file)
      if (!probed || Math.max(probed.w, probed.h) <= DM_IMAGE_MAX_SIDE) {
        onProgress?.(100)
        return file
      }
    }
  }

  onProgress?.(20)
  const decoded = await decodeAndResize(file, DM_IMAGE_MAX_SIDE)
  onProgress?.(45)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) {
    decoded.close()
    throw new Error('canvas')
  }

  let best: Blob | null = null

  try {
    const attempts: Array<{ q: number; scale: number }> = [
      { q: DM_IMAGE_QUALITY, scale: 1 },
      { q: 0.78, scale: 1 },
      { q: 0.72, scale: 0.82 },
    ]

    for (let i = 0; i < attempts.length; i++) {
      const { q, scale } = attempts[i]!
      const width = Math.max(1, Math.round(decoded.width * scale))
      const height = Math.max(1, Math.round(decoded.height * scale))

      canvas.width = width
      canvas.height = height
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, width, height)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(decoded.drawable, 0, 0, width, height)

      const blob = await canvasToJpegBlob(canvas, q)
      onProgress?.(55 + Math.round(((i + 1) / attempts.length) * 40))
      if (!best || blob.size < best.size) best = blob
      if (blob.size <= maxBytes) {
        onProgress?.(100)
        return blob
      }
    }
  } finally {
    decoded.close()
  }

  const out = best
  if (!out || out.size === 0) throw new Error('وێنەکە نەتوانرا ئامادە بکرێت')
  if (out.size > DM_IMAGE_HARD_MAX_BYTES) {
    throw new Error('وێنەکە زۆر گەورەیە — وێنەیەکی تر هەڵبژێرە')
  }
  onProgress?.(100)
  return out
}

/** ڤیدیۆ — سنووری قەبارە */
export async function prepareDmVideoFile(file: File, maxBytes = DM_VIDEO_MAX_BYTES): Promise<File> {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name || '')
  if (!isVideo) throw new Error('تکایە فایلی ڤیدیۆ هەڵبژێرە')
  if (file.size > maxBytes) {
    throw new Error(`ڤیدیۆکە زۆر گەورەیە — زۆرترین ${Math.round(maxBytes / (1024 * 1024))} مێگابایت`)
  }
  return file
}

export { isLikelyImageFile }
