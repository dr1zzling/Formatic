import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { FORM_API_URL } from "../../utils/api";
import { socket } from "../../utils/socket";
import { ArrowLeft, Link2, Trash2, Plus, Copy, Share2, Check, ListPlus, FileQuestion, FileText, UploadCloud, GripVertical } from "lucide-react";
import QuillEditor from "../../components/QuillEditor";
import RichTextDisplay from "../../components/RichTextDisplay";

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
  const [toast, setToast]                   = useState("");
  const [showDelete, setShowDelete]         = useState(false);
  const [collabNotice, setCollabNotice]     = useState("");
  const [userRole, setUserRole]             = useState(null); // "Creator" | "Collaborator"
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
          options: (s.options ?? []).map((o) => ({
            id: o.id, value: o.value ?? o.option_value, is_correct: o.is_correct,
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
            options: (s.options ?? []).map((o) => ({
              id: o.id, value: o.value ?? o.option_value, is_correct: o.is_correct,
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
    setSaving(true); setError("");
    isSavingRef.current = true;
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
            const hasOpts = ["radio", "checkbox", "rating"].includes(q.type);
            const payload = {
              soal: { question: q.question, type: q.type },
              options: hasOpts
                ? (q.options || []).map((o, idx) => ({ id: o.id, value: o.value?.trim() || `Opsi ${idx + 1}`, is_correct: o.is_correct ?? false }))
                : [],
            };
            return fetch(`${FORM_API_URL}/form/soal/${q.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ data: JSON.stringify(payload) }),
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
          if (q.attachment instanceof File) {
            fd.append("soal_images", q.attachment, `soal_${i}_${q.attachment.name}`);
          }
          return {
            soal: { question: q.question, type: q.type, image: q.attachment instanceof File ? q.attachment.name : null, page: q.page ?? 1 },
            options: hasOpts
              ? q.options.map((o, idx) => ({ value: o.value?.trim() || `Opsi ${idx + 1}`, image: null, is_correct: o.is_correct ?? false }))
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

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

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
              onUpdateQ={updateQ} onUpdateOpt={updateOpt}
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
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">
          ✅ {toast}
        </div>
      )}

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
    </div>
  );
}

/* ── Pertanyaan Tab ─────────────────────────────────────────── */
function PertanyaanTab({ form, slug, questions, error, onAddQuestion, onUpdateQ, onUpdateOpt, onAddOpt, onRemoveOpt, onRemoveQ, onDuplicateQ, onToggleCorrect, onReorder, onCopyLink, onShowToast, onImported, onImportedSilent }) {
  const [dragFrom, setDragFrom]   = useState(null);
  const [dragOver, setDragOver]   = useState(null);
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
            onAddOpt={() => onAddOpt(qIdx)}
            onRemoveOpt={(oIdx) => onRemoveOpt(qIdx, oIdx)}
            onToggleCorrect={(oIdx) => onToggleCorrect(qIdx, oIdx)}
            onRemove={() => onRemoveQ(qIdx)}
            onDuplicate={() => onDuplicateQ(qIdx)}
            onDragHandleStart={() => setDragFrom(qIdx)}
            onDragHandleEnd={() => { setDragFrom(null); setDragOver(null); }}
            onShowToast={onShowToast}
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
function QuestionCard({ question, index, onUpdate, onUpdateOpt, onAddOpt, onRemoveOpt, onToggleCorrect, onRemove, onDuplicate, onDragHandleStart, onDragHandleEnd, onShowToast }) {
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
        </div>
        <div className="flex items-center gap-2">
          {/* Page selector */}
          <div className="flex items-center gap-1.5 bg-[#f0f6fe] border border-[#d4e5fa] rounded-lg px-2 py-1">
            <span className="text-[11px] font-semibold text-[#1a4fa0]">Hal.</span>
            <input
              type="number" min="1" max="99"
              value={question.page ?? 1}
              onChange={(e) => onUpdate("page", Math.max(1, parseInt(e.target.value) || 1))}
              className="w-10 text-[13px] font-bold text-[#1a4fa0] bg-transparent border-none outline-none text-center"
            />
          </div>
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
          {question.options.map((opt, oIdx) => (
            <div key={oIdx} className="group flex items-center gap-3">
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
              <button onClick={() => onRemoveOpt(oIdx)} className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex items-center justify-center shrink-0">✕</button>
            </div>
          ))}
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

      <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-[#eef3f8]">
        <div className="flex items-center gap-1">
          <button title="Duplikat" onClick={onDuplicate} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#eef5fb] hover:text-[#1a4fa0] transition-all"><Copy size={16} /></button>
          <button title="Hapus" onClick={onRemove} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={16} /></button>

        </div>
        <label className="flex items-center gap-2 text-[13.5px] font-medium text-gray-500 cursor-pointer select-none">
          Wajib diisi
          <input type="checkbox" checked={question.required} onChange={(e) => onUpdate("required", e.target.checked)} className="accent-[#1a4fa0]" style={{ width: 18, height: 18 }} />
        </label>
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
  const questions = summary?.questions    ?? [];
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
            {questions.map((q, qi) => (
              <div key={q.id ?? qi} className="mx-[22px] mb-4 p-[22px] border border-[#e7edf6] rounded-xl bg-white">
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div>
                    <h3 className="m-0 text-[14px] font-semibold text-[#142d63] flex items-center gap-2 flex-wrap">
                      <span>{qi + 1}.</span>
                      <RichTextDisplay content={q.question} />
                      <span className="px-2 py-1 rounded-full bg-[#edf4ff] text-[#075ee0] text-[9px] font-bold">Wajib</span>
                    </h3>
                    <p className="mt-1 mb-0 text-[10px] text-[#7384a4]">{total} respon</p>
                  </div>
                  <button className="shrink-0 px-3.5 py-2.5 rounded-lg bg-[#eef5ff] text-[#075ee0] text-[11px] font-semibold border-none cursor-pointer hover:bg-[#daeaff] transition-colors">
                    Lihat detail →
                  </button>
                </div>

                {/* RADIO/CHECKBOX → donut */}
                {(q.type === "radio" || q.type === "checkbox") && (q.options ?? []).length > 0 && (
                  <div className="flex items-center gap-[50px] pl-2 flex-wrap">
                    <div className="shrink-0 flex justify-center">
                      <div className="relative w-[138px] h-[138px] rounded-full flex items-center justify-center"
                        style={{ background: buildConicGradient(q.options, total) }}>
                        <div className="absolute w-[82px] h-[82px] rounded-full bg-white" />
                        <div className="relative z-10 flex flex-col items-center">
                          <strong className="text-[21px] font-bold text-[#142d63]">{total}</strong>
                          <span className="text-[9px] text-[#7183a3]">respon</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-[200px] flex flex-col gap-3">
                      {(q.options ?? []).map((opt, oi) => (
                        <div key={oi} className="grid gap-2 text-[11px] text-[#50658d]" style={{ gridTemplateColumns: "12px 1fr auto" }}>
                          <span className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ background: CHART_COLORS[oi % CHART_COLORS.length] }} />
                          <span>{opt.value ?? opt.option_value}</span>
                          <strong className="text-[#142d63] text-[11px]">{opt.total_answer ?? 0} ({pct(opt.total_answer ?? 0, total)}%)</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TEXT answers */}
                {q.type === "text" && (
                  <div className="flex flex-col gap-2.5 px-2">
                    <p className="text-[12px] text-[#8ca0ba]">
                      {total > 0 ? `${total} jawaban teks masuk.` : "Belum ada jawaban teks."}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
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

  // Timer state
  const [duration, setDuration]   = useState(form?.duration ?? "");
  const [startAt, setStartAt]     = useState(
    form?.start_at ? new Date(form.start_at).toISOString().slice(0,16) : ""
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

  async function saveTimer() {
    if (!duration && !startAt) { setTimerMsg("Isi durasi atau waktu mulai."); return; }
    setTimerSaving(true); setTimerMsg("");
    try {
      const res = await fetch(`http://localhost:3000/form/setting?form_slug=${form?.slug ?? slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          duration: duration ? Number(duration) : null,
          start_at: startAt ? new Date(startAt).getTime() : null,
          is_random: isRandom,
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
      const res = await fetch(`http://localhost:3000/form/setting?form_slug=${form?.slug ?? slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          duration: duration ? Number(duration) : null,
          start_at: startAt ? new Date(startAt).getTime() : null,
          is_random: val,
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
        await fetch(`http://localhost:3000/form/soal/${q.id}`, {
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
    localStorage.setItem(`score_type_${form?.slug ?? slug}`, val);
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
      const count = data?.data?.length ?? 0;
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
