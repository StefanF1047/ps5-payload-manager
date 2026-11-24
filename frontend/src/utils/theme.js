export const THEME_STORAGE_KEY = 'ps5pm.theme'
export const ACCENT_STORAGE_KEY = 'ps5pm.accent'

export const THEMES = ['light', 'dark']

// `swatch` is the saturated fill used on buttons; `swatchDark` is the
// readable text tint used when the dark theme is active.
export const ACCENTS = [
  { id: 'violet', labelKey: 'settings.accent_violet', swatch: '#7c3aed', swatchDark: '#c4b5fd' },
  { id: 'blue', labelKey: 'settings.accent_blue', swatch: '#2563eb', swatchDark: '#93c5fd' },
  { id: 'teal', labelKey: 'settings.accent_teal', swatch: '#0f766e', swatchDark: '#5eead4' },
  { id: 'emerald', labelKey: 'settings.accent_emerald', swatch: '#047857', swatchDark: '#6ee7b7' },
  { id: 'amber', labelKey: 'settings.accent_amber', swatch: '#d97706', swatchDark: '#fcd34d' },
  { id: 'rose', labelKey: 'settings.accent_rose', swatch: '#e11d48', swatchDark: '#fda4af' },
  { id: 'red', labelKey: 'settings.accent_red', swatch: '#dc2626', swatchDark: '#fca5a5' },
]

export const DEFAULT_THEME = 'light'
export const DEFAULT_ACCENT = 'violet'

const storage = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export const normalizeTheme = value => (THEMES.includes(value) ? value : DEFAULT_THEME)

export const normalizeAccent = value => (
  ACCENTS.some(accent => accent.id === value) ? value : DEFAULT_ACCENT
)

export const getStoredTheme = () => {
  try {
    return normalizeTheme(storage()?.getItem(THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_THEME
  }
}

export const getStoredAccent = () => {
  try {
    return normalizeAccent(storage()?.getItem(ACCENT_STORAGE_KEY))
  } catch {
    return DEFAULT_ACCENT
  }
}

export const getStoredAppearance = () => ({
  theme: getStoredTheme(),
  accent: getStoredAccent(),
})

// Applies attributes before React exists (also used by the inline bootstrap)
// and keeps the browser chrome colour in sync.
export const applyAppearance = (theme = getStoredTheme(), accent = getStoredAccent()) => {
  const next = {
    theme: normalizeTheme(theme),
    accent: normalizeAccent(accent),
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    const root = document.documentElement
    root.setAttribute('data-theme', next.theme)
    root.setAttribute('data-accent', next.accent)
    root.style.colorScheme = next.theme

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', next.theme === 'dark' ? '#090e18' : '#e9effa')
    }
  }

  return next
}

export const saveAppearance = (theme, accent) => {
  const next = {
    theme: normalizeTheme(theme),
    accent: normalizeAccent(accent),
  }

  try {
    const store = storage()
    store?.setItem(THEME_STORAGE_KEY, next.theme)
    store?.setItem(ACCENT_STORAGE_KEY, next.accent)
  } catch {
    // Storage can be unavailable in private/locked-down browsing.
  }

  return applyAppearance(next.theme, next.accent)
}
