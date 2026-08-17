import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { LoginDto, AuthResponseDto } from '../types/Auth'

function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        const payload: LoginDto = { email, password }

        try {
            const response = await api.post<AuthResponseDto>('/api/Auth/login', payload)
            login(response.data)
            navigate('/')
        } catch (err) {
            console.error(err)
            setError('Invalid email or password')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80 space-y-4">
                <h1 className="text-2xl font-bold text-gray-800">Login</h1>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                <button type="submit" className="w-full bg-gray-800 text-white py-2 rounded">
                    Login
                </button>
            </form>
        </div>
    )
}

export default LoginPage