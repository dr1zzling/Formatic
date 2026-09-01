import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { FORM_API_URL } from "../../utils/api";
import { socket } from "../../utils/socket";
import { ArrowLeft, Link2, Trash2, Plus, Copy, Share2, Check, ListPlus, FileQuestion, FileText, UploadCloud, GripVertical, ImagePlus, X, QrCode, Download } from "lucide-react";
import QuillEditor from "../../components/QuillEditor";
import RichTextDisplay from "../../components/RichTextDisplay";
import Toast, { useToast } from "../../components/Toast";

const QUESTION_TYPES = [
  { value: "radio",    label: "Pilihan Ganda" },
  { value: "checkbox", label: "Kotak Centang" },
  { value: "text",     label: "Jawaban Singkat" },
  { value: "file",     label: "Unggah File" },
];
const TABS = ["Pertanyaan", "Jawaban", "Setelan"];

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
  const isSavingRef = useRef(false);

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
          soalFlat = data.soal.flatMap(p => p.soal ?? []);
        } else {
          soalFlat = data.soal;
        }
      }

      setQuestions(prev => {
        const fromDB = soalFlat.map((s) => ({
          id: s.id, question: s.question, type: s.type, required: true,
          page: s.page ?? 1,
          score: s.score ?? null,
          options: (s.options ?? []).map((o) => ({
            id: o.id, value: o.value ?? o.option_value, is_correct: o.is_correct,
            image: o.image ?? null,
          })),
        }));
        const unsaved = prev.filter(q => q._new);
        return [...fromDB, ...unsaved];
      });

      setCollabNotice("✏️ Collaborator memperbarui soal");
      setTimeout(() => setCollabNotice(""), 4000);
    };

    socket.on("formUpdated", handleFormUpdated);

    return () => {
      socket.emit("leaveForm", { slug });
      socket.off("formUpdated", handleFormUpdated);
      socket.disconnect();
    };
  }, [slug]);

  async function loadForm(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await api.get("/form/slug", { params: { slug } });
      const f   = res.data?.data;
      if (f) {
        setForm(f);
        setQuestions(prev => {
          // Backend return soal sebagai array of { page, soal: [...] } atau flat array
          let soalFlat = [];
          if (Array.isArray(f?.soal)) {
            // Cek apakah format baru (array of pages) atau lama (flat)
            if (f.soal.length > 0 && f.soal[0]?.soal) {
              // Format baru: { page, soal: [] }[]
              soalFlat = f.soal.flatMap(p => p.soal ?? []);
            } else {
              soalFlat = f.soal;
            }
          }
          const fromDB = soalFlat.map((s) => ({
            id: s.id, question: s.question, type: s.type, required: true,
            page: s.page ?? 1,
            score: s.score ?? null,
            audio: s.audio ?? null,
            options: (s.options ?? []).map((o) => ({
              id: o.id, value: o.value ?? o.option_value, is_correct: o.is_correct,
              image: o.image ?? null,
            })),
          }));
          const unsaved = prev.filter(q => q._new);
          return [...fromDB, ...unsaved];
        });

        // Ambil role user untuk form ini dari endpoint my forms
        try {
          const myRes = await api.get("/form/user");
          const myForms = myRes.data?.data?.forms ?? [];
          const match = myForms.find(mf => mf.form_slug === slug);
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

  function addQuestion() {
    setQuestions((prev) => [...prev, {
      _new: true, question: "", type: "radio", required: true,
      options: [{ value: "" }, { value: "" }],
    }]);
  }
  function updateQ(idx, field, val) {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q));
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
      arr.splice(to, 0, item);
      return arr;
    });
  }
  function duplicateQ(idx) {
    setQuestions((prev) => {
      const c = [...prev];
      c.splice(idx + 1, 0, { ...prev[idx], _new: true, id: undefined });
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

    // Survey: semua soal di page 1. Ujian: page = urutan soal (1-indexed)
    const isQuiz = form?.category === "ujian";
    const getPage = (globalIdx) => isQuiz ? globalIdx + 1 : 1;

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
            const idx = questions.findIndex(x => x.id === q.id);
            const pageVal = getPage(idx);
            const hasOpts = ["radio", "checkbox", "rating"].includes(q.type);
            const payload = {
              soal: { question: q.question, type: q.type, page: pageVal, score: q.score ?? null,
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
          const globalIdx = questions.findIndex(x => x === q);
          const pageVal = getPage(globalIdx);
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
      showToast("❌ " + (e.message || "Gagal menyimpan soal."));
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
        method: "PATCH",
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
    navigator.clipboard.writeText(`${window.location.origin}/fill/${slug}`);
    showToast("Link berhasil disalin!");
  }

  if (loading) return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Memuat form...</p>
        </div>
      </div>
    </div>
  );

  if (error && !form) return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-4">😕</div>
          <p className="font-semibold text-gray-700">{error}</p>
          <button onClick={() => navigate("/my-forms")} className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#1a4fa0" }}>Kembali</button>
        </div>
      </div>
    </div>
  );

  const isPublished = form?.status === "public" || form?.form_status === "public";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-[52px] md:pt-0">
        {/* ── Top Bar ───────────────────────────────────── */}
        <header className="flex items-center gap-3 px-4 md:px-6 xl:px-9 py-3.5 border-b border-[#dae6f1] bg-white/95 backdrop-blur shrink-0" style={{ boxShadow: "0 1px 0 rgba(23,64,120,0.04), 0 6px 18px rgba(23,64,120,0.05)" }}>
          <button onClick={() => navigate("/my-forms")} className="w-10 h-10 rounded-xl hover:bg-[#eef5fb] flex items-center justify-center text-gray-500 hover:text-[#1a4fa0] transition-all">
            <ArrowLeft size={19} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate text-[17px] leading-tight">
              {form?.title ?? form?.form_title ?? "Form"}
            </h1>
            <p className="text-[12.5px] text-gray-400 hidden sm:block">{form?.category}</p>
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
                  const collabLink = `${window.location.origin}/form/${slug}/collaborate?token=${form?.token_collab ?? ""}`;
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
        <div className="flex gap-1 px-4 md:px-6 xl:px-9 border-b border-[#dae6f1] bg-white/95 backdrop-blur shrink-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[14.5px] font-semibold border-b-2 transition-all whitespace-nowrap -mb-px ${
                activeTab === tab
                  ? "border-[#1a4fa0] text-[#1a4fa0]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
              {tab === "Pertanyaan" && questions.length > 0 && (
                <span className="ml-2 bg-[#eaf1fb] text-[#1a4fa0] text-[12px] px-2 py-0.5 rounded-full font-bold">
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
              onUpdateQ={updateQ} onUpdateOpt={updateOpt} onUpdateOptField={updateOptField}
              onAddOpt={addOpt} onRemoveOpt={removeOpt}
              onRemoveQ={removeQ} onDuplicateQ={duplicateQ}
              onToggleCorrect={toggleCorrect}
              onReorder={reorderQ}
              onCopyLink={copyLink}
              onShowToast={showToast}
              onImported={loadForm}
              onImportedSilent={() => loadForm(true)}
            />
          )}
          {activeTab === "Jawaban" && (
            <ResponsesTab formId={form?.id ?? form?.form_id} form={form} />
          )}
          {activeTab === "Setelan" && (
            <SettingsTab form={form} onUpdateStatus={updateStatus} slug={slug} />
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

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-4xl mb-3">🗑️</p>
            <h3 className="font-bold text-gray-800 mb-1">Hapus Form?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Form "<strong>{form?.title ?? form?.form_title}</strong>" akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={deleteForm} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}

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
function PertanyaanTab({ form, slug, questions, error, onAddQuestion, onUpdateQ, onUpdateOpt, onUpdateOptField, onAddOpt, onRemoveOpt, onRemoveQ, onDuplicateQ, onToggleCorrect, onReorder, onCopyLink, onShowToast, onImported, onImportedSilent }) {
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  // Baca scoreType dari localStorage supaya badge score realtime ikut berubah
  const [scoreType, setScoreType] = useState(() =>
    localStorage.getItem(`score_type_${form?.slug ?? slug}`) ?? "none"
  );
  // Sync saat form berubah
  useEffect(() => {
    const key = `score_type_${form?.slug ?? slug}`;
    const stored = localStorage.getItem(key) ?? "none";
    setScoreType(stored);
    // Listen storage changes (ketika user ganti di Setelan tab)
    const handler = (e) => { if (e.key === key) setScoreType(e.newValue ?? "none"); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [form?.slug, slug]);
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 md:px-6 xl:px-8 space-y-5" style={{ paddingBottom: 80 }}>
      {/* Form header card */}
      <div className="bg-white rounded-2xl shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-7 border border-[#e5eef7]">
        <h2 className="text-[22px] font-extrabold text-[#102f56] mb-1 tracking-tight leading-snug">
          {form?.title ?? form?.form_title}
        </h2>
        <p className="text-[13px] text-gray-400 mb-4">{form?.category}</p>
        <textarea
          placeholder="Deskripsi form (opsional)..."
          rows={2}
          className="w-full text-[15px] text-gray-500 resize-none outline-none border-b border-dashed border-gray-200 pb-2 bg-transparent focus:border-[#1a4fa0] transition-colors"
        />
        <div className="mt-4 flex items-center gap-3 bg-[#eef5fb] rounded-xl px-4 py-3">
          <span className="text-[13.5px] text-[#1a4fa0] font-medium truncate flex-1">{window.location.origin}/fill/{slug}</span>
          <button onClick={onCopyLink} className="text-[13px] text-white font-semibold px-3.5 py-2 rounded-lg hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5" style={{ backgroundColor: "#1a4fa0" }}>
            <Share2 size={14} /> Salin
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      {questions.length === 0 && (
        <div className="text-center py-14 bg-white/60 rounded-2xl border border-dashed border-[#d6e4ef]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#eef5fb] flex items-center justify-center text-[#1a4fa0]">
            <FileQuestion size={30} />
          </div>
          <p className="text-[#102f56] font-bold text-[16px] mb-1">Belum ada pertanyaan</p>
          <p className="text-gray-400 text-[13.5px]">Tambahkan pertanyaan pertama untuk memulai.</p>
        </div>
      )}

      {questions.map((q, qIdx) => (
        <div
          key={q.id ?? `new-${qIdx}`}
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
            onDragHandleStart={() => setDragFrom(qIdx)}
            onDragHandleEnd={() => { setDragFrom(null); setDragOver(null); }}
            onShowToast={onShowToast}
            scoreType={scoreType}
            totalSoal={questions.length}
          />
        </div>
      ))}

      <button
        onClick={onAddQuestion}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-[#c7d8e8] text-[#1a4fa0] hover:border-[#1a4fa0] hover:bg-white text-[15px] font-semibold transition-all flex items-center justify-center gap-2"
      >
        <ListPlus size={20} /> Tambah Pertanyaan
      </button>

      {/* Import dari Word */}
      <ImportDocxButton slug={slug} onImported={onImported} onImportedSilent={onImportedSilent} />
    </div>
  );
}

/* ── Question Card ──────────────────────────────────────────── */
function QuestionCard({ question, index, onUpdate, onUpdateOpt, onUpdateOptField, onAddOpt, onRemoveOpt, onToggleCorrect, onRemove, onDuplicate, onDragHandleStart, onDragHandleEnd, onShowToast, scoreType, totalSoal }) {
  const hasOptions = ["radio", "checkbox"].includes(question.type);
  // Semua soal bisa diedit (tidak hanya yang baru)
  const editable = true;
  return (
    <div className={`bg-white rounded-2xl border shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6 transition-all hover:shadow-[0_14px_40px_rgba(23,64,120,0.12)] ${
      question._new ? "border-[#1a4fa0]/50 ring-1 ring-[#1a4fa0]/10" : "border-[#e5eef7]"
    }`}>
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
          {/* Badge halaman otomatis = posisi soal */}
          <span className="px-2 py-0.5 rounded-lg bg-[#f0f6fe] border border-[#d4e5fa] text-[11px] font-bold text-[#1a4fa0]" title="Halaman otomatis sesuai urutan soal">
            Hal. {index + 1}
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
        <label className="block text-[12px] font-extrabold text-[#1a4fa0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
         Pertanyaan:
        </label>
        <QuillEditor
          value={question.question}
          onChange={(val) => onUpdate("question", val)}
          placeholder="Ketik pertanyaan di sini"
        />
      </div>

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
                  <input
                    type="text"
                    value={opt.value}
                    onChange={(e) => onUpdateOpt(oIdx, e.target.value)}
                    placeholder={`Opsi ${oIdx + 1}`}
                    className="flex-1 text-[15px] text-gray-700 outline-none border-b border-dashed border-gray-100 focus:border-[#1a4fa0] transition-colors bg-transparent py-1"
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
                  <button onClick={() => onRemoveOpt(oIdx)} className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex items-center justify-center shrink-0">✕</button>
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
            <p className="text-[12px] font-semibold text-[#1a4fa0] uppercase tracking-wide mb-1.5">📎 Lampiran Soal (opsional)</p>
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
            <span className="text-[16px] shrink-0 mt-0.5">💡</span>
            <p className="text-[12px] text-blue-700 leading-relaxed">
              <strong>Jawaban responden</strong> akan dikumpulkan dalam bentuk file upload. Responden akan diminta untuk mengunggah file sebagai jawaban mereka.
            </p>
          </div>
        </div>
      )}

      {/* Warning: audio + gambar di teks tidak bisa bersamaan */}
      {(question.audioFile || question.audio) && /<img/i.test(question.question || "") && (
        <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300">
          <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
          <p className="text-[12.5px] text-amber-700 leading-relaxed">
            <strong>Konflik audio + gambar:</strong> Soal ini memiliki audio dan gambar di teks sekaligus. Saat disimpan akan error. Hapus gambar dari teks dan gunakan fitur <strong>Lampiran Soal</strong> sebagai gantinya.
          </p>
        </div>
      )}

      {/* ── Audio Lampiran (semua tipe soal) ───────────────────── */}
      <div className="mt-4 mb-1">
        <p className="text-[12px] font-extrabold text-[#1a4fa0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          🎵 Audio Soal <span className="normal-case font-normal text-gray-400">(opsional)</span>
        </p>
        {question.audioFile || question.audio ? (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200">
            <span className="text-purple-600 shrink-0">🎵</span>
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
            <span className="text-[20px] shrink-0">🎵</span>
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
        </div>

        <div className="flex items-center gap-3">
          {/* Score badge — tampil sesuai tipe score */}
          {scoreType === "genius" && totalSoal > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
              🎯 {(100 / totalSoal).toFixed(1)} pts
            </span>
          )}
          {scoreType === "manual" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-amber-600">⭐ Score:</span>
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
  );
}

/* ── Responses Tab ──────────────────────────────────────────── */
function ResponsesTab({ formId, form }) {
  const formSlug = form?.slug ?? form?.form_slug;
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("Ringkasan");

  useEffect(() => {
    if (!formSlug) { setLoading(false); return; }
    api.get("/form/submit", { params: { form_slug: formSlug } })
      .then(res => setSummary(res.data?.data ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [formSlug]);

  const total     = summary?.total_submit ?? 0;
  // Backend return questions sebagai array of pages [{page, soal:[]}] — flatten
  const rawQ      = summary?.questions ?? [];
  const questions = rawQ.length > 0 && rawQ[0]?.soal
    ? rawQ.flatMap(pg => pg.soal ?? [])
    : rawQ;
  const isPublic  = form?.status === "public" || form?.form_status === "public";
  const title     = form?.title ?? form?.form_title ?? "Form";

  return (
    <div className="min-h-full px-8 py-6 pb-16" style={{ background: "linear-gradient(135deg,#ffffff 0%,#f5f9ff 55%,#edf5ff 100%)" }}>

      {/* FORM HEADING */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="m-0 text-[17px] font-bold text-[#142d63]">{title}</h2>
          <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${isPublic ? "bg-[#e3f7ef] text-[#16a66b]" : "bg-[#f1f2f5] text-[#7284a3]"}`}>
            {isPublic ? "Aktif" : "Draft"}
          </span>
        </div>
        <div className="flex gap-3">
          <button className="h-[39px] px-5 rounded-lg bg-[#eef5ff] text-[#075ee0] text-[12px] font-semibold border-none cursor-pointer hover:bg-[#daeaff] transition-colors">↓ Ekspor</button>
          <button className="h-[39px] px-5 rounded-lg bg-[#075ee0] text-white text-[12px] font-semibold border-none cursor-pointer hover:bg-[#0550c0] transition-colors">Lihat Form ↗</button>
        </div>
      </div>

      {/* RESPONSE CONTAINER */}
      <div className="bg-white/90 rounded-[13px] border border-[#e5ebf4] shadow-[0_4px_20px_rgba(30,70,120,0.04)] overflow-hidden">

        {/* SUB TABS */}
        <div className="h-[60px] flex items-center px-[22px] gap-9 border-b border-[#edf1f7] overflow-x-auto">
          {["Ringkasan", "Jawaban", "Responden"].map(t => (
            <button key={t} onClick={() => setActiveSubTab(t)}
              className={`relative h-[60px] flex items-center text-[13px] font-semibold border-none bg-transparent cursor-pointer transition-colors whitespace-nowrap ${
                activeSubTab === t ? "text-[#075ee0]" : "text-[#63759b] hover:text-[#075ee0]"
              }`}>
              {t}
              {activeSubTab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#075ee0] rounded-t" />}
            </button>
          ))}
          <button className="ml-auto h-9 px-[14px] border border-[#e0e7f2] rounded-lg bg-white text-[#4c6189] text-[11px] cursor-pointer whitespace-nowrap">
            ▣ Semua waktu ⌄
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-8 h-8 border-[3px] border-[#dce8f7] border-t-[#075ee0] rounded-full animate-spin" />
            <span className="text-[12px] text-[#7384a4]">Memuat respons...</span>
          </div>
        )}

        {/* EMPTY */}
        {!loading && total === 0 && (
          <div className="py-16 text-center text-[#7384a4]">
            <div className="text-[40px] mb-2">📭</div>
            <h4 className="m-0 mb-1 text-[15px] font-bold text-[#142d63]">Belum ada respons</h4>
            <p className="m-0 text-[12px]">Bagikan link form untuk mulai mengumpulkan respons.</p>
          </div>
        )}

        {/* CONTENT */}
        {!loading && total > 0 && (
          <>
            {/* STATISTICS */}
            <div className="grid grid-cols-4 gap-[15px] p-[22px] pb-[10px] max-[900px]:grid-cols-2">
              {[
                { icon: "♙", color: "bg-[#edf4ff] text-[#075ee0]", label: "Total Respon",         value: total,              sub: "responden" },
                { icon: "✓", color: "bg-[#eafaf3] text-[#18ae70]", label: "Tingkat Penyelesaian",  value: "100%",             sub: "selesai" },
                { icon: "◷", color: "bg-[#fff5e8] text-[#ee941c]", label: "Rata-rata Waktu",       value: "—",                sub: "menit" },
                { icon: "◔", color: "bg-[#f5edff] text-[#8e4de7]", label: "Selesai Hari Ini", value: (() => { const today = new Date().toDateString(); return 0; })(), sub: "responden" },
              ].map((s, i) => (
                <div key={i} className="min-h-[110px] border border-[#e7edf6] rounded-xl p-[17px] flex items-center gap-[15px] bg-white">
                  <div className={`w-[43px] h-[43px] shrink-0 flex items-center justify-center rounded-[9px] text-[20px] ${s.color}`}>{s.icon}</div>
                  <div>
                    <p className="m-0 mb-1 text-[10px] text-[#64779d]">{s.label}</p>
                    <h3 className="m-0 text-[23px] font-bold text-[#142d63]">{s.value}</h3>
                    <span className="text-[10px] text-[#8190ad]">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* PER-QUESTION CARDS */}
            {questions.map((q, qi) => {
              const opts = q.options ?? [];
              const answered = opts.reduce((s, o) => s + (o.total_answer ?? 0), 0);
              const maxCount = Math.max(...opts.map(o => o.total_answer ?? 0), 1);

              return (
                <div key={q.id ?? qi} className="mx-[22px] mb-4 border border-[#e7edf6] rounded-xl bg-white overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 px-5 pt-5 pb-3 border-b border-[#f0f4fa]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[13px] font-bold text-[#142d63]">{qi + 1}.</span>
                        <RichTextDisplay content={q.question} />
                        <span className="px-2 py-0.5 rounded-full bg-[#edf4ff] text-[#075ee0] text-[9px] font-bold capitalize">{q.type}</span>
                      </div>
                      <p className="text-[11px] text-[#7384a4] mt-0.5">{answered} respon</p>
                    </div>
                    <ViewAllBtn q={q} total={total} formSlug={formSlug} />
                  </div>

                  {/* BAR CHART — radio/checkbox */}
                  {(q.type === "radio" || q.type === "checkbox") && opts.length > 0 && (
                    <div className="px-5 py-4 space-y-3">
                      {opts.map((opt, oi) => {
                        const count  = opt.total_answer ?? 0;
                        const pctVal = answered > 0 ? ((count / answered) * 100).toFixed(1) : "0.0";
                        const barW   = answered > 0 ? `${(count / maxCount) * 100}%` : "0%";
                        return (
                          <div key={oi}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[13px] text-[#364a6e] font-medium truncate max-w-[60%]">
                                {opt.value ?? opt.option_value ?? `Opsi ${oi+1}`}
                              </span>
                              <span className="text-[12px] font-bold text-[#142d63] shrink-0 ml-2">
                                {count} <span className="text-[#7384a4] font-normal">({pctVal}%)</span>
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-[#edf1f7] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: barW, background: CHART_COLORS[oi % CHART_COLORS.length] }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TEXT answers */}
                  {q.type === "text" && (
                    <div className="px-5 py-4">
                      <p className="text-[12px] text-[#8ca0ba]">
                        {answered > 0 ? `${answered} jawaban teks masuk — klik "View All" untuk lihat.` : "Belum ada jawaban teks."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
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

  // Extract answers for this soal from detail
  const answers = detail
    ? detail
        .filter(d => d.id === q.id)
        .flatMap(d => (d.responses ?? []).map(r => r.answer))
        .filter(Boolean)
    : [];

  return (
    <>
      <button onClick={loadDetail}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#eef5ff] text-[#075ee0] text-[11px] font-semibold border-none cursor-pointer hover:bg-[#daeaff] transition-colors whitespace-nowrap">
        View All →
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-1">Semua Jawaban</p>
                <RichTextDisplay content={q.question} />
              </div>
              <button onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none border-none bg-transparent cursor-pointer shrink-0">×</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-[#075ee0] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && answers.length === 0 && (
                <p className="text-[13px] text-gray-400 text-center py-8">Belum ada jawaban.</p>
              )}

              {!loading && answers.length > 0 && (
                <div className="space-y-2">
                  {answers.map((ans, i) => (
                    <div key={i} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] text-[#364a6e]">
                      {typeof ans === "string" ? ans : JSON.stringify(ans)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 text-[12px] text-gray-400 text-right">
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
function SettingsTab({ form, onUpdateStatus, slug }) {
  const isPublic   = form?.status === "public" || form?.form_status === "public";
  const isQuiz     = form?.category === "ujian";

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
        setTokenMsg("✅ Token berhasil disimpan!");
        setTokenActive(active);
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
    if (!duration && !startAt) { setTimerMsg("Isi durasi atau waktu mulai."); return; }
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
      setTimerMsg(res.ok ? "✅ Berhasil disimpan!" : (data?.message || "Gagal menyimpan."));
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
      setShuffleMsg(res.ok ? `✅ Shuffle ${val ? "diaktifkan" : "dinonaktifkan"}` : (data?.message || "Gagal."));
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
      setScoreMsg(`✅ Genius Score (${perSoal} pts/soal) berhasil disimpan!`);
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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">

      {/* Status Publikasi */}
      <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-gray-700 text-[15px]">Status Publikasi</p>
          <p className="text-[13px] text-gray-400 mt-1">
            {isPublic ? "Form dapat diisi oleh siapa saja dengan link." : "Form bersifat privat."}
          </p>
        </div>
        <Toggle value={isPublic} onChange={() => onUpdateStatus(isPublic ? "private" : "public")} />
      </div>

      {/* Token Responden */}
      <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg shrink-0">🔐</span>
          <div className="flex-1">
            <p className="font-bold text-gray-700 text-[15px]">Token Responden</p>
            <p className="text-[13px] text-gray-400 mt-0.5">
              {form?.token_respon
                ? <span>Token aktif: <strong className="font-mono text-[#1a4fa0]">{form.token_respon}</strong></span>
                : "Tidak ada token — form dapat diisi siapa saja."
              }
            </p>
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-2 inline-block">
              ⚠️ Token hanya bisa diatur saat membuat form baru
            </p>
          </div>
        </div>
      </div>

      {/* Score / Penilaian — hanya untuk kuis */}
      {isQuiz && (
        <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg shrink-0">🏆</span>
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
              <p className="text-[13px] text-indigo-700 font-medium mb-1">
                🎯 Setiap soal mendapat <strong>{questions.length > 0 ? (100 / questions.length).toFixed(1) : "—"} pts</strong> (total 100 pts)
              </p>
              <p className="text-[12px] text-indigo-500 mb-3">Skor dibagi rata ke {questions.length} soal secara otomatis.</p>
              <button onClick={saveGeniusScore} disabled={scoreSaving || !questions.length}
                className="px-4 py-2 rounded-xl text-white text-[13px] font-semibold disabled:opacity-50 transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                {scoreSaving ? "Menyimpan..." : "💾 Simpan Genius Score"}
              </button>
              {scoreMsg && <p className="text-[12px] mt-2 text-indigo-700 font-medium">{scoreMsg}</p>}
            </div>
          )}

          {scoreType === "manual" && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-[13px] text-amber-700 font-medium mb-2">
                ⭐ Atur skor manual langsung di setiap soal di tab <strong>Pertanyaan</strong>.
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
              <span className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0">🔀</span>
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
          <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg shrink-0">⏱️</span>
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
          <span className="w-10 h-10 rounded-xl bg-[#eef5fb] flex items-center justify-center text-lg shrink-0">🎨</span>
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
function ImportDocxButton({ slug, onImported, onImportedSilent }) {
  const [importing, setImporting] = useState(false);
  const [toast, setToast]         = useState("");
  const [error, setError]         = useState("");

  function showMsg(msg, isErr = false) {
    if (isErr) setError(msg);
    else setToast(msg);
    setTimeout(() => { setToast(""); setError(""); }, 4000);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.name.endsWith(".docx")) {
      showMsg("File harus berformat .docx", true); return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${FORM_API_URL}/form/soal/import?form_slug=${slug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Gagal import.");
      const count = data?.data?.list_soal?.length ?? 0;
      showMsg(`✅ ${count} soal berhasil diimport dari Word!`);
      setTimeout(() => { onImportedSilent?.(); }, 500);
    } catch (e) {
      showMsg(e.message || "Gagal import.", true);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className={`w-full py-3.5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-[14px] font-semibold transition-all cursor-pointer ${
        importing
          ? "border-gray-200 text-gray-400 cursor-not-allowed"
          : "border-[#c7d8e8] text-gray-500 hover:border-[#1a4fa0] hover:text-[#1a4fa0] hover:bg-white"
      }`}>
        {importing ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Mengimport soal...
          </>
        ) : (
          <>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
            </svg>
            Import Soal dari Word (.docx)
          </>
        )}
        <input type="file" accept=".docx" onChange={handleFile} disabled={importing} className="hidden" />
      </label>

      {toast && (
        <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[13px] text-center">
          {toast}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] text-center">
          {error}
        </div>
      )}
    </div>
  );
}

/* ── QR Code Modal ──────────────────────────────────────────── */
function QrModal({ slug, formTitle, onClose }) {
  const [qrSrc, setQrSrc]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true);
    const fillUrl = `${window.location.origin}/fill/${slug}`;
    fetch(`${FORM_API_URL}/qrcode/image?slug=${encodeURIComponent(fillUrl)}`)
      .then(res => {
        if (!res.ok) throw new Error("Gagal generate QR Code");
        return res.blob();
      })
      .then(blob => setQrSrc(URL.createObjectURL(blob)))
      .catch(() => setError("Gagal memuat QR Code."))
      .finally(() => setLoading(false));
  }, [slug]);

  function downloadQr() {
    if (!qrSrc) return;
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `qrcode-${slug}.png`;
    a.click();
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
