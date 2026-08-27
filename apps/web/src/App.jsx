import { useRef, useEffect } from "react";
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

/* ── Page transition wrapper ─────────────────────────────────── */
function PageTransition({ children }) {
  const location = useLocation();
  const ref       = useRef(null);
  const prevPath  = useRef(location.pathname);

  useEffect(() => {
    if (!ref.current) return;
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    const el = ref.current;
    el.style.opacity    = "0";
    el.style.transform  = "translateX(6px)";
    el.style.transition = "none";

    // Force reflow
    void el.offsetHeight;

    el.style.transition = "opacity 180ms ease, transform 180ms ease";
    el.style.opacity    = "1";
    el.style.transform  = "translateX(0)";
  }, [location.pathname]);

  return (
    <div ref={ref} style={{ opacity: 1, transform: "translateX(0)", willChange: "opacity, transform" }}>
      {children}
    </div>
  );
}

/* ── Animated Routes ─────────────────────────────────────────── */
function AnimatedRoutes() {
  return (
    <PageTransition>
      <Routes>
        {/* Auth */}
        <Route path="/login"           element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register"        element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />

        {/* Dashboard */}
        <Route path="/"          element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home"      element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/my-forms"  element={<ProtectedRoute><MyForms /></ProtectedRoute>} />
        <Route path="/form/:slug" element={<ProtectedRoute><FormEditor /></ProtectedRoute>} />
        <Route path="/fill/:slug"             element={<ProtectedRoute><FillForm /></ProtectedRoute>} />
        <Route path="/history"                element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/form/:slug/collaborate" element={<ProtectedRoute><Collaborate /></ProtectedRoute>} />
        <Route path="/trash"     element={<ProtectedRoute><Trash /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

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
