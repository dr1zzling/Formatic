import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { FORM_API_URL } from "../../utils/api";
import { socket } from "../../utils/socket";
import { ArrowLeft, Send, Check, CheckCircle2, UploadCloud, FileText, Bell, ArrowRight } from "lucide-react";
import { saveToHistory } from "./History";
import RichTextDisplay from "../../components/RichTextDisplay";

const TYPE_LABEL = {
  radio: "Pilihan Ganda",
  checkbox: "Kotak Centang",
  text: "Jawaban Singkat",
  file: "Unggah File",
};

function fallbackLabel(opt, i) {
  return opt.value?.trim() || opt.option_value?.trim() || `Opsi ${i + 1}`;
}

const inputCls =
  "w-full rounded-xl border border-[#dbe5f0] bg-white px-4 py-3 text-[15px] text-[#102f56] outline-none focus:border-[#1a4fa0] focus:ring-4 focus:ring-[#1a4fa0]/10 transition-all placeholder:text-gray-300";

export default function FillForm() {
  const { slug }        = useParams();
  const navigate        = useNavigate();

  const STORAGE_KEY = `fillform_answers_${slug}`;

  const [form, setForm]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [answers, setAnswers]     = useState(() => {
    // Restore jawaban dari localStorage saat pertama load
    try {
      const saved = localStorage.getItem(`fillform_answers_${slug}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [liveNotice, setLiveNotice]   = useState("");
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [errorSoalId, setErrorSoalId] = useState(null);
  const soalRefs = useRef({});

  // ── Token gate hooks — harus di atas semua early returns ──
  const [tokenInput, setTokenInput]       = useState("");
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenLoading, setTokenLoading]   = useState(false);
  const [tokenError, setTokenError]       = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/form/slug", { params: { slug } });
        setForm(res.data?.data);
        setError("");
      } catch {
        setError("Form tidak ditemukan atau sudah tidak tersedia.");
      } finally { setLoading(false); }
    })();
  }, [slug]);

  // Auto-save jawaban ke localStorage setiap kali answers berubah
  // File object tidak bisa diserialisasi, jadi di-skip
  useEffect(() => {
    try {
      const serializable = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v?.file == null)
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch { /* storage penuh atau disabled, abaikan */ }
  }, [answers, STORAGE_KEY]);

  useEffect(() => {
    if (!slug) return;

    socket.connect();
    socket.emit("joinForm", { slug });

    const handleFormUpdated = (data) => {
      if (data?.soal) {
        setForm((prev) => (prev ? { ...prev, soal: data.soal } : prev));
        setLiveNotice("Soal telah diperbarui oleh Admin!");
        setTimeout(() => setLiveNotice(""), 5000);
      }
    };

    socket.on("formUpdated", handleFormUpdated);

    return () => {
      socket.emit("leaveForm", { slug });
      socket.off("formUpdated", handleFormUpdated);
      socket.disconnect();
    };
  }, [slug]);


  // Sync token verified state setelah form load
  useEffect(() => {
    if (form) {
      const needsToken = Boolean(form?.token_respon);
      if (!needsToken) setTokenVerified(true);
    }
  }, [form]);

  function setAnswer(soalId, value) {
    setAnswers((prev) => ({ ...prev, [soalId]: value }));
    // Hapus highlight error saat soal mulai dijawab
    if (errorSoalId === soalId) setErrorSoalId(null);
  }

  function toggleOption(soal, opt) {
    const current = answers[soal.id];
    if (soal.type === "radio") {
      setAnswer(soal.id, opt.id);
    } else {
      const list = Array.isArray(current) ? current : [];
      setAnswer(
        soal.id,
        list.includes(opt.id) ? list.filter((id) => id !== opt.id) : [...list, opt.id]
      );
    }
    // Hapus highlight error saat soal mulai dijawab
    if (errorSoalId === soal.id) setErrorSoalId(null);
  }

  function hasAnswer(soal) {
    const a = answers[soal.id];
    if (soal.type === "file") return a?.file != null;
    if (soal.type === "checkbox") return Array.isArray(a) && a.length > 0;
    return Boolean(a && a !== "");
  }

  async function submit() {
    const empty = (allSoal ?? []).find((s) => !hasAnswer(s));
    if (empty) {
      setErrorSoalId(empty.id);
      setSubmitError("");
      // Scroll ke card soal yang belum dijawab
      const el = soalRefs.current[empty.id];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setErrorSoalId(null);

    setSubmitting(true); setSubmitError("");
    try {
      const fd = new FormData();
      const payload = [];

      for (const soal of allSoal ?? []) {
        const a = answers[soal.id];
        const jawaban = { soal_id: soal.id };

        if (soal.type === "radio") {
          jawaban.soal_option_id = a;
        } else if (soal.type === "checkbox") {
          jawaban.soal_option_id = Array.isArray(a) ? a : null;
        } else if (soal.type === "text") {
          jawaban.answer_text = a;
        } else if (soal.type === "file" && a?.file) {
          jawaban.file_name = a.file.name;
          fd.append("files", a.file);
        }
        payload.push({ jawaban });
      }

      fd.append("data", JSON.stringify(payload));

      // Kirim langsung dengan axios tanpa interceptor logout
      const token = localStorage.getItem("token");
      const response = await fetch(`${FORM_API_URL}/form/submit?form_slug=${slug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error("Submit error:", response.status, data);
        if (response.status === 401) {
          const msg = data.message || "";
          if (msg.toLowerCase().includes("berhak") || msg.toLowerCase().includes("responden")) {
            throw new Error("Kamu adalah Creator form ini. Creator tidak bisa mengisi form sendiri. Coba dengan akun lain.");
          }
          throw new Error(msg || "Tidak berhak mengisi form ini.");
        }
        throw new Error(data.message || `Gagal mengirim jawaban (${response.status}).`);
      }
      // Simpan ke history lokal
      saveToHistory(slug, form?.title ?? form?.form_title, form?.category);
      // Hapus draft jawaban dari localStorage
      localStorage.removeItem(STORAGE_KEY);
      setDone(true);
    } catch (e) {
      const msg = e.message || "";
      if (msg.toLowerCase().includes("sudah") || msg.includes("409")) {
        setSubmitError("Kamu sudah pernah mengisi form ini sebelumnya.");
        localStorage.removeItem(STORAGE_KEY); // hapus draft
      } else {
        setSubmitError(e.message || "Gagal mengirim jawaban.");
      }
    } finally { setSubmitting(false); }
  }

  /* ── Loading ────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen grid place-items-center" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Memuat form...</p>
      </div>
    </div>
  );

  /* ── Error ──────────────────────────────────────────── */
  if (error) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border border-[#e5eef7]">
        <p className="text-3xl mb-3">😕</p>
        <p className="font-bold text-gray-800 mb-1">Form tidak ditemukan</p>
        <p className="text-[14px] text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold" style={{ backgroundColor: "#1a4fa0" }}>Ke Beranda</button>
      </div>
    </div>
  );

  /* ── Success ────────────────────────────────────────── */
  if (done) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border border-[#e5eef7]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 text-green-600 grid place-items-center">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-[19px] font-extrabold text-[#102f56] mb-1">Jawaban terkirim</h2>
        <p className="text-[14px] text-gray-400 mb-6">Terima kasih, jawabanmu sudah tercatat.</p>
        <button onClick={() => navigate("/")} className="w-full py-3 rounded-xl text-white text-[14px] font-semibold" style={{ backgroundColor: "#1a4fa0" }}>Kembali ke Beranda</button>
      </div>
    </div>
  );

  const title = form?.title ?? form?.form_title ?? "Form";
  const isQuiz = form?.category === "ujian";

  // ── Token gate ────────────────────────────────────────────
  const needsToken = Boolean(form?.token_respon);

  async function verifyToken() {
    if (!tokenInput.trim()) { setTokenError("Masukkan token terlebih dahulu."); return; }
    setTokenLoading(true); setTokenError("");
    try {
      const res = await fetch(`http://localhost:3000/form/submit/check-token?form_slug=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTokenError(data?.message || "Token salah atau tidak valid.");
      } else {
        setTokenVerified(true);
      }
    } catch { setTokenError("Tidak dapat terhubung ke server."); }
    finally { setTokenLoading(false); }
  }

  // Tampilkan halaman input token jika belum diverifikasi
  if (needsToken && !tokenVerified) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-8 w-full max-w-sm border border-[#e5eef7] text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">🔐</div>
        <h2 className="text-[18px] font-extrabold text-[#102f56] mb-1">Form Terbatas</h2>
        <p className="text-[13px] text-gray-400 mb-5">
          Form <strong>"{title}"</strong> memerlukan token khusus untuk diakses.
          Masukkan token yang diberikan oleh pembuat form.
        </p>
        <input
          type="text"
          value={tokenInput}
          onChange={e => { setTokenInput(e.target.value); setTokenError(""); }}
          onKeyDown={e => e.key === "Enter" && verifyToken()}
          placeholder="Masukkan token..."
          className="w-full border border-[#dbe5f0] rounded-xl px-4 py-3 text-[15px] text-[#102f56] outline-none focus:border-[#1a4fa0] focus:ring-4 focus:ring-[#1a4fa0]/10 transition-all mb-3 text-center tracking-widest font-semibold"
        />
        {tokenError && <p className="text-[13px] text-red-500 mb-3">{tokenError}</p>}
        <button onClick={verifyToken} disabled={tokenLoading}
          className="w-full py-3 rounded-xl text-white text-[15px] font-bold hover:opacity-90 disabled:opacity-60 transition"
          style={{ backgroundColor: "#1a4fa0" }}>
          {tokenLoading ? "Memverifikasi..." : "Masuk →"}
        </button>
        <button onClick={() => navigate("/")} className="mt-3 text-[13px] text-gray-400 hover:underline block w-full">
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
  // Flatten soal dari format baru {page, soal:[]} atau format lama flat[]
  const rawSoal = form?.soal ?? [];
  const soalList = rawSoal.length > 0 && rawSoal[0]?.soal
    ? rawSoal.flatMap(p => p.soal ?? [])
    : rawSoal;

  // Grup per page — kalau semua page null/sama, jadi 1 grup (scroll semua)
  const buildPageGroups = () => {
    if (rawSoal.length > 0 && rawSoal[0]?.soal) {
      // Format baru dari backend
      return rawSoal.map(p => ({ page: p.page ?? 1, soal: p.soal ?? [] }));
    }
    // Format lama: flat array — grup manual berdasarkan field page di soal
    const groups = {};
    for (const s of rawSoal) {
      const p = parseInt(s.page) || 1;
      if (!groups[p]) groups[p] = [];
      groups[p].push(s);
    }
    const pages = Object.keys(groups).map(Number).sort((a,b) => a - b);
    return pages.map(p => ({ page: p, soal: groups[p] }));
  };
  const pageGroups = buildPageGroups();
  const allSoal = soalList;

  // Quiz: step-by-step navigation

  if (isQuiz) {
    const totalPages  = pageGroups.length;
    const currPage    = pageGroups[currentIdx] ?? { page: 1, soal: [] };
    const isFirst     = currentIdx === 0;
    const isLast      = currentIdx === totalPages - 1;
    const progress    = totalPages > 0 ? ((currentIdx + 1) / totalPages) * 100 : 0;
    const pageNum     = currPage.page ?? (currentIdx + 1);

    function goNext() {
      const unanswered = (currPage.soal ?? []).find(s => !hasAnswer(s));
      if (unanswered) {
        const clean = (unanswered.question || "Wajib").replace(/<[^>]*>/g, "").trim();
        setSubmitError(`Pertanyaan "${clean}" belum dijawab.`);
        return;
      }
      setSubmitError("");
      setCurrentIdx(i => Math.min(i + 1, totalPages - 1));
    }
    function goPrev() {
      setSubmitError("");
      setCurrentIdx(i => Math.max(i - 1, 0));
    }

    const SoalItem = ({ soal, idx }) => {
      const isError = errorSoalId === soal.id;
      return (
        <div ref={el => { if (el) soalRefs.current[soal.id] = el; }}
          className={`bg-white rounded-2xl border shadow-sm p-6 mb-4 transition-all ${isError ? "border-red-400 ring-2 ring-red-100" : "border-[#e5eef7]"}`}>
          <div className="flex items-start gap-3 mb-5">
            <span className="w-9 h-9 rounded-xl bg-[#eef5fb] text-[#1a4fa0] text-[14px] font-extrabold grid place-items-center shrink-0 mt-0.5">{idx + 1}</span>
            <div className="flex-1">
              <RichTextDisplay content={soal.question} className="text-[16px] font-bold text-[#102f56] leading-snug" />
              <span className="text-[12px] font-medium text-[#1a4fa0] block mt-1">{TYPE_LABEL[soal.type] ?? soal.type}</span>
            </div>
            <span className="text-[#c9393f] font-bold shrink-0">*</span>
          </div>

          {soal.image && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
              <FileText size={18} className="text-[#1a4fa0] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1a4fa0]">Lampiran Soal</p>
              </div>
              <a href={`http://localhost:3000${soal.image.startsWith('/') ? soal.image : '/uploads/soal/' + soal.image}`}
                target="_blank" rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 rounded-lg bg-[#1a4fa0] text-white text-[12px] font-semibold hover:opacity-90 transition">
                Buka File
              </a>
            </div>
          )}

          {(soal.type === "radio" || soal.type === "checkbox") && (
            <div className="space-y-2.5">
              {(soal.options ?? []).map((opt, oi) => {
                const selected = soal.type === "radio"
                  ? answers[soal.id] === opt.id
                  : (Array.isArray(answers[soal.id]) && answers[soal.id].includes(opt.id));
                return (
                  <button key={opt.id ?? oi} onClick={() => toggleOption(soal, opt)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selected ? "border-[#1a4fa0] bg-[#f0f6fe]" : "border-[#e2e9f1] hover:border-[#1a4fa0]/40 hover:bg-[#f7fafd]"
                    }`}>
                    <span className={`inline-grid place-items-center shrink-0 border-2 transition-all ${
                      soal.type === "checkbox" ? "w-6 h-6 rounded-[8px]" : "w-6 h-6 rounded-full"
                    } ${selected ? "border-[#1a4fa0] bg-[#1a4fa0]" : "border-[#5b6c7e] bg-[#eef2f6]"}`}>
                      {selected && (soal.type === "checkbox"
                        ? <Check size={15} strokeWidth={3} className="text-white" />
                        : <span className="w-3 h-3 rounded-full bg-white" />)}
                    </span>
                    <span className="text-[15px] font-medium text-gray-700">{fallbackLabel(opt, oi)}</span>
                  </button>
                );
              })}
            </div>
          )}
          {soal.type === "text" && (
            <textarea
              key={`text-quiz-${soal.id}`}
              rows={3} placeholder="Tulis jawabanmu di sini..."
              defaultValue={answers[soal.id] ?? ""}
              onBlur={e => setAnswer(soal.id, e.target.value)}
              onChange={e => setAnswer(soal.id, e.target.value)}
              className={inputCls} />
          )}
          {soal.type === "file" && (
            <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-[#c3d4e4] bg-[#f7fafd] py-8 cursor-pointer hover:border-[#1a4fa0] hover:bg-[#f0f6fe] transition-all">
              {answers[soal.id]?.file
                ? <><FileText size={28} className="text-[#1a4fa0]" /><span className="text-[14px] font-semibold text-[#102f56]">{answers[soal.id].file.name}</span></>
                : <><UploadCloud size={28} className="text-[#1a4fa0]" /><span className="text-[14px] font-semibold">Unggah file jawaban</span></>}
              <input type="file" className="hidden" onChange={e => setAnswer(soal.id, { file: e.target.files?.[0] })} />
            </label>
          )}
        </div>
      );
    };

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#e5eef7] px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4fa0] hover:underline">
                <ArrowLeft size={15} /> Kembali
              </button>
              <span className="text-[13px] font-semibold text-gray-500">
                Halaman {currentIdx + 1} / {totalPages}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#1a4fa0,#1e6fc7)" }} />
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
          {liveNotice && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-blue-600 text-white text-[14px] font-semibold flex items-center gap-3 shadow-lg">
              <Bell size={18} /><span>{liveNotice}</span>
            </div>
          )}

          {/* Form title (halaman pertama saja) */}
          {currentIdx === 0 && (
            <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 mb-4">
              <h1 className="text-[20px] font-extrabold text-[#102f56] leading-snug">{title}</h1>
              <p className="mt-1 text-[13px] text-gray-400">{form?.category}</p>
            </div>
          )}

          {/* Semua soal di halaman ini */}
          {(currPage.soal ?? []).map((soal, idx) => {
            const globalIdx = allSoal.findIndex(s => s.id === soal.id);
            return <SoalItem key={soal.id ?? idx} soal={soal} idx={globalIdx >= 0 ? globalIdx : idx} />;
          })}

          {submitError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[14px] mb-4">{submitError}</div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button onClick={goPrev}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Sebelumnya
              </button>
            )}
            {!isLast ? (
              <button onClick={goNext}
                className="flex-1 py-3 rounded-xl text-white text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
                style={{ backgroundColor: "#1a4fa0" }}>
                Selanjutnya <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting}
                className="flex-1 py-3 rounded-xl text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition"
                style={{ backgroundColor: "#1a4fa0" }}>
                <Send size={17} /> {submitting ? "Mengirim..." : "Kirim Jawaban"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Survey: per page (sama seperti quiz tapi category survei)
  const totalPagesS  = pageGroups.length;
  const currPageS    = pageGroups[currentIdx] ?? { page: 1, soal: [] };
  const isFirstS     = currentIdx === 0;
  const isLastS      = currentIdx === totalPagesS - 1;
  const progressS    = totalPagesS > 0 ? ((currentIdx + 1) / totalPagesS) * 100 : 0;

  function goNextS() {
    const unanswered = (currPageS.soal ?? []).find(s => !hasAnswer(s));
    if (unanswered) {
      setErrorSoalId(unanswered.id);
      const el = soalRefs.current[unanswered.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrorSoalId(null);
    setCurrentIdx(i => Math.min(i + 1, totalPagesS - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goPrevS() {
    setErrorSoalId(null);
    setCurrentIdx(i => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#e5eef7] px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4fa0] hover:underline">
              <ArrowLeft size={15} /> Kembali
            </button>
            <span className="text-[13px] font-semibold text-gray-500">
              {totalPagesS > 1 ? `Halaman ${currentIdx + 1} / ${totalPagesS}` : title}
            </span>
          </div>
          {totalPagesS > 1 && (
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressS}%`, background: "linear-gradient(90deg,#1a4fa0,#1e6fc7)" }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {liveNotice && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-blue-600 text-white text-[14px] font-semibold flex items-center gap-3 shadow-lg">
            <Bell size={18} /><span>{liveNotice}</span>
          </div>
        )}

        {/* Form header (halaman pertama) */}
        {currentIdx === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-7 mb-5">
            <h1 className="text-[24px] font-extrabold tracking-tight text-[#102f56] leading-snug">{title}</h1>
            <p className="mt-1 text-[13.5px] text-gray-400">{form?.category}</p>
          </div>
        )}

        {/* Soal di halaman ini */}
        {(currPageS.soal ?? []).map((soal, qi) => {
          const globalIdx = allSoal.findIndex(s => s.id === soal.id);
          const isError = errorSoalId === soal.id;
          return (
            <div key={soal.id ?? qi} ref={el => { if (el) soalRefs.current[soal.id] = el; }}
              className={`bg-white rounded-2xl border shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6 mb-4 transition-all ${isError ? "border-red-400 ring-2 ring-red-100" : "border-[#e5eef7]"}`}>
              <div className="flex items-start gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#eef5fb] text-[#1a4fa0] text-[14px] font-extrabold grid place-items-center shrink-0 mt-0.5">
                  {(globalIdx >= 0 ? globalIdx : qi) + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <RichTextDisplay content={soal.question} className="text-[16px] font-bold text-[#102f56] leading-snug" />
                  <span className="text-[12px] font-medium text-[#1a4fa0] block mt-1">{TYPE_LABEL[soal.type] ?? soal.type}</span>
                </div>
                <span className="text-[11px] font-semibold text-[#c9393f] shrink-0">*</span>
              </div>

              {soal.image && (
                <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <FileText size={18} className="text-[#1a4fa0] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1a4fa0]">Lampiran Soal</p>
                    <p className="text-[11.5px] text-blue-500 truncate">{soal.image}</p>
                  </div>
                  <a href={`http://localhost:3000${soal.image.startsWith('/') ? soal.image : '/uploads/soal/'+soal.image}`}
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#1a4fa0] text-white text-[12px] font-semibold hover:opacity-90 transition">
                    Buka File
                  </a>
                </div>
              )}

              {(soal.type === "radio" || soal.type === "checkbox") && (
                <div className="space-y-2.5">
                  {(soal.options ?? []).map((opt, oi) => {
                    const selected = soal.type === "radio"
                      ? answers[soal.id] === opt.id
                      : (Array.isArray(answers[soal.id]) && answers[soal.id].includes(opt.id));
                    return (
                      <button key={opt.id ?? oi} onClick={() => toggleOption(soal, opt)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          selected ? "border-[#1a4fa0] bg-[#f0f6fe] text-[#102f56]" : "border-[#e2e9f1] text-gray-600 hover:border-[#1a4fa0]/40 hover:bg-[#f7fafd]"
                        }`}>
                        <span className={`inline-grid place-items-center shrink-0 border-2 transition-all ${soal.type === "checkbox" ? "w-6 h-6 rounded-[8px]" : "w-6 h-6 rounded-full"} ${selected ? "border-[#1a4fa0] bg-[#1a4fa0]" : "border-[#5b6c7e] bg-[#eef2f6]"}`}>
                          {selected && (soal.type === "checkbox"
                            ? <Check size={15} strokeWidth={3} className="text-white" />
                            : <span className="w-3 h-3 rounded-full bg-white" />)}
                        </span>
                        <span className="text-[15px] font-medium">{fallbackLabel(opt, oi)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {soal.type === "text" && (
                <textarea key={`text-s-${soal.id}`} rows={3} placeholder="Tulis jawabanmu di sini..."
                  defaultValue={answers[soal.id] ?? ""}
                  onBlur={e => setAnswer(soal.id, e.target.value)}
                  onChange={e => setAnswer(soal.id, e.target.value)}
                  className={inputCls} />
              )}
              {soal.type === "file" && (
                <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-[#c3d4e4] bg-[#f7fafd] py-8 cursor-pointer hover:border-[#1a4fa0] hover:bg-[#f0f6fe] transition-all">
                  {answers[soal.id]?.file
                    ? <><FileText size={28} className="text-[#1a4fa0]" /><span className="text-[14px] font-semibold text-[#102f56]">{answers[soal.id].file.name}</span></>
                    : <><UploadCloud size={28} className="text-[#1a4fa0]" /><span className="text-[14px] font-semibold text-[#102f56]">Unggah file jawaban</span></>}
                  <input type="file" className="hidden" onChange={e => setAnswer(soal.id, { file: e.target.files?.[0] })} />
                </label>
              )}
            </div>
          );
        })}

        {submitError && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[14px] mb-4">{submitError}</div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {!isFirstS && (
            <button onClick={goPrevS}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Sebelumnya
            </button>
          )}
          {!isLastS ? (
            <button onClick={goNextS}
              className="flex-1 py-3 rounded-xl text-white text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
              style={{ backgroundColor: "#1a4fa0" }}>
              Selanjutnya <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="w-full py-3.5 rounded-xl text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition"
              style={{ backgroundColor: "#1a4fa0" }}>
              <Send size={17} /> {submitting ? "Mengirim..." : "Kirim Jawaban"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
