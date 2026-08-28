import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { Clock, CheckCircle2, FileText, RefreshCw, Bell, ArrowUpRight, Search } from "lucide-react";

const HISTORY_KEY = "formatic_history";

/* ── helpers ─────────────────────────────────────────────────── */
function getUsername() {
  try {
    const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
    return p.username || p.name || "User";
  } catch { return "User"; }
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s} detik lalu`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

/* Simpan history ke localStorage saat submit form */
export function saveToHistory(formSlug, formTitle, category) {
  const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  const entry = {
    form_slug: formSlug,
    form_title: formTitle,
    category: category ?? "—",
    submitted_at: new Date().toISOString(),
  };
  const filtered = existing.filter(e => e.form_slug !== formSlug);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...filtered].slice(0, 50)));
}

const CAT_STYLE = {
  ujian:   { bg: "bg-[#eee7ff]", text: "text-[#7b51d6]", dot: "bg-[#7b51d6]" },
  survey:  { bg: "bg-[#e9f2ff]", text: "text-[#1768df]", dot: "bg-[#1768df]" },
  default: { bg: "bg-[#e5faee]", text: "text-[#21a964]", dot: "bg-[#21a964]" },
};

/* ── Main ─────────────────────────────────────────────────────── */
export default function History() {
  const navigate  = useNavigate();
  const username  = getUsername();
  const [history, setHistory]   = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef(null);

  useEffect(() => {
    loadHistory();
    // Auto-refresh setiap 30 detik (realtime polling)
    intervalRef.current = setInterval(() => {
      loadHistory(false);
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  function loadHistory(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const local = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
      setHistory(local);
    } catch {
      setHistory([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  function refresh() {
    loadHistory();
    setLastUpdate(new Date());
  }

  // Group history by date
  const filtered = history.filter(h =>
    (h.form_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    const date = formatDate(item.submitted_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F5F6FA" }}>

      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pt-[52px] md:pt-0 pb-16 md:pb-0">

        {/* ── Header ─────────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 pt-7 pb-5 flex items-center justify-between gap-4 bg-white border-b border-gray-100">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Riwayat</p>
            <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight tracking-tight mt-0.5">History Pengerjaan</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Last updated */}
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400">
              <Clock size={11} /> Update: {formatTime(lastUpdate.toISOString())}
            </span>
            <button onClick={refresh}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
              <RefreshCw size={14} />
            </button>
            <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition">
              <Bell size={14} />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#1a4fa0,#1e6fc7)" }}>
              {username[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Search ─────────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 py-4 bg-white border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari form yang pernah dikerjakan..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 py-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: <CheckCircle2 size={18} className="text-green-500" />, label: "Total Dikerjakan", value: history.length, bg: "bg-green-50" },
            { icon: <Clock size={18} className="text-blue-500" />,         label: "Hari Ini",         value: history.filter(h => new Date(h.submitted_at).toDateString() === new Date().toDateString()).length, bg: "bg-blue-50" },
            { icon: <FileText size={18} className="text-violet-500" />,    label: "Minggu Ini",       value: history.filter(h => Date.now() - new Date(h.submitted_at) < 7 * 86400000).length, bg: "bg-violet-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
                <p className="text-[20px] font-extrabold text-gray-800 leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Timeline ───────────────────────────────── */}
        <div className="flex-1 px-6 md:px-8 xl:px-10 pb-8">
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mb-4">📋</div>
              <p className="font-semibold text-gray-700">Belum ada history</p>
              <p className="text-[13px] text-gray-400 mt-1">Form yang kamu kerjakan akan muncul di sini.</p>
              <button onClick={() => navigate("/")}
                className="mt-5 px-5 py-2 rounded-xl text-white text-[13px] font-semibold"
                style={{ background: "linear-gradient(135deg,#1a4fa0,#1e6fc7)" }}>
                Cari Form
              </button>
            </div>
          )}

          {!loading && Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-6">
              {/* Date label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{date}</span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-400">{items.length} form</span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {items.map((item, i) => {
                  const cat   = item.category ?? "default";
                  const style = CAT_STYLE[cat] ?? CAT_STYLE.default;
                  return (
                    <div key={i}
                      className="bg-white rounded-xl border border-gray-100 flex items-center gap-3 px-4 py-3.5 hover:border-gray-200 hover:shadow-sm transition group cursor-pointer"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                      onClick={() => navigate(`/fill/${item.form_slug}`)}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                        <FileText size={16} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-gray-800 truncate group-hover:text-[#1a4fa0] transition-colors">
                          {item.form_title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {cat}
                          </span>
                          <span className="text-gray-300 text-[10px]">·</span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {formatTime(item.submitted_at)}
                          </span>
                          <span className="text-gray-300 text-[10px]">·</span>
                          <span className="text-[11px] text-gray-400">{timeAgo(item.submitted_at)}</span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[11px] font-semibold">
                          <CheckCircle2 size={11} /> Selesai
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/fill/${item.form_slug}`); }}
                          className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#1a4fa0] hover:text-white transition opacity-0 group-hover:opacity-100">
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
