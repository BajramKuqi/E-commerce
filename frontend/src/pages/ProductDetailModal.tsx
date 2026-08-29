import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { X, Minus, Plus, ShoppingCart, Package } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import type { Product } from '../types/Product'

function stockLabelClass(stock: number) {
    if (stock === 0) return 'text-red-400 font-semibold'
    if (stock <= 5) return 'text-[#FB923C] font-semibold'
    if (stock <= 20) return 'text-sky-400 font-semibold'
    return 'text-emerald-400 font-semibold'
}

function stockLabelText(stock: number) {
    if (stock === 0) return 'Out of stock'
    if (stock <= 5) return `Only ${stock} left`
    return `${stock} in stock`
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
            setMessage('Added to cart!')
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative bg-[#1C1A17] border border-[#2E2A24] w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                style={{
                    clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)',
                    boxShadow: '0 30px 70px -20px rgba(0,0,0,0.7), 0 0 90px -30px rgba(249,115,22,0.12)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 w-7 h-7 bg-[#F97316]" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[#161513] border border-[#2E2A24] text-[#8C857A] hover:text-[#F97316] hover:border-[#F97316]/40 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                    <div className="bg-[#161513] flex flex-col p-6 sm:min-h-[420px] border-b sm:border-b-0 sm:border-r border-[#2E2A24]">
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
                                <Package className="text-[#3A352C]" size={80} />
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
                                            className={`shrink-0 w-14 h-14 rounded-lg border-2 flex items-center justify-center overflow-hidden bg-[#1C1A17] transition-colors ${
                                                isActive ? 'border-[#F97316]' : 'border-[#2E2A24] hover:border-[#F97316]/60'
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
                                                <Package className="text-[#3A352C]" size={20} />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-6 sm:p-8 flex flex-col">
                        <span className="text-[11px] uppercase tracking-wide text-[#F97316] font-semibold">
                            {product.categoryName}
                        </span>
                        <h2 className="text-2xl font-bold text-[#F5F1EA] mt-1">
                            {product.name}
                        </h2>
                        <p className="text-3xl font-bold text-[#F97316] mt-4">${product.price}</p>
                        <p className={`text-sm mt-2 ${stockLabelClass(stock)}`}>{stockLabelText(stock)}</p>

                        {message && (
                            <p className="mt-4 text-sm font-medium text-emerald-400">{message}</p>
                        )}

                        <div className="mt-auto pt-6">
                            {user ? (
                                <>
                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => step(-1)}
                                            disabled={stock === 0}
                                            className="w-12 h-9 bg-[#161513] hover:bg-[#242019] border border-[#2E2A24] text-[#F5F1EA] rounded flex items-center justify-center disabled:opacity-40 transition-colors"
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
                                            className="w-16 border border-[#2E2A24] rounded px-2 py-1.5 text-sm text-center text-[#F5F1EA] bg-[#161513] disabled:bg-[#1C1A17]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => step(1)}
                                            disabled={stock === 0}
                                            className="w-12 h-9 bg-[#161513] hover:bg-[#242019] border border-[#2E2A24] text-[#F5F1EA] rounded flex items-center justify-center disabled:opacity-40 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        disabled={stock === 0}
                                        className="w-full bg-[#F97316] hover:bg-[#EA580C] text-[#161513] text-sm font-semibold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={16} />
                                        Add to cart
                                    </button>
                                </>
                            ) : (
                                <p className="text-sm text-[#8C857A]">Log in to add this item to your cart.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetailModal