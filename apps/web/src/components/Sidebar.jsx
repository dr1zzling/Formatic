import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, Trash2, LogOut, User, ChevronDown, History, Compass, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

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
  { id: "home",      label: "Home",      path: "/",           Icon: Home },
  { id: "my-forms",  label: "My Form",   path: "/my-forms",   Icon: FileText },
  { id: "discovery", label: "Discovery", path: "/discovery",  Icon: Compass },
  { id: "trash",     label: "Trash",     path: "/trash",      Icon: Trash2 },
];

const BOTTOM_NAV = [
  { id: "home",     label: "Home",    path: "/",         Icon: Home },
  { id: "my-forms", label: "My Form", path: "/my-forms", Icon: FileText },
  { id: "history",  label: "History", path: "/history",  Icon: History },
  { id: "profile",  label: "Profil",  path: "/profile",  Icon: User },
];

export default function Sidebar() {
  const loc       = useLocation();
  const navigate  = useNavigate();
  const [user, setUser]           = useState({ username: "User", initial: "U" });
  const [dropdown, setDropdown]   = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { dark, toggle }          = useTheme();
  const drawerRef = useRef(null);

  useEffect(() => { setUser(getUser()); }, []);

  // Tutup drawer saat navigasi
  useEffect(() => { setDrawerOpen(false); }, [loc.pathname]);

  // Tutup drawer saat klik di luar
  useEffect(() => {
    if (!drawerOpen) return;
    function handleClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [drawerOpen]);

  // Cegah scroll body saat drawer terbuka
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function isActive(item) {
    if (item.id === "home")    return loc.pathname === "/" || loc.pathname === "/home";
    if (item.id === "my-forms") return loc.pathname.startsWith("/my-forms") || loc.pathname.startsWith("/form/");
    if (item.id === "discovery") return loc.pathname === "/discovery";
    if (item.id === "history") return loc.pathname === "/history";
    if (item.id === "profile") return loc.pathname === "/profile";
    return loc.pathname.startsWith(item.path);
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────── */}
      <aside
        className="hidden md:flex w-[220px] xl:w-[240px] min-w-[220px] h-screen sticky top-0 shrink-0 flex-col transition-all duration-300"
        style={{ background: dark
          ? "linear-gradient(180deg,#0d1117 0%,#111827 48%,#161d2b 100%)"
          : "linear-gradient(180deg,#06245a 0%,#0a438f 48%,#257dc6 100%)"
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 pt-7 pb-10">
          <div className="w-9 h-9 flex items-center justify-center bg-white rounded-[9px] text-[#1251aa] text-lg font-extrabold shrink-0">F</div>
          <span className="text-lg font-bold text-white">Formatic</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1.5 px-4 flex-1">
          {NAV.map(({ id, label, path, Icon }) => {
            const on = isActive({ id, path });
            return (
              <button key={id} onClick={() => navigate(path)}
                className={`w-full h-[50px] flex items-center gap-4 px-4 rounded-xl text-[15px] font-medium transition-all duration-200 border-none cursor-pointer active:scale-95 ${
                  on ? "text-white scale-[1.02]" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                style={on ? { background: "linear-gradient(90deg,rgba(95,171,255,0.35),rgba(255,255,255,0.12))" } : {}}
              >
                <Icon size={19} strokeWidth={on ? 2.2 : 1.8} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle + User footer */}
        <div className="px-4 py-4 relative">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border-none cursor-pointer mb-2 transition-all"
            style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)" }}
          >
            <div className="relative w-11 h-6 rounded-full shrink-0 transition-all duration-300"
              style={{ background: dark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)" }}>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 transition-opacity duration-200 text-white"
                style={{ opacity: dark ? 0 : 1 }}><Sun size={11} /></span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-200 text-white"
                style={{ opacity: dark ? 1 : 0 }}><Moon size={11} /></span>
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 flex items-center justify-center text-gray-700"
                style={{ left: dark ? "calc(100% - 22px)" : "2px" }}>
                {dark ? <Moon size={10} /> : <Sun size={10} />}
              </span>
            </div>
            <span className="text-[13px] font-medium text-white/80 flex-1 text-left">
              {dark ? "Mode Gelap" : "Mode Terang"}
            </span>
          </button>

          <div className="h-px bg-white/15 mb-3" />
          <button onClick={() => setDropdown(v => !v)}
            className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl bg-transparent border-none cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#1663df] flex items-center justify-center font-bold text-white shrink-0 text-sm">
              {user.initial}
            </div>
            <div className="flex flex-col flex-1 text-left min-w-0">
              <strong className="text-[13px] text-white font-semibold truncate">{user.username}</strong>
              <span className="text-[10px] text-white/55 mt-0.5">My Account</span>
            </div>
            <ChevronDown size={14} className={`text-white/50 shrink-0 transition-transform ${dropdown ? "rotate-180" : ""}`} />
          </button>

          {dropdown && (
            <div className="absolute bottom-[80px] left-4 right-4 bg-[#07245a] border border-white/15 rounded-xl overflow-hidden shadow-2xl z-50">
              <button onClick={() => { navigate("/profile"); setDropdown(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-transparent border-none cursor-pointer text-[13px] text-white/80 hover:bg-white/[0.08] transition-colors">
                <User size={14} /> Profil Saya
              </button>
              <div className="h-px bg-white/10 mx-3" />
              <button onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-transparent border-none cursor-pointer text-[13px] text-red-300 hover:bg-red-500/10 transition-colors">
                <LogOut size={14} /> Keluar
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────── */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-[52px] transition-all duration-300"
        style={{ background: dark
          ? "linear-gradient(90deg,#0d1117,#111827)"
          : "linear-gradient(90deg,#06245a,#0a438f)"
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[13px] font-extrabold text-[#1251aa]">F</div>
          <span className="text-[15px] font-bold text-white">Formatic</span>
        </div>
        {/* Mobile dark mode toggle */}
        <button onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 text-white"
          style={{ background: dark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)" }}
          aria-label="Toggle tema"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* ── Mobile Drawer Overlay ─────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer Panel ───────────────────── */}
      <div
        ref={drawerRef}
        className="md:hidden fixed top-0 right-0 z-[60] h-full w-[280px] flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          background: dark
            ? "linear-gradient(180deg,#0d1117 0%,#111827 50%,#161d2b 100%)"
            : "linear-gradient(180deg,#06245a 0%,#0a438f 50%,#257dc6 100%)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-[8px] flex items-center justify-center text-[13px] font-extrabold text-[#1251aa]">F</div>
            <span className="text-[15px] font-bold text-white">Formatic</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1663df] flex items-center justify-center font-bold text-white text-[14px] shrink-0">
              {user.initial}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-white truncate">{user.username}</p>
              <p className="text-[11px] text-white/50">My Account</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
          {DRAWER_NAV.map(({ id, label, path, Icon }) => {
            const on = isActive({ id, path });
            return (
              <button key={id} onClick={() => navigate(path)}
                className="w-full h-[50px] flex items-center gap-4 px-4 rounded-xl text-[15px] font-medium transition-all duration-200 border-none cursor-pointer active:scale-[0.98] text-left"
                style={on
                  ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.65)", background: "transparent" }}
              >
                <Icon size={19} strokeWidth={on ? 2.2 : 1.8} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-6 space-y-1 border-t border-white/10 pt-3">
          <button onClick={() => { navigate("/profile"); }}
            className="w-full h-[46px] flex items-center gap-3 px-4 rounded-xl text-[14px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all border-none cursor-pointer"
          >
            <User size={17} className="shrink-0" />
            Profil Saya
          </button>
          <button onClick={logout}
            className="w-full h-[46px] flex items-center gap-3 px-4 rounded-xl text-[14px] font-medium transition-all border-none cursor-pointer"
            style={{ color: "#fca5a5" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <LogOut size={17} className="shrink-0" />
            Keluar
          </button>
        </div>
      </div>
    </>
  );
}
