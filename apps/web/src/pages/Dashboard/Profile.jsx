import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { Bell, Camera, ChevronRight, LogOut, Shield, FileText, BarChart2, Eye, Calendar } from "lucide-react";
import { authAPI } from "../../utils/api";

const TABS = ["Profil", "Keamanan", "Notifikasi", "Integrasi"];

function getUser() {
  try { const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1])); return p.username || p.name || "User"; }
  catch { return "User"; }
}

export default function Profile() {
  const navigate = useNavigate();
  const username = getUser();
  const initials = username.slice(0, 2).toUpperCase();

  const [tab, setTab]         = useState("Profil");
  const [fullName, setFullName] = useState(username);
  const [uname, setUname]     = useState(username);
  const [bio, setBio]         = useState("Membuat form, mengumpulkan respons, dan berbagi ide.");
  const [lang, setLang]       = useState("Bahasa Indonesia");
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState("");

  const [oldPw, setOldPw]     = useState("");
  const [newPw, setNewPw]     = useState("");
  const [confPw, setConfPw]   = useState("");
  const [pwErr, setPwErr]     = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  function logout() { localStorage.removeItem("token"); navigate("/login"); }
  function showToast(m) { setToast(m); setTimeout(() => setToast(""), 3000); }

  async function saveProfile() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setSaving(false); showToast("Profil berhasil disimpan!");
  }

  async function changePw() {
    setPwErr("");
    if (!oldPw || !newPw || !confPw) { setPwErr("Semua field wajib diisi."); return; }
    if (newPw !== confPw)            { setPwErr("Password baru tidak cocok."); return; }
    if (newPw.length < 6)            { setPwErr("Minimal 6 karakter."); return; }
    setPwSaving(true);
    try {
      await authAPI.resetPassword(username, newPw);
      setOldPw(""); setNewPw(""); setConfPw("");
      showToast("Password berhasil diubah!");
    } catch (e) { setPwErr(e.response?.data?.message || "Gagal mengubah password."); }
    finally { setPwSaving(false); }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6FA]">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pt-[52px] md:pt-0 pb-16 md:pb-0">

        {/* ── Header ─────────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 pt-6 pb-0 bg-[#F5F6FA]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Akun saya</p>
              <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight tracking-tight mt-0.5">Profil Saya</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 shadow-sm transition"><Bell size={14} /></button>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>{initials}</div>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-px border-b border-gray-200">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 whitespace-nowrap transition ${tab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────── */}
        <div className="flex-1 px-6 md:px-8 xl:px-10 py-6">

          {/* PROFIL */}
          {tab === "Profil" && (
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Main form */}
              <div className="flex-1 min-w-0 max-w-xl">
                <div className="bg-white rounded-xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <h2 className="text-[14px] font-bold text-gray-700 mb-4">Informasi Profil</h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                        style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>{initials}</div>
                      <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
                        <Camera size={11} />
                      </button>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-gray-800">{fullName}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">@{uname}</p>
                      <button className="mt-1.5 text-[12px] text-[#1a4fa0] font-medium hover:underline">Ganti foto</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <PField label="Nama Lengkap">
                      <input value={fullName} onChange={e => setFullName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-white" />
                    </PField>
                    <PField label="Username">
                      <input value={uname} onChange={e => setUname(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-white" />
                      <p className="text-[11px] text-gray-400 mt-1">Username digunakan untuk identifikasi.</p>
                    </PField>
                    <PField label="Bio">
                      <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 160))} rows={3} resize="none"
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-white" />
                      <p className="text-[11px] text-gray-400 text-right">{bio.length}/160</p>
                    </PField>
                    <PField label="Bahasa">
                      <select value={lang} onChange={e => setLang(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13.5px] bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition">
                        <option>Bahasa Indonesia</option><option>English</option>
                      </select>
                    </PField>

                    <button onClick={saveProfile} disabled={saving}
                      className="px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
                      style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>
                      {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="w-full xl:w-60 shrink-0 space-y-4">
                {/* Summary */}
                <div className="bg-white rounded-xl border border-gray-100 p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <h3 className="text-[13px] font-bold text-gray-700 mb-3">Rangkuman Akun</h3>
                  <div className="space-y-2.5">
                    {[
                      { Icon: FileText,  label: "Total Form",     val: "—", c: "text-blue-400",  bg: "bg-blue-50" },
                      { Icon: BarChart2, label: "Total Responses", val: "—", c: "text-violet-400", bg: "bg-violet-50" },
                      { Icon: Eye,       label: "Total Views",     val: "—", c: "text-emerald-400", bg: "bg-emerald-50" },
                      { Icon: Calendar,  label: "Bergabung Sejak", val: "—", c: "text-amber-400",  bg: "bg-amber-50" },
                    ].map(({ Icon, label, val, c, bg }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                          <Icon size={13} className={c} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-gray-700 truncate">{label}</p>
                          <p className="text-[11px] text-gray-400">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-xl border border-gray-100 p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <h3 className="text-[13px] font-bold text-gray-700 mb-2">Aksi Cepat</h3>
                  <div className="space-y-0.5">
                    {[
                      { emoji: "🔑", label: "Ganti Password", onClick: () => setTab("Keamanan") },
                      { emoji: "📥", label: "Unduh Data Saya" },
                      { emoji: "📋", label: "Log Aktivitas" },
                    ].map(({ emoji, label, onClick }) => (
                      <button key={label} onClick={onClick}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition group">
                        <span className="text-base">{emoji}</span>
                        <span className="flex-1 text-left">{label}</span>
                        <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-400 transition" />
                      </button>
                    ))}
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={logout}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 transition">
                      <LogOut size={14} />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KEAMANAN */}
          {tab === "Keamanan" && (
            <div className="max-w-md">
              <div className="bg-white rounded-xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Shield size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-gray-800">Keamanan Akun</h2>
                    <p className="text-[12px] text-gray-400">Ubah password akunmu</p>
                  </div>
                </div>

                {pwErr && <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px]">{pwErr}</div>}

                <div className="space-y-4">
                  <PField label="Password Saat Ini">
                    <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="••••••••"
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                  </PField>
                  <PField label="Password Baru">
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••"
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                  </PField>
                  <PField label="Konfirmasi Password Baru">
                    <input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} placeholder="••••••••"
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                  </PField>
                  <button onClick={changePw} disabled={pwSaving}
                    className="px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
                    style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>
                    {pwSaving ? "Menyimpan..." : "Ganti Password"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(tab === "Notifikasi" || tab === "Integrasi") && (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mb-4">🚧</div>
              <p className="font-semibold text-gray-700">Segera Hadir</p>
              <p className="text-[13px] text-gray-400 mt-1">Fitur ini sedang dalam pengembangan.</p>
            </div>
          )}
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

function PField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
