// theme.js - Theme utility and contrast checking

export const DEFAULT_THEMES = [
  {
    id: "default",
    name: "Standar Biru",
    bg: "#f5f9ff",
    cardBg: "#ffffff",
    titleColor: "#102f56",
    descColor: "#64779d",
    primaryColor: "#1a4fa0",
    primaryText: "#ffffff",
    accentColor: "#1a4fa0",
    borderCard: "#e5eef7",
  },
  {
    id: "corporate",
    name: "Korporat Elegan",
    bg: "#f8fafc",
    cardBg: "#ffffff",
    titleColor: "#0f172a",
    descColor: "#475569",
    primaryColor: "#0f172a",
    primaryText: "#ffffff",
    accentColor: "#334155",
    borderCard: "#e2e8f0",
  },
  {
    id: "emerald",
    name: "Ceria Emerald",
    bg: "#f0fdf4",
    cardBg: "#ffffff",
    titleColor: "#064e3b",
    descColor: "#047857",
    primaryColor: "#059669",
    primaryText: "#ffffff",
    accentColor: "#10b981",
    borderCard: "#d1fae5",
  },
  {
    id: "violet",
    name: "Modern Violet",
    bg: "#faf5ff",
    cardBg: "#ffffff",
    titleColor: "#3b0764",
    descColor: "#6b21a8",
    primaryColor: "#7c3aed",
    primaryText: "#ffffff",
    accentColor: "#9333ea",
    borderCard: "#f3e8ff",
  },
  {
    id: "warm",
    name: "Hangat Sunset",
    bg: "#fff7ed",
    cardBg: "#ffffff",
    titleColor: "#7c2d12",
    descColor: "#9a3412",
    primaryColor: "#ea580c",
    primaryText: "#ffffff",
    accentColor: "#f97316",
    borderCard: "#ffedd5",
  },
  {
    id: "dark",
    name: "Gelap Modern",
    bg: "#0f172a",
    cardBg: "#1e293b",
    titleColor: "#f8fafc",
    descColor: "#94a3b8",
    primaryColor: "#3b82f6",
    primaryText: "#ffffff",
    accentColor: "#60a5fa",
    borderCard: "#334155",
  },
];

export const DEFAULT_FORM_THEME = DEFAULT_THEMES[0];

/**
 * Convert Hex to RGB
 */
export function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) return { r: 0, g: 0, b: 0 };
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculate relative luminance
 */
export function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG Contrast Ratio between two HEX colors
 */
export function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check contrast warnings for theme
 * Returns list of warnings if contrast ratio < 4.5:1 (or 3:1 for large text)
 */
export function validateThemeContrast(theme) {
  const warnings = [];

  if (!theme) return warnings;

  // Title on Card
  const titleRatio = getContrastRatio(theme.titleColor, theme.cardBg);
  if (titleRatio < 3.0) {
    warnings.push({
      element: "Judul vs Kartu",
      ratio: titleRatio.toFixed(2),
      message: `Kontras warna judul (${theme.titleColor}) pada latar kartu (${theme.cardBg}) terlalu rendah (${titleRatio.toFixed(1)}:1). Disarankan minimal 3:1 agar nyaman dibaca.`,
    });
  }

  // Description on Card
  const descRatio = getContrastRatio(theme.descColor, theme.cardBg);
  if (descRatio < 4.5) {
    warnings.push({
      element: "Teks Deskripsi vs Kartu",
      ratio: descRatio.toFixed(2),
      message: `Kontras teks deskripsi (${theme.descColor}) pada latar kartu (${theme.cardBg}) terlalu rendah (${descRatio.toFixed(1)}:1). Disarankan minimal 4.5:1.`,
    });
  }

  // Primary Button Text on Primary Button
  const btnRatio = getContrastRatio(theme.primaryText, theme.primaryColor);
  if (btnRatio < 3.5) {
    warnings.push({
      element: "Teks Tombol vs Tombol Utama",
      ratio: btnRatio.toFixed(2),
      message: `Kontras teks tombol (${theme.primaryText}) pada warna tombol (${theme.primaryColor}) terlalu rendah (${btnRatio.toFixed(1)}:1). Disarankan minimal 4.5:1.`,
    });
  }

  return warnings;
}

/**
 * Theme storage helpers
 */
export function getStoredTheme(slug) {
  if (!slug) return null;
  try {
    const raw = localStorage.getItem(`form_theme_${slug}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredTheme(slug, theme) {
  if (!slug || !theme) return;
  try {
    localStorage.setItem(`form_theme_${slug}`, JSON.stringify(theme));
    // Also trigger custom storage event for immediate reactivity across tabs/components
    window.dispatchEvent(new CustomEvent("form_theme_updated", { detail: { slug, theme } }));
  } catch (e) {
    console.error("Failed to save theme:", e);
  }
}

export function removeStoredTheme(slug) {
  if (!slug) return;
  try {
    localStorage.removeItem(`form_theme_${slug}`);
    window.dispatchEvent(new CustomEvent("form_theme_updated", { detail: { slug, theme: DEFAULT_FORM_THEME } }));
  } catch {}
}
