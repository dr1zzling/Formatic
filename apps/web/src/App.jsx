import { useRef, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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

/* ── Nav order (hanya halaman nav utama) ─────────────────────── */
// Urutan sirkuler: Home(0) → MyForm(1) → History(2) → Trash(3) → Profile(4)
// Dari atas ke bawah = index naik = slide ke bawah
// Dari bawah ke atas = index turun = slide ke atas
// Wrap: Profile(4) → Home(0) = lompatan 4, lebih dari setengah 5 → flip ke atas
const NAV = ["/", "/home", "/my-forms", "/history", "/trash", "/profile"];

function getNavIndex(pathname) {
  // exact match dulu
  let i = NAV.indexOf(pathname);
  if (i !== -1) return i;
  // partial match
  if (pathname.startsWith("/my-forms")) return 2;
  if (pathname.startsWith("/history"))  return 3;
  if (pathname.startsWith("/trash"))    return 4;
  if (pathname.startsWith("/profile"))  return 5;
  return -1; // bukan nav page
}

function calcDirection(fromPath, toPath) {
  const fromIdx = getNavIndex(fromPath);
  const toIdx   = getNavIndex(toPath);

  // Kalau salah satu bukan nav page, default slide ke bawah
  if (fromIdx === -1 || toIdx === -1) return 1;

  const n    = NAV.length; // 6
  const diff = toIdx - fromIdx;

  // Circular: cek apakah lebih cepat lewat wrap
  // Forward normal: diff > 0
  // Backward normal: diff < 0
  // Wrap forward (e.g. Profile→Home): diff = 0-4 = -4, tapi |diff|=4 > n/2=3 → flip → slide atas
  // Wrap backward (e.g. Home→Profile): diff = 4-0 = 4, |diff|=4 > n/2=3 → flip → slide bawah

  if (Math.abs(diff) > n / 2) {
    // Wrap around — flip direction
    return diff < 0 ? 1 : -1;
  }
  return diff > 0 ? 1 : -1;
}

/* ── Animated Routes ─────────────────────────────────────────── */
const DURATION = 280;

function AnimatedRoutes() {
  const location    = useLocation();
  const containerRef = useRef(null);
  const prevPathRef  = useRef(location.pathname);
  const directionRef = useRef(1);
  const timerRef     = useRef(null);
  const rafRef       = useRef(null);

  // Track which locations to render (current + previous during transition)
  const [displayLoc, setDisplayLoc] = useState({
    prev: null,
    curr: location,
  });

  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;

    // Calculate direction BEFORE updating prev
    const dir = calcDirection(prevPathRef.current, location.pathname);
    directionRef.current = dir;

    const prevLocation = { pathname: prevPathRef.current, search: "", hash: "", key: "prev" };
    prevPathRef.current = location.pathname;

    // Show both pages
    setDisplayLoc({ prev: prevLocation, curr: location });

    // Animate after render
    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const kids = container.children;
        if (kids.length < 2) return;

        const outEl = kids[0]; // prev page
        const inEl  = kids[1]; // curr page

        const isMobile = window.innerWidth < 768;
        const fromY = dir === 1 ? "100%" : "-100%";
        const toY   = dir === 1 ? "-30%" : "30%";
        const fromX = dir === 1 ? "100%" : "-100%";
        const toX   = dir === 1 ? "-30%" : "30%";

        // Reset — no transition
        outEl.style.transition = "none";
        outEl.style.transform  = isMobile ? "translateX(0) scale(1)" : "translateY(0) scale(1)";
        outEl.style.opacity    = "1";
        inEl.style.transition  = "none";
        inEl.style.transform   = isMobile ? `translateX(${fromX})` : `translateY(${fromY})`;
        inEl.style.opacity     = "1";

        void container.offsetHeight; // force reflow

        // Animate
        const ease = `${DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)`;
        outEl.style.transition = `transform ${ease}, opacity ${ease}`;
        inEl.style.transition  = `transform ${ease}`;
        outEl.style.transform  = isMobile ? `translateX(${toX}) scale(0.97)` : `translateY(${toY}) scale(0.97)`;
        outEl.style.opacity    = "0";
        inEl.style.transform   = isMobile ? "translateX(0)" : "translateY(0)";

        // After animation, remove prev
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

  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
      {/* Previous page (outgoing) */}
      {displayLoc.prev && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1, willChange: "transform, opacity" }}>
          <RouteContent location={displayLoc.prev} />
        </div>
      )}
      {/* Current page (incoming) */}
      <div style={{
        position: displayLoc.prev ? "absolute" : "relative",
        inset: displayLoc.prev ? 0 : undefined,
        zIndex: 2,
        willChange: "transform",
        minHeight: "100vh",
      }}>
        <RouteContent location={displayLoc.curr} />
      </div>
    </div>
  );
}

function RouteContent({ location }) {
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
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
