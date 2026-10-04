import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, FileText, Shield, LogOut, RefreshCw,
  UserPlus, Trash2, Settings, LayoutDashboard,
  ToggleLeft, ToggleRight, ChevronRight, Sun, Moon
} from "lucide-react";
import { USER_API_URL } from "../../utils/api";
import AlertModal from "../../components/AlertModal";
import { useTheme } from "../../context/ThemeContext";

/* ── helpers ─────────────────────────────────────────────────── */
function getAdminToken() { return localStorage.getItem("admin_token") ?? ""; }
function adminHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getAdminToken()}` };
}
function getAdminUsername() {
  try { return JSON.parse(atob(getAdminToken().split(".")[1])).username ?? "Admin"; }
  catch { return "Admin"; }
}

/* ── Toggle Switch ───────────────────────────────────────────── */
function ToggleSwitch({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="relative w-12 h-6 rounded-full transition-all duration-300"
      style={{
        backgroundColor: value ? "#1a4fa0" : "var(--fm-card-border)",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4 transition-all hover:shadow-md"
      style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--fm-text-3)" }}>{label}</p>
        <p className="text-[26px] font-extrabold leading-none" style={{ color }}>{value}</p>
        {sub && <p className="text-[11px] mt-1" style={{ color: "var(--fm-text-3)" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function Admin() {
  const navigate        = useNavigate();
  const { dark, toggle } = useTheme();

  const [tab, setTab]             = useState("dashboard");
  const [users, setUsers]         = useState([]);
  const [settings, setSettings]   = useState({ allow_registration: true, allow_login: true });
  const [loading, setLoading]     = useState(true);
  const [settingLoading, setSettingLoading] = useState(false);
  const [toast, setToast]         = useState({ show: false, msg: "", type: "success" });
  const [alert, setAlert]         = useState({ open: false });
  const [newAdmin, setNewAdmin]   = useState({ username: "", password: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);

  const adminUsername = getAdminUsername();

  useEffect(() => {
    if (!getAdminToken()) { navigate("/admin/login"); return; }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        fetch(`${USER_API_URL}/admin/get-user`,  { headers: adminHeaders() }),
        fetch(`${USER_API_URL}/admin/setting`,   { headers: adminHeaders() }),
      ]);
      if (uRes.status === 401 || uRes.status === 403) { navigate("/admin/login"); return; }
      const uData = await uRes.json().catch(() => ({}));
      const sData = await sRes.json().catch(() => ({}));
      setUsers(uData?.data ?? uData?.users ?? []);
      setSettings({
        allow_registration: sData?.data?.allow_registration ?? sData?.allow_registration ?? true,
        allow_login:        sData?.data?.allow_login        ?? sData?.allow_login        ?? true,
      });
    } catch { showToast("Gagal memuat data.", "error"); }
    finally { setLoading(false); }
  }

  async function updateSetting(config, action) {
    setSettingLoading(true);
    try {
      const res = await fetch(`${USER_API_URL}/admin/setting`, {
        method: "PUT",
        headers: adminHeaders(),
        body: JSON.stringify({ config, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSettings(prev => ({ ...prev, [config]: action }));
        showToast(`Setting berhasil diubah.`);
      } else {
        showToast(data?.message || "Gagal mengubah setting.", "error");
      }
    } catch { showToast("Gagal mengubah setting.", "error"); }
    finally { setSettingLoading(false); }
  }

  function confirmDeleteUser(user) {
    setAlert({
      open: true, type: "trash",
      title: "Hapus Pengguna?",
      message: `Akun "${user.username}" akan dihapus permanen dan tidak bisa dikembalikan.`,
      onConfirm: async () => {
        setAlert({ open: false });
        try {
          const res = await fetch(`${USER_API_URL}/admin/delete-user/${user.id}`, {
            method: "DELETE", headers: adminHeaders(),
          });
          if (res.ok) {
            setUsers(prev => prev.filter(u => u.id !== user.id));
            showToast("Pengguna berhasil dihapus.");
          } else { showToast("Gagal menghapus pengguna.", "error"); }
        } catch { showToast("Gagal menghapus pengguna.", "error"); }
      },
    });
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    setCreateMsg(null);
    if (!newAdmin.username || !newAdmin.password) {
      setCreateMsg({ ok: false, text: "Username dan password wajib diisi." }); return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(`${USER_API_URL}/admin/create-admin`, {
        method: "POST", headers: adminHeaders(),
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCreateMsg({ ok: true, text: data?.message || "Admin berhasil dibuat." });
        setNewAdmin({ username: "", password: "" });
      } else {
        setCreateMsg({ ok: false, text: data?.message || "Gagal membuat admin." });
      }
    } catch { setCreateMsg({ ok: false, text: "Gagal terhubung ke server." }); }
    finally { setCreateLoading(false); }
  }

  function showToast(msg, type = "success") {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }
  function logout() { localStorage.removeItem("admin_token"); navigate("/admin/login"); }

  const NAV = [
    { id: "dashboard", label: "Dashboard",        Icon: LayoutDashboard },
    { id: "users",     label: "Pengguna",          Icon: Users },
    { id: "settings",  label: "Pengaturan",        Icon: Settings },
    { id: "admin",     label: "Manajemen Admin",   Icon: Shield },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--fm-bg)" }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[230px] xl:w-[250px] shrink-0 flex-col h-screen sticky top-0"
        style={{ background: dark
          ? "linear-gradient(180deg,#0d1117 0%,#111827 50%,#161d2b 100%)"
          : "linear-gradient(180deg,#06245a 0%,#0a438f 50%,#1a6fc7 100%)" }}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-6 pt-7 pb-8 border-b border-white/10">
          <div className="w-9 h-9 bg-white rounded-[9px] flex items-center justify-center text-[#1a4fa0] font-extrabold text-[16px] shrink-0">F</div>
          <div className="min-w-0">
            <p className="text-white font-bold text-[15px] leading-tight">Formatic</p>
            <p className="text-white/50 text-[10px] font-medium mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className="w-full h-[46px] flex items-center gap-3 px-3.5 rounded-xl text-[13.5px] font-medium transition-all text-left"
                style={active
                  ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.6)", background: "transparent" }}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <button onClick={toggle}
            className="w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl transition mb-1"
            style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)" }}
          >
            {/* Track */}
            <div className="relative w-11 h-6 rounded-full shrink-0 transition-all duration-300"
              style={{ background: dark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)" }}>
              {/* Icons inside track */}
              <span className="absolute left-1 top-1/2 -translate-y-1/2 transition-opacity duration-200 text-white"
                style={{ opacity: dark ? 0 : 1 }}><Sun size={11} /></span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-200 text-white"
                style={{ opacity: dark ? 1 : 0 }}><Moon size={11} /></span>
              {/* Thumb */}
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 flex items-center justify-center text-gray-700"
                style={{ left: dark ? "calc(100% - 22px)" : "2px" }}>
                {dark ? <Moon size={10} /> : <Sun size={10} />}
              </span>
            </div>
            <span className="text-[13px] font-medium text-white/80 flex-1 text-left">
              {dark ? "Mode Gelap" : "Mode Terang"}
            </span>
          </button>
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-[12px] shrink-0">
              {adminUsername[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{adminUsername}</p>
              <p className="text-[10px] text-white/50">Super Admin</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[13px] font-medium text-red-300 hover:bg-red-500/10 transition">
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="min-h-screen px-6 md:px-8 xl:px-10 py-8 pb-20"
          style={{ background: "linear-gradient(135deg, var(--fm-bg) 0%, var(--fm-bg-2) 55%, var(--fm-bg-3) 100%)" }}>

          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[24px] font-extrabold tracking-tight" style={{ color: "var(--fm-text)" }}>
                {{ dashboard: "Dashboard", users: "Pengguna", settings: "Pengaturan Sistem", admin: "Manajemen Admin" }[tab]}
              </h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--fm-text-2)" }}>
                Panel kontrol administrator Formatic
              </p>
            </div>
            <button onClick={loadAll}
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition hover:opacity-80"
              style={{ borderColor: "var(--fm-card-border)", backgroundColor: "var(--fm-card)", color: "var(--fm-text-2)" }}
              title="Refresh data">
              <RefreshCw size={15} />
            </button>
          </div>

          {/* ── DASHBOARD ──────────────────────────────────── */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Users}    label="Total Pengguna"  value={loading ? "..." : users.length}
                  color="#1a4fa0" bg="rgba(26,79,160,0.1)"
                  sub={`${users.length} akun terdaftar`} />
                <StatCard icon={Shield}   label="Status Login"    value={settings.allow_login ? "Aktif" : "Ditutup"}
                  color={settings.allow_login ? "#16a34a" : "#dc2626"}
                  bg={settings.allow_login ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)"}
                  sub={settings.allow_login ? "Login diizinkan" : "Login diblokir admin"} />
                <StatCard icon={UserPlus} label="Registrasi"      value={settings.allow_registration ? "Terbuka" : "Ditutup"}
                  color={settings.allow_registration ? "#16a34a" : "#dc2626"}
                  bg={settings.allow_registration ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)"}
                  sub={settings.allow_registration ? "Pendaftaran terbuka" : "Pendaftaran ditutup"} />
              </div>

              {/* User list preview */}
              <div className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
                <div className="px-6 py-4 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--fm-card-border)" }}>
                  <div>
                    <h3 className="text-[15px] font-bold" style={{ color: "var(--fm-text)" }}>Pengguna Terdaftar</h3>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--fm-text-3)" }}>
                      {loading ? "Memuat..." : `${users.length} pengguna total`}
                    </p>
                  </div>
                  <button onClick={() => setTab("users")}
                    className="flex items-center gap-1 text-[12px] font-semibold hover:underline"
                    style={{ color: "#1a4fa0" }}>
                    Lihat semua <ChevronRight size={14} />
                  </button>
                </div>

                {loading ? (
                  <div className="divide-y" style={{ borderColor: "var(--fm-card-border)" }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full animate-pulse shrink-0" style={{ backgroundColor: "var(--fm-hover)" }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-36 rounded animate-pulse" style={{ backgroundColor: "var(--fm-hover)" }} />
                          <div className="h-2.5 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--fm-hover)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="py-14 text-center">
                    <Users size={32} className="mx-auto mb-3" style={{ color: "var(--fm-text-3)" }} />
                    <p className="text-[14px] font-semibold" style={{ color: "var(--fm-text)" }}>Belum ada pengguna</p>
                    <p className="text-[12px] mt-1" style={{ color: "var(--fm-text-2)" }}>
                      Pengguna akan muncul setelah mendaftar.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--fm-card-border)" }}>
                    {users.slice(0, 6).map((u, i) => (
                      <div key={u.id ?? i} className="px-6 py-3.5 flex items-center gap-3 transition-colors"
                        style={{ backgroundColor: "transparent" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--fm-hover)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                          style={{ background: `hsl(${(i * 47 + 200) % 360}, 60%, 45%)` }}>
                          {(u.username ?? "?")[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--fm-text)" }}>{u.username}</p>
                          <p className="text-[11px] truncate" style={{ color: "var(--fm-text-3)" }}>{u.email ?? "—"}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(26,79,160,0.1)", color: "#1a4fa0" }}>
                          User
                        </span>
                      </div>
                    ))}
                    {users.length > 6 && (
                      <div className="px-6 py-3 text-center">
                        <button onClick={() => setTab("users")}
                          className="text-[12px] font-semibold hover:underline" style={{ color: "#1a4fa0" }}>
                          +{users.length - 6} pengguna lainnya →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── USERS ──────────────────────────────────────── */}
          {tab === "users" && (
            <div className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "var(--fm-card-border)" }}>
                <h3 className="text-[15px] font-bold" style={{ color: "var(--fm-text)" }}>
                  Semua Pengguna
                </h3>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--fm-text-3)" }}>
                  {loading ? "Memuat..." : `${users.length} akun terdaftar`}
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-[3px] border-[#dce8f7] border-t-[#1a4fa0] rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="py-20 text-center">
                  <Users size={36} className="mx-auto mb-3" style={{ color: "var(--fm-text-3)" }} />
                  <p className="text-[15px] font-bold" style={{ color: "var(--fm-text)" }}>Belum ada pengguna</p>
                  <p className="text-[13px] mt-1" style={{ color: "var(--fm-text-2)" }}>Pengguna akan muncul di sini setelah mendaftar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: "var(--fm-hover)", color: "var(--fm-text-2)", borderBottom: "1px solid var(--fm-card-border)" }}>
                        <th className="px-6 py-3.5 font-semibold">No</th>
                        <th className="px-4 py-3.5 font-semibold">Pengguna</th>
                        <th className="px-4 py-3.5 font-semibold">Email</th>
                        <th className="px-4 py-3.5 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.id ?? i} className="transition-colors"
                          style={{ borderBottom: "1px solid var(--fm-card-border)", backgroundColor: "transparent" }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--fm-hover)"}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                          <td className="px-6 py-3.5 font-bold tabular-nums" style={{ color: "var(--fm-text-3)" }}>{i + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                                style={{ background: `hsl(${(i * 47 + 200) % 360}, 60%, 45%)` }}>
                                {(u.username ?? "?")[0]?.toUpperCase()}
                              </div>
                              <span className="font-semibold" style={{ color: "var(--fm-text)" }}>{u.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5" style={{ color: "var(--fm-text-2)" }}>{u.email ?? "—"}</td>
                          <td className="px-4 py-3.5 text-right">
                            <button onClick={() => confirmDeleteUser(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition hover:opacity-80"
                              style={{ borderColor: "rgba(220,38,38,0.3)", color: "#dc2626", backgroundColor: "rgba(220,38,38,0.06)" }}>
                              <Trash2 size={12} /> Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ───────────────────────────────────── */}
          {tab === "settings" && (
            <div className="max-w-2xl space-y-4">
              <div className="rounded-2xl border p-5"
                style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
                <p className="text-[13px] mb-4" style={{ color: "var(--fm-text-2)" }}>
                  Kontrol akses platform — matikan sementara jika ada maintenance atau masalah keamanan.
                </p>
                <div className="space-y-3">
                  {[
                    { key: "allow_registration", label: "Registrasi Akun Baru", desc: "Izinkan pengguna baru mendaftar ke platform", Icon: UserPlus, color: "#1a4fa0" },
                    { key: "allow_login",         label: "Login Pengguna",       desc: "Izinkan pengguna yang sudah ada untuk masuk",  Icon: Shield,   color: "#16a34a" },
                  ].map(({ key, label, desc, Icon, color }) => (
                    <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors"
                      style={{ borderColor: "var(--fm-card-border)", backgroundColor: "var(--fm-hover)" }}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}15` }}>
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div>
                          <p className="font-bold text-[14px]" style={{ color: "var(--fm-text)" }}>{label}</p>
                          <p className="text-[12px] mt-0.5" style={{ color: "var(--fm-text-2)" }}>{desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${settings[key] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {settings[key] ? "Aktif" : "Nonaktif"}
                        </span>
                        <ToggleSwitch value={settings[key]} onChange={val => updateSetting(key, val)} disabled={settingLoading} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ADMIN MANAGEMENT ───────────────────────────── */}
          {tab === "admin" && (
            <div className="max-w-md">
              <div className="rounded-2xl border p-6"
                style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(26,79,160,0.1)" }}>
                    <Shield size={18} style={{ color: "#1a4fa0" }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold" style={{ color: "var(--fm-text)" }}>Buat Admin Baru</h3>
                    <p className="text-[12px]" style={{ color: "var(--fm-text-2)" }}>Tambah akun administrator lain</p>
                  </div>
                </div>

                {createMsg && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-[13px] border ${createMsg.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                    {createMsg.text}
                  </div>
                )}

                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  {[
                    { key: "username", label: "Username", placeholder: "Username admin baru", type: "text" },
                    { key: "password", label: "Password", placeholder: "Min. 8 karakter, huruf besar & angka", type: "password" },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--fm-text-3)" }}>
                        {label}
                      </label>
                      <input
                        type={type}
                        value={newAdmin[key]}
                        onChange={e => setNewAdmin(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-xl px-4 py-2.5 text-[14px] outline-none transition"
                        style={{ border: "1px solid var(--fm-card-border)", backgroundColor: "var(--fm-hover)", color: "var(--fm-text)" }}
                        onFocus={e => e.target.style.borderColor = "#1a4fa0"}
                        onBlur={e => e.target.style.borderColor = "var(--fm-card-border)"}
                      />
                    </div>
                  ))}
                  <button type="submit" disabled={createLoading}
                    className="w-full py-3 rounded-xl text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-50 transition mt-2"
                    style={{ background: "linear-gradient(135deg,#0a438f,#1a6fc7)" }}>
                    {createLoading ? "Membuat akun..." : "Buat Admin"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-[13px] px-5 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 transition-all"
          style={{ backgroundColor: toast.type === "error" ? "#dc2626" : "#111827" }}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === "error" ? "bg-red-300" : "bg-green-400"}`} />
          {toast.msg}
        </div>
      )}

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
