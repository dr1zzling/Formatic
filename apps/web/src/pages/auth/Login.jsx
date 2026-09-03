import { useState } from "react";
import { Eye, EyeOff, FileText, Users, BarChart3 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../../utils/api";

const COLORS = {
    navy: "#0F2C46",
    cyan: "#28ACCE",
    cyanDeep: "#1D93B4",
    iconBg: "#C7D6DC",
    iconGlyph: "#123049",
    gray: "#8A94A1",
    border: "#E3E8EC",
    tan: "#D9A05B",
};

function Cluster({ icon, title, subtitle, style }) {
    return (
        <div className="text-white" style={{ width: "166px", position: "absolute", ...style }}>
            <div
                className="flex items-center justify-center mb-2 shadow-sm"
                style={{ width: "47px", height: "47px", background: COLORS.iconBg, borderRadius: "13px" }}
            >
                {icon}
            </div>
            <p className="text-base font-semibold leading-tight">{title}</p>
            <p className="leading-snug text-white/70" style={{ fontSize: "14px" }}>
                {subtitle}
            </p>
        </div>
    );
}

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const iconStyle = { color: COLORS.iconGlyph };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await authAPI.login(username, password);
            localStorage.setItem("token", data.token);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Login gagal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="relative min-h-screen w-full flex items-center justify-center px-6 py-12 overflow-hidden"
            style={{
                background:
                    "linear-gradient(120deg, #062457 0%, #0b3f66 20%, #1c5f86 38%, #4d91b2 55%, #8fbccb 68%, #cde3ea 82%, #f7fafb 94%, #ffffff 100%)",
                minHeight: "100dvh",
            }}
        >
            <div className="hidden md:grid absolute top-8 left-8 grid-cols-4 gap-1.5 z-10">
                {Array.from({ length: 16 }).map((_, i) => (
                    <span
                        key={i}
                        className="rounded-full"
                        style={{ width: "6px", height: "6px", background: COLORS.tan }}
                    />
                ))}
            </div>

            <div className="relative w-full flex items-center justify-between gap-10 md:justify-between justify-center" style={{ maxWidth: "1200px" }}>

                {/* Left panel */}
                <div className="relative hidden md:flex flex-col justify-center overflow-visible" style={{ width: "620px" }}>
                    {/* circle*/}
                    <div
                        className="absolute rounded-full bg-white/15 border border-white/25"
                        style={{ width: "84px", height: "84px", top: "-31px", right: "104px" }}
                    />
                    <div
                        className="absolute rounded-full bg-white/15 border border-white/20"
                        style={{ width: "26px", height: "26px", top: "73px", right: "62px" }}
                    />

                    <div>
                        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white">
                            Form<span style={{ color: COLORS.cyan }}>Matic</span>
                        </h1>
                        <p className="text-white/75 text-base lg:text-lg mb-16 max-w-sm">
                            Create forms, collect responses, and gain insights with ease
                        </p>

                        <div className="relative" style={{ width: "600px", height: "560px" }}>
                            <svg
                                className="absolute inset-0 pointer-events-none"
                                style={{ width: "100%", height: "100%" }}
                                viewBox="0 0 600 560"
                                fill="none"
                            >
                                <path d="M429 117 C 455 91, 465 71, 471 52" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 4" />
                                <path d="M169 208 C 140 195, 117 182, 91 169" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 4" />
                                <path d="M195 338 C 169 358, 153 371, 137 387" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 4" />
                            </svg>

                            <span className="absolute text-white/40 text-2xl select-none" style={{ left: "390px", top: "195px" }}>+</span>
                            <span className="absolute text-white/40 text-2xl select-none" style={{ left: "0px", top: "332px" }}>+</span>
                            <span className="absolute text-white/40 text-2xl select-none" style={{ left: "267px", top: "436px" }}>+</span>

                            <Cluster
                                icon={<FileText size={24} style={iconStyle} />}
                                title="Easy to Create"
                                subtitle="Build forms in minutes"
                                style={{ left: "442px", top: "0px" }}
                            />

                            <div
                                className="absolute rounded-2xl bg-white shadow-xl overflow-hidden"
                                style={{ left: "169px", top: "117px", width: "260px" }}
                            >
                                <div
                                    className="flex items-center gap-1.5 px-4"
                                    style={{ height: "31px", background: COLORS.cyan }}
                                >
                                    <span className="rounded-full bg-white/80" style={{ width: "8px", height: "8px" }} />
                                    <span className="rounded-full bg-white/80" style={{ width: "8px", height: "8px" }} />
                                    <span className="rounded-full bg-white/80" style={{ width: "8px", height: "8px" }} />
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="rounded bg-slate-100 flex items-center justify-center font-bold flex-shrink-0"
                                            style={{ width: "31px", height: "31px", fontSize: "13px", color: COLORS.iconGlyph }}
                                        >
                                            T
                                        </div>
                                        <div className="flex-1 rounded bg-slate-200" style={{ height: "13px" }} />
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="rounded-full flex-shrink-0"
                                            style={{ width: "26px", height: "26px", border: `3px solid ${COLORS.cyan}` }}
                                        />
                                        <div className="flex-1 rounded bg-slate-200" style={{ height: "13px" }} />
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="rounded flex items-center justify-center text-white flex-shrink-0"
                                            style={{ width: "26px", height: "26px", fontSize: "13px", background: COLORS.cyan }}
                                        >
                                            ✓
                                        </div>
                                        <div className="flex-1 rounded bg-slate-200" style={{ height: "13px" }} />
                                    </div>
                                    <div className="w-full rounded bg-slate-200" style={{ height: "16px" }} />
                                </div>
                            </div>

                            <Cluster
                                icon={<Users size={24} style={iconStyle} />}
                                title="View Insights"
                                subtitle="Analyze responses and make decisions"
                                style={{ left: "-10px", top: "115px" }}
                            />

                            <Cluster
                                icon={<BarChart3 size={24} style={iconStyle} />}
                                title="View Insights"
                                subtitle="Analyze responses and make decisions"
                                style={{ left: "52px", top: "390px" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="relative w-full max-w-sm">
                    {/* Logo mobile — hanya muncul di layar kecil */}
                    <div className="flex md:hidden justify-center mb-6">
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Form<span style={{ color: COLORS.cyan }}>Matic</span>
                        </h1>
                    </div>
                    <div className="relative w-full bg-white rounded-3xl shadow-2xl px-8 py-10">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold" style={{ color: COLORS.navy }}>
                                Welcome <span style={{ color: COLORS.cyan }}>Back</span>
                            </h2>
                            <p className="text-sm mt-1" style={{ color: COLORS.gray }}>
                                Please enter your details
                            </p>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="username" className="block text-sm font-semibold mb-1.5" style={{ color: COLORS.navy }}>
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Your name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                    style={{ border: `1px solid ${COLORS.border}` }}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: COLORS.navy }}>
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full rounded-lg pl-4 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-400 transition"
                                        style={{ border: `1px solid ${COLORS.border}` }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute text-slate-400 hover:text-slate-600"
                                        style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center text-sm">
                                <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: COLORS.gray }}>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe((v) => !v)}
                                        className="appearance-none rounded-full border border-slate-300 checked:bg-cyan-500 checked:border-cyan-500 transition cursor-pointer"
                                        style={{ width: "16px", height: "16px" }}
                                    />
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg text-white font-semibold py-2.5 text-sm shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: COLORS.cyanDeep }}
                            >
                                {loading ? "Signing In..." : "Sign In"}
                            </button>

                            <p className="text-center text-sm" style={{ color: COLORS.gray }}>
                                Don&apos;t have an account?{" "}
                                <Link to="/register" className="font-semibold hover:opacity-80" style={{ color: COLORS.cyan }}>
                                    Sign up
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}