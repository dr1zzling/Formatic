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

  const NavContent = ({ close }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div style={{ padding: "34px 24px 55px" }}>
        <div className="flex items-center gap-3" style={{ paddingLeft: 10 }}>
          <div style={{ width:38, height:38, background:"white", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:21, fontWeight:800, color:"#1251aa", flexShrink:0 }}>
            F
          </div>
          <span style={{ fontSize:22, fontWeight:700, color:"white" }}>Formatic</span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ display:"flex", flexDirection:"column", gap:8, padding:"0 24px", flex:1 }}>
        {NAV.map(({ id, label, path, Icon }) => {
          const on = active({ id, path });
          return (
            <button
              key={id}
              onClick={() => { navigate(path); close?.(); }}
              style={{
                width:"100%", height:58, display:"flex", alignItems:"center", gap:18,
                padding:"0 18px", borderRadius:9, border:"none", cursor:"pointer",
                fontSize:16, fontWeight:500, transition:"0.2s ease",
                background: on ? "linear-gradient(90deg, rgba(95,171,255,0.35), rgba(255,255,255,0.12))" : "transparent",
                color: on ? "white" : "rgba(255,255,255,0.9)",
              }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={20} strokeWidth={on ? 2.2 : 1.8} style={{ flexShrink:0 }} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ marginTop:"auto", padding:"14px 24px", position:"relative" }}>
        <div style={{ height:1, background:"rgba(255,255,255,0.15)", marginBottom:12 }} />
        <button
          onClick={() => setDropdown(v => !v)}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 8px", background:"transparent", border:"none", cursor:"pointer" }}
        >
          <div style={{ width:38, height:38, borderRadius:"50%", background:"#1663df", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"white", flexShrink:0, fontSize:15 }}>
            {user.initial}
          </div>
          <div style={{ display:"flex", flexDirection:"column", flex:1, textAlign:"left" }}>
            <strong style={{ fontSize:14, color:"white", fontWeight:600 }}>{user.username}</strong>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.65)", marginTop:3 }}>My Account</span>
          </div>
          <ChevronUp size={16} style={{ color:"rgba(255,255,255,0.6)", transform: dropdown ? "" : "rotate(180deg)", transition:"0.2s", flexShrink:0 }} />
        </button>

        {dropdown && (
          <div style={{ position:"absolute", bottom:88, left:24, right:24, background:"#07245a", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, overflow:"hidden", boxShadow:"0 16px 40px rgba(0,0,0,0.25)", zIndex:50 }}>
            <button
              onClick={() => { navigate("/profile"); setDropdown(false); close?.(); }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"transparent", border:"none", cursor:"pointer", fontSize:13, color:"rgba(255,255,255,0.8)" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <User size={14} /> Profil Saya
            </button>
            <div style={{ height:1, background:"rgba(255,255,255,0.1)", margin:"0 12px" }} />
            <button
              onClick={logout}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"transparent", border:"none", cursor:"pointer", fontSize:13, color:"#fca5a5" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
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
        className="hidden md:flex h-screen sticky top-0 shrink-0 flex-col"
        style={{ width: 366, minWidth: 366, background: "linear-gradient(180deg, #06245a 0%, #0a438f 48%, #257dc6 100%)" }}
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
            className="w-[280px] h-full"
            style={{ background: "linear-gradient(180deg, #06245a 0%, #0a438f 48%, #257dc6 100%)" }}
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
