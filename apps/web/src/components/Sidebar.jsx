import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, Trash2, ChevronDown, LogOut, User } from "lucide-react";

export default function Sidebar({ activeTab, onTabChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "User" });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload) {
          const name = payload.username || payload.name || "User";
          setUser({ name });
        }
      } catch (e) {
        // Fallback to default
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { id: "home",     label: "Home",    path: "/",         icon: Home },
    { id: "my-forms", label: "My Form", path: "/my-forms", icon: FileText },
    { id: "trash",    label: "Trash",   path: "/trash",    icon: Trash2 },
  ];

  const profileItem = { id: "profile", label: "Profil", path: "/profile", icon: User };

  const currentPath = location.pathname;

  const isItemActive = (item) => {
    if (activeTab !== undefined) return activeTab === item.id;
    return (
      currentPath === item.path ||
      (item.id === "home" && currentPath === "/") ||
      currentPath.startsWith(item.path === "/" ? "/home" : item.path)
    );
  };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 bg-gradient-to-b from-[#002673] via-[#005fb3] to-[#009bf5] text-white flex-col justify-between p-5 select-none shrink-0 shadow-xl">
        {/* Brand */}
        <div className="space-y-8">
          <div className="flex items-center gap-3.5 px-2 pt-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md shrink-0">
              <span className="text-2xl font-black text-[#002673]">F</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Formatic</span>
          </div>

          {/* Nav */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (onTabChange) onTabChange(item.id);
                    navigate(item.path);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white/20 backdrop-blur-md text-white font-semibold shadow-inner"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-white" : "text-white/80"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User footer */}
        <div className="relative pt-4 border-t border-white/10">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-blue-600 border border-white/20 flex items-center justify-center font-bold text-white shadow-md shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate text-left">
                <span className="text-sm font-semibold text-white leading-tight truncate">{user.name}</span>
                <span className="text-xs text-white/60 truncate">Lihat profil</span>
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-white/80 transition-transform duration-200 shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute bottom-16 left-0 right-0 bg-[#003487] border border-white/20 rounded-xl p-2 shadow-2xl backdrop-blur-lg z-50">
              <button
                type="button"
                onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <span>👤</span>
                <span>Profil Saya</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom navbar ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
        {/* Floating pill container */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-stretch overflow-hidden">
          {[...navItems, profileItem].map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onTabChange && item.id !== "profile") onTabChange(item.id);
                  navigate(item.path);
                }}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 relative"
              >
                {/* Active background blob */}
                {isActive && (
                  <span
                    className="absolute inset-x-2 inset-y-1.5 rounded-xl"
                    style={{ background: "linear-gradient(135deg,#005fb3,#009bf5)", opacity: 0.12 }}
                  />
                )}
                <Icon
                  size={21}
                  className={isActive ? "text-[#005fb3]" : "text-gray-400"}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    isActive ? "text-[#005fb3]" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
