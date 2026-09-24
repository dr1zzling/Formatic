import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Camera, Bell, Shield } from "lucide-react";
import { authAPI } from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";

const TABS = ["Profil", "Keamanan"];

function getUser() {
  try { const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1])); return p.username || p.name || "User"; }
  catch { return "User"; }
}

export default function Profile() {
  const navigate  = useNavigate();
  const { dark }  = useTheme();
  const username  = getUser();
  const initials  = username.slice(0, 2).toUpperCase();

  const [tab, setTab]           = useState("Profil");
  const [fullName, setFullName] = useState(username);
  const [uname, setUname]       = useState(username);
  const [bio, setBio]           = useState("Membuat form, mengumpulkan respons, dan berbagi ide.");
  const [lang, setLang]         = useState("Bahasa Indonesia");  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState("");

  const [oldPw, setOldPw]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confPw, setConfPw]     = useState("");
  const [pwErr, setPwErr]       = useState("");
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

  const inputCls = "w-full rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none transition";
  const inputStyle = {
    backgroundColor: "var(--fm-input-bg, var(--fm-hover))",
    border: "1px solid var(--fm-card-border)",
    color: "var(--fm-text)",
  };
  const inputFocusStyle = { borderColor: "#1a4fa0" };

  return (
    <div className="flex min-h-screen transition-colors" style={{ backgroundColor: "var(--fm-bg)" }}>

      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pt-[52px] md:pt-0 pb-16 md:pb-0">

        {/* ── Header ─────────────────────────────────── */}
        <div className="px-6 md:px-8 xl:px-10 pt-6 pb-0 transition-colors" style={{ backgroundColor: "var(--fm-bg)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--fm-text-3)" }}>Akun saya</p>
              <h1 className="text-[22px] font-extrabold leading-tight tracking-tight mt-0.5" style={{ color: "var(--fm-text)" }}>Profil Saya</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition hover:opacity-80"
                style={{ backgroundColor: "var(--fm-card)", border: "1px solid var(--fm-card-border)", color: "var(--fm-text-2)" }}>
                <Bell size={14} />
              </button>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>{initials}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto -mb-px border-b" style={{ borderColor: "var(--fm-card-border)" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2.5 text-[13px] font-semibold border-b-2 whitespace-nowrap transition"
                style={{
                  borderBottomColor: tab === t ? "var(--fm-text)" : "transparent",
                  color: tab === t ? "var(--fm-text)" : "var(--fm-text-3)",
                  backgroundColor: "transparent",
                }}>
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
                <div className="rounded-xl border p-6 transition-colors"
                  style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
                  <h2 className="text-[14px] font-bold mb-4" style={{ color: "var(--fm-text)" }}>Informasi Profil</h2>

                  <div className="space-y-4">
                    <PField label="Nama Lengkap">
                      <input value={fullName} onChange={e => setFullName(e.target.value)}
                        className={inputCls} style={inputStyle}
                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={e => Object.assign(e.target.style, inputStyle)} />
                    </PField>
                    <PField label="Username">
                      <input value={uname} onChange={e => setUname(e.target.value)}
                        className={inputCls} style={inputStyle}
                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={e => Object.assign(e.target.style, inputStyle)} />
                      <p className="text-[11px] mt-1" style={{ color: "var(--fm-text-3)" }}>Username digunakan untuk identifikasi.</p>
                    </PField>
                    <PField label="Bio">
                      <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 160))} rows={3}
                        className={`${inputCls} resize-none`} style={inputStyle}
                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={e => Object.assign(e.target.style, inputStyle)} />
                      <p className="text-[11px] text-right" style={{ color: "var(--fm-text-3)" }}>{bio.length}/160</p>
                    </PField>

                    <button onClick={saveProfile} disabled={saving}
                      className="px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
                      style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>
                      {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* KEAMANAN */}
          {tab === "Keamanan" && (
            <div className="max-w-md">
              <div className="rounded-xl border p-6 transition-colors"
                style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(59,130,246,0.12)" }}>
                    <Shield size={15} style={{ color: "#3b82f6" }} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold" style={{ color: "var(--fm-text)" }}>Keamanan Akun</h2>
                    <p className="text-[12px]" style={{ color: "var(--fm-text-3)" }}>Ubah password akunmu</p>
                  </div>
                </div>

                {pwErr && (
                  <div className="mb-4 px-3 py-2.5 rounded-lg text-red-500 text-[13px]"
                    style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {pwErr}
                  </div>
                )}

                <div className="space-y-4">
                  {[
                    { label: "Password Saat Ini",      val: oldPw, set: setOldPw },
                    { label: "Password Baru",           val: newPw, set: setNewPw },
                    { label: "Konfirmasi Password Baru", val: confPw, set: setConfPw },
                  ].map(({ label, val, set }) => (
                    <PField key={label} label={label}>
                      <input type="password" value={val} onChange={e => set(e.target.value)} placeholder="••••••••"
                        className={inputCls} style={inputStyle}
                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={e => Object.assign(e.target.style, inputStyle)} />
                    </PField>
                  ))}
                  <button onClick={changePw} disabled={pwSaving}
                    className="px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
                    style={{ background: "linear-gradient(135deg, #1a4fa0, #1e6fc7)" }}>
                    {pwSaving ? "Menyimpan..." : "Ganti Password"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFIKASI / INTEGRASI — dihapus */}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-[13px] px-5 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2"
          style={{ backgroundColor: "#111827" }}>
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" /> {toast}
        </div>
      )}
    </div>
  );
}

function PField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5"
        style={{ color: "var(--fm-text-3)" }}>{label}</label>
      {children}
    </div>
  );
}
