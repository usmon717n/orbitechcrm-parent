export interface ColorTokens {
  '--accent': string
  '--accent-hover': string
  '--accent-active': string
  '--accent-soft': string
  '--accent-light': string
  '--accent-muted': string
  '--accent-subtle': string
  '--accent-border': string
  '--accent-ring': string
  '--accent-glow': string
  '--accent-glow-strong': string
  '--accent-foreground': string
  '--accent-gradient': string
  '--accent-gradient-soft': string
  '--gradient-start': string
  '--gradient-end': string
  '--accent-skeleton': string
  '--selection-bg': string
  '--focus-ring': string
  '--chart-1': string
  '--chart-2': string
  '--chart-3': string
  '--chart-4': string
  '--chart-soft-1': string
  '--chart-soft-2': string
  '--app-bg': string
  '--app-bg-soft': string
  '--app-bg-mist': string
  '--app-bg-wash': string
}

function clamp(val: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val))
}

function wrapHue(h: number) {
  return ((h % 360) + 360) % 360
}

export function normalizeHexColor(value?: string | null) {
  const fallback = DEFAULT_ACCENT
  if (!value) return fallback

  const trimmed = value.trim()
  const match = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return fallback

  const raw = match[1]
  const expanded = raw.length === 3
    ? raw.split('').map((char) => `${char}${char}`).join('')
    : raw

  return `#${expanded.toLowerCase()}`
}

function hexToHsl(hexValue: string): [number, number, number] {
  const hex = normalizeHexColor(hexValue)
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    case b: h = ((r - g) / d + 4) / 6; break
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(wrapHue(h))}, ${Math.round(clamp(s))}%, ${Math.round(clamp(l))}%)`
}

function hsla(h: number, s: number, l: number, a: number) {
  return `hsla(${Math.round(wrapHue(h))}, ${Math.round(clamp(s))}%, ${Math.round(clamp(l))}%, ${a})`
}

function getContrastForeground(h: number, s: number, l: number): string {
  const sl = s / 100
  const ll = l / 100
  const a = sl * Math.min(ll, 1 - ll)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  const brightness = (f(0) * 299 + f(8) * 587 + f(4) * 114) * 255 / 1000
  return brightness < 155 ? '#ffffff' : '#1a1a1a'
}

function createShadeScale(h: number, s: number, l: number) {
  const scale: Record<number, number> = {
    50: 97,
    100: 92,
    200: 84,
    300: 72,
    400: 60,
    500: clamp(l, 38, 58),
    600: clamp(l - 8, 28, 50),
    700: clamp(l - 16, 20, 42),
    800: clamp(l - 24, 14, 34),
    900: clamp(l - 32, 10, 28),
    950: clamp(l - 38, 7, 20),
  }

  return Object.fromEntries(
    Object.entries(scale).map(([shade, lightness]) => [shade, hsl(h, s, lightness)])
  ) as Record<string, string>
}

export function createAccentPalette(hex: string, isDark: boolean): ColorTokens & Record<string, string> {
  const [h, s, rawL] = hexToHsl(hex)
  const l = clamp(rawL, 38, 58)
  const c = clamp

  const shades: Record<string, string> = {}
  const shadeScale = createShadeScale(h, s, l)
  Object.entries(shadeScale).forEach(([shade, color]) => {
    shades[`--color-primary-${shade}`] = color
    shades[`--color-accent-${shade}`] = color
  })

  shades['--shadow-primary'] = hsla(h, s, l, 0.25)
  shades['--shadow-primary-lg'] = hsla(h, s, l, 0.28)
  shades['--shadow-accent'] = hsla(h, s, l, 0.22)

  let tokens: ColorTokens
  if (isDark) {
    const dl = c(l + 8, 35, 72)
    const ds = c(s - 5, 40, 100)
    tokens = {
      '--accent': hsl(h, ds, dl),
      '--accent-hover': hsl(h, ds, c(dl + 8, 0, 88)),
      '--accent-active': hsl(h, ds, c(dl + 16, 0, 94)),
      '--accent-soft': hsla(h, ds, dl, 0.16),
      '--accent-light': hsl(h, c(ds - 15), c(dl + 12, 40, 80)),
      '--accent-muted': hsl(h, c(ds - 30, 10, 60), c(l + 18, 28, 52)),
      '--accent-subtle': hsla(h, ds, dl, 0.12),
      '--accent-border': hsl(h, c(s - 35, 10, 55), 28),
      '--accent-ring': hsla(h, ds, dl, 0.35),
      '--accent-glow': hsla(h, ds, dl, 0.12),
      '--accent-glow-strong': hsla(h, ds, dl, 0.3),
      '--accent-foreground': getContrastForeground(h, ds, dl),
      '--accent-gradient': `linear-gradient(135deg, ${hsl(wrapHue(h - 14), ds, dl)}, ${hsl(wrapHue(h + 18), c(ds - 8), c(dl + 10, 40, 82))})`,
      '--accent-gradient-soft': `linear-gradient(135deg, ${hsla(wrapHue(h - 14), ds, dl, 0.16)}, ${hsla(wrapHue(h + 18), c(ds - 8), c(dl + 10, 40, 82), 0.08)})`,
      '--gradient-start': hsl(wrapHue(h - 15), ds, dl),
      '--gradient-end': hsl(wrapHue(h + 22), c(ds - 8), c(dl + 10, 40, 82)),
      '--accent-skeleton': hsl(h, c(s - 50, 5, 35), 18),
      '--selection-bg': hsla(h, ds, dl, 0.28),
      '--focus-ring': hsla(h, ds, dl, 0.36),
      '--chart-1': hsl(h, ds, dl),
      '--chart-2': hsl(wrapHue(h + 26), c(ds - 10, 38, 92), c(dl + 4, 36, 78)),
      '--chart-3': hsl(wrapHue(h - 22), c(ds - 14, 34, 88), c(dl + 10, 42, 82)),
      '--chart-4': hsl(wrapHue(h + 48), c(ds - 20, 30, 80), c(dl - 2, 34, 70)),
      '--chart-soft-1': hsla(h, ds, dl, 0.18),
      '--chart-soft-2': hsla(wrapHue(h + 26), c(ds - 10, 38, 92), c(dl + 4, 36, 78), 0.14),
      '--app-bg': 'hsl(215, 28%, 7%)',
      '--app-bg-soft': hsl(h, c(ds - 55, 8, 24), 10),
      '--app-bg-mist': hsl(wrapHue(h + 18), c(ds - 58, 8, 22), 8),
      '--app-bg-wash': hsla(h, ds, dl, 0.08),
    }
  } else {
    tokens = {
      '--accent': hsl(h, s, l),
      '--accent-hover': hsl(h, s, c(l - 10)),
      '--accent-active': hsl(h, s, c(l - 18)),
      '--accent-soft': hsla(h, s, l, 0.11),
      '--accent-light': hsl(h, c(s - 15), c(l + 15, 50, 85)),
      '--accent-muted': hsl(h, c(s - 30, 10, 60), c(l + 28, 70, 92)),
      '--accent-subtle': hsla(h, s, l, 0.08),
      '--accent-border': hsl(h, c(s - 20, 10, 60), c(l + 22, 60, 88)),
      '--accent-ring': hsla(h, s, l, 0.25),
      '--accent-glow': hsla(h, s, l, 0.12),
      '--accent-glow-strong': hsla(h, s, l, 0.25),
      '--accent-foreground': getContrastForeground(h, s, l),
      '--accent-gradient': `linear-gradient(135deg, ${hsl(wrapHue(h - 10), s, l)}, ${hsl(wrapHue(h + 20), c(s - 10), c(l + 10, 40, 85))})`,
      '--accent-gradient-soft': `linear-gradient(135deg, ${hsla(wrapHue(h - 10), s, l, 0.12)}, ${hsla(wrapHue(h + 20), c(s - 10), c(l + 10, 40, 85), 0.08)})`,
      '--gradient-start': hsl(wrapHue(h - 10), s, l),
      '--gradient-end': hsl(wrapHue(h + 20), c(s - 10), c(l + 10, 40, 85)),
      '--accent-skeleton': hsl(h, c(s - 50, 5, 35), 93),
      '--selection-bg': hsla(h, s, l, 0.18),
      '--focus-ring': hsla(h, s, l, 0.28),
      '--chart-1': hsl(h, s, l),
      '--chart-2': hsl(wrapHue(h + 24), c(s - 12, 35, 92), c(l + 2, 40, 72)),
      '--chart-3': hsl(wrapHue(h - 24), c(s - 16, 32, 86), c(l + 8, 46, 78)),
      '--chart-4': hsl(wrapHue(h + 46), c(s - 18, 30, 82), c(l - 4, 32, 66)),
      '--chart-soft-1': hsla(h, s, l, 0.12),
      '--chart-soft-2': hsla(wrapHue(h + 24), c(s - 12, 35, 92), c(l + 2, 40, 72), 0.1),
      '--app-bg': hsl(h, c(s - 72, 8, 24), 98),
      '--app-bg-soft': hsl(h, c(s - 62, 10, 32), 96),
      '--app-bg-mist': hsl(wrapHue(h + 24), c(s - 70, 8, 24), 98),
      '--app-bg-wash': hsla(h, s, l, 0.075),
    }
  }

  return { ...tokens, ...shades }
}

export const generateColorTokens = createAccentPalette

export const ACCENT_PRESETS = [
  { id: 'emerald', hex: '#10b981', label: 'Emerald' },
  { id: 'orange',  hex: '#f97316', label: 'Orange'  },
  { id: 'blue',    hex: '#3b82f6', label: 'Blue'    },
  { id: 'purple',  hex: '#8b5cf6', label: 'Purple'  },
  { id: 'rose',    hex: '#f43f5e', label: 'Rose'    },
  { id: 'indigo',  hex: '#6366f1', label: 'Indigo'  },
  { id: 'cyan',    hex: '#06b6d4', label: 'Cyan'    },
] as const

export type AccentPresetId = typeof ACCENT_PRESETS[number]['id']

export const DEFAULT_ACCENT = '#10b981' // Setting emerald as default to match current theme
