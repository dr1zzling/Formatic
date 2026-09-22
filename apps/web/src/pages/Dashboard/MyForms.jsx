import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api, { FORM_API_URL, flattenForm } from "../../utils/api";
import { addToTrash } from "./Trash";
import AlertModal from "../../components/AlertModal";
import { ImagePlus, Handshake, Plus, Search, PenLine, ClipboardList, Trash2, FileText, Download, BookOpen, X, ChevronRight, Copy, Check } from "lucide-react";
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
    <div className="rounded-2xl border overflow-hidden min-h-[310px] flex flex-col animate-pulse"
      style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
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
  const [subKategoriId, setSubKategoriId] = useState("");
  const [primaryList, setPrimaryList] = useState([]);
  const [subList, setSubList]         = useState([]);
  const [selectedPrimary, setSelectedPrimary] = useState("");
  const [banner, setBanner]           = useState(null);
  const [preview, setPreview]         = useState(null);
  const [tokenRespon, setTokenRespon] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  // Load primary kategori saat modal buka
  useEffect(() => {
    api.get("/kategori/primary").then(res => {
      const list = res.data?.data ?? [];
      setPrimaryList(list);
      if (list.length > 0) setSelectedPrimary(String(list[0].id));
      else {
        // Fallback jika DB belum ada data kategori
        const fallback = [{ id: 1, name: "ujian" }, { id: 2, name: "survei" }];
        setPrimaryList(fallback);
        setSelectedPrimary("1");
      }
    }).catch(() => {
      // Fallback offline
      const fallback = [{ id: 1, name: "ujian" }, { id: 2, name: "survei" }];
      setPrimaryList(fallback);
      setSelectedPrimary("1");
    });
  }, []);

  // Load sub kategori saat primary dipilih
  useEffect(() => {
    if (!selectedPrimary) return;
    api.get(`/kategori/sub/${selectedPrimary}`).then(res => {
      const list = res.data?.data ?? [];
      setSubList(list);
      if (list.length > 0) setSubKategoriId(String(list[0].id));
      else {
        // Kalau sub kosong, pakai primary id sebagai fallback
        setSubKategoriId(selectedPrimary);
        setSubList([]);
      }
    }).catch(() => {
      setSubList([]);
      setSubKategoriId(selectedPrimary);
    });
  }, [selectedPrimary]);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setBanner(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!title.trim())    { setError("Judul wajib diisi."); return; }
    // subKategoriId bisa dari sub atau primary sebagai fallback
    const kategoriId = subKategoriId || selectedPrimary;
    if (!kategoriId)      { setError("Pilih kategori terlebih dahulu."); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("sub_kategori", kategoriId);
      if (banner) fd.append("banner", banner);
      fd.append("token_respon", tokenRespon.trim());
      const res  = await fetch(`${FORM_API_URL}/form`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat form.");
      onCreated(data?.data?.form?.slug ?? data?.data?.form?.form_slug);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(10,30,60,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl shadow-[0_24px_50px_rgba(10,30,60,0.18)] flex flex-col"
        style={{ maxHeight: "calc(100dvh - 32px)", backgroundColor: "var(--fm-card)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — sticky */}
        <div className="flex items-center justify-between px-[22px] pt-5 pb-3 shrink-0 border-b border-[#edf3f7]">
          <h3 className="text-[17px] font-bold text-[#183056]">Buat Form Baru</h3>
          <button onClick={onClose} className="text-[#7290a9] hover:text-[#183056] text-[22px] leading-none transition-colors">×</button>
        </div>

        {/* Scrollable body */}
        <div className="px-[22px] py-[16px] flex flex-col gap-3.5 overflow-y-auto flex-1">
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
              className="w-full h-10 border border-[#d9e8f1] rounded-lg px-3.5 text-[14px] text-[#183056] outline-none bg-[#f7fbff] focus:border-[#3d91b2] focus:bg-white transition-all box-border mb-2"
              value={selectedPrimary}
              onChange={e => setSelectedPrimary(e.target.value)}
            >
              {primaryList.map(p => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
            {subList.length > 0 && (
              <select
                className="w-full h-10 border border-[#d9e8f1] rounded-lg px-3.5 text-[14px] text-[#183056] outline-none bg-[#f7fbff] focus:border-[#3d91b2] focus:bg-white transition-all box-border"
                value={subKategoriId}
                onChange={e => setSubKategoriId(e.target.value)}
              >
                {subList.map(s => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4d6a82] uppercase tracking-wider mb-1.5">Banner Form <span className="normal-case font-normal text-gray-400">(opsional)</span></label>
            <label className="relative w-full border-2 border-dashed border-[#c5dce8] rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer bg-[#f4fafd] hover:border-[#3d91b2] hover:bg-[#edf6fb] transition-all overflow-hidden" style={{ minHeight: preview ? "auto" : "72px" }}>
              {preview
                ? <img src={preview} className="w-full h-auto object-contain rounded-lg" alt="preview" style={{ maxHeight: "160px" }} />
                : <>
                    <ImagePlus size={20} className="leading-none text-[#3d91b2]" />
                    <span className="text-[11px] text-[#7290a9]">Klik untuk upload (JPG/PNG/WEBP, maks 5MB)</span>
                  </>
              }
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4d6a82] uppercase tracking-wider mb-1.5">
              Token Responden
              <span className="ml-1 text-[10px] text-[#8ca0ba] normal-case tracking-normal font-normal">(opsional)</span>
            </label>
            <input
              className="w-full h-10 border border-[#d9e8f1] rounded-lg px-3.5 text-[14px] text-[#183056] outline-none bg-[#f7fbff] focus:border-[#3d91b2] focus:bg-white focus:ring-4 focus:ring-[#3d91b2]/10 transition-all box-border"
              placeholder="Contoh: TOKEN123"
              value={tokenRespon}
              onChange={e => { setTokenRespon(e.target.value); setError(""); }}
            />
            <p className="text-[11px] text-[#8ca0ba] mt-1">Kosongkan jika form terbuka untuk umum.</p>
          </div>
        </div>

        {/* Footer — sticky */}
        <div className="flex gap-2.5 px-[22px] py-4 shrink-0 border-t border-[#edf3f7]">
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
  , document.body);
}
export default function MyForms() {
  const navigate  = useNavigate();
  const username  = getUsername();

  const [forms, setForms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActive] = useState("All");
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [showJoin, setShowJoin]     = useState(false);
  const [showGuide, setShowGuide]   = useState(false);
  const [alertModal, setAlertModal] = useState(null); // { type, title, message, onConfirm }
  const [confirmDelete, setConfirmDelete] = useState(null); // form to delete

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/form/user");
      setForms((res.data?.data?.forms ?? []).map(flattenForm));
    } catch { setForms([]); }
    finally { setLoading(false); }
  }

  const handleDeleteForm = async (form) => {
    setConfirmDelete(form);
  };

  const doDeleteForm = async (form) => {
    setConfirmDelete(null);
    const formSlug = form.slug ?? form.form_slug;
    try {
      const response = await fetch(`${FORM_API_URL}/form?form_slug=${formSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ status: "private" }),
      });
      if (!response.ok) throw new Error("Gagal memindahkan ke trash");
      addToTrash({ ...form, form_slug: formSlug, form_title: form.title ?? form.form_title });
      setForms(prev => prev.filter(f => (f.slug ?? f.form_slug) !== formSlug));
      setAlertModal({ type: "success", title: "Berhasil", message: "Form dipindahkan ke Trash!" });
    } catch (error) {
      console.error("Error delete:", error);
      setAlertModal({ type: "error", title: "Gagal", message: "Gagal menghapus form." });
    }
  };

  /* filter */
  const filtered = forms.filter(f => {
    const title = (f.title ?? f.form_title ?? "").toLowerCase();
    const cat   = (f.category ?? f.sub_kategori ?? f.primary_kategori ?? "").toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const matchCat =
      activeCategory === "All" ||
      (activeCategory === "Survey"       && (cat === "survei" || cat === "survey")) ||
      (activeCategory === "Quiz / Ujian" && cat === "ujian");
    return matchSearch && matchCat;
  });

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div
          className="min-h-screen px-4 sm:px-6 md:px-8 xl:px-[42px] py-6 md:py-[34px] pb-[80px] md:pb-[60px] box-border"
          style={{ background: "linear-gradient(135deg, var(--fm-bg) 0%, var(--fm-bg-2) 55%, var(--fm-bg-3) 100%)", color: "var(--fm-text)" }}
        >
          {/* ── Header ─────────────────────────────── */}
          <header className="flex items-center justify-between gap-4 mb-[25px] max-[800px]:flex-col max-[800px]:items-start pt-[52px] md:pt-0">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight" style={{ color: "var(--fm-text)" }}>My Forms</h1>
              <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--fm-text-2)" }}>Halo, {username}! Kelola semua form yang kamu buat.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowJoin(true)}
                className="inline-flex items-center gap-2 px-[19px] py-3 rounded-xl text-[14px] font-semibold border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 hover:-translate-y-0.5 transition-all"
              >
                <Handshake size={18} className="leading-none" />
                <span className="hidden sm:inline">Join Kolaborasi</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-[19px] py-3 rounded-xl text-white text-[14px] font-semibold shadow-[0_6px_15px_rgba(61,145,178,0.22)] hover:-translate-y-0.5 transition-all"
                style={{ background: "linear-gradient(135deg,#183056,#3d91b2)" }}
              >
                <Plus size={18} className="leading-none" /> Create Form
              </button>
            </div>
          </header>

          {/* ── Search ─────────────────────────────── */}
          <div
            className="flex items-center h-12 px-4 rounded-xl border mb-5 focus-within:ring-2 focus-within:ring-[#3d91b2] focus-within:border-transparent transition-all shadow-sm group"
            style={{
              backgroundColor: "var(--fm-card)",
              borderColor: "var(--fm-card-border)",
            }}
          >
            <Search size={18} className="text-[#3d91b2] mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search your forms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent! outline-none text-[14px] font-normal placeholder:text-gray-400 border-none! shadow-none! p-0"
              style={{
                backgroundColor: "transparent",
                color: "var(--fm-text)",
                border: "none",
                outline: "none",
                boxShadow: "none"
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs px-2 py-1 rounded-md transition"
                style={{
                  color: "var(--fm-text-2)",
                  backgroundColor: "var(--fm-hover)"
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* ── Category & Template Action ────────── */}
          <div className="flex items-center justify-between gap-3 mb-7 flex-wrap">
            <div className="flex gap-2.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`px-[18px] py-2 rounded-full text-[13px] font-medium border transition-all ${
                    activeCategory === c
                      ? "bg-[#183056] border-[#183056] text-white shadow-[0_4px_12px_rgba(24,48,86,0.25)]"
                      : "border-[#d6e5ee] hover:border-[#3d91b2]"
                  }`}
                  style={activeCategory !== c ? { backgroundColor: "var(--fm-card)", color: "var(--fm-text-2)" } : {}}
                  onClick={() => setActive(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border border-[#d6e5ee] hover:border-[#3d91b2] transition-all shadow-xs shrink-0 cursor-pointer"
              style={{
                backgroundColor: "var(--fm-card)",
                color: "var(--fm-text)",
                borderColor: "var(--fm-card-border)"
              }}
              title="Lihat Format & Unduh Template Soal"
            >
              <FileText size={16} className="text-[#3d91b2]" />
              <span>Format & Template Soal</span>
              <BookOpen size={14} className="text-gray-400 ml-0.5" />
            </button>
          </div>

          {/* ── Section header ─────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: "var(--fm-text)" }}>My Forms</h2>
              <span className="block mt-1 text-[12px]" style={{ color: "var(--fm-text-2)" }}>{loading ? "..." : `${filtered.length} forms`}</span>
            </div>
          </div>

          {/* ── Grid ───────────────────────────────── */}
          {loading && (
            <div className="grid grid-cols-4 gap-[18px] items-stretch max-[800px]:grid-cols-1">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-4 gap-[18px] items-stretch max-[800px]:grid-cols-1">
              {filtered.map((form, index) => {
                const banner = form.banner ?? form.form_banner;
                const cat    = form.category ?? form.sub_kategori ?? "";
                const status = form.status ?? form.setting?.status ?? "private";
                const large  = index % 4 === 0 || index % 4 === 3;

                return (
                  <div
                    key={form.id ?? form.form_id ?? index}
                    style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}
                    className="group rounded-2xl border overflow-hidden cursor-pointer flex flex-col min-h-[310px] shadow-[0_5px_16px_rgba(30,73,105,0.05)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(30,73,105,0.12)] transition-all"
                    onClick={() => navigate(`/form/${form.slug ?? form.form_slug}`)}
                  >
                    {/* Image */}
                    <div className="relative w-full overflow-hidden bg-[#dcecf4]" style={{ aspectRatio: "16/9" }}>
                      {banner ? (
                        <img src={`${FORM_API_URL}${banner}`} alt={form.form_title}
                          className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                          onError={e => { e.target.style.display = "none"; }} />
                      ) : form.image ? (
                        <img src={form.image} alt={form.form_title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-4xl opacity-50"
                          style={{ background: cat === "ujian" ? "linear-gradient(135deg,#ede9fe,#ddd6fe)" : "linear-gradient(135deg,#dbeafe,#bfdbfe)" }}>
                          {cat === "ujian" ? <PenLine size={34} className="text-violet-400" /> : <ClipboardList size={34} className="text-blue-400" />}
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
                      ><Trash2 size={14} /></button>
                    </div>

                    {/* Content */}
                    <div className="px-[17px] py-[14px] flex flex-col flex-1">
                      <h3 className="mb-2 text-[16px] font-bold text-[#183056] leading-snug truncate">{form.title ?? form.form_title ?? "Untitled"}</h3>
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
            <div className="text-center py-20" style={{ color: "var(--fm-text-2)" }}>
              <div className="w-[55px] h-[55px] mx-auto mb-4 rounded-2xl grid place-items-center"
                style={{ backgroundColor: "var(--fm-hover)" }}>
                <ClipboardList size={25} className="text-[#3d91b2]" />
              </div>
              <h3 className="text-[16px] font-bold mb-1" style={{ color: "var(--fm-text)" }}>
                {search ? "Form tidak ditemukan" : "Belum ada form"}
              </h3>
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

      {showGuide && (
        <TemplateGuideModal onClose={() => setShowGuide(false)} />
      )}

      {/* AlertModal — ganti browser alert/confirm */}
      <AlertModal
        open={!!confirmDelete}
        type="trash"
        title="Hapus Form?"
        message={`Form "${confirmDelete?.title ?? confirmDelete?.form_title}" akan dipindahkan ke Trash.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() => doDeleteForm(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
      <AlertModal
        open={!!alertModal}
        type={alertModal?.type ?? "alert"}
        title={alertModal?.title}
        message={alertModal?.message}
        onConfirm={() => setAlertModal(null)}
      />
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--fm-card)" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center"><Handshake size={18} className="text-violet-500" /></div>
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
            {loading ? "Bergabung..." : "Bergabung"}
          </button>
        </div>
      </div>
    </div>
  , document.body);
}

/* ── Template Guide Modal ───────────────────────────────────── */
function TemplateGuideModal({ onClose }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sections = [
    {
      type: "Pilihan Ganda (Satu Jawaban)",
      tipe: "Tipe: radio",
      tag: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      example: `1. Berapakah nilai dari akar persamaan √x + 16 jika x = 9?
A. 17
B. 19
C. 21
D. 25
Kunci: B Tipe: radio`,
      notes: [
        "Nomor soal diakhiri titik (1.) atau kurung (1))",
        "Pilihan jawaban pakai huruf kapital (A. / B. / C. / D.)",
        "Kunci: diisi huruf jawaban yang benar",
        "Tipe: radio untuk pilihan ganda satu jawaban",
      ],
    },
    {
      type: "Pilihan Ganda (Aljabar / Pecahan)",
      tipe: "Tipe: radio",
      tag: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
      example: `2. Bentuk sederhana dari pecahan matematika (a² - b²) / (a - b) adalah...
A. a - b
B. a + b
C. a × b
D. a / b
Kunci: B Tipe: radio`,
      notes: [
        "Mendukung simbol matematika standar seperti ², ³, √, ±, ×, ÷, /",
        "Kunci dan Tipe ditulis di baris setelah pilihan terakhir",
      ],
    },
    {
      type: "Kotak Centang (Banyak Jawaban)",
      tipe: "Tipe: checkbox",
      tag: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
      example: `3. Manakah bilangan prima di bawah ini?
A. 2
B. 4
C. 5
D. 9
Kunci: A, C Tipe: checkbox`,
      notes: [
        "Kunci bisa lebih dari satu, pisahkan dengan tanda koma (Kunci: A, C)",
        "Tipe: checkbox untuk multi-jawaban",
      ],
    },
    {
      type: "Jawaban Singkat / Esai",
      tipe: "Tipe: text",
      tag: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      example: `4. Sebutkan ibu kota negara Indonesia saat ini!
Kunci: - Tipe: text`,
      notes: [
        "Tidak perlu menulis pilihan jawaban A/B/C/D",
        "Tipe: text untuk isian teks bebas / esai",
      ],
    },
  ];

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border flex flex-col"
        style={{
          backgroundColor: "var(--fm-card)",
          borderColor: "var(--fm-card-border)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 rounded-t-3xl border-b px-6 py-4 flex items-center justify-between z-10"
          style={{
            backgroundColor: "var(--fm-card)",
            borderColor: "var(--fm-border)"
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--fm-hover)", color: "#3d91b2" }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold" style={{ color: "var(--fm-text)" }}>
                Panduan & Format Template Soal
              </h3>
              <p className="text-[12px]" style={{ color: "var(--fm-text-2)" }}>
                Format penulisan soal teks / file Microsoft Word (.docx)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: "var(--fm-text-2)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Info Banner */}
          <div
            className="rounded-2xl p-4 border text-[13px] leading-relaxed"
            style={{
              backgroundColor: "var(--fm-hover)",
              borderColor: "var(--fm-border)",
              color: "var(--fm-text)"
            }}
          >
            Tulis soal Anda di file <strong className="text-[#3d91b2]">Microsoft Word (.docx)</strong> sesuai format di bawah. Sistem otomatis mendeteksi nomor soal, pilihan opsi, kunci jawaban, dan tipenya.
          </div>

          {/* Format Sections */}
          {sections.map((s, idx) => (
            <div key={s.type} className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-[#3d91b2]" />
                  <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full border ${s.tag}`}>{s.type}</span>
                  <code
                    className="text-[11.5px] px-2 py-0.5 rounded-lg font-mono border"
                    style={{
                      backgroundColor: "var(--fm-hover)",
                      borderColor: "var(--fm-border)",
                      color: "var(--fm-text)"
                    }}
                  >
                    {s.tipe}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(s.example, idx)}
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer"
                  style={{
                    backgroundColor: "var(--fm-card)",
                    borderColor: "var(--fm-border)",
                    color: copiedIndex === idx ? "#10b981" : "var(--fm-text-2)"
                  }}
                  title="Salin contoh teks ini"
                >
                  {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                  {copiedIndex === idx ? "Tersalin!" : "Salin Teks"}
                </button>
              </div>

              {/* Code block */}
              <pre
                className="border rounded-xl px-4 py-3 text-[12.5px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto"
                style={{
                  backgroundColor: "var(--fm-input-bg)",
                  borderColor: "var(--fm-card-border)",
                  color: "var(--fm-text)"
                }}
              >
                {s.example}
              </pre>

              {/* Notes */}
              <ul className="space-y-1 pl-1">
                {s.notes.map((n, i) => (
                  <li key={i} className="text-[12px] flex items-start gap-1.5" style={{ color: "var(--fm-text-2)" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3d91b2] shrink-0" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Aturan umum */}
          <div
            className="rounded-2xl p-4 space-y-2 border"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              borderColor: "rgba(245, 158, 11, 0.3)"
            }}
          >
            <p className="text-[13px] font-bold text-amber-500">Aturan Penulisan:</p>
            <ul className="space-y-1.5">
              {[
                "Nomor soal diakhiri titik (1.) atau kurung tutup (1)).",
                "Pilihan jawaban pakai huruf kapital diakhiri titik (A.) atau kurung (A)).",
                "Kunci jawaban ditulis: Kunci: B — untuk checkbox multi jawaban: Kunci: A, C",
                "Tipe soal ditulis: Tipe: radio / checkbox / text",
                "Kunci dan Tipe boleh di satu baris yang sama setelah opsi terakhir.",
                "Pisahkan setiap butir soal dengan 1 baris kosong (Enter).",
              ].map((r, i) => (
                <li key={i} className="text-[12px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA unduh */}
          <div className="pt-1">
            <a
              href="/soal.docx"
              download="Template_Soal_FormMaker.docx"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-[13.5px] font-semibold hover:opacity-90 transition-all shadow-md"
              style={{ backgroundColor: "#1a4fa0" }}
            >
              <Download size={16} /> Unduh Template File Word (.docx)
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
