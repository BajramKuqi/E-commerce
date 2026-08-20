import { useEffect, useRef, useState } from 'react'
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
    const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
    const [brokenImageIds, setBrokenImageIds] = useState<Set<number>>(new Set())
    const initializedRef = useRef(false)
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

    useEffect(() => {
        if (!cart) return
        setSelectedProductIds((prev) => {
            if (!initializedRef.current) {
                initializedRef.current = true
                return new Set(cart.items.map((item) => item.productId))
            }
            const validIds = new Set(cart.items.map((item) => item.productId))
            const next = new Set<number>()
            prev.forEach((id) => {
                if (validIds.has(id)) next.add(id)
            })
            return next
        })
    }, [cart])

    function toggleSelected(productId: number) {
        setSelectedProductIds((prev) => {
            const next = new Set(prev)
            if (next.has(productId)) {
                next.delete(productId)
            } else {
                next.add(productId)
            }
            return next
        })
    }

    function toggleSelectAll() {
        if (!cart) return
        setSelectedProductIds((prev) => {
            if (prev.size === cart.items.length) return new Set()
            return new Set(cart.items.map((item) => item.productId))
        })
    }

    function markImageBroken(productId: number) {
        setBrokenImageIds((prev) => new Set(prev).add(productId))
    }

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

    function handleCheckout() {
        navigate('/checkout', { state: { productIds: Array.from(selectedProductIds) } })
    }

    if (initialLoading) return <p className="p-8">Loading cart...</p>
    if (error) return <p className="p-8 text-red-600">{error}</p>
    if (!cart || cart.items.length === 0) return <p className="p-8">Your cart is empty.</p>

    const selectedTotal = cart.items
        .filter((item) => selectedProductIds.has(item.productId))
        .reduce((sum, item) => sum + item.lineTotal, 0)

    const allSelected = selectedProductIds.size === cart.items.length

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-800">Your Cart</h1>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                    />
                    Select all
                </label>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                {cart.items.map((item) => {
                    const showImage = item.imageUrl && !brokenImageIds.has(item.productId)
                    return (
                        <div
                            key={item.productId}
                            className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col ${
                                selectedProductIds.has(item.productId) ? 'border-indigo-300' : 'border-gray-100'
                            }`}
                        >
                            <div className="h-32 bg-white p-1 flex items-center justify-center relative overflow-hidden">
                                <input
                                    type="checkbox"
                                    checked={selectedProductIds.has(item.productId)}
                                    onChange={() => toggleSelected(item.productId)}
                                    className="absolute top-2 left-2 w-4 h-4 z-10"
                                />
                                {showImage ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        className="w-full h-full object-contain rounded-lg"
                                        onError={() => markImageBroken(item.productId)}
                                    />
                                ) : (
                                    <Package className="text-gray-300" size={40} />
                                )}
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
                    )
                })}
            </div>

            <div className="flex items-center justify-between mt-8">
                <p className="text-xl font-bold">Selected total: ${selectedTotal.toFixed(2)}</p>
                <button
                    onClick={handleCheckout}
                    disabled={selectedProductIds.size === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Checkout ({selectedProductIds.size})
                </button>
            </div>
        </div>
    )
}

export default CartPage