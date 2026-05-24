'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { filesApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowUp, Check, X, FileText } from 'lucide-react'

interface UploadedFile {
  id: string
  url: string
  originalName: string
  mimeType: string
  size: number
}

interface FilePreviewItem {
  url: string
  name: string
}

interface FileUploaderProps {
  onUpload?: (file: UploadedFile) => void
  onUploadMany?: (files: UploadedFile[]) => void
  onRemove?: () => void
  onRemoveAt?: (index: number) => void
  currentFile?: FilePreviewItem | null
  currentFiles?: FilePreviewItem[]
  accept?: string
  label?: string
  disabled?: boolean
  maxSizeMB?: number
  multiple?: boolean
  maxFiles?: number
}

export default function FileUploader({
  onUpload,
  onUploadMany,
  onRemove,
  onRemoveAt,
  currentFile,
  currentFiles,
  accept = 'image/*,.heic,.heif,.pdf,.doc,.docx,.zip',
  label = 'Fayl yuklash',
  disabled = false,
  maxSizeMB = 5,
  multiple = false,
  maxFiles = 10,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadBatch, setUploadBatch] = useState<{ done: number; total: number } | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const successTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    }
  }, [])

  const previewFiles = useMemo(() => {
    if (multiple) return currentFiles ?? []
    return currentFile ? [currentFile] : []
  }, [multiple, currentFiles, currentFile])

  const canAddMore = !multiple || previewFiles.length < maxFiles

  const uploadSingle = async (f: globalThis.File) => {
    const formData = new FormData()
    formData.append('file', f)
    const res = await filesApi.upload(formData, (progressEvent) => {
      if (!progressEvent.total) return
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      setUploadProgress(Math.min(100, Math.max(0, percent)))
    })
    return res.data as UploadedFile
  }

  const extractErrorMessage = (err: any): string => {
    const rawMessage = err?.response?.data?.message;
    if (Array.isArray(rawMessage)) return rawMessage.join(', ');
    if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) return rawMessage;
    return 'Fayl yuklanmadi';
  }

  const handleFiles = async (files: globalThis.File[]) => {
    if (!files.length) return

    if (multiple && !canAddMore) {
      toast.error(`Maksimal ${maxFiles} ta fayl yuklash mumkin`)
      return
    }

    const remaining = multiple ? Math.max(0, maxFiles - previewFiles.length) : 1
    const selected = files.slice(0, remaining)

    const oversized = selected.find((f) => f.size > maxSizeMB * 1024 * 1024)
    if (oversized) {
      toast.error(`"${oversized.name}" hajmi ${maxSizeMB}MB dan oshmasligi kerak`)
      return
    }

    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    setUploadSuccess(false)
    setUploading(true)
    setUploadProgress(0)
    setUploadBatch({ done: 0, total: selected.length })

    try {
      const uploaded: UploadedFile[] = []
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index]
        const saved = await uploadSingle(file)
        uploaded.push(saved)
        setUploadBatch({ done: index + 1, total: selected.length })
      }

      if (multiple) {
        if (onUploadMany) onUploadMany(uploaded)
        else uploaded.forEach((file) => onUpload?.(file))
      } else if (uploaded[0]) {
        onUpload?.(uploaded[0])
      }

      toast.success(multiple ? `${uploaded.length} ta fayl yuklandi!` : 'Fayl yuklandi!')
      setUploadSuccess(true)
      successTimerRef.current = window.setTimeout(() => {
        setUploadSuccess(false)
      }, 1800)
    } catch (err: any) {
      setUploadSuccess(false)
      toast.error(extractErrorMessage(err))
    } finally {
      setUploadProgress(0)
      setUploadBatch(null)
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) void handleFiles(files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length > 0) void handleFiles(files)
  }

  const openPicker = () => {
    if (disabled || uploading || !canAddMore) return
    inputRef.current?.click()
  }

  const state: 'idle' | 'uploading' | 'success' | 'full' = uploading
    ? 'uploading'
    : uploadSuccess
      ? 'success'
      : !canAddMore
        ? 'full'
        : 'idle'
  const circleProgress = Math.max(8, Math.min(100, uploadProgress))

  const buttonText =
    state === 'uploading'
      ? 'Uploading'
      : state === 'success'
        ? 'Uploaded'
        : 'Upload'

  const helperText =
    state === 'uploading'
      ? `Yuklanmoqda... ${uploadProgress}%${uploadBatch ? ` (${uploadBatch.done}/${uploadBatch.total})` : ''}`
      : state === 'success'
        ? 'Fayl muvaffaqiyatli yuklandi'
        : state === 'full'
          ? `Maksimal ${maxFiles} ta fayl yuklangan`
          : multiple
            ? `Bosing yoki fayllarni bu yerga tashlang (max ${maxFiles} ta)`
            : 'Bosing yoki faylni bu yerga tashlang'

  return (
    <div className="space-y-3">
      {previewFiles.length > 0 && (
        <div className="space-y-2">
          {previewFiles.map((file, index) => (
            <div key={`${file.url}-${index}`} className="flex items-center justify-between rounded-xl border border-[var(--accent-border)] bg-[var(--accent-subtle)] p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{file.name}</p>
                  <button
                    type="button"
                    onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
                    className="text-xs text-[var(--accent)] hover:underline text-left"
                  >
                    Ko&apos;rish / Yuklab olish
                  </button>
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => {
                    if (multiple) onRemoveAt?.(index)
                    else onRemove?.()
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          rounded-2xl p-1 transition-all
          ${dragOver ? 'ring-2 ring-[var(--focus-ring)] bg-[var(--accent-subtle)]' : ''}
          ${disabled ? 'opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled || uploading || !canAddMore}
          multiple={multiple}
        />

        <div className="mx-auto w-full max-w-[560px] md:mx-0">
          <button
            type="button"
            onClick={openPicker}
            aria-label={label}
            disabled={disabled || uploading || !canAddMore}
            className={`
              group relative flex h-[66px] w-full items-center overflow-hidden rounded-full pl-6 pr-[84px] text-left transition-all duration-300
              ${state === 'idle' ? 'bg-gradient-to-r from-[#3464f5] to-[#2d58e4] text-white shadow-[0_8px_18px_rgba(39,83,225,0.28)] hover:from-[#3b6af7] hover:to-[#3260e8]' : ''}
              ${state === 'uploading' ? 'bg-gradient-to-r from-[#315ff1] to-[#2b57e1] text-white shadow-[0_8px_18px_rgba(39,83,225,0.32)]' : ''}
              ${state === 'success' ? 'bg-gradient-to-r from-[#3b67ed] to-[#3161e8] text-white shadow-[0_8px_18px_rgba(46,95,228,0.3)]' : ''}
              ${state === 'full' ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : ''}
              ${(disabled || state === 'full') ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {state === 'uploading' && (
              <span className="upload-pill-shimmer pointer-events-none absolute inset-0" />
            )}

            <span className="block truncate pr-2 text-[17px] font-semibold leading-none tracking-[0.01em] sm:text-[18px]">
              {buttonText}
            </span>
            <span className="sr-only">File upload</span>

            <span
              className={`
                absolute right-1 top-1 bottom-1 flex w-[56px] items-center justify-center overflow-hidden rounded-full
                ${state === 'idle' ? 'bg-[#1f4fde]' : ''}
                ${state === 'uploading' ? 'bg-[#214ddd]' : ''}
                ${state === 'success' ? 'bg-[#4a75e6]' : ''}
                ${state === 'full' ? 'bg-gray-300 dark:bg-gray-600' : ''}
              `}
            >
              {state === 'uploading' && (
                <>
                  <span
                    className="absolute inset-0 transition-transform duration-200"
                    style={{ transform: `translateY(${100 - circleProgress}%)` }}
                  >
                    <span className="upload-liquid-body absolute inset-x-0 bottom-[-2px] h-full" />
                    <span className="upload-liquid-wave absolute -left-[12%] right-[-12%] top-[-8px] h-5 rounded-[40%]" />
                  </span>
                  <span
                    className="absolute inset-x-0 bottom-0 bg-[#95bcff]/26 transition-[height] duration-200"
                    style={{ height: `${circleProgress}%` }}
                  />
                </>
              )}
              {state === 'success' ? (
                <>
                  <span className="upload-success-pop absolute inset-0 rounded-full bg-white/20" />
                  <Check className="relative z-10 h-7 w-7 text-white" />
                </>
              ) : (
                <ArrowUp className={`relative z-10 h-7 w-7 ${state === 'full' ? 'text-gray-500 dark:text-gray-300' : 'text-white'} ${state === 'uploading' ? 'upload-arrow-float' : ''}`} />
              )}
            </span>
          </button>

          <div className="mt-3 px-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
              Rasm, PDF, Word, ZIP — har bir fayl max {maxSizeMB}MB
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
