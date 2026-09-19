import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, CheckCircle2, Clock, RefreshCw, RotateCcw, Wifi, WifiOff, Activity } from "lucide-react";
import api, { FORM_API_URL, monitoringAPI } from "../../utils/api";
import { socket } from "../../utils/socket";
import AlertModal from "../../components/AlertModal";
import { useTheme } from "../../context/ThemeContext";

// ── Helpers ──────────────────────────────────────────────────
function formatDuration(startAt) {
  if (!startAt) return "—";
  const diff = Math.floor((Date.now() - new Date(startAt).getTime()) / 1000);
  if (diff < 0 || diff > 86400) return "—"; // skip kalau tidak masuk akal
  if (diff < 60) return `${diff}d`;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  if (m < 60) return `${m}m ${s}d`;
  const h = Math.floor(m / 60);
  return `${h}j ${m % 60}m`;
}

function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StatusBadge({ status }) {
  const map = {
    progress:  { label: "Sedang mengerjakan", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    completed: { label: "Selesai",             cls: "bg-green-100  text-green-700  border-green-200"  },
    submitted: { label: "Selesai",             cls: "bg-green-100  text-green-700  border-green-200"  },
    reset:     { label: "Direset",             cls: "bg-gray-100   text-gray-500   border-gray-200"   },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {status === "progress" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />}
      {(status === "completed" || status === "submitted") && <CheckCircle2 size={10} />}
      {label}
    </span>
  );
}

function ProgressBar({ current, total, color = "#1a4fa0" }) {
  if (!total || total === 0) return <span className="text-[12px] text-gray-400">—</span>;
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>
        {current}/{total}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function Monitoring() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { dark }    = useTheme();

  const [form,        setForm]        = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connected,   setConnected]   = useState(false);
  const [alert,       setAlert]       = useState({ open: false });
  const pollingRef = useRef(null);

  // ── Fetch data dari API ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await monitoringAPI.getMonitoring(slug);
      const list = res.data?.status ?? [];
      setParticipants(list);
      setLastUpdated(new Date());
    } catch (e) {
      // silent — tetap tampilkan data terakhir
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // ── Load info form ──────────────────────────────────────────
  useEffect(() => {
    api.get("/form/slug", { params: { slug } })
      .then(res => {
        const raw = res.data?.data;
        setForm(raw?.form ?? raw);
      })
      .catch(() => {});
  }, [slug]);

  // ── Polling setiap 5 detik + initial fetch ──────────────────
  useEffect(() => {
    fetchData();
    pollingRef.current = setInterval(fetchData, 5000);
    return () => clearInterval(pollingRef.current);
  }, [fetchData]);

  // ── Socket: terima progressUpdated secara real-time ─────────
  useEffect(() => {
    if (!slug) return;

    // Connect jika belum
    if (!socket.connected) socket.connect();

    // Join room monitoring segera, dan lagi setelah connect (jika sedang connecting)
    const joinRoom = () => {
      socket.emit("joinMonitoring", { slug });
      setConnected(true);
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", joinRoom);
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    const handleProgress = (data) => {
      if (data?.slug !== slug) return;
      setParticipants(prev => {
        const idx = prev.findIndex(p => p.user_id === data.user_id);
        const updated = {
          user_id:       data.user_id,
          user_username: data.user_username,
          status:        data.status ?? "progress",
          start_at:      data.start_at,
          submitted_at:  null,
          current_page:  data.current_page,
          current_soal:  data.current_soal,
          total_pages:   data.total_pages,
          total_soal:    data.total_soal,
          attemps:       1,
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...prev[idx], ...updated };
          return next;
        }
        return [updated, ...prev];
      });
      setLastUpdated(new Date());
    };

    // Saat ada responden submit (completed) — refresh data
    const handleFormUpdated = () => fetchData();

    socket.on("progressUpdated", handleProgress);
    socket.on("formUpdated", handleFormUpdated);

    setConnected(socket.connected);

    return () => {
      socket.emit("leaveMonitoring", { slug });
      socket.off("progressUpdated", handleProgress);
      socket.off("formUpdated", handleFormUpdated);
      socket.off("connect", joinRoom);
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [slug, fetchData]);

  // ── Reset peserta ───────────────────────────────────────────
  async function handleReset(user) {
    setAlert({
      open: true,
      type: "confirm",
      title: "Reset Peserta?",
      message: `Reset akan menghapus progress "${user.user_username}" dan memungkinkan mereka mengerjakan ulang.`,
      onConfirm: async () => {
        setAlert({ open: false });
        try {
          await monitoringAPI.resetUser(slug, user.user_id);
          fetchData();
        } catch (e) {
          setAlert({
            open: true,
            type: "error",
            title: "Gagal Reset",
            message: e?.response?.data?.message ?? "Terjadi kesalahan.",
            onConfirm: () => setAlert({ open: false }),
          });
        }
      },
    });
  }

  // ── Statistik ───────────────────────────────────────────────
  const totalPeserta   = participants.length;
  const sedangKerjakan = participants.filter(p => p.status === "progress").length;
  const sudahSelesai   = participants.filter(p => p.status === "completed").length;
  const formTitle      = form?.title ?? form?.form_title ?? slug;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{ backgroundColor: "var(--fm-bg)", color: "var(--fm-text)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between gap-4"
        style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/form/${slug}`)}
            className="flex items-center gap-1.5 text-[13px] font-semibold hover:underline transition-colors"
            style={{ color: "#1a4fa0" }}
          >
            <ArrowLeft size={15} /> Kembali ke Editor
          </button>
          <span style={{ color: "var(--fm-text-3)" }}>|</span>
          <div className="flex items-center gap-2">
            <Activity size={16} style={{ color: "#1a4fa0" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--fm-text)" }}>
              Monitoring
            </span>
            {formTitle && (
              <span className="text-[13px]" style={{ color: "var(--fm-text-2)" }}>
                — {formTitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status koneksi */}
          <div className={`flex items-center gap-1.5 text-[12px] font-medium ${connected ? "text-green-600" : "text-gray-400"}`}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? "Live" : "Offline"}
          </div>

          {/* Waktu update terakhir */}
          {lastUpdated && (
            <span className="text-[11px]" style={{ color: "var(--fm-text-3)" }}>
              Update: {lastUpdated.toLocaleTimeString("id-ID")}
            </span>
          )}

          {/* Refresh manual */}
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: "var(--fm-card-border)", color: "var(--fm-text-2)", backgroundColor: "var(--fm-hover)" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { Icon: Users,        color: "#1a4fa0", bg: dark ? "#1a2540" : "#eef5fb", label: "Total Peserta",      value: totalPeserta },
            { Icon: Activity,     color: "#f59e0b", bg: dark ? "#2a1f0a" : "#fffbeb", label: "Sedang Mengerjakan", value: sedangKerjakan },
            { Icon: CheckCircle2, color: "#10b981", bg: dark ? "#0a2418" : "#ecfdf5", label: "Sudah Selesai",      value: sudahSelesai },
          ].map(({ Icon, color, bg, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border p-5 flex items-center gap-4 transition-colors"
              style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-[11px] font-medium mb-0.5" style={{ color: "var(--fm-text-2)" }}>{label}</p>
                <p className="text-[26px] font-extrabold leading-none" style={{ color: "var(--fm-text)" }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabel peserta */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "var(--fm-card-border)" }}
          >
            <h3 className="text-[14px] font-bold" style={{ color: "var(--fm-text)" }}>Daftar Peserta</h3>
            {sedangKerjakan > 0 && (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-yellow-600">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                {sedangKerjakan} sedang aktif
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-8 h-8 border-[3px] border-[#dce8f7] border-t-[#1a4fa0] rounded-full animate-spin" />
              <span className="text-[12px]" style={{ color: "var(--fm-text-2)" }}>Memuat data...</span>
            </div>
          )}

          {/* Empty */}
          {!loading && participants.length === 0 && (
            <div className="py-16 text-center">
              <Users size={36} className="mx-auto mb-3" style={{ color: "var(--fm-text-3)" }} />
              <p className="text-[14px] font-semibold" style={{ color: "var(--fm-text)" }}>Belum ada peserta</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--fm-text-2)" }}>
                Peserta akan muncul di sini saat mereka mulai mengerjakan form.
              </p>
            </div>
          )}

          {/* Tabel */}
          {!loading && participants.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr
                    className="text-left text-[11px] font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: "var(--fm-hover)", color: "var(--fm-text-2)", borderBottom: "1px solid var(--fm-card-border)" }}
                  >
                    <th className="px-5 py-3 font-semibold">Peserta</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Halaman</th>
                    <th className="px-4 py-3 font-semibold">Mulai</th>
                    <th className="px-4 py-3 font-semibold">Durasi</th>
                    <th className="px-4 py-3 font-semibold">Percobaan</th>
                    <th className="px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, idx) => {
                    const isActive = p.status === "progress";
                    return (
                      <tr
                        key={p.user_id ?? idx}
                        className="transition-colors"
                        style={{
                          borderBottom: "1px solid var(--fm-card-border)",
                          backgroundColor: isActive
                            ? (dark ? "rgba(245,158,11,0.06)" : "rgba(254,252,232,0.7)")
                            : "transparent",
                        }}
                      >
                        {/* Peserta */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                              style={{
                                backgroundColor: isActive ? "#fef3c7" : "var(--fm-hover)",
                                color: isActive ? "#d97706" : "var(--fm-text-2)",
                              }}
                            >
                              {(p.user_username ?? "?")[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold" style={{ color: "var(--fm-text)" }}>
                              {p.user_username ?? `User #${p.user_id}`}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={p.status} />
                        </td>

                        {/* Progres halaman */}
                        <td className="px-4 py-3.5">
                          {p.status === "completed" ? (
                            <span className="text-[12px] font-semibold text-green-600">Selesai ✓</span>
                          ) : (
                            <ProgressBar
                              current={p.current_page ?? 1}
                              total={p.total_pages ?? null}
                              color={isActive ? "#f59e0b" : "#1a4fa0"}
                            />
                          )}
                        </td>

                        {/* Mulai */}
                        <td className="px-4 py-3.5 tabular-nums" style={{ color: "var(--fm-text-2)" }}>
                          {formatTime(p.submitted_at)}
                        </td>

                        {/* Durasi */}
                        <td className="px-4 py-3.5 tabular-nums" style={{ color: "var(--fm-text-2)" }}>
                          {p.status === "completed" || p.status === "submitted"
                            ? <span className="text-green-600 font-medium">Selesai</span>
                            : <span className="text-yellow-600 font-medium">{formatDuration(p.submitted_at)}</span>
                          }
                        </td>

                        {/* Percobaan */}
                        <td className="px-4 py-3.5 text-center" style={{ color: "var(--fm-text-2)" }}>
                          {p.attemps ?? 1}
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5">
                          {p.status === "progress" && (
                            <button
                              onClick={() => handleReset(p)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all hover:opacity-80"
                              style={{ borderColor: "#fca5a5", color: "#dc2626", backgroundColor: dark ? "rgba(220,38,38,0.08)" : "#fef2f2" }}
                              title="Reset peserta — izinkan mengerjakan ulang"
                            >
                              <RotateCcw size={12} /> Reset
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* AlertModal */}
      <AlertModal
        open={alert.open}
        type={alert.type ?? "confirm"}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm ?? (() => setAlert({ open: false }))}
        onCancel={() => setAlert({ open: false })}
      />
    </div>
  );
}
