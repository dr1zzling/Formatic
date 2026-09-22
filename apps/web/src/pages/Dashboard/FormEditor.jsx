import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import api, { FORM_API_URL, flattenForm } from "../../utils/api";
import AlertModal from "../../components/AlertModal";
import * as XLSX from "xlsx";
import { socket } from "../../utils/socket";
import { ArrowLeft, Link2, Trash2, Plus, Copy, Share2, Check, ListPlus, ListChecks, FileQuestion, FileText, UploadCloud, GripVertical, ImagePlus, X, QrCode, Download, Palette, Info, BookOpen, ChevronRight, IdCard, Paperclip, Lightbulb, AlertTriangle, Music, LockKeyhole, Target, Star, Inbox, Users, CheckCircle2, Clock, PieChart, Dices, PenLine, Save, RefreshCw, Timer, Trophy, Shuffle, Layers, Unlink, FileDown } from "lucide-react";
import QRCode from "qrcode";
import QuillEditor from "../../components/QuillEditor";
import OptionQuillEditor from "../../components/OptionQuillEditor";
import RichTextDisplay from "../../components/RichTextDisplay";
import Toast, { useToast } from "../../components/Toast";
import ThemeSettingsTab from "./ThemeSettingsTab";
import { getStoredTheme, setStoredTheme, DEFAULT_FORM_THEME } from "../../utils/theme";
import { applyBulkGroup, removeBulkGroup } from "../../utils/grouping";

const QUESTION_TYPES = [
  { value: "radio",    label: "Pilihan Ganda" },
  { value: "checkbox", label: "Kotak Centang" },
  { value: "text",     label: "Jawaban Singkat" },
  { value: "file",     label: "Unggah File" },
];
const TABS = ["Pertanyaan", "Jawaban", "Tema", "Setelan"];

