import { useEffect, useRef, useState } from "react";

const CYAN = "#28ACCE";

// ponytail: 1 komponen dipakai Login + Register, kirim ulang = panggil ulang API step-1 (tanpa endpoint baru)
export default function OtpCard({
  email,
  otp,
  setOtp,
  onVerify,
  loading,
  error,
  dark,
  C,
  backLabel = "Kembali",
  onBack,
  onEditEmail,
  onResend,
}) {
  const refs = useRef([]);
  const [focus, setFocus] = useState(-1);
  const [cool, setCool] = useState(0);
  const [sent, setSent] = useState(false);
  const digits = Array.from({ length: 6 }, (_, i) => otp[i] ?? "");

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!cool) return;
    const t = setTimeout(() => setCool((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cool]);

  const setAll = (s) => {
    setSent(false);
    setOtp(s.replace(/\D/g, "").slice(0, 6));
  };

  const handleChange = (i, v) => {
    if (!v) {
      // user menghapus isi kotak (backspace/delete) — ponytail: tadinya di-return sehingga digit macet
      const next = [...digits];
      next[i] = "";
      setAll(next.join(""));
      return;
    }
    const d = v.replace(/\D/g, "").slice(-1);
    if (!d) return;
    const next = [...digits];
    next[i] = d;
    setAll(next.join(""));
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      setAll(next.join(""));
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const t = e.clipboardData?.getData("text") ?? "";
    if (/\d/.test(t)) {
      e.preventDefault();
      setAll(t);
      refs.current[Math.min(t.replace(/\D/g, "").length, 5)]?.focus();
    }
  };

  const handleTempel = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setAll(t);
    } catch {
      refs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cool || !onResend) return;
    try {
      await onResend();
      setCool(30);
      setSent(true);
    } catch {
      // parent sudah set error
    }
  };

  return (
    <div
      className="relative w-full rounded-[20px] shadow-2xl px-8 py-8 auth-card"
      style={{
        maxWidth: "440px",
        backgroundColor: dark ? "#1a2235" : "#ffffff",
        border: dark ? "1px solid #2a3a54" : "none",
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="rounded-full" style={{ width: "32px", height: "4px", background: CYAN }} />
        <span className="rounded-full" style={{ width: "32px", height: "4px", background: CYAN }} />
        <span className="text-[11px] font-medium tracking-[0.15em]" style={{ color: C.gray }}>
          LANGKAH 2 DARI 2
        </span>
      </div>

      <h2 className="text-[28px] font-extrabold tracking-tight" style={{ color: C.navy }}>
        Cek email kamu
      </h2>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: C.gray }}>
        Kami mengirim kode verifikasi 6 digit ke{" "}
        <span className="font-bold" style={{ color: C.navy }}>
          {email}
        </span>{" "}
        ·{" "}
        <button type="button" onClick={onEditEmail} className="font-semibold hover:opacity-80" style={{ color: CYAN }}>
          salah email?
        </button>
      </p>

      {error && (
        <div className={`text-sm px-4 py-2 rounded-lg mt-4 ${dark ? "text-red-300 bg-red-500/10" : "text-red-600 bg-red-50"}`}>
          {error}
        </div>
      )}

      <form onSubmit={onVerify}>
        <div className="flex items-center justify-between mt-7 mb-1">
          <span className="text-[11px] font-medium tracking-[0.15em]" style={{ color: C.gray }}>
            KODE OTP
          </span>
          <button type="button" onClick={handleTempel} className="text-[13px] font-semibold hover:opacity-80" style={{ color: CYAN }}>
            Tempel
          </button>
        </div>

        <div className="flex gap-3" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={() => setFocus(i)}
              onBlur={() => setFocus(-1)}
              maxLength={1}
              className="flex-1 min-w-0 text-center text-2xl font-bold py-2 outline-none transition"
              style={{
                backgroundColor: "transparent",
                color: C.navy,
                borderBottom: `2px solid ${d || focus === i ? CYAN : C.border}`,
              }}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full rounded-xl text-white font-semibold py-3 text-sm mt-7 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: dark ? CYAN : "#101828" }}
        >
          {loading ? "Memverifikasi..." : "Verifikasi  →"}
        </button>
      </form>

      <div
        className="rounded-[10px] py-3 px-4 text-center text-[13px] mt-4"
        style={{ backgroundColor: dark ? "rgba(40,172,206,0.12)" : "#EAF6FA", color: C.gray }}
      >
        {sent ? (
          <span>Kode baru terkirim ke email kamu.</span>
        ) : (
          <>
            Masih belum sampai?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={cool > 0}
              className="font-bold hover:opacity-80 disabled:opacity-50"
              style={{ color: CYAN }}
            >
              {cool > 0 ? `Kirim ulang (${cool}s)` : "Kirim ulang kode"}
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 mt-5 text-[13px]" style={{ borderTop: `1px solid ${C.border}` }}>
        <button type="button" onClick={onBack} className="hover:opacity-80" style={{ color: C.gray }}>
          ← {backLabel}
        </button>
      </div>
    </div>
  );
}
