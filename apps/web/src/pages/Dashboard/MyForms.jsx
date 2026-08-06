import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { Search, Plus, List, LayoutGrid, Share2, Edit2, Trash2, Bell, Settings } from "lucide-react";

const STATUS_COLORS = {
  public:    "bg-green-100 text-green-700",
  private:   "bg-gray-100 text-gray-500",
  draft:     "bg-yellow-100 text-yellow-700",
  published: "bg-blue-100 text-blue-700",
};

const ITEMS_PER_PAGE = 7;

function getUsername() {
  const token = localStorage.getItem("token");
  if (!token) return "User";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || payload.name || "User";
  } catch { return "User"; }
}

export default function MyForms() {
  const navigate = useNavigate();
  const [forms, setForms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [view, setView]           = useState("list");
  const [showModal, setShowModal] = useState(false);
  const username = getUsername();

  useEffect(() => { loadForms(); }, []);

  async function loadForms() {
    setLoading(true);
    try {
      const res = await api.get("/form/user");
      setForms(res.data?.data?.form ?? []);
    } catch { setForms([]); }
    finally { setLoading(false); }
  }

  const filtered = forms.filter((f) =>
    (f.form_title ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-8 pt-7 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Hi, {username}! 👋</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create and manage your forms easily.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"><Bell size={18}/></button>
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"><Settings size={18}/></button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background:"linear-gradient(135deg,#005fb3,#009bf5)" }}>
              {username[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="px-8 mt-5 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your forms..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setView("list")} className={`p-2.5 transition ${view==="list" ? "bg-[#005fb3] text-white" : "text-gray-400 hover:bg-gray-50"}`}><List size={16}/></button>
            <button onClick={() => setView("grid")} className={`p-2.5 transition ${view==="grid" ? "bg-[#005fb3] text-white" : "text-gray-400 hover:bg-gray-50"}`}><LayoutGrid size={16}/></button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
            style={{ background:"linear-gradient(90deg,#005fb3,#009bf5)" }}
          >
            <Plus size={16}/> Create Form
          </button>
        </div>

        {/* Title + count */}
        <div className="px-8 mb-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">My Forms</h2>
          <span className="text-xs text-gray-400">
            {filtered.length > 0 ? `Showing ${(page-1)*ITEMS_PER_PAGE+1}–${Math.min(page*ITEMS_PER_PAGE,filtered.length)} of ${filtered.length} forms` : "0 forms"}
          </span>
        </div>

        {/* List/Grid */}
        <div className="flex-1 px-8 pb-4 overflow-auto">
          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
            </div>
          )}

          {!loading && paged.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-5xl mb-3">📝</p>
              <p className="font-semibold text-gray-700">{search ? "Form tidak ditemukan" : "Belum ada form"}</p>
              <p className="text-gray-400 text-sm mt-1">{search ? `Tidak ada hasil untuk "${search}"` : "Buat form pertamamu!"}</p>
              {!search && (
                <button onClick={() => setShowModal(true)} className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background:"linear-gradient(90deg,#005fb3,#009bf5)" }}>
                  + Buat Form
                </button>
              )}
            </div>
          )}

          {!loading && paged.length > 0 && (
            view === "list"
              ? <ListView forms={paged} navigate={navigate} />
              : <GridView forms={paged} navigate={navigate} />
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-center gap-1">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
              <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-lg text-sm font-medium transition"
                style={p===page ? {background:"linear-gradient(90deg,#005fb3,#009bf5)",color:"white"} : {border:"1px solid #e5e7eb",color:"#4b5563"}}>
                {p}
              </button>
            ))}
            <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">›</button>
          </div>
        )}
      </div>

      {showModal && <CreateFormModal onClose={() => setShowModal(false)} onCreated={(slug) => { setShowModal(false); loadForms(); if(slug) navigate(`/form/${slug}`); }} />}
    </div>
  );
}

function ListView({ forms, navigate }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {forms.map((form, idx) => (
        <div
          key={form.form_id ?? idx}
          onClick={() => navigate(`/form/${form.form_slug}`)}
          className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition ${idx < forms.length-1 ? "border-b border-gray-50" : ""}`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{form.form_title ?? "Untitled"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{form.category} · 0 Responses</p>
          </div>
          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${STATUS_COLORS[form.form_status] ?? STATUS_COLORS.private}`}>
            {form.form_status ?? "private"}
          </span>
          <div className="flex items-center gap-1 shrink-0" onClick={e=>e.stopPropagation()}>
            <IconBtn title="Share"><Share2 size={14}/></IconBtn>
            <IconBtn title="Edit" onClick={() => navigate(`/form/${form.form_slug}`)}><Edit2 size={14}/></IconBtn>
            <IconBtn title="Hapus"><Trash2 size={14}/></IconBtn>
          </div>
        </div>
      ))}
    </div>
  );
}

function GridView({ forms, navigate }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {forms.map((form, idx) => (
        <div key={form.form_id ?? idx} onClick={() => navigate(`/form/${form.form_slug}`)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="font-semibold text-gray-800 text-sm truncate">{form.form_title ?? "Untitled"}</p>
          <p className="text-xs text-gray-400 mt-1">{form.category} · 0 Responses</p>
          <span className={`inline-block mt-2 text-xs font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[form.form_status] ?? STATUS_COLORS.private}`}>
            {form.form_status ?? "private"}
          </span>
        </div>
      ))}
    </div>
  );
}

const CATEGORIES = [{ id:1,name:"Quiz"},{id:2,name:"Survey"},{id:3,name:"Exam"}];

function CreateFormModal({ onClose, onCreated }) {
  const [title, setTitle]     = useState("");
  const [catId, setCatId]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleCreate = async () => {
    if (!title.trim()) { setError("Judul form wajib diisi."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/form", { title: title.trim(), category_id: catId });
      onCreated(res.data?.data?.form?.form_slug);
    } catch (e) {
      setError(e.response?.data?.message || "Gagal membuat form.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 text-lg">Buat Form Baru</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {error && <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Judul Form</label>
            <input type="text" placeholder="Contoh: Kuesioner Kepuasan Pelanggan" value={title}
              onChange={e => { setTitle(e.target.value); setError(""); }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kategori</label>
            <select value={catId} onChange={e => setCatId(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300 transition">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Batal</button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
            style={{ background:"linear-gradient(90deg,#005fb3,#009bf5)" }}>
            {loading ? "Membuat..." : "Buat Form"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ title, onClick, children }) {
  return (
    <button title={title} onClick={onClick} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
      {children}
    </button>
  );
}
