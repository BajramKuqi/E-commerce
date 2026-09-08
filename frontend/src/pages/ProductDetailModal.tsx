import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { X, Minus, Plus, ShoppingCart, Package } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import type { Product } from '../types/Product'

function stockBadge(stock: number) {
    if (stock === 0) {
        return { label: 'Out of stock', dot: 'bg-[#B5402E]', bg: 'bg-[#B5402E]/10', text: 'text-[#8F2F21]' }
    }
    if (stock <= 5) {
        return { label: `Only ${stock} left`, dot: 'bg-[#C97A2B]', bg: 'bg-[#C97A2B]/10', text: 'text-[#8A551B]' }
    }
    if (stock <= 20) {
        return { label: `${stock} in stock`, dot: 'bg-[#1F5C50]', bg: 'bg-[#1F5C50]/10', text: 'text-[#1F5C50]' }
    }
    return { label: `${stock} in stock`, dot: 'bg-[#3F7D5C]', bg: 'bg-[#3F7D5C]/10', text: 'text-[#2E5C44]' }
}

function StockPill({ stock }: { stock: number }) {
    const b = stockBadge(stock)
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${b.bg} ${b.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
            {b.label}
        </span>
    )
}

type Props = {
    product: Product
    onClose: () => void
}

function ProductDetailModal({ product, onClose }: Props) {
    const { user } = useAuth()
    const { cart, refreshCart } = useCart()
    const [quantity, setQuantity] = useState('1')
    const [message, setMessage] = useState<string | null>(null)
    const [brokenIds, setBrokenIds] = useState<Set<number | string>>(new Set())
    const [selectedIndex, setSelectedIndex] = useState(0)

    const galleryImages = useMemo(() => {
        if (product.images && product.images.length > 0) {
            const sorted = [...product.images].sort((a, b) => {
                if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
                return a.displayOrder - b.displayOrder
            })
            return sorted.map((img) => ({ key: img.id, url: img.imageUrl }))
        }
        if (product.imageUrl) {
            return [{ key: 'primary', url: product.imageUrl }]
        }
        return []
    }, [product])

    useEffect(() => {
        setSelectedIndex(0)
        setBrokenIds(new Set())
    }, [product.id])

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', handleKey)
            document.body.style.overflow = ''
        }
    }, [onClose])

    const inCartQuantity = cart?.items.find((i) => i.productId === product.id)?.quantity ?? 0
    const stock = Math.max(0, product.stockQuantity - inCartQuantity)

    const activeImage = galleryImages[selectedIndex]
    const activeImageBroken = activeImage ? brokenIds.has(activeImage.key) : false

    function sanitizeDigits(value: string) {
        if (value === '') return ''
        let v = value.replace(/\D/g, '')
        v = v.replace(/^0+(?=\d)/, '')
        return v
    }

    function handleQuantityInput(value: string) {
        const sanitized = sanitizeDigits(value)
        if (sanitized === '') {
            setQuantity(sanitized)
            return
        }
        const num = parseInt(sanitized, 10)
        setQuantity(num > stock ? String(stock) : sanitized)
    }

    function handleQuantityBlur() {
        let num = parseInt(quantity, 10)
        if (isNaN(num) || num < 1) num = 1
        if (num > stock) num = stock
        setQuantity(String(num))
    }

    function step(delta: number) {
        const current = parseInt(quantity, 10) || 1
        let next = current + delta
        if (next < 1) next = 1
        if (next > stock) next = stock
        setQuantity(String(next))
    }

    async function handleAddToCart() {
        const qty = parseInt(quantity, 10) || 1
        try {
            await api.post('/Cart/items', { productId: product.id, quantity: qty })
            setMessage('Added to cart')
            refreshCart()
            setQuantity('1')
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 409) {
                    setMessage('Not enough stock available')
                } else if (err.response?.status === 404) {
                    setMessage('Product not found')
                } else {
                    setMessage(`Error: ${err.response?.data ?? 'Could not add to cart'}`)
                }
            } else {
                setMessage('Could not add to cart')
            }
        }
        setTimeout(() => setMessage(null), 2500)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#262019]/60 backdrop-blur-sm"
            onClick={onClose}
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
                .heading-font { font-family: 'Space Grotesk', sans-serif; }
            `}</style>
            <div
                className="relative bg-white rounded-2xl border border-[#E6DCC8] w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                style={{ boxShadow: '0 30px 70px -20px rgba(38,32,25,0.35)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[#FBF8F2] border border-[#E6DCC8] text-[#756B5A] hover:text-[#1F5C50] hover:border-[#1F5C50]/40 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                    <div className="bg-[#FBF8F2] flex flex-col p-6 sm:min-h-[420px] border-b sm:border-b-0 sm:border-r border-[#E6DCC8] sm:rounded-l-2xl">
                        <div className="flex-1 flex items-center justify-center">
                            {activeImage && !activeImageBroken ? (
                                <img
                                    src={activeImage.url}
                                    alt={product.name}
                                    className="max-w-full max-h-64 object-contain"
                                    onError={() =>
                                        setBrokenIds((prev) => new Set(prev).add(activeImage.key))
                                    }
                                />
                            ) : (
                                <Package className="text-[#D8CBAE]" size={80} />
                            )}
                        </div>

                        {galleryImages.length > 1 && (
                            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                                {galleryImages.map((img, index) => {
                                    const broken = brokenIds.has(img.key)
                                    const isActive = index === selectedIndex
                                    return (
                                        <button
                                            key={img.key}
                                            onClick={() => setSelectedIndex(index)}
                                            className={`shrink-0 w-14 h-14 rounded-lg border-2 flex items-center justify-center overflow-hidden bg-white transition-colors ${
                                                isActive ? 'border-[#1F5C50]' : 'border-[#E6DCC8] hover:border-[#1F5C50]/60'
                                            }`}
                                        >
                                            {!broken ? (
                                                <img
                                                    src={img.url}
                                                    alt={`${product.name} thumbnail ${index + 1}`}
                                                    className="w-full h-full object-contain"
                                                    onError={() =>
                                                        setBrokenIds((prev) => new Set(prev).add(img.key))
                                                    }
                                                />
                                            ) : (
                                                <Package className="text-[#D8CBAE]" size={20} />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-6 sm:p-8 flex flex-col">
                        <span className="text-xs text-[#1F5C50] font-medium">
                            {product.categoryName}
                        </span>
                        <h2 className="text-2xl font-bold text-[#262019] mt-1 heading-font">
                            {product.name}
                        </h2>
                        <p className="text-3xl font-bold text-[#B5402E] mt-4 heading-font">${product.price}</p>
                        <div className="mt-3">
                            <StockPill stock={stock} />
                        </div>

                        {message && (
                            <p className="mt-4 text-sm font-medium text-[#1F5C50] bg-[#1F5C50]/10 rounded-lg px-3 py-2 inline-block w-fit">
                                {message}
                            </p>
                        )}

                        <div className="mt-auto pt-6">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => step(-1)}
                                            disabled={stock === 0}
                                            className="w-11 h-9 bg-[#FBF8F2] hover:bg-[#F1EADA] border border-[#E6DCC8] text-[#262019] rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            disabled={stock === 0}
                                            value={quantity}
                                            onChange={(e) => handleQuantityInput(e.target.value)}
                                            onBlur={handleQuantityBlur}
                                            className="w-16 border border-[#E6DCC8] rounded-lg px-2 py-1.5 text-sm text-center text-[#262019] bg-white disabled:bg-[#FBF8F2]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => step(1)}
                                            disabled={stock === 0}
                                            className="w-11 h-9 bg-[#FBF8F2] hover:bg-[#F1EADA] border border-[#E6DCC8] text-[#262019] rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        disabled={stock === 0}
                                        className="w-full bg-[#B5402E] hover:bg-[#8F2F21] text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={16} />
                                        Add to cart
                                    </button>
                                </>
                            ) : (
                                <p className="text-sm text-[#756B5A]">Log in to add this item to your cart.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetailModal