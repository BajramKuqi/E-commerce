import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AuthResponseDto } from '../types/Auth'

interface AuthContextType {
    user: AuthResponseDto | null
    loading: boolean
    login: (auth: AuthResponseDto) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthResponseDto | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem('auth')
        if (stored) {
            setUser(JSON.parse(stored))
        }
        setLoading(false)
    }, [])

    function login(auth: AuthResponseDto) {
        localStorage.setItem('auth', JSON.stringify(auth))
        setUser(auth)
    }

    function logout() {
        localStorage.removeItem('auth')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}