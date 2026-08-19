import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { ArrowLeft, Link2, Trash2, Plus, Copy, Share2, Check, ListPlus, FileQuestion, FileText, UploadCloud, GripVertical } from "lucide-react";

const QUESTION_TYPES = [
  { value: "radio",    label: "Pilihan Ganda" },
  { value: "checkbox", label: "Kotak Centang" },
  { value: "text",     label: "Jawaban Singkat" },
  { value: "file",     label: "Unggah File" },
];
const TABS = ["Pertanyaan", "Jawaban", "Setelan"];

/* ── DUMMY DATA ───────────────────────────────────────────────── */
const DUMMY_FORM = {
  title: "Kuesioner Pelaksanaan Program Makan Bergizi Gratis (MBG)",
  category: "survey", status: "public",
};
const DUMMY_QUESTIONS = [
  { id: 1, question: "Kelas", type: "radio", required: true, options: [
    { id: 1, value: "X",   is_correct: false }, { id: 2, value: "XI",  is_correct: false }, { id: 3, value: "XII", is_correct: false },
  ]},
  { id: 2, question: "Apakah sekolah Anda mendapatkan program MBG?", type: "radio", required: true, options: [
    { id: 4, value: "Ya", is_correct: false }, { id: 5, value: "Tidak", is_correct: false },
  ]},
  { id: 3, question: "Apakah pembagian MBG sudah merata ke semua siswa?", type: "radio", required: true, options: [
    { id: 6, value: "Ya", is_correct: false }, { id: 7, value: "Tidak", is_correct: false },
  ]},
  { id: 4, question: "Bagaimana pendapat Anda tentang kualitas makanan MBG?", type: "text", required: true, options: [] },
];
const DUMMY_RESPONSES = {
  total: 10,
  submittedAt: new Date().toISOString(),
  questions: [
    { soal_id: 1, question: "Kelas", type: "radio", options: [
      { value: "X",   count: 4 }, { value: "XI", count: 5 }, { value: "XII", count: 1 },
    ], textAnswers: [] },
    { soal_id: 2, question: "Apakah sekolah Anda mendapatkan program MBG?", type: "radio", options: [
      { value: "Ya", count: 9 }, { value: "Tidak", count: 1 },
    ], textAnswers: [] },
    { soal_id: 3, question: "Apakah pembagian MBG sudah merata ke semua siswa?", type: "radio", options: [
      { value: "Ya", count: 7 }, { value: "Tidak", count: 3 },
    ], textAnswers: [] },
    { soal_id: 4, question: "Bagaimana pendapat Anda tentang kualitas makanan MBG?", type: "text", options: [], textAnswers: [
      "Makanan enak dan bergizi", "Cukup baik tapi porsinya kurang", "Sangat membantu siswa kurang mampu",
      "Perlu ditingkatkan variasi menunya", "Bagus, semoga terus berlanjut",
    ]},
  ],
};

export default function FormEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [form, setForm]             = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [activeTab, setActiveTab]   = useState("Pertanyaan");
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [toast, setToast]           = useState("");
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => { loadForm(); }, [slug]);

  async function loadForm() {
    setLoading(true); setError("");
    try {
      const res = await api.get("/form/slug", { params: { slug } });
      const f   = res.data?.data;
      if (f) {
        setForm(f);
        setQuestions(
          (f?.soal ?? []).map((s) => ({
            id: s.id, question: s.question, type: s.type, required: true,
            options: (s.options ?? []).map((o) => ({
              id: o.id, value: o.option_value, is_correct: o.is_correct,
            })),
          }))
        );
      } else {
        setForm(DUMMY_FORM);
        setQuestions(DUMMY_QUESTIONS);
      }
    } catch {
      // Fallback ke dummy supaya tampilan tetap bisa dilihat
      setForm(DUMMY_FORM);
      setQuestions(DUMMY_QUESTIONS);
    }
    finally { setLoading(false); }
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, {
      _new: true, question: "", type: "radio", required: true,
      options: [{ value: "Opsi 1" }, { value: "Opsi 2" }],
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
      i !== qIdx ? q : { ...q, options: [...q.options, { value: `Opsi ${q.options.length + 1}`, is_correct: false }] }
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
  function removeQ(idx) { setQuestions((prev) => prev.filter((_, i) => i !== idx)); }
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
    const newOnes = questions.filter((q) => q._new);
    if (!newOnes.length) { showToast("Tidak ada soal baru untuk disimpan."); return; }
    if (newOnes.find((q) => !q.question.trim())) { setError("Semua pertanyaan wajib diisi."); return; }
    setSaving(true); setError("");
    try {
      const payload = newOnes.map((q) => {
        const hasOpts = ["radio", "checkbox"].includes(q.type);
        return {
          soal: { question: q.question, type: q.type },
          options: hasOpts
            ? q.options.filter((o) => o.value.trim()).map((o) => ({
                value: o.value,
                is_correct: Boolean(o.is_correct),
              }))
            : [],
        };
      });
      await api.post("/form/soal", payload, { params: { form_slug: slug } });
      showToast(`${newOnes.length} soal berhasil disimpan!`);
      loadForm();
    } catch (e) { setError(e.response?.data?.message || "Gagal menyimpan soal."); }
    finally { setSaving(false); }
  }

  async function updateStatus(status) {
    try {
      await api.patch("/form", { status }, { params: { form_slug: slug } });
      showToast(`Status diubah ke "${status}"`);
      loadForm();
    } catch { showToast("Gagal mengubah status."); }
  }

  async function deleteForm() {
    try {
      await api.delete("/form", { params: { form_slug: slug } });
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
      <Sidebar />
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
      <Sidebar />
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
      <Sidebar />

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
            />
          )}
          {activeTab === "Jawaban" && (
            <ResponsesTab formId={form?.id ?? form?.form_id} form={form} />
          )}
          {activeTab === "Setelan" && (
            <SettingsTab form={form} onUpdateStatus={updateStatus} />
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">
          ✅ {toast}
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
function PertanyaanTab({ form, slug, questions, error, onAddQuestion, onUpdateQ, onUpdateOpt, onAddOpt, onRemoveOpt, onRemoveQ, onDuplicateQ, onToggleCorrect, onReorder, onCopyLink }) {
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
          />
        </div>
      ))}

      <button
        onClick={onAddQuestion}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-[#c7d8e8] text-[#1a4fa0] hover:border-[#1a4fa0] hover:bg-white text-[15px] font-semibold transition-all flex items-center justify-center gap-2"
      >
        <ListPlus size={20} /> Tambah Pertanyaan
      </button>
    </div>
  );
}

/* ── Question Card ──────────────────────────────────────────── */
function QuestionCard({ question, index, onUpdate, onUpdateOpt, onAddOpt, onRemoveOpt, onToggleCorrect, onRemove, onDuplicate, onDragHandleStart, onDragHandleEnd }) {
  const hasOptions = ["radio", "checkbox"].includes(question.type);
  const isNew = question._new;
  return (
    <div className={`bg-white rounded-2xl border shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6 transition-all hover:shadow-[0_14px_40px_rgba(23,64,120,0.12)] ${
      isNew ? "border-[#1a4fa0]/50 ring-1 ring-[#1a4fa0]/10" : "border-[#e5eef7]"
    }`}>
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(index));
            onDragHandleStart?.();
          }}
          onDragEnd={() => onDragHandleEnd?.()}
          title="Tarik untuk urutkan soal"
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-[#1a4fa0] transition-colors"
        >
          <GripVertical size={18} />
        </button>
        <span className="w-9 h-9 rounded-xl bg-[#eef5fb] text-[#1a4fa0] text-[14px] font-extrabold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <input
          type="text"
          value={question.question}
          onChange={(e) => onUpdate("question", e.target.value)}
          placeholder="Masukkan pertanyaan..."
          readOnly={!isNew}
          className="flex-1 text-[16px] font-semibold text-[#102f56] outline-none border-b border-dashed border-gray-200 pb-1.5 focus:border-[#1a4fa0] transition-colors bg-transparent"
        />
        <select
          value={question.type}
          onChange={(e) => onUpdate("type", e.target.value)}
          disabled={!isNew}
          className="text-[13.5px] border border-[#d9e5f0] rounded-xl px-3.5 py-2.5 bg-white outline-none disabled:opacity-60 shrink-0 font-medium text-gray-700 shadow-sm focus:border-[#1a4fa0]"
        >
          {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
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
                readOnly={!isNew}
                className="flex-1 text-[15px] text-gray-700 outline-none border-b border-dashed border-gray-100 focus:border-[#1a4fa0] transition-colors bg-transparent py-1"
              />
              {isNew && (
                <button onClick={() => onRemoveOpt(oIdx)} className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex items-center justify-center shrink-0">
                  ✕
                </button>
              )}
            </div>
          ))}
          {isNew && (
            <button onClick={onAddOpt} className="text-[14px] font-medium text-gray-400 hover:text-[#1a4fa0] flex items-center gap-2 ml-1 mt-2 transition-colors">
              <Plus size={16} /> Tambah opsi
            </button>
          )}
        </div>
      )}

      {question.type === "text" && (
        <div className="ml-2 mb-4">
          <input
            type="text"
            value={question.placeholder ?? ""}
            onChange={(e) => onUpdate("placeholder", e.target.value)}
            placeholder="Tulis jawabanmu"
            readOnly={!isNew}
            className="w-full text-[15px] text-gray-500 outline-none border-b border-dashed border-gray-100 focus:border-[#1a4fa0] transition-colors bg-transparent py-1"
          />
        </div>
      )}
      {question.type === "file" && (
        <div className="ml-2 mb-4">
          {isNew ? (
            <label className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-[#c3d4e4] bg-[#f7fafd] py-4 px-4 cursor-pointer hover:border-[#1a4fa0] hover:bg-[#f0f6fe] transition-all">
              {question.file
                ? <>
                    <FileText size={18} className="text-[#1a4fa0] shrink-0" />
                    <span className="text-[13.5px] font-semibold text-[#102f56] truncate">{question.file.name}</span>
                    <span className="text-[12px] text-gray-400 shrink-0">Klik untuk ganti file</span>
                  </>
                : <>
                    <UploadCloud size={18} className="text-[#1a4fa0] shrink-0" />
                    <span className="text-[13.5px] font-semibold text-gray-500">Unggah file contoh (pratinjau)</span>
                  </>
              }
              <input type="file" className="hidden" onChange={(e) => onUpdate("file", e.target.files?.[0])} />
            </label>
          ) : (
            <div className="flex items-center gap-2.5 text-[14px] text-gray-400">
              <span className="w-9 h-9 rounded-xl bg-[#eef5fb] grid place-items-center">📎</span>
              Pengguna dapat mengunggah file
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-[#eef3f8]">
        <div className="flex items-center gap-1">
          <button title="Duplikat" onClick={onDuplicate} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-[#eef5fb] hover:text-[#1a4fa0] transition-all"><Copy size={16} /></button>
          <button title="Hapus" onClick={onRemove} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
        </div>
        <label className="flex items-center gap-2 text-[13.5px] font-medium text-gray-500 cursor-pointer select-none">
          Wajib diisi
          <input type="checkbox" checked={question.required} onChange={(e) => onUpdate("required", e.target.checked)} className="w-4.5 h-4.5 accent-[#1a4fa0]" style={{ width: 18, height: 18 }} />
        </label>
      </div>
    </div>
  );
}

/* ── Responses Tab ──────────────────────────────────────────── */
function ResponsesTab({ formId, form }) {
  const [responses, setResponses]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("Ringkasan");

  useEffect(() => {
    (async () => {
      try {
        if (!formId) return;
        const [respRes] = await Promise.all([
          api.get(`/form/${formId}/submit`).catch(() => ({ data: { data: [] } })),
        ]);
        const data = respRes.data?.data ?? [];
        setResponses(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [formId]);

  // Build per-question stats from responses
  const questionStats = buildQuestionStats(responses);
  const total = responses.length;
  const isPublic = form?.status === "public" || form?.form_status === "public";
  const title = form?.title ?? form?.form_title ?? "Form";

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
                { icon: "◔", color: "bg-[#f5edff] text-[#8e4de7]", label: "Selesai Hari Ini",      value: countToday(responses), sub: "responden" },
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
            {questionStats.map((q, qi) => (
              <div key={q.soal_id ?? qi} className="mx-[22px] mb-4 p-[22px] border border-[#e7edf6] rounded-xl bg-white">
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div>
                    <h3 className="m-0 text-[14px] font-semibold text-[#142d63] flex items-center gap-2 flex-wrap">
                      {qi + 1}. {q.question}
                      <span className="px-2 py-1 rounded-full bg-[#edf4ff] text-[#075ee0] text-[9px] font-bold">Wajib</span>
                    </h3>
                    <p className="mt-1 mb-0 text-[10px] text-[#7384a4]">{total} respon</p>
                  </div>
                  <button className="shrink-0 px-3.5 py-2.5 rounded-lg bg-[#eef5ff] text-[#075ee0] text-[11px] font-semibold border-none cursor-pointer hover:bg-[#daeaff] transition-colors">
                    Lihat detail →
                  </button>
                </div>

                {/* RADIO/CHECKBOX → donut */}
                {(q.type === "radio" || q.type === "checkbox") && q.options.length > 0 && (
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
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="grid gap-2 text-[11px] text-[#50658d]" style={{ gridTemplateColumns: "12px 1fr auto" }}>
                          <span className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ background: CHART_COLORS[oi % CHART_COLORS.length] }} />
                          <span>{opt.value}</span>
                          <strong className="text-[#142d63] text-[11px]">{opt.count} ({pct(opt.count, total)}%)</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TEXT answers */}
                {q.type === "text" && (
                  <div className="flex flex-col gap-2.5 px-2">
                    {q.textAnswers.length === 0
                      ? <p className="text-[12px] text-[#8ca0ba]">Belum ada jawaban teks.</p>
                      : q.textAnswers.map((t, ti) => (
                          <div key={ti} className="px-4 py-3 bg-[#f7faff] border border-[#e8eef7] rounded-lg text-[12px] text-[#3a5280] leading-relaxed">{t}</div>
                        ))
                    }
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
    const share = total > 0 ? (opt.count / total) * 360 : 0;
    const start = deg;
    deg += share;
    return `${COLORS[i % COLORS.length]} ${start}deg ${deg}deg`;
  });
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
function SettingsTab({ form, onUpdateStatus }) {
  const isPublic = form?.status === "public" || form?.form_status === "public";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      {/* Jadikan semua kuis */}
      <SettingRow
        icon="🏆"
        title="Jadikan semua kuis"
        desc="Penetapan poin yang tepat dan nilai pertanyaan"
      />
      {/* Jawaban */}
      <SettingRow
        icon="📋"
        title="Jawaban"
        desc="Mengoleksi data respon, nilai dan lainnya"
      />
      {/* Presentasi */}
      <SettingRow
        icon="🎨"
        title="Presentasi"
        desc="Pengaturan cara formulir dan respons ditampilkan"
      />

      {/* Status */}
      <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-gray-700 text-[15px]">Status Publikasi</p>
          <p className="text-[13px] text-gray-400 mt-1">
            {isPublic ? "Form dapat diisi oleh siapa saja dengan link." : "Form bersifat privat."}
          </p>
        </div>
        <Toggle value={isPublic} onChange={() => onUpdateStatus(isPublic ? "private" : "public")} />
      </div>

      {/* Default section */}
      <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6">
        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wide mb-3">Default</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-[14.5px] text-gray-700 font-semibold">Formulir default</p>
              <p className="text-[13px] text-gray-400">Gunakan pengaturan untuk formulir ini dan formulir baru</p>
            </div>
            <Toggle />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-[14.5px] text-gray-700 font-semibold">Pertanyaan default</p>
              <p className="text-[13px] text-gray-400">Gunakan pengaturan sebagai pertanyaan baru</p>
            </div>
            <Toggle />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-[#eef5fb] flex items-center justify-center text-xl">{icon}</span>
        <div>
          <p className="font-bold text-gray-700 text-[15px]">{title}</p>
          <p className="text-[13px] text-gray-400 mt-0.5">{desc}</p>
        </div>
      </div>
      <Toggle />
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