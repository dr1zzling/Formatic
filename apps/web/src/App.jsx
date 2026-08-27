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

/* ── Route order — urutan menentukan arah slide ──────────────── */
// Desktop sidebar: atas → bawah
// Mobile bottom nav: kiri → kanan
// Slide ke bawah/kanan = go forward, ke atas/kiri = go back

const ROUTE_ORDER = [
  "/login",
  "/register",
  "/forgot-password",
  "/",
  "/home",
  "/my-forms",
  "/history",
  "/trash",
  "/profile",
  "/fill/",
  "/form/",
];

function getOrder(pathname) {
  const idx = ROUTE_ORDER.findIndex(r => pathname === r || (r.endsWith("/") && pathname.startsWith(r)));
  return idx === -1 ? 5 : idx;
}

/* ── Page transition ─────────────────────────────────────────── */
function PageTransition({ children }) {
  const location = useLocation();
  const ref      = useRef(null);
  const prevPath = useRef(location.pathname);
  const prevOrder = useRef(getOrder(location.pathname));

  useEffect(() => {
    if (!ref.current) return;
    if (prevPath.current === location.pathname) return;

    const currentOrder = getOrder(location.pathname);
    const direction    = currentOrder >= prevOrder.current ? 1 : -1;
    // direction 1  = going forward/down → slide in from bottom
    // direction -1 = going back/up      → slide in from top

    prevPath.current  = location.pathname;
    prevOrder.current = currentOrder;

    const el = ref.current;
    const offset = direction === 1 ? "20px" : "-20px";

    el.style.transition = "none";
    el.style.opacity    = "0";
    el.style.transform  = `translateY(${offset})`;

    void el.offsetHeight; // force reflow

    el.style.transition = "opacity 220ms cubic-bezier(0.25,0.46,0.45,0.94), transform 220ms cubic-bezier(0.25,0.46,0.45,0.94)";
    el.style.opacity    = "1";
    el.style.transform  = "translateY(0)";
  }, [location.pathname]);

  return (
    <div
      ref={ref}
      style={{ opacity: 1, transform: "translateY(0)", willChange: "opacity, transform", minHeight: "100vh" }}
    >
      {children}
    </div>
  );
}

function AnimatedRoutes() {
  return (
    <PageTransition>
      <Routes>
        {/* Auth */}
        <Route path="/login"           element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register"        element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />

        {/* Dashboard */}
        <Route path="/"           element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home"       element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/my-forms"   element={<ProtectedRoute><MyForms /></ProtectedRoute>} />
        <Route path="/form/:slug" element={<ProtectedRoute><FormEditor /></ProtectedRoute>} />
        <Route path="/fill/:slug"             element={<ProtectedRoute><FillForm /></ProtectedRoute>} />
        <Route path="/history"                element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/form/:slug/collaborate" element={<ProtectedRoute><Collaborate /></ProtectedRoute>} />
        <Route path="/trash"      element={<ProtectedRoute><Trash /></ProtectedRoute>} />
        <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
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
