import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "../Dashboard Design/home.css";

const FORM_API = "http://localhost:3000";

/* ── helpers ─────────────────────────────────────────────────── */
function getUsername() {
  try {
    const p = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));
    return p.username || p.name || "User";
  } catch { return "User"; }
}

function getInitial(name) {
  return (name || "U")[0].toUpperCase();
}

/* ── Icon component (dari desain kamu, tidak diubah) ─────────── */
function Icon({ name, size = 20 }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: "1.8",
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "home":   return <svg {...common}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>;
    case "form":   return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>;
    case "trash":  return <svg {...common}><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/></svg>;
    case "search": return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>;
    case "bell":   return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
    case "help":   return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 4.2 1.6c-.9.9-2 1.3-2 2.7"/><path d="M12 17h.01"/></svg>;
    case "plus":   return <svg {...common}><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
    case "arrow":  return <svg {...common}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
    case "file":   return <svg {...common}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h5"/></svg>;
    case "chart":  return <svg {...common}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15v-3"/><path d="M11 15V8"/><path d="M15 15v-5"/><path d="M19 15V6"/></svg>;
    case "chevron":return <svg {...common}><path d="m7 9 5 5 5-5"/></svg>;
    default:       return null;
  }
}

/* ── Sidebar ─────────────────────────────────────────────────── */
function AppSidebar({ activeMenu, setActiveMenu }) {
  const navigate  = useNavigate();
  const username  = getUsername();
  const initial   = getInitial(username);

  function go(menu, path) {
    setActiveMenu(menu);
    navigate(path);
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">F</div>
        <span>Formatic</span>
      </div>
      <nav className="sidebar-menu">
        <button className={`sidebar-item ${activeMenu === "home"   ? "active" : ""}`} onClick={() => go("home",   "/")}>
          <Icon name="home"  size={20} /><span>Home</span>
        </button>
        <button className={`sidebar-item ${activeMenu === "myform" ? "active" : ""}`} onClick={() => go("myform", "/my-forms")}>
          <Icon name="form"  size={20} /><span>My Form</span>
        </button>
        <button className={`sidebar-item ${activeMenu === "trash"  ? "active" : ""}`} onClick={() => go("trash",  "/trash")}>
          <Icon name="trash" size={20} /><span>Trash</span>
        </button>
      </nav>
      <div className="sidebar-profile">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-info">
          <strong>{username}</strong>
          <span>My Account</span>
        </div>
        <Icon name="chevron" size={16} />
      </div>
    </aside>
  );
}

/* ── Header ──────────────────────────────────────────────────── */
function Header({ username }) {
  const initial = getInitial(username);
  return (
    <header className="top-header">
      <div>
        <h1>Hi, {username}! 👋</h1>
        <p>Fill out forms, give responses, and share your feedback.</p>
      </div>
      <div className="header-actions">
        <button className="header-icon"><Icon name="bell" size={20} /></button>
        <button className="header-icon"><Icon name="help" size={20} /></button>
        <div className="header-avatar">{initial}</div>
      </div>
    </header>
  );
}

