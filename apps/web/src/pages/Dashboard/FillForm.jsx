import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { ArrowLeft, Send, Check, CheckCircle2, UploadCloud, FileText } from "lucide-react";
import { saveToHistory } from "./History";

const TYPE_LABEL = {
  radio: "Pilihan Ganda",
  checkbox: "Kotak Centang",
  text: "Jawaban Singkat",
  file: "Unggah File",
};

function fallbackLabel(opt, i) {
  return opt.option_value?.trim() || `Opsi ${i + 1}`;
}

const inputCls =
  "w-full rounded-xl border border-[#dbe5f0] bg-white px-4 py-3 text-[15px] text-[#102f56] outline-none focus:border-[#1a4fa0] focus:ring-4 focus:ring-[#1a4fa0]/10 transition-all placeholder:text-gray-300";

export default function FillForm() {
  const { slug }        = useParams();
  const navigate        = useNavigate();

  const [form, setForm]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [answers, setAnswers]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/form/slug", { params: { slug } });
        setForm(res.data?.data);
        setError("");
      } catch {
        setError("Form tidak ditemukan atau sudah tidak tersedia.");
      } finally { setLoading(false); }
    })();
  }, [slug]);

  function setAnswer(soalId, value) {
    setAnswers((prev) => ({ ...prev, [soalId]: value }));
  }

  function toggleOption(soal, opt) {
    const current = answers[soal.id];
    if (soal.type === "radio") {
      setAnswer(soal.id, opt.id);
    } else {
      const list = Array.isArray(current) ? current : [];
      setAnswer(
        soal.id,
        list.includes(opt.id) ? list.filter((id) => id !== opt.id) : [...list, opt.id]
      );
    }
  }

  function hasAnswer(soal) {
    const a = answers[soal.id];
    if (soal.type === "file") return a?.file != null;
    if (soal.type === "checkbox") return Array.isArray(a) && a.length > 0;
    return Boolean(a && a !== "");
  }

  async function submit() {
    const empty = (form?.soal ?? []).find((s) => !hasAnswer(s));
    if (empty) {
      setSubmitError(`Pertanyaan "${empty.question || "Wajib"}" belum dijawab.`);
      return;
    }

    setSubmitting(true); setSubmitError("");
    try {
      const fd = new FormData();
      const payload = [];

      for (const soal of form?.soal ?? []) {
        const a = answers[soal.id];
        const jawaban = { soal_id: soal.id };

        if (soal.type === "radio") {
          jawaban.soal_option_id = a;
        } else if (soal.type === "checkbox") {
          jawaban.soal_option_id = Array.isArray(a) ? a : null;
        } else if (soal.type === "text") {
          jawaban.answer_text = a;
        } else if (soal.type === "file" && a?.file) {
          jawaban.file_name = a.file.name;
          fd.append("files", a.file);
        }
        payload.push({ jawaban });
      }

      fd.append("data", JSON.stringify(payload));
      await api.post(`/form/submit`, fd, { params: { form_slug: slug } });
      // Simpan ke history lokal
      saveToHistory(slug, form?.title ?? form?.form_title, form?.category);
      setDone(true);
    } catch (e) {
      const status = e.response?.status;
      if (status === 409) {
        setSubmitError("Kamu sudah mengisi form ini. Tidak bisa mengisi dua kali.");
      } else {
        setSubmitError(e.response?.data?.message || e.message || "Gagal mengirim jawaban.");
      }
    } finally { setSubmitting(false); }
  }

  /* ── Loading ────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen grid place-items-center" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#1a4fa0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Memuat form...</p>
      </div>
    </div>
  );

  /* ── Error ──────────────────────────────────────────── */
  if (error) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border border-[#e5eef7]">
        <p className="text-3xl mb-3">😕</p>
        <p className="font-bold text-gray-800 mb-1">Form tidak ditemukan</p>
        <p className="text-[14px] text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl text-white text-[14px] font-semibold" style={{ backgroundColor: "#1a4fa0" }}>Ke Beranda</button>
      </div>
    </div>
  );

  /* ── Success ────────────────────────────────────────── */
  if (done) return (
    <div className="min-h-screen grid place-items-center px-4" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="bg-white rounded-3xl shadow-[0_16px_50px_rgba(23,64,120,0.12)] p-10 max-w-sm text-center border border-[#e5eef7]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 text-green-600 grid place-items-center">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-[19px] font-extrabold text-[#102f56] mb-1">Jawaban terkirim</h2>
        <p className="text-[14px] text-gray-400 mb-6">Terima kasih, jawabanmu sudah tercatat.</p>
        <button onClick={() => navigate("/")} className="w-full py-3 rounded-xl text-white text-[14px] font-semibold" style={{ backgroundColor: "#1a4fa0" }}>Kembali ke Beranda</button>
      </div>
    </div>
  );

  const title = form?.title ?? form?.form_title ?? "Form";

  return (
    <div className="min-h-screen px-4 py-8 md:py-12" style={{ background: "linear-gradient(135deg,#f7fafd 0%,#eef5fb 60%,#e6f0f9 100%)" }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1a4fa0] hover:underline mb-6">
          <ArrowLeft size={16} /> Kembali
        </button>

        {/* Form header */}
        <div className="bg-white rounded-2xl border border-[#e5eef7] shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-7 mb-5">
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#102f56] leading-snug">{title}</h1>
          <p className="mt-1 text-[13.5px] text-gray-400">{form?.category}</p>
        </div>

        {/* Questions */}
        {(form?.soal ?? []).map((soal, qi) => (
          <div key={soal.id ?? qi} className="bg-white rounded-2xl border border-[#e5eef7] shadow-[0_10px_34px_rgba(23,64,120,0.08)] p-6 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-9 h-9 rounded-xl bg-[#eef5fb] text-[#1a4fa0] text-[14px] font-extrabold grid place-items-center shrink-0">{qi + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-[#102f56] leading-snug">{soal.question}</p>
                <span className="text-[12px] font-medium text-[#1a4fa0]">{TYPE_LABEL[soal.type] ?? soal.type}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#c9393f] shrink-0">*</span>
            </div>

            {/* Radio / Checkbox */}
            {(soal.type === "radio" || soal.type === "checkbox") && (
              <div className="space-y-2.5">
                {(soal.options ?? []).map((opt, oi) => {
                  const selected = soal.type === "radio"
                    ? answers[soal.id] === opt.id
                    : (Array.isArray(answers[soal.id]) && answers[soal.id].includes(opt.id));
                  return (
                    <button
                      key={opt.id ?? oi}
                      onClick={() => toggleOption(soal, opt)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? "border-[#1a4fa0] bg-[#f0f6fe] text-[#102f56]"
                          : "border-[#e2e9f1] text-gray-600 hover:border-[#1a4fa0]/40 hover:bg-[#f7fafd]"
                      }`}
                    >
                      <span className={`inline-grid place-items-center shrink-0 border-2 transition-all ${
                          soal.type === "checkbox" ? "w-6 h-6 rounded-[8px]" : "w-6 h-6 rounded-full"
                        } ${
                          selected ? "border-[#1a4fa0] bg-[#1a4fa0]" : "border-[#5b6c7e] bg-[#eef2f6]"
                        }`}>
                        {selected && (
                          soal.type === "checkbox"
                            ? <Check size={15} strokeWidth={3} className="text-white" />
                            : <span className="w-3 h-3 rounded-full bg-white" />
                        )}
                      </span>
                      <span className="text-[15px] font-medium">{fallbackLabel(opt, oi)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text */}
            {soal.type === "text" && (
              <textarea
                rows={3}
                placeholder="Tulis jawabanmu di sini..."
                value={answers[soal.id] ?? ""}
                onChange={(e) => setAnswer(soal.id, e.target.value)}
                className={inputCls}
              />
            )}

            {/* File */}
            {soal.type === "file" && (
              <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-[#c3d4e4] bg-[#f7fafd] py-8 cursor-pointer hover:border-[#1a4fa0] hover:bg-[#f0f6fe] transition-all">
                {answers[soal.id]?.file
                  ? (
                    <>
                      <FileText size={28} className="text-[#1a4fa0]" />
                      <span className="text-[14px] font-semibold text-[#102f56]">{answers[soal.id].file.name}</span>
                      <span className="text-[12.5px] text-gray-400">Klik untuk ganti file</span>
                    </>
                  )
                  : (
                    <>
                      <UploadCloud size={28} className="text-[#1a4fa0]" />
                      <span className="text-[14px] font-semibold text-[#102f56]">Unggah file jawaban</span>
                      <span className="text-[12.5px] text-gray-400">Maks 10 file</span>
                    </>
                  )}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAnswer(soal.id, { file: e.target.files?.[0] })}
                />
              </label>
            )}
          </div>
        ))}

        {submitError && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[14px] mb-4">{submitError}</div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(26,79,160,0.28)] hover:opacity-90 disabled:opacity-60 transition-all"
          style={{ backgroundColor: "#1a4fa0" }}
        >
          <Send size={17} /> {submitting ? "Mengirim..." : "Kirim Jawaban"}
        </button>
      </div>
    </div>
  );
}