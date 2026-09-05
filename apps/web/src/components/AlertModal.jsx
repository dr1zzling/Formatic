import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * AlertModal — pengganti alert() dan confirm() browser
 *
 * Usage:
 *   <AlertModal
 *     open={bool}
 *     type="alert" | "info" | "confirm" | "success" | "error" | "warning" | "trash"
 *     title="Judul"
 *     message="Pesan"
 *     confirmLabel="Ya"    // optional
 *     cancelLabel="Batal"  // optional
 *     onConfirm={() => {}} // OK / Ya / Tutup
 *     onCancel={() => {}}  // Batal (hanya untuk confirm/trash)
 *     onClose={() => {}}   // optional fallback
 *   />
 */
export default function AlertModal({
  open,
  type = "alert",
  title,
  message,
  confirmLabel,
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  onClose,
}) {
  const handleClose = () => {
    if (type === "confirm" || type === "trash") {
      if (onCancel) onCancel();
      else if (onClose) onClose();
    } else {
      if (onConfirm) onConfirm();
      else if (onClose) onClose();
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, type, onConfirm, onCancel, onClose]);

  if (!open) return null;

  const icons = {
    alert:   "ℹ️",
    info:    "ℹ️",
    confirm: "❓",
    success: "✅",
    error:   "❌",
    warning: "⚠️",
    trash:   "🗑️",
  };

  const confirmColors = {
    alert:   "#1a4fa0",
    info:    "#1a4fa0",
    confirm: "#1a4fa0",
    success: "#16a34a",
    error:   "#ef4444",
    warning: "#f59e0b",
    trash:   "#ef4444",
  };

  const defaultConfirmLabel = {
    alert:   "OK",
    info:    "OK",
    confirm: "Ya, Lanjutkan",
    success: "OK",
    error:   "Tutup",
    warning: "OK",
    trash:   "Hapus",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border"
        style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close icon button */}
        <button
          onClick={handleClose}
          aria-label="Tutup"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        <div className="text-4xl mb-3">{icons[type] ?? "ℹ️"}</div>

        {title && (
          <h3 className="text-[17px] font-bold mb-1" style={{ color: "var(--fm-text)" }}>
            {title}
          </h3>
        )}

        {message && (
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "var(--fm-text-2)" }}>
            {message}
          </p>
        )}

        <div className={`flex gap-3 ${type === "confirm" || type === "trash" ? "" : "justify-center"}`}>
          {(type === "confirm" || type === "trash") && (
            <button
              onClick={onCancel || handleClose}
              className="flex-1 py-2.5 rounded-xl border text-[14px] font-semibold transition hover:opacity-80"
              style={{ borderColor: "var(--fm-border)", color: "var(--fm-text-2)", backgroundColor: "var(--fm-card)" }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm || handleClose}
            className="flex-1 py-2.5 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90 shadow-md"
            style={{ backgroundColor: confirmColors[type] ?? "#1a4fa0" }}
          >
            {confirmLabel ?? defaultConfirmLabel[type] ?? "OK"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

