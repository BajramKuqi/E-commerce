import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { RegisterDto, AuthResponseDto } from '../types/Auth'

function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrors([])
        setLoading(true)
        const payload: RegisterDto = { email, password, fullName }
        try {
            const response = await api.post<AuthResponseDto>('/api/Auth/register', payload)
            login(response.data)
            navigate('/')
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setErrors(err.response.data)
            } else {
                setErrors(['Registration failed. Please try again.'])
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid md:grid-cols-2 bg-[#161513]">
            <div className="hidden md:flex flex-col justify-between relative overflow-hidden bg-[#1C1A17] px-12 py-14">
                <div
                    className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 70%)' }}
                />
                <ShoppingBag
                    className="pointer-events-none absolute -bottom-16 -right-16 w-72 h-72 text-[#F97316]/[0.04] rotate-[-12deg]"
                    strokeWidth={1}
                />

                <div className="relative flex items-center gap-2 text-[#F5F1EA]">
                    <ShoppingBag className="w-5 h-5 text-[#F97316]" strokeWidth={2} />
                    <span className="font-semibold tracking-wide text-sm uppercase">
                        Store
                    </span>
                </div>

                <div className="relative border-t border-[#2E2A24] pt-8 max-w-sm">
                    <span className="block text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-3">
                        New here
                    </span>
                    <h2 className="text-3xl font-bold leading-tight text-[#F5F1EA] mb-4">
                        Join a store built on good taste.
                    </h2>
                    <p className="text-[#8C857A] text-sm leading-relaxed">
                        Create an account to save your cart, track orders, and check out faster next time.
                    </p>
                </div>

                <p className="relative text-[#5C574E] text-xs">
                    © {new Date().getFullYear()} Store. All rights reserved.
                </p>
            </div>

            <div className="flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-sm">
                    <div
                        className="relative bg-[#1C1A17] border border-[#2E2A24] px-8 pt-12 pb-8"
                        style={{
                            clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)',
                            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.55), 0 0 80px -30px rgba(249,115,22,0.15)',
                        }}
                    >
                        <div className="absolute top-0 right-0 w-7 h-7 bg-[#F97316]" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

                        <div className="absolute -top-6 left-8 w-12 h-12 bg-[#F97316] border-4 border-[#161513] shadow-lg shadow-[#F97316]/20 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-[#161513]" strokeWidth={2} />
                        </div>

                        <h1 className="text-2xl font-bold text-[#F5F1EA] mb-1">
                            Create your account
                        </h1>
                        <p className="text-[#8C857A] text-sm mb-6">
                            Takes less than a minute
                        </p>

                        {errors.length > 0 && (
                            <div className="flex gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 mb-5">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <ul className="space-y-1">
                                    {errors.map((msg, i) => (
                                        <li key={i}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="block text-xs font-medium text-[#8C857A] mb-1.5 uppercase tracking-wide"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    placeholder="Jane Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full border border-[#2E2A24] px-3 py-2.5 text-[#F5F1EA] placeholder-[#5C574E] bg-[#161513] focus:outline-none focus:ring-1 focus:ring-[#F97316] focus:border-[#F97316] transition"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-medium text-[#8C857A] mb-1.5 uppercase tracking-wide"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-[#2E2A24] px-3 py-2.5 text-[#F5F1EA] placeholder-[#5C574E] bg-[#161513] focus:outline-none focus:ring-1 focus:ring-[#F97316] focus:border-[#F97316] transition"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-medium text-[#8C857A] mb-1.5 uppercase tracking-wide"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border border-[#2E2A24] px-3 py-2.5 pr-10 text-[#F5F1EA] placeholder-[#5C574E] bg-[#161513] focus:outline-none focus:ring-1 focus:ring-[#F97316] focus:border-[#F97316] transition"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C574E] hover:text-[#8C857A] transition"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 disabled:cursor-not-allowed text-[#161513] font-semibold py-2.5 transition flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </form>

                        <p className="text-center text-sm text-[#8C857A] mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#F97316] font-medium hover:text-[#FB923C] transition">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage