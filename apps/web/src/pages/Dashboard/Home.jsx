import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { Search, Bell, RefreshCw, ArrowUpRight, Users, FileText, TrendingUp } from "lucide-react";

const FORM_API = "http://localhost:3000";

const CATS = [
  { label: "Semua",  value: "all" },
  { label: "Public", value: "public" },
  { label: "Quiz",   value: "ujian" },
  { label: "Survey", value: "survey" },
];

const SCHEMES = [
  { from: "#EEF2FF", to: "#C7D2FE", accent: "#6366F1" },
  { from: "#F0FDF4", to: "#BBF7D0", accent: "#22C55E" },
  { from: "#FFF7ED", to: "#FED7AA", accent: "#F97316" },
  { from: "#FDF4FF", to: "#F5D0FE", accent: "#D946EF" },
  { from: "#F0F9FF", to: "#BAE6FD", accent: "#0EA5E9" },
  { from: "#FEFCE8", to: "#FEF08A", accent: "#EAB308" },
];

function getUser() {
  try {
    const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
    return p.username || p.name || "User";
  } catch { return "User"; }
}

export default function Home() {
  const navigate  = useNavigate();
  const [cat, setCat]         = useState("all");
  const [forms, setForms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const username = getUser();

  useEffect(() => { load(); }, [cat]);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = (cat === "all" || cat === "public")
        ? await api.get("/form")
        : await api.get("/form/category", { params: { category: cat } });
      setForms(res.data?.data ?? []);
    } catch { setError("Gagal memuat form."); setForms([]); }
    finally { setLoading(false); }
  }

  const hour    = new Date().getHours();
  const greet   = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";
  const emoji   = hour < 11 ? "☀️" : hour < 15 ? "🌤️" : hour < 19 ? "🌇" : "🌙";
  const filtered = forms.filter(f =>
    (f.title ?? f.form_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6FA]">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pt-[52px] md:pt-0 pb-16 md:pb-0">

        {/* ── Top bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 md:px-8 xl:px-10 pt-6 pb-4 bg-[#F5F6FA]">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{greet} {emoji}</p>
              <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight tracking-tight mt-0.5">
                Hi, {username}!
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 shadow-sm transition">
              <Bell size={14} />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}
            >
              {username[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Search + tabs row ────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 pb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64 shrink-0">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari form..."
                className="w-full pl-8.5 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition shadow-sm placeholder:text-gray-400"
                style={{ paddingLeft: "2.2rem" }}
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCat(c.value)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition border ${
                    cat === c.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              className="ml-auto w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition shadow-sm shrink-0"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* ── Section label ────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-gray-400" />
            <span className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">Recommended Forms</span>
          </div>
          <button className="flex items-center gap-1 text-[12.5px] font-semibold text-[#1a4fa0] hover:underline">
            Lihat semua <ArrowUpRight size={13} />
          </button>
        </div>

        {/* ── Grid ─────────────────────────────────────── */}
        <div className="flex-1 px-6 md:px-8 xl:px-10 pb-10">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-[130px] bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                    <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-xl mb-3">⚠️</div>
              <p className="font-semibold text-gray-700 text-[14px]">Gagal memuat form</p>
              <p className="text-[12.5px] text-gray-400 mt-1 max-w-xs">Pastikan backend sudah berjalan di port 3000.</p>
              <button onClick={load} className="mt-4 px-4 py-2 rounded-lg text-white text-[13px] font-semibold"
                style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>
                Coba lagi
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl mb-3">📋</div>
              <p className="font-semibold text-gray-700 text-[14px]">Belum ada form</p>
              <p className="text-[12.5px] text-gray-400 mt-1">Coba kategori lain atau buat form baru.</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((form, i) => (
                <FormCard
                  key={form.id ?? i}
                  form={form}
                  scheme={SCHEMES[i % SCHEMES.length]}
                  onClick={() => navigate(`/form/${form.slug ?? form.form_slug}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormCard({ form, scheme, onClick }) {
  const title    = form.title ?? form.form_title ?? "Untitled Form";
  const status   = form.status ?? form.form_status ?? "private";
  const category = form.category ?? "";
  const banner   = form.banner ?? form.form_banner;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer flex flex-col"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      {/* Thumbnail */}
      <div
        className="h-[130px] relative overflow-hidden flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${scheme.from} 0%, ${scheme.to} 100%)` }}
      >
        {banner ? (
          <img
            src={`${FORM_API}${banner}`}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : (
          <FileText size={32} color={scheme.accent} strokeWidth={1.2} className="opacity-50" />
        )}
        {status === "public" && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-green-600 shadow-sm">
            Public
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex-1 flex flex-col">
        {category && (
          <span className="text-[10.5px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            {category}
          </span>
        )}
        <h3 className="text-[13.5px] font-bold text-gray-800 leading-snug line-clamp-2 flex-1 group-hover:text-[#1a4fa0] transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Users size={11} />
            <span>0 respons</span>
          </div>
          <button
            onClick={e => e.stopPropagation()}
            className="text-[11.5px] font-bold text-[#1a4fa0] flex items-center gap-0.5 hover:gap-1.5 transition-all"
          >
            Isi Form <ArrowUpRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
