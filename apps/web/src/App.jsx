import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login      from "./pages/auth/Login";
import Register   from "./pages/auth/Register";
import Home       from "./pages/Dashboard/Home";
import MyForms    from "./pages/Dashboard/MyForms";
import FormEditor from "./pages/Dashboard/FormEditor";
import FillForm   from "./pages/Dashboard/FillForm";
import Trash      from "./pages/Dashboard/Trash";
import Profile    from "./pages/Dashboard/Profile";
import History    from "./pages/Dashboard/History";

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

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

        {/* Dashboard */}
        <Route path="/"          element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home"      element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/my-forms"  element={<ProtectedRoute><MyForms /></ProtectedRoute>} />
        <Route path="/form/:slug" element={<ProtectedRoute><FormEditor /></ProtectedRoute>} />
        <Route path="/fill/:slug"  element={<ProtectedRoute><FillForm /></ProtectedRoute>} />
        <Route path="/history"    element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/trash"      element={<ProtectedRoute><Trash /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
