import { createPortal } from "react-dom";

/**
 * AlertModal — pengganti alert() dan confirm() browser
 *
 * Usage:
 *   <AlertModal
 *     open={bool}
 *     type="alert" | "confirm" | "success" | "error"
 *     title="Judul"
 *     message="Pesan"
 *     confirmLabel="Ya"    // optional
 *     cancelLabel="Batal"  // optional
 *     onConfirm={() => {}} // OK / Ya
 *     onCancel={() => {}}  // Batal (hanya untuk confirm)
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
}) {
  if (!open) return null;

  const icons = {
    alert:   "ℹ️",
    confirm: "❓",
    success: "✅",
    error:   "❌",
    warning: "⚠️",
    trash:   "🗑️",
  };

  const confirmColors = {
    alert:   "#1a4fa0",
    confirm: "#1a4fa0",
    success: "#16a34a",
    error:   "#ef4444",
    warning: "#f59e0b",
    trash:   "#ef4444",
  };

  const defaultConfirmLabel = {
    alert:   "OK",
    confirm: "Ya, Lanjutkan",
    success: "OK",
    error:   "Tutup",
    warning: "OK",
    trash:   "Hapus",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={type !== "confirm" ? onConfirm : undefined}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}
        onClick={e => e.stopPropagation()}
      >
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
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border text-[14px] font-semibold transition hover:opacity-80"
              style={{ borderColor: "var(--fm-border)", color: "var(--fm-text-2)", backgroundColor: "var(--fm-card)" }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90"
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