export default function FormEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [form, setForm]             = useState(null);
  const [questions, setQuestions]           = useState([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);
  const [activeTab, setActiveTab]           = useState("Pertanyaan");
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");
  const { toast, showToast }                = useToast();
  const [showDelete, setShowDelete]         = useState(false);
  const [collabNotice, setCollabNotice]     = useState("");
  const [userRole, setUserRole]             = useState(null); // "Creator" | "Collaborator"
  const [showQr, setShowQr]                 = useState(false);
  const [theme, setTheme]                   = useState(() => getStoredTheme(slug) || DEFAULT_FORM_THEME);
  const isSavingRef = useRef(false);

  useEffect(() => {
    const savedTheme = getStoredTheme(slug);
    if (savedTheme) setTheme(savedTheme);
  }, [slug]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setStoredTheme(slug, newTheme);
    showToast("Tema formulir diperbarui!");
  };

  const handleResetTheme = () => {
    setTheme(DEFAULT_FORM_THEME);
    setStoredTheme(slug, DEFAULT_FORM_THEME);
    showToast("Tema dikembalikan ke standar.");
  };

  useEffect(() => { loadForm(); }, [slug]);

  // ── Socket: join room & dengarkan perubahan dari collaborator ──
  useEffect(() => {
    if (!slug) return;

    socket.connect();
    socket.emit("joinForm", { slug });

    const handleFormUpdated = (data) => {
      if (isSavingRef.current) return;
      if (!data?.soal) return;

      // Handle format baru: array of pages { page, soal: [] }
      let soalFlat = [];
      if (Array.isArray(data.soal)) {
        if (data.soal.length > 0 && data.soal[0]?.soal) {
          soalFlat = data.soal.flatMap(p => (p.soal ?? []).map(s => ({ ...s, page: s.page ?? p.page ?? 1 })));
        } else {
          soalFlat = data.soal;
        }
      }

      setQuestions(prev => {
        const fromDB = soalFlat.map((s) => ({
          id: s.id, question: s.question, type: s.type, required: true,
          page: s.page ?? 1,
          score: s.score ?? null,
          group_id: s.group_id ?? null,
          group_text: s.group_text ?? null,
          options: (s.options ?? []).map((o) => ({
            id: o.id, value: o.value ?? o.option_value, is_correct: o.is_correct,
            image: o.image ?? null,
          })),
        }));
        const unsaved = prev.filter(q => q._new);
        return [...fromDB, ...unsaved];
      });

      setCollabNotice("Collaborator memperbarui soal");
      setTimeout(() => setCollabNotice(""), 4000);
    };

    socket.on("formUpdated", handleFormUpdated);

    return () => {
      socket.emit("leaveForm", { slug });
      socket.off("formUpdated", handleFormUpdated);
      socket.disconnect();
    };
  }, [slug]);

  async function loadForm(silent = false, clearNew = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await api.get("/form/slug", { params: { slug } });
      const rawData = res.data?.data;
      // Response baru: { form: {...formPayload}, soal: [...] }
      // Response lama: flat object dengan soal embedded
      const f    = rawData?.form ? { ...flattenForm(rawData.form), soal: rawData.soal } : rawData;
      const soalData = rawData?.soal ?? rawData?.form?.soal ?? [];

      if (f) {
        setForm({ ...f, soal: soalData });
        setQuestions(prev => {
          // soal dari response baru ada di soalData (array of { page, soal[] })
          let soalFlat = [];
          if (Array.isArray(soalData)) {
            if (soalData.length > 0 && soalData[0]?.soal) {
              soalFlat = soalData.flatMap(p => (p.soal ?? []).map(s => ({ ...s, page: s.page ?? p.page ?? 1 })));
            } else {
              soalFlat = soalData;
            }
          }
          const fromDB = soalFlat.map((s) => ({
            id: s.id, question: s.question, type: s.type, required: true,
            page: s.page ?? 1,
            score: s.score ?? null,
            audio: s.audio ?? null,
            group_id: s.group_id ?? null,
            group_text: s.group_text ?? null,
            options: (s.options ?? []).map((o) => ({
              id: o.id, value: o.value ?? o.option_value, is_correct: o.is_correct,
              image: o.image ?? null,
            })),
          }));
          const unsaved = clearNew ? [] : prev.filter(q => q._new);
          return [...fromDB, ...unsaved];
        });

        // Ambil role user
        try {
          const myRes = await api.get("/form/user");
          const myForms = (myRes.data?.data?.forms ?? []).map(flattenForm);
          const match = myForms.find(mf => mf.slug === slug || mf.form_slug === slug);
          setUserRole(match?.access_type ?? null);
        } catch { setUserRole(null); }
      } else {
        setError("Form tidak ditemukan.");
      }
    } catch {
      setError("Form tidak ditemukan.");
    }
    finally { setLoading(false); }
  }

  function addQuestion(targetPage) {
    setQuestions((prev) => {
      const lastPage = prev.length > 0 ? (prev[prev.length - 1].page || 1) : 1;
      const p = targetPage ?? lastPage;
      return [...prev, {
        _new: true, question: "", type: "radio", required: true,
        page: p,
        options: [{ value: "" }, { value: "" }],
      }];
    });
  }

  function addQuestionAfter(idx) {
    setQuestions((prev) => {
      const targetQ = prev[idx];
      const p = targetQ?.page || 1;
      const newQ = {
        _new: true,
        question: "",
        type: "radio",
        required: true,
        page: p,
        options: [{ value: "" }, { value: "" }],
      };
      const copy = [...prev];
      copy.splice(idx + 1, 0, newQ);
      return copy;
    });
    showToast("Pertanyaan baru disisipkan!");
  }

  function addNewPage() {
    setQuestions((prev) => {
      const maxPage = prev.length > 0 ? Math.max(...prev.map(q => q.page || 1)) : 0;
      const nextPage = maxPage + 1;
      return [...prev, {
        _new: true, question: "", type: "radio", required: true,
        page: nextPage,
        options: [{ value: "" }, { value: "" }],
      }];
    });
    showToast("Halaman baru ditambahkan!");
  }

  function addPageBreakAfter(idx) {
    setQuestions((prev) => {
      if (idx < 0 || idx >= prev.length - 1) return prev;
      return prev.map((q, i) => {
        if (i <= idx) return q;
        return { ...q, page: (q.page || 1) + 1 };
      });
    });
    showToast("Pemisah halaman (Page Break) ditambahkan!");
  }

  function removePageBreak(pageNum) {
    if (pageNum <= 1) return;
    setQuestions((prev) => {
      return prev.map(q => {
        const p = q.page || 1;
        if (p === pageNum) return { ...q, page: Math.max(1, pageNum - 1) };
        if (p > pageNum) return { ...q, page: p - 1 };
        return q;
      });
    });
    showToast(`Halaman ${pageNum} digabungkan ke Halaman ${pageNum - 1}!`);
  }

  // Template soal identitas — diinsert di posisi AWAL (page 1)
  function addIdentityPage() {
    const templates = [
      { question: "Nama Lengkap", type: "text", required: true },
      { question: "Kelas", type: "text", required: true },
      { question: "Nomor Absen", type: "text", required: false },
    ];
    setQuestions(prev => {
      // Cek apakah sudah ada soal identitas (soal text di posisi awal)
      const alreadyHas = prev.some(q =>
        ["Nama Lengkap", "Kelas", "Nomor Absen"].includes(
          (q.question ?? "").replace(/<[^>]*>/g, "").trim()
        )
      );
      if (alreadyHas) {
        showToast("Halaman identitas sudah ada.");
        return prev;
      }
      const newSoal = templates.map(t => ({
        _new: true,
        question: t.question,
        type: "text",
        required: t.required,
        page: 1,
        options: [],
      }));
      const shiftedPrev = prev.map(q => ({
        ...q,
        page: (q.page || 1) + 1,
      }));
      return [...newSoal, ...shiftedPrev];
    });
    showToast("Template identitas ditambahkan di halaman 1!");
  }
  function updateQ(idx, field, val) {
    setQuestions((prev) => {
      const updated = prev.map((q, i) => i === idx ? { ...q, [field]: val } : q);
      // Simpan required state per soal ke localStorage supaya FillForm bisa baca
      if (field === "required") {
        const reqMap = {};
        updated.forEach(q => { if (q.id) reqMap[q.id] = q.required !== false; });
        localStorage.setItem(`soal_required_${slug}`, JSON.stringify(reqMap));
      }
      return updated;
    });
  }
  function updateOpt(qIdx, oIdx, val) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.map((o, j) => j === oIdx ? { ...o, value: val } : o) };
    }));
  }
  function updateOptField(qIdx, oIdx, field, val) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.map((o, j) => j === oIdx ? { ...o, [field]: val } : o) };
    }));
  }
  function addOpt(qIdx) {
    setQuestions((prev) => prev.map((q, i) =>
      i !== qIdx ? q : { ...q, options: [...q.options, { value: "", is_correct: false }] }
    ));
  }
  function toggleCorrect(qIdx, oIdx) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const isRadio = q.type === "radio";
      return {
        ...q,
        options: q.options.map((o, j) => {
          if (j === oIdx) return { ...o, is_correct: !o.is_correct };
          const other = o.is_correct && isRadio;
          return other ? { ...o, is_correct: false } : o;
        }),
      };
    }));
  }
  function removeOpt(qIdx, oIdx) {
    setQuestions((prev) => prev.map((q, i) =>
      i !== qIdx ? q : { ...q, options: q.options.filter((_, j) => j !== oIdx) }
    ));
  }
  function removeQ(idx) {
    setQuestions((prev) => {
      const target = prev[idx];
      if (target && target.id && !target._new) {
        setDeletedQuestionIds((d) => [...d, target.id]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  }
  function reorderQ(from, to) {
    if (from === to) return;
    setQuestions((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      let targetPage = item.page || 1;
      if (to > 0 && to < arr.length) {
        targetPage = arr[to].page || arr[to - 1]?.page || 1;
      } else if (to === 0 && arr.length > 0) {
        targetPage = arr[0].page || 1;
      } else if (to >= arr.length && arr.length > 0) {
        targetPage = arr[arr.length - 1].page || 1;
      }
      arr.splice(to, 0, { ...item, page: targetPage });
      return arr;
    });
  }
  function duplicateQ(idx) {
    setQuestions((prev) => {
      const c = [...prev];
      c.splice(idx + 1, 0, { ...prev[idx], _new: true, id: undefined, page: prev[idx].page || 1 });
      return c;
    });
  }

  async function saveQuestions() {
    const isTextEmpty = (str) => !str || str.replace(/<[^>]*>/g, '').trim() === '';
    if (questions.find((q) => isTextEmpty(q.question))) { setError("Semua pertanyaan wajib diisi."); return; }

    // Cek soal yang punya audio + gambar embedded sekaligus
    const conflictQ = questions.find((q) =>
      (q.audioFile instanceof File || q.audio) &&
      /<img/i.test(q.question || "")
    );
    if (conflictQ) {
      const idx = questions.indexOf(conflictQ) + 1;
      setError(`Soal ${idx}: tidak bisa menyimpan audio bersamaan dengan gambar di teks soal. Hapus gambar dari teks atau gunakan fitur Lampiran Soal.`);
      return;
    }
    setSaving(true); setError("");
    isSavingRef.current = true;

    const getPage = (q) => {
      return Math.max(1, parseInt(q.page) || 1);
    };

    try {
      const token = localStorage.getItem("token");

      // 1. Process deletions
      if (deletedQuestionIds.length > 0) {
        await Promise.all(
          deletedQuestionIds.map((id) =>
            fetch(`${FORM_API_URL}/form/soal/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
        setDeletedQuestionIds([]);
      }

      // 2. Process updates to existing questions
      const existingOnes = questions.filter((q) => q.id && !q._new);
      if (existingOnes.length > 0) {
        await Promise.all(
          existingOnes.map((q) => {
            const pageVal = getPage(q);
            const hasOpts = ["radio", "checkbox", "rating"].includes(q.type);
            const payload = {
              soal: { question: q.question, type: q.type, page: pageVal, score: q.score ?? null,
                group_id: q.group_id ?? null,
                group_text: q.group_text ?? null,
                // audio baru
                ...(q.audioFile instanceof File ? { audio_filename: q.audioFile.name } : {}),
                // pertahankan audio lama dari DB
                ...(q.audio && !(q.audioFile instanceof File) ? { audio: q.audio } : {}),
                // hapus audio jika di-null-kan
                ...(!q.audio && !(q.audioFile instanceof File) ? { audio: null } : {}),
              },
              options: hasOpts
                ? (q.options || []).map((o, idx) => ({
                    id: o.id,
                    value: o.value?.trim() || `Opsi ${idx + 1}`,
                    is_correct: o.is_correct ?? false,
                    // kalau ada file baru, tandai dengan image_filename
                    ...(o.imageFile ? { image_filename: o.imageFile.name } : {}),
                    // kalau sudah ada image dari DB, tetap kirim
                    ...(o.image && !o.imageFile ? { image: o.image } : {}),
                  }))
                : [],
            };
            const fd = new FormData();
            fd.append("data", JSON.stringify(payload));
            // Lampirkan file audio baru
            if (q.audioFile instanceof File) {
              fd.append("soal_audios", q.audioFile, q.audioFile.name);
            }
            // Lampirkan file gambar opsi baru
            if (hasOpts) {
              (q.options || []).forEach((o) => {
                if (o.imageFile instanceof File) {
                  fd.append("option_images", o.imageFile, o.imageFile.name);
                }
              });
            }
            return fetch(`${FORM_API_URL}/form/soal/${q.id}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });
          })
        );
      }

      // 3. Process new questions
      const newOnes = questions.filter((q) => q._new);
      if (newOnes.length > 0) {
        const fd = new FormData();
        const payload = newOnes.map((q, i) => {
          const hasOpts = ["radio", "checkbox", "rating"].includes(q.type);
          const pageVal = getPage(q);
          if (q.attachment instanceof File) {
            fd.append("soal_images", q.attachment, `soal_${i}_${q.attachment.name}`);
          }
          if (q.audioFile instanceof File) {
            fd.append("soal_audios", q.audioFile, `audio_${i}_${q.audioFile.name}`);
          }
          return {
            soal: {
              question: q.question, type: q.type,
              image: q.attachment instanceof File ? q.attachment.name : null,
              audio_filename: q.audioFile instanceof File ? q.audioFile.name : null,
              page: pageVal, score: q.score ?? null,
              group_id: q.group_id ?? null,
              group_text: q.group_text ?? null,
            },
            options: hasOpts
              ? q.options.map((o, oIdx) => {
                  const opt = {
                    value: o.value?.trim() || `Opsi ${oIdx + 1}`,
                    image: null,
                    is_correct: o.is_correct ?? false,
                  };
                  if (o.imageFile instanceof File) {
                    fd.append("option_images", o.imageFile, o.imageFile.name);
                    opt.image_filename = o.imageFile.name;
                  }
                  return opt;
                })
              : [],
          };
        });
        fd.append("data", JSON.stringify(payload));
        const res = await fetch(`${FORM_API_URL}/form/soal?form_slug=${slug}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "Gagal menyimpan soal baru.");
        }
      }

      showToast("Perubahan soal berhasil disimpan!");
      // Clear _new flag before loadForm so unsaved merge doesn't duplicate them
      setQuestions(prev => prev.filter(q => !q._new));
      await loadForm();
    } catch (e) {
      setError(e.message || "Gagal menyimpan soal.");
      showToast(e.message || "Gagal menyimpan soal.");
    }
    finally {
      setSaving(false);
      // Delay sedikit agar event socket dari save sendiri keburu lewat
      setTimeout(() => { isSavingRef.current = false; }, 1000);
    }
  }


  async function updateStatus(status) {
    try {
      const res = await fetch(`${FORM_API_URL}/form?form_slug=${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data?.message || "Gagal mengubah status."); return; }
      showToast(`Status diubah ke "${status}"`);
      loadForm();
    } catch { showToast("Gagal mengubah status."); }
  }

  async function deleteForm() {
    try {
      const res = await fetch(`${FORM_API_URL}/form?form_slug=${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data?.message || "Gagal menghapus form."); return; }
      navigate("/my-forms");
    } catch { showToast("Gagal menghapus form."); }
  }

  function copyLink() {
    const baseUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/fill/${slug}`);
    showToast("Link berhasil disalin!");
  }

  if (loading) return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, var(--fm-bg) 0%, var(--fm-bg-2) 60%, var(--fm-bg-3) 100%)" }}>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat form...</p>
        </div>
      </div>
    </div>
  );

  if (error && !form) return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, var(--fm-bg) 0%, var(--fm-bg-2) 60%, var(--fm-bg-3) 100%)" }}>
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileQuestion size={22} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">{error}</p>
          <button onClick={() => navigate("/my-forms")} className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#1a4fa0" }}>Kembali</button>
        </div>
      </div>
    </div>
  );

  const isPublished = form?.status === "public" || form?.form_status === "public";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, var(--fm-bg) 0%, var(--fm-bg-2) 60%, var(--fm-bg-3) 100%)" }}>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-[52px] md:pt-0">
        {/* ── Top Bar ───────────────────────────────────── */}
        <header className="flex items-center gap-3 px-4 md:px-6 xl:px-9 py-3.5 border-b backdrop-blur shrink-0 transition-colors"
          style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-border)", boxShadow: "0 1px 0 rgba(23,64,120,0.04), 0 6px 18px rgba(23,64,120,0.05)" }}>
          <button onClick={() => navigate("/my-forms")} className="w-10 h-10 rounded-xl hover:bg-[#eef5fb] flex items-center justify-center text-gray-500 hover:text-[#1a4fa0] transition-all">
            <ArrowLeft size={19} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate text-[17px] leading-tight">
              {form?.title ?? form?.form_title ?? "Form"}
            </h1>
            <p className="text-[12.5px] text-gray-400 hidden sm:block">{form?.sub_kategori ?? form?.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyLink} title="Salin link" className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-gray-400 hover:bg-[#eef5fb] hover:text-[#1a4fa0] transition-all">
              <Link2 size={17} />
            </button>
            <button onClick={() => setShowQr(true)} title="QR Code" className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-gray-400 hover:bg-[#eef5fb] hover:text-[#1a4fa0] transition-all">
              <QrCode size={17} />
            </button>
            {userRole !== "Collaborator" && (
              <button
                onClick={() => {
                  const baseUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
                  const collabLink = `${baseUrl}/form/${slug}/collaborate?token=${form?.token_collab ?? ""}`;
                  navigator.clipboard.writeText(collabLink);
                  showToast("Link collaborator berhasil disalin!");
                }}
                title="Undang Collaborator"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 transition"
              >
                <Share2 size={14} /> Kolaborasi
              </button>
            )}
            <button onClick={() => setShowDelete(true)} className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <Trash2 size={17} />
            </button>
            <button
              onClick={() => updateStatus(isPublished ? "private" : "public")}
              className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                isPublished
                  ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                  : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isPublished ? "bg-green-500" : "bg-gray-400"}`} />
              {isPublished ? "Published" : "Draft"}
            </button>
            <button
              onClick={saveQuestions}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-white text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-60 transition-all shadow-[0_6px_16px_rgba(26,79,160,0.28)]"
              style={{ backgroundColor: "#1a4fa0" }}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </header>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div
          className="flex gap-1 px-4 md:px-6 xl:px-9 border-b backdrop-blur shrink-0 overflow-x-auto transition-colors"
          style={{
            backgroundColor: "var(--fm-card)",
            borderColor: "var(--fm-border)"
          }}
        >
          {TABS.filter(tab => {
            // Collaborator hanya bisa akses Pertanyaan
            if (userRole === "Collaborator") return tab === "Pertanyaan";
            return true;
          }).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[14.5px] font-semibold border-b-2 transition-all whitespace-nowrap -mb-px ${
                activeTab === tab
                  ? "border-[#3d91b2] text-[#3d91b2]"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab}
              {tab === "Pertanyaan" && questions.length > 0 && (
                <span
                  className="ml-2 text-[12px] px-2 py-0.5 rounded-full font-bold"
                  style={{
                    backgroundColor: "var(--fm-hover)",
                    color: "var(--fm-text)"
                  }}
                >
                  {questions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "Pertanyaan" && (
            <PertanyaanTab
              form={form} slug={slug} questions={questions} error={error}
              onAddQuestion={addQuestion}
              onAddQuestionAfter={addQuestionAfter}
              onAddNewPage={addNewPage}
              onAddPageBreakAfter={addPageBreakAfter}
              onRemovePageBreak={removePageBreak}
              onAddIdentityPage={addIdentityPage}
              onUpdateQ={updateQ} onUpdateOpt={updateOpt} onUpdateOptField={updateOptField}
              onAddOpt={addOpt} onRemoveOpt={removeOpt}
              onRemoveQ={removeQ} onDuplicateQ={duplicateQ}
              onToggleCorrect={toggleCorrect}
              onReorder={reorderQ}
              onCopyLink={copyLink}
              onShowToast={showToast}
              onImported={loadForm}
              onImportedSilent={async () => {
                // Bersihkan soal _new dulu supaya tidak duplikat setelah import
                setQuestions(prev => prev.filter(q => !q._new));
                await loadForm(true, true);
                setTimeout(() => { isSavingRef.current = false; }, 1000);
              }}
              onImportGuard={(v) => { isSavingRef.current = v; }}
              hasUnsaved={questions.some(q => q._new)}
              onSaveFirst={async () => {
                // Simpan hanya soal _new (identitas) tanpa validasi penuh
                const token = localStorage.getItem("token");
                const newOnes = questions.filter(q => q._new && q.question);
                if (newOnes.length === 0) return;
                const fd = new FormData();
                const payload = newOnes.map((q, i) => {
                  const pageVal = Math.max(1, parseInt(q.page) || 1);
                  return {
                    soal: { question: q.question, type: q.type || "text", page: pageVal, score: q.score ?? null },
                    options: [],
                  };
                });
                fd.append("data", JSON.stringify(payload));
                await fetch(`${FORM_API_URL}/form/soal?form_slug=${slug}`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: fd,
                });
                setQuestions(prev => prev.filter(q => !q._new));
              }}
            />
          )}
          {activeTab === "Jawaban" && (
            <ResponsesTab formId={form?.id ?? form?.form_id} form={form} />
          )}
          {activeTab === "Tema" && (
            <ThemeSettingsTab
              theme={theme}
              onThemeChange={handleThemeChange}
              onResetTheme={handleResetTheme}
            />
          )}
          {activeTab === "Setelan" && (
            <SettingsTab form={form} onUpdateStatus={updateStatus} slug={slug} onSaved={(patch) => setForm(prev => (prev ? { ...prev, ...patch } : prev))} />
          )}
        </div>
      </div>

      {/* Toast */}
      <Toast message={toast} />

      {/* Collab notice */}
      {collabNotice && (
        <div className="fixed bottom-6 right-6 bg-violet-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-pulse">
          {collabNotice}
        </div>
      )}

      {/* Delete modal with Custom AlertModal */}
      <AlertModal
        open={showDelete}
        type="trash"
        title="Hapus Form?"
        message={`Form "${form?.title ?? form?.form_title}" akan dihapus permanen dan tidak dapat dikembalikan.`}
        confirmText="Hapus Form"
        cancelText="Batal"
        onConfirm={deleteForm}
        onCancel={() => setShowDelete(false)}
      />

      {/* QR Code modal */}
      {showQr && (
        <QrModal
          slug={slug}
          formTitle={form?.title ?? form?.form_title ?? "Form"}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}

/* ── Pertanyaan Tab ─────────────────────────────────────────── */
function PertanyaanTab({ form, slug, questions, error, onAddQuestion, onAddQuestionAfter, onAddNewPage, onAddPageBreakAfter, onRemovePageBreak, onAddIdentityPage, onUpdateQ, onUpdateOpt, onUpdateOptField, onAddOpt, onRemoveOpt, onRemoveQ, onDuplicateQ, onToggleCorrect, onReorder, onCopyLink, onShowToast, onImported, onImportedSilent, onImportGuard, hasUnsaved, onSaveFirst }) {
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  // Baca scoreType dari localStorage supaya badge score realtime ikut berubah
  const [scoreType, setScoreType] = useState(() =>
    localStorage.getItem(`score_type_${form?.slug ?? slug}`) ?? "none"
  );

  // --- Bulk Select Mode (pilih banyak soal ala WA buat grup soal) ---
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedQIdxs, setSelectedQIdxs] = useState(() => new Set());

  function toggleSelectMode() {
    setIsSelectMode((v) => !v);
    setSelectedQIdxs(new Set());
    setEditingIdx(null);
  }

  function toggleSelectQuestion(idx) {
    setSelectedQIdxs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function applyBulkGroupUI() {
    const sorted = [...selectedQIdxs].sort((a, b) => a - b);
    if (sorted.length === 0) return;
    // ponytail: id dihitung helper biar konsisten + ketest
    const { questions: next, newGroupId } = applyBulkGroup(questions, sorted);
    const sel = new Set(sorted);
    next.forEach((q, i) => {
      if (!sel.has(i)) return;
      onUpdateQ(i, "group_id", q.group_id);
      onUpdateQ(i, "group_text", q.group_text);
      if (q.showGroup) onUpdateQ(i, "showGroup", true);
    });
    onShowToast?.(`${sorted.length} soal digabung ke Grup Soal #${newGroupId}!`);
    setIsSelectMode(false);
    setSelectedQIdxs(new Set());
  }

  function removeBulkGroupUI() {
    const sorted = [...selectedQIdxs].sort((a, b) => a - b);
    if (sorted.length === 0) return;
    const next = removeBulkGroup(questions, sorted);
    const sel = new Set(sorted);
    next.forEach((q, i) => {
      if (!sel.has(i)) return;
      onUpdateQ(i, "group_id", null);
      onUpdateQ(i, "group_text", null);
      onUpdateQ(i, "showGroup", false);
    });
    onShowToast?.(`${sorted.length} soal dilepas dari grup soal.`);
    setIsSelectMode(false);
    setSelectedQIdxs(new Set());
  }
  // ------------------------------------------------------------------

  // --- Click-to-edit soal: 1 kartu expanded, klik luar = tutup ---
  const [editingIdx, setEditingIdx] = useState(null);
  const listRef = useRef(null);
  useEffect(() => {
    function onDown(e) {
      if (listRef.current && !listRef.current.contains(e.target)) setEditingIdx(null);
    }
    function onKey(e) {
      if (e.key === "Escape") setEditingIdx(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  // ---------------------------------------------------------------

  // Sync saat form berubah
  useEffect(() => {
    const key = `score_type_${form?.slug ?? slug}`;
    const stored = localStorage.getItem(key) ?? "none";
    setScoreType(stored);
    const handler = (e) => { if (e.key === key) setScoreType(e.newValue ?? "none"); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [form?.slug, slug]);

  const [exportingDocx, setExportingDocx] = useState(false);
  async function onExportDocx() {
    setExportingDocx(true);
    try {
      const res = await fetch(`${FORM_API_URL}/form/soal/export?form_slug=${slug}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal mengekspor soal.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Soal_${slug}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast?.("Soal berhasil diekspor ke Word!");
    } catch (e) {
      onShowToast?.(e.message || "Gagal mengekspor soal.");
    } finally {
      setExportingDocx(false);
    }
  }
  return (
    <div ref={listRef} className="max-w-3xl mx-auto py-8 px-4 md:px-6 xl:px-8 space-y-5 relative" style={{ paddingBottom: 80 }}>
      {/* Form header card */}
      <div
        className="rounded-2xl shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-7 border transition-colors"
        style={{
          backgroundColor: "var(--fm-card)",
          borderColor: "var(--fm-card-border)"
        }}
      >
        <h2 className="text-[22px] font-extrabold mb-1 tracking-tight leading-snug" style={{ color: "var(--fm-text)" }}>
          {form?.title ?? form?.form_title}
        </h2>
        <p className="text-[13px] mb-4" style={{ color: "var(--fm-text-3)" }}>{form?.category}</p>
        <textarea
          placeholder="Deskripsi form (opsional)..."
          rows={2}
          className="w-full text-[14.5px] p-3 rounded-xl border outline-none transition-all resize-none shadow-sm focus:ring-2 focus:ring-[#3d91b2]"
          style={{
            backgroundColor: "var(--fm-input-bg)",
            borderColor: "var(--fm-border)",
            color: "var(--fm-text)"
          }}
        />
        <div
          className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors"
          style={{
            backgroundColor: "var(--fm-hover)",
            borderColor: "var(--fm-border)"
          }}
        >
          <span className="text-[13.5px] font-medium truncate flex-1" style={{ color: "var(--fm-text)" }}>
            {import.meta.env.VITE_APP_URL ?? window.location.origin}/fill/{slug}
          </span>
          <button
            onClick={onCopyLink}
            className="text-[13px] text-white font-semibold px-3.5 py-2 rounded-lg hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
            style={{ backgroundColor: "#1a4fa0" }}
          >
            <Share2 size={14} /> Salin
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>
      )}

      {questions.length === 0 && (
        <div
          className="text-center py-14 rounded-2xl border border-dashed transition-colors"
          style={{
            backgroundColor: "var(--fm-card)",
            borderColor: "var(--fm-card-border)"
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "var(--fm-hover)", color: "#3d91b2" }}
          >
            <FileQuestion size={30} />
          </div>
          <p className="font-bold text-[16px] mb-1" style={{ color: "var(--fm-text)" }}>Belum ada pertanyaan</p>
          <p className="text-[13.5px] mb-5" style={{ color: "var(--fm-text-2)" }}>Tambahkan pertanyaan pertama untuk memulai.</p>
          <button
            type="button"
            onClick={() => onAddQuestion()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13.5px] font-semibold hover:opacity-90 shadow-md cursor-pointer transition-all"
            style={{ backgroundColor: "#1a4fa0" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Pertanyaan Pertama
          </button>
        </div>
      )}

      {questions.map((q, qIdx) => {
        const currPage = q.page || 1;
        const prevQ = qIdx > 0 ? questions[qIdx - 1] : null;
        const prevPage = prevQ ? (prevQ.page || 1) : null;
        const isNewPage = qIdx === 0 || currPage !== prevPage;
        const questionsOnThisPage = questions.filter(x => (x.page || 1) === currPage).length;

        return (
          <div key={q.id ?? `new-${qIdx}`} className="space-y-4">
            {isNewPage && (
              <div className="pt-2">
                {currPage === 1 ? (
                  <div className="rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                    style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1a4fa0] text-white flex items-center justify-center font-black text-[14px] shadow-2xs">
                        1
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14.5px] font-extrabold text-[#102f56]">Halaman 1</h3>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#d4e5fa] text-[11px] font-bold text-[#1a4fa0]">
                            {questionsOnThisPage} Pertanyaan
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-400">Halaman awal formulir / identitas</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative pt-3 pb-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#1a4fa0]/20 to-[#1a4fa0]/40 rounded-full" />
                      <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1a4fa0] text-white text-[11.5px] font-extrabold shadow-sm tracking-wide">
                        <Layers size={13} /> PEMISAH HALAMAN (PAGE BREAK)
                      </div>
                      <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-[#1a4fa0]/20 to-[#1a4fa0]/40 rounded-full" />
                    </div>

                    <div className="rounded-2xl border p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3"
                      style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white text-[#1a4fa0] flex items-center justify-center font-black text-[14px] shadow-2xs border border-[#d4e5fa]">
                          {currPage}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[14.5px] font-extrabold text-[#102f56]">Halaman {currPage}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-[#d4e5fa] text-[11px] font-bold text-[#1a4fa0]">
                              {questionsOnThisPage} Pertanyaan
                            </span>
                          </div>
                          <p className="text-[12px] text-[#64779d]">
                            Responden akan diarahkan ke halaman ini setelah menekan &quot;Selanjutnya&quot;.
                          </p>
        </div>
      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onRemovePageBreak(currPage)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#d4e5fa] text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-[12px] font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title={`Gabungkan Halaman ${currPage} ke Halaman ${currPage - 1}`}
                        >
                          <Unlink size={13} /> Gabung ke Halaman {currPage - 1}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); if (dragFrom !== null) setDragOver(qIdx); }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFrom !== null && dragFrom !== qIdx) onReorder(dragFrom, qIdx);
                setDragFrom(null);
                setDragOver(null);
              }}
              className={`transition-all rounded-2xl ${dragOver === qIdx && dragFrom !== null && dragFrom !== qIdx ? "ring-2 ring-[#1a4fa0]/50 translate-y-0.5" : ""}`}
            >
              <QuestionCard
                question={q}
                index={qIdx}
                onUpdate={(f, v) => onUpdateQ(qIdx, f, v)}
                onUpdateOpt={(oIdx, v) => onUpdateOpt(qIdx, oIdx, v)}
                onUpdateOptField={(oIdx, field, v) => onUpdateOptField(qIdx, oIdx, field, v)}
                onAddOpt={() => onAddOpt(qIdx)}
                onRemoveOpt={(oIdx) => onRemoveOpt(qIdx, oIdx)}
                onToggleCorrect={(oIdx) => onToggleCorrect(qIdx, oIdx)}
                onRemove={() => onRemoveQ(qIdx)}
                onDuplicate={() => onDuplicateQ(qIdx)}
                onAddQuestionAfter={() => onAddQuestionAfter(qIdx)}
                onAddPageBreakAfter={qIdx < questions.length - 1 ? () => onAddPageBreakAfter(qIdx) : undefined}
                onDragHandleStart={() => setDragFrom(qIdx)}
                onDragHandleEnd={() => { setDragFrom(null); setDragOver(null); }}
                onShowToast={onShowToast}
                scoreType={scoreType}
                totalSoal={questions.length}
                isSelectMode={isSelectMode}
                isSelected={selectedQIdxs.has(qIdx)}
                onToggleSelect={() => toggleSelectQuestion(qIdx)}
                isEditing={editingIdx === qIdx && !isSelectMode}
                onStartEdit={() => setEditingIdx(qIdx)}
              />
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onExportDocx}
          disabled={exportingDocx}
          className="w-full py-4 rounded-2xl border-2 border-dashed text-[15px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          style={{ borderColor: "var(--fm-card-border)", color: exportingDocx ? "var(--fm-text-3)" : "var(--fm-text-2)", backgroundColor: "transparent", opacity: exportingDocx ? 0.6 : 1 }}
          onMouseEnter={e => { if (!exportingDocx) { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.color = "#10b981"; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--fm-card-border)"; e.currentTarget.style.color = "var(--fm-text-2)"; }}
        >
          {exportingDocx ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Mengekspor...
            </>
          ) : (
            <>
              <FileDown size={20} /> Ekspor Soal (.docx)
            </>
          )}
        </button>

        <ImportDocxButton slug={slug} onImported={onImported} onImportedSilent={onImportedSilent} onImportGuard={onImportGuard} hasUnsaved={hasUnsaved} onSaveFirst={onSaveFirst} />
      </div>

      {/* Tombol template identitas */}
      <button
        onClick={onAddIdentityPage}
        className="w-full py-4 rounded-2xl border-2 border-dashed text-[14px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
        style={{ borderColor: "var(--fm-card-border)", color: "var(--fm-text-2)", backgroundColor: "transparent" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.color = "#10b981"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--fm-card-border)"; e.currentTarget.style.color = "var(--fm-text-2)"; }}
      >
        <IdCard size={18} /> Tambah Halaman Identitas (Nama, Kelas, dst.)
      </button>

      {/* Floating Quick Action Dock */}
      <div className="fixed right-4 md:right-8 bottom-8 z-40 flex flex-col gap-2.5 items-end">
        <div className="backdrop-blur-md rounded-2xl border shadow-[0_10px_35px_rgba(26,79,160,0.18)] p-1.5 flex flex-col gap-1.5"
          style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
          <button
            type="button"
            onClick={() => onAddQuestion()}
            className="group relative w-11 h-11 rounded-xl bg-[#1a4fa0] text-white hover:bg-[#133d80] flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Tambah Pertanyaan"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              Tambah Pertanyaan
            </span>
          </button>

          <button
            type="button"
            onClick={onAddIdentityPage}
            className="group relative w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:opacity-80"
            style={{ backgroundColor: "var(--fm-hover)", color: "#059669", borderColor: "#6ee7b7" }}
            title="Tambah Halaman Identitas"
          >
            <IdCard size={18} />
            <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              Tambah Halaman Identitas
            </span>
          </button>

          <button
            type="button"
            onClick={toggleSelectMode}
            className="group relative w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: isSelectMode ? "#1a4fa0" : "var(--fm-hover)",
              color: isSelectMode ? "#fff" : "#8e4de7",
              borderColor: isSelectMode ? "#1a4fa0" : "#c4b5fd",
            }}
            title="Pilih beberapa soal (buat / lepas grup soal)"
          >
            <ListChecks size={18} />
            <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              Pilih beberapa soal (grup soal)
            </span>
          </button>
        </div>
      </div>

      {/* Floating bar mode pilih ala WA */}
      {isSelectMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-[0_10px_35px_rgba(26,79,160,0.25)] backdrop-blur-md max-w-[calc(100vw-2rem)] flex-wrap justify-center"
          style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
          <span className="text-[13px] font-bold mr-1" style={{ color: "var(--fm-text)" }}>
            {selectedQIdxs.size} dipilih
          </span>
          <button
            type="button"
            onClick={toggleSelectMode}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer"
            style={{ borderColor: "var(--fm-card-border)", color: "var(--fm-text-2)" }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={removeBulkGroupUI}
            disabled={selectedQIdxs.size === 0}
            className="px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer disabled:opacity-40"
            style={{ borderColor: "#fca5a5", color: "#ef4444" }}
          >
            Lepas grup
          </button>
          <button
            type="button"
            onClick={applyBulkGroupUI}
            disabled={selectedQIdxs.size === 0}
            className="px-3 py-1.5 rounded-xl text-[12px] font-bold text-white transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            style={{ backgroundColor: "#1a4fa0" }}
          >
            <BookOpen size={13} /> Jadikan 1 grup soal
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Question Card ──────────────────────────────────────────── */
function QuestionCard({ question, index, onUpdate, onUpdateOpt, onUpdateOptField, onAddOpt, onRemoveOpt, onToggleCorrect, onRemove, onDuplicate, onAddQuestionAfter, onAddPageBreakAfter, onDragHandleStart, onDragHandleEnd, onShowToast, scoreType, totalSoal, isSelectMode, isSelected, onToggleSelect, isEditing, onStartEdit }) {
  const hasOptions = ["radio", "checkbox"].includes(question.type);
  // Semua soal bisa diedit (tidak hanya yang baru)
  const editable = true;
  // ponytail: soal kosong otomatis expanded biar langsung bisa diketik
  const isEmptyText = !question.question || question.question.replace(/<[^>]*>/g, '').trim() === '';
  const showEditor = isEditing || isEmptyText;
  return (
    <div onClick={isSelectMode ? onToggleSelect : undefined}
      className={`relative rounded-2xl border shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6 transition-all hover:shadow-[0_14px_40px_rgba(23,64,120,0.12)] ${
      question._new ? "border-[#1a4fa0]/50 ring-1 ring-[#1a4fa0]/10" : ""
    } ${isSelectMode ? "cursor-pointer select-none" : ""} ${isSelectMode && isSelected ? "ring-2 ring-[#1a4fa0] border-[#1a4fa0]" : ""}`}
      style={{ backgroundColor: isSelectMode && isSelected ? "rgba(26,79,160,0.07)" : "var(--fm-card)", borderColor: (isSelectMode && isSelected) || question._new ? undefined : "var(--fm-card-border)" }}>
      {isSelectMode && (
        <div className="absolute top-4 right-4 z-10">
          <span className={`w-7 h-7 rounded-full border-2 grid place-items-center transition-all ${
            isSelected ? "bg-[#1a4fa0] border-[#1a4fa0] text-white" : "border-gray-300 text-transparent"
          }`} style={!isSelected ? { borderColor: "var(--fm-card-border)" } : undefined}>
            <Check size={15} strokeWidth={3.5} />
          </span>
        </div>
      )}
      <div className={isSelectMode ? "pointer-events-none" : ""}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(index)); onDragHandleStart?.(); }}
            onDragEnd={() => onDragHandleEnd?.()}
            title="Tarik untuk urutkan soal"
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-[#1a4fa0] transition-colors"
          >
            <GripVertical size={18} />
          </button>
          <span className="w-9 h-9 rounded-xl bg-[#eef5fb] text-[#1a4fa0] text-[14px] font-extrabold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          {/* Badge halaman */}
          <span className="px-2 py-0.5 rounded-lg bg-[#f0f6fe] border border-[#d4e5fa] text-[11px] font-bold text-[#1a4fa0] flex items-center gap-1" title={`Pertanyaan berada di Halaman ${question.page || 1}`}>
            <Layers size={11} /> Hal. {question.page || 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Type selector */}
          <select
            value={question.type}
            onChange={(e) => onUpdate("type", e.target.value)}
            className="text-[13.5px] border border-[#d9e5f0] rounded-xl px-3.5 py-2 bg-white outline-none shrink-0 font-medium text-gray-700 shadow-xs focus:border-[#1a4fa0]"
          >
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[12px] font-extrabold text-[#1a4fa0] uppercase tracking-wider flex items-center gap-1.5">
            Pertanyaan:
          </label>
          {!showEditor && (
            <span className="text-[11px] font-medium" style={{ color: "var(--fm-text-3)" }}>
              Klik teks untuk mengedit
            </span>
          )}
        </div>
        {showEditor ? (
          <QuillEditor
            value={question.question}
            onChange={(val) => onUpdate("question", val)}
            placeholder="Ketik pertanyaan di sini"
          />
        ) : (
          <div
            onClick={onStartEdit}
            onKeyDown={(e) => { if (e.key === "Enter") onStartEdit?.(); }}
            role="button"
            tabIndex={0}
            title="Klik untuk edit soal"
            className="rounded-xl border px-4 py-3 cursor-text transition-all min-h-[64px] hover:border-[#1a4fa0]"
            style={{ borderColor: "var(--fm-border)", backgroundColor: "transparent" }}
          >
            <RichTextDisplay content={question.question} className="text-[15px] leading-relaxed" />
          </div>
        )}
      </div>

      {/* ── Grup soal: panel cerita bersama (dibuat via mode pilih) ─ */}
      {question.group_id ? (
        question.group_text != null ? (
          <div className="mb-4 ml-2 rounded-2xl border overflow-hidden" style={{ borderColor: "#d4e5fa", backgroundColor: "var(--fm-hover)" }}>
            <div className="flex items-center gap-3 px-4 py-3 flex-wrap" style={{ borderBottom: "1px solid var(--fm-border)" }}>
              <span className="w-9 h-9 rounded-xl bg-[#1a4fa0] text-white grid place-items-center shrink-0">
                <BookOpen size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-extrabold leading-tight" style={{ color: "var(--fm-text)" }}>
                  Teks Cerita — Grup Soal #{question.group_id}
                </p>
                <p className="text-[11.5px]" style={{ color: "var(--fm-text-2)" }}>
                  Cerita/konteks yang dipakai semua soal di grup soal ini
                </p>
              </div>
              <button onClick={() => { onUpdate("group_id", null); onUpdate("group_text", null); onUpdate("showGroup", false); }}
                className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 transition ml-auto shrink-0"><X size={11} /> Lepas</button>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 mb-2.5">
                <Lightbulb size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-blue-700 leading-relaxed">
                  Tulis cerita grup soal di bawah ini.
                </p>
              </div>
              <textarea
                rows={4}
                value={question.group_text ?? ""}
                onChange={e => onUpdate("group_text", e.target.value || null)}
                placeholder={'Contoh: Pada hari Minggu, Budi pergi ke pasar membeli 5 apel dan 3 jeruk. Di jalan pulang, ia memberikan 2 apel kepada temannya...'}
                className="w-full border rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#1a4fa0] focus:ring-2 focus:ring-[#1a4fa0]/15 resize-none"
                style={{ backgroundColor: "var(--fm-input-bg)", borderColor: "var(--fm-border)", color: "var(--fm-text)" }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 ml-2 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed text-[12px] flex-wrap" style={{ borderColor: "var(--fm-card-border)", color: "var(--fm-text-2)" }}>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#1a4fa0]">
              <BookOpen size={13} /> Grup Soal #{question.group_id}
            </span>
            <span>Cerita grup soal diisi di soal pertama.</span>
            <button onClick={() => { onUpdate("group_text", ""); onUpdate("showGroup", true); }}
              className="text-[#1a4fa0] font-semibold hover:underline ml-auto">Isi di sini</button>
            <button onClick={() => { onUpdate("group_id", null); onUpdate("group_text", null); onUpdate("showGroup", false); }}
              className="inline-flex items-center gap-1 text-red-400 hover:text-red-600 transition"><X size={11} /> Lepas</button>
          </div>
        )
      ) : null}

      {hasOptions && (
        <div className="space-y-3 mb-3 ml-2">
          <p className="text-[12.5px] text-gray-500 ml-1">
            {question.type === "checkbox" ? "Klik kotak untuk menandai jawaban benar" : "Klik lingkaran untuk menandai jawaban benar"}
          </p>
          {question.options.map((opt, oIdx) => {
            const previewUrl = opt.imageFile
              ? URL.createObjectURL(opt.imageFile)
              : opt.image
                ? `${FORM_API_URL}${opt.image}`
                : null;
            return (
              <div key={oIdx} className="group flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <button
                    title="Tandai jawaban benar"
                    onClick={() => onToggleCorrect(oIdx)}
                    className={`inline-grid place-items-center shrink-0 border-2 transition-all duration-150 active:scale-90 will-change-transform ${
                      question.type === "checkbox" ? "w-7 h-7 rounded-[8px]" : "w-7 h-7 rounded-full"
                    } ${
                      opt.is_correct
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-[#eef2f6] border-[#5b6c7e] hover:border-green-500 hover:bg-green-50"
                    }`}
                  >
                    {opt.is_correct && (
                      question.type === "checkbox"
                        ? <Check size={16} strokeWidth={3} />
                        : <span className="block w-3 h-3 rounded-full bg-white" />
                    )}
                  </button>
                  <OptionQuillEditor
                    value={opt.value}
                    onChange={(v) => onUpdateOpt(oIdx, v)}
                    placeholder={`Opsi ${oIdx + 1}`}
                  />
                  {/* Tombol upload gambar opsi */}
                  <label
                    title="Tambah gambar opsi"
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-gray-300 hover:text-[#1a4fa0] hover:bg-[#eef5fb] transition-all shrink-0"
                  >
                    <ImagePlus size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpdateOptField(oIdx, "imageFile", file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button onClick={() => onRemoveOpt(oIdx)} className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex items-center justify-center shrink-0"><X size={13} /></button>
                </div>
                {/* Preview gambar opsi */}
                {previewUrl && (
                  <div className="ml-10 relative inline-block">
                    <img
                      src={previewUrl}
                      alt={`Gambar opsi ${oIdx + 1}`}
                      className="h-20 max-w-[180px] object-cover rounded-lg border border-[#d4e5fa]"
                    />
                    <button
                      onClick={() => {
                        onUpdateOptField(oIdx, "imageFile", null);
                        onUpdateOptField(oIdx, "image", null);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Hapus gambar"
                    >
                      <X size={11} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={onAddOpt} className="text-[14px] font-medium text-gray-400 hover:text-[#1a4fa0] flex items-center gap-2 ml-1 mt-2 transition-colors">
            <Plus size={16} /> Tambah opsi
          </button>
        </div>
      )}

      {question.type === "text" && (
        <div className="ml-2 mb-4">
          <input type="text" value={question.placeholder ?? ""} onChange={(e) => onUpdate("placeholder", e.target.value)}
            placeholder="Tulis jawabanmu di sini..."
            className="w-full text-[15px] text-gray-500 outline-none border-b border-dashed border-gray-100 focus:border-[#1a4fa0] transition-colors bg-transparent py-1" />
        </div>
      )}

      {/* ── Tipe FILE ───────────────────────────────────────────── */}
      {question.type === "file" && (
        <div className="ml-2 mb-4 space-y-3">
          {/* Attachment soal — pembuat bisa upload file soal/cerita */}
          <div>
            <p className="text-[12px] font-semibold text-[#1a4fa0] uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Paperclip size={12} /> Lampiran Soal (opsional)</p>
            <p className="text-[11.5px] text-gray-400 mb-2">Upload file soal/cerita yang akan ditampilkan kepada responden saat mengisi form.</p>
            <label className="flex items-center gap-3 w-full rounded-xl border-2 border-dashed border-[#c3d4e4] bg-[#f7fafd] py-3 px-4 cursor-pointer hover:border-[#1a4fa0] hover:bg-[#f0f6fe] transition-all">
              {question.attachment ? (
                <>
                  <FileText size={18} className="text-[#1a4fa0] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#102f56] truncate">{question.attachment.name ?? question.attachment}</p>
                    <p className="text-[11px] text-gray-400">Klik untuk ganti file lampiran</p>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud size={18} className="text-gray-400 shrink-0" />
                  <span className="text-[13px] text-gray-500">Klik untuk upload file lampiran soal</span>
                </>
              )}
              <input type="file" className="hidden" onChange={(e) => onUpdate("attachment", e.target.files?.[0])} />
            </label>
          </div>

          {/* Info jawaban file */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <Lightbulb size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-blue-700 leading-relaxed">
              <strong>Jawaban responden</strong> akan dikumpulkan dalam bentuk file upload. Responden akan diminta untuk mengunggah file sebagai jawaban mereka.
            </p>
          </div>
        </div>
      )}

      {/* Warning: audio + gambar di teks tidak bisa bersamaan */}
      {(question.audioFile || question.audio) && /<img/i.test(question.question || "") && (
        <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-amber-700 leading-relaxed">
            <strong>Konflik audio + gambar:</strong> Soal ini memiliki audio dan gambar di teks sekaligus. Saat disimpan akan error. Hapus gambar dari teks dan gunakan fitur <strong>Lampiran Soal</strong> sebagai gantinya.
          </p>
        </div>
      )}

      {/* ── Audio Lampiran (semua tipe soal) ───────────────────── */}
      <div className="mt-4 mb-1">
        <p className="text-[12px] font-extrabold text-[#1a4fa0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5">Audio Soal <span className="normal-case font-normal text-gray-400">(opsional)</span></span>
        </p>
        {question.audioFile || question.audio ? (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200">
            <Music size={16} className="text-purple-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-purple-700 truncate">
                {question.audioFile?.name ?? question.audio?.split("/").pop()}
              </p>
              {question.audioFile && (
                <audio controls src={URL.createObjectURL(question.audioFile)} className="mt-1.5 w-full h-8" />
              )}
              {!question.audioFile && question.audio && (
                <audio controls src={`${FORM_API_URL}${question.audio}`} className="mt-1.5 w-full h-8" />
              )}
            </div>
            <button
              onClick={() => { onUpdate("audioFile", null); onUpdate("audio", null); }}
              className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all shrink-0"
              title="Hapus audio"
            >
              <X size={13} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 w-full rounded-xl border-2 border-dashed border-[#c3d4e4] bg-[#f7fafd] py-3 px-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
            <Music size={20} className="text-purple-500 shrink-0" />
            <span className="text-[13px] text-gray-500">Klik untuk upload audio (mp3, wav, ogg, m4a)</span>
            <input
              type="file"
              accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const hasEmbeddedImage = /<img/i.test(question.question || "");
                  if (hasEmbeddedImage) {
                    onShowToast("Hapus gambar dari teks soal sebelum menambahkan audio. Gunakan fitur Lampiran Soal untuk gambar.");
                    e.target.value = "";
                    return;
                  }
                  onUpdate("audioFile", file);
                }
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-[#eef3f8]">
        <div className="flex items-center gap-1">
          <button title="Duplikat" onClick={onDuplicate} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#eef5fb] hover:text-[#1a4fa0] transition-all"><Copy size={16} /></button>
          <button title="Hapus" onClick={onRemove} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
          {/* Tombol sisipkan Pertanyaan Baru setelah ini */}
          {onAddQuestionAfter && (
            <button
              type="button"
              title="Sisipkan pertanyaan baru tepat setelah ini"
              onClick={onAddQuestionAfter}
              className="h-10 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-semibold text-[#1a4fa0] hover:bg-[#eef5fb] border border-dashed border-[#c7d8e8] hover:border-[#1a4fa0] transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} /> Soal Baru
            </button>
          )}
          {/* Tombol sisipkan Page Break */}
          {onAddPageBreakAfter && (
            <button
              type="button"
              title="Sisipkan Pemisah Halaman setelah pertanyaan ini"
              onClick={onAddPageBreakAfter}
              className="h-10 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-[#1a4fa0] hover:bg-[#eef5fb] border border-dashed border-gray-200 hover:border-[#1a4fa0] transition-all cursor-pointer"
            >
              <Layers size={14} className="text-[#1a4fa0]" /> + Page Break
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Score badge — tampil sesuai tipe score */}
          {scoreType === "genius" && totalSoal > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
              <Target size={12} /> {(100 / totalSoal).toFixed(1)} pts
            </span>
          )}
          {scoreType === "manual" && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-600"><Star size={12} /> Score:</span>
              <input
                type="number" min="0" max="100"
                value={question.score ?? 0}
                onChange={(e) => onUpdate("score", Number(e.target.value))}
                className="w-16 h-7 border border-amber-200 rounded-lg px-2 text-[12px] font-bold text-amber-700 bg-amber-50 outline-none focus:border-amber-400 text-center"
              />
              <span className="text-[11px] text-amber-500">pts</span>
            </div>
          )}

          <label className="flex items-center gap-2 text-[13.5px] font-medium text-gray-500 cursor-pointer select-none">
            Wajib diisi
            <input type="checkbox" checked={question.required} onChange={(e) => onUpdate("required", e.target.checked)} className="accent-[#1a4fa0]" style={{ width: 18, height: 18 }} />
          </label>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ── Responses Tab ──────────────────────────────────────────── */
function ResponsesTab({ formId, form }) {
  const navigate = useNavigate();
  const formSlug = form?.slug ?? form?.form_slug;
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("Ringkasan");
  const [exporting, setExporting]       = useState(false);
  const [exportAlert, setExportAlert]   = useState(null);
  const [detail, setDetail]             = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadDetail() {
    if (detail) return; // sudah di-fetch
    setDetailLoading(true);
    try {
      const res = await fetch(`${FORM_API_URL}/form/submit/detail?form_slug=${formSlug}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json().catch(() => ({}));
      setDetail(data?.data ?? []);
    } catch { setDetail([]); }
    finally { setDetailLoading(false); }
  }

  function handleSubTab(t) {
    setActiveSubTab(t);
    if ((t === "Jawaban" || t === "Responden") && !detail) loadDetail();
  }

  useEffect(() => {
    if (!formSlug) { setLoading(false); return; }
    api.get("/form/submit", { params: { form_slug: formSlug } })
      .then(res => setSummary(res.data?.data ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [formSlug]);

  const total     = summary?.total_submit ?? 0;
  const rawQ      = summary?.questions ?? [];
  const questionsFlat = rawQ.length > 0 && rawQ[0]?.soal
    ? rawQ.flatMap(pg => pg.soal ?? [])
    : rawQ;
  // Deduplicate by id supaya tidak double
  const questions = questionsFlat.filter((q, i, arr) => arr.findIndex(x => x.id === q.id) === i);
  const isPublic  = form?.status === "public" || form?.form_status === "public";
  const title     = form?.title ?? form?.form_title ?? "Form";

  // ── Export Excel — pakai endpoint backend ────────────────────
  async function handleExport() {
    if (total === 0) { setExportAlert({ type: "alert", title: "Tidak Ada Data", message: "Belum ada data untuk diekspor." }); return; }
    setExporting(true);
    try {
      const isQuiz = (form?.primary_kategori ?? form?.category) === "ujian";

      // Fetch detail jawaban per responden
      const res = await fetch(`${FORM_API_URL}/form/submit/detail?form_slug=${formSlug}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) { setExportAlert({ type: "error", title: "Gagal", message: "Gagal mengambil data jawaban." }); return; }
      const detailData = await res.json().catch(() => ({}));
      const pageData = detailData?.data ?? [];

      // Flatten soal dari semua pages
      const soalList = pageData.flatMap((pg) => pg.soal ?? pg);

      const optionsMap = new Map();
      soalList.forEach((s) => {
        (s.options ?? []).forEach((o) => {
          optionsMap.set(o.id, { value: o.value ?? o.option_value, is_correct: o.is_correct });
        });
      });

      const kelasSoal = soalList.find((s) =>
        (s.question ?? "").replace(/<[^>]*>/g, "").toLowerCase().includes("kelas")
      );

      const respondentMap = new Map();

      soalList.forEach((s) => {
        const soalScore = s.score ?? 0;
        (s.responses ?? []).forEach((resp) => {
          const sid = resp.submitted_id;
          if (!respondentMap.has(sid)) {
            respondentMap.set(sid, { submitted_id: sid, kelas: "Tidak Diketahui", total_score: 0 });
          }
          const row = respondentMap.get(sid);
          const raw = resp.answer;

          let formatted = "-";
          let isCorrect = false;

          if (typeof raw === "number" && optionsMap.has(raw)) {
            const opt = optionsMap.get(raw);
            formatted = opt.value;
            if (opt.is_correct) isCorrect = true;
          } else if (typeof raw === "string" && raw.includes(",")) {
            const ids = raw.split(",").map(x => parseInt(x.trim(), 10));
            const texts = ids.map(id => optionsMap.has(id) ? optionsMap.get(id).value : String(id));
            formatted = texts.join(", ");
            isCorrect = ids.every(id => optionsMap.has(id) && optionsMap.get(id).is_correct);
          } else if (raw != null) {
            formatted = String(raw);
          }

          if (isQuiz && isCorrect && soalScore > 0) {
            row.total_score += soalScore;
          }

          row[`soal_${s.id}`] = formatted;

          if (kelasSoal && s.id === kelasSoal.id) {
            row.kelas = formatted !== "-" ? formatted : "Tidak Diketahui";
          }
        });
      });

      const allRows = Array.from(respondentMap.values());

      function makeSheet(rows) {
        const sorted = [...rows].sort((a, b) => b.total_score - a.total_score);
        const headers = [
          "No",
          ...(kelasSoal ? ["Kelas"] : []),
          ...(isQuiz ? ["Total Score"] : []),
          ...soalList.map((s, i) => {
            const q = (s.question ?? "").replace(/<[^>]*>/g, "").trim();
            return `${i + 1}. ${q.slice(0, 60)}`;
          }),
        ];

        const data = sorted.map((row, i) => [
          i + 1,
          ...(kelasSoal ? [row.kelas] : []),
          ...(isQuiz ? [row.total_score] : []),
          ...soalList.map((s) => row[`soal_${s.id}`] ?? "-"),
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

        const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
          if (cell) {
            cell.s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "1F4E78" } },
              alignment: { horizontal: "center", vertical: "center" },
            };
          }
        }

        ws["!cols"] = headers.map((_h, i) => ({
          wch: i === 0 ? 5 : i <= (kelasSoal ? 1 : 0) + (isQuiz ? 1 : 0) ? 20 : 35
        }));

        return ws;
      }

      const wb = XLSX.utils.book_new();

      if (kelasSoal) {
        const byKelas = new Map();
        allRows.forEach(r => {
          const k = r.kelas || "Tidak Diketahui";
          if (!byKelas.has(k)) byKelas.set(k, []);
          byKelas.get(k).push(r);
        });

        XLSX.utils.book_append_sheet(wb, makeSheet(allRows), "Semua");

        byKelas.forEach((rows, kelas) => {
          const sheetName = kelas.slice(0, 31).replace(/[:\\/?*[\]]/g, "");
          XLSX.utils.book_append_sheet(wb, makeSheet(rows), sheetName || "Kelas");
        });
      } else {
        XLSX.utils.book_append_sheet(wb, makeSheet(allRows), "Hasil");
      }

      const titleClean = (title || "form").replace(/[^a-z0-9]/gi, "_");
      XLSX.writeFile(wb, `${titleClean}_results.xlsx`);

    } catch (e) {
      setExportAlert({ type: "error", title: "Gagal Ekspor", message: e.message || "Error tidak diketahui" });
    } finally { setExporting(false); }
  }

  return (
    <>
    <div className="min-h-full px-8 py-6 pb-16 transition-colors"
      style={{ background: "linear-gradient(135deg, var(--fm-bg) 0%, var(--fm-bg-2) 55%, var(--fm-bg-3) 100%)" }}>

      {/* FORM HEADING */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="m-0 text-[17px] font-bold" style={{ color: "var(--fm-text)" }}>{title}</h2>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: isPublic ? "rgba(22,166,107,0.12)" : "var(--fm-hover)", color: isPublic ? "#16a66b" : "var(--fm-text-2)" }}>
            {isPublic ? "Aktif" : "Draft"}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/form/${formSlug}/monitoring`)}
            className="h-[39px] px-5 rounded-lg text-[12px] font-semibold border cursor-pointer transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: "rgba(234,88,12,0.1)", color: "#ea580c", borderColor: "rgba(234,88,12,0.3)" }}
          >
            <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse inline-block" />
            Monitoring
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="h-[39px] px-5 rounded-lg text-[12px] font-semibold border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{ backgroundColor: "rgba(7,94,224,0.1)", color: "#075ee0" }}
          >
            {exporting ? "Mengekspor..." : "↓ Ekspor Excel"}
          </button>
          <button
            onClick={() => window.open(`/fill/${formSlug}`, "_blank")}
            className="h-[39px] px-5 rounded-lg bg-[#075ee0] text-white text-[12px] font-semibold border-none cursor-pointer hover:bg-[#0550c0] transition-colors"
          >
            Lihat Form ↗
          </button>
        </div>
      </div>

      {/* RESPONSE CONTAINER */}
      <div className="rounded-[13px] border overflow-hidden" style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>

        {/* SUB TABS */}
        <div className="h-[60px] flex items-center px-[22px] gap-9 border-b overflow-x-auto" style={{ borderColor: "var(--fm-card-border)" }}>
          {["Ringkasan", "Jawaban", "Responden"].map(t => (
            <button key={t} onClick={() => handleSubTab(t)}
              className="relative h-[60px] flex items-center text-[13px] font-semibold border-none bg-transparent cursor-pointer transition-colors whitespace-nowrap"
              style={{ color: activeSubTab === t ? "#075ee0" : "var(--fm-text-2)" }}>
              {t}
              {activeSubTab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#075ee0] rounded-t" />}
            </button>
          ))}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-8 h-8 border-[3px] border-[#dce8f7] border-t-[#075ee0] rounded-full animate-spin" />
            <span className="text-[12px]" style={{ color: "var(--fm-text-2)" }}>Memuat respons...</span>
          </div>
        )}

        {/* EMPTY */}
        {!loading && total === 0 && (
          <div className="py-16 text-center" style={{ color: "var(--fm-text-2)" }}>
            <Inbox size={36} className="mx-auto mb-2" style={{ color: "var(--fm-text-3)" }} />
            <h4 className="m-0 mb-1 text-[15px] font-bold" style={{ color: "var(--fm-text)" }}>Belum ada respons</h4>
            <p className="m-0 text-[12px]">Bagikan link form untuk mulai mengumpulkan respons.</p>
          </div>
        )}

        {/* CONTENT */}
        {!loading && total > 0 && (
          <>
            {/* ── RINGKASAN ── */}
            {activeSubTab === "Ringkasan" && (
            <>
            {/* STATISTICS */}
            <div className="grid grid-cols-4 gap-[15px] p-[22px] pb-[10px] max-[900px]:grid-cols-2">
              {[
                { icon: Users,        iconCls: "text-[#075ee0]", iconBg: "rgba(7,94,224,0.10)",   label: "Total Respon",        value: total,  sub: "responden" },
                { icon: CheckCircle2, iconCls: "text-[#18ae70]", iconBg: "rgba(24,174,112,0.10)", label: "Tingkat Penyelesaian", value: "100%", sub: "selesai" },
                { icon: Clock,        iconCls: "text-[#ee941c]", iconBg: "rgba(238,148,28,0.10)", label: "Rata-rata Waktu",      value: "—",    sub: "menit" },
                { icon: PieChart,     iconCls: "text-[#8e4de7]", iconBg: "rgba(142,77,231,0.10)", label: "Selesai Hari Ini",    value: 0,      sub: "responden" },
              ].map((s, i) => (
                <div key={i} className="min-h-[110px] border rounded-xl p-[17px] flex items-center gap-[15px]"
                  style={{ borderColor: "var(--fm-card-border)", backgroundColor: "var(--fm-hover)" }}>
                  <div className={`w-[43px] h-[43px] shrink-0 flex items-center justify-center rounded-[9px] ${s.iconCls}`}
                    style={{ backgroundColor: s.iconBg }}><s.icon size={20} /></div>
                  <div>
                    <p className="m-0 mb-1 text-[10px]" style={{ color: "var(--fm-text-2)" }}>{s.label}</p>
                    <h3 className="m-0 text-[23px] font-bold" style={{ color: "var(--fm-text)" }}>{s.value}</h3>
                    <span className="text-[10px]" style={{ color: "var(--fm-text-3)" }}>{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* PER-QUESTION CARDS */}
            {questions.map((q, qi) => {
              const opts    = q.options ?? [];
              const answered = opts.reduce((s, o) => s + (o.total_answer ?? 0), 0);
              const maxCount = Math.max(...opts.map(o => o.total_answer ?? 0), 1);

              return (
                <div key={q.id ?? qi} className="mx-[22px] mb-4 border rounded-xl overflow-hidden"
                  style={{ borderColor: "var(--fm-card-border)", backgroundColor: "var(--fm-card)" }}>
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 px-5 pt-5 pb-3 border-b" style={{ borderColor: "var(--fm-card-border)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[13px] font-bold" style={{ color: "var(--fm-text)" }}>{qi + 1}.</span>
                        <RichTextDisplay content={q.question} />
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize"
                          style={{ backgroundColor: "rgba(7,94,224,0.1)", color: "#075ee0" }}>{q.type}</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--fm-text-2)" }}>{answered} respon</p>
                    </div>
                    <ViewAllBtn q={q} total={total} formSlug={formSlug} />
                  </div>

                  {/* BAR CHART — radio/checkbox */}
                  {(q.type === "radio" || q.type === "checkbox") && opts.length > 0 && (
                    <div className="px-5 py-4 space-y-3">
                      {opts.map((opt, oi) => {
                        const count  = opt.total_answer ?? 0;
                        const pctVal = answered > 0 ? ((count / answered) * 100).toFixed(1) : "0.0";
                        const barPct = answered > 0 ? (count / maxCount) * 70 : 0;
                        return (
                          <div key={oi} className="flex items-center gap-3">
                            <span className="w-[30%] text-[12px] text-[#364a6e] font-medium truncate shrink-0">
                              {opt.value ?? opt.option_value ?? `Opsi ${oi+1}`}
                            </span>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--fm-hover)" }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${barPct}%`, background: CHART_COLORS[oi % CHART_COLORS.length] }} />
                              </div>
                              <span className="text-[11px] font-bold shrink-0 w-[52px] text-right" style={{ color: "var(--fm-text)" }}>
                                {count} <span className="font-normal" style={{ color: "var(--fm-text-3)" }}>({pctVal}%)</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {q.type === "text" && (
                    <div className="px-5 py-4">
                      <p className="text-[12px]" style={{ color: "var(--fm-text-2)" }}>
                        {answered > 0 ? `${answered} jawaban teks masuk — klik "View All" untuk lihat.` : "Belum ada jawaban teks."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            </>
            )}

            {/* ── JAWABAN per responden ── */}
            {activeSubTab === "Jawaban" && (
              <div className="p-[22px]">
                {detailLoading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-7 h-7 border-2 border-[#075ee0] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!detailLoading && detail && (() => {
                  // Flatten soal dari detail
                  const soalAll = (detail ?? []).flatMap(pg => pg.soal ?? pg);
                  // Build respondent map: submitted_id → { username, answers: {soal_id: answer} }
                  const respMap = new Map();
                  soalAll.forEach(s => {
                    (s.responses ?? []).forEach(r => {
                      if (!respMap.has(r.submitted_id)) respMap.set(r.submitted_id, { answers: {} });
                      respMap.get(r.submitted_id).answers[s.id] = r.answer;
                    });
                  });
                  const respRows = Array.from(respMap.entries());
                  if (respRows.length === 0) return <p className="text-center text-[13px] py-8" style={{ color: "var(--fm-text-2)" }}>Belum ada jawaban.</p>;
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px] border-collapse">
                        <thead>
                          <tr style={{ backgroundColor: "#1F4E78", color: "white" }}>
                            <th className="px-3 py-2 text-left font-semibold border border-[#2a5f8f] w-10">No</th>
                            {soalAll.map((s, i) => (
                              <th key={s.id ?? i} className="px-3 py-2 text-left font-semibold border border-[#2a5f8f] min-w-[120px] max-w-[200px]">
                                <div className="truncate">{(s.question ?? "").replace(/<[^>]*>/g, "").slice(0, 40)}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {respRows.map(([sid, data], ri) => (
                            <tr key={sid} style={{ backgroundColor: ri % 2 === 0 ? "var(--fm-card)" : "var(--fm-hover)" }}>
                              <td className="px-3 py-2 border border-[#e7edf6] text-center font-semibold" style={{ color: "var(--fm-text)" }}>{ri + 1}</td>
                              {soalAll.map((s, i) => {
                                const raw = data.answers[s.id];
                                let display = "-";
                                if (raw != null) {
                                  if (typeof raw === "number") {
                                    const opt = (s.options ?? []).find(o => o.id === raw);
                                    display = opt?.value ?? String(raw);
                                  } else display = String(raw);
                                }
                                return (
                                  <td key={s.id ?? i} className="px-3 py-2 border border-[#e7edf6] max-w-[200px]" style={{ color: "var(--fm-text)" }}>
                                    <div className="truncate">{display}</div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── RESPONDEN list ── */}
            {activeSubTab === "Responden" && (
              <div className="p-[22px]">
                {detailLoading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-7 h-7 border-2 border-[#075ee0] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!detailLoading && detail && (() => {
                  const soalAll = (detail ?? []).flatMap(pg => pg.soal ?? pg);
                  const respMap = new Map();
                  soalAll.forEach(s => {
                    (s.responses ?? []).forEach(r => {
                      if (!respMap.has(r.submitted_id)) respMap.set(r.submitted_id, { sid: r.submitted_id, answers: {} });
                      respMap.get(r.submitted_id).answers[s.id] = r.answer;
                    });
                  });
                  const rows = Array.from(respMap.values());
                  if (rows.length === 0) return <p className="text-center text-[13px] py-8" style={{ color: "var(--fm-text-2)" }}>Belum ada responden.</p>;
                  return (
                    <div className="space-y-3">
                      {rows.map((row, i) => (
                        <div key={row.sid} className="border rounded-xl p-4" style={{ borderColor: "var(--fm-card-border)", backgroundColor: "var(--fm-hover)" }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-[#1a4fa0] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </div>
                            <span className="text-[13px] font-bold" style={{ color: "var(--fm-text)" }}>Responden #{i + 1}</span>
                            <span className="text-[11px] ml-auto" style={{ color: "var(--fm-text-2)" }}>ID: {row.sid}</span>
                          </div>
                          <div className="space-y-1.5">
                            {soalAll.map((s, si) => {
                              const raw = row.answers[s.id];
                              let display = "-";
                              if (raw != null) {
                                if (typeof raw === "number") {
                                  const opt = (s.options ?? []).find(o => o.id === raw);
                                  display = opt?.value ?? String(raw);
                                } else display = String(raw);
                              }
                              return (
                                <div key={s.id ?? si} className="flex items-start gap-2 text-[12px]">
                                  <span className="shrink-0 w-5" style={{ color: "var(--fm-text-2)" }}>{si + 1}.</span>
                                  <span className="font-medium shrink-0 max-w-[40%] truncate" style={{ color: "var(--fm-text-2)" }}>
                                    {(s.question ?? "").replace(/<[^>]*>/g, "").slice(0, 35)}:
                                  </span>
                                  <span className="flex-1" style={{ color: "var(--fm-text)" }}>{display}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    <AlertModal
      open={!!exportAlert}
      type={exportAlert?.type ?? "alert"}
      title={exportAlert?.title}
      message={exportAlert?.message}
      onConfirm={() => setExportAlert(null)}
    />
    </>
  );
}

/* ── View All Answers Button + Modal ────────────────────────── */
function ViewAllBtn({ q, total, formSlug }) {
  const [open, setOpen]       = useState(false);
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadDetail() {
    setOpen(true);
    if (detail) return;
    setLoading(true);
    try {
      const res = await fetch(`${FORM_API_URL}/form/submit/detail?form_slug=${formSlug}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json().catch(() => ({}));
      setDetail(data?.data ?? []);
    } catch { setDetail([]); }
    finally { setLoading(false); }
  }

  // Extract answers for this soal from detail — detail = array of pages, each page has soal[]
  const answers = detail
    ? (detail ?? [])
        .flatMap(pg => pg.soal ?? pg)
        .filter(d => d.id === q.id)
        .flatMap(d => (d.responses ?? []).map(r => r.answer))
        .filter(a => a !== null && a !== undefined && a !== "")
    : [];

  return (
    <>
      <button onClick={loadDetail}
        className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-colors whitespace-nowrap"
        style={{ backgroundColor: "rgba(7,94,224,0.1)", color: "#075ee0" }}>
        View All →
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            style={{ backgroundColor: "var(--fm-card)", border: "1px solid var(--fm-card-border)" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-start justify-between gap-3" style={{ borderColor: "var(--fm-card-border)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--fm-text-2)" }}>Semua Jawaban</p>
                <RichTextDisplay content={q.question} />
              </div>
              <button onClick={() => setOpen(false)}
                className="text-xl leading-none border-none bg-transparent cursor-pointer shrink-0"
                style={{ color: "var(--fm-text-2)" }}>×</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-[#075ee0] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && answers.length === 0 && (
                <p className="text-[13px] text-center py-8" style={{ color: "var(--fm-text-2)" }}>Belum ada jawaban.</p>
              )}

              {!loading && answers.length > 0 && (
                <div className="space-y-2">
                  {answers.map((ans, i) => (
                    <div key={i} className="px-4 py-3 rounded-xl text-[13px]"
                      style={{ backgroundColor: "var(--fm-hover)", border: "1px solid var(--fm-card-border)", color: "var(--fm-text)" }}>
                      {typeof ans === "string" ? ans : JSON.stringify(ans)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t text-[12px] text-right" style={{ borderColor: "var(--fm-card-border)", color: "var(--fm-text-2)" }}>
              {answers.length} jawaban
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */
const CHART_COLORS = ["#3d91ef","#19c26b","#31b8b2","#ff626b","#a55be9","#f5a623","#9aa5b8"];
const DOT_COLORS   = CHART_COLORS; // backward compat

function pct(count, total) {
  if (!total) return 0;
  return ((count / total) * 100).toFixed(1);
}

function countToday(responses) {
  const today = new Date().toDateString();
  return responses.filter(r => r.submitted_at && new Date(r.submitted_at).toDateString() === today).length;
}

function buildConicGradient(options, total) {
  const COLORS = ["#3d91ef","#19c26b","#31b8b2","#ff626b","#a55be9","#f5a623","#9aa5b8"];
  let deg = 0;
  const stops = options.map((opt, i) => {
    const count = opt.total_answer ?? opt.count ?? 0;
    const share = total > 0 ? (count / total) * 360 : 0;
    const start = deg;
    deg += share;
    return `${COLORS[i % COLORS.length]} ${start}deg ${deg}deg`;
  });
  if (deg < 360) stops.push(`#e8eef7 ${deg}deg 360deg`);
  return `conic-gradient(${stops.join(", ")})`;
}

function buildQuestionStats(responses) {
  if (!responses.length) return [];
  // Kumpulkan semua soal dari setiap respons
  const soalMap = new Map();
  for (const resp of responses) {
    const qs = resp.questions ?? resp.soal ?? [];
    for (const q of qs) {
      const id = q.soal_id ?? q.id;
      if (!soalMap.has(id)) {
        soalMap.set(id, {
          soal_id: id,
          question: q.question,
          type: q.type,
          options: (q.options ?? []).map(o => ({ ...o, count: 0 })),
          textAnswers: [],
        });
      }
      const entry = soalMap.get(id);
      // Hitung pilihan yang dipilih
      if (q.type === "radio" || q.type === "checkbox") {
        for (const opt of (q.options ?? [])) {
          if (opt.is_user_selected) {
            const found = entry.options.find(o =>
              o.soal_option_id === opt.soal_option_id || o.option_value === opt.option_value
            );
            if (found) found.count++;
          }
        }
      }
      if (q.type === "text" && q.user_answer_text) {
        entry.textAnswers.push(q.user_answer_text);
      }
    }
  }
  return Array.from(soalMap.values());
}

/* ── Settings Tab ───────────────────────────────────────────── */
function SettingsTab({ form, onUpdateStatus, slug, onSaved }) {
  const isPublic   = form?.status === "public" || form?.form_status === "public";
  const isQuiz     = (form?.primary_kategori ?? form?.category) === "ujian";

  // Token state — persist di localStorage supaya tidak hilang saat form reload
  const tokenStorageKey = `token_active_${form?.slug ?? slug}`;
  const [tokenActive, setTokenActive] = useState(() => {
    if (form?.token_respon && form.token_respon !== "") return true;
    return localStorage.getItem(tokenStorageKey) === "true";
  });
  const [tokenValue, setTokenValue] = useState(form?.token_respon ?? "");
  const [tokenMode, setTokenMode]   = useState("random");
  const [tokenSaving, setTokenSaving] = useState(false);
  const [tokenMsg, setTokenMsg]       = useState("");

  // Sync token state saat form berubah
  useEffect(() => {
    if (form?.token_respon && form.token_respon !== "") {
      setTokenActive(true);
      setTokenValue(form.token_respon);
      localStorage.setItem(tokenStorageKey, "true");
    }
  }, [form?.token_respon, form?.id]);

  // Timer state
  const [duration, setDuration]   = useState(form?.duration ?? "");
  const [startAt, setStartAt]     = useState(
    (form?.start_at && Number(form.start_at) > 0) ? new Date(form.start_at).toISOString().slice(0,16) : ""
  );
  const [timerSaving, setTimerSaving] = useState(false);
  const [timerMsg, setTimerMsg]       = useState("");

  // Shuffle state
  const [isRandom, setIsRandom]   = useState(form?.is_random ?? false);
  const [shuffleSaving, setShuffleSaving] = useState(false);
  const [shuffleMsg, setShuffleMsg]       = useState("");

  // Score state
  const [scoreType, setScoreType] = useState(() =>
    localStorage.getItem(`score_type_${form?.slug ?? slug}`) ?? "none"
  );
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreMsg, setScoreMsg]       = useState("");

  const questions = form?.soal ?? [];

  function generateRandomToken() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({length: 8}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
  }

  async function saveToken(active, value) {
    setTokenSaving(true); setTokenMsg("");
    try {
      const res = await fetch(`${FORM_API_URL}/form/setting?form_slug=${form?.slug ?? slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          duration: duration ? Number(duration) : null,
          start_at: startAt ? new Date(startAt).getTime() : null,
          is_random: isRandom,
          token_respon: active ? (value || null) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTokenMsg("Token berhasil disimpan!");
        setTokenActive(active);
        onSaved?.({
          duration: duration ? Number(duration) : null,
          start_at: startAt ? new Date(startAt).getTime() : null,
          is_random: isRandom,
          token_respon: active ? (value || null) : null,
        });
        if (active) {
          localStorage.setItem(tokenStorageKey, "true");
        } else {
          localStorage.removeItem(tokenStorageKey);
          setTokenValue("");
        }
      } else {
        setTokenMsg(data?.message || "Gagal.");
      }
    } catch { setTokenMsg("Gagal menyimpan."); }
    finally { setTokenSaving(false); setTimeout(() => setTokenMsg(""), 3000); }
  }

  async function saveTimer() {
    // Kedua kolom kosong = hapus timer (kirim null ke BE)
    setTimerSaving(true); setTimerMsg("");
    try {
      const res = await fetch(`${FORM_API_URL}/form/setting?form_slug=${form?.slug ?? slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          duration: duration ? Number(duration) : null,
          start_at: startAt ? new Date(startAt).getTime() : null,
          is_random: isRandom,
          token_respon: tokenActive ? (tokenValue || null) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setTimerMsg(res.ok ? "Berhasil disimpan!" : (data?.message || "Gagal menyimpan."));
      if (res.ok) onSaved?.({
        duration: duration ? Number(duration) : null,
        start_at: startAt ? new Date(startAt).getTime() : null,
        is_random: isRandom,
      });
    } catch { setTimerMsg("Gagal menyimpan."); }
    finally { setTimerSaving(false); setTimeout(() => setTimerMsg(""), 3000); }
  }

  async function saveShuffleSetting(val) {
    setIsRandom(val);
    setShuffleSaving(true); setShuffleMsg("");
    try {
      const res = await fetch(`${FORM_API_URL}/form/setting?form_slug=${form?.slug ?? slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          duration: duration ? Number(duration) : null,
          start_at: startAt ? new Date(startAt).getTime() : null,
          is_random: val,
          token_respon: tokenActive ? (tokenValue || null) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setShuffleMsg(res.ok ? `Shuffle ${val ? "diaktifkan" : "dinonaktifkan"}` : (data?.message || "Gagal."));
      if (res.ok) onSaved?.({ is_random: val });
    } catch { setShuffleMsg("Gagal menyimpan."); }
    finally { setShuffleSaving(false); setTimeout(() => setShuffleMsg(""), 3000); }
  }

  async function saveGeniusScore() {
    if (!questions.length) { setScoreMsg("Tidak ada soal."); return; }
    setScoreSaving(true); setScoreMsg("");
    const perSoal = parseFloat((100 / questions.length).toFixed(2));
    try {
      for (const q of questions) {
        if (!q.id) continue;
        const fd = new FormData();
        fd.append("data", JSON.stringify({ soal: { question: q.question, type: q.type, score: perSoal } }));
        await fetch(`${FORM_API_URL}/form/soal/${q.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: fd,
        });
      }
      setScoreMsg(`Genius Score (${perSoal} pts/soal) berhasil disimpan!`);
    } catch { setScoreMsg("Gagal menyimpan score."); }
    finally { setScoreSaving(false); setTimeout(() => setScoreMsg(""), 4000); }
  }

  function handleScoreTypeChange(val) {
    setScoreType(val);
    const key = `score_type_${form?.slug ?? slug}`;
    localStorage.setItem(key, val);
    // Dispatch storage event supaya PertanyaanTab ikut update
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: val }));
  }

  // Banner state
  const [bannerPreview, setBannerPreview] = useState(form?.banner ?? form?.form_banner ?? null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");
  const bannerInputRef = useRef(null);

  async function uploadBanner(file) {
    if (!file) return;
    setBannerUploading(true); setBannerMsg("");
    try {
      const fd = new FormData();
      fd.append("banner", file);
      const res = await fetch(`${FORM_API_URL}/form/banner?form_slug=${form?.slug ?? slug}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBannerPreview(data?.data?.banner);
        onSaved?.({ banner: data?.data?.banner, form_banner: data?.data?.banner });
        setBannerMsg("Banner berhasil diupdate!");
      } else {
        setBannerMsg(data?.message || "Gagal upload banner.");
      }
    } catch { setBannerMsg("Gagal upload banner."); }
    finally { setBannerUploading(false); setTimeout(() => setBannerMsg(""), 3000); }
  }

  async function deleteBanner() {
    setBannerUploading(true); setBannerMsg("");
    try {
      const res = await fetch(`${FORM_API_URL}/form/banner?form_slug=${form?.slug ?? slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setBannerPreview(null);
        onSaved?.({ banner: null, form_banner: null });
        setBannerMsg("Banner berhasil dihapus.");
      } else {
        setBannerMsg("Gagal hapus banner.");
      }
    } catch { setBannerMsg("Gagal hapus banner."); }
    finally { setBannerUploading(false); setTimeout(() => setBannerMsg(""), 3000); }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">

      {/* Banner Form */}
      <div className="rounded-2xl border shadow-sm p-6 space-y-4" style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
        <div>
          <p className="font-bold text-[15px]" style={{ color: "var(--fm-text)" }}>Banner Form</p>
          <p className="text-[13px] mt-1" style={{ color: "var(--fm-text-2)" }}>Gambar header yang ditampilkan di atas form. Ukuran optimal 1200×400px.</p>
        </div>

        {/* Preview banner */}
        {bannerPreview ? (
          <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "var(--fm-card-border)" }}>
            <img
              src={bannerPreview.startsWith("http") ? bannerPreview : `${FORM_API_URL}${bannerPreview}`}
              alt="Banner"
              className="w-full h-[140px] object-cover"
            />
            <button
              onClick={deleteBanner}
              disabled={bannerUploading}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md disabled:opacity-60"
              title="Hapus banner"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            className="w-full h-[120px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
            style={{ borderColor: "var(--fm-card-border)", backgroundColor: "var(--fm-hover)" }}
            onClick={() => bannerInputRef.current?.click()}
          >
            <ImagePlus size={24} style={{ color: "var(--fm-text-3)" }} />
            <span className="text-[13px] font-medium" style={{ color: "var(--fm-text-2)" }}>Klik untuk upload banner</span>
            <span className="text-[11px]" style={{ color: "var(--fm-text-3)" }}>JPG, PNG, WEBP — maks 5MB</span>
          </div>
        )}

        <input
          ref={bannerInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) uploadBanner(e.target.files[0]); e.target.value = ""; }}
        />

        {bannerPreview && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all disabled:opacity-60"
            style={{ borderColor: "var(--fm-card-border)", color: "var(--fm-text-2)", backgroundColor: "var(--fm-hover)" }}
          >
            <ImagePlus size={15} />
            {bannerUploading ? "Mengupload..." : "Ganti Banner"}
          </button>
        )}

        {bannerMsg && (
          <p className={`text-[12px] font-medium ${bannerMsg.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>
            {bannerMsg}
          </p>
        )}
      </div>

      {/* Status Publikasi */}
      <div className="rounded-2xl border shadow-sm p-6 flex items-center justify-between gap-4" style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
        <div>
          <p className="font-bold text-[15px]" style={{ color: "var(--fm-text)" }}>Status Publikasi</p>
          <p className="text-[13px] mt-1" style={{ color: "var(--fm-text-2)" }}>
            {isPublic ? "Form dapat diisi oleh siapa saja dengan link." : "Form bersifat privat."}
          </p>
        </div>
        <Toggle value={isPublic} onChange={() => onUpdateStatus(isPublic ? "private" : "public")} />
      </div>

      {/* Token Responden */}
      <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><LockKeyhole size={18} className="text-blue-500" /></span>
            <div>
              <p className="font-bold text-gray-700 text-[15px]">Token Responden</p>
              <p className="text-[13px] text-gray-400 mt-0.5">
                {tokenActive
                  ? <span>Token aktif — responden wajib memasukkan kode. <span className="font-mono font-bold text-[#1a4fa0]">{form?.token_respon && `(${form.token_respon})`}</span></span>
                  : "Tidak ada token — form dapat diisi siapa saja."
                }
              </p>
            </div>
          </div>
          <Toggle value={tokenActive} onChange={v => {
            if (!v) { saveToken(false, ""); }
            else { setTokenActive(true); }
          }} />
        </div>

        {/* Edit area — tampil saat token aktif */}
        {tokenActive && (
          <div className="space-y-3 pt-1">
            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setTokenMode("random")}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition ${tokenMode === "random" ? "bg-[#1a4fa0] text-white border-[#1a4fa0]" : "bg-white text-gray-500 border-gray-200 hover:border-[#1a4fa0]"}`}
              ><Dices size={14} className="inline-block mr-1 align-[-2px]" />Acak Otomatis</button>
              <button
                onClick={() => setTokenMode("manual")}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition ${tokenMode === "manual" ? "bg-[#1a4fa0] text-white border-[#1a4fa0]" : "bg-white text-gray-500 border-gray-200 hover:border-[#1a4fa0]"}`}
              ><PenLine size={14} className="inline-block mr-1 align-[-2px]" />Ketik Manual</button>
            </div>

            {/* Input area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenValue}
                readOnly={tokenMode === "random"}
                onChange={e => setTokenValue(e.target.value.toUpperCase())}
                placeholder="Token belum dibuat"
                maxLength={20}
                className={`flex-1 border rounded-xl px-3.5 py-2.5 text-[14px] font-mono outline-none transition focus:border-[#1a4fa0] focus:ring-2 focus:ring-[#1a4fa0]/10 ${tokenMode === "random" ? "bg-gray-50 text-gray-500 border-gray-200 cursor-default" : "bg-white text-gray-800 border-gray-300"}`}
              />
              {tokenMode === "random" && (
                <button
                  onClick={() => setTokenValue(generateRandomToken())}
                  className="px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13px] font-semibold border border-gray-200 transition"
                  title="Generate token baru"
                ><RefreshCw size={15} /></button>
              )}
            </div>

            {/* Tombol simpan */}
            <button
              onClick={() => saveToken(true, tokenMode === "random" ? tokenValue : tokenValue.trim())}
              disabled={tokenSaving || !tokenValue.trim()}
              className="w-full py-2.5 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50 transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#1a4fa0,#2563eb)" }}
            >
              {tokenSaving ? "Menyimpan..." : <><Save size={14} className="inline-block mr-1 align-[-2px]" />Simpan Token</>}
            </button>

            {tokenMsg && (
              <p className={`text-[12px] font-medium ${tokenMsg.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>
                {tokenMsg}
              </p>
            )}
          </div>
        )}

        {/* Pesan saat token nonaktif */}
        {!tokenActive && tokenMsg && (
          <p className={`text-[12px] font-medium ${tokenMsg.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>
            {tokenMsg}
          </p>
        )}
      </div>

      {/* Score / Penilaian — hanya untuk kuis */}
      {isQuiz && (
        <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><Trophy size={18} className="text-indigo-500" /></span>
            <div>
              <p className="font-bold text-gray-700 text-[15px]">Penilaian / Score</p>
              <p className="text-[13px] text-gray-400">Atur sistem penilaian untuk kuis ini</p>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tipe Skor</label>
            <select
              value={scoreType}
              onChange={e => handleScoreTypeChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[14px] bg-white outline-none focus:border-[#1a4fa0] focus:ring-2 focus:ring-[#1a4fa0]/10 transition"
            >
              <option value="none">Tanpa Skor</option>
              <option value="genius">Genius Score (Otomatis 100/N soal)</option>
              <option value="manual">Manual Score (per soal)</option>
            </select>
          </div>

          {scoreType === "genius" && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-[13px] text-indigo-700 font-medium mb-1 flex items-center gap-1.5">
                <Target size={14} className="shrink-0" />
                <span>Setiap soal mendapat <strong>{questions.length > 0 ? (100 / questions.length).toFixed(1) : "—"} pts</strong> (total 100 pts)</span>
              </p>
              <p className="text-[12px] text-indigo-500 mb-3">Skor dibagi rata ke {questions.length} soal secara otomatis.</p>
              <button onClick={saveGeniusScore} disabled={scoreSaving || !questions.length}
                className="px-4 py-2 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50 transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                {scoreSaving ? "Menyimpan..." : <><Save size={14} className="inline-block mr-1 align-[-2px]" />Simpan Genius Score</>}
              </button>
              {scoreMsg && <p className="text-[12px] mt-2 text-indigo-700 font-medium">{scoreMsg}</p>}
            </div>
          )}

          {scoreType === "manual" && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-[13px] text-amber-700 font-medium mb-2 flex items-center gap-1.5">
                <Star size={14} className="shrink-0" />
                <span>Atur skor manual langsung di setiap soal di tab <strong>Pertanyaan</strong>.</span>
              </p>
              <p className="text-[12px] text-amber-600">Setiap soal memiliki input score sendiri.</p>
              {scoreMsg && <p className="text-[12px] mt-2 text-amber-700 font-medium">{scoreMsg}</p>}
            </div>
          )}
        </div>
      )}

      {/* Shuffle soal */}
      {isQuiz && (
        <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0"><Shuffle size={18} className="text-purple-500" /></span>
              <div>
                <p className="font-bold text-gray-700 text-[15px]">Acak Urutan Soal</p>
                <p className="text-[13px] text-gray-400">Setiap responden mendapat urutan soal yang berbeda</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {shuffleSaving && <span className="text-[12px] text-gray-400">Menyimpan...</span>}
              <button onClick={() => saveShuffleSetting(!isRandom)}
                className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${isRandom ? "bg-[#1a4fa0]" : "bg-gray-200"}`}
                disabled={shuffleSaving}>
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${isRandom ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>
          {shuffleMsg && <p className="text-[13px] font-medium text-[#1a4fa0] mt-2">{shuffleMsg}</p>}
        </div>
      )}

      {/* Timer */}
      <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Timer size={18} className="text-blue-500" /></span>
          <div>
            <p className="font-bold text-gray-700 text-[15px]">Timer Pengerjaan</p>
            <p className="text-[13px] text-gray-400">Atur waktu mulai dan durasi pengerjaan form</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Waktu Mulai</label>
            <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[14px] bg-white outline-none focus:border-[#1a4fa0] focus:ring-2 focus:ring-[#1a4fa0]/10 transition" />
            <p className="text-[11px] text-gray-400 mt-1">Kosongkan jika bisa dikerjakan kapan saja</p>
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Durasi (menit)</label>
            <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="contoh: 60"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-[14px] bg-white outline-none focus:border-[#1a4fa0] focus:ring-2 focus:ring-[#1a4fa0]/10 transition" />
            <p className="text-[11px] text-gray-400 mt-1">Kosongkan jika tidak ada batas waktu</p>
          </div>
        </div>

        <button onClick={saveTimer} disabled={timerSaving}
          className="px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold disabled:opacity-50 transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#1a4fa0,#1e6fc7)" }}>
          {timerSaving ? "Menyimpan..." : "Simpan Timer"}
        </button>
        {timerMsg && <p className="text-[13px] font-medium text-[#1a4fa0]">{timerMsg}</p>}
      </div>

      {/* Presentasi */}
      <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="w-10 h-10 rounded-xl bg-[#eef5fb] flex items-center justify-center shrink-0"><Palette size={18} className="text-[#1a4fa0]" /></span>
          <div>
            <p className="font-bold text-gray-700 text-[15px]">Presentasi</p>
            <p className="text-[13px] text-gray-400">Pengaturan tampilan formulir</p>
          </div>
        </div>
        <Toggle />
      </div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  const [on, setOn] = useState(value ?? false);
  function handleClick() {
    const next = !on;
    setOn(next);
    onChange && onChange(next);
  }
  return (
    <button
      onClick={handleClick}
      className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${on ? "" : "bg-gray-200"}`}
      style={on ? { backgroundColor: "#1a4fa0" } : {}}
    >
      <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

/* ── Import Docx Button ─────────────────────────────────────── */
function ImportDocxButton({ slug, onImported, onImportedSilent, onImportGuard, hasUnsaved, onSaveFirst }) {
  const [importing, setImporting] = useState(false);
  const [savingFirst, setSavingFirst] = useState(false);
  const [alertState, setAlertState] = useState({ open: false, type: "info", title: "", message: "" });

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (hasUnsaved && onSaveFirst) {
      setSavingFirst(true);
      try { await onSaveFirst(); } catch {}
      setSavingFirst(false);
    }

    if (!file.name.toLowerCase().endsWith(".docx")) {
      setAlertState({ open: true, type: "error", title: "Format File Tidak Valid", message: "Hanya file berekstensi .docx yang diperbolehkan untuk impor soal." });
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setAlertState({ open: true, type: "warning", title: "Ukuran File Terlalu Besar", message: `Ukuran file ${(file.size / (1024 * 1024)).toFixed(2)} MB melebihi batas maksimal 5 MB.` });
      return;
    }

    setImporting(true);
    onImportGuard?.(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${FORM_API_URL}/form/soal/import?form_slug=${slug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Gagal mengimpor file.");
      const count = data?.data?.list_soal?.length ?? 0;
      setAlertState({ open: true, type: "success", title: "Impor Soal Berhasil", message: `Berhasil mengimpor ${count} butir soal dari dokumen Word ke dalam formulir.` });
      setTimeout(() => { onImportedSilent?.(); }, 500);
    } catch (e) {
      setAlertState({ open: true, type: "error", title: "Gagal Impor Soal", message: e.message || "Terjadi kesalahan saat memproses file .docx." });
      onImportGuard?.(false);
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <label
        className="w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-[15px] font-semibold transition-all cursor-pointer"
        style={{ borderColor: "var(--fm-card-border)", color: importing || savingFirst ? "var(--fm-text-3)" : "var(--fm-text-2)", backgroundColor: "transparent", opacity: importing || savingFirst ? 0.6 : 1 }}
        onMouseEnter={e => { if (!importing && !savingFirst) { e.currentTarget.style.borderColor = "#1a4fa0"; e.currentTarget.style.color = "#1a4fa0"; }}}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--fm-card-border)"; e.currentTarget.style.color = "var(--fm-text-2)"; }}
      >
        {savingFirst ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Menyimpan dulu...
          </>
        ) : importing ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Mengimpor soal...
          </>
        ) : (
          <>
            <UploadCloud size={20} /> Impor Soal (.docx)
          </>
        )}
        <input type="file" accept=".docx" onChange={handleFile} disabled={importing || savingFirst} className="hidden" />
      </label>
      <AlertModal
        open={alertState.open}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onConfirm={() => setAlertState({ ...alertState, open: false })}
      />
    </>
  );
}

/* ── Template Guide Modal ───────────────────────────────────── */
function TemplateGuideModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sections = [
    {
      type: "Pilihan Ganda",
      tipe: "Tipe: radio",
      tag: "bg-blue-50 text-blue-700 border-blue-200",
      example: `1. Berapakah nilai dari √x + 16 jika x = 9?
   A. 17
   B. 19
   C. 21
   D. 25
Kunci: B Tipe: radio`,
      notes: [
        "Nomor soal diakhiri titik (1.) atau kurung (1))",
        "Pilihan pakai huruf kapital diakhiri titik (A.) atau kurung (A))",
        "Kunci: diisi huruf jawaban yang benar",
        "Tipe: radio untuk pilihan ganda satu jawaban",
      ],
    },
    {
      type: "Kotak Centang",
      tipe: "Tipe: checkbox",
      tag: "bg-violet-50 text-violet-700 border-violet-200",
      example: `2. Manakah bilangan prima di bawah ini?
   A. 2
   B. 4
   C. 5
   D. 9
Kunci: A, C Tipe: checkbox`,
      notes: [
        "Kunci bisa lebih dari satu, pisahkan dengan koma (A, C)",
        "Tipe: checkbox untuk jawaban lebih dari satu",
      ],
    },
    {
      type: "Jawaban Singkat",
      tipe: "Tipe: text",
      tag: "bg-emerald-50 text-emerald-700 border-emerald-200",
      example: `3. Sebutkan ibu kota Indonesia!
Kunci: - Tipe: text`,
      notes: [
        "Tidak perlu pilihan jawaban A/B/C/D",
        "Tipe: text untuk jawaban isian bebas",
      ],
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#e5eef7]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-[#e5eef7] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eef5fb] flex items-center justify-center text-[#1a4fa0]">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#102f56]">Panduan Struktur Template</h3>
              <p className="text-[12px] text-gray-400">Format penulisan soal di file .docx</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Intro */}
          <div className="bg-[#f0f7ff] rounded-2xl p-4 border border-[#d0e6f7] text-[13px] text-[#1a4fa0] leading-relaxed">
            Tulis soal di file <span className="font-bold">.docx</span> mengikuti format di bawah, lalu unggah. Sistem akan otomatis membaca dan mengisi soal ke formulir.
          </div>

          {/* Format per tipe */}
          {sections.map((s) => (
            <div key={s.type} className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <ChevronRight size={14} className="text-[#1a4fa0]" />
                <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full border ${s.tag}`}>{s.type}</span>
                <code className="text-[11.5px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-mono">{s.tipe}</code>
              </div>

              {/* Contoh teks */}
              <pre className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[12.5px] font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
                {s.example}
              </pre>

              {/* Keterangan */}
              <ul className="space-y-1 pl-1">
                {s.notes.map((n, i) => (
                  <li key={i} className="text-[12px] text-gray-500 flex items-start gap-1.5">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Aturan umum */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <p className="text-[12.5px] font-bold text-amber-800">Aturan Umum</p>
            <ul className="space-y-1.5">
              {[
                "Nomor soal diakhiri titik (1.) atau kurung tutup (1)).",
                "Pilihan jawaban pakai huruf kapital diakhiri titik (A.) atau kurung (A)).",
                "Kunci jawaban ditulis: Kunci: B — untuk checkbox multi jawaban: Kunci: A, C",
                "Tipe soal ditulis: Tipe: radio / checkbox / text / file / rating",
                "Kunci dan Tipe boleh di baris yang sama atau baris terpisah setelah pilihan terakhir.",
                "Pisahkan antar soal dengan baris kosong.",
                "Ukuran file maksimal 5 MB.",
              ].map((r, i) => (
                <li key={i} className="text-[12px] text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA unduh */}
          <a
            href="/soal.docx"
            download="Template_Soal_FormMaker.docx"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1a4fa0] text-white text-[13.5px] font-semibold hover:opacity-90 transition-all shadow-md"
          >
            <Download size={16} /> Unduh Template Siap Pakai
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── QR Code Modal ──────────────────────────────────────────── */
function QrModal({ slug, formTitle, onClose }) {
  const [qrSrc, setQrSrc]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
    const fillUrl = `${baseUrl}/fill/${slug}`;
    QRCode.toDataURL(fillUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#102f56", light: "#ffffff" },
    })
      .then(url => setQrSrc(url))
      .catch(() => setError("Gagal membuat QR Code."))
      .finally(() => setLoading(false));
  }, [slug]);

  function downloadQr() {
    if (!qrSrc) return;
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `qrcode-${slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-[16px] flex items-center gap-2">
            <QrCode size={18} className="text-[#1a4fa0]" /> QR Code Form
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-[22px] leading-none">×</button>
        </div>

        <p className="text-[13px] text-gray-400 mb-4 truncate">"{formTitle}"</p>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Membuat QR Code...</p>
          </div>
        )}

        {error && (
          <div className="py-6 text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && qrSrc && (
          <>
            <div className="flex justify-center mb-4">
              <img
                src={qrSrc}
                alt="QR Code Form"
                className="w-52 h-52 rounded-xl border border-[#e5eef7] shadow-sm"
              />
            </div>
            <p className="text-[12px] text-gray-400 mb-5">
              Scan QR ini untuk mengisi form langsung.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={downloadQr}
                className="w-full py-3 rounded-xl text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
                style={{ backgroundColor: "#1a4fa0" }}
              >
                <Download size={16} /> Download PNG
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Tutup
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
