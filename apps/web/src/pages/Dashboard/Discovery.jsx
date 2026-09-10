import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { FORM_API_URL } from "../../utils/api";
import { Search, X, BookOpen, Copy, Check, FileText, ClipboardList } from "lucide-react";
import RichTextDisplay from "../../components/RichTextDisplay";

const CATEGORIES = ["Semua", "ujian", "survei"];
const CHART_COLORS = ["#3d91ef","#19c26b","#31b8b2","#ff626b","#a55be9","#f5a623"];

export default function Discovery() {
  const navigate = useNavigate();
  const [forms, setForms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("Semua");
  const [selected, setSelected] = useState(null); // form yang dipilih untuk preview
  const [soal, setSoal]         = useState([]);
  const [soalLoading, setSoalLoading] = useState(false);
  const [copying, setCopying]   = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [myForms, setMyForms]   = useState([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [targetSlug, setTargetSlug] = useState("");

  useEffect(() => {
    api.get("/form").then(res => {
      setForms(res.data?.data ?? []);
    }).catch(() => setForms([])).finally(() => setLoading(false));

    // Load my forms untuk pilih tujuan salin
    api.get("/form/user").then(res => {
      const all = res.data?.data?.forms ?? [];
      setMyForms(all.filter(f => f.access_type === "Creator"));
    }).catch(() => {});
  }, []);

  async function openForm(form) {
    setSelected(form);
    setSoal([]);
    setSoalLoading(true);
    try {
      const res = await api.get("/form/slug", { params: { slug: form.slug } });
      const f   = res.data?.data;
      const raw = f?.soal ?? [];
      const flat = raw.length > 0 && raw[0]?.soal
        ? raw.flatMap(p => p.soal ?? [])
        : raw;
      setSoal(flat);
    } catch { setSoal([]); }
    finally { setSoalLoading(false); }
  }

  async function copyToForm() {
    if (!targetSlug || !soal.length) return;
    setCopying(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      const payload = soal.map((s) => ({
        soal: {
          question: s.question,
          type: s.type,
          page: s.page ?? 1,
          score: s.score ?? null,
        },
        options: (s.options ?? []).map(o => ({
          value: o.value ?? o.option_value ?? "",
          is_correct: false, // sembunyikan jawaban benar saat salin
        })),
      }));
      fd.append("data", JSON.stringify(payload));
      const res = await fetch(`${FORM_API_URL}/form/soal?form_slug=${targetSlug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        setCopyDone(true);
        setShowCopyModal(false);
        setTimeout(() => { setCopyDone(false); }, 2500);
      }
    } catch {}
    finally { setCopying(false); }
  }

  const filtered = forms.filter(f => {
    const matchSearch = (f.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "Semua" || f.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="min-h-screen px-4 sm:px-6 md:px-8 xl:px-[42px] py-6 md:py-[34px] pb-[80px] md:pb-[60px]"
          style={{ background: "linear-gradient(135deg, var(--fm-bg) 0%, var(--fm-bg-2) 55%, var(--fm-bg-3) 100%)", color: "var(--fm-text)" }}>

          {/* Header */}
          <header className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--fm-hover)", color: "#1a4fa0" }}>
                <Search size={20} />
              </div>
              <div>
                <h1 className="text-[24px] font-extrabold tracking-tight" style={{ color: "var(--fm-text)" }}>Discovery</h1>
                <p className="text-[13px]" style={{ color: "var(--fm-text-2)" }}>Jelajahi soal-soal dari form publik</p>
              </div>
            </div>
          </header>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari form..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-[14px] outline-none transition"
                style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-border)", color: "var(--fm-text)" }}
              />
            </div>
            <div className="flex gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold border transition capitalize"
                  style={category === c
                    ? { backgroundColor: "#1a4fa0", color: "#fff", borderColor: "#1a4fa0" }
                    : { backgroundColor: "var(--fm-card)", color: "var(--fm-text-2)", borderColor: "var(--fm-border)" }
                  }>
                  {c === "Semua" ? "Semua" : c === "ujian" ? "Ujian" : "Survei"}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl border animate-pulse" style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)", minHeight: 180 }} />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400"><Search size={26} /></div>
              <p className="font-bold text-[16px]" style={{ color: "var(--fm-text)" }}>Tidak ada form ditemukan</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--fm-text-2)" }}>Coba kata kunci lain</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((form, i) => {
                const banner = form.banner;
                return (
                  <div key={form.id ?? i}
                    onClick={() => openForm(form)}
                    className="rounded-2xl border overflow-hidden cursor-pointer flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all"
                    style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-card-border)" }}>
                    {/* Banner */}
                    <div className="w-full bg-[#e8f0fb] overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      {banner
                        ? <img src={`${FORM_API_URL}${banner}`} alt={form.title}
                            className="w-full h-full object-contain" />
                        : <div className="w-full h-full grid place-items-center opacity-40 text-gray-500">
                            {form.category === "ujian" ? <FileText size={28} /> : <ClipboardList size={28} />}
                          </div>
                      }
                    </div>
                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col gap-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${form.category === "ujian" ? "text-purple-500" : "text-blue-500"}`}>
                        {form.category}
                      </span>
                      <p className="text-[14px] font-bold leading-tight line-clamp-2" style={{ color: "var(--fm-text)" }}>{form.title}</p>
                      <div className="flex items-center gap-1 mt-auto pt-2">
                        <BookOpen size={12} className="text-gray-400" />
                        <span className="text-[11px]" style={{ color: "var(--fm-text-2)" }}>Lihat soal</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => { setSelected(null); setSoal([]); }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{ backgroundColor: "var(--fm-card)" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
              style={{ borderColor: "var(--fm-border)" }}>
              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-bold truncate" style={{ color: "var(--fm-text)" }}>{selected.title}</h2>
                <span className={`text-[11px] font-semibold uppercase ${selected.category === "ujian" ? "text-purple-500" : "text-blue-500"}`}>
                  {selected.category}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* Salin ke form */}
                {soal.length > 0 && (
                  <button
                    onClick={() => setShowCopyModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition"
                    style={{ backgroundColor: copyDone ? "#16a34a" : "#1a4fa0", color: "#fff", borderColor: copyDone ? "#16a34a" : "#1a4fa0" }}>
                    {copyDone ? <><Check size={13} /> Tersalin!</> : <><Copy size={13} /> Salin ke Form</>}
                  </button>
                )}
                <button onClick={() => { setSelected(null); setSoal([]); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[18px] transition hover:bg-gray-100"
                  style={{ color: "var(--fm-text-2)" }}>×</button>
              </div>
            </div>

            {/* Soal list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {soalLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!soalLoading && soal.length === 0 && (
                <p className="text-center text-[14px] py-8" style={{ color: "var(--fm-text-2)" }}>Tidak ada soal.</p>
              )}
              {!soalLoading && soal.map((s, i) => (
                <div key={s.id ?? i} className="rounded-xl border p-4"
                  style={{ backgroundColor: "var(--fm-bg)", borderColor: "var(--fm-card-border)" }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-8 h-8 rounded-lg text-[13px] font-extrabold grid place-items-center shrink-0"
                      style={{ backgroundColor: "var(--fm-hover)", color: "#1a4fa0" }}>{i + 1}</span>
                    <div className="flex-1">
                      <RichTextDisplay content={s.question} className="text-[15px] font-semibold leading-snug" style={{ color: "var(--fm-text)" }} />
                      <span className="text-[11px] font-medium mt-1 block" style={{ color: "#1a4fa0" }}>
                        {s.type === "radio" ? "Pilihan Ganda" : s.type === "checkbox" ? "Kotak Centang" : s.type === "text" ? "Jawaban Singkat" : s.type}
                      </span>
                    </div>
                  </div>
                  {/* Opsi — tampilkan tapi sembunyikan yang benar */}
                  {(s.options ?? []).length > 0 && (
                    <div className="space-y-2 ml-11">
                      {(s.options ?? []).map((opt, oi) => (
                        <div key={opt.id ?? oi}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[13px]"
                          style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-border)", color: "var(--fm-text)" }}>
                          <span className="w-5 h-5 rounded border grid place-items-center shrink-0 text-[10px] font-bold"
                            style={{ borderColor: "var(--fm-border)", color: "var(--fm-text-2)" }}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {opt.value ?? opt.option_value ?? `Opsi ${oi + 1}`}
                        </div>
                      ))}
                    </div>
                  )}
                  {s.type === "text" && (
                    <div className="ml-11 px-3 py-2 rounded-lg border text-[13px] italic"
                      style={{ backgroundColor: "var(--fm-card)", borderColor: "var(--fm-border)", color: "var(--fm-text-2)" }}>
                      Jawaban singkat...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Copy to Form Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowCopyModal(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6"
            style={{ backgroundColor: "var(--fm-card)" }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold mb-1" style={{ color: "var(--fm-text)" }}>Salin Soal ke Form</h3>
            <p className="text-[13px] mb-4" style={{ color: "var(--fm-text-2)" }}>Pilih form tujuan. Soal akan ditambahkan ke form tersebut.</p>

            {myForms.length === 0 ? (
              <p className="text-[13px] text-center py-3" style={{ color: "var(--fm-text-2)" }}>Belum ada form. Buat form dulu di My Forms.</p>
            ) : (
              <select
                value={targetSlug}
                onChange={e => setTargetSlug(e.target.value)}
                className="w-full border rounded-xl px-3 py-2.5 text-[14px] outline-none mb-4"
                style={{ backgroundColor: "var(--fm-input-bg)", borderColor: "var(--fm-border)", color: "var(--fm-text)" }}>
                <option value="">-- Pilih form tujuan --</option>
                {myForms.map(f => (
                  <option key={f.form_slug} value={f.form_slug}>{f.form_title}</option>
                ))}
              </select>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowCopyModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-[14px] font-semibold transition"
                style={{ borderColor: "var(--fm-border)", color: "var(--fm-text-2)", backgroundColor: "var(--fm-card)" }}>
                Batal
              </button>
              <button
                onClick={copyToForm}
                disabled={copying || !targetSlug}
                className="flex-1 py-2.5 rounded-xl text-white text-[14px] font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: "#1a4fa0" }}>
                {copying ? "Menyalin..." : "Salin Soal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
