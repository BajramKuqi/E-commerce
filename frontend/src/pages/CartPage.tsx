import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Package, Minus, Plus } from 'lucide-react'
import { api } from '../api/client'
import { useCart } from '../context/CartContext'
import type { CartDto } from '../types/Cart'

function sanitizeDigits(value: string) {
    if (value === '') return ''
    let v = value.replace(/\D/g, '')
    v = v.replace(/^0+(?=\d)/, '')
    return v
}

function clampToMax(value: string, max: number) {
    if (value === '') return value
    const num = parseInt(value, 10)
    if (num > max) return String(max)
    return value
}

function CartPage() {
    const [cart, setCart] = useState<CartDto | null>(null)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [removeQuantities, setRemoveQuantities] = useState<Record<number, string>>({})
    const { refreshCart } = useCart()
    const navigate = useNavigate()

    function fetchCart() {
        api.get<CartDto>('/Cart')
            .then((response) => {
                setCart(response.data)
                refreshCart()
            })
            .catch((err) => {
                console.error(err)
                setError('Failed to load cart')
            })
            .finally(() => setInitialLoading(false))
    }

    useEffect(() => {
        fetchCart()
    }, [])

    function getRemoveQuantity(productId: number) {
        return removeQuantities[productId] ?? '1'
    }

    function setRemoveValue(productId: number, value: string) {
        setRemoveQuantities((prev) => ({ ...prev, [productId]: value }))
    }

    function handleRemoveInput(productId: number, value: string, max: number) {
        const sanitized = sanitizeDigits(value)
        setRemoveValue(productId, clampToMax(sanitized, max))
    }

    function handleRemoveBlur(productId: number, max: number) {
        const raw = removeQuantities[productId] ?? '1'
        let num = parseInt(raw, 10)
        if (isNaN(num) || num < 1) num = 1
        if (num > max) num = max
        setRemoveValue(productId, String(num))
    }

    function step(productId: number, delta: number, max: number) {
        const current = parseInt(getRemoveQuantity(productId), 10) || 1
        let next = current + delta
        if (next < 1) next = 1
        if (next > max) next = max
        setRemoveValue(productId, String(next))
    }

    async function handleRemove(productId: number, currentQuantity: number) {
        const removeAmount = parseInt(getRemoveQuantity(productId), 10) || 1
        const remaining = currentQuantity - removeAmount

        try {
            if (remaining <= 0) {
                await api.delete(`/Cart/items/${productId}`)
            } else {
                await api.put(`/Cart/items/${productId}`, { quantity: remaining })
            }
            setRemoveValue(productId, '1')
            fetchCart()
        } catch (err) {
            console.error(err)
        }
    }

    if (initialLoading) return <p className="p-8">Loading cart...</p>
    if (error) return <p className="p-8 text-red-600">{error}</p>
    if (!cart || cart.items.length === 0) return <p className="p-8">Your cart is empty.</p>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Cart</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
                {cart.items.map((item) => (
                    <div
                        key={item.productId}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                    >
                        <div className="h-36 bg-gray-100 flex items-center justify-center">
                            <Package className="text-gray-300" size={40} />
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                            <p className="font-semibold text-gray-800 line-clamp-1">{item.productName}</p>
                            <p className="text-xs text-gray-400 mt-1">${item.unitPrice} each</p>
                            <p className="text-xs text-gray-500 mt-1">In cart: {item.quantity}</p>

                            <div className="mt-auto pt-3 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => step(item.productId, -1, item.quantity)}
                                    className="w-7 h-7 border rounded flex items-center justify-center hover:bg-gray-50"
                                >
                                    <Minus size={14} />
                                </button>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={getRemoveQuantity(item.productId)}
                                    onChange={(e) => handleRemoveInput(item.productId, e.target.value, item.quantity)}
                                    onBlur={() => handleRemoveBlur(item.productId, item.quantity)}
                                    className="w-10 border rounded px-1 py-1 text-sm text-center"
                                />
                                <button
                                    type="button"
                                    onClick={() => step(item.productId, 1, item.quantity)}
                                    className="w-7 h-7 border rounded flex items-center justify-center hover:bg-gray-50"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            <button
                                onClick={() => handleRemove(item.productId, item.quantity)}
                                className="flex items-center justify-center gap-1 text-red-500 hover:text-red-700 text-xs mt-2 border border-red-200 rounded py-1"
                            >
                                <Trash2 size={13} />
                                Remove
                            </button>

                            <p className="font-bold text-gray-900 text-right mt-2">${item.lineTotal.toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mt-8">
                <p className="text-xl font-bold">Total: ${cart.total.toFixed(2)}</p>
                <button
                    onClick={() => navigate('/checkout')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                >
                    Checkout
                </button>
            </div>
        </div>
    )
}

export default CartPage