import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import { Search, Bell, Settings, RefreshCw } from "lucide-react";

const CATEGORIES = ["All", "Public", "Quiz", "Survey"];

const CARD_GRADIENTS = [
  "linear-gradient(135deg,#dbeafe,#93c5fd)",
  "linear-gradient(135deg,#ede9fe,#c4b5fd)",
  "linear-gradient(135deg,#dcfce7,#86efac)",
  "linear-gradient(135deg,#fef9c3,#fde047)",
  "linear-gradient(135deg,#ffedd5,#fb923c)",
  "linear-gradient(135deg,#fce7f3,#f9a8d4)",
];

function getUsername() {
  const token = localStorage.getItem("token");
  if (!token) return "User";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || payload.name || "User";
  } catch {
    return "User";
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const username = getUsername();

  useEffect(() => {
    loadForms();
  }, [activeCategory]);

  async function loadForms() {
    setLoading(true);
    setError("");
    try {
      const params = activeCategory !== "All" ? { category: activeCategory } : {};
      const res = await api.get("/form", { params });
      setForms(res.data?.data ?? []);
    } catch {
      setError("Gagal memuat form. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = forms.filter((f) =>
    (f.form_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-8 pt-7 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Hi, {username}! <span>👋</span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {greeting}! Fill your forms, give responses, and share your feedback.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
              <Bell size={18} />
            </button>
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
              <Settings size={18} />
            </button>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#005fb3,#009bf5)" }}
            >
              {username[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Search */}
        <div className="px-8 mt-4 mb-5">
          <div className="relative max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search forms or templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-8 mb-6 flex items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "text-white shadow"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              style={activeCategory === cat ? { background: "linear-gradient(90deg,#005fb3,#009bf5)" } : {}}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={loadForms}
            title="Refresh"
            className="ml-auto p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-base">Recommended Forms</h2>
            <button className="text-sm font-medium text-blue-500 hover:underline">View all →</button>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse">
                  <div className="h-36 bg-gray-200 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <button onClick={loadForms} className="mt-4 px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#005fb3" }}>
                Coba Lagi
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-5xl mb-3">📋</p>
              <p className="font-semibold text-gray-700">Belum ada form tersedia</p>
              <p className="text-gray-400 text-sm mt-1">Coba kategori lain atau buat form baru.</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((form, idx) => (
                <FormCard
                  key={form.id ?? idx}
                  form={form}
                  gradient={CARD_GRADIENTS[idx % CARD_GRADIENTS.length]}
                  onClick={() => navigate(`/form/${form.form_slug}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormCard({ form, gradient, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="h-36 flex items-center justify-center relative" style={{ background: gradient }}>
        <svg className="w-14 h-14 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
          form.form_status === "public" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {form.form_status ?? "private"}
        </span>
      </div>
      <div className="px-4 py-3">
        {form.category && (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 mb-1.5">
            {form.category}
          </span>
        )}
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
          {form.form_title ?? "Untitled Form"}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">0 Responses</span>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="px-3 py-1 rounded-lg text-white text-xs font-medium"
            style={{ background: "linear-gradient(90deg,#005fb3,#009bf5)" }}
          >
            Fill Form
          </button>
        </div>
      </div>
    </div>
  );
}
