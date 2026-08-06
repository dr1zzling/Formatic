import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { ArrowLeft, Undo2, Redo2, Link2, Plus, Copy, Trash2 } from "lucide-react";

const QUESTION_TYPES = [
  { value:"radio",    label:"Pilihan Ganda" },
  { value:"checkbox", label:"Kotak Centang" },
  { value:"text",     label:"Jawaban Singkat" },
  { value:"file",     label:"Unggah File" },
];

const TABS = ["Pertanyaan","Jawaban","Setelan"];

export default function FormEditor() {
  const { slug }   = useParams();
  const navigate   = useNavigate();

  const [form, setForm]           = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("Pertanyaan");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [toast, setToast]         = useState("");

  useEffect(() => { loadForm(); }, [slug]);

  async function loadForm() {
    setLoading(true); setError("");
    try {
      const res = await api.get("/form/slug", { params: { slug } });
      const f   = res.data?.data;
      setForm(f);
      setQuestions(
        (f?.soal ?? []).map(s => ({
          id: s.id, question: s.question, type: s.type, required: true,
          options: (s.options ?? []).map(o => ({ id:o.id, value:o.option_value, is_correct:o.is_correct })),
        }))
      );
    } catch { setError("Form tidak ditemukan."); }
    finally { setLoading(false); }
  }

  function addQuestion() {
    setQuestions(prev => [...prev, { _new:true, question:"", type:"radio", required:true, options:[{value:"Opsi 1"},{value:"Opsi 2"}] }]);
  }

  function updateQ(idx, field, val) {
    setQuestions(prev => prev.map((q,i) => i===idx ? {...q,[field]:val} : q));
  }

  function updateOpt(qIdx, oIdx, val) {
    setQuestions(prev => prev.map((q,i) => {
      if(i!==qIdx) return q;
      return {...q, options: q.options.map((o,j) => j===oIdx ? {...o,value:val} : o)};
    }));
  }

  function addOpt(qIdx) {
    setQuestions(prev => prev.map((q,i) => i!==qIdx ? q : {...q, options:[...q.options,{value:`Opsi ${q.options.length+1}`}]}));
  }

  function removeOpt(qIdx, oIdx) {
    setQuestions(prev => prev.map((q,i) => i!==qIdx ? q : {...q, options:q.options.filter((_,j)=>j!==oIdx)}));
  }

  function removeQ(idx) { setQuestions(prev => prev.filter((_,i)=>i!==idx)); }

  function duplicateQ(idx) {
    setQuestions(prev => { const c=[...prev]; c.splice(idx+1,0,{...prev[idx],_new:true,id:undefined}); return c; });
  }

  async function saveQuestions() {
    const newOnes = questions.filter(q => q._new);
    if (!newOnes.length) { showToast("Tidak ada soal baru."); return; }
    if (newOnes.find(q => !q.question.trim())) { setError("Pertanyaan wajib diisi."); return; }
    setSaving(true); setError("");
    try {
      const payload = newOnes.map(q => {
        const hasOpts = ["radio","checkbox","rating"].includes(q.type);
        return {
          soal: { question: q.question, type: q.type },
          option_value: hasOpts ? q.options.filter(o=>o.value.trim()).map(o=>({value:o.value})) : [{value:""}],
          soal_option: { is_correct: false },
        };
      });
      await api.post(`/form/soal/${form.form_id}`, payload);
      showToast(`${newOnes.length} soal berhasil disimpan!`);
      loadForm();
    } catch(e) { setError(e.response?.data?.message || "Gagal menyimpan."); }
    finally { setSaving(false); }
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),3000); }

  if (loading) return (
    <div className="flex min-h-screen"><Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-gray-500 text-sm">Memuat form...</p></div>
      </div>
    </div>
  );

  if (error && !form) return (
    <div className="flex min-h-screen"><Sidebar />
      <div className="flex-1 flex items-center justify-center text-center">
        <div><p className="text-5xl mb-3">😕</p><p className="font-semibold text-gray-700">{error}</p>
          <button onClick={() => navigate("/my-forms")} className="mt-4 px-4 py-2 rounded-lg text-white text-sm" style={{background:"#005fb3"}}>Kembali</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-8 py-4 border-b border-gray-100 bg-white">
          <button onClick={() => navigate("/my-forms")} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20}/></button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-800 truncate">{form?.form_title ?? "Form"}</h1>
            <p className="text-xs text-gray-400">{form?.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><Undo2 size={16}/></button>
            <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><Redo2 size={16}/></button>
            <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><Link2 size={16}/></button>
            <button onClick={saveQuestions} disabled={saving}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
              style={{background:"linear-gradient(90deg,#005fb3,#009bf5)"}}>
              {saving ? "Menyimpan..." : "Publish"}
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex px-8 border-b border-gray-100 bg-white">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab===tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab}
              {tab === "Jawaban" && <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">{questions.length}</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {activeTab === "Pertanyaan" && (
            <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
              {/* Form title card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 border-l-4 border-l-blue-500">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{form?.form_title}</h2>
                <textarea placeholder="Deskripsi form (opsional)..." rows={3}
                  className="w-full text-sm text-gray-500 resize-none outline-none border-b border-dashed border-gray-200 pb-2" />
              </div>

              {error && <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

              {questions.map((q, qIdx) => (
                <QuestionCard key={q.id ?? `new-${qIdx}`} question={q} index={qIdx}
                  onUpdate={(f,v) => updateQ(qIdx,f,v)}
                  onUpdateOpt={(oIdx,v) => updateOpt(qIdx,oIdx,v)}
                  onAddOpt={() => addOpt(qIdx)}
                  onRemoveOpt={oIdx => removeOpt(qIdx,oIdx)}
                  onRemove={() => removeQ(qIdx)}
                  onDuplicate={() => duplicateQ(qIdx)}
                />
              ))}

              <button onClick={addQuestion}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm font-medium transition flex items-center justify-center gap-2">
                <Plus size={18}/> Tambah Pertanyaan
              </button>
            </div>
          )}

          {activeTab === "Jawaban" && (
            <ResponsesTab questions={questions} formId={form?.form_id} />
          )}

          {activeTab === "Setelan" && (
            <SettingsTab />
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg z-50">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, index, onUpdate, onUpdateOpt, onAddOpt, onRemoveOpt, onRemove, onDuplicate }) {
  const hasOptions = ["radio","checkbox","rating"].includes(question.type);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition ${question._new ? "border-blue-400" : "border-gray-100"}`}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xs font-bold text-gray-400 mt-3 shrink-0">{index+1}.</span>
        <input type="text" value={question.question}
          onChange={e => onUpdate("question",e.target.value)}
          placeholder="Masukkan pertanyaan..."
          readOnly={!question._new}
          className="flex-1 text-sm font-medium text-gray-700 outline-none border-b border-dashed border-gray-200 pb-1.5 focus:border-blue-400 transition bg-transparent" />
        <select value={question.type} onChange={e => onUpdate("type",e.target.value)}
          disabled={!question._new}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none disabled:opacity-60 shrink-0">
          {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {hasOptions && (
        <div className="space-y-2 mb-3 ml-5">
          {question.options.map((opt, oIdx) => (
            <div key={oIdx} className="flex items-center gap-2">
              <span className="text-gray-300 text-sm">{question.type==="checkbox" ? "□" : "○"}</span>
              <input type="text" value={opt.value}
                onChange={e => onUpdateOpt(oIdx,e.target.value)}
                readOnly={!question._new}
                className="flex-1 text-sm text-gray-600 outline-none border-b border-dashed border-gray-100 focus:border-blue-300 transition bg-transparent" />
              {question._new && (
                <button onClick={() => onRemoveOpt(oIdx)} className="text-gray-300 hover:text-red-400 transition text-xs">✕</button>
              )}
            </div>
          ))}
          {question._new && (
            <button onClick={onAddOpt} className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 ml-5 mt-1 transition">
              <Plus size={12}/> Tambah opsi
            </button>
          )}
        </div>
      )}

      {question.type === "text" && (
        <div className="ml-5 mb-3">
          <input disabled placeholder="Jawaban teks pendek..." className="w-full text-sm text-gray-300 border-b border-dashed border-gray-100 outline-none bg-transparent" />
        </div>
      )}

      {question.type === "file" && (
        <div className="ml-5 mb-3 text-sm text-gray-400 flex items-center gap-2">
          📎 <span>Pengguna dapat mengunggah file</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-50">
        <button title="Duplikat" onClick={onDuplicate} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"><Copy size={14}/></button>
        <button title="Hapus" onClick={onRemove} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-red-400 transition"><Trash2 size={14}/></button>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 ml-2 cursor-pointer">
          <input type="checkbox" checked={question.required} onChange={e => onUpdate("required",e.target.checked)} className="accent-blue-500" />
          Wajib
        </label>
      </div>
    </div>
  );
}

function ResponsesTab({ questions, formId }) {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label:"Total Jawaban", value:"0", icon:"📊" },
          { label:"Rata-rata Waktu", value:"—", icon:"⏱" },
          { label:"Tingkat Selesai", value:"—", icon:"✅" },
          { label:"Hari Ini", value:"0", icon:"📅" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-bold text-gray-800 text-lg">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="text-center py-12">
        <p className="text-5xl mb-3">📭</p>
        <p className="font-semibold text-gray-700">Belum ada respons</p>
        <p className="text-sm text-gray-400 mt-1">Respons akan muncul di sini setelah ada yang mengisi form.</p>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      {[
        { title:"Jadikan semua kuis", desc:"Penetapan poin yang tepat dan nilai pertanyaan" },
        { title:"Jawaban", desc:"Mengoleksi data respon, nilai dan lainnya" },
        { title:"Presentasi", desc:"Pengaturan cara formulir dan respons ditampilkan" },
      ].map(item => (
        <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-700 text-sm">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
          </div>
          <Toggle />
        </div>
      ))}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-semibold text-gray-400 text-xs uppercase mb-3">Default</p>
        {[
          { title:"Formulir default", desc:"Gunakan pengaturan untuk formulir ini dan formulir baru" },
          { title:"Pertanyaan default", desc:"Gunakan pengaturan sebagai pertanyaan baru" },
        ].map(item => (
          <div key={item.title} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-50">
            <div>
              <p className="text-sm text-gray-700">{item.title}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <Toggle />
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle() {
  const [on, setOn] = useState(false);
  return (
    <button onClick={() => setOn(!on)} className={`w-11 h-6 rounded-full relative transition-colors ${on ? "" : "bg-gray-200"}`}
      style={on ? {background:"linear-gradient(90deg,#005fb3,#009bf5)"} : {}}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on?"left-5":"left-0.5"}`}/>
    </button>
  );
}
