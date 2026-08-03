/** پەستاندنی خێرای وێنە/ڤیدیۆ بۆ نامەی تایبەت — کەم هەوڵ، بارکردنی خێرا */

const DM_IMAGE_MAX_BYTES = 72 * 1024 // ~72KB — خێرا + قەبارەی گونجاو
const DM_IMAGE_HARD_MAX_BYTES = 160 * 1024
const DM_IMAGE_MAX_SIDE = 560
const DM_VIDEO_MAX_BYTES = 5 * 1024 * 1024 // 5MB

export { DM_IMAGE_MAX_BYTES, DM_VIDEO_MAX_BYTES, DM_IMAGE_HARD_MAX_BYTES }

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const name = (file.name || '').toLowerCase()
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(name)
}

function yieldToUi(): Promise<void> {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
    } else {
      setTimeout(resolve, 0)
    }
  })
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
    // SOF0–SOF3, SOF5–SOF7, SOF9–SOF11, SOF13–SOF15
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

/**
 * پەستاندنی خێرا — زۆرینە ١–٢ encode، resize لە کاتی decode.
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

  onProgress?.(6)
  await yieldToUi()

  const type = (file.type || '').toLowerCase()
  if ((type === 'image/jpeg' || type === 'image/jpg' || type === 'image/webp') && file.size <= maxBytes) {
    onProgress?.(100)
    return file
  }

  onProgress?.(12)
  const probed = await probeImageSize(file)
  onProgress?.(18)
  await yieldToUi()

  let bitmap: ImageBitmap | null = null
  let width = 0
  let height = 0

  try {
    if (typeof createImageBitmap === 'function') {
      if (probed) {
        const fit = fitMaxSide(probed.w, probed.h, DM_IMAGE_MAX_SIDE)
        width = fit.w
        height = fit.h
        try {
          bitmap = await createImageBitmap(file, {
            resizeWidth: width,
            resizeHeight: height,
            resizeQuality: 'low',
          })
          width = bitmap.width
          height = bitmap.height
        } catch {
          bitmap = await createImageBitmap(file)
          const fit2 = fitMaxSide(bitmap.width, bitmap.height, DM_IMAGE_MAX_SIDE)
          if (fit2.w !== bitmap.width || fit2.h !== bitmap.height) {
            const resized = await createImageBitmap(bitmap, {
              resizeWidth: fit2.w,
              resizeHeight: fit2.h,
              resizeQuality: 'low',
            })
            try { bitmap.close() } catch { /* ignore */ }
            bitmap = resized
          }
          width = bitmap.width
          height = bitmap.height
        }
      } else {
        bitmap = await createImageBitmap(file)
        const fit = fitMaxSide(bitmap.width, bitmap.height, DM_IMAGE_MAX_SIDE)
        if (fit.w !== bitmap.width || fit.h !== bitmap.height) {
          try {
            const resized = await createImageBitmap(bitmap, {
              resizeWidth: fit.w,
              resizeHeight: fit.h,
              resizeQuality: 'low',
            })
            try { bitmap.close() } catch { /* ignore */ }
            bitmap = resized
          } catch {
            width = fit.w
            height = fit.h
          }
        }
        width = bitmap.width
        height = bitmap.height
      }
    }
  } catch {
    bitmap = null
  }

  onProgress?.(40)
  await yieldToUi()

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
  if (!ctx) {
    try { bitmap?.close() } catch { /* ignore */ }
    throw new Error('canvas')
  }

  let drawable: CanvasImageSource
  let closeExtra: (() => void) | undefined

  if (bitmap) {
    drawable = bitmap
    closeExtra = () => { try { bitmap?.close() } catch { /* ignore */ } }
  } else {
    const source = await loadImageSource(file)
    const fit = fitMaxSide(source.width, source.height, DM_IMAGE_MAX_SIDE)
    width = fit.w
    height = fit.h
    drawable = source.drawable
    closeExtra = source.close
  }

  let quality = 0.5
  let blob: Blob | null = null
  let best: Blob | null = null

  try {
    // زۆرینە ٢ هەوڵ — خێرا
    for (let attempt = 0; attempt < 2; attempt++) {
      canvas.width = width
      canvas.height = height
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(drawable, 0, 0, width, height)
      blob = await canvasToJpegBlob(canvas, quality)
      onProgress?.(55 + attempt * 20)
      await yieldToUi()
      if (!best || blob.size < best.size) best = blob
      if (blob.size <= maxBytes) {
        onProgress?.(100)
        return blob
      }
      // دووەم هەوڵ: بچووکتر + کوالێتی کەمتر
      width = Math.max(200, Math.round(width * 0.72))
      height = Math.max(200, Math.round(height * 0.72))
      quality = 0.38
    }
  } finally {
    closeExtra?.()
  }

  const out = (best && best.size <= DM_IMAGE_HARD_MAX_BYTES ? best : blob) || best
  if (!out || out.size === 0) throw new Error('وێنەکە نەتوانرا بچووک بکرێتەوە')
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
  return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, drawable: img }
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

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => { if (b && b.size > 0) resolve(b); else reject(new Error('blob')) },
      'image/jpeg',
      quality,
    )
  })
}

export { isLikelyImageFile }
