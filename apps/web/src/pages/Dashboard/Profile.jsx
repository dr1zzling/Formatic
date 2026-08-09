import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { Bell, HelpCircle, Camera, ChevronRight } from "lucide-react";

const PROFILE_TABS = ["Profil","Keamanan","Notifikasi","Integrasi"];

function getUsername() {
  const token = localStorage.getItem("token");
  if (!token) return "User";
  try { const p = JSON.parse(atob(token.split(".")[1])); return p.username||p.name||"User"; }
  catch { return "User"; }
}

export default function Profile() {
  const navigate  = useNavigate();
  const username  = getUsername();

  const [activeTab, setActiveTab] = useState("Profil");
  const [fullName, setFullName]   = useState(username);
  const [uname, setUname]         = useState(username);
  const [bio, setBio]             = useState("Membuat form, mengumpulkan respons, dan berbagi ide.");
  const [lang, setLang]           = useState("Bahasa Indonesia");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState("");

  const initials = username.slice(0,2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r,800));
    setSaving(false);
    setToast("Perubahan berhasil disimpan!");
    setTimeout(()=>setToast(""),3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto pb-24 md:pb-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 pt-16 md:pt-7 pb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Hi, {username}! 👋</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Kelola informasi profil dan pengaturan akunmu.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"><Bell size={18}/></button>
            <button className="hidden sm:flex w-9 h-9 rounded-full border border-gray-200 items-center justify-center text-gray-500 hover:bg-gray-100"><HelpCircle size={18}/></button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#005fb3,#009bf5)"}}>
              {initials}
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex px-4 md:px-8 border-b border-gray-100 mt-2 overflow-x-auto scrollbar-hide">
          {PROFILE_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 md:px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab===tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 md:px-8 py-6">
          {activeTab === "Profil" && (
            <div className="flex gap-6 flex-col md:flex-row">
              {/* Left */}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-800 mb-1">Informasi Profil</h2>
                <p className="text-sm text-gray-400 mb-6">Kelola informasi profil yang akan ditampilkan di Formatic.</p>

                {/* Avatar */}
                <div className="flex items-end gap-4 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-md"
                      style={{background:"linear-gradient(135deg,#005fb3,#009bf5)"}}>
                      {initials}
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                      <Camera size={14}/>
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">JPG, PNG, atau GIF. Maks. 3MB</p>
                    <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Ganti Foto</button>
                  </div>
                </div>

                <div className="space-y-5">
                  <Field label="Nama Lengkap">
                    <input value={fullName} onChange={e=>setFullName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition"/>
                  </Field>
                  <Field label="Username">
                    <input value={uname} onChange={e=>setUname(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition"/>
                    <p className="text-xs text-gray-400 mt-1">Username dapat diperbarui sebagai form</p>
                  </Field>
                  <Field label="Bio">
                    <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,160))} rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-300 transition"/>
                    <p className="text-xs text-gray-400 text-right">{bio.length}/160</p>
                  </Field>
                  <Field label="Bahasa">
                    <select value={lang} onChange={e=>setLang(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300 transition">
                      <option>Bahasa Indonesia</option>
                      <option>English</option>
                    </select>
                  </Field>
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
                    style={{background:"linear-gradient(90deg,#005fb3,#009bf5)"}}>
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </div>

              {/* Right */}
              <div className="w-full md:w-64 shrink-0 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-800 mb-4 text-sm">Aksi Cepat</h3>
                  <div className="space-y-1">
                    {["Ganti Password","Unduh Data Saya","Log Aktivitas"].map(label => (
                      <button key={label} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                        <span className="flex-1 text-left">{label}</span>
                        <ChevronRight size={14} className="text-gray-300"/>
                      </button>
                    ))}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition">
                      🚪 Keluar dari Akun
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Keamanan" && (
            <div className="max-w-md">
              <h2 className="font-bold text-gray-800 mb-5">Keamanan Akun</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <Field label="Password Saat Ini"><input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"/></Field>
                <Field label="Password Baru"><input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"/></Field>
                <Field label="Konfirmasi Password"><input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"/></Field>
                <button className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{background:"linear-gradient(90deg,#005fb3,#009bf5)"}}>Ganti Password</button>
              </div>
            </div>
          )}

          {(activeTab==="Notifikasi" || activeTab==="Integrasi") && (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-5xl mb-3">🚧</p>
              <p className="font-semibold text-gray-700">Coming Soon</p>
              <p className="text-sm text-gray-400 mt-1">Fitur ini sedang dalam pengembangan.</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg z-50">✅ {toast}</div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}
