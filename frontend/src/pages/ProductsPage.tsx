import { useEffect, useState } from 'react'
import axios from 'axios'
import { ShoppingCart, Package, Minus, Plus } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import type { Product } from '../types/Product'
import type { Category } from '../types/Category'

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

function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [quantities, setQuantities] = useState<Record<number, string>>({})
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [page, setPage] = useState(1)
    const pageSize = 12
    const [totalCount, setTotalCount] = useState(0)
    const { user } = useAuth()
    const { cart, refreshCart } = useCart()

    useEffect(() => {
        api.get('/Category')
            .then((response) => {
                setCategories(response.data)
            })
            .catch((err) => {
                console.error(err)
            })
    }, [])

    useEffect(() => {
        setLoading(true)
        api.get('/Product', {
            params: {
                page,
                pageSize,
                categoryId: selectedCategoryId ?? undefined,
            },
        })
            .then((response) => {
                setProducts(response.data.items)
                setTotalCount(response.data.totalCount)
            })
            .catch((err) => {
                console.error(err)
                setError('Failed to load products')
            })
            .finally(() => {
                setLoading(false)
            })
    }, [selectedCategoryId, page])

    function selectCategory(categoryId: number | null) {
        setPage(1)
        setSelectedCategoryId(categoryId)
    }

    function inCartQuantity(productId: number) {
        return cart?.items.find((i) => i.productId === productId)?.quantity ?? 0
    }

    function availableStock(product: Product) {
        return Math.max(0, product.stockQuantity - inCartQuantity(product.id))
    }

    function getQuantity(productId: number) {
        return quantities[productId] ?? '1'
    }

    function setQuantityValue(productId: number, value: string) {
        setQuantities((prev) => ({ ...prev, [productId]: value }))
    }

    function handleQuantityInput(productId: number, value: string, max: number) {
        const sanitized = sanitizeDigits(value)
        setQuantityValue(productId, clampToMax(sanitized, max))
    }

    function handleQuantityBlur(productId: number, max: number) {
        const raw = quantities[productId] ?? '1'
        let num = parseInt(raw, 10)
        if (isNaN(num) || num < 1) num = 1
        if (num > max) num = max
        setQuantityValue(productId, String(num))
    }

    function step(productId: number, delta: number, max: number) {
        const current = parseInt(getQuantity(productId), 10) || 1
        let next = current + delta
        if (next < 1) next = 1
        if (next > max) next = max
        setQuantityValue(productId, String(next))
    }

    async function handleAddToCart(productId: number) {
        const quantity = parseInt(getQuantity(productId), 10) || 1

        try {
            await api.post('/Cart/items', { productId, quantity })
            setMessage('Added to cart!')
            refreshCart()
            setQuantityValue(productId, '1')
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

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    if (error) return <p className="p-8 text-red-600">{error}</p>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Products</h1>
            {message && <p className="mb-4 text-green-700 text-sm">{message}</p>}

            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => selectCategory(null)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategoryId === null
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    All
                </button>
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => selectCategory(category.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            selectedCategoryId === category.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-gray-500 text-sm">Loading products...</p>
            ) : products.length === 0 ? (
                <p className="text-gray-500 text-sm">No products in this category.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
                    {products.map((product) => {
                        const stock = availableStock(product)
                        return (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                            >
                                <div className="h-36 bg-gray-100 flex items-center justify-center">
                                    <Package className="text-gray-300" size={40} />
                                </div>

                                <div className="p-4 flex flex-col flex-1">
                    <span className="text-[11px] uppercase tracking-wide text-indigo-600 font-semibold">
                      {product.categoryName}
                    </span>
                                    <p className="font-semibold text-gray-800 line-clamp-1 mt-1">{product.name}</p>
                                    {product.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">{stock} in stock</p>

                                    <div className="mt-auto pt-3 flex items-center justify-between">
                                        <p className="text-lg font-bold text-gray-900">${product.price}</p>

                                        {user && (
                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                disabled={stock === 0}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ShoppingCart size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {user && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => step(product.id, -1, stock)}
                                                disabled={stock === 0}
                                                className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                disabled={stock === 0}
                                                value={getQuantity(product.id)}
                                                onChange={(e) => handleQuantityInput(product.id, e.target.value, stock)}
                                                onBlur={() => handleQuantityBlur(product.id, stock)}
                                                className="w-full border rounded px-2 py-1 text-sm text-center disabled:bg-gray-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => step(product.id, 1, stock)}
                                                disabled={stock === 0}
                                                className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {totalCount > 0 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="text-sm px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="text-sm px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}

export default ProductsPage