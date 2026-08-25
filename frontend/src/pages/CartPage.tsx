import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Trash2,
    Package,
    Minus,
    Plus,
    ArrowLeft,
    Truck,
    RotateCcw,
    ShieldCheck,
    Headphones,
    Lock,
} from 'lucide-react'
import { api } from '../api/client'
import { useCart } from '../context/CartContext'
import type { CartDto, CartItemDto } from '../types/Cart'

function sanitizeDigits(value: string) {
    if (value === '') return ''
    let v = value.replace(/\D/g, '')
    v = v.replace(/^0+(?=\d)/, '')
    return v
}

const FREE_SHIPPING_THRESHOLD = 50
const SUMMARY_ITEMS_PREVIEW_COUNT = 4

function CartPage() {
    const [cart, setCart] = useState<CartDto | null>(null)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({})
    const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
    const [brokenImageIds, setBrokenImageIds] = useState<Set<number>>(new Set())
    const [showAllSummaryItems, setShowAllSummaryItems] = useState(false)
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

    function showMessage(text: string) {
        setMessage(text)
        setTimeout(() => setMessage(null), 2500)
    }

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

    function getQuantityDraft(item: CartItemDto) {
        return quantityDrafts[item.productId] ?? String(item.quantity)
    }

    function setQuantityDraft(productId: number, value: string) {
        setQuantityDrafts((prev) => ({ ...prev, [productId]: value }))
    }

    function clamp(value: number, item: CartItemDto) {
        if (value < 0) return 0
        if (value > item.quantity) return item.quantity
        return value
    }

    function handleQuantityInput(productId: number, value: string) {
        setQuantityDraft(productId, sanitizeDigits(value))
    }

    function handleQuantityBlur(item: CartItemDto) {
        const raw = quantityDrafts[item.productId]
        if (raw === undefined) return
        let num = parseInt(raw, 10)
        if (isNaN(num)) num = 0
        num = clamp(num, item)
        setQuantityDraft(item.productId, String(num))
    }

    function step(item: CartItemDto, delta: number) {
        const raw = quantityDrafts[item.productId]
        const current = raw !== undefined ? parseInt(raw, 10) : item.quantity
        const base = isNaN(current) ? item.quantity : current
        const next = clamp(base + delta, item)
        setQuantityDraft(item.productId, String(next))
    }

    async function handleDelete(item: CartItemDto) {
        const raw = quantityDrafts[item.productId]
        let removeAmount = raw !== undefined ? parseInt(raw, 10) : item.quantity
        if (isNaN(removeAmount)) removeAmount = item.quantity
        removeAmount = clamp(removeAmount, item)
        if (removeAmount <= 0) return

        const newQuantity = item.quantity - removeAmount
        try {
            if (newQuantity <= 0) {
                await api.delete(`/Cart/items/${item.productId}`)
            } else {
                await api.put(`/Cart/items/${item.productId}`, { quantity: newQuantity })
            }
            setQuantityDrafts((prev) => {
                const next = { ...prev }
                delete next[item.productId]
                return next
            })
            fetchCart()
        } catch (err) {
            console.error(err)
            showMessage('Could not update quantity')
            fetchCart()
        }
    }

    function handleClearCart() {
        if (!cart) return
        Promise.all(cart.items.map((item) => api.delete(`/Cart/items/${item.productId}`)))
            .then(() => {
                setQuantityDrafts({})
                fetchCart()
            })
            .catch((err) => {
                console.error(err)
                showMessage('Could not clear cart')
            })
    }

    function handleCheckout() {
        navigate('/checkout', { state: { productIds: Array.from(selectedProductIds) } })
    }

    if (initialLoading) return <p className="p-8 text-[#7A6A5A]">Loading cart...</p>
    if (error) return <p className="p-8 text-[#9C4325]">{error}</p>
    if (!cart || cart.items.length === 0) return <p className="p-8 text-[#7A6A5A]">Your cart is empty.</p>

    const selectedItems = cart.items.filter((item) => selectedProductIds.has(item.productId))
    const subtotal = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 0
    const total = subtotal + shipping
    const allSelected = selectedProductIds.size === cart.items.length
    const visibleSummaryItems = showAllSummaryItems
        ? selectedItems
        : selectedItems.slice(0, SUMMARY_ITEMS_PREVIEW_COUNT)
    const hiddenSummaryCount = selectedItems.length - visibleSummaryItems.length

    const summaryContent = (
        <>
            <h2
                className="text-lg text-[#2B1D14] mb-5"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
            >
                Summary
            </h2>

            <div className="flex flex-col gap-4 mb-2">
                {visibleSummaryItems.map((item) => (
                    <div key={item.productId} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                            <p className="text-[#2B1D14] font-medium truncate">{item.productName}</p>
                            <p className="text-[#B8A896] text-xs mt-0.5">
                                {item.quantity} x ${item.unitPrice}
                            </p>
                        </div>
                        <p className="text-[#2B1D14] font-semibold shrink-0">${item.lineTotal.toFixed(2)}</p>
                    </div>
                ))}
            </div>

            {hiddenSummaryCount > 0 && (
                <button
                    type="button"
                    onClick={() => setShowAllSummaryItems(true)}
                    className="text-xs font-medium text-[#B5502E] hover:text-[#9C4325] text-left mb-4"
                >
                    Show {hiddenSummaryCount} more
                </button>
            )}
            {showAllSummaryItems && selectedItems.length > SUMMARY_ITEMS_PREVIEW_COUNT && (
                <button
                    type="button"
                    onClick={() => setShowAllSummaryItems(false)}
                    className="text-xs font-medium text-[#B5502E] hover:text-[#9C4325] text-left mb-4"
                >
                    Show less
                </button>
            )}

            <div className="flex flex-col gap-3 text-sm border-t border-[#E4D5C1] pt-5">
                <div className="flex justify-between text-[#7A6A5A]">
                    <span>Subtotal ({selectedItems.length} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#7A6A5A]">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                </div>
                <p className="text-xs text-[#5B7A4A] font-medium">Free shipping on orders over $50</p>
            </div>

            <div className="flex justify-between items-center border-t border-[#E4D5C1] mt-5 pt-5">
                <span className="font-bold text-[#2B1D14]">Total</span>
                <span className="font-bold text-2xl text-[#2B1D14]">${total.toFixed(2)}</span>
            </div>

            <div className="pt-5">
                <button
                    onClick={handleCheckout}
                    disabled={selectedProductIds.size === 0}
                    className="w-full bg-[#B5502E] hover:bg-[#9C4325] border border-[#8B3D1F] text-white font-medium py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    <Lock size={14} />
                    Checkout
                </button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-[#B8A896] mt-3">
                    <ShieldCheck size={13} className="text-[#5B7A4A]" />
                    Secure checkout
                </p>
            </div>
        </>
    )

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="flex-1 p-6 lg:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h1
                            className="text-2xl text-[#2B1D14]"
                            style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
                        >
                            Your Cart
                        </h1>
                        <span className="bg-[#B5502E]/10 text-[#B5502E] border border-[#B5502E]/30 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-sm font-medium text-[#B5502E] hover:text-[#9C4325]"
                    >
                        <ArrowLeft size={16} />
                        Continue Shopping
                    </button>
                </div>

                {message && <p className="mb-4 text-sm text-[#9C4325]">{message}</p>}

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                        {cart.items.map((item) => {
                            const showImage = item.imageUrl && !brokenImageIds.has(item.productId)
                            return (
                                <div
                                    key={item.productId}
                                    className="bg-white rounded-xl border border-[#B5502E]/30 shadow-sm p-4 flex items-center gap-4"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.has(item.productId)}
                                        onChange={() => toggleSelected(item.productId)}
                                        className="w-4 h-4 accent-[#B5502E] shrink-0"
                                    />

                                    <div className="w-16 h-16 shrink-0 bg-white border border-[#F0E6D6] rounded-lg flex items-center justify-center overflow-hidden">
                                        {showImage ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                className="w-full h-full object-contain"
                                                onError={() => markImageBroken(item.productId)}
                                            />
                                        ) : (
                                            <Package className="text-[#D9CBB8]" size={24} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[#2B1D14] truncate">{item.productName}</p>
                                        <p className="text-sm text-[#B8A896] mt-0.5">${item.unitPrice} each</p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => step(item, -1)}
                                            className="w-7 h-7 bg-[#B5502E] hover:bg-[#9C4325] border border-[#8B3D1F] text-white rounded flex items-center justify-center transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={getQuantityDraft(item)}
                                            onChange={(e) => handleQuantityInput(item.productId, e.target.value)}
                                            onBlur={() => handleQuantityBlur(item)}
                                            className="w-10 border border-[#E4D5C1] rounded px-1 py-1 text-sm text-center text-[#2B1D14] bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => step(item, 1)}
                                            className="w-7 h-7 bg-[#B5502E] hover:bg-[#9C4325] border border-[#8B3D1F] text-white rounded flex items-center justify-center transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <p className="font-bold text-[#2B1D14] w-16 text-right shrink-0">
                                        ${item.lineTotal.toFixed(2)}
                                    </p>

                                    <button
                                        onClick={() => handleDelete(item)}
                                        className="text-[#B5502E]/60 hover:text-[#9C4325] shrink-0 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )
                        })}

                        <div className="lg:hidden bg-white rounded-xl border border-[#B5502E]/30 shadow-sm p-6 flex flex-col mt-3">
                            {summaryContent}
                        </div>
                    </div>

                    <div className="hidden lg:block w-[22rem] xl:w-[26rem] shrink-0">
                        <div className="sticky top-8 bg-white rounded-2xl border border-[#E4D5C1] shadow-xl shadow-[#2B1D14]/5 p-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                            {summaryContent}
                        </div>
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 z-30 bg-white border-t border-[#E4D5C1]">
                <div className="px-6 lg:px-8 py-3 flex items-center justify-between border-b border-[#F0E6D6]">
                    <label className="flex items-center gap-2 text-sm text-[#7A6A5A] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 accent-[#B5502E]"
                        />
                        Select all ({cart.items.length})
                    </label>
                    <button
                        onClick={handleClearCart}
                        className="text-sm font-medium text-[#9C4325] hover:text-[#7A3018]"
                    >
                        Clear Cart
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-3">
                        <Truck size={20} className="text-[#B5502E] shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[#2B1D14]">Free Shipping</p>
                            <p className="text-xs text-[#B8A896]">On orders over $50</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <RotateCcw size={20} className="text-[#B5502E] shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[#2B1D14]">Easy Returns</p>
                            <p className="text-xs text-[#B8A896]">30-day return policy</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-[#B5502E] shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[#2B1D14]">Secure Payment</p>
                            <p className="text-xs text-[#B8A896]">100% secure checkout</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Headphones size={20} className="text-[#B5502E] shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[#2B1D14]">24/7 Support</p>
                            <p className="text-xs text-[#B8A896]">We're here to help</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default CartPage