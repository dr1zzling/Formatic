import { useState, useCallback } from "react";

/**
 * Custom hook untuk toast notification.
 * Usage:
 *   const { toast, showToast } = useToast();
 *   ...
 *   showToast("Berhasil disimpan!");
 *   showToast("❌ Gagal menyimpan.");
 *   ...
 *   <Toast message={toast} />
 */
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

  // Tentukan warna background berdasarkan isi pesan
  const isError   = message.startsWith("❌") || message.toLowerCase().includes("gagal");
  const isWarning = message.startsWith("⚠️");

  const bg = isError
    ? "bg-red-600"
    : isWarning
    ? "bg-amber-500"
    : "bg-gray-800";

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${bg} text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 max-w-sm text-center transition-all`}
    >
      {message}
    </div>
  );
}
