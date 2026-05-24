import { filesApi } from './api'

// Backend chegarasi — `backend/src/files/upload.constants.ts`'dagi qiymat bilan
// bir xil bo'lishi shart. Ozgartirilganda ikkala tarafni ham yangilang.
export const UPLOAD_MAX_SIZE_MB = 10
export const UPLOAD_MAX_SIZE_BYTES = UPLOAD_MAX_SIZE_MB * 1024 * 1024

export const UPLOAD_IMAGE_MIME_PREFIX = 'image/'

export type UploadValidationError =
  | 'too-large'
  | 'not-image'
  | 'empty'

export class FileValidationError extends Error {
  constructor(public readonly kind: UploadValidationError, message: string) {
    super(message)
    this.name = 'FileValidationError'
  }
}

export function assertFileSizeOk(file: File): void {
  if (!file || file.size <= 0) {
    throw new FileValidationError('empty', 'Bo\'sh fayl yuborib bo\'lmaydi')
  }
  if (file.size > UPLOAD_MAX_SIZE_BYTES) {
    throw new FileValidationError(
      'too-large',
      `Fayl hajmi ${UPLOAD_MAX_SIZE_MB}MB dan oshib ketdi (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    )
  }
}

export function assertImageFile(file: File): void {
  if (!file.type.startsWith(UPLOAD_IMAGE_MIME_PREFIX)) {
    throw new FileValidationError('not-image', 'Faqat rasm yuklanadi')
  }
}

/**
 * Centralized image upload — pre-validates size, throws clear errors,
 * returns the uploaded URL.
 */
export async function uploadImage(file: File): Promise<string> {
  assertImageFile(file)
  assertFileSizeOk(file)
  const formData = new FormData()
  formData.append('file', file)
  const response = await filesApi.upload(formData)
  const url = response.data?.url
  if (typeof url !== 'string' || !url) {
    throw new Error('Yuklash javobida URL yo\'q')
  }
  return url
}
