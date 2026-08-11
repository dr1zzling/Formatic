import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, Trash2, LogOut, User, ChevronUp, Menu, X } from "lucide-react";

function getUser() {
  const token = localStorage.getItem("token");
  if (!token) return { username: "User", initial: "U" };
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    const username = p.username || p.name || "User";
    return { username, initial: username[0]?.toUpperCase() };
  } catch { return { username: "User", initial: "U" }; }
}

const NAV = [
  { id: "home",     label: "Home",    path: "/",         Icon: Home },
  { id: "my-forms", label: "My Form", path: "/my-forms", Icon: FileText },
  { id: "trash",    label: "Trash",   path: "/trash",    Icon: Trash2 },
];

export default function Sidebar() {
  const loc      = useLocation();
  const navigate = useNavigate();
  const [user, setUser]             = useState({ username: "User", initial: "U" });
  const [dropdown, setDropdown]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  function active(item) {
    if (item.id === "home")     return loc.pathname === "/" || loc.pathname === "/home";
    if (item.id === "my-forms") return loc.pathname.startsWith("/my-forms") || loc.pathname.startsWith("/form/");
    return loc.pathname.startsWith(item.path);
  }

  function logout() { localStorage.removeItem("token"); navigate("/login"); }

  /* ── Shared nav content ──────────────────────────────── */
  const NavContent = ({ close }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-7 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <span className="text-base font-black text-[#1a3a6b]">F</span>
          </div>
          <span className="text-[17px] font-bold tracking-tight text-white">Formatic</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ id, label, path, Icon }) => {
          const on = active({ id, path });
          return (
            <button
              key={id}
              onClick={() => { navigate(path); close?.(); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                on
                  ? "bg-white/[0.18] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/[0.09]"
              }`}
            >
              <Icon size={17} strokeWidth={on ? 2.2 : 1.8} />
              {label}
              {on && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-5 relative">
        <div className="h-px bg-white/10 mb-3 mx-1" />
        <button
          onClick={() => setDropdown(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.09] transition group"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 ring-1 ring-white/30 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user.initial}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">{user.username}</p>
            <p className="text-[11px] text-white/45 leading-tight">Lihat profil</p>
          </div>
          <ChevronUp size={14} className={`text-white/40 transition-transform shrink-0 ${dropdown ? "" : "rotate-180"}`} />
        </button>

        {dropdown && (
          <div className="absolute bottom-[72px] left-3 right-3 bg-[#0d2657] border border-white/15 rounded-xl overflow-hidden shadow-2xl z-50">
            <button
              onClick={() => { navigate("/profile"); setDropdown(false); close?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-white/75 hover:text-white hover:bg-white/[0.08] transition"
            >
              <User size={14} /> Profil Saya
            </button>
            <div className="h-px bg-white/10 mx-3" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop ───────────────────────────────────── */}
      <aside
        className="hidden md:flex w-[210px] xl:w-[220px] h-screen sticky top-0 shrink-0 flex-col"
        style={{ background: "linear-gradient(175deg, #0f2d6b 0%, #1a4fa0 45%, #1e6fc7 100%)" }}
      >
        <NavContent />
      </aside>

      {/* ── Mobile topbar ─────────────────────────────── */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 h-13 flex items-center justify-between px-4"
        style={{ background: "linear-gradient(90deg, #0f2d6b, #1a4fa0)", height: 52 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[13px] font-black text-[#1a3a6b]">F</span>
          </div>
          <span className="text-[15px] font-bold text-white">Formatic</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} className="text-white/80 hover:text-white transition p-1">
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {/* ── Mobile drawer ─────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="w-[220px] h-full"
            style={{ background: "linear-gradient(175deg, #0f2d6b 0%, #1a4fa0 45%, #1e6fc7 100%)" }}
          >
            <NavContent close={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* ── Mobile bottom nav ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-white/95 backdrop-blur border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {[...NAV, { id: "profile", label: "Profil", path: "/profile", Icon: User }].map(({ id, label, path, Icon }) => {
          const on = id === "profile" ? loc.pathname === "/profile" : active({ id, path });
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1"
            >
              <Icon size={19} className={on ? "text-[#1a4fa0]" : "text-gray-400"} strokeWidth={on ? 2.2 : 1.7} />
              <span className={`text-[10px] font-semibold ${on ? "text-[#1a4fa0]" : "text-gray-400"}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
