import { useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);

    return (
        <div className="min-h-screen w-full flex bg-black text-white font-sans">
            {/* Left panel */}
            <div className="relative hidden md:flex w-1/2 flex-col justify-center items-center overflow-hidden bg-black">
                {/* Radial glow */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(circle at 30% 35%, rgba(190,24,93,0.35) 0%, rgba(0,0,0,0) 55%)",
                    }}
                />

                <div className="relative z-10 max-w-sm px-8 text-center">
                    <h1 className="text-4xl font-bold leading-tight tracking-tight">
                        Create forms that
                        <br />
                        connect.
                    </h1>
                    <p className="mt-4 text-sm text-white/50 leading-relaxed">
                        lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.
                    </p>

                    <div className="relative mt-16 h-40 flex items-center justify-center">

                        <div className="absolute left-2 top-0 w-44 h-24 rounded-2xl bg-white/6 border border-white/10 p-4 flex flex-col gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-white/20" />
                            <div className="h-1.5 w-14 rounded-full bg-white/10" />
                            <div className="h-1.5 w-16 rounded-full bg-white/10" />
                        </div>

                        <div className="absolute right-0 bottom-0 w-44 h-20 rounded-2xl bg-white/6 border border-white/10 p-4 flex flex-col gap-2 justify-center">
                            <div className="h-1.5 w-24 rounded-full bg-white/20" />
                            <div className="h-1.5 w-20 rounded-full bg-white/10" />
                            <div className="h-1.5 w-16 rounded-full bg-white/10" />
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 top-14 w-11 h-11 rounded-full bg-pink-200 flex items-center justify-center shadow-lg shadow-pink-500/20">
                            <Check className="w-5 h-5 text-black" strokeWidth={3} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-1/2 flex items-center justify-center bg-[#0c0c0c] px-6">
                <div className="w-full max-w-sm bg-white/3 border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold">Welcome back</h2>
                    <p className="text-sm text-white/50 mt-1">
                        Please enter your details to log in.
                    </p>

                    <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="block text-xs font-semibold tracking-wide text-white/70 mb-2">
                                EMAIL
                            </label>
                            <input
                                type="email"
                                placeholder="name@email.com"
                                className="w-full rounded-lg bg-white/4 border border-white/10 px-3.5 py-2.5 text-sm placeholder-white/30 outline-none focus:border-pink-300/50 focus:ring-1 focus:ring-pink-300/30 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold tracking-wide text-white/70 mb-2">
                                PASSWORD
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg bg-white/4 border border-white/10 px-3.5 py-2.5 pr-10 text-sm placeholder-white/30 outline-none focus:border-pink-300/50 focus:ring-1 focus:ring-pink-300/30 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <Eye className="w-4 h-4" />
                                    ) : (
                                        <EyeOff className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-white/60 cursor-pointer select-none">
                                <span
                                    onClick={() => setRemember((r) => !r)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${remember
                                        ? "bg-pink-300 border-pink-300"
                                        : "border-white/20 bg-white/4"
                                        }`}
                                >
                                    {remember && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                                </span>
                                Remember me
                            </label>
                            <a href="#" className="text-pink-300 hover:text-pink-200 transition">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-linear-to-b from-pink-200 to-pink-300 text-black font-semibold text-sm py-2.5 hover:brightness-105 active:brightness-95 transition shadow-lg shadow-pink-500/10"
                        >
                            Log In
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-white/50">
                        Don't have an account?{" "}
                        <a href="#" className="text-pink-300 hover:text-pink-200 font-medium transition">
                            Sign up
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}