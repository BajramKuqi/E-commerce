import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ShoppingBag, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { LoginDto, AuthResponseDto } from '../types/Auth'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        const payload: LoginDto = { email, password }
        try {
            const response = await api.post<AuthResponseDto>('/api/Auth/login', payload)
            login(response.data)
            navigate('/')
        } catch (err) {
            console.error(err)
            setError('Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid md:grid-cols-2 bg-[#F6F1E7]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
                .heading-font { font-family: 'Space Grotesk', sans-serif; }
            `}</style>

            <div className="hidden md:flex flex-col justify-between relative overflow-hidden bg-[#1F5C50] px-12 py-14">
                <div
                    className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)' }}
                />
                <ShoppingBag
                    className="pointer-events-none absolute -bottom-16 -right-16 w-72 h-72 text-white/[0.06] rotate-[-12deg]"
                    strokeWidth={1}
                />

                <div className="relative flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="font-bold text-lg heading-font">Vatra</span>
                        <span className="text-white/60 text-[10px] font-medium tracking-wide uppercase -mt-1">
                            Pazarit
                        </span>
                    </div>
                </div>

                <div className="relative border-t border-white/15 pt-8 max-w-sm">
                    <h2 className="text-3xl font-bold leading-tight text-white mb-4 heading-font">
                        Crafted goods, delivered with care.
                    </h2>
                    <p className="text-white/70 text-sm leading-relaxed">
                        Sign in to track orders, save favorites, and check out faster.
                    </p>
                </div>

                <p className="relative text-white/50 text-xs">
                    © {new Date().getFullYear()} Vatra. All rights reserved.
                </p>
            </div>

            <div className="flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-sm">
                    <div
                        className="relative bg-white border border-[#E6DCC8] rounded-2xl px-8 pt-12 pb-8"
                        style={{ boxShadow: '0 30px 60px -20px rgba(38,32,25,0.2)' }}
                    >
                        <div className="absolute -top-6 left-8 w-12 h-12 rounded-xl bg-[#1F5C50] border-4 border-[#F6F1E7] shadow-lg flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>

                        <h1 className="text-2xl font-bold text-[#262019] mb-1 heading-font">
                            Welcome back
                        </h1>
                        <p className="text-[#756B5A] text-sm mb-6">
                            Sign in to continue to your account
                        </p>

                        {error && (
                            <div className="flex items-center gap-2 bg-[#B5402E]/10 border border-[#B5402E]/20 text-[#8F2F21] text-sm px-3 py-2.5 rounded-xl mb-5">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium text-[#756B5A] mb-1.5">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-[#E6DCC8] rounded-xl px-3 py-2.5 text-[#262019] placeholder-[#A79B85] bg-[#FBF8F2] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30 focus:border-[#1F5C50] transition"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="block text-xs font-medium text-[#756B5A]">
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-medium text-[#1F5C50] hover:text-[#163F37] transition"
                                    >
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="????????"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border border-[#E6DCC8] rounded-xl px-3 py-2.5 pr-10 text-[#262019] placeholder-[#A79B85] bg-[#FBF8F2] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30 focus:border-[#1F5C50] transition"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A79B85] hover:text-[#262019] transition"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full bg-[#B5402E] hover:bg-[#8F2F21] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 overflow-hidden"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="flex items-center gap-3 my-6">
                            <div className="h-px flex-1 bg-[#E6DCC8]" />
                            <span className="text-xs text-[#A79B85]">or</span>
                            <div className="h-px flex-1 bg-[#E6DCC8]" />
                        </div>

                        <Link
                            to="/register"
                            className="block w-full text-center border border-[#1F5C50]/30 text-[#1F5C50] hover:bg-[#1F5C50]/5 font-semibold py-3 rounded-xl transition-colors"
                        >
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage