import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { Search, Trash2, RotateCcw, Bell, FileText, AlertTriangle } from "lucide-react";

const FORM_API = "http://localhost:3000";
const FILTERS  = ["Semua", "Survey", "Quiz/Ujian"];

const SCHEMES = [
  "linear-gradient(135deg,#dbeafe,#bfdbfe)",
  "linear-gradient(135deg,#ede9fe,#ddd6fe)",
  "linear-gradient(135deg,#d1fae5,#a7f3d0)",
  "linear-gradient(135deg,#fef3c7,#fde68a)",
  "linear-gradient(135deg,#ffe4e6,#fecdd3)",
];

function getUser() {
  try { const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1])); return p.username || p.name || "User"; }
  catch { return "User"; }
}

export default function Trash() {
  const navigate  = useNavigate();
  const username  = getUser();
  const [filter, setFilter]   = useState("Semua");
  const [search, setSearch]   = useState("");
  const [forms, setForms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/form/user");
      setForms(res.data?.data?.forms ?? []);
    } catch { setForms([]); }
    finally { setLoading(false); }
  }

  async function restore(form) {
    try { await api.patch("/form", { status: "public" }, { params: { form_slug: form.form_slug } }); showToast("Form dipulihkan!"); load(); }
    catch { showToast("Gagal memulihkan."); }
  }

  async function destroy(form) {
    if (!window.confirm(`Hapus permanen "${form.form_title}"?`)) return;
    try { await api.delete("/form", { params: { form_slug: form.form_slug } }); showToast("Form dihapus permanen."); load(); }
    catch { showToast("Gagal menghapus."); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const visible = forms.filter(f => {
    const t = (f.form_title ?? "").toLowerCase().includes(search.toLowerCase());
    if (!t) return false;
    if (filter === "Survey")    return f.category === "survey";
    if (filter === "Quiz/Ujian") return f.category === "ujian";
    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6FA]">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pt-[52px] md:pt-0 pb-16 md:pb-0" style={{ width: "calc(100% - 366px)" }}>

        {/* ── Header ─────────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 pt-6 pb-5 flex items-center justify-between gap-4 bg-[#F5F6FA]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <Trash2 size={17} className="text-red-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Sampah</p>
              <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight tracking-tight">Trash</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 shadow-sm transition">
              <Bell size={14} />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>
              {username[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Search + filters ────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 py-4 bg-[#F5F6FA] flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deleted forms..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div className="flex items-center gap-1.5">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition border ${filter === f ? "bg-[#1a4fa0] text-white border-[#1a4fa0]" : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Notice banner ───────────────────────────── */}
        {!loading && visible.length > 0 && (
          <div className="mx-6 md:mx-8 xl:mx-10 mt-5 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-amber-700">
              <span className="font-semibold">Perhatian:</span> Forms di trash akan dihapus permanen setelah 30 hari. Restore segera jika masih dibutuhkan.
            </p>
          </div>
        )}

        {/* ── List ────────────────────────────────────── */}
        <div className="flex-1 px-6 md:px-8 xl:px-10 py-5 space-y-2.5">
          {loading && (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))
          )}

          {!loading && visible.length === 0 && (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Trash2 size={26} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700">Trash kosong</p>
              <p className="text-[13px] text-gray-400 mt-1">Tidak ada form yang dihapus.</p>
            </div>
          )}

          {!loading && visible.map((form, i) => {
            const banner = form.form_banner ?? form.banner;
            const st     = form.form_status;
            return (
              <div key={form.form_id ?? i}
                className="bg-white rounded-xl border border-gray-100 flex items-center gap-0 overflow-hidden hover:border-gray-200 hover:shadow-sm transition group"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

                {/* Thumbnail */}
                <div className="w-16 sm:w-20 h-16 sm:h-[72px] shrink-0 overflow-hidden relative"
                  style={{ background: SCHEMES[i % SCHEMES.length] }}>
                  {banner
                    ? <img src={`${FORM_API}${banner}`} className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} alt="" />
                    : <div className="w-full h-full flex items-center justify-center"><FileText size={20} className="opacity-25 text-gray-600" /></div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 px-4 py-3">
                  <button onClick={() => navigate(`/form/${form.form_slug}`)} className="text-left">
                    <p className="text-[13.5px] font-semibold text-gray-800 truncate hover:text-[#1a4fa0] transition">{form.form_title ?? "Untitled"}</p>
                  </button>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st === "public" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {st === "public" ? "Public" : "Private"}
                    </span>
                    {form.category && <span className="text-[11px] text-gray-400">{form.category}</span>}
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">0 responses</span>
                  </div>
                  {/* Mobile actions */}
                  <div className="flex gap-2 mt-2 md:hidden">
                    <button onClick={() => restore(form)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition">
                      <RotateCcw size={10} /> Restore
                    </button>
                    <button onClick={() => destroy(form)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-100 text-[11px] font-semibold text-red-500 hover:bg-red-50 transition">
                      <Trash2 size={10} /> Hapus
                    </button>
                  </div>
                </div>

                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-2 pr-4 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => restore(form)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition bg-white">
                    <RotateCcw size={12} /> Restore
                  </button>
                  <button onClick={() => destroy(form)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-[12px] font-semibold text-red-500 hover:bg-red-50 transition bg-white">
                    <Trash2 size={12} /> Delete Permanently
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[13px] px-5 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" /> {toast}
        </div>
      )}
    </div>
  );
}
