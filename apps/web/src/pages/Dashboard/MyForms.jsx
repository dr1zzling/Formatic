import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api, { FORM_API_URL } from "../../utils/api";
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
    <div className="rounded-2xl bg-white border border-[#dceaf2] overflow-hidden min-h-[310px] flex flex-col animate-pulse">
      <div className="w-full h-[165px] bg-[#e8f0fb]" />
      <div className="px-[17px] py-[15px] flex-1 flex flex-col gap-3">
        <div className="h-2 w-[30%] rounded bg-[#e8f0fb]" />
        <div className="h-2.5 w-[85%] rounded bg-[#e8f0fb]" />
        <div className="h-2.5 w-[65%] rounded bg-[#e8f0fb]" />
        <div className="h-2 w-[45%] rounded bg-[#e8f0fb] mt-auto" />
      </div>
    </div>
  );
}

/* ── Create Form Modal ───────────────────────────────────────── */
function CreateModal({ onClose, onCreated }) {
  const [title, setTitle]             = useState("");
  const [cat, setCat] = useState("ujian");
  const [banner, setBanner]           = useState(null);
  const [preview, setPreview]         = useState(null);
  const [tokenRespon, setTokenRespon] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

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
      fd.append("token_respon", tokenRespon.trim());
      const res  = await fetch(`${FORM_API_URL}/form`, {
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      style={{ background: "rgba(10,30,60,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl overflow-hidden shadow-[0_24px_50px_rgba(10,30,60,0.18)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-[22px] pt-5">
          <h3 className="text-[17px] font-bold text-[#183056]">Buat Form Baru</h3>
          <button onClick={onClose} className="text-[#7290a9] hover:text-[#183056] text-[22px] leading-none transition-colors">×</button>
        </div>

        <div className="px-[22px] py-[18px] flex flex-col gap-4">
          {error && <div className="text-[12.5px] text-[#d94f4f] bg-[#fff0f0] px-3 py-2 rounded-lg border border-[#f5c0c0]">{error}</div>}

          <div>
            <label className="block text-[11px] font-bold text-[#4d6a82] uppercase tracking-wider mb-1.5">Judul Form</label>
            <input
              className="w-full h-10 border border-[#d9e8f1] rounded-lg px-3.5 text-[14px] text-[#183056] outline-none bg-[#f7fbff] focus:border-[#3d91b2] focus:bg-white focus:ring-4 focus:ring-[#3d91b2]/10 transition-all box-border"
              placeholder="Contoh: Kuesioner Kepuasan Pelanggan"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(""); }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4d6a82] uppercase tracking-wider mb-1.5">Kategori</label>
            <select
              className="w-full h-10 border border-[#d9e8f1] rounded-lg px-3.5 text-[14px] text-[#183056] outline-none bg-[#f7fbff] focus:border-[#3d91b2] focus:bg-white focus:ring-4 focus:ring-[#3d91b2]/10 transition-all box-border"
              value={cat}
              onChange={e => setCat(e.target.value)}
            >
              <option value="ujian">Ujian / Quiz</option>
              <option value="survei">Survey</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4d6a82] uppercase tracking-wider mb-1.5">Banner Form</label>
            <label className="relative w-full h-20 border-2 border-dashed border-[#c5dce8] rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer bg-[#f4fafd] hover:border-[#3d91b2] hover:bg-[#edf6fb] transition-all overflow-hidden">
              {preview
                ? <img src={preview} className="absolute inset-0 w-full h-full object-cover" alt="preview" />
                : <>
                    <span className="text-[22px] leading-none">🖼️</span>
                    <span className="text-[11.5px] text-[#7290a9]">Klik untuk upload (JPG/PNG/WEBP, maks 5MB)</span>
                  </>
              }
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4d6a82] uppercase tracking-wider mb-1.5">
              Token Responden
              <span className="ml-1 text-[10px] text-[#8ca0ba] normal-case tracking-normal font-normal">(opsional — kosongkan jika form terbuka untuk umum)</span>
            </label>
            <input
              className="w-full h-10 border border-[#d9e8f1] rounded-lg px-3.5 text-[14px] text-[#183056] outline-none bg-[#f7fbff] focus:border-[#3d91b2] focus:bg-white focus:ring-4 focus:ring-[#3d91b2]/10 transition-all box-border"
              placeholder="Contoh: TOKEN123"
              value={tokenRespon}
              onChange={e => { setTokenRespon(e.target.value); setError(""); }}
            />
            <p className="text-[11px] text-[#8ca0ba] mt-1">Token digunakan untuk membatasi siapa yang bisa mengisi form ini.</p>
          </div>
        </div>

        <div className="flex gap-2.5 px-[22px] pb-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#d6e5ee] bg-white text-[#55738d] text-[13.5px] font-semibold hover:bg-[#f4fafd] transition-all">Batal</button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 h-10 rounded-lg text-white text-[13.5px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#183056,#3d91b2)" }}
          >
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
  const [showJoin, setShowJoin]     = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/form/user");
      setForms(res.data?.data?.forms ?? []);
    } catch { setForms([]); }
    finally { setLoading(false); }
  }

  const handleDeleteForm = async (form) => {
    const isConfirmed = window.confirm(`Yakin ingin menghapus form "${form.form_title}"?`);
    if (!isConfirmed) return;
    try {
      const response = await fetch(`http://localhost:3000/form?form_slug=${form.form_slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Gagal menghapus data dari server");
      setForms(prev => prev.filter(f => f.form_slug !== form.form_slug));
      alert("Form berhasil dihapus!");
    } catch (error) {
      console.error("Error delete:", error);
      alert("Gagal menghapus form.");
    }
  };

  /* filter */
  const filtered = forms.filter(f => {
    const title = (f.form_title ?? "").toLowerCase();
    const cat   = f.category ?? "";
    const matchSearch = title.includes(search.toLowerCase());
    const matchCat =
      activeCategory === "All" ||
      (activeCategory === "Survey"       && (cat === "survey" || cat === "survei")) ||
      (activeCategory === "Quiz / Ujian" && cat === "ujian");
    return matchSearch && matchCat;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 min-w-0" style={{ width: "calc(100% - 366px)" }}>
        <div
          className="min-h-screen px-[42px] py-[34px] pb-[60px] max-[1050px]:px-[25px] max-[800px]:px-4 max-[800px]:py-[28px] box-border"
          style={{ background: "linear-gradient(135deg,#f5faff 0%,#eef7fc 55%,#e6f3fa 100%)", color: "#102f56" }}
        >
          {/* ── Header ─────────────────────────────── */}
          <header className="flex items-center justify-between gap-4 mb-[25px] max-[800px]:flex-col max-[800px]:items-start">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#102f56]">My Forms</h1>
              <p className="mt-1.5 text-[13.5px] text-[#7290a9]">Halo, {username}! Kelola semua form yang kamu buat.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowJoin(true)}
                className="inline-flex items-center gap-2 px-[19px] py-3 rounded-xl text-[14px] font-semibold border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 hover:-translate-y-0.5 transition-all"
              >
                <span className="text-lg leading-none">🤝</span>
                <span className="hidden sm:inline">Join Kolaborasi</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-[19px] py-3 rounded-xl text-white text-[14px] font-semibold shadow-[0_6px_15px_rgba(61,145,178,0.22)] hover:-translate-y-0.5 transition-all"
                style={{ background: "linear-gradient(135deg,#183056,#3d91b2)" }}
              >
                <span className="text-lg leading-none">＋</span> Create Form
              </button>
            </div>
          </header>

          {/* ── Search ─────────────────────────────── */}
          <div className="flex items-center h-11 px-4 rounded-xl bg-white/90 border border-[#d9e8f1] mb-4 focus-within:border-[#3d91b2] focus-within:ring-4 focus-within:ring-[#3d91b2]/10 transition-all">
            <span className="text-[19px] text-[#3d91b2] mr-2.5">⌕</span>
            <input
              type="text"
              placeholder="Search your forms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[14px] text-[#183056] placeholder:text-[#9bb0bf]"
            />
          </div>

          {/* ── Category ───────────────────────────── */}
          <div className="flex gap-2.5 mb-7 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`px-[18px] py-2 rounded-full text-[13px] font-medium border transition-all ${
                  activeCategory === c
                    ? "bg-[#183056] border-[#183056] text-white shadow-[0_4px_12px_rgba(24,48,86,0.25)]"
                    : "bg-white/80 border-[#d6e5ee] text-[#55738d] hover:border-[#3d91b2] hover:text-[#183056]"
                }`}
                onClick={() => setActive(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* ── Section header ─────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#183056]">My Forms</h2>
              <span className="block mt-1 text-[12px] text-[#87a1b5]">{loading ? "..." : `${filtered.length} forms`}</span>
            </div>
          </div>

          {/* ── Grid ───────────────────────────────── */}
          {loading && (
            <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-[18px] items-stretch max-[1050px]:grid-cols-[1fr_0.8fr] max-[800px]:grid-cols-1">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-[18px] items-stretch max-[1050px]:grid-cols-[1fr_0.8fr] max-[800px]:grid-cols-1">
              {filtered.map((form, index) => {
                const banner = form.form_banner ?? form.banner;
                const cat    = form.category ?? "";
                const status = form.form_status ?? "private";
                const large  = index % 4 === 0 || index % 4 === 3;

                return (
                  <div
                    key={form.form_id ?? index}
                    className="group rounded-2xl bg-white/95 border border-[#dceaf2] overflow-hidden cursor-pointer flex flex-col min-h-[310px] shadow-[0_5px_16px_rgba(30,73,105,0.05)] hover:-translate-y-1 hover:border-[#b7d7e6] hover:shadow-[0_12px_28px_rgba(30,73,105,0.12)] transition-all"
                    onClick={() => navigate(`/form/${form.form_slug}`)}
                  >
                    {/* Image */}
                    <div className={`relative w-full overflow-hidden bg-[#dcecf4] ${large ? "h-[178px]" : "h-[145px]"}`}>
                      {banner ? (
                        <img src={`${FORM_API_URL}${banner}`} alt={form.form_title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          onError={e => { e.target.style.display = "none"; }} />
                      ) : form.image ? (
                        <img src={form.image} alt={form.form_title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-4xl opacity-50"
                          style={{ background: cat === "ujian" ? "linear-gradient(135deg,#ede9fe,#ddd6fe)" : "linear-gradient(135deg,#dbeafe,#bfdbfe)" }}>
                          {cat === "ujian" ? "📝" : "📋"}
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                        cat === "ujian" ? "bg-[#eee7ff]/95 text-[#7850d9]" : "bg-[#ebf8fc]/95 text-[#2991b1]"
                      }`}>
                        {cat === "ujian" ? "Quiz" : cat || "Form"}
                      </span>
                      <button
                        className="absolute top-2 right-2.5 w-7 h-7 rounded-full bg-white/90 text-[#183056] text-[18px] leading-none grid place-items-center hover:bg-white transition-colors"
                        onClick={e => { e.stopPropagation(); handleDeleteForm(form); }}
                      >🗑️</button>
                    </div>

                    {/* Content */}
                    <div className="px-[17px] py-[14px] flex flex-col flex-1">
                      <h3 className="mb-2 text-[16px] font-bold text-[#183056] leading-snug truncate">{form.form_title ?? "Untitled"}</h3>
                      <p className="mb-3 text-[12.5px] text-[#7892a6] line-clamp-2">{cat || "—"}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#3d91b2] whitespace-nowrap mb-3">
                        <span>▧ — Questions</span>
                        <span>•</span>
                        <span>0 Responses</span>
                      </div>
                      <div className="mt-auto pt-3.5 border-t border-[#edf3f7] flex items-center justify-between text-[10px] text-[#9aafbd]">
                        <span className="font-semibold" style={{ color: status === "public" ? "#22a06b" : "#7892a6" }}>
                          {status === "public" ? "● Published" : "○ Draft"}
                        </span>
                        <span className="w-6 h-6 rounded-full grid place-items-center bg-[#edf7fb] text-[#2688aa] text-[14px] transition-all group-hover:bg-[#3d91b2] group-hover:text-white">→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Empty state ─────────────────────────── */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-[#7892a6]">
              <div className="w-[55px] h-[55px] mx-auto mb-4 rounded-2xl bg-[#e4f2f8] text-[#3d91b2] text-[25px] grid place-items-center">□</div>
              <h3 className="text-[16px] font-bold text-[#183056] mb-1">{search ? "Form tidak ditemukan" : "Belum ada form"}</h3>
              <p className="text-[12.5px]">
                {search
                  ? "Coba kata kunci lain atau pilih kategori berbeda."
                  : "Buat form pertamamu dengan klik tombol Create Form!"}
              </p>
            </div>
          )}
        </div>
      </main>

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

      {showJoin && (
        <JoinModal onClose={() => setShowJoin(false)} onJoined={() => { setShowJoin(false); load(); }} />
      )}
    </div>
  );
}

/* ── Join Collaborator Modal ─────────────────────────────────── */
function JoinModal({ onClose, onJoined }) {
  const navigate = useNavigate();
  const [link, setLink]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleJoin() {
    setError("");
    let slug = "", token = "";
    try {
      const url = new URL(link.trim().startsWith("http") ? link.trim() : `http://localhost${link.trim()}`);
      const parts = url.pathname.split("/");
      const formIdx = parts.indexOf("form");
      if (formIdx !== -1) slug = parts[formIdx + 1] ?? "";
      token = url.searchParams.get("token") ?? "";
    } catch {
      setError("Format link tidak valid."); return;
    }

    if (!slug || !token) { setError("Link tidak valid atau token tidak ditemukan."); return; }

    setLoading(true);
    try {
      // Gunakan fetch langsung supaya interceptor logout tidak terpicu
      const res = await fetch(`${FORM_API_URL}/form/share?form_slug=${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ token_collab: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message ?? "";
        if (msg.toLowerCase().includes("sudah")) {
          setError("Kamu sudah menjadi bagian dari form ini.");
        } else if (msg.toLowerCase().includes("token")) {
          setError("Token tidak valid atau sudah kadaluarsa.");
        } else {
          setError(msg || "Gagal bergabung. Pastikan link benar.");
        }
        return;
      }
      onJoined();
      navigate(`/form/${slug}`);
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-[420px] bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-xl">🤝</div>
            <div>
              <h3 className="text-[16px] font-bold text-[#183056]">Join Kolaborasi</h3>
              <p className="text-[11px] text-[#7290a9]">Masukkan link undangan collaborator</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#7290a9] hover:text-[#183056] text-[22px] leading-none">×</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="text-[12.5px] text-red-600 bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">{error}</div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#4d6a82] uppercase tracking-wider mb-1.5">Link Undangan</label>
            <input
              className="w-full h-11 border border-[#d9e8f1] rounded-lg px-3.5 text-[13.5px] text-[#183056] outline-none bg-[#f7fbff] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-100 transition-all box-border"
              placeholder="https://localhost:5173/form/slug/collaborate?token=..."
              value={link}
              onChange={e => { setLink(e.target.value); setError(""); }}
            />
            <p className="text-[11px] text-[#7290a9] mt-1.5">Paste link yang dikirim oleh creator form.</p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 h-11 rounded-lg border border-[#d6e5ee] bg-white text-[#55738d] text-[13.5px] font-semibold hover:bg-[#f4fafd] transition-all">
            Batal
          </button>
          <button onClick={handleJoin} disabled={loading || !link.trim()}
            className="flex-1 h-11 rounded-lg text-white text-[13.5px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#6d28d9,#7c3aed)" }}>
            {loading ? "Bergabung..." : "Bergabung 🤝"}
          </button>
        </div>
      </div>
    </div>
  );
}
