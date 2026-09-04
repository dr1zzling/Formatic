import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import api, { FORM_API_URL } from "../../utils/api";
import { socket } from "../../utils/socket";
import { ArrowLeft, Send, Check, CheckCircle2, UploadCloud, FileText, Bell, ArrowRight, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
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

  const [zoomLevel, setZoomLevel] = useState(1);

  const STORAGE_KEY = `fillform_answers_${slug}`;

  const [form, setForm]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [doubtfulIds, setDoubtfulIds] = useState(new Set()); // soal yang ditandai ragu-ragu
  const soalRefs = useRef({});

  // ── Token gate hooks — harus di atas semua early returns ──
   const [tokenInput, setTokenInput]       = useState("");
   const [tokenVerified, setTokenVerified] = useState(() => {
     // Restore token verification state from localStorage on first load
     const saved = localStorage.getItem(`token_verified_${slug}`);
     return saved === "true";
   });
   const [tokenLoading, setTokenLoading]   = useState(false);
   const [tokenError, setTokenError]       = useState("");

  // Save tokenVerified state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(`token_verified_${slug}`, tokenVerified.toString());
  }, [tokenVerified, slug]);

  // ── Timer hooks — harus di atas semua early returns ──
  const [timeLeft, setTimeLeft]   = useState(null); // detik tersisa
  const [timedOut, setTimedOut]   = useState(false);
  const timerRef                  = useRef(null);

  // Helper untuk membersihkan storage timer
  const cleanupTimerStorage = () => {
    sessionStorage.removeItem(`timer_end_${slug}`);
    sessionStorage.removeItem(`timer_${slug}`);
    sessionStorage.removeItem(`timer_start_${slug}`);
  };

  useEffect(() => {
    // Restore timeLeft langsung saat mount jika end timestamp sudah ada
    const endTimestamp = sessionStorage.getItem(`timer_end_${slug}`);
    if (endTimestamp && !isNaN(parseInt(endTimestamp))) {
      const remaining = Math.max(0, Math.ceil((parseInt(endTimestamp) - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setTimedOut(true);
      }
    }
  }, [slug]);

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

  // ── Timer: mulai countdown setelah form load + token verified ──
  useEffect(() => {
    if (!form || !tokenVerified) return;

    const duration = form?.duration; // menit
    if (!duration || duration <= 0) return; // tidak ada timer

    const totalSecs = duration * 60;
    let endTimestamp = sessionStorage.getItem(`timer_end_${slug}`);

    if (!endTimestamp || isNaN(parseInt(endTimestamp))) {
      // Belum ada end timestamp di session
      if (form?.start_at && Number(form?.start_at) > 0) {
        // Jika server punya start_at
        endTimestamp = Number(form.start_at) + (totalSecs * 1000);
      } else {
        // Hitung target waktu selesai dari sekarang
        endTimestamp = Date.now() + (totalSecs * 1000);
      }
      sessionStorage.setItem(`timer_end_${slug}`, endTimestamp.toString());
    } else {
      endTimestamp = parseInt(endTimestamp);
    }

    const computeRemaining = () => Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
    const initialSecs = computeRemaining();

    setTimeLeft(initialSecs);

    if (initialSecs <= 0) {
      cleanupTimerStorage();
      setTimedOut(true);
      setAutoSubmitting(true);
      return;
    }

    // Interval real-time: selalu bandingkan dengan target endTimestamp
    timerRef.current = setInterval(() => {
      const remaining = computeRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        cleanupTimerStorage();
        // Auto-submit saat waktu habis — paksa kirim semua jawaban
        setTimedOut(true);
        setAutoSubmitting(true);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [form?.duration, form?.start_at, tokenVerified, slug]);

  // ── Auto-submit saat timer habis ──
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  useEffect(() => {
    if (!autoSubmitting) return;
    submitForced();
  }, [autoSubmitting]);

  function setAnswer(soalId, value) {
    setAnswers((prev) => ({ ...prev, [soalId]: value }));
    if (errorSoalId === soalId) setErrorSoalId(null);
  }

  function toggleDoubt(soalId) {
    setDoubtfulIds(prev => {
      const next = new Set(prev);
      if (next.has(soalId)) next.delete(soalId);
      else next.add(soalId);
      return next;
    });
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
    // Baca required map dari localStorage (disimpan creator)
    let reqMap = {};
    try {
      const saved = localStorage.getItem(`soal_required_${slug}`);
      if (saved) reqMap = JSON.parse(saved);
    } catch { /* ignore */ }
    const isRequired = (s) => reqMap[s.id] !== undefined ? reqMap[s.id] : true; // default wajib

    const empty = (allSoal ?? []).find((s) => isRequired(s) && !hasAnswer(s));
    if (empty) {
      setErrorSoalId(empty.id);
      const clean = (empty.question || "Soal").replace(/<[^>]*>/g, "").trim();
      setSubmitError(`Pertanyaan "${clean}" belum dijawab. Mohon lengkapi semua soal wajib sebelum mengirim.`);
      
      // Jika mode per-halaman/quiz, pindahkan currentIdx ke halaman yang berisi soal tersebut
      const targetPageIdx = pageGroups.findIndex(pg => (pg.soal ?? []).some(s => s.id === empty.id));
      if (targetPageIdx >= 0 && targetPageIdx !== currentIdx) {
        setCurrentIdx(targetPageIdx);
      }
      setTimeout(() => {
        const el = soalRefs.current[empty.id];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }
    // Cek ragu-ragu
    if (doubtfulIds.size > 0) {
      setSubmitError(`Masih ada ${doubtfulIds.size} soal yang ditandai ragu-ragu. Periksa kembali sebelum submit.`);
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
      // Hapus draft jawaban dari localStorage & timer storage
      localStorage.removeItem(STORAGE_KEY);
      cleanupTimerStorage();
      setDone(true);
    } catch (e) {
      const msg = e.message || "";
      if (msg.toLowerCase().includes("sudah") || msg.includes("409")) {
        setSubmitError("Kamu sudah pernah mengisi form ini sebelumnya.");
        localStorage.removeItem(STORAGE_KEY); // hapus draft
        cleanupTimerStorage();
      } else {
        setSubmitError(e.message || "Gagal mengirim jawaban.");
      }
    } finally { setSubmitting(false); }
  }

  // ── submitForced: auto-submit saat timer habis, skip validasi ──
  async function submitForced() {
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const fd = new FormData();
      const payload = [];
      for (const soal of allSoal ?? []) {
        const a = answers[soal.id];
        const jawaban = { soal_id: soal.id };
        if (soal.type === "radio") { jawaban.soal_option_id = a ?? null; }
        else if (soal.type === "checkbox") { jawaban.soal_option_id = Array.isArray(a) ? a : null; }
        else if (soal.type === "text") { jawaban.answer_text = a ?? ""; }
        else if (soal.type === "file" && a?.file) { jawaban.file_name = a.file.name; fd.append("files", a.file); }
        payload.push({ jawaban });
      }
      fd.append("data", JSON.stringify(payload));
      const token = localStorage.getItem("token");
      const response = await fetch(`${FORM_API_URL}/form/submit?form_slug=${slug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      saveToHistory(slug, form?.title ?? form?.form_title, form?.category);
      localStorage.removeItem(STORAGE_KEY);
      setDone(true);
    } catch {
      // Tetap anggap selesai meski error
      setDone(true);
    } finally {
      setSubmitting(false);
      setAutoSubmitting(false);
    }
  }

  const title = form?.title ?? form?.form_title ?? "Form";
  const isQuiz = form?.category === "ujian";

  // ── Flatten & group soal — harus di atas early returns (Rules of Hooks) ──
  const rawSoal  = form?.soal ?? [];
  const soalList = rawSoal.length > 0 && rawSoal[0]?.soal
    ? rawSoal.flatMap(p => p.soal ?? [])
    : rawSoal;

  // pageGroups di-memo — hanya dihitung ulang saat form berubah
  // Ini penting supaya shuffle tidak berulang saat user ketik (re-render)
  const pageGroups = useMemo(() => {
    if (!form) return [];

    // Survey: tampilkan semua soal dalam 1 halaman
    if (form?.category !== "ujian") {
      const flat = (form?.soal ?? []).length > 0 && (form?.soal ?? [])[0]?.soal
        ? (form?.soal ?? []).flatMap(p => p.soal ?? [])
        : (form?.soal ?? []);
      return [{ page: 1, soal: flat }];
    }

    const raw = form?.soal ?? [];
    const rFlat = raw.length > 0 && raw[0]?.soal ? raw : null;

    // Ambil locked IDs dari localStorage
    let lockedIds = new Set();
    try {
      const slug = form?.slug ?? form?.form_slug ?? "";
      const saved = localStorage.getItem(`locked_soal_${slug}`);
      lockedIds = new Set(saved ? JSON.parse(saved).map(Number) : []);
    } catch { /* ignore */ }

    // Bangun pages
    let pages = [];
    if (rFlat) {
      pages = [...rFlat]
        .sort((a, b) => (a.page ?? 1) - (b.page ?? 1))
        .map(p => ({ page: p.page ?? 1, soal: p.soal ?? [] }));
    } else {
      const groups = {};
      for (const s of raw) {
        const p = parseInt(s.page) || 1;
        if (!groups[p]) groups[p] = [];
        groups[p].push(s);
      }
      pages = Object.keys(groups).map(Number).sort((a,b) => a - b)
        .map(p => ({ page: p, soal: groups[p] }));
    }

    if (!form?.is_random) return pages;

    // Shuffle: locked tetap posisi, unlocked diacak
    function shuffleArr(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const unlockedPages = pages.filter(pg => !(pg.soal ?? []).some(s => lockedIds.has(Number(s.id))));
    const shuffled = shuffleArr(unlockedPages);
    const result = [...pages];
    let ui = 0;
    for (let i = 0; i < result.length; i++) {
      const isLocked = (result[i].soal ?? []).some(s => lockedIds.has(Number(s.id)));
      if (!isLocked) result[i] = shuffled[ui++];
    }
    return result;
  }, [form?.soal, form?.is_random, form?.slug, form?.category]);

  const allSoal = soalList;

  // ── Manual Zoom Handlers ──
  function zoomIn()  { setZoomLevel(prev => Math.min(prev + 0.1, 1.5)); }
  function zoomOut() { setZoomLevel(prev => Math.max(prev - 0.1, 0.7)); }
  function resetZoom() { setZoomLevel(1); }

  // Get banner image with auto-resize (object-fit: contain)
  const banner = form?.banner ?? form?.form_banner;
  const bannerUrl = banner ? `${FORM_API_URL}${banner.startsWith('/') ? banner : '/uploads/form/' + banner}` : null;

  // ── Soft refresh: ambil ulang data form tanpa hapus jawaban/timer/token ──
  // ponytail: pakai endpoint GET /form/slug yang sudah ada, tanpa ubah BE
  async function refreshForm() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await api.get("/form/slug", { params: { slug } });
      setForm(res.data?.data);
      setError("");
      setLiveNotice("Form berhasil diperbarui!");
      setTimeout(() => setLiveNotice(""), 3000);
    } catch {
      setLiveNotice("Gagal memperbarui form. Coba lagi.");
      setTimeout(() => setLiveNotice(""), 3000);
    } finally {
      setRefreshing(false);
    }
  }

  /* ── Loading ────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen grid place-items-center" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Memuat form...</p>
      </div>
    </div>
  );

  /* ── Error ──────────────────────────────────────────── */
  if (error) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
      <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border border-[#e5eef7]">
        <p className="text-3xl mb-3">😕</p>
        <p className="font-bold text-gray-800 mb-1">Form tidak ditemukan</p>
        <p className="text-[14px] text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold" style={{ backgroundColor: "#1a4fa0" }}>Ke Beranda</button>
      </div>
    </div>
  );

  /* ── Timed out — tampil layar waktu habis, submit di background ── */
  if (autoSubmitting || (timedOut && !done)) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
      <div className="rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm w-full text-center border"
        style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-[20px] font-extrabold mb-2" style={{ color: "var(--fm-text)" }}>Waktu Habis!</h2>
        <p className="text-[14px] mb-6" style={{ color: "var(--fm-text-2)" }}>
          Waktu pengerjaan telah habis. Jawaban kamu sedang dikirim secara otomatis.
        </p>
        {/* Status submit */}
        {submitting && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="w-5 h-5 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-[13px] font-semibold text-[#1a4fa0]">Mengirim jawaban...</span>
          </div>
        )}
        {!submitting && !done && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[13px] font-semibold text-amber-700">Menunggu koneksi...</span>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Success ────────────────────────────────────────── */
  if (done) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
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

  // ── Token gate ────────────────────────────────────────────
  const needsToken = Boolean(form?.token_respon);

  async function verifyToken() {
    if (!tokenInput.trim()) { setTokenError("Masukkan token terlebih dahulu."); return; }
    setTokenLoading(true); setTokenError("");
    try {
      const res = await fetch(`${FORM_API_URL}/form/submit/check-token?form_slug=${slug}`, {
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
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
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
  // Quiz: step-by-step navigation

  if (isQuiz) {
    const totalPages  = pageGroups.length;
    const currPage    = pageGroups[currentIdx] ?? { page: 1, soal: [] };
    const isFirst     = currentIdx === 0;
    const isLast      = currentIdx === totalPages - 1;
    const progress    = totalPages > 0 ? ((currentIdx + 1) / totalPages) * 100 : 0;
     const pageNum     = currPage.page ?? (currentIdx + 1);
    function goNext() {
      setSubmitError("");
      setErrorSoalId(null);
      setCurrentIdx(i => Math.min(i + 1, totalPages - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function goPrev() {
      setSubmitError("");
      setErrorSoalId(null);
      setCurrentIdx(i => Math.max(i - 1, 0));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Hitung status ringkasan untuk badge tombol Soal
    const answeredCount = allSoal.filter(s => hasAnswer(s)).length;
    const doubtCount    = doubtfulIds.size;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 backdrop-blur border-b border-[#e5eef7] px-4 py-3 transition-colors"
          style={{ backgroundColor: "var(--fm-card)" }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2.5">
              <button onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4fa0] hover:underline">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <button onClick={zoomOut} className="p-1.5 rounded-lg border border-[#d0e3f5] bg-white hover:bg-[#eef5fb] transition-all" title="Zoom Out">
                    <ZoomOut size={14} />
                  </button>
                  <button onClick={resetZoom} title="Reset zoom ke 100%" className="px-2 py-1.5 rounded-lg border border-[#d0e3f5] bg-white hover:bg-[#eef5fb] transition-all text-[11px] font-bold text-[#1a4fa0] tabular-nums min-w-[44px]">
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button onClick={zoomIn} className="p-1.5 rounded-lg border border-[#d0e3f5] bg-white hover:bg-[#eef5fb] transition-all" title="Zoom In">
                    <ZoomIn size={14} />
                  </button>
                  <button onClick={refreshForm} disabled={refreshing} className="p-1.5 rounded-lg border border-[#d0e3f5] bg-white hover:bg-[#eef5fb] transition-all disabled:opacity-60" title="Muat ulang soal">
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
              {/* Timer */}
              {timeLeft !== null && (
                <TimerBadge timeLeft={timeLeft} />
              )}
              {/* Tombol Soal */}
              <SoalIndicatorBtn
                allSoal={allSoal}
                answers={answers}
                hasAnswer={hasAnswer}
                doubtfulIds={doubtfulIds}
                pageGroups={pageGroups}
                currentIdx={currentIdx}
                setCurrentIdx={setCurrentIdx}
                answeredCount={answeredCount}
                doubtCount={doubtCount}
              />
            </div>

            {/* Progress Section */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[12px] font-semibold mb-1.5">
                <div className="flex items-center gap-1.5 text-[#102f56]">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#1a4fa0] animate-pulse"></span>
                  <span>Soal {currentIdx + 1} dari {totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-normal">{answeredCount} dijawab</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#eef5fb] text-[#1a4fa0] font-bold text-[11px] border border-[#d4e5fa]">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#e8f1fa] rounded-full overflow-hidden p-[1px] shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{
                    width: `${Math.min(100, Math.max(3, progress))}%`,
                    background: "linear-gradient(90deg, #1a4fa0 0%, #2563eb 60%, #38bdf8 100%)",
                    boxShadow: "0 1px 4px rgba(26, 79, 160, 0.35)"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full transition-transform duration-200 origin-top" style={{ transform: `scale(${zoomLevel})` }}>
          {bannerUrl && (
            <div className="mb-4 w-full">
              <img src={bannerUrl} alt="Banner" className="w-full max-h-72 object-contain rounded-2xl border border-[#e5eef7] shadow-sm bg-white" />
            </div>
          )}
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
            // Nomor soal = posisi dalam urutan pageGroups setelah shuffle (bukan urutan DB)
            const shuffledIdx = pageGroups.findIndex(pg => (pg.soal ?? []).some(s => s.id === soal.id));
            const displayNum  = shuffledIdx >= 0 ? shuffledIdx : idx;
            const isDoubt = doubtfulIds.has(soal.id);
            return (
              <div key={soal.id ?? idx}>
                <SoalItem
                  soal={soal}
                  idx={displayNum}
                  answers={answers}
                  setAnswer={setAnswer}
                  toggleOption={toggleOption}
                  errorSoalId={errorSoalId}
                  soalRefs={soalRefs}
                />
                {/* Tombol ragu-ragu */}
                <div className="flex justify-end mb-4 -mt-2 pr-1">
                  <button onClick={() => toggleDoubt(soal.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition ${
                      isDoubt
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "bg-white border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"
                    }`}>
                    <span>🚩</span> {isDoubt ? "Ragu-ragu" : "Tandai ragu-ragu"}
                  </button>
                </div>
              </div>
            );
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
    let reqMap = {};
    try { const s = localStorage.getItem(`soal_required_${slug}`); if (s) reqMap = JSON.parse(s); } catch {}
    const isReq = (s) => reqMap[s.id] !== undefined ? reqMap[s.id] : true;
    const unanswered = (currPageS.soal ?? []).find(s => isReq(s) && !hasAnswer(s));
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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button onClick={zoomOut} className="p-1.5 rounded-lg border border-[#d0e3f5] bg-white hover:bg-[#eef5fb] transition-all" title="Zoom Out">
                  <ZoomOut size={14} />
                </button>
                <button onClick={resetZoom} title="Reset zoom ke 100%" className="px-2 py-1.5 rounded-lg border border-[#d0e3f5] bg-white hover:bg-[#eef5fb] transition-all text-[11px] font-bold text-[#1a4fa0] tabular-nums min-w-[44px]">
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button onClick={zoomIn} className="p-1.5 rounded-lg border border-[#d0e3f5] bg-white hover:bg-[#eef5fb] transition-all" title="Zoom In">
                  <ZoomIn size={14} />
                </button>
                <button onClick={refreshForm} disabled={refreshing} className="p-1.5 rounded-lg border border-[#d0e3f5] bg-white hover:bg-[#eef5fb] transition-all disabled:opacity-60" title="Muat ulang soal">
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
            {timeLeft !== null && <TimerBadge timeLeft={timeLeft} />}
          </div>
          {totalPagesS > 1 && (
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressS}%`, background: "linear-gradient(90deg,#1a4fa0,#1e6fc7)" }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full transition-transform duration-200 origin-top" style={{ transform: `scale(${zoomLevel})` }}>
        {bannerUrl && (
          <div className="mb-4 w-full">
            <img src={bannerUrl} alt="Banner" className="w-full max-h-72 object-contain rounded-2xl border border-[#e5eef7] shadow-sm bg-white" />
          </div>
        )}
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
          // Calculate cumulative question number for survey mode - ensure unique numbers
          const prevPagesSoalCount = pageGroups.slice(0, currentIdx).reduce((sum, pg) => sum + (pg.soal?.length || 0), 0);
          const displayNum = prevPagesSoalCount + qi;
          
          const isError = errorSoalId === soal.id;
          const isDoubt = doubtfulIds.has(soal.id);
          return (
            <div key={soal.id ?? qi} ref={el => { if (el) soalRefs.current[soal.id] = el; }}
              className={`rounded-2xl border shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6 mb-4 transition-all ${isError ? "border-red-400 ring-2 ring-red-100" : ""}`}
              style={{ backgroundColor: "var(--fm-card)", borderColor: isError ? undefined : "var(--fm-card-border)" }}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-9 h-9 rounded-xl bg-[#eef5fb] text-[#1a4fa0] text-[14px] font-extrabold grid place-items-center shrink-0 mt-0.5">
                    {displayNum + 1}
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
                  <a href={`${FORM_API_URL}${soal.image.startsWith('/') ? soal.image : '/uploads/soal/'+soal.image}`}
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#1a4fa0] text-white text-[12px] font-semibold hover:opacity-90 transition">
                    Buka File
                  </a>
                </div>
              )}

              {/* Audio soal — quiz mode */}
              {soal.audio && (
                <div className="mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-[12px] font-bold text-purple-700 mb-2">🎵 Audio Soal</p>
                  <audio controls src={`${FORM_API_URL}${soal.audio}`} className="w-full h-10" />
                </div>
              )}

              {(soal.type === "radio" || soal.type === "checkbox") && (
                <div className="space-y-2.5">
                  {(soal.options ?? []).map((opt, oi) => {
                    const selected = soal.type === "radio"
                      ? answers[soal.id] === opt.id
                      : (Array.isArray(answers[soal.id]) && answers[soal.id].includes(opt.id));
                    const optImage = opt.image ? `${FORM_API_URL}${opt.image}` : null;
                    return (
                      <button key={opt.id ?? oi} onClick={() => toggleOption(soal, opt)}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          selected ? "border-[#1a4fa0] bg-[#f0f6fe] text-[#102f56]" : "border-[#e2e9f1] text-gray-600 hover:border-[#1a4fa0]/40 hover:bg-[#f7fafd]"
                        }`}>
                        <span className={`inline-grid place-items-center shrink-0 border-2 transition-all mt-0.5 ${soal.type === "checkbox" ? "w-6 h-6 rounded-[8px]" : "w-6 h-6 rounded-full"} ${selected ? "border-[#1a4fa0] bg-[#1a4fa0]" : "border-[#5b6c7e] bg-[#eef2f6]"}`}>
                          {selected && (soal.type === "checkbox"
                            ? <Check size={15} strokeWidth={3} className="text-white" />
                            : <span className="w-3 h-3 rounded-full bg-white" />)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <RichTextDisplay content={opt.value?.trim() || opt.option_value?.trim() || `Opsi ${oi + 1}`} className="text-[15px] font-medium" />
                          {optImage && (
                            <img src={optImage} alt={fallbackLabel(opt, oi)}
                              className="mt-2.5 w-full max-h-52 object-contain rounded-xl border border-[#d4e5fa]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {soal.type === "text" && (
                <textarea key={`text-s-${soal.id}`} rows={3} placeholder="Tulis jawabanmu di sini..."
                  value={answers[soal.id] ?? ""}
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
              {/* Tombol ragu-ragu */}
              <div className="flex justify-end mt-3">
                <button onClick={() => toggleDoubt(soal.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition ${
                    isDoubt ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"
                  }`}>
                  <span>🚩</span> {isDoubt ? "Ragu-ragu" : "Tandai ragu-ragu"}
                </button>
              </div>
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

/* ── SoalItem — komponen soal untuk quiz mode ───────────────── */
function SoalItem({ soal, idx, answers, setAnswer, toggleOption, errorSoalId, soalRefs }) {
  const isError = errorSoalId === soal.id;
  return (
    <div ref={el => { if (el) soalRefs.current[soal.id] = el; }}
      className={`rounded-2xl border shadow-sm p-6 mb-4 transition-all ${isError ? "border-red-400 ring-2 ring-red-100" : ""}`}
      style={{ backgroundColor: "var(--fm-card)", borderColor: isError ? undefined : "var(--fm-card-border)" }}>
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
          <a href={`${FORM_API_URL}${soal.image.startsWith('/') ? soal.image : '/uploads/soal/' + soal.image}`}
            target="_blank" rel="noopener noreferrer"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#1a4fa0] text-white text-[12px] font-semibold hover:opacity-90 transition">
            Buka File
          </a>
        </div>
      )}

      {soal.audio && (
        <div className="mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-[12px] font-bold text-purple-700 mb-2">🎵 Audio Soal</p>
          <audio controls src={`${FORM_API_URL}${soal.audio}`} className="w-full h-10" />
        </div>
      )}

      {(soal.type === "radio" || soal.type === "checkbox") && (
        <div className="space-y-2.5">
          {(soal.options ?? []).map((opt, oi) => {
            const selected = soal.type === "radio"
              ? answers[soal.id] === opt.id
              : (Array.isArray(answers[soal.id]) && answers[soal.id].includes(opt.id));
            const optImage = opt.image ? `${FORM_API_URL}${opt.image}` : null;
            return (
              <button key={opt.id ?? oi} onClick={() => toggleOption(soal, opt)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  selected ? "border-[#1a4fa0] bg-[#f0f6fe]" : "border-[#e2e9f1] hover:border-[#1a4fa0]/40 hover:bg-[#f7fafd]"
                }`}>
                <span className={`inline-grid place-items-center shrink-0 border-2 transition-all mt-0.5 ${
                  soal.type === "checkbox" ? "w-6 h-6 rounded-[8px]" : "w-6 h-6 rounded-full"
                } ${selected ? "border-[#1a4fa0] bg-[#1a4fa0]" : "border-[#5b6c7e] bg-[#eef2f6]"}`}>
                  {selected && (soal.type === "checkbox"
                    ? <Check size={15} strokeWidth={3} className="text-white" />
                    : <span className="w-3 h-3 rounded-full bg-white" />)}
                </span>
                <div className="flex-1 min-w-0">
                  <RichTextDisplay content={opt.value?.trim() || opt.option_value?.trim() || `Opsi ${oi + 1}`} className="text-[15px] font-medium text-gray-700" />
                  {optImage && (
                    <img src={optImage} alt={fallbackLabel(opt, oi)}
                      className="mt-2.5 w-full max-h-55 object-contain rounded-xl border border-[#d4e5fa]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {soal.type === "text" && (
        <textarea
          rows={3}
          placeholder="Tulis jawabanmu di sini..."
          value={answers[soal.id] ?? ""}
          onChange={e => setAnswer(soal.id, e.target.value)}
          className={inputCls}
        />
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
}

/* ── Timer Badge ─────────────────────────────────────────────── */
function TimerBadge({ timeLeft }) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const str  = `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  const urgent = timeLeft <= 60; // merah jika ≤ 1 menit
  const warn   = timeLeft <= 300 && timeLeft > 60; // kuning jika ≤ 5 menit

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-bold tabular-nums transition-colors ${
      urgent ? "bg-red-50 text-red-600 border border-red-200 animate-pulse" :
      warn   ? "bg-amber-50 text-amber-600 border border-amber-200" :
               "bg-[#eef5fb] text-[#1a4fa0] border border-[#d4e5fa]"
    }`}>
      <span>⏱</span> {str}
    </div>
  );
}

/* ── Soal Indicator Button + Modal ─────────────────────────── */
function SoalIndicatorBtn({ allSoal, answers, hasAnswer, doubtfulIds, pageGroups, currentIdx, setCurrentIdx, answeredCount, doubtCount }) {
  const [open, setOpen] = useState(false);
  const total      = allSoal.length;
  const unanswered = total - answeredCount;
  const pct        = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d0e3f5] bg-white text-[13px] font-semibold text-[#1a4fa0] hover:bg-[#eef5fb] active:scale-95 transition-all shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span>Soal</span>
        {unanswered > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center leading-none">
            {unanswered}
          </span>
        )}
        {unanswered === 0 && doubtCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-white text-[9px] font-bold grid place-items-center leading-none">
            {doubtCount}
          </span>
        )}
      </button>

      {/* Modal overlay */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(5,20,50,0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full sm:w-[420px] rounded-t-[28px] sm:rounded-2xl shadow-[0_24px_60px_rgba(5,20,50,0.25)] overflow-hidden flex flex-col"
            style={{ maxHeight: "85dvh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
              <div className="w-9 h-[5px] rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-4 pb-2 shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[#102f56] text-[17px] leading-tight tracking-tight">
                  Navigasi Soal
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  <span className="text-[12.5px] text-gray-400">
                    <span className="font-bold text-[#1a4fa0]">{answeredCount}</span>
                    <span className="text-gray-300 mx-0.5">/</span>
                    {total} dijawab
                  </span>
                  {doubtCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                      🚩 {doubtCount} ragu-ragu
                    </span>
                  )}
                  {unanswered > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-[11px] font-semibold text-red-600">
                      ○ {unanswered} belum
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-3 shrink-0 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-[17px] font-bold transition-colors"
                aria-label="Tutup navigasi soal"
              >×</button>
            </div>

            {/* Progress bar */}
            <div className="mx-5 mt-1 mb-3 shrink-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-gray-400 font-medium">Progress</span>
                <span className="text-[11px] font-bold text-[#1a4fa0]">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1a4fa0,#3b82f6)" }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 px-5 pb-3 shrink-0">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                <span className="w-3.5 h-3.5 rounded-[4px] bg-[#1a4fa0] inline-block shrink-0" />
                Dijawab
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                <span className="w-3.5 h-3.5 rounded-[4px] bg-amber-100 border border-amber-400 inline-block shrink-0" />
                Ragu-ragu
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                <span className="w-3.5 h-3.5 rounded-[4px] bg-white border border-gray-300 inline-block shrink-0" />
                Belum
              </span>
            </div>

            <div className="border-t border-gray-100 shrink-0" />

            {/* Soal grid — nomor ikut urutan shuffle (pageGroups), wrap kalau penuh */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <div className="flex flex-wrap gap-2">
                {pageGroups.map((pg, pgIdx) => {
                  const s       = (pg.soal ?? [])[0]; // 1 soal per halaman
                  if (!s) return null;
                  const answered = hasAnswer(s);
                  const doubt    = doubtfulIds.has(s.id);
                  const isCurrent = pgIdx === currentIdx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setCurrentIdx(pgIdx); setOpen(false); }}
                      title={`Soal ${pgIdx + 1}${doubt ? " — ragu-ragu" : answered ? " — sudah dijawab" : " — belum dijawab"}`}
                      className={`w-10 h-10 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-90 focus:outline-none shrink-0 ${
                        doubt
                          ? "bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100"
                          : answered
                            ? "bg-[#1a4fa0] border-[#1a4fa0] text-white hover:opacity-90"
                            : isCurrent
                              ? "bg-[#eef5fb] border-[#1a4fa0] text-[#1a4fa0]"
                              : "bg-white border-gray-200 text-gray-500 hover:border-[#1a4fa0] hover:text-[#1a4fa0] hover:bg-[#f0f6fe]"
                      }`}
                    >
                      {pgIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pt-3 pb-5 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl text-white text-[14px] font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: "#1a4fa0" }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
