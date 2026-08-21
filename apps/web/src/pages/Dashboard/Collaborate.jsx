import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { Users, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

export default function Collaborate() {
  const { slug }             = useParams();
  const [searchParams]       = useSearchParams();
  const token                = searchParams.get("token") ?? "";
  const navigate             = useNavigate();

  const [form, setForm]      = useState(null);
  const [loading, setLoading]= useState(true);
  const [joining, setJoining]= useState(false);
  const [done, setDone]      = useState(false);
  const [error, setError]    = useState("");

  useEffect(() => {
    api.get("/form/slug", { params: { slug } })
      .then(res => setForm(res.data?.data))
      .catch(() => setError("Form tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleJoin() {
    setJoining(true); setError("");
    try {
      // Gunakan fetch langsung supaya interceptor logout tidak terpicu
      const res = await fetch(`http://localhost:3000/form/share?form_slug=${slug}`, {
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
          setError(msg || "Gagal bergabung sebagai collaborator.");
        }
        return;
      }
      setDone(true);
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally { setJoining(false); }
  }

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#f5f9ff] to-[#e6f0fb]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Memuat informasi form...</p>
      </div>
    </div>
  );

  /* ── Error load ──────────────────────────────────────── */
  if (!form && !loading) return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#f5f9ff] to-[#e6f0fb] px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm text-center border border-[#e5eef7]">
        <p className="text-4xl mb-3">😕</p>
        <p className="font-bold text-gray-800 mb-1">Form tidak ditemukan</p>
        <button onClick={() => navigate("/")} className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#1a4fa0]">Ke Beranda</button>
      </div>
    </div>
  );

  /* ── Success ─────────────────────────────────────────── */
  if (done) return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#f5f9ff] to-[#e6f0fb] px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm text-center border border-[#e5eef7]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 text-green-600 grid place-items-center">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-[20px] font-extrabold text-[#102f56] mb-1">Berhasil Bergabung!</h2>
        <p className="text-[14px] text-gray-400 mb-2">
          Kamu sekarang menjadi <span className="font-bold text-[#1a4fa0]">Collaborator</span> pada form:
        </p>
        <p className="font-semibold text-gray-700 mb-6">"{form?.title}"</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => navigate(`/form/${slug}`)}
            className="w-full py-3 rounded-xl text-white text-[14px] font-semibold bg-[#1a4fa0] hover:opacity-90 transition">
            Buka Form
          </button>
          <button onClick={() => navigate("/my-forms")}
            className="w-full py-3 rounded-xl text-[14px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
            My Forms
          </button>
        </div>
      </div>
    </div>
  );

  const title    = form?.title ?? "Form";
  const category = form?.category ?? "";
  const status   = form?.status ?? "private";

  /* ── Main ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#f5f9ff] to-[#e6f0fb] px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-[#e5eef7] overflow-hidden">

        {/* Top bar */}
        <div className="px-7 pt-7 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#1a4fa0] rounded-lg flex items-center justify-center">
              <span className="text-sm font-extrabold text-white">F</span>
            </div>
            <span className="font-bold text-[#1a4fa0] text-[15px]">Formatic</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Users size={20} className="text-[#1a4fa0]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Undangan Collaborator</p>
              <h1 className="text-[17px] font-extrabold text-gray-900 leading-tight mt-0.5">{title}</h1>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-7 py-5">
          <div className="bg-blue-50 rounded-xl p-4 mb-5">
            <p className="text-[13px] text-[#1a4fa0] font-medium leading-relaxed">
              Kamu diundang untuk bergabung sebagai <strong>Collaborator</strong> pada form ini.
              Sebagai collaborator, kamu dapat melihat dan mengelola respons form bersama creator.
            </p>
          </div>

          <div className="space-y-2.5 mb-5">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[12px] text-gray-400">Nama Form</span>
              <span className="text-[13px] font-semibold text-gray-700 max-w-[200px] truncate text-right">{title}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-[12px] text-gray-400">Kategori</span>
              <span className="text-[13px] font-semibold text-gray-700">{category}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[12px] text-gray-400">Status</span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${status === "public" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {status === "public" ? "Public" : "Private"}
              </span>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <button onClick={handleJoin} disabled={joining}
              className="w-full py-3.5 rounded-xl text-white text-[14px] font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition"
              style={{ background: "linear-gradient(135deg,#1a4fa0,#1e6fc7)" }}>
              {joining ? <><Loader2 size={16} className="animate-spin" /> Bergabung...</> : <><Users size={16} /> Bergabung sebagai Collaborator</>}
            </button>
            <button onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl text-[13px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
