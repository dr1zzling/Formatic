import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

/**
 * Custom hook untuk toast notification.
 * Usage:
 *   const { toast, showToast } = useToast();
 *   ...
 *   showToast("Berhasil disimpan!");
 *   showToast("Gagal menyimpan.");
 *   ...
 *   <Toast message={toast} />
 * */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), duration);
  }, [duration]);

  return { toast, showToast };
}

/**
 * Toast component — letakkan di dalam return() komponen.
 * Otomatis muncul/hilang berdasarkan prop `message`.
 */
export default function Toast({ message }) {
  if (!message) return null;

  // Strip legacy emoji prefix supaya pesan lama tetap tampil bersih
  const clean = String(message).replace(/^[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u2B00-\u2BFF\uFE00-\uFE0F\u200D\s]+/u, "").trim() || String(message);
  // Tentukan warna background berdasarkan isi pesan
  const isError   = /^(❌|⛔)/.test(String(message)) || clean.toLowerCase().includes("gagal");
  const isWarning = /^⚠️/.test(String(message)) || /sudah ada/i.test(clean);
  const isSuccess = /^(✅|✔|🎉)/.test(String(message)) || /berhasil|tersimpan|ditambahkan/i.test(clean);

  const Icon = isError ? XCircle : isWarning ? AlertTriangle : CheckCircle2;

  const bg = isError
    ? "bg-red-600"
    : isWarning
    ? "bg-amber-500"
    : "bg-gray-800";

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${bg} text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 max-w-sm text-center transition-all flex items-center gap-2 justify-center`}
    >
      <Icon size={16} className="shrink-0" />
      <span>{clean}</span>
    </div>
  );
}
