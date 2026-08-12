import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/api";
import "./MyForm.css";

const FORM_API = "http://localhost:3000";

const CATEGORIES = ["All", "Survey", "Quiz / Ujian"];

function getUsername() {
  try {
    const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
    return p.username || p.name || "User";
  } catch { return "User"; }
}

/* ── Skeleton card ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line" style={{ width: "30%", height: 8 }} />
        <div className="skeleton-line" style={{ width: "85%" }} />
        <div className="skeleton-line" style={{ width: "65%" }} />
        <div className="skeleton-line" style={{ width: "45%", marginTop: "auto" }} />
      </div>
    </div>
  );
}

/* ── Create Form Modal ───────────────────────────────────────── */
function CreateModal({ onClose, onCreated }) {
  const [title, setTitle]     = useState("");
  const [cat, setCat]         = useState("ujian");
  const [banner, setBanner]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setBanner(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!title.trim()) { setError("Judul wajib diisi."); return; }
    if (!banner)       { setError("Banner wajib diunggah."); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("category", cat);
      fd.append("banner", banner);
      const res  = await fetch(`${FORM_API}/form`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat form.");
      onCreated(data?.data?.form?.form_slug);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Buat Form Baru</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <div>
            <label className="modal-label">Judul Form</label>
            <input
              className="modal-input"
              placeholder="Contoh: Kuesioner Kepuasan Pelanggan"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(""); }}
            />
          </div>

          <div>
            <label className="modal-label">Kategori</label>
            <select className="modal-select" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="ujian">Ujian / Quiz</option>
              <option value="survey">Survey</option>
            </select>
          </div>

          <div>
            <label className="modal-label">Banner Form</label>
            <label className="modal-upload">
              {preview
                ? <img src={preview} className="modal-preview" alt="preview" />
                : <>
                    <span style={{ fontSize: 22 }}>🖼️</span>
                    <span>Klik untuk upload (JPG/PNG/WEBP, maks 5MB)</span>
                  </>
              }
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Batal</button>
          <button className="modal-submit" onClick={submit} disabled={loading}>
            {loading ? "Membuat..." : "Buat Form"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function MyForms() {
  const navigate  = useNavigate();
  const username  = getUsername();

  const [forms, setForms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActive] = useState("All");
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/form/user");
      setForms(res.data?.data?.forms ?? []);
    } catch { setForms([]); }
    finally { setLoading(false); }
  }

  /* filter */
  const filtered = forms.filter(f => {
    const title = (f.form_title ?? "").toLowerCase();
    const cat   = f.category ?? "";
    const matchSearch = title.includes(search.toLowerCase());
    const matchCat =
      activeCategory === "All" ||
      (activeCategory === "Survey"     && cat === "survey") ||
      (activeCategory === "Quiz / Ujian" && cat === "ujian");
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      {/* Main shifts right — same 366px as Home sidebar */}
      <div style={{ flex: 1, minWidth: 0, width: "calc(100% - 366px)" }}>
        <div className="myform-page">

          {/* ── Header ─────────────────────────────── */}
          <header className="myform-header">
            <div>
              <h1>My Forms</h1>
              <p>Halo, {username}! Kelola semua form yang kamu buat.</p>
            </div>
            <button className="create-form-btn" onClick={() => setShowModal(true)}>
              <span>＋</span> Create Form
            </button>
          </header>

          {/* ── Search ─────────────────────────────── */}
          <div className="myform-search-wrapper">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search your forms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* ── Category ───────────────────────────── */}
          <div className="category-row">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`category-btn ${activeCategory === c ? "active" : ""}`}
                onClick={() => setActive(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* ── Section header ─────────────────────── */}
          <div className="section-header">
            <div>
              <h2>My Forms</h2>
              <span>{loading ? "..." : `${filtered.length} forms`}</span>
            </div>
          </div>

          {/* ── Grid ───────────────────────────────── */}
          {loading && (
            <div className="forms-grid">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="forms-grid">
              {filtered.map((form, index) => {
                const banner = form.form_banner ?? form.banner;
                const cat    = form.category ?? "";
                const status = form.form_status ?? "private";

                return (
                  <div
                    key={form.form_id ?? index}
                    className={`form-card ${index % 4 === 0 || index % 4 === 3 ? "large-card" : "small-card"}`}
                    onClick={() => navigate(`/form/${form.form_slug}`)}
                  >
                    {/* Image */}
                    <div className="form-image-wrapper">
                      {banner ? (
                        <img
                          src={`${FORM_API}${banner}`}
                          alt={form.form_title}
                          className="form-image"
                          onError={e => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div style={{
                          width: "100%", height: "100%",
                          background: cat === "ujian"
                            ? "linear-gradient(135deg,#ede9fe,#ddd6fe)"
                            : "linear-gradient(135deg,#dbeafe,#bfdbfe)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 36, opacity: 0.5,
                        }}>
                          {cat === "ujian" ? "📝" : "📋"}
                        </div>
                      )}
                      <span className={`form-category ${cat}`}>
                        {cat === "ujian" ? "Quiz" : cat || "Form"}
                      </span>
                      <button
                        className="more-btn"
                        onClick={e => { e.stopPropagation(); }}
                      >⋮</button>
                    </div>

                    {/* Content */}
                    <div className="form-content">
                      <h3>{form.form_title ?? "Untitled"}</h3>
                      <p className="form-description">{cat || "—"}</p>
                      <div className="form-info">
                        <span>▧ — Questions</span>
                        <span>•</span>
                        <span>0 Responses</span>
                      </div>
                      <div className="form-footer">
                        <span
                          style={{
                            fontWeight: 600, fontSize: 10,
                            color: status === "public" ? "#22a06b" : "#7892a6",
                          }}
                        >
                          {status === "public" ? "● Published" : "○ Draft"}
                        </span>
                        <span className="open-arrow">→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Empty state ─────────────────────────── */}
          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">□</div>
              <h3>{search ? "Form tidak ditemukan" : "Belum ada form"}</h3>
              <p>
                {search
                  ? "Coba kata kunci lain atau pilih kategori berbeda."
                  : "Buat form pertamamu dengan klik tombol Create Form!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────── */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={slug => {
            setShowModal(false);
            load();
            if (slug) navigate(`/form/${slug}`);
          }}
        />
      )}
    </div>
  );
}
