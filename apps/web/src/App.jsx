import { useRef, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { ThemeProvider } from "./context/ThemeContext";
import Login          from "./pages/auth/Login";
import Register       from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Home           from "./pages/Dashboard/Home";
import MyForms        from "./pages/Dashboard/MyForms";
import FormEditor     from "./pages/Dashboard/FormEditor";
import FillForm       from "./pages/Dashboard/FillForm";
import Trash          from "./pages/Dashboard/Trash";
import Profile        from "./pages/Dashboard/Profile";
import History        from "./pages/Dashboard/History";
import Collaborate    from "./pages/Dashboard/Collaborate";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
function AuthRoute({ children }) {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/" replace />;
  return children;
}

/* ── Auth pages & responden pages (no sidebar) ───────────────── */
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/fill/"];

/* ── Nav order untuk arah slide ─────────────────────────────── */
const NAV = ["/", "/home", "/my-forms", "/history", "/trash", "/profile"];

function getNavIndex(pathname) {
  let i = NAV.indexOf(pathname);
  if (i !== -1) return i;
  if (pathname.startsWith("/my-forms")) return 2;
  if (pathname.startsWith("/history"))  return 3;
  if (pathname.startsWith("/trash"))    return 4;
  if (pathname.startsWith("/profile"))  return 5;
  return -1;
}

function calcDirection(fromPath, toPath) {
  const fromIdx = getNavIndex(fromPath);
  const toIdx   = getNavIndex(toPath);
  if (fromIdx === -1 || toIdx === -1) return 1;
  const n    = NAV.length;
  const diff = toIdx - fromIdx;
  if (Math.abs(diff) > n / 2) return diff < 0 ? 1 : -1; // wrap
  return diff > 0 ? 1 : -1;
}

/* ── Content area with slide animation ───────────────────────── */
const DURATION = 280;

function AnimatedContent({ children }) {
  const location     = useLocation();
  const containerRef = useRef(null);
  const prevPathRef  = useRef(location.pathname);
  const timerRef     = useRef(null);
  const rafRef       = useRef(null);

  const [displayLoc, setDisplayLoc] = useState({
    prev: null,
    curr: location,
  });

  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;

    const dir = calcDirection(prevPathRef.current, location.pathname);
    const prevLocation = { pathname: prevPathRef.current, search: "", hash: "", key: "prev" };
    prevPathRef.current = location.pathname;

    setDisplayLoc({ prev: prevLocation, curr: location });

    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        const kids = container.children;
        if (kids.length < 2) return;

        const outEl = kids[0];
        const inEl  = kids[1];
        const isMobile = window.innerWidth < 768;

        const fromPos  = dir === 1 ? "100%"  : "-100%";
        const toPos    = dir === 1 ? "-25%"  : "25%";
        const axis     = isMobile ? "translateX" : "translateY";

        outEl.style.transition = "none";
        outEl.style.transform  = `${axis}(0) scale(1)`;
        outEl.style.opacity    = "1";
        inEl.style.transition  = "none";
        inEl.style.transform   = `${axis}(${fromPos})`;
        inEl.style.opacity     = "1";

        void container.offsetHeight;

        const ease = `${DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)`;
        outEl.style.transition = `transform ${ease}, opacity ${ease}`;
        inEl.style.transition  = `transform ${ease}`;
        outEl.style.transform  = `${axis}(${toPos}) scale(0.97)`;
        outEl.style.opacity    = "0";
        inEl.style.transform   = `${axis}(0)`;

        timerRef.current = setTimeout(() => {
          setDisplayLoc(d => ({ prev: null, curr: d.curr }));
        }, DURATION + 20);
      });
    });

    return () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [location.pathname, location.key]);

  const isAuth = AUTH_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p));

  return (
    <div style={{ display: "flex", minHeight: "100dvh", width: "100%" }}>
      {/* Sidebar tetap diam — tidak ikut animasi */}
      {!isAuth && <Sidebar />}

      {/* Hanya konten yang slide */}
      <div
        ref={containerRef}
        style={{ flex: 1, minWidth: 0, width: "100%", position: "relative", overflow: "clip" }}
      >
        {displayLoc.prev && (
          <div style={{ position: "absolute", inset: 0, zIndex: 1, willChange: "transform, opacity" }}>
            <PageContent location={displayLoc.prev} />
          </div>
        )}
        <div style={{
          position: displayLoc.prev ? "absolute" : "relative",
          inset: displayLoc.prev ? 0 : undefined,
          zIndex: 2,
          willChange: "transform",
          minHeight: "100vh",
        }}>
          <PageContent location={displayLoc.curr} />
        </div>
      </div>
    </div>
  );
}

/* ── Page content tanpa sidebar ─────────────────────────────── */
function PageContent({ location }) {
  return (
    <Routes location={location}>
      <Route path="/login"           element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register"        element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
      <Route path="/"           element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/home"       element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/my-forms"   element={<ProtectedRoute><MyForms /></ProtectedRoute>} />
      <Route path="/form/:slug" element={<ProtectedRoute><FormEditor /></ProtectedRoute>} />
      <Route path="/fill/:slug"             element={<ProtectedRoute><FillForm /></ProtectedRoute>} />
      <Route path="/history"                element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/form/:slug/collaborate" element={<ProtectedRoute><Collaborate /></ProtectedRoute>} />
      <Route path="/trash"      element={<ProtectedRoute><Trash /></ProtectedRoute>} />
      <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AnimatedContent>
          <PageContent />
        </AnimatedContent>
      </Router>
    </ThemeProvider>
  );
}

export default App;
