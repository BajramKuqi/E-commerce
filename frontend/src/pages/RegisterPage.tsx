import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { RegisterDto, AuthResponseDto } from '../types/Auth'

function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [errors, setErrors] = useState<string[]>([])
    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrors([])

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
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80 space-y-4">
                <h1 className="text-2xl font-bold text-gray-800">Register</h1>
                {errors.length > 0 && (
                    <ul className="text-red-600 text-sm space-y-1">
                        {errors.map((msg, i) => (
                            <li key={i}>{msg}</li>
                        ))}
                    </ul>
                )}
                <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                />
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
                    Register
                </button>
            </form>
        </div>
    )
}

export default RegisterPage