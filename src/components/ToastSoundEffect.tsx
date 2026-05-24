'use client'

import { useEffect, useRef } from 'react'
import { useToasterStore } from 'react-hot-toast'

const MIN_SOUND_INTERVAL_MS = 350
type SoundKind = 'success' | 'error' | 'default'

export default function ToastSoundEffect() {
  const { toasts } = useToasterStore()
  const seenToastIdsRef = useRef<Set<string>>(new Set())
  const lastPlayedAtRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioUnlockedRef = useRef(false)

  const getAudioContext = (createIfNeeded = false) => {
    if (typeof window === 'undefined') return null
    if (audioContextRef.current) return audioContextRef.current
    if (!createIfNeeded) return null

    const AudioContextClass =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) return null

    audioContextRef.current = new AudioContextClass()
    return audioContextRef.current
  }

  const playToastSound = (kind: SoundKind) => {
    const now = Date.now()
    if (now - lastPlayedAtRef.current < MIN_SOUND_INTERVAL_MS) return

    if (!audioUnlockedRef.current) return
    const context = getAudioContext(false)
    if (!context || context.state !== 'running') return

    const startAt = context.currentTime + 0.005
    const scheduleNote = (
      offset: number,
      frequency: number,
      duration: number,
      peakGain: number,
      oscillatorType: OscillatorType = 'sine',
    ) => {
      const noteStart = startAt + offset
      const noteEnd = noteStart + duration

      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = oscillatorType
      oscillator.frequency.setValueAtTime(frequency, noteStart)

      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(peakGain, noteStart + 0.016)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(noteStart)
      oscillator.stop(noteEnd)
    }

    if (kind === 'error') {
      // Error: short descending alert-like tone
      scheduleNote(0, 622.25, 0.15, 0.05, 'triangle')
      scheduleNote(0.08, 440, 0.18, 0.055, 'triangle')
    } else if (kind === 'success') {
      // Success: soft iOS-like ascending tri-tone
      scheduleNote(0, 783.99, 0.14, 0.038)
      scheduleNote(0.07, 987.77, 0.14, 0.038)
      scheduleNote(0.14, 1174.66, 0.14, 0.038)
    } else {
      // Default/other toasts: tiny neutral tick
      scheduleNote(0, 740, 0.1, 0.024)
    }

    lastPlayedAtRef.current = now
  }

  useEffect(() => {
    const unlockAudio = () => {
      audioUnlockedRef.current = true
      const context = getAudioContext(true)
      if (!context) return
      if (context.state !== 'running') {
        context.resume().catch(() => {})
      }
    }

    window.addEventListener('pointerdown', unlockAudio, { passive: true })
    window.addEventListener('keydown', unlockAudio)

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  useEffect(() => {
    const visibleToastIds = new Set<string>()
    const newlyVisibleTypes: string[] = []

    for (const toast of toasts) {
      if (!toast.visible) continue
      visibleToastIds.add(toast.id)
      if (!seenToastIdsRef.current.has(toast.id)) {
        seenToastIdsRef.current.add(toast.id)
        newlyVisibleTypes.push(toast.type || 'blank')
      }
    }

    seenToastIdsRef.current.forEach((id) => {
      if (!visibleToastIds.has(id)) {
        seenToastIdsRef.current.delete(id)
      }
    })

    if (newlyVisibleTypes.length > 0) {
      const hasError = newlyVisibleTypes.includes('error')
      const hasSuccess = newlyVisibleTypes.includes('success')
      const soundKind: SoundKind = hasError ? 'error' : hasSuccess ? 'success' : 'default'
      playToastSound(soundKind)
    }
  }, [toasts])

  return null
}
