import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import api, { FORM_API_URL, flattenForm, monitoringAPI } from "../../utils/api";
import { socket } from "../../utils/socket";
import { ArrowLeft, Send, Check, CheckCircle2, UploadCloud, FileText, Bell, ArrowRight, ZoomIn, ZoomOut, RefreshCw, Flag, LockKeyhole, Music, FileQuestion, AlarmClock, ListChecks } from "lucide-react";
import { saveToHistory } from "./History";
import RichTextDisplay from "../../components/RichTextDisplay";
import { getStoredTheme, DEFAULT_FORM_THEME } from "../../utils/theme";
import { useTheme } from "../../context/ThemeContext";

const TYPE_LABEL = {
  radio: "Pilihan Ganda",
  checkbox: "Kotak Centang",
  text: "Jawaban Singkat",
  file: "Unggah File",
};

function fallbackLabel(opt, i) {
  return opt.value?.trim() || opt.option_value?.trim() || `Opsi ${i + 1}`;
}

// inputCls is now a function that accepts theme to support dark themes
const getInputCls = (theme) =>
  `w-full rounded-xl border px-4 py-3 text-[15px] outline-none focus:ring-4 transition-all placeholder:text-gray-400`;

export default function FillForm() {
  const { slug }        = useParams();
  const navigate        = useNavigate();
  const { setFillFormActive } = useTheme();

  const [zoomLevel, setZoomLevel] = useState(1);

  // Beritahu ThemeContext untuk stop apply dark mode selama di halaman responden
  useEffect(() => {
    setFillFormActive(true);
    return () => setFillFormActive(false);
  }, []);

  // Ambil user ID dari token untuk isolasi draft per akun
  const userId = (() => {
    try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id ?? "guest"; }
    catch { return "guest"; }
  })();

  const STORAGE_KEY = `fillform_answers_${slug}_${userId}`;

  const [form, setForm]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState("");
  const [answers, setAnswers]     = useState(() => {
    try {
      const uid = (() => {
        try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id ?? "guest"; }
        catch { return "guest"; }
      })();
      const saved = localStorage.getItem(`fillform_answers_${slug}_${uid}`);
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
  const [theme, setTheme]             = useState(() => getStoredTheme(slug) || DEFAULT_FORM_THEME);
  const soalRefs = useRef({});
  const progressDebounceRef = useRef(null);

  // Helper: kirim progress ke backend (debounced 400ms, fire-and-forget)
  const emitProgress = useCallback((nextIdx, pgGroups, totalSoalCount) => {
    if (!slug) return;
    if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current);
    progressDebounceRef.current = setTimeout(() => {
      const currentPage = nextIdx + 1;
      const totalPages = pgGroups.length;
      const soalOnPage = pgGroups[nextIdx]?.soal?.length ?? 0;
      monitoringAPI.updateProgress(slug, currentPage, soalOnPage, totalPages, totalSoalCount)
        .catch(() => {}); // fire-and-forget, jangan crash jika gagal
    }, 400);
  }, [slug]);

  useEffect(() => {
    const saved = getStoredTheme(slug);
    if (saved) setTheme(saved);

    const onThemeUpdated = (e) => {
      if (e.detail?.slug === slug && e.detail?.theme) {
        setTheme(e.detail.theme);
      }
    };

    const onStorageChange = (e) => {
      if (e.key === `form_theme_${slug}`) {
        try {
          const newT = e.newValue ? JSON.parse(e.newValue) : DEFAULT_FORM_THEME;
          setTheme(newT);
        } catch {}
      }
    };

    window.addEventListener("form_theme_updated", onThemeUpdated);
    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener("form_theme_updated", onThemeUpdated);
      window.removeEventListener("storage", onStorageChange);
    };
  }, [slug]);

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
        const raw = res.data?.data;
        // Response baru: { form: {...formPayload}, soal: [...] }
        const formObj = raw?.form ? { ...flattenForm(raw.form), soal: raw.soal } : raw;
        setForm(formObj);
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
      const isTemplate = form?.status === "template";
      if (!needsToken && !tokenVerified) {
        if (!isTemplate) {
          // Form tidak butuh token — register ke backend supaya monitoring bisa tracking
          // Template tidak perlu register, backend tidak merekam jawaban template
          fetch(`${FORM_API_URL}/form/submit/check-token?form_slug=${slug}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: JSON.stringify({ token: null }),
          }).catch(() => {}); // fire-and-forget
        }
        setTokenVerified(true);
      }
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
      const clean = (empty.question || "Soal").replace(/<[^>]*>/g, "").replace(/\$[^$]*\$/g, "[rumus]").replace(/\\\([^)]*\\\)/g, "[rumus]").trim().slice(0, 60);
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
          jawaban.soal_option_id = a ?? null;
        } else if (soal.type === "checkbox") {
          jawaban.soal_option_id = Array.isArray(a) ? a : null;
        } else if (soal.type === "text") {
          jawaban.answer_text = typeof a === "string" ? a : (a ?? "");
        } else if (soal.type === "file") {
          if (a?.file) {
            jawaban.file_name = a.file.name;
            fd.append("files", a.file);
          }
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
  const primaryCat = (form?.primary_kategori ?? form?.category ?? "")?.toLowerCase();
  const isQuiz = primaryCat === "ujian" || primaryCat === "kuis" || form?.category?.toLowerCase() === "ujian" || form?.primary_kategori?.toLowerCase() === "ujian";

  // ── Flatten & group soal — harus di atas early returns (Rules of Hooks) ──
  const rawSoal  = form?.soal ?? [];
  const soalList = rawSoal.length > 0 && rawSoal[0]?.soal
    ? rawSoal.flatMap(p => p.soal ?? [])
    : rawSoal;

  // pageGroups di-memo — hanya dihitung ulang saat form berubah
  // Ini penting supaya shuffle tidak berulang saat user ketik (re-render)
  const pageGroups = useMemo(() => {
    if (!form) return [];

    const raw = form?.soal ?? [];
    const rFlat = raw.length > 0 && raw[0]?.soal ? raw : null;

    // Bangun pages untuk semua form (ujian maupun survei)
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

    if (pages.length === 0 && raw.length > 0) {
      pages = [{ page: 1, soal: raw }];
    }

    if (!form?.is_random) return pages;

    // Shuffle: halaman identitas (page 1) TIDAK diacak.
    // Soal lain diacak ANTAR halaman, bukan cuma di dalam halaman.
    // Soal dalam group_id yang sama bergerak bersama (urutan internal group tetap).
    function shuffleArr(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const firstPage = pages.slice(0, 1); // identitas, tidak diacak
    const restPages = pages.slice(1);

    // Ukuran tiap halaman (dipakai buat sebar balik hasil acak)
    const pageSizes = restPages.map((pg) => (pg.soal ?? []).length);

    // Kumpulkan semua soal non-identitas, kelompokkan per group_id
    const allRest = restPages.flatMap((pg) => pg.soal ?? []);
    const units = [];
    const groupMap = new Map();
    allRest.forEach((s) => {
      if (s.group_id != null) {
        if (!groupMap.has(s.group_id)) groupMap.set(s.group_id, []);
        groupMap.get(s.group_id).push(s);
      } else {
        units.push([s]);
      }
    });
    groupMap.forEach((group) => units.push(group));

    const shuffledFlat = shuffleArr(units).flat();

    // Sebar balik ke halaman sesuai ukuran aslinya
    const shuffledRest = [];
    let idx = 0;
    restPages.forEach((pg, i) => {
      const size = pageSizes[i];
      shuffledRest.push({ ...pg, soal: shuffledFlat.slice(idx, idx + size) });
      idx += size;
    });

    return [...firstPage, ...shuffledRest];
  }, [form?.soal, form?.is_random, form?.slug, form?.category]);

  const allSoal = soalList;

  // Cek apakah halaman pertama adalah halaman identitas murni (semua soal text tanpa skor)
  const page0Soal = (pageGroups[0]?.soal ?? []);
  const hasIdentityPage = isQuiz && page0Soal.length > 0 && page0Soal.every(s => s.type === "text" && (!s.score || Number(s.score) === 0));

  // Flat list semua soal dengan nomor global & indeks halaman
  const flatQuestions = useMemo(() => {
    const list = [];
    let num = 1;
    pageGroups.forEach((pg, pgIdx) => {
      if (hasIdentityPage && pgIdx === 0) return;
      (pg.soal ?? []).forEach((s) => {
        list.push({
          ...s,
          globalNum: num++,
          pageIdx: pgIdx,
          pageNum: pg.page ?? (pgIdx + 1),
        });
      });
    });
    return list;
  }, [pageGroups, hasIdentityPage]);

  function handleSelectQuestion(q) {
    if (currentIdx !== q.pageIdx) {
      setCurrentIdx(q.pageIdx);
      emitProgress(q.pageIdx, pageGroups, allSoal.length);
      setTimeout(() => {
        const el = soalRefs.current[q.id];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-[#1a4fa0]");
          setTimeout(() => el.classList.remove("ring-2", "ring-[#1a4fa0]"), 1500);
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 150);
    } else {
      const el = soalRefs.current[q.id];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-[#1a4fa0]");
        setTimeout(() => el.classList.remove("ring-2", "ring-[#1a4fa0]"), 1500);
      }
    }
  }

  // ── Manual Zoom Handlers ──
  function zoomIn()  { setZoomLevel(prev => Math.min(prev + 0.1, 3.0)); }
  function zoomOut() { setZoomLevel(prev => Math.max(prev - 0.1, 0.5)); }
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
      const raw2 = res.data?.data;
      const formObj2 = raw2?.form ? { ...flattenForm(raw2.form), soal: raw2.soal } : raw2;
      setForm(formObj2);
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
    <div data-theme="light" className="min-h-screen grid place-items-center" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Memuat form...</p>
      </div>
    </div>
  );

  /* ── Error ──────────────────────────────────────────── */
  if (error) return (
    <div data-theme="light" className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
      <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border border-[#e5eef7]">
        <FileQuestion size={30} className="mx-auto mb-3 text-gray-300" />
        <p className="font-bold text-gray-800 mb-1">Form tidak ditemukan</p>
        <p className="text-[14px] text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold" style={{ backgroundColor: "#1a4fa0" }}>Ke Beranda</button>
      </div>
    </div>
  );

  /* ── Start-at gate ─────────────────────────────────── */
  if (form && form.start_at && Number(form.start_at) > 0 && form.duration > 0) {
    const startMs   = Number(form.start_at);
    const endMs     = startMs + form.duration * 60 * 1000;
    const now       = Date.now();
    const alreadyIn = Boolean(sessionStorage.getItem(`timer_end_${slug}`));

    // Belum waktunya
    if (now < startMs) {
      const diffMs  = startMs - now;
      const h = Math.floor(diffMs / 3_600_000);
      const m = Math.floor((diffMs % 3_600_000) / 60_000);
      const s = Math.floor((diffMs % 60_000) / 1_000);
      const countdown = h > 0
        ? `${h} jam ${m} menit lagi`
        : m > 0
        ? `${m} menit ${s} detik lagi`
        : `${s} detik lagi`;
      return (
        <div data-theme="light" className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
          <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border border-[#e5eef7]">
            <AlarmClock size={36} className="mx-auto mb-3 text-[#1a4fa0]" />
            <h2 className="text-[18px] font-extrabold text-[#102f56] mb-1">Form Belum Dibuka</h2>
            <p className="text-[14px] text-gray-400 mb-2">Form ini akan dibuka pada:</p>
            <p className="text-[15px] font-bold text-[#1a4fa0] mb-4">
              {new Date(startMs).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
            </p>
            <p className="text-[13px] text-gray-400 mb-6">({countdown})</p>
            <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold" style={{ backgroundColor: "#1a4fa0" }}>Ke Beranda</button>
          </div>
        </div>
      );
    }

    // Sudah expired dan user belum mulai
    if (now > endMs && !alreadyIn) {
      return (
        <div data-theme="light" className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
          <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border border-[#e5eef7]">
            <AlarmClock size={36} className="mx-auto mb-3 text-gray-300" />
            <h2 className="text-[18px] font-extrabold text-[#102f56] mb-1">Waktu Pengerjaan Telah Berakhir</h2>
            <p className="text-[14px] text-gray-400 mb-6">Form ini sudah tidak bisa diakses.</p>
            <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold" style={{ backgroundColor: "#1a4fa0" }}>Ke Beranda</button>
          </div>
        </div>
      );
    }
  }

  /* ── Timed out — tampil layar waktu habis, submit di background ── */
  if (autoSubmitting || (timedOut && !done)) return (
    <div data-theme="light" className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
      <div className="rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm w-full text-center border"
        style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
        <AlarmClock size={44} className="mx-auto mb-4 text-gray-300" />
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
    <div data-theme="light" className="min-h-screen grid place-items-center px-4" style={{ backgroundColor: theme.bg || "var(--fm-bg)" }}>
      <div className="rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border"
        style={{ backgroundColor: theme.cardBg || "#ffffff", borderColor: theme.borderCard || "#e5eef7" }}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 text-green-600 grid place-items-center">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-[19px] font-extrabold mb-1" style={{ color: theme.titleColor || "#102f56" }}>Jawaban terkirim</h2>
        <p className="text-[14px] mb-6" style={{ color: theme.descColor || "#64779d" }}>Terima kasih, jawabanmu sudah tercatat.</p>
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-xl text-[14px] font-semibold shadow-md transition hover:opacity-90"
          style={{ backgroundColor: theme.primaryColor || "#1a4fa0", color: theme.primaryText || "#ffffff" }}
        >
          Kembali ke Beranda
        </button>
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
    <div data-theme="light" className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,var(--fm-bg) 0%,var(--fm-bg-2) 60%,var(--fm-bg-3) 100%)" }}>
      <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-8 w-full max-w-sm border border-[#e5eef7] text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center"><LockKeyhole size={22} className="text-blue-500" /></div>
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

    // Page 1 = halaman identitas hanya jika memang halaman identitas murni
    const isIdentityPage = currentIdx === 0 && hasIdentityPage;

    function goNext() {
      // Hanya validasi jika berada di halaman identitas murni (Nama/Kelas)
      if (isIdentityPage) {
        let reqMap = {};
        try { const s = localStorage.getItem(`soal_required_${slug}`); if (s) reqMap = JSON.parse(s); } catch {}
        const isReq = (s) => reqMap[s.id] !== undefined ? reqMap[s.id] : true;
        const unanswered = (currPage.soal ?? []).find(s => isReq(s) && !hasAnswer(s));
        if (unanswered) {
          const clean = (unanswered.question || "Identitas").replace(/<[^>]*>/g, "").replace(/\$[^$]*\$/g, "[rumus]").replace(/\\\([^)]*\\\)/g, "[rumus]").trim().slice(0, 60);
          setSubmitError(`Kolom "${clean}" wajib diisi sebelum melanjutkan.`);
          return;
        }
      }
      setSubmitError("");
      setErrorSoalId(null);
      setCurrentIdx(i => {
        const next = Math.min(i + 1, totalPages - 1);
        emitProgress(next, pageGroups, allSoal.length);
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function goPrev() {
      setSubmitError("");
      setErrorSoalId(null);
      setCurrentIdx(i => {
        const next = Math.max(i - 1, 0);
        emitProgress(next, pageGroups, allSoal.length);
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Hitung status ringkasan untuk navigasi kuis
    const totalQCount       = flatQuestions.length;
    const quizAnsweredCount = flatQuestions.filter(s => hasAnswer(s)).length;
    const doubtCount        = flatQuestions.filter(s => doubtfulIds.has(s.id)).length;

    return (
      <div data-theme="light" className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: theme.bg || "var(--fm-bg)" }}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 backdrop-blur border-b px-4 py-3 transition-colors"
          style={{ backgroundColor: theme.cardBg || "var(--fm-card)", borderColor: theme.borderCard || "#e5eef7" }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2.5">
              {/* Kiri: Judul formulir (tanpa tombol kembali) */}
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: theme.accentColor || "#1a4fa0" }} />
                <span className="font-bold text-[14px] truncate" style={{ color: theme.titleColor || "#102f56" }}>
                  {title}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider shrink-0"
                  style={{ backgroundColor: `${theme.accentColor || "#1a4fa0"}15`, color: theme.accentColor || "#1a4fa0" }}>
                  {form?.category || "Ujian"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Zoom controls — hanya desktop (md ke atas) */}
                <div className="hidden md:flex items-center gap-1.5">
                  <button onClick={zoomOut} className="p-1.5 rounded-lg border transition-all" title="Zoom Out"
                    style={{ borderColor: theme.borderCard || "#d0e3f5", backgroundColor: theme.cardBg || "#ffffff" }}>
                    <ZoomOut size={14} style={{ color: theme.descColor || "#64779d" }} />
                  </button>
                  <button onClick={resetZoom} title="Reset zoom ke 100%" className="px-2 py-1.5 rounded-lg border transition-all text-[11px] font-bold tabular-nums min-w-[44px]"
                    style={{ borderColor: theme.borderCard || "#d0e3f5", backgroundColor: theme.cardBg || "#ffffff", color: theme.primaryColor || "#1a4fa0" }}>
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button onClick={zoomIn} className="p-1.5 rounded-lg border transition-all" title="Zoom In"
                    style={{ borderColor: theme.borderCard || "#d0e3f5", backgroundColor: theme.cardBg || "#ffffff" }}>
                    <ZoomIn size={14} style={{ color: theme.descColor || "#64779d" }} />
                  </button>
                  <button onClick={refreshForm} disabled={refreshing} className="p-1.5 rounded-lg border transition-all disabled:opacity-60" title="Muat ulang soal"
                    style={{ borderColor: theme.borderCard || "#d0e3f5", backgroundColor: theme.cardBg || "#ffffff" }}>
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ color: theme.descColor || "#64779d" }} />
                  </button>
                </div>

                {/* Timer */}
                {timeLeft !== null && <TimerBadge timeLeft={timeLeft} />}

                {/* Tombol Navigasi Soal — selalu ada di mode kuis */}
                <SoalIndicatorBtn
                  flatQuestions={flatQuestions}
                  hasIdentityPage={hasIdentityPage}
                  answers={answers}
                  hasAnswer={hasAnswer}
                  doubtfulIds={doubtfulIds}
                  currentIdx={currentIdx}
                  onSelectQuestion={handleSelectQuestion}
                  onGoIdentity={() => { setCurrentIdx(0); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  theme={theme}
                />
              </div>
            </div>

            {/* Progress Section */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[12px] font-semibold mb-1.5">
                <div className="flex items-center gap-1.5" style={{ color: theme.titleColor || "#102f56" }}>
                  <span>Halaman {currentIdx + 1} dari {totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-normal">{quizAnsweredCount} dijawab</span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] border"
                    style={{ backgroundColor: `${theme.accentColor || "#1a4fa0"}15`, color: theme.accentColor || "#1a4fa0", borderColor: `${theme.accentColor || "#1a4fa0"}30` }}>
                    {Math.round(totalQCount > 0 ? (quizAnsweredCount / totalQCount) * 100 : progress)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden p-[1px] shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{
                    width: `${Math.min(100, Math.max(3, totalQCount > 0 ? (quizAnsweredCount / totalQCount) * 100 : progress))}%`,
                    backgroundColor: theme.accentColor || "#1a4fa0",
                    boxShadow: `0 1px 4px ${theme.accentColor || "#1a4fa0"}50`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full transition-transform duration-200 origin-top" style={{ transform: `scale(${zoomLevel})` }}>
          {bannerUrl && (
            <div className="mb-4 w-full">
              <img src={bannerUrl} alt="Banner" className="w-full max-h-72 object-contain rounded-2xl border shadow-sm bg-white" style={{ borderColor: theme.borderCard || "#e5eef7" }} />
            </div>
          )}
          {liveNotice && (
            <div className="mb-4 px-4 py-3 rounded-xl text-white text-[14px] font-semibold flex items-center gap-3 shadow-lg" style={{ backgroundColor: theme.primaryColor || "#1a4fa0" }}>
              <Bell size={18} /><span>{liveNotice}</span>
            </div>
          )}
          {/* Notice template — tidak bisa disubmit */}
          {form?.status === "template" && (
            <div className="mb-4 px-4 py-3 rounded-xl text-[14px] font-semibold flex items-center gap-3 shadow-lg bg-amber-50 border border-amber-200 text-amber-700">
              <span>📋</span>
              <span>Ini adalah <strong>Template Soal</strong> — jawaban tidak akan direkam. Kamu hanya bisa melihat soalnya.</span>
            </div>
          )}

          {/* Form title (halaman pertama saja) */}
          {currentIdx === 0 && (
            <div className="rounded-2xl border shadow-sm p-6 mb-4" style={{ backgroundColor: theme.cardBg || "#ffffff", borderColor: theme.borderCard || "#e5eef7" }}>
              <h1 className="text-[20px] font-extrabold leading-snug" style={{ color: theme.titleColor || "#102f56" }}>{title}</h1>
              <p className="mt-1 text-[13px]" style={{ color: theme.descColor || "#64779d" }}>{form?.category}</p>
            </div>
          )}

        {/* Semua soal di halaman ini */}
          {(currPage.soal ?? []).map((soal, idx) => {
            // Page identitas: nomor lokal. Page soal: posisi global setelah shuffle
            const displayNum = isIdentityPage
              ? idx
              : pageGroups.slice(hasIdentityPage ? 1 : 0, currentIdx).reduce((sum, pg) => sum + (pg.soal?.length ?? 0), 0) + idx;
            const isDoubt = doubtfulIds.has(soal.id);
            // Tampilkan group header jika soal ini punya group_text dan soal sebelumnya beda group
            const prevSoal = idx > 0 ? (currPage.soal ?? [])[idx - 1] : null;
            const showGroupHeader = soal.group_id != null && soal.group_text &&
              (!prevSoal || prevSoal.group_id !== soal.group_id);
            return (
              <div key={soal.id ?? idx}>
                {/* Group bacaan header */}
                {showGroupHeader && (
                  <div className="mb-4 rounded-2xl border border-[#d4e5fa] overflow-hidden"
                    style={{ backgroundColor: "var(--fm-card)" }}>
                    <div className="px-4 py-2 bg-[#eef5fb] border-b border-[#d4e5fa] flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1a4fa0] uppercase tracking-wider"><FileText size={12} /> Bacaan</span>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--fm-text)" }}>
                        {soal.group_text}
                      </p>
                    </div>
                  </div>
                )}
                <SoalItem
                  soal={soal}
                  idx={displayNum}
                  answers={answers}
                  setAnswer={setAnswer}
                  toggleOption={toggleOption}
                  errorSoalId={errorSoalId}
                  soalRefs={soalRefs}
                  theme={theme}
                />
                {/* Tombol ragu-ragu — hanya untuk page soal, bukan identitas */}
                {!isIdentityPage && (
                <div className="flex justify-end mb-4 -mt-2 pr-1">
                  <button onClick={() => toggleDoubt(soal.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition ${
                      isDoubt
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"
                    }`}
                    style={!isDoubt ? { backgroundColor: theme.cardBg || "#ffffff" } : {}}>
                    <Flag size={13} /> {isDoubt ? "Ragu-ragu" : "Tandai ragu-ragu"}
                  </button>
                </div>
                )}
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
                className="py-3 px-5 rounded-xl border text-[14px] font-semibold hover:bg-black/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ borderColor: theme.borderCard || "#e5eef7", color: theme.descColor || "#64779d", backgroundColor: theme.cardBg || "#ffffff" }}>
                <ArrowLeft size={16} /> <span>Sebelumnya</span>
              </button>
            )}
            {!isLast ? (
              <button onClick={goNext}
                className="flex-1 py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md"
                style={{ backgroundColor: theme.primaryColor || "#1a4fa0", color: theme.primaryText || "#ffffff" }}>
                {isIdentityPage ? "Mulai Mengerjakan →" : <><span>Selanjutnya</span> <ArrowRight size={16} /></>}
              </button>
            ) : (
              form?.status === "template"
              ? <div className="flex-1 py-3 rounded-xl text-[14px] font-semibold flex items-center justify-center text-amber-700 bg-amber-50 border border-amber-200">
                  📋 Template — jawaban tidak direkam
                </div>
              : <button onClick={submit} disabled={submitting}
                className="flex-1 py-3 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition shadow-md"
                style={{ backgroundColor: theme.primaryColor || "#1a4fa0", color: theme.primaryText || "#ffffff" }}>
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
    setCurrentIdx(i => {
      const next = Math.min(i + 1, totalPagesS - 1);
      emitProgress(next, pageGroups, allSoal.length);
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goPrevS() {
    setErrorSoalId(null);
    setCurrentIdx(i => {
      const next = Math.max(i - 1, 0);
      emitProgress(next, pageGroups, allSoal.length);
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div data-theme="light" className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: theme.bg || "var(--fm-bg)" }}>
      {/* Top bar survey */}
      <div className="sticky top-0 z-10 backdrop-blur border-b px-4 py-3"
        style={{ backgroundColor: theme.cardBg || "white", borderColor: theme.borderCard || "#e5eef7" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {/* Kiri: Judul formulir */}
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: theme.accentColor || "#1a4fa0" }} />
              <span className="font-bold text-[14px] truncate" style={{ color: theme.titleColor || "#102f56" }}>
                {title}
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider shrink-0"
                style={{ backgroundColor: `${theme.accentColor || "#1a4fa0"}15`, color: theme.accentColor || "#1a4fa0" }}>
                {form?.category || "Survei"}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Halaman info */}
              {totalPagesS > 1 && (
                <span className="text-[12px] font-semibold" style={{ color: theme.descColor || "#64779d" }}>
                  {currentIdx + 1}/{totalPagesS}
                </span>
              )}

              {/* Zoom — hanya desktop */}
              <div className="hidden md:flex items-center gap-1.5">
                <button onClick={zoomOut} className="p-1.5 rounded-lg border transition-all" title="Zoom Out"
                  style={{ borderColor: theme.borderCard || "#d0e3f5", backgroundColor: theme.cardBg || "#ffffff" }}>
                  <ZoomOut size={14} style={{ color: theme.descColor || "#64779d" }} />
                </button>
                <button onClick={resetZoom} title="Reset zoom" className="px-2 py-1.5 rounded-lg border transition-all text-[11px] font-bold tabular-nums min-w-[44px]"
                  style={{ borderColor: theme.borderCard || "#d0e3f5", backgroundColor: theme.cardBg || "#ffffff", color: theme.primaryColor || "#1a4fa0" }}>
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button onClick={zoomIn} className="p-1.5 rounded-lg border transition-all" title="Zoom In"
                  style={{ borderColor: theme.borderCard || "#d0e3f5", backgroundColor: theme.cardBg || "#ffffff" }}>
                  <ZoomIn size={14} style={{ color: theme.descColor || "#64779d" }} />
                </button>
                <button onClick={refreshForm} disabled={refreshing} className="p-1.5 rounded-lg border transition-all disabled:opacity-60" title="Refresh"
                  style={{ borderColor: theme.borderCard || "#d0e3f5", backgroundColor: theme.cardBg || "#ffffff" }}>
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ color: theme.descColor || "#64779d" }} />
                </button>
              </div>

              {timeLeft !== null && <TimerBadge timeLeft={timeLeft} />}

              {/* Navigasi Soal */}
              {flatQuestions.length > 0 && (
                <SoalIndicatorBtn
                  flatQuestions={flatQuestions}
                  hasIdentityPage={false}
                  answers={answers}
                  hasAnswer={hasAnswer}
                  doubtfulIds={doubtfulIds}
                  currentIdx={currentIdx}
                  onSelectQuestion={handleSelectQuestion}
                  onGoIdentity={() => { setCurrentIdx(0); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  theme={theme}
                />
              )}
            </div>
          </div>
          {totalPagesS > 1 && (
            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressS}%`, backgroundColor: theme.accentColor || "#1a4fa0" }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full transition-transform duration-200 origin-top" style={{ transform: `scale(${zoomLevel})` }}>
        {bannerUrl && (
          <div className="mb-4 w-full">
            <img src={bannerUrl} alt="Banner" className="w-full max-h-72 object-contain rounded-2xl border shadow-sm bg-white" style={{ borderColor: theme.borderCard || "#e5eef7" }} />
          </div>
        )}
        {liveNotice && (
          <div className="mb-4 px-4 py-3 rounded-xl text-white text-[14px] font-semibold flex items-center gap-3 shadow-lg" style={{ backgroundColor: theme.primaryColor || "#1a4fa0" }}>
            <Bell size={18} /><span>{liveNotice}</span>
          </div>
        )}

        {/* Form header (halaman pertama) */}
        {currentIdx === 0 && (
          <div className="rounded-2xl border shadow-sm p-7 mb-5" style={{ backgroundColor: theme.cardBg || "#ffffff", borderColor: theme.borderCard || "#e5eef7" }}>
            <h1 className="text-[24px] font-extrabold tracking-tight leading-snug" style={{ color: theme.titleColor || "#102f56" }}>{title}</h1>
            <p className="mt-1 text-[13.5px]" style={{ color: theme.descColor || "#64779d" }}>{form?.category}</p>
          </div>
        )}

        {/* Soal di halaman ini */}
        {(currPageS.soal ?? []).map((soal, qi) => {
          // Calculate cumulative question number for survey mode - ensure unique numbers
          const prevPagesSoalCount = pageGroups.slice(0, currentIdx).reduce((sum, pg) => sum + (pg.soal?.length || 0), 0);
          const displayNum = prevPagesSoalCount + qi;

          const isError = errorSoalId === soal.id;
          const isDoubt = doubtfulIds.has(soal.id);
          // Group header
          const prevSoalS = qi > 0 ? (currPageS.soal ?? [])[qi - 1] : null;
          const showGroupHeaderS = soal.group_id != null && soal.group_text &&
            (!prevSoalS || prevSoalS.group_id !== soal.group_id);
          return (
            <div key={soal.id ?? qi}>
              {/* Group bacaan header */}
              {showGroupHeaderS && (
                <div className="mb-4 rounded-2xl border border-[#d4e5fa] overflow-hidden"
                  style={{ backgroundColor: "var(--fm-card)" }}>
                  <div className="px-4 py-2 bg-[#eef5fb] border-b border-[#d4e5fa] flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1a4fa0] uppercase tracking-wider"><FileText size={12} /> Bacaan</span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--fm-text)" }}>
                      {soal.group_text}
                    </p>
                  </div>
                </div>
              )}
            <div ref={el => { if (el) soalRefs.current[soal.id] = el; }}
              className={`rounded-2xl border shadow-sm p-6 mb-4 transition-all ${isError ? "border-red-400 ring-2 ring-red-100" : ""}`}
              style={{ backgroundColor: theme.cardBg || "var(--fm-card)", borderColor: isError ? undefined : (theme.borderCard || "var(--fm-card-border)") }}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-9 h-9 rounded-xl text-[14px] font-extrabold grid place-items-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${theme.accentColor || "#1a4fa0"}15`, color: theme.accentColor || "#1a4fa0" }}>
                    {displayNum + 1}
                  </span>
                <div className="flex-1 min-w-0">
                  <RichTextDisplay content={soal.question} className="text-[16px] font-bold leading-snug" style={{ color: theme.titleColor || "#102f56" }} />
                  <span className="text-[12px] font-medium block mt-1" style={{ color: theme.accentColor || "#1a4fa0" }}>{TYPE_LABEL[soal.type] ?? soal.type}</span>
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
                  <p className="text-[12px] font-bold text-purple-700 mb-2 flex items-center gap-1.5"><Music size={13} /> Audio Soal</p>
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
                          selected ? "shadow-xs" : "hover:border-black/20"
                        }`}
                        style={{
                          borderColor: selected ? (theme.accentColor || "#1a4fa0") : (theme.borderCard || "#e2e9f1"),
                          backgroundColor: selected ? `${theme.accentColor || "#1a4fa0"}10` : (theme.cardBg || "#ffffff")
                        }}
                      >
                        <span className={`inline-grid place-items-center shrink-0 border-2 transition-all mt-0.5 ${soal.type === "checkbox" ? "w-6 h-6 rounded-[8px]" : "w-6 h-6 rounded-full"}`}
                          style={{
                            borderColor: selected ? (theme.accentColor || "#1a4fa0") : "#94a3b8",
                            backgroundColor: selected ? (theme.accentColor || "#1a4fa0") : (theme.cardBg || "#f1f5f9")
                          }}
                        >
                          {selected && (soal.type === "checkbox"
                            ? <Check size={15} strokeWidth={3} className="text-white" />
                            : <span className="w-3 h-3 rounded-full bg-white" />)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <RichTextDisplay content={opt.value?.trim() || opt.option_value?.trim() || `Opsi ${oi + 1}`} className="text-[15px] font-medium" style={{ color: theme.titleColor || "#102f56" }} />
                          {optImage && (
                            <img src={optImage} alt={fallbackLabel(opt, oi)}
                              className="mt-2.5 max-h-60 max-w-full rounded-xl object-contain mx-auto block"
                              onError={e => { e.target.style.display = "none"; }} />
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
                  className={getInputCls(theme)}
                  style={{
                    borderColor: theme.borderCard || "#dbe5f0",
                    backgroundColor: theme.cardBg || "#ffffff",
                    color: theme.titleColor || "#102f56",
                    caretColor: theme.accentColor || "#1a4fa0",
                  }} />
              )}
              {soal.type === "file" && (
                <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all"
                  style={{ borderColor: theme.borderCard || "#c3d4e4", backgroundColor: `${theme.cardBg || "#f7fafd"}` }}>
                  {answers[soal.id]?.file
                    ? <><FileText size={28} style={{ color: theme.accentColor || "#1a4fa0" }} /><span className="text-[14px] font-semibold" style={{ color: theme.titleColor || "#102f56" }}>{answers[soal.id].file.name}</span></>
                    : <><UploadCloud size={28} style={{ color: theme.accentColor || "#1a4fa0" }} /><span className="text-[14px] font-semibold" style={{ color: theme.titleColor || "#102f56" }}>Unggah file jawaban</span></>}
                  <input type="file" className="hidden" onChange={e => setAnswer(soal.id, { file: e.target.files?.[0] })} />
                </label>
              )}
              {/* Tombol ragu-ragu */}
              <div className="flex justify-end mt-3">
                <button onClick={() => toggleDoubt(soal.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition ${
                    isDoubt ? "bg-amber-50 border-amber-300 text-amber-700" : "border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"
                  }`}
                  style={!isDoubt ? { backgroundColor: theme.cardBg || "#ffffff" } : {}}>
                  <Flag size={13} /> {isDoubt ? "Ragu-ragu" : "Tandai ragu-ragu"}
                </button>
              </div>
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
              className="py-3 px-4 rounded-xl border text-[14px] font-semibold hover:bg-black/5 transition flex items-center justify-center"
              style={{ borderColor: theme.borderCard || "#e5eef7", color: theme.descColor || "#64779d", backgroundColor: theme.cardBg || "#ffffff" }}>
              <ArrowLeft size={18} />
            </button>
          )}
          {!isLastS ? (
            <button onClick={goNextS}
              className="flex-1 py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md"
              style={{ backgroundColor: theme.primaryColor || "#1a4fa0", color: theme.primaryText || "#ffffff" }}>
            Selanjutnya <ArrowRight size={16} />
          </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="w-full py-3.5 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition shadow-md"
              style={{ backgroundColor: theme.primaryColor || "#1a4fa0", color: theme.primaryText || "#ffffff" }}>
              <Send size={17} /> {submitting ? "Mengirim..." : "Kirim Jawaban"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── SoalItem — komponen soal untuk quiz mode ───────────────── */
function SoalItem({ soal, idx, answers, setAnswer, toggleOption, errorSoalId, soalRefs, theme = DEFAULT_FORM_THEME }) {
  const isError = errorSoalId === soal.id;
  return (
    <div ref={el => { if (el) soalRefs.current[soal.id] = el; }}
      className={`rounded-2xl border shadow-sm p-6 mb-4 transition-all overflow-hidden ${isError ? "border-red-400 ring-2 ring-red-100" : ""}`}
      style={{ backgroundColor: theme.cardBg || "var(--fm-card)", borderColor: isError ? undefined : (theme.borderCard || "var(--fm-card-border)") }}>
      <div className="flex items-start gap-3 mb-5">
        <span className="w-9 h-9 rounded-xl text-[14px] font-extrabold grid place-items-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${theme.accentColor || "#1a4fa0"}15`, color: theme.accentColor || "#1a4fa0" }}>
          {idx + 1}
        </span>
        <div className="flex-1 min-w-0 overflow-hidden">
          <RichTextDisplay content={soal.question} className="text-[16px] font-bold leading-snug" style={{ color: theme.titleColor || "#102f56" }} />
          <span className="text-[12px] font-medium block mt-1" style={{ color: theme.accentColor || "#1a4fa0" }}>{TYPE_LABEL[soal.type] ?? soal.type}</span>
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
          <p className="text-[12px] font-bold text-purple-700 mb-2 flex items-center gap-1.5"><Music size={13} /> Audio Soal</p>
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
                  selected ? "shadow-xs" : "hover:border-black/20"
                }`}
                style={{
                  borderColor: selected ? (theme.accentColor || "#1a4fa0") : (theme.borderCard || "#e2e9f1"),
                  backgroundColor: selected ? `${theme.accentColor || "#1a4fa0"}10` : (theme.cardBg || "#ffffff")
                }}
              >
                <span className={`inline-grid place-items-center shrink-0 border-2 transition-all mt-0.5 ${
                  soal.type === "checkbox" ? "w-6 h-6 rounded-[8px]" : "w-6 h-6 rounded-full"
                }`}
                  style={{
                    borderColor: selected ? (theme.accentColor || "#1a4fa0") : "#94a3b8",
                    backgroundColor: selected ? (theme.accentColor || "#1a4fa0") : (theme.cardBg || "#f1f5f9")
                  }}
                >
                  {selected && (soal.type === "checkbox"
                    ? <Check size={15} strokeWidth={3} className="text-white" />
                    : <span className="w-3 h-3 rounded-full bg-white" />)}
                </span>
                <div className="flex-1 min-w-0">
                  <RichTextDisplay content={opt.value?.trim() || opt.option_value?.trim() || `Opsi ${oi + 1}`} className="text-[15px] font-medium" style={{ color: theme.titleColor || "#102f56" }} />
                  {optImage && (
                    <img src={optImage} alt={fallbackLabel(opt, oi)}
                      className="mt-2.5 max-h-60 max-w-full rounded-xl object-contain mx-auto block"
                      onError={e => { e.target.style.display = "none"; }} />
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
          className={getInputCls(theme)}
          style={{
            borderColor: theme.borderCard || "#dbe5f0",
            backgroundColor: theme.cardBg || "#ffffff",
            color: theme.titleColor || "#102f56",
            caretColor: theme.accentColor || "#1a4fa0",
          }}
        />
      )}
      {soal.type === "file" && (
        <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all"
          style={{ borderColor: theme.borderCard || "#c3d4e4", backgroundColor: theme.cardBg || "#f7fafd" }}>
          {answers[soal.id]?.file
            ? <><FileText size={28} style={{ color: theme.accentColor || "#1a4fa0" }} /><span className="text-[14px] font-semibold" style={{ color: theme.titleColor || "#102f56" }}>{answers[soal.id].file.name}</span></>
            : <><UploadCloud size={28} style={{ color: theme.accentColor || "#1a4fa0" }} /><span className="text-[14px] font-semibold" style={{ color: theme.titleColor || "#64779d" }}>Unggah file jawaban</span></>}
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

/* ── Soal Indicator Button + Modal (Navigasi Soal) ─────────── */
function SoalIndicatorBtn({
  flatQuestions = [],
  hasIdentityPage = false,
  answers = {},
  hasAnswer = () => false,
  doubtfulIds = new Set(),
  currentIdx = 0,
  onSelectQuestion = () => {},
  onGoIdentity = () => {},
  theme = DEFAULT_FORM_THEME
}) {
  const [open, setOpen] = useState(false);
  const total = flatQuestions.length;
  const answeredCount = flatQuestions.filter(s => hasAnswer(s)).length;
  const doubtCount = flatQuestions.filter(s => doubtfulIds.has(s.id)).length;
  const unanswered = Math.max(0, total - answeredCount);
  const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const isDark = Boolean(
    theme?.id === "dark" ||
    (theme?.cardBg && (
      theme.cardBg === "#1e293b" || 
      theme.cardBg === "#0f172a" ||
      theme.cardBg === "#111827" ||
      theme.cardBg === "#18181b"
    ))
  );

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 shadow-xs font-semibold text-[13px] shrink-0 cursor-pointer"
        style={{
          borderColor: theme.borderCard || "#d0e3f5",
          backgroundColor: theme.cardBg || "#ffffff",
          color: theme.primaryColor || "#1a4fa0",
        }}
        title="Buka Navigasi Soal"
      >
        <ListChecks size={15} />
        <span className="font-bold"> Soal</span>
        <span className="text-[11px] font-normal opacity-75">
          ({answeredCount}/{total})
        </span>

        {doubtCount > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold flex items-center justify-center leading-none">
            {doubtCount}
          </span>
        )}
      </button>

      {/* Modal overlay */}
      {open && createPortal(
        <div
          data-theme={isDark ? "dark" : "light"}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center animate-fadeIn"
          style={{ background: "rgba(5,20,50,0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className={`w-full sm:w-[480px] rounded-t-[28px] sm:rounded-2xl shadow-[0_24px_60px_rgba(5,20,50,0.25)] overflow-hidden flex flex-col border ${
              isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#e5eef7] text-slate-800"
            }`}
            style={{ maxHeight: "88dvh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
              <div className={`w-9 h-[5px] rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
            </div>

            {/* Header */}
            <div className={`flex items-start justify-between px-5 pt-4 pb-2 shrink-0 border-b ${isDark ? "border-slate-800" : "border-gray-100"}`}>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[17px] leading-tight tracking-tight flex items-center gap-2"
                  style={{ color: isDark ? "#ffffff" : (theme.titleColor || "#102f56") }}>
                  <ListChecks size={18} style={{ color: theme.primaryColor || "#1a4fa0" }} />
                  Navigasi Soal
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  <span className={`text-[12.5px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <span className="font-bold" style={{ color: theme.primaryColor || "#1a4fa0" }}>{answeredCount}</span>
                    <span className="opacity-40 mx-0.5">/</span>
                    {total} dijawab
                  </span>
                  {doubtCount > 0 && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                      isDark
                        ? "bg-amber-950/40 border-amber-800 text-amber-300"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>
                      <Flag size={11} /> {doubtCount} ragu-ragu
                    </span>
                  )}
                  {unanswered > 0 && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                      isDark
                        ? "bg-slate-800 border-slate-700 text-slate-300"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}>
                      ○ {unanswered} belum
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className={`ml-3 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[17px] font-bold transition-colors cursor-pointer ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                }`}
                aria-label="Tutup navigasi soal"
              >×</button>
            </div>

            {/* Progress bar */}
            <div className="mx-5 mt-3 mb-2 shrink-0">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[11px] font-medium ${isDark ? "text-gray-400" : "text-gray-400"}`}>Progress Pengerjaan</span>
                <span className="text-[11px] font-bold" style={{ color: theme.primaryColor || "#1a4fa0" }}>{pct}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.primaryColor || "#1a4fa0"}, #3b82f6)` }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className={`flex items-center gap-3 px-5 py-2 shrink-0 text-[11px] border-b ${
              isDark ? "text-gray-400 border-slate-800" : "text-gray-500 border-gray-100"
            }`}>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3.5 h-3.5 rounded-[4px] inline-block shrink-0" style={{ backgroundColor: theme.primaryColor || "#1a4fa0" }} />
                Dijawab
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-3.5 h-3.5 rounded-[4px] border inline-block shrink-0 ${
                  isDark ? "bg-amber-950/60 border-amber-500" : "bg-amber-100 border-amber-400"
                }`} />
                Ragu-ragu
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-3.5 h-3.5 rounded-[4px] border inline-block shrink-0 ${
                  isDark ? "bg-slate-800 border-slate-600" : "bg-white border-gray-300"
                }`} />
                Belum
              </span>
            </div>

            {/* Identity page button if exists */}
            {hasIdentityPage && (
              <div className="px-5 pt-3 pb-1 shrink-0">
                <button
                  onClick={() => {
                    onGoIdentity();
                    setOpen(false);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-[12px] font-semibold border flex items-center justify-between transition-colors cursor-pointer ${
                    currentIdx === 0
                      ? isDark
                        ? "bg-blue-950/40 border-blue-500 text-blue-300"
                        : "bg-[#eef5fb] border-[#1a4fa0] text-[#1a4fa0]"
                      : isDark
                        ? "bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} /> Halaman Identitas (Nama & Kelas)
                  </span>
                  <span className="text-[10px] font-bold opacity-60">Page 1 →</span>
                </button>
              </div>
            )}

            {/* Soal Grid */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
                {flatQuestions.map((q) => {
                  const answered = hasAnswer(q);
                  const doubt = doubtfulIds.has(q.id);
                  const isCurrentPage = q.pageIdx === currentIdx;

                  let itemClass = "";
                  let itemStyle = {};

                  if (doubt) {
                    itemClass = isDark
                      ? "bg-amber-950/50 border-amber-400 text-amber-200 hover:bg-amber-900/60"
                      : "bg-amber-50 border-amber-400 text-amber-800 hover:bg-amber-100";
                  } else if (answered) {
                    itemClass = "text-white hover:opacity-95 shadow-xs";
                    itemStyle = {
                      backgroundColor: theme.primaryColor || "#1a4fa0",
                      borderColor: theme.primaryColor || "#1a4fa0",
                    };
                  } else if (isCurrentPage) {
                    itemClass = isDark
                      ? "bg-blue-950/40 border-blue-400 text-blue-300 ring-2 ring-blue-500/25"
                      : "bg-[#eef5fb] border-[#1a4fa0] text-[#1a4fa0] ring-2 ring-[#1a4fa0]/25";
                  } else {
                    itemClass = isDark
                      ? "bg-slate-800 border-slate-700 text-gray-200 hover:border-blue-400 hover:text-blue-300 hover:bg-slate-750"
                      : "bg-white border-gray-200 text-gray-700 hover:border-[#1a4fa0] hover:text-[#1a4fa0] hover:bg-[#f0f6fe]";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        onSelectQuestion(q);
                        setOpen(false);
                      }}
                      title={`Soal ${q.globalNum}${doubt ? " — ragu-ragu" : answered ? " — sudah dijawab" : " — belum dijawab"}`}
                      className={`h-11 rounded-xl text-[14px] font-extrabold border-2 transition-all active:scale-90 focus:outline-none flex flex-col items-center justify-center relative cursor-pointer ${itemClass}`}
                      style={itemStyle}
                    >
                      <span>{q.globalNum}</span>
                      {doubt && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[7px] shadow-xs">
                          <Flag size={7} fill="currentColor" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className={`px-5 pt-3 pb-5 border-t shrink-0 ${isDark ? "border-slate-800" : "border-gray-100"}`}>
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl text-white text-[14px] font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                style={{ backgroundColor: theme.primaryColor || "#1a4fa0" }}
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
