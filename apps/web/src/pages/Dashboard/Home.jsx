import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { FORM_API_URL } from "../../utils/api";
import { Bell, HelpCircle, Plus, ArrowRight, FileText, Search } from "lucide-react";
import Sidebar from "../../components/Sidebar";

const FORM_API = FORM_API_URL;

function getUsername() {
  try {
    const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
    return p.username || p.name || "User";
  } catch { return "User"; }
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Hari ini";
  if (d === 1) return "Kemarin";
  return `${d} hari lalu`;
}

const HISTORY_KEY = "formatic_history";



/* ── Activity Card ─────────────────────────────────────────────── */
function ActivityCard({ forms, loading }) {
  const navigate = useNavigate();
  const CAT_STYLE = { ujian: "bg-[#eee7ff] text-[#7850d9]", survey: "bg-[#e9f2ff] text-[#1768df]", default: "bg-[#e5faee] text-[#21a964]" };
  return (
    <section className="bg-white border border-[#e0eaf6] rounded-xl shadow-[0_8px_25px_rgba(35,83,145,0.08)] p-6 min-h-[355px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="m-0 text-[16px] font-bold text-[#17366d]">Aktivitas Terbaru</h3>
        <button onClick={() => navigate("/my-forms")} className="bg-transparent border-none text-[#1764d6] text-[11px] font-semibold cursor-pointer">View all</button>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {loading && [...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-[42px] h-[42px] rounded-[9px] bg-[#e8f0fb] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2"><div className="h-3 w-[70%] rounded bg-[#e8f0fb] animate-pulse" /><div className="h-2.5 w-[45%] rounded bg-[#e8f0fb] animate-pulse" /></div>
          </div>
        ))}
        {!loading && forms.slice(0, 4).map((form, i) => {
          const cat = form.category ?? "default";
          const style = CAT_STYLE[cat] ?? CAT_STYLE.default;
          return (
            <div key={form.form_id ?? i} onClick={() => navigate(`/form/${form.form_slug}`)} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-[42px] h-[42px] flex items-center justify-center rounded-[9px] shrink-0 ${style}`}><FileText size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#17366d] truncate group-hover:text-[#1764d6] transition-colors">{form.form_title ?? "Untitled"}</p>
                <p className="text-[10px] text-[#8ca0ba] mt-1">{form.category ?? "—"} &nbsp;•&nbsp; 0 responses</p>
              </div>
            </div>
          );
        })}
        {!loading && forms.length === 0 && <p className="text-[12px] text-[#8ca0ba] my-3">Belum ada aktivitas.</p>}
      </div>
      <button onClick={() => navigate("/my-forms")} className="w-full h-[38px] mt-4 px-[14px] flex items-center justify-between rounded-[7px] bg-[#f0f6ff] text-[#1764d6] text-[11px] border-none cursor-pointer hover:bg-[#e3efff] transition-colors">
        <span>View all activity</span><ArrowRight size={17} />
      </button>
    </section>
  );
}

/* ── History Pengerjaan ────────────────────────────────────────── */
function HistoryPengerjaan({ loading: parentLoading }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const CAT_STYLE = { ujian: "bg-[#eee7ff] text-[#7b51d6]", survey: "bg-[#eaf2ff] text-[#246de0]", default: "bg-[#e6f9ed] text-[#25af67]" };

  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
      setHistory(local);
    } catch { setHistory([]); }
  }, []);

  return (
    <section className="bg-white border border-[#e0eaf6] rounded-xl shadow-[0_8px_25px_rgba(35,83,145,0.08)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="m-0 text-[16px] font-bold text-[#17366d]">History Pengerjaan</h3>
        <button onClick={() => navigate("/history")} className="bg-transparent border-none text-[#1764d6] text-[11px] font-semibold cursor-pointer hover:underline">View all</button>
      </div>
      <div className="flex flex-col divide-y divide-[#edf2f8]">
        {parentLoading && [...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-4">
            <div className="w-[38px] h-[38px] rounded-lg bg-[#e8f0fb] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2"><div className="h-3 w-[65%] rounded bg-[#e8f0fb] animate-pulse" /><div className="h-2.5 w-[40%] rounded bg-[#e8f0fb] animate-pulse" /></div>
          </div>
        ))}
        {!parentLoading && history.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-[12px] text-[#8ca0ba]">Belum ada history pengerjaan.</p>
            <button onClick={() => navigate("/")} className="mt-2 text-[12px] text-[#1764d6] hover:underline">Cari form →</button>
          </div>
        )}
        {!parentLoading && history.slice(0, 4).map((form, i) => {
          const cat = form.category ?? "default";
          const style = CAT_STYLE[cat] ?? CAT_STYLE.default;
          return (
            <article key={i} onClick={() => navigate(`/fill/${form.form_slug}`)}
              className="flex items-center gap-3 py-[14px] cursor-pointer hover:bg-[#f7faff] transition-colors first:pt-0 last:pb-0">
              <div className={`w-[38px] h-[38px] flex items-center justify-center rounded-lg shrink-0 ${style}`}><FileText size={17} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#17366d] truncate">{form.form_title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-[#8ba0bb]">{cat}</span>
                  <span className="text-[10px] text-[#c5d2de]">·</span>
                  <span className="text-[10px] text-[#8ba0bb]">{timeAgo(form.submitted_at)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[11px] font-semibold text-[#1764d6]">{timeAgo(form.submitted_at)}</span>
                <span className="text-[9px] text-[#8da0b9] mt-0.5">terakhir dikerjakan</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ── Manage Forms Card ─────────────────────────────────────────── */
function ManageFormsCard({ totalForms }) {
  const navigate = useNavigate();
  return (
    <section className="relative flex items-center min-h-[315px] px-[38px] py-[35px] bg-white border border-[#e0eaf6] rounded-xl overflow-hidden shadow-[0_8px_25px_rgba(35,83,145,0.08)]"
      style={{ background: "radial-gradient(circle at 82% 45%,rgba(93,174,255,0.14),transparent 35%),linear-gradient(135deg,#ffffff,#f0f7ff)" }}>
      <div className="relative z-10">
        <span className="text-[10px] font-bold tracking-[1px] text-[#3d8ad1] uppercase">FORM MANAGEMENT</span>
        <h2 className="mt-3 mb-4 text-[26px] font-bold leading-[1.22] text-[#103b86]">Kelola Semua Form<br />Dalam Satu Tempat</h2>
        <p className="m-0 text-[#7088a8] text-[13px] leading-relaxed">Pantau respons, lihat statistik, dan kelola form<br />dengan praktis dan efisien.</p>
        <button onClick={() => navigate("/my-forms")}
          className="mt-[22px] h-[42px] inline-flex items-center gap-[11px] px-[18px] border border-[#1b67dc] rounded-[7px] bg-white text-[#155dc4] text-[12px] font-semibold cursor-pointer hover:bg-[#f0f7ff] transition-colors">
          Go to My Form <ArrowRight size={18} />
        </button>
      </div>
      <div className="absolute right-[30px] top-[28px] w-[44%] h-[260px]">
        <div className="absolute right-[30px] top-[15px] w-[250px] h-[215px] rounded-xl bg-white shadow-[0_18px_30px_rgba(31,89,151,0.14)] overflow-hidden rotate-[2deg]">
          <div className="h-[27px] flex items-center gap-[5px] px-[11px] bg-[#1b63cc]">
            {[0,1,2].map(i => <span key={i} className="w-[7px] h-[7px] rounded-full bg-white/70" />)}
          </div>
          <div className="relative h-[calc(100%-27px)] p-[17px]">
            <div className="w-[76px] h-[76px] rounded-full relative" style={{ background: "conic-gradient(#2772dc 0 62%,#6db8ee 62% 82%,#c9e5fb 82% 100%)" }}>
              <div className="w-[34px] h-[34px] absolute top-[21px] left-[21px] rounded-full bg-white" />
            </div>
            <div className="absolute left-[110px] top-[18px] w-[90px] space-y-[9px]">
              {["85%","65%","75%","45%"].map((w,i) => <span key={i} className="block h-1.5 rounded bg-[#e1ebf7]" style={{width:w}} />)}
            </div>
            <div className="absolute left-5 right-5 bottom-4 h-[60px] flex items-end gap-[9px]">
              {[35,60,45,80,68].map((h,i) => <span key={i} className="flex-1 block rounded-t bg-[#78b5ef]" style={{height:`${h}%`}} />)}
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-[23px] w-[130px] p-3 rounded-[9px] bg-white shadow-[0_10px_25px_rgba(35,83,145,0.14)]">
          <span className="block text-[8px] text-[#879bb5]">Total Forms</span>
          <strong className="block mt-1 text-[18px] text-[#173b78]">{totalForms}</strong>
          <small className="text-[#2eb56e] text-[9px]">↗ aktif</small>
        </div>
      </div>
    </section>
  );
}

const CARD_COLORS = [
  { from: "#dbeafe", to: "#bfdbfe" },
  { from: "#ede9fe", to: "#ddd6fe" },
  { from: "#d1fae5", to: "#a7f3d0" },
  { from: "#fef3c7", to: "#fde68a" },
  { from: "#ffe4e6", to: "#fecdd3" },
  { from: "#e0f2fe", to: "#bae6fd" },
];

/* ── Fetch Forms Grid (ganti CreateFormCard) ───────────────────── */
function FetchFormsGrid({ search, category }) {
  const navigate = useNavigate();
  const [forms, setForms]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [category]);

  async function load() {
    setLoading(true);
    try {
      let res;
      if (category === "All" || category === "Public") {
        res = await api.get("/form");
      } else {
        const map = { Quiz: "ujian", Survey: "survei" };
        res = await api.get("/form/category", { params: { category: map[category] ?? category.toLowerCase() } });
      }
      setForms(res.data?.data ?? []);
    } catch { setForms([]); }
    finally { setLoading(false); }
  }

  const filtered = forms.filter(f =>
    (f.title ?? f.form_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold text-[#17366d]">Semua Form Tersedia</h2>
        <button onClick={load} className="text-[12px] text-[#1764d6] hover:underline font-semibold">
          Refresh
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-24 bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-[13px] text-gray-500 font-medium">Belum ada form tersedia</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((form, i) => {
            const title  = form.title ?? form.form_title ?? "Untitled";
            const banner = form.banner ?? form.form_banner;
            const status = form.status ?? form.form_status ?? "private";
            const cat    = form.category ?? "";
            const clr    = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <div key={form.id ?? i}
                onClick={() => navigate(`/fill/${form.slug ?? form.form_slug}`)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all cursor-pointer flex flex-col"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="h-24 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg,${clr.from},${clr.to})` }}>
                  {banner && (
                    <img src={`${FORM_API}${banner}`} alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.style.display = "none"; }} />
                  )}
                  <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    status === "public" ? "bg-green-500/90 text-white" : "bg-black/25 text-white/90"
                  }`}>{status}</span>
                </div>
                <div className="p-2.5 flex-1 flex flex-col">
                  {cat && <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{cat}</span>}
                  <h3 className="text-[12px] font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">{title}</h3>
                  <p className="text-[10px] text-gray-400 mt-1.5">0 respons</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Search + Filter ───────────────────────────────────────────── */
function SearchFilter({ search, setSearch, category, setCategory }) {
  const categories = ["All", "Public", "Quiz", "Survey"];
  return (
    <div className="mb-7">
      <div className="h-12 flex items-center gap-3 px-[17px] bg-white border border-[#dce7f5] rounded-lg shadow-[0_3px_12px_rgba(35,83,145,0.04)] text-[#5280b5] mb-[14px]">
        <Search size={19} className="shrink-0" />
        <input type="text" placeholder="Search forms or templates..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 outline-none border-none bg-transparent text-[13px] text-[#173d72] placeholder:text-[#9aacbf]" />
      </div>
      <div className="flex gap-3 flex-wrap">
        {categories.map(item => (
          <button key={item} onClick={() => setCategory(item)}
            className={`min-w-[76px] h-[35px] px-[17px] flex items-center justify-center gap-1 border rounded-full text-[12px] font-medium transition-all ${
              category === item ? "bg-[#0c3978] border-[#0c3978] text-white" : "bg-white border-[#d9e6f6] text-[#193c70] hover:border-[#3d91b2]"
            }`}>{item}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const username = getUsername();

  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("All");
  const [myForms, setMyForms]       = useState([]);
  const [myLoading, setMyLoading]   = useState(true);

  useEffect(() => { loadMyForms(); }, []);

  async function loadMyForms() {
    setMyLoading(true);
    try {
      const res  = await api.get("/form/user");
      setMyForms(res.data?.data?.forms ?? []);
    } catch { setMyForms([]); }
    finally { setMyLoading(false); }
  }
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 sm:px-6 md:px-8 xl:px-11 py-16 md:py-9 pb-24 md:pb-16"
          style={{ background: "radial-gradient(circle at 85% 10%,rgba(93,174,255,0.1),transparent 28%),#f5f9ff" }}>
          <header className="flex items-start justify-between mb-6 gap-3">
            <div className="min-w-0">
              <h1 className="m-0 text-[22px] sm:text-[28px] font-bold text-[#102f68] leading-tight">Hi, {username}! 👋</h1>
              <p className="mt-1 text-[13px] text-[#8195b2] hidden sm:block">Fill out forms, give responses, and share your feedback.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-9 h-9 flex items-center justify-center text-[#143b75] bg-transparent border-none cursor-pointer"><Bell size={18} /></button>
              <div className="w-9 h-9 rounded-full bg-[#1458d1] text-white text-[13px] font-bold flex items-center justify-center">{username[0]?.toUpperCase()}</div>
            </div>
          </header>

          <SearchFilter search={search} setSearch={setSearch} category={category} setCategory={setCategory} />

          {/* Fetch Forms Grid — ganti CreateFormCard */}
          <FetchFormsGrid search={search} category={category} />

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <ActivityCard forms={myForms} loading={myLoading} />
            <div className="space-y-5">
              <HistoryPengerjaan loading={myLoading} />
              <ManageFormsCard totalForms={myForms.length} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
