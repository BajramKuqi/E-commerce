import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'
import type { CartDto } from '../types/Cart'

interface CartContextType {
    cart: CartDto | null
    itemCount: number
    refreshCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartDto | null>(null)
    const { user } = useAuth()

    const refreshCart = useCallback(() => {
        if (!user) {
            setCart(null)
            return
        }
        api.get<CartDto>('/Cart')
            .then((response) => setCart(response.data))
            .catch(() => setCart(null))
    }, [user])

    const itemCount = cart ? cart.items.reduce((sum, i) => sum + i.quantity, 0) : 0

    return (
        <CartContext.Provider value={{ cart, itemCount, refreshCart }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}