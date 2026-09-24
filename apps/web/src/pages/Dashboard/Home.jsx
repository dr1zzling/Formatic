import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { FORM_API_URL, flattenForm } from "../../utils/api";
import { Bell, ArrowRight, FileText } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

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
  const CAT_STYLE = { ujian: "bg-[#eee7ff] text-[#7850d9]", survey: "bg-[#e9f2ff] text-[#1768df]", survei: "bg-[#e9f2ff] text-[#1768df]", default: "bg-[#e5faee] text-[#21a964]" };
  return (
    <section className="border border-[#e0eaf6] rounded-xl shadow-[0_8px_25px_rgba(35,83,145,0.08)] p-6 min-h-[355px] flex flex-col transition-colors"
      style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
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
            <div key={form.id ?? form.form_id ?? i} onClick={() => navigate(`/form/${form.slug ?? form.form_slug}`)} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-[42px] h-[42px] flex items-center justify-center rounded-[9px] shrink-0 ${style}`}><FileText size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#17366d] truncate group-hover:text-[#1764d6] transition-colors">{form.title ?? form.form_title ?? "Untitled"}</p>
                <p className="text-[10px] text-[#8ca0ba] mt-1">{form.category ?? "—"} &nbsp;•&nbsp; 0 responses</p>
              </div>
            </div>
          );
        })}
        {!loading && forms.length === 0 && <p className="text-[12px] text-[#8ca0ba] my-3">Belum ada aktivitas.</p>}
      </div>
      <button onClick={() => navigate("/my-forms")} className="w-full h-[38px] mt-4 px-[14px] flex items-center justify-between rounded-[7px] text-[11px] border-none cursor-pointer transition-colors"
        style={{ backgroundColor: "var(--fm-hover)", color: "#1764d6" }}>
        <span>View all activity</span><ArrowRight size={17} />
      </button>
    </section>
  );
}

/* ── History Pengerjaan ────────────────────────────────────────── */
function HistoryPengerjaan({ loading: parentLoading }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const CAT_STYLE = { ujian: "bg-[#eee7ff] text-[#7b51d6]", survey: "bg-[#eaf2ff] text-[#246de0]", survei: "bg-[#eaf2ff] text-[#246de0]", default: "bg-[#e6f9ed] text-[#25af67]" };

  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
      setHistory(local);
    } catch { setHistory([]); }
  }, []);

  return (
    <section className="border border-[#e0eaf6] rounded-xl shadow-[0_8px_25px_rgba(35,83,145,0.08)] p-6 transition-colors"
      style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="m-0 text-[16px] font-bold" style={{ color: "var(--fm-text)" }}>History Pengerjaan</h3>
        <button onClick={() => navigate("/history")} className="bg-transparent border-none text-[13px] font-semibold cursor-pointer hover:underline transition-opacity hover:opacity-70" style={{ color: "var(--fm-text-2)" }}>View all</button>
      </div>
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--fm-border)" }}>
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
            <article key={i} onClick={() => navigate(`/fill/${form.slug ?? form.form_slug}`)}
              className="group flex items-center gap-3 py-[13px] px-3 -mx-3 rounded-xl cursor-pointer transition-all first:pt-0 last:pb-0"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--fm-hover)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <div className={`w-[40px] h-[40px] flex items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-105 ${style}`}>
                <FileText size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate transition-colors" style={{ color: "var(--fm-text)" }}>{form.title ?? form.form_title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px]" style={{ color: "var(--fm-text-3)" }}>{cat}</span>
                  <span className="text-[11px]" style={{ color: "var(--fm-text-3)" }}>·</span>
                  <span className="text-[11px]" style={{ color: "var(--fm-text-3)" }}>{timeAgo(form.submitted_at)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className="text-[12px] font-bold" style={{ color: "var(--fm-text)" }}>{timeAgo(form.submitted_at)}</span>
                <span className="text-[10px]" style={{ color: "var(--fm-text-3)" }}>terakhir dikerjakan</span>
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
  const { dark }  = useTheme();
  return (
    <section className="relative flex items-center min-h-[315px] px-[38px] py-[35px] border border-[#e0eaf6] rounded-xl overflow-hidden shadow-[0_8px_25px_rgba(35,83,145,0.08)]"
      style={{ background: dark
        ? "radial-gradient(circle at 82% 45%,rgba(26,79,160,0.18),transparent 35%),linear-gradient(135deg,#1a2235,#1e2d45)"
        : "radial-gradient(circle at 82% 45%,rgba(93,174,255,0.14),transparent 35%),linear-gradient(135deg,#ffffff,#f0f7ff)",
        borderColor: dark ? "#2a3a54" : "#e0eaf6"
      }}>
      <div className="relative z-10">
        <span className="text-[10px] font-bold tracking-[1px] text-[#3d8ad1] uppercase">FORM MANAGEMENT</span>
        <h2 className="mt-3 mb-4 text-[26px] font-bold leading-[1.22]"
          style={{ color: dark ? "#e2eaf8" : "#103b86" }}>Kelola Semua Form<br />Dalam Satu Tempat</h2>
        <p className="m-0 text-[13px] leading-relaxed"
          style={{ color: dark ? "#8fa8cc" : "#7088a8" }}>Pantau respons, lihat statistik, dan kelola form<br />dengan praktis dan efisien.</p>
        <button onClick={() => navigate("/my-forms")}
          className="mt-[22px] h-[42px] inline-flex items-center gap-[11px] px-[18px] border rounded-[7px] text-[12px] font-semibold cursor-pointer transition-colors"
          style={{
            backgroundColor: dark ? "#1e2d45" : "#ffffff",
            borderColor: dark ? "#3a5070" : "#1b67dc",
            color: dark ? "#7ab3ef" : "#155dc4",
          }}>
          Go to My Form <ArrowRight size={18} />
        </button>
      </div>
      <div className="absolute right-[30px] top-[28px] w-[44%] h-[260px]">
        <div className="absolute right-[30px] top-[15px] w-[250px] h-[215px] rounded-xl shadow-[0_18px_30px_rgba(31,89,151,0.14)] overflow-hidden rotate-[2deg]"
          style={{ backgroundColor: dark ? "#1e2a40" : "#ffffff" }}>
          <div className="h-[27px] flex items-center gap-[5px] px-[11px] bg-[#1b63cc]">
            {[0,1,2].map(i => <span key={i} className="w-[7px] h-[7px] rounded-full bg-white/70" />)}
          </div>
          <div className="relative h-[calc(100%-27px)] p-[17px]">
            <div className="w-[76px] h-[76px] rounded-full relative" style={{ background: "conic-gradient(#2772dc 0 62%,#6db8ee 62% 82%,#c9e5fb 82% 100%)" }}>
              <div className="w-[34px] h-[34px] absolute top-[21px] left-[21px] rounded-full"
                style={{ backgroundColor: dark ? "#1e2a40" : "#ffffff" }} />
            </div>
            <div className="absolute left-[110px] top-[18px] w-[90px] space-y-[9px]">
              {["85%","65%","75%","45%"].map((w,i) => <span key={i} className="block h-1.5 rounded bg-[#e1ebf7]" style={{width:w}} />)}
            </div>
            <div className="absolute left-5 right-5 bottom-4 h-[60px] flex items-end gap-[9px]">
              {[35,60,45,80,68].map((h,i) => <span key={i} className="flex-1 block rounded-t bg-[#78b5ef]" style={{height:`${h}%`}} />)}
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-[23px] w-[130px] p-3 rounded-[9px] shadow-[0_10px_25px_rgba(35,83,145,0.14)]"
          style={{ backgroundColor: dark ? "#1e2a40" : "#ffffff" }}>
          <span className="block text-[8px]" style={{ color: dark ? "#6b85a8" : "#879bb5" }}>Total Forms</span>
          <strong className="block mt-1 text-[18px]" style={{ color: dark ? "#e2eaf8" : "#173b78" }}>{totalForms}</strong>
          <small className="text-[#2eb56e] text-[9px]">↗ aktif</small>
        </div>
      </div>
    </section>
  );
}

/* ── MyFormsRow — horizontal scroll form milik sendiri ─────────── */
function MyFormsRow({ forms, loading }) {
  const navigate = useNavigate();
  const CARD_COLORS = [
    { from: "#dbeafe", to: "#bfdbfe" },
    { from: "#ede9fe", to: "#ddd6fe" },
    { from: "#d1fae5", to: "#a7f3d0" },
    { from: "#fef3c7", to: "#fde68a" },
    { from: "#ffe4e6", to: "#fecdd3" },
    { from: "#e0f2fe", to: "#bae6fd" },
  ];
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold" style={{ color: "var(--fm-text)" }}>Form Saya</h2>
        <button onClick={() => navigate("/my-forms")}
          className="text-[12px] font-semibold hover:underline"
          style={{ color: "#1764d6", background: "none", border: "none", cursor: "pointer" }}>
          Lihat semua →
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Tombol buat form baru */}
        <button
          onClick={() => navigate("/my-forms")}
          className="flex-shrink-0 w-[160px] h-[120px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-[#1a4fa0] hover:bg-[#f0f6fe]"
          style={{ borderColor: "var(--fm-border)", backgroundColor: "var(--fm-card)" }}
        >
          <div className="w-10 h-10 rounded-full bg-[#eef5fb] flex items-center justify-center text-[#1a4fa0] text-[22px] font-bold">+</div>
          <span className="text-[12px] font-semibold" style={{ color: "#1a4fa0" }}>Buat Form</span>
        </button>

        {loading && [...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[160px] h-[120px] rounded-2xl animate-pulse" style={{ backgroundColor: "var(--fm-card)" }} />
        ))}

        {!loading && forms.slice(0, 8).map((form, i) => {
          const title  = form.title ?? form.form_title ?? "Untitled";
          const banner = form.banner ?? form.form_banner;
          const status = form.status ?? "private";
          const cat    = form.category ?? form.sub_kategori ?? "";
          const clr    = CARD_COLORS[i % CARD_COLORS.length];
          return (
            <div key={form.id ?? i}
              onClick={() => navigate(`/form/${form.slug ?? form.form_slug}`)}
              className="flex-shrink-0 w-[160px] rounded-2xl overflow-hidden border cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col"
              style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}
            >
              <div className="h-[72px] relative overflow-hidden"
                style={{ background: `linear-gradient(135deg,${clr.from},${clr.to})` }}>
                {banner && (
                  <img src={`${FORM_API_URL}${banner}`} alt={title}
                    className="w-full h-full object-contain"
                    onError={e => { e.target.style.display = "none"; }} />
                )}
                <span className={`absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                  status === "public" ? "bg-green-500/90 text-white" : "bg-black/20 text-white/80"
                }`}>{status === "public" ? "Publik" : "Draft"}</span>
              </div>
              <div className="p-2.5 flex-1">
                {cat && <span className="text-[8px] font-bold uppercase tracking-wide text-gray-400">{cat}</span>}
                <p className="text-[11px] font-semibold leading-snug line-clamp-2 mt-0.5" style={{ color: "var(--fm-text)" }}>{title}</p>
              </div>
            </div>
          );
        })}

        {!loading && forms.length === 0 && (
          <div className="flex-1 py-8 text-center">
            <p className="text-[12px]" style={{ color: "var(--fm-text-2)" }}>Belum ada form. Buat form pertamamu!</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const username = getUsername();
  const [myForms, setMyForms]   = useState([]);
  const [myLoading, setMyLoading] = useState(true);

  useEffect(() => { loadMyForms(); }, []);

  async function loadMyForms() {
    setMyLoading(true);
    try {
      const res  = await api.get("/form/user");
      setMyForms((res.data?.data?.forms ?? []).map(flattenForm));
    } catch { setMyForms([]); }
    finally { setMyLoading(false); }
  }
  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 sm:px-6 md:px-8 xl:px-11 py-16 md:py-9 pb-24 md:pb-16"
          style={{ background: "linear-gradient(135deg, var(--fm-bg) 0%, var(--fm-bg-2) 55%, var(--fm-bg-3) 100%)", minHeight: "100%" }}>
          <header className="flex items-start justify-between mb-6 gap-3">
            <div className="min-w-0">
              <h1 className="m-0 text-[22px] sm:text-[28px] font-bold text-[#102f68] leading-tight">Hi, {username}! 👋</h1>
              <p className="mt-1 text-[13px] text-[#8195b2] hidden sm:block">Kelola form, pantau respons, dan berbagi dengan mudah.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-9 h-9 flex items-center justify-center text-[#143b75] bg-transparent border-none cursor-pointer"><Bell size={18} /></button>
              <div className="w-9 h-9 rounded-full bg-[#1458d1] text-white text-[13px] font-bold flex items-center justify-center">{username[0]?.toUpperCase()}</div>
            </div>
          </header>

          <MyFormsRow forms={myForms} loading={myLoading} />

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
