
/**
 * Dynamic Theming System
 * Handles color shade generation and CSS variable application
 */

export interface ThemeColors {
  primary: string;
  accent: string;
}

/**
 * Converts a Hex color to HSL
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(s => s + s).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Converts HSL to Hex
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generates Tailwind-style shades (50-900) from a base color
 */
export function generateShades(hex: string): Record<number, string> {
  const { h, s, l } = hexToHSL(hex);
  
  // Custom lightness scale for Tailwind-like shades
  // 50 is very light, 900 is very dark
  const scales: Record<number, number> = {
    50: 97,
    100: 92,
    200: 84,
    300: 72,
    400: 60,
    500: l, // Base color lightness
    600: Math.max(0, l - 8),
    700: Math.max(0, l - 16),
    800: Math.max(0, l - 24),
    900: Math.max(0, l - 32),
  };

  const shades: Record<number, string> = {};
  Object.entries(scales).forEach(([shade, lightness]) => {
    shades[Number(shade)] = hslToHex(h, s, lightness);
  });

  return shades;
}

/**
 * Applies theme colors to document root
 */
export function applyTheme(colors: ThemeColors) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Primary shades
  const primaryShades = generateShades(colors.primary);
  Object.entries(primaryShades).forEach(([shade, hex]) => {
    root.style.setProperty(`--color-primary-${shade}`, hex);
  });

  // Accent shades
  const accentShades = generateShades(colors.accent);
  Object.entries(accentShades).forEach(([shade, hex]) => {
    root.style.setProperty(`--color-accent-${shade}`, hex);
  });

  // Apply shadows with opacity
  const p = hexToHSL(colors.primary);
  const a = hexToHSL(colors.accent);
  
  root.style.setProperty('--shadow-primary', `rgba(${hexToRgb(colors.primary)}, 0.25)`);
  root.style.setProperty('--shadow-primary-lg', `rgba(${hexToRgb(colors.primary)}, 0.28)`);
  root.style.setProperty('--shadow-accent', `rgba(${hexToRgb(colors.accent)}, 0.22)`);
}

function hexToRgb(hex: string): string {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
