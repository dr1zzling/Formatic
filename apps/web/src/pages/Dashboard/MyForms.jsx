import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import {
  Search, Plus, Share2, Pencil, Trash2,
  List, LayoutGrid, ChevronLeft, ChevronRight,
  FileText, Bell, Clock
} from "lucide-react";

const PER_PAGE   = 7;
const FORM_API   = "http://localhost:3000";
const STATUS_MAP = {
  public:  { cls: "bg-green-100 text-green-700 ring-green-200",  label: "Published" },
  private: { cls: "bg-gray-100 text-gray-500 ring-gray-200",     label: "Draft" },
};

function getUser() {
  try {
    const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
    return p.username || p.name || "User";
  } catch { return "User"; }
}

export default function MyForms() {
  const navigate  = useNavigate();
  const username  = getUser();

  const [forms, setForms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [view, setView]       = useState("list");
  const [modal, setModal]     = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/form/user");
      setForms(res.data?.data?.forms ?? []);
    } catch { setForms([]); }
    finally { setLoading(false); }
  }

  async function remove(slug) {
    if (!window.confirm("Hapus form ini?")) return;
    try { await api.delete("/form", { params: { form_slug: slug } }); load(); }
    catch { alert("Gagal menghapus."); }
  }

  const filtered   = forms.filter(f => (f.form_title ?? "").toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const start      = filtered.length ? (page - 1) * PER_PAGE + 1 : 0;
  const end        = Math.min(page * PER_PAGE, filtered.length);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6FA]">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pt-[52px] md:pt-0 pb-16 md:pb-0">

        {/* ── Header ─────────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 pt-6 pb-5 flex items-center justify-between gap-4 bg-[#F5F6FA]">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Formulir saya</p>
            <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight tracking-tight mt-0.5">My Forms</h1>
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

        {/* ── Toolbar ─────────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 pb-4 flex items-center gap-3 bg-[#F5F6FA]">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search your forms..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shrink-0">
            <button onClick={() => setView("list")} className={`px-2.5 py-2 transition ${view === "list" ? "bg-[#1a4fa0] text-white" : "text-gray-400 hover:bg-white"}`}><List size={14} /></button>
            <button onClick={() => setView("grid")} className={`px-2.5 py-2 transition ${view === "grid" ? "bg-[#1a4fa0] text-white" : "text-gray-400 hover:bg-white"}`}><LayoutGrid size={14} /></button>
          </div>

          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 transition shrink-0"
            style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Create Form</span>
            <span className="sm:hidden">Buat</span>
          </button>
        </div>

        {/* ── Count bar ───────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 md:px-8 xl:px-10 py-2.5 flex items-center justify-between text-[12px] text-gray-400 bg-white border-b border-gray-100">
            <span>Showing {start}–{end} of {filtered.length} forms</span>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition"><ChevronLeft size={13} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1 text-[12px] font-medium transition ${p === page ? "bg-[#1a4fa0] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                  {p}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 text-gray-400 hover:bg-gray-50 disabled:opacity-30 transition"><ChevronRight size={13} /></button>
            </div>
          </div>
        )}

        {/* ── Content ─────────────────────────────────── */}
        <div className="flex-1 px-6 md:px-8 xl:px-10 py-5">
          {loading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-[62px] bg-white rounded-xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && paged.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <FileText size={28} className="text-blue-300" />
              </div>
              <p className="font-semibold text-gray-700">{search ? "Form tidak ditemukan" : "Belum ada form"}</p>
              <p className="text-[13px] text-gray-400 mt-1">{search ? `Tidak ada hasil untuk "${search}"` : "Buat form pertamamu sekarang!"}</p>
              {!search && (
                <button onClick={() => setModal(true)} className="mt-5 px-5 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>
                  + Buat Form
                </button>
              )}
            </div>
          )}

          {!loading && paged.length > 0 && view === "list" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {paged.map((form, i) => {
                const st = STATUS_MAP[form.form_status] ?? STATUS_MAP.private;
                return (
                  <div
                    key={form.form_id ?? i}
                    onClick={() => navigate(`/form/${form.form_slug}`)}
                    className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 cursor-pointer transition group ${i < paged.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition">
                      <FileText size={15} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-gray-800 truncate group-hover:text-[#1a4fa0] transition">{form.form_title ?? "Untitled"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={10} className="text-gray-300" />
                        <p className="text-[11px] text-gray-400">{form.category ?? "—"} · 0 responses</p>
                      </div>
                    </div>
                    <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${st.cls}`}>
                      {st.label}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                      <Btn title="Salin link" onClick={() => navigator.clipboard.writeText(`${location.origin}/fill/${form.form_slug}`)}>
                        <Share2 size={13} />
                      </Btn>
                      <Btn title="Edit" onClick={() => navigate(`/form/${form.form_slug}`)}>
                        <Pencil size={13} />
                      </Btn>
                      <Btn title="Hapus" onClick={() => remove(form.form_slug)} red>
                        <Trash2 size={13} />
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && paged.length > 0 && view === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {paged.map((form, i) => {
                const st = STATUS_MAP[form.form_status] ?? STATUS_MAP.private;
                return (
                  <div key={form.form_id ?? i} onClick={() => navigate(`/form/${form.form_slug}`)}
                    className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                      <FileText size={17} className="text-blue-400" />
                    </div>
                    <p className="text-[13.5px] font-semibold text-gray-800 truncate group-hover:text-[#1a4fa0] transition">{form.form_title ?? "Untitled"}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 mb-2">{form.category ?? "—"} · 0 responses</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ${st.cls}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modal && <CreateModal onClose={() => setModal(false)} onDone={slug => { setModal(false); load(); if (slug) navigate(`/form/${slug}`); }} />}
    </div>
  );
}

function Btn({ title, onClick, children, red }) {
  return (
    <button title={title} onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${red ? "text-gray-400 hover:bg-red-50 hover:text-red-400" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}>
      {children}
    </button>
  );
}

function CreateModal({ onClose, onDone }) {
  const [title, setTitle]     = useState("");
  const [cat, setCat]         = useState("ujian");
  const [banner, setBanner]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  async function submit() {
    if (!title.trim()) { setErr("Judul wajib diisi."); return; }
    if (!banner)       { setErr("Banner wajib diunggah."); return; }
    setLoading(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("category", cat);
      fd.append("banner", banner);
      const res  = await fetch(`${FORM_API}/form`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal");
      onDone(data?.data?.form?.form_slug);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Buat Form Baru</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Isi detail form yang ingin kamu buat</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 text-lg leading-none transition">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {err && <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">{err}</div>}

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Judul Form</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr(""); }} placeholder="Contoh: Kuesioner Kepuasan Pelanggan"
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition text-gray-800 placeholder:text-gray-400" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Kategori</label>
            <div className="flex gap-2">
              {[{ v: "ujian", l: "Ujian / Quiz" }, { v: "survey", l: "Survey" }].map(({ v, l }) => (
                <button key={v} onClick={() => setCat(v)}
                  className={`flex-1 py-2.5 rounded-lg border text-[13px] font-medium transition ${cat === v ? "border-[#1a4fa0] bg-[#1a4fa0]/5 text-[#1a4fa0]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Banner Form</label>
            <label className="relative flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition overflow-hidden">
              {preview
                ? <img src={preview} className="w-full h-full object-cover" alt="" />
                : <div className="flex flex-col items-center gap-1.5 text-gray-400">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-xl">🖼️</div>
                    <span className="text-[12px] text-center px-4 text-gray-400">Klik untuk upload (JPG/PNG/WEBP, maks 5MB)</span>
                  </div>
              }
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files[0]; if (f) { setBanner(f); setPreview(URL.createObjectURL(f)); } }} className="hidden" />
            </label>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition">Batal</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>
            {loading ? "Membuat..." : "Buat Form"}
          </button>
        </div>
      </div>
    </div>
  );
}
