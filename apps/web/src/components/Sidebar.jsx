import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, Trash2, LogOut, User, ChevronDown, Menu, X } from "lucide-react";

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

  function isActive(item) {
    if (item.id === "home")     return loc.pathname === "/" || loc.pathname === "/home";
    if (item.id === "my-forms") return loc.pathname.startsWith("/my-forms") || loc.pathname.startsWith("/form/");
    return loc.pathname.startsWith(item.path);
  }

  function logout() { localStorage.removeItem("token"); navigate("/login"); }

  const NavContent = ({ close }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-8 pt-9 pb-14">
        <div className="w-[38px] h-[38px] flex items-center justify-center bg-white rounded-[9px] text-[#1251aa] text-[21px] font-extrabold shrink-0">
          F
        </div>
        <span className="text-[22px] font-bold text-white">Formatic</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-2 px-6 flex-1">
        {NAV.map(({ id, label, path, Icon }) => {
          const on = isActive({ id, path });
          return (
            <button
              key={id}
              onClick={() => { navigate(path); close?.(); }}
              className={`w-full h-[58px] flex items-center gap-[18px] px-[18px] rounded-[9px] text-[16px] font-medium transition-all border-none cursor-pointer ${
                on ? "text-white" : "text-white/90 hover:bg-white/10"
              }`}
              style={on ? { background: "linear-gradient(90deg,rgba(95,171,255,0.35),rgba(255,255,255,0.12))" } : {}}
            >
              <Icon size={20} strokeWidth={on ? 2.2 : 1.8} className="shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-6 py-4 relative">
        <div className="h-px bg-white/15 mb-3" />
        <button
          onClick={() => setDropdown(v => !v)}
          className="w-full flex items-center gap-3 py-3 px-2 bg-transparent border-none cursor-pointer"
        >
          <div className="w-[38px] h-[38px] rounded-full bg-[#1663df] flex items-center justify-center font-bold text-white shrink-0 text-[15px]">
            {user.initial}
          </div>
          <div className="flex flex-col flex-1 text-left">
            <strong className="text-[14px] text-white font-semibold">{user.username}</strong>
            <span className="text-[10px] text-white/65 mt-0.5">My Account</span>
          </div>
          <ChevronDown size={16} className={`text-white/60 shrink-0 transition-transform ${dropdown ? "rotate-180" : ""}`} />
        </button>

        {dropdown && (
          <div className="absolute bottom-[88px] left-6 right-6 bg-[#07245a] border border-white/15 rounded-xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.25)] z-50">
            <button
              onClick={() => { navigate("/profile"); setDropdown(false); close?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 bg-transparent border-none cursor-pointer text-[13px] text-white/80 hover:bg-white/[0.08] transition-colors"
            >
              <User size={14} /> Profil Saya
            </button>
            <div className="h-px bg-white/10 mx-3" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-3 bg-transparent border-none cursor-pointer text-[13px] text-red-300 hover:bg-red-500/10 transition-colors"
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
      {/* ── Desktop ───────────────────────────────── */}
      <aside
        className="hidden md:flex w-[366px] min-w-[366px] h-screen sticky top-0 shrink-0 flex-col"
        style={{ background: "linear-gradient(180deg,#06245a 0%,#0a438f 48%,#257dc6 100%)" }}
      >
        <NavContent />
      </aside>

      {/* ── Mobile top bar ────────────────────────── */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-[52px]"
        style={{ background: "linear-gradient(90deg,#06245a,#0a438f)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[13px] font-extrabold text-[#1251aa]">F</div>
          <span className="text-[15px] font-bold text-white">Formatic</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} className="text-white/80 hover:text-white p-1 bg-transparent border-none cursor-pointer">
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {/* ── Mobile drawer ─────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="w-[280px] h-full flex flex-col"
            style={{ background: "linear-gradient(180deg,#06245a 0%,#0a438f 48%,#257dc6 100%)" }}
          >
            <NavContent close={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* ── Mobile bottom nav ─────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-white/95 backdrop-blur border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {[...NAV, { id: "profile", label: "Profil", path: "/profile", Icon: User }].map(({ id, label, path, Icon }) => {
          const on = id === "profile" ? loc.pathname === "/profile" : isActive({ id, path });
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 bg-transparent border-none cursor-pointer"
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