/* ── Search + Filter ─────────────────────────────────────────── */
function SearchFilter({ search, setSearch, category, setCategory }) {
  const categories = ["All", "Public", "Quiz", "Survey", "Other"];
  return (
    <div className="search-filter">
      <div className="search-box">
        <Icon name="search" size={19} />
        <input
          type="text"
          placeholder="Search forms or templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="category-list">
        {categories.map(item => (
          <button
            key={item}
            className={`category-button ${category === item ? "selected" : ""}`}
            onClick={() => setCategory(item)}
          >
            {item}
            {item === "Other" && <Icon name="chevron" size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Create Form Card ────────────────────────────────────────── */
function CreateFormCard({ onCreateClick }) {
  return (
    <section className="create-card">
      <div className="create-content">
        <span className="small-label">FORM MAKER</span>
        <h2>Buat Form<br />Semudah Ini</h2>
        <p>Buat form yang menarik, bagikan ke siapapun,<br />dan dapatkan respons dengan mudah.</p>
        <button className="create-button" onClick={onCreateClick}>
          <Icon name="plus" size={19} /> Create Form
        </button>
      </div>
      <div className="form-illustration">
        <div className="browser-window">
          <div className="browser-top"><span /><span /><span /></div>
          <div className="fake-form">
            <div className="fake-line large" />
            <div className="fake-line" />
            <div className="fake-question"><span className="fake-radio" /><div><span /><span /></div></div>
            <div className="fake-question"><span className="fake-checkbox">✓</span><div><span /><span /></div></div>
            <div className="fake-question"><span className="fake-radio" /><div><span /><span /></div></div>
          </div>
        </div>
        <div className="floating-check">✓</div>
      </div>
    </section>
  );
}

/* ── Activity Card (dari /form/user) ─────────────────────────── */
function ActivityCard({ forms, loading }) {
  const navigate = useNavigate();
  return (
    <section className="activity-card">
      <div className="section-heading">
        <h3>Aktivitas Terbaru</h3>
        <button onClick={() => navigate("/my-forms")}>View all</button>
      </div>

      <div className="activity-list">
        {loading && [...Array(4)].map((_, i) => (
          <div className="skeleton-row" key={i}>
            <div className="skeleton skeleton-icon" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-line" style={{ width: "70%" }} />
              <div className="skeleton skeleton-line" style={{ width: "45%" }} />
            </div>
          </div>
        ))}

        {!loading && forms.slice(0, 4).map((form, i) => {
          const cat = form.category ?? "default";
          return (
            <div
              className="activity-row"
              key={form.form_id ?? i}
              onClick={() => navigate(`/form/${form.form_slug}`)}
              style={{ cursor: "pointer" }}
            >
              <div className={`activity-icon ${cat}`}>
                <Icon name="file" size={20} />
              </div>
              <div className="activity-details">
                <strong>{form.form_title ?? "Untitled"}</strong>
                <span>{form.category ?? "—"} &nbsp;•&nbsp; 0 responses</span>
              </div>
            </div>
          );
        })}

        {!loading && forms.length === 0 && (
          <p style={{ fontSize: 12, color: "#8ca0ba", margin: "12px 0" }}>Belum ada aktivitas.</p>
        )}
      </div>

      <button className="activity-footer" onClick={() => navigate("/my-forms")}>
        <span>View all activity</span>
        <Icon name="arrow" size={17} />
      </button>
    </section>
  );
}

/* ── Recommended (dari /form/user, tampil 4 teratas) ─────────── */
function RecommendedForms({ forms, loading }) {
  const navigate = useNavigate();
  return (
    <section className="recommended-card">
      <div className="section-heading">
        <h3>Rekomendasi Form Untukmu</h3>
        <button onClick={() => navigate("/my-forms")}>View all</button>
      </div>
      <div className="recommended-list">
        {loading && [...Array(4)].map((_, i) => (
          <div className="skeleton-row" key={i}>
            <div className="skeleton skeleton-icon" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-line" style={{ width: "65%" }} />
              <div className="skeleton skeleton-line" style={{ width: "40%" }} />
            </div>
          </div>
        ))}

        {!loading && forms.slice(0, 4).map((form, i) => {
          const cat = form.category ?? "default";
          return (
            <article
              className="recommended-item"
              key={form.form_id ?? i}
              onClick={() => navigate(`/form/${form.form_slug}`)}
            >
              <div className={`recommend-icon ${cat}`}>
                <Icon name="file" size={19} />
              </div>
              <div className="recommended-content">
                <strong>{form.form_title ?? "Untitled"}</strong>
                <p>{form.category ?? "—"}</p>
              </div>
              <div className="recommend-response">
                <strong>0</strong>
                <span>responses</span>
              </div>
            </article>
          );
        })}

        {!loading && forms.length === 0 && (
          <p style={{ fontSize: 12, color: "#8ca0ba", padding: "12px 0" }}>Belum ada form.</p>
        )}
      </div>
    </section>
  );
}

/* ── Manage Card ─────────────────────────────────────────────── */
function ManageFormsCard({ totalForms }) {
  const navigate = useNavigate();
  return (
    <section className="manage-card">
      <div className="manage-content">
        <span className="small-label">FORM MANAGEMENT</span>
        <h2>Kelola Semua Form<br />Dalam Satu Tempat</h2>
        <p>Pantau respons, lihat statistik, dan kelola form<br />dengan praktis dan efisien.</p>
        <button className="outline-button" onClick={() => navigate("/my-forms")}>
          Go to My Form <Icon name="arrow" size={18} />
        </button>
      </div>
      <div className="analytics-illustration">
        <div className="analytics-window">
          <div className="analytics-top"><span /><span /><span /></div>
          <div className="analytics-body">
            <div className="pie-chart"><div className="pie-center" /></div>
            <div className="chart-lines"><span /><span /><span /><span /></div>
            <div className="bar-chart"><i /><i /><i /><i /><i /></div>
          </div>
        </div>
        <div className="response-badge">
          <span>Total Forms</span>
          <strong>{totalForms}</strong>
          <small>↗ aktif</small>
        </div>
      </div>
    </section>
  );
}

/* ── Form Preview Grid (dari GET /form & GET /form/category) ─── */
function FormPreviewGrid({ search, category, navigate }) {
  const [forms, setForms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => { load(); }, [category]);

  async function load() {
    setLoading(true); setError("");
    try {
      let res;
      if (category === "All" || category === "Public" || category === "Other") {
        res = await api.get("/form");
      } else {
        const catMap = { Quiz: "ujian", Survey: "survey" };
        res = await api.get("/form/category", { params: { category: catMap[category] ?? category.toLowerCase() } });
      }
      setForms(res.data?.data ?? []);
    } catch { setError("Gagal memuat form."); setForms([]); }
    finally { setLoading(false); }
  }

  const filtered = forms.filter(f => {
    const title = (f.title ?? f.form_title ?? "").toLowerCase();
    const desc  = (f.description ?? "").toLowerCase();
    const q     = search.toLowerCase();
    return title.includes(q) || desc.includes(q);
  });

  return (
    <section className="preview-section">
      <div className="section-heading">
        <h3>Recommended Forms</h3>
        <button>View all</button>
      </div>

      {loading && (
        <div className="preview-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ minHeight: 180, borderRadius: 11, overflow: "hidden", border: "1px solid #dfebf7", background: "white", display: "flex" }}>
              <div className="skeleton" style={{ width: "42%", flexShrink: 0 }} />
              <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="skeleton" style={{ height: 10, width: "30%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 14, width: "80%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 10, width: "60%", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#8ca0ba", fontSize: 13 }}>
          {error} — pastikan backend berjalan di port 3000.
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#8ca0ba", fontSize: 13 }}>
          Belum ada form tersedia.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="preview-grid">
          {filtered.map((form, i) => {
            const title    = form.title ?? form.form_title ?? "Untitled";
            const banner   = form.banner ?? form.form_banner;
            const category = form.category ?? "";
            const status   = form.status ?? form.form_status ?? "private";

            return (
              <article
                className={`preview-form-card ${i % 2 === 0 ? "large" : "small"}`}
                key={form.id ?? form.form_id ?? i}
                onClick={() => navigate(`/form/${form.slug ?? form.form_slug}`)}
              >
                <div
                  className="preview-image"
                  style={banner
                    ? { backgroundImage: `url(${FORM_API}${banner})` }
                    : { background: "linear-gradient(135deg,#dce8f7,#b3d1f0)" }
                  }
                />
                <div className="preview-info">
                  <span className="public-badge">{status}</span>
                  <h4>{title}</h4>
                  <p>{category}</p>
                  <div className="preview-meta">
                    <span>0 responses</span>
                    <button onClick={e => e.stopPropagation()}>
                      <Icon name="arrow" size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ── Main export ─────────────────────────────────────────────── */
export default function Home() {
  const navigate    = useNavigate();
  const username    = getUsername();

  const [activeMenu, setActiveMenu] = useState("home");
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("All");

  // Data untuk Activity + Recommended (form milik user)
  const [myForms, setMyForms]       = useState([]);
  const [myLoading, setMyLoading]   = useState(true);

  useEffect(() => { loadMyForms(); }, []);

  async function loadMyForms() {
    setMyLoading(true);
    try {
      const res = await api.get("/form/user");
      setMyForms(res.data?.data?.forms ?? []);
    } catch { setMyForms([]); }
    finally { setMyLoading(false); }
  }

  return (
    <div className="home-page">
      <AppSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      <main className="main-content">
        <Header username={username} />

        <SearchFilter
          search={search}   setSearch={setSearch}
          category={category} setCategory={setCategory}
        />

        <div className="dashboard-grid">
          <CreateFormCard onCreateClick={() => navigate("/my-forms")} />
          <ActivityCard forms={myForms} loading={myLoading} />
          <RecommendedForms forms={myForms} loading={myLoading} />
          <ManageFormsCard totalForms={myForms.length} />
        </div>

        <FormPreviewGrid search={search} category={category} navigate={navigate} />
      </main>
    </div>
  );
}
