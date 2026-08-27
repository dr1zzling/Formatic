import { useRef, useEffect, useState, cloneElement } from "react";
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

/* ── Route order ─────────────────────────────────────────────── */
const ROUTE_ORDER = [
  "/", "/home", "/my-forms", "/history", "/trash", "/profile",
  "/login", "/register", "/forgot-password",
  "/fill/", "/form/",
];
const NAV_COUNT = 6; // jumlah nav utama (/, /my-forms, /history, /trash, /profile)

function getOrder(pathname) {
  const idx = ROUTE_ORDER.findIndex(r => pathname === r || (r.endsWith("/") && pathname.startsWith(r)));
  return idx === -1 ? 4 : idx;
}

function getDirection(fromOrder, toOrder) {
  // Hanya apply circular logic untuk nav utama (index 0-5)
  const isNavNav = fromOrder < NAV_COUNT && toOrder < NAV_COUNT;
  if (!isNavNav) return toOrder >= fromOrder ? 1 : -1;

  const diff = toOrder - fromOrder;
  const total = NAV_COUNT;

  // Jika lompatan > setengah total, artinya wrap around — balik arah
  if (Math.abs(diff) > total / 2) {
    return diff > 0 ? -1 : 1; // flip direction untuk wrap
  }
  return diff >= 0 ? 1 : -1;
}

/* ── Smooth slide transition ─────────────────────────────────── */
const DURATION = 300; // ms

function AnimatedRoutes() {
  const location                    = useLocation();
  const [pages, setPages]           = useState([{ key: location.key, location, order: getOrder(location.pathname) }]);
  const [transitioning, setTrans]   = useState(false);
  const containerRef                = useRef(null);
  const prevOrderRef                = useRef(getOrder(location.pathname));
  const animFrameRef                = useRef(null);

  useEffect(() => {
    const currentOrder = getOrder(location.pathname);
    const direction    = getDirection(prevOrderRef.current, currentOrder);
    prevOrderRef.current = currentOrder;

    if (transitioning) return;
    setTrans(true);

    // Add new page
    setPages(prev => {
      if (prev[prev.length - 1]?.location.pathname === location.pathname) return prev;
      return [...prev.slice(-1), { key: location.key, location, order: currentOrder, direction, entering: true }];
    });

    // Animate
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      const children = containerRef.current?.children;
      if (!children || children.length < 2) {
        setTrans(false);
        setPages(prev => prev.slice(-1).map(p => ({ ...p, entering: false })));
        return;
      }

      const outgoing = children[0];
      const incoming = children[1];
      const offset   = direction === 1 ? "100%" : "-100%";
      const outTarget = direction === 1 ? "-100%" : "100%";

      // Set initial positions
      outgoing.style.transition = "none";
      outgoing.style.transform  = "translateY(0)";
      incoming.style.transition = "none";
      incoming.style.transform  = `translateY(${offset})`;

      void outgoing.offsetHeight; // reflow

      // Animate both simultaneously
      const ease = `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      outgoing.style.transition = ease;
      incoming.style.transition = ease;
      outgoing.style.transform  = `translateY(${outTarget})`;
      incoming.style.transform  = "translateY(0)";

      setTimeout(() => {
        setPages(prev => prev.slice(-1).map(p => ({ ...p, entering: false })));
        setTrans(false);
      }, DURATION);
    });
  }, [location.pathname, location.key]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}
    >
      {pages.map((page, i) => (
        <div
          key={page.key}
          style={{
            position: i < pages.length - 1 ? "absolute" : "relative",
            top: 0, left: 0, right: 0,
            minHeight: "100vh",
            willChange: "transform",
          }}
        >
          <RouteContent location={page.location} />
        </div>
      ))}
    </div>
  );
}

/* ── Route content (keyed by location) ──────────────────────── */
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
