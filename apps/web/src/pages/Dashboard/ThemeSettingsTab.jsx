import { useState } from "react";
import { validateThemeContrast } from "../../utils/theme";
import { Check, RotateCcw, Eye, Palette } from "lucide-react";
import AlertModal from "../../components/AlertModal";

// ── HSL helpers ──────────────────────────────────────────────────────────────

function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) / 255;
    g = parseInt(clean.slice(2, 4), 16) / 255;
    b = parseInt(clean.slice(4, 6), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120){ r = x; g = c; b = 0; }
  else if (h < 180){ r = 0; g = c; b = x; }
  else if (h < 240){ r = 0; g = x; b = c; }
  else if (h < 300){ r = x; g = 0; b = c; }
  else             { r = c; g = 0; b = x; }
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Dari satu warna utama (hex), generate semua field tema secara otomatis.
 * - Background: warna sangat terang & pudar (lightness ~96%, saturation rendah)
 * - Card: putih atau sedikit tint
 * - Tombol (primary): warna asli / sedikit lebih gelap
 * - Aksen (opsi terpilih): sedikit lebih cerah dari tombol
 * - Teks utama: sangat gelap, hue sama
 * - Teks sekunder: gelap sedang
 * - Border: ringan, hue sama
 */
function generateThemeFromColor(hex) {
  const { h, s } = hexToHsl(hex);

  // Deteksi apakah warna dasar terlalu terang (lightness > 85) — pakai dark mode style
  const baseHsl = hexToHsl(hex);
  const isDark = baseHsl.l < 40;

  const bg           = hslToHex(h, Math.min(s, 30), 96);
  const cardBg       = hslToHex(h, Math.min(s, 10), 99);
  const primaryColor = hslToHex(h, Math.max(s, 55), isDark ? baseHsl.l + 10 : Math.min(baseHsl.l, 42));
  const accentColor  = hslToHex(h, Math.max(s, 60), isDark ? baseHsl.l + 18 : Math.min(baseHsl.l + 8, 52));
  const titleColor   = hslToHex(h, Math.min(s, 45), 16);
  const descColor    = hslToHex(h, Math.min(s, 35), 42);
  const borderCard   = hslToHex(h, Math.min(s, 25), 88);
  const primaryText  = "#ffffff";

  return {
    bg, cardBg, primaryColor, accentColor,
    titleColor, descColor, borderCard, primaryText,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ThemeSettingsTab({ theme, onThemeChange, onResetTheme }) {
  const [alertState, setAlertState] = useState({ open: false, type: "info", title: "", message: "" });

  // Derived "current base color" — pakai primaryColor sebagai representasi warna utama
  const currentBase = theme?.primaryColor || "#1a4fa0";

  /** Satu warna → generate semua field tema sekaligus */
  const handleSingleColorChange = (hex) => {
    const generated = generateThemeFromColor(hex);
    onThemeChange(generated);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-fadeIn">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-[#102f56] flex items-center gap-2.5">
            <Palette size={20} className="text-[#1a4fa0]" /> Pengaturan Tema & Warna Responden
          </h2>
          <p className="text-[13.5px] text-gray-500 mt-1">
            Sesuaikan skema warna formulir yang akan ditampilkan kepada pengisi/responden secara langsung.
          </p>
        </div>
        <button
          onClick={onResetTheme}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-[13px] font-semibold flex items-center gap-2 transition"
          title="Reset ke Tema Standar"
        >
          <RotateCcw size={15} /> Reset ke Default
        </button>
      </div>

      {/* Single Color Picker + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Single Color Picker */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 flex flex-col gap-5">
          <div>
            <h3 className="font-bold text-gray-800 text-[15px]">Warna Kustom</h3>
            <p className="text-[13px] text-gray-400 mt-1">
              Pilih satu warna — background, tombol, dan opsi jawaban otomatis menyesuaikan.
            </p>
          </div>

          {/* Big color wheel picker */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative w-28 h-28 rounded-3xl border-4 border-gray-100 overflow-hidden shadow-lg cursor-pointer"
              style={{ backgroundColor: currentBase }}>
              <input
                type="color"
                value={currentBase}
                onChange={(e) => handleSingleColorChange(e.target.value)}
                className="absolute inset-[-20px] w-[200%] h-[200%] cursor-pointer border-0 opacity-0"
              />
              {/* overlay icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Palette size={32} className="text-white drop-shadow-md opacity-80" />
              </div>
            </div>

            {/* Hex input */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl border border-gray-200 shadow-sm shrink-0"
                style={{ backgroundColor: currentBase }}
              />
              <input
                type="text"
                value={currentBase}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) handleSingleColorChange(v);
                }}
                className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-[14px] font-mono text-gray-700 outline-none focus:border-[#1a4fa0] uppercase text-center tracking-widest"
                maxLength={7}
              />
            </div>

            <p className="text-[12px] text-gray-400 text-center max-w-[200px]">
              Klik kotak warna di atas untuk membuka color picker
            </p>
          </div>

          {/* Mini preview swatches — hasil generate */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[12px] font-semibold text-gray-500 mb-3">Hasil generate otomatis:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Background", color: theme.bg },
                { label: "Tombol", color: theme.primaryColor },
                { label: "Opsi Jawaban", color: theme.accentColor },
                { label: "Kartu", color: theme.cardBg },
                { label: "Teks Utama", color: theme.titleColor },
                { label: "Teks Deskripsi", color: theme.descColor },
              ].map(({ label, color }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div
                    className="w-9 h-9 rounded-xl border border-gray-200 shadow-xs"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10.5px] text-gray-400 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Real-time Live Preview */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-[15px] flex items-center gap-2">
              <Eye size={17} className="text-[#1a4fa0]" /> Pratinjau Langsung (Live Preview)
            </h3>
            <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div
            className="flex-1 rounded-2xl p-5 border shadow-inner transition-colors duration-300 flex flex-col justify-between"
            style={{ backgroundColor: theme.bg || "#f5f9ff", borderColor: theme.borderCard || "#e5eef7" }}
          >
            <div className="space-y-4">
              {/* Header Box */}
              <div
                className="p-4 rounded-xl shadow-xs border transition-all"
                style={{ backgroundColor: theme.cardBg || "#ffffff", borderColor: theme.borderCard || "#e5eef7" }}
              >
                <h4
                  className="font-extrabold text-[16px] leading-tight"
                  style={{ color: theme.titleColor || "#102f56" }}
                >
                  Contoh Formulir Pendaftaran
                </h4>
                <p className="text-[12px] mt-1" style={{ color: theme.descColor || "#64779d" }}>
                  Silakan lengkapi opsi di bawah sesuai dengan pilihan Anda.
                </p>
              </div>

              {/* Question Card Box */}
              <div
                className="p-4 rounded-xl shadow-xs border transition-all space-y-2.5"
                style={{ backgroundColor: theme.cardBg || "#ffffff", borderColor: theme.borderCard || "#e5eef7" }}
              >
                <p className="text-[13.5px] font-bold" style={{ color: theme.titleColor || "#102f56" }}>
                  1. Bagaimana format tema yang Anda sukai?
                </p>

                {/* Option item active */}
                <div
                  className="p-2.5 rounded-xl border flex items-center gap-2.5 transition-all"
                  style={{
                    borderColor: theme.accentColor || "#1a4fa0",
                    backgroundColor: `${theme.accentColor || "#1a4fa0"}18`,
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] shrink-0"
                    style={{ backgroundColor: theme.accentColor || "#1a4fa0" }}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className="text-[12.5px] font-medium" style={{ color: theme.titleColor || "#102f56" }}>
                    Sesuai identitas brand (Terpilih)
                  </span>
                </div>

                {/* Option item inactive */}
                <div
                  className="p-2.5 rounded-xl border border-gray-200 flex items-center gap-2.5"
                  style={{ backgroundColor: theme.cardBg }}
                >
                  <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                  <span className="text-[12.5px]" style={{ color: theme.descColor || "#64779d" }}>
                    Opsi standar default
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Button Preview */}
            <div className="pt-4 mt-4 border-t border-black/5 flex justify-end">
              <button
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md transition-all pointer-events-none"
                style={{ backgroundColor: theme.primaryColor || "#1a4fa0", color: theme.primaryText || "#ffffff" }}
              >
                Kirim Jawaban
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        open={alertState.open}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onConfirm={() => setAlertState({ ...alertState, open: false })}
      />
    </div>
  );
}
