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
        <div className="min-h-screen grid md:grid-cols-2 bg-[#F6EEE2]">
            <div
                className="hidden md:flex flex-col justify-between relative overflow-hidden bg-[#2B1D14] px-12 py-14"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 12px)',
                }}
            >
                <div className="flex items-center gap-2 text-[#F6EEE2]">
                    <ShoppingBag className="w-5 h-5 text-[#B5502E]" strokeWidth={2} />
                    <span className="font-semibold tracking-wide text-sm uppercase">
                        Store
                    </span>
                </div>

                <div className="border-t border-dashed border-[#6B5645]/50 pt-8 max-w-sm">
                    <h2
                        className="text-3xl leading-tight text-[#F6EEE2] mb-4"
                        style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
                    >
                        Join a store built on good taste.
                    </h2>
                    <p className="text-[#C9BBA8] text-sm leading-relaxed">
                        Create an account to save your cart, track orders, and check out faster next time.
                    </p>
                </div>

                <p className="text-[#6B5645] text-xs">
                    © {new Date().getFullYear()} Store. All rights reserved.
                </p>
            </div>

            <div className="flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-sm">
                    <div className="relative bg-[#FFFDF9] border border-[#E4D5C1] rounded-2xl shadow-[0_8px_30px_-12px_rgba(43,29,20,0.25)] px-8 pt-12 pb-8">
                        <div className="absolute -top-6 left-8 w-12 h-12 rounded-full bg-[#B5502E] border-4 border-[#F6EEE2] shadow-md flex items-center justify-center rotate-[-8deg]">
                            <ShoppingBag className="w-5 h-5 text-[#FFFDF9]" strokeWidth={2} />
                        </div>

                        <h1
                            className="text-2xl text-[#2B1D14] mb-1"
                            style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
                        >
                            Create your account
                        </h1>
                        <p className="text-[#7A6A5A] text-sm mb-6">
                            Takes less than a minute
                        </p>

                        {errors.length > 0 && (
                            <div className="flex gap-2 bg-[#B5502E]/10 border border-[#B5502E]/30 text-[#9C4325] text-sm rounded-lg px-3 py-2 mb-5">
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
                                    className="block text-xs font-medium text-[#7A6A5A] mb-1.5 uppercase tracking-wide"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    placeholder="Jane Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full border border-[#E4D5C1] rounded-lg px-3 py-2.5 text-[#2B1D14] placeholder-[#B8A896] bg-white focus:outline-none focus:ring-2 focus:ring-[#B5502E] focus:border-transparent transition"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-medium text-[#7A6A5A] mb-1.5 uppercase tracking-wide"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-[#E4D5C1] rounded-lg px-3 py-2.5 text-[#2B1D14] placeholder-[#B8A896] bg-white focus:outline-none focus:ring-2 focus:ring-[#B5502E] focus:border-transparent transition"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-medium text-[#7A6A5A] mb-1.5 uppercase tracking-wide"
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
                                        className="w-full border border-[#E4D5C1] rounded-lg px-3 py-2.5 pr-10 text-[#2B1D14] placeholder-[#B8A896] bg-white focus:outline-none focus:ring-2 focus:ring-[#B5502E] focus:border-transparent transition"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8A896] hover:text-[#7A6A5A] transition"
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
                                className="w-full bg-[#B5502E] hover:bg-[#9C4325] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2"
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

                        <p className="text-center text-sm text-[#7A6A5A] mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#B5502E] font-medium hover:text-[#9C4325] transition">
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