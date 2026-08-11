import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { ArrowLeft, Link2, Trash2, Plus, Copy, Share2 } from "lucide-react";

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
      setForm(f);
      setQuestions(
        (f?.soal ?? []).map((s) => ({
          id: s.id, question: s.question, type: s.type, required: true,
          options: (s.options ?? []).map((o) => ({
            id: o.id, value: o.option_value, is_correct: o.is_correct,
          })),
        }))
      );
    } catch { setError("Form tidak ditemukan."); }
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
      i !== qIdx ? q : { ...q, options: [...q.options, { value: `Opsi ${q.options.length + 1}` }] }
    ));
  }
  function removeOpt(qIdx, oIdx) {
    setQuestions((prev) => prev.map((q, i) =>
      i !== qIdx ? q : { ...q, options: q.options.filter((_, j) => j !== oIdx) }
    ));
  }
  function removeQ(idx) { setQuestions((prev) => prev.filter((_, i) => i !== idx)); }
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
          option_value: hasOpts
            ? q.options.filter((o) => o.value.trim()).map((o) => ({ value: o.value }))
            : [{ value: "" }],
          soal_option: { is_correct: false },
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
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8f9fc" }}>
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-[13px]">Memuat form...</p>
        </div>
      </div>
    </div>
  );

  if (error && !form) return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8f9fc" }}>
      <Sidebar />
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mx-auto mb-4">😕</div>
          <p className="font-semibold text-gray-700">{error}</p>
          <button onClick={() => navigate("/my-forms")} className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>Kembali</button>
        </div>
      </div>
    </div>
  );

  const isPublished = form?.status === "public" || form?.form_status === "public";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8f9fc" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-[52px] md:pt-0">
        {/* ── Top Bar ───────────────────────────────────── */}
        <header className="flex items-center gap-3 px-4 md:px-6 xl:px-8 py-3 border-b border-gray-100 bg-white shrink-0" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <button onClick={() => navigate("/my-forms")} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate text-[14px]">
              {form?.title ?? form?.form_title ?? "Form"}
            </h1>
            <p className="text-[11px] text-gray-400 hidden sm:block">{form?.category}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={copyLink} title="Salin link" className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-gray-400 hover:bg-gray-100 transition">
              <Link2 size={15} />
            </button>
            <button onClick={() => setShowDelete(true)} className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition">
              <Trash2 size={15} />
            </button>
            <button
              onClick={() => updateStatus(isPublished ? "private" : "public")}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition ${
                isPublished
                  ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                  : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-green-500" : "bg-gray-400"}`} />
              {isPublished ? "Published" : "Draft"}
            </button>
            <button
              onClick={saveQuestions}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-60 transition"
              style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </header>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="flex px-4 md:px-6 xl:px-8 border-b border-gray-100 bg-white shrink-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[13.5px] font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? "border-[#1a4fa0] text-[#1a4fa0]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {tab === "Pertanyaan" && questions.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-600 text-[11px] px-1.5 py-0.5 rounded-full font-semibold">
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
              onCopyLink={copyLink}
            />
          )}
          {activeTab === "Jawaban" && (
            <ResponsesTab formId={form?.id ?? form?.form_id} />
          )}
          {activeTab === "Setelan" && (
            <SettingsTab form={form} onUpdateStatus={updateStatus} />
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg z-50">
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
function PertanyaanTab({ form, slug, questions, error, onAddQuestion, onUpdateQ, onUpdateOpt, onAddOpt, onRemoveOpt, onRemoveQ, onDuplicateQ, onCopyLink }) {
  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
      {/* Form header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 border-l-4 border-l-blue-500">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          {form?.title ?? form?.form_title}
        </h2>
        <p className="text-xs text-gray-400 mb-3">{form?.category}</p>
        <textarea
          placeholder="Deskripsi form (opsional)..."
          rows={2}
          className="w-full text-sm text-gray-500 resize-none outline-none border-b border-dashed border-gray-200 pb-2 bg-transparent"
        />
        <div className="mt-3 flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
          <span className="text-xs text-blue-500 truncate flex-1">{window.location.origin}/fill/{slug}</span>
          <button onClick={onCopyLink} className="text-xs text-blue-600 font-semibold hover:underline shrink-0 flex items-center gap-1">
            <Share2 size={12} /> Salin
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      {questions.length === 0 && (
        <div className="text-center py-10">
          <p className="text-4xl mb-2">📝</p>
          <p className="text-gray-500 text-sm">Belum ada pertanyaan. Tambahkan pertanyaan pertama!</p>
        </div>
      )}

      {questions.map((q, qIdx) => (
        <QuestionCard
          key={q.id ?? `new-${qIdx}`}
          question={q}
          index={qIdx}
          onUpdate={(f, v) => onUpdateQ(qIdx, f, v)}
          onUpdateOpt={(oIdx, v) => onUpdateOpt(qIdx, oIdx, v)}
          onAddOpt={() => onAddOpt(qIdx)}
          onRemoveOpt={(oIdx) => onRemoveOpt(qIdx, oIdx)}
          onRemove={() => onRemoveQ(qIdx)}
          onDuplicate={() => onDuplicateQ(qIdx)}
        />
      ))}

      <button
        onClick={onAddQuestion}
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm font-medium transition flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Tambah Pertanyaan
      </button>
    </div>
  );
}

/* ── Question Card ──────────────────────────────────────────── */
function QuestionCard({ question, index, onUpdate, onUpdateOpt, onAddOpt, onRemoveOpt, onRemove, onDuplicate }) {
  const hasOptions = ["radio", "checkbox"].includes(question.type);
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition ${question._new ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-100"}`}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xs font-bold text-gray-400 mt-3 shrink-0 w-5 text-right">{index + 1}.</span>
        <input
          type="text"
          value={question.question}
          onChange={(e) => onUpdate("question", e.target.value)}
          placeholder="Masukkan pertanyaan..."
          readOnly={!question._new}
          className="flex-1 text-sm font-medium text-gray-700 outline-none border-b border-dashed border-gray-200 pb-1.5 focus:border-blue-400 transition bg-transparent"
        />
        <select
          value={question.type}
          onChange={(e) => onUpdate("type", e.target.value)}
          disabled={!question._new}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none disabled:opacity-60 shrink-0"
        >
          {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {hasOptions && (
        <div className="space-y-2 mb-3 ml-8">
          {question.options.map((opt, oIdx) => (
            <div key={oIdx} className="flex items-center gap-2">
              <span className="text-gray-300 text-sm">{question.type === "checkbox" ? "□" : "○"}</span>
              <input
                type="text"
                value={opt.value}
                onChange={(e) => onUpdateOpt(oIdx, e.target.value)}
                readOnly={!question._new}
                className="flex-1 text-sm text-gray-600 outline-none border-b border-dashed border-gray-100 focus:border-blue-300 transition bg-transparent"
              />
              {question._new && (
                <button onClick={() => onRemoveOpt(oIdx)} className="text-gray-300 hover:text-red-400 text-xs transition">✕</button>
              )}
            </div>
          ))}
          {question._new && (
            <button onClick={onAddOpt} className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 ml-5 mt-1 transition">
              <Plus size={12} /> Tambah opsi
            </button>
          )}
        </div>
      )}

      {question.type === "text" && (
        <div className="ml-8 mb-3">
          <input disabled placeholder="Jawaban teks pendek..." className="w-full text-sm text-gray-300 border-b border-dashed border-gray-100 outline-none bg-transparent" />
        </div>
      )}
      {question.type === "file" && (
        <div className="ml-8 mb-3 text-sm text-gray-400 flex items-center gap-2">📎 Pengguna dapat mengunggah file</div>
      )}

      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
        <button title="Duplikat" onClick={onDuplicate} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"><Copy size={14} /></button>
        <button title="Hapus" onClick={onRemove} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition"><Trash2 size={14} /></button>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 ml-2 cursor-pointer select-none">
          <input type="checkbox" checked={question.required} onChange={(e) => onUpdate("required", e.target.checked)} className="accent-blue-500" />
          Wajib
        </label>
      </div>
    </div>
  );
}

/* ── Responses Tab ──────────────────────────────────────────── */
function ResponsesTab({ formId }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("Ringkasan");

  useEffect(() => {
    if (!formId) { setLoading(false); return; }
    api.get(`/form/${formId}/submit`)
      .then((res) => setResponses(res.data?.data ?? []))
      .catch(() => setResponses([]))
      .finally(() => setLoading(false));
  }, [formId]);

  const total = responses.length;

  return (
    <div className="flex-1 flex flex-col">
      {/* Sub tabs */}
      <div className="flex border-b border-gray-100 bg-white px-4 md:px-6 xl:px-8">
        {["Ringkasan", "Pertanyaan", "Individual"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveSubTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeSubTab === t ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 px-4 py-2.5 my-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition self-center">
          📊 Lihat di Spreadsheet
        </button>
      </div>

      <div className="max-w-3xl mx-auto w-full py-6 px-4 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "📊", value: total, label: "Total Jawaban" },
            { icon: "⏱", value: "—", label: "Rata-rata Waktu" },
            { icon: "✅", value: total > 0 ? "100%" : "—", label: "Tingkat Selesai" },
            { icon: "📅", value: "Hari Ini", label: new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short"}) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="font-bold text-gray-800 text-lg leading-tight">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : total === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-5xl mb-3">📭</p>
            <p className="font-semibold text-gray-700">Belum ada respons</p>
            <p className="text-sm text-gray-400 mt-1">Bagikan link form untuk mulai mengumpulkan respons.</p>
          </div>
        ) : (
          responses.map((r, i) => (
            <ResponseCard key={r.id ?? i} response={r} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

function ResponseCard({ response, index }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-gray-700 text-sm">Respons #{index + 1}</p>
        <span className="text-xs text-gray-400">
          {response.submitted_at ? new Date(response.submitted_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        </span>
      </div>
      {(response.answers ?? []).map((a, ai) => (
        <div key={ai} className="text-xs text-gray-500 border-t border-gray-50 pt-2 mt-2">
          <span className="font-semibold text-gray-700">{a.question}: </span>{a.answer ?? "—"}
        </div>
      ))}
    </div>
  );
}

/* ── Settings Tab ───────────────────────────────────────────── */
function SettingsTab({ form, onUpdateStatus }) {
  const isPublic = form?.status === "public" || form?.form_status === "public";

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-3">
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-700 text-sm">Status Publikasi</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isPublic ? "Form dapat diisi oleh siapa saja dengan link." : "Form bersifat privat."}
          </p>
        </div>
        <Toggle value={isPublic} onChange={() => onUpdateStatus(isPublic ? "private" : "public")} />
      </div>

      {/* Default section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Default</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm text-gray-700 font-medium">Formulir default</p>
              <p className="text-xs text-gray-400">Gunakan pengaturan untuk formulir ini dan formulir baru</p>
            </div>
            <Toggle />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-gray-700 font-medium">Pertanyaan default</p>
              <p className="text-xs text-gray-400">Gunakan pengaturan sebagai pertanyaan baru</p>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-semibold text-gray-700 text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
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
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${on ? "" : "bg-gray-200"}`}
      style={on ? { background: "linear-gradient(90deg,#005fb3,#009bf5)" } : {}}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}
