import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
    ShoppingCart,
    Package,
    Minus,
    Plus,
    Search,
    LayoutGrid,
    List,
    SlidersHorizontal,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ProductDetailModal from '../pages/ProductDetailModal'
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

function stockLabelClass(stock: number) {
    if (stock === 0) return 'text-red-600 font-semibold'
    if (stock <= 5) return 'text-orange-600 font-semibold'
    if (stock <= 20) return 'text-blue-600 font-semibold'
    return 'text-green-600 font-semibold'
}

function stockLabelText(stock: number) {
    if (stock === 0) return 'Out of stock'
    if (stock <= 5) return `Only ${stock} left`
    return `${stock} in stock`
}

const PRICE_CEILING = 500

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'
type ViewMode = 'grid' | 'list'

function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [quantities, setQuantities] = useState<Record<number, string>>({})
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
    const [page, setPage] = useState(1)
    const pageSize = 12
    const [totalCount, setTotalCount] = useState(0)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [brokenImageIds, setBrokenImageIds] = useState<Set<number>>(new Set())

    const [searchTerm, setSearchTerm] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [sortOption, setSortOption] = useState<SortOption>('newest')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

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

    function clearFilters() {
        setSearchTerm('')
        setMinPrice('')
        setMaxPrice('')
        setSortOption('newest')
        selectCategory(null)
    }

    function markImageBroken(productId: number) {
        setBrokenImageIds((prev) => new Set(prev).add(productId))
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

    const minPriceNum = minPrice === '' ? 0 : parseInt(minPrice, 10)
    const maxPriceNum = maxPrice === '' ? PRICE_CEILING : parseInt(maxPrice, 10)

    const visibleProducts = useMemo(() => {
        let list = products.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
            const matchesPrice = p.price >= minPriceNum && p.price <= maxPriceNum
            return matchesSearch && matchesPrice
        })

        list = [...list]
        switch (sortOption) {
            case 'price-asc':
                list.sort((a, b) => a.price - b.price)
                break
            case 'price-desc':
                list.sort((a, b) => b.price - a.price)
                break
            case 'name-asc':
                list.sort((a, b) => a.name.localeCompare(b.name))
                break
            default:
                break
        }
        return list
    }, [products, searchTerm, minPriceNum, maxPriceNum, sortOption])

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    const selectedCategoryName =
        selectedCategoryId === null
            ? 'All Categories'
            : categories.find((c) => c.id === selectedCategoryId)?.name ?? 'All Categories'

    if (error) return <p className="p-8 text-[#9C4325]">{error}</p>

    return (
        <div className="min-h-screen bg-white">
            <style>{`
                .dual-range { position: relative; height: 20px; }
                .dual-range input[type='range'] {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    margin: 0;
                    background: transparent;
                    pointer-events: none;
                    -webkit-appearance: none;
                }
                .dual-range input[type='range']::-webkit-slider-thumb {
                    pointer-events: auto;
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 9999px;
                    background: #F97316;
                    border: 2px solid white;
                    box-shadow: 0 1px 3px rgba(43,29,20,0.3);
                    cursor: pointer;
                    margin-top: -6px;
                }
                .dual-range input[type='range']::-moz-range-thumb {
                    pointer-events: auto;
                    width: 16px;
                    height: 16px;
                    border-radius: 9999px;
                    background: #F97316;
                    border: 2px solid white;
                    box-shadow: 0 1px 3px rgba(43,29,20,0.3);
                    cursor: pointer;
                }
                .dual-range input[type='range']::-webkit-slider-runnable-track {
                    height: 4px;
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="flex">
                <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-[#E4D5C1] bg-white p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    <div className="relative mb-6">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8A896]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4D5C1]/70 rounded-md bg-white text-[#2B1D14] placeholder-[#B8A896] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                        />
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xs font-semibold text-[#B8A896] uppercase tracking-wide mb-3">
                            Categories
                        </h3>

                        <button
                            onClick={() => setCategoryDropdownOpen((v) => !v)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                categoryDropdownOpen
                                    ? 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/40'
                                    : 'text-[#2B1D14] border-[#E4D5C1] hover:bg-[#F6EEE2]'
                            }`}
                        >
                            <span>{selectedCategoryName}</span>
                            <ChevronDown
                                size={16}
                                className={`transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {categoryDropdownOpen && (
                            <div className="flex flex-col gap-1 mt-2 border border-[#E4D5C1] rounded-lg p-2">
                                <button
                                    onClick={() => selectCategory(null)}
                                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        selectedCategoryId === null
                                            ? 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/40'
                                            : 'text-[#7A6A5A] border-transparent hover:bg-[#F6EEE2]'
                                    }`}
                                >
                                    All Categories
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => selectCategory(category.id)}
                                        className={`text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                            selectedCategoryId === category.id
                                                ? 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/40'
                                                : 'text-[#7A6A5A] border-transparent hover:bg-[#F6EEE2]'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xs font-semibold text-[#B8A896] uppercase tracking-wide mb-3">
                            Price Range
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(sanitizeDigits(e.target.value))}
                                className="w-1/2 px-2 py-1.5 text-sm border border-[#2B1D14]/20 rounded-md bg-white text-[#2B1D14] font-semibold placeholder-[#7A6A5A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                            />
                            <span className="text-[#2B1D14] font-semibold">-</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(sanitizeDigits(e.target.value))}
                                className="w-1/2 px-2 py-1.5 text-sm border border-[#2B1D14]/20 rounded-md bg-white text-[#2B1D14] font-semibold placeholder-[#7A6A5A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                            />
                        </div>
                        <div className="dual-range">
                            <input
                                type="range"
                                min={0}
                                max={PRICE_CEILING}
                                value={minPriceNum}
                                onChange={(e) => {
                                    const val = Math.min(Number(e.target.value), maxPriceNum)
                                    setMinPrice(String(val))
                                }}
                            />
                            <input
                                type="range"
                                min={0}
                                max={PRICE_CEILING}
                                value={maxPriceNum}
                                onChange={(e) => {
                                    const val = Math.max(Number(e.target.value), minPriceNum)
                                    setMaxPrice(String(val))
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-[#B8A896] mt-2">
                            <span>$0</span>
                            <span>${PRICE_CEILING}+</span>
                        </div>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="mt-auto text-sm font-bold text-[#2B1D14] border-2 border-[#2B1D14]/25 rounded-lg py-2 hover:bg-[#F6EEE2] transition-colors"
                    >
                        Clear Filters
                    </button>
                </aside>

                <main className="flex-1 p-6 lg:p-8 bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div>
                            <h1
                                className="text-2xl text-[#2B1D14]"
                                style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
                            >
                                Products
                            </h1>
                            <p className="text-sm text-[#7A6A5A] mt-1">Browse our full collection.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={14} className="text-[#7A6A5A]" />
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    className="text-sm border border-[#E4D5C1] rounded-md px-3 py-2 bg-white text-[#2B1D14] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                                >
                                    <option value="newest">Sort by: Newest</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name-asc">Name: A to Z</option>
                                </select>
                            </div>

                            <div className="flex items-center border border-[#E4D5C1] rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-[#2B1D14] text-white' : 'bg-white text-[#7A6A5A] hover:bg-[#F6EEE2]'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-[#2B1D14] text-white' : 'bg-white text-[#7A6A5A] hover:bg-[#F6EEE2]'}`}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:hidden mb-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8A896]" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E4D5C1]/70 rounded-md bg-white text-[#2B1D14] placeholder-[#B8A896] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                                />
                            </div>
                            <button
                                onClick={() => setMobileFiltersOpen((v) => !v)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${
                                    mobileFiltersOpen
                                        ? 'bg-[#2B1D14] text-white border-[#2B1D14]'
                                        : 'bg-white text-[#7A6A5A] border-[#E4D5C1]'
                                }`}
                            >
                                <SlidersHorizontal size={14} />
                                Filters
                            </button>
                        </div>

                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                            <button
                                onClick={() => selectCategory(null)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                    selectedCategoryId === null
                                        ? 'bg-[#F97316] text-white border-[#F97316]'
                                        : 'bg-white border-[#E4D5C1] text-[#7A6A5A]'
                                }`}
                            >
                                All
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => selectCategory(category.id)}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                        selectedCategoryId === category.id
                                            ? 'bg-[#F97316] text-white border-[#F97316]'
                                            : 'bg-white border-[#E4D5C1] text-[#7A6A5A]'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        {mobileFiltersOpen && (
                            <div className="bg-white border border-[#E4D5C1] rounded-lg p-4">
                                <h3 className="text-xs font-semibold text-[#B8A896] uppercase tracking-wide mb-3">
                                    Price Range
                                </h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(sanitizeDigits(e.target.value))}
                                        className="w-1/2 px-2 py-1.5 text-sm border border-[#2B1D14]/20 rounded-md bg-white text-[#2B1D14] font-semibold placeholder-[#7A6A5A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                                    />
                                    <span className="text-[#2B1D14] font-semibold">-</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(sanitizeDigits(e.target.value))}
                                        className="w-1/2 px-2 py-1.5 text-sm border border-[#2B1D14]/20 rounded-md bg-white text-[#2B1D14] font-semibold placeholder-[#7A6A5A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                                    />
                                </div>
                                <div className="dual-range">
                                    <input
                                        type="range"
                                        min={0}
                                        max={PRICE_CEILING}
                                        value={minPriceNum}
                                        onChange={(e) => {
                                            const val = Math.min(Number(e.target.value), maxPriceNum)
                                            setMinPrice(String(val))
                                        }}
                                    />
                                    <input
                                        type="range"
                                        min={0}
                                        max={PRICE_CEILING}
                                        value={maxPriceNum}
                                        onChange={(e) => {
                                            const val = Math.max(Number(e.target.value), minPriceNum)
                                            setMaxPrice(String(val))
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-[#B8A896] mt-2 mb-4">
                                    <span>$0</span>
                                    <span>${PRICE_CEILING}+</span>
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="w-full text-sm font-bold text-[#2B1D14] border-2 border-[#2B1D14]/25 rounded-lg py-2 hover:bg-[#F6EEE2] transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {message && <p className="mb-4 text-[#3E5A2F] font-medium text-sm">{message}</p>}

                    {loading ? (
                        <p className="text-[#7A6A5A] text-sm">Loading products...</p>
                    ) : visibleProducts.length === 0 ? (
                        <p className="text-[#7A6A5A] text-sm">No products match your filters.</p>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {visibleProducts.map((product) => {
                                const stock = availableStock(product)
                                const showImage = product.imageUrl && !brokenImageIds.has(product.id)
                                return (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-xl shadow-sm border border-[#F97316]/30 overflow-hidden flex flex-col hover:shadow-lg hover:border-[#F97316] hover:-translate-y-0.5 transition-all"
                                    >
                                        <div
                                            className="h-36 bg-white border-b border-[#F0E6D6] p-1 flex items-center justify-center overflow-hidden cursor-pointer"
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            {showImage ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain rounded-lg"
                                                    onError={() => markImageBroken(product.id)}
                                                />
                                            ) : (
                                                <Package className="text-[#D9CBB8]" size={40} />
                                            )}
                                        </div>

                                        <div className="p-4 flex flex-col flex-1">
                                            <p className="font-semibold text-[#2B1D14] line-clamp-1">{product.name}</p>
                                            <p className="text-lg font-bold text-[#2B1D14] mt-1">${product.price}</p>
                                            <p className={`text-xs mt-1 ${stockLabelClass(stock)}`}>{stockLabelText(stock)}</p>

                                            {user && (
                                                <div className="flex items-center gap-2 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => step(product.id, -1, stock)}
                                                        disabled={stock === 0}
                                                        className="w-10 h-7 bg-white hover:bg-[#2B1D14]/5 border border-[#2B1D14]/40 text-[#2B1D14] rounded flex items-center justify-center disabled:opacity-40 transition-colors"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        disabled={stock === 0}
                                                        value={getQuantity(product.id)}
                                                        onChange={(e) => handleQuantityInput(product.id, e.target.value, stock)}
                                                        onBlur={() => handleQuantityBlur(product.id, stock)}
                                                        className="w-full border border-[#E4D5C1] rounded px-2 py-1 text-sm text-center text-[#2B1D14] bg-white disabled:bg-[#F6EEE2]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => step(product.id, 1, stock)}
                                                        disabled={stock === 0}
                                                        className="w-10 h-7 bg-white hover:bg-[#2B1D14]/5 border border-[#2B1D14]/40 text-[#2B1D14] rounded flex items-center justify-center disabled:opacity-40 transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                disabled={!user || stock === 0}
                                                className="mt-3 w-full bg-[#F97316] hover:bg-[#EA580C] border border-[#C2410C] text-white text-sm font-medium py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ShoppingCart size={14} />
                                                Add to cart
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {visibleProducts.map((product) => {
                                const stock = availableStock(product)
                                const showImage = product.imageUrl && !brokenImageIds.has(product.id)
                                return (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-xl shadow-sm border border-[#F97316]/30 p-4 flex items-center gap-4 hover:shadow-lg hover:border-[#F97316] transition-all"
                                    >
                                        <div
                                            className="w-20 h-20 shrink-0 bg-white border border-[#F0E6D6] rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            {showImage ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain"
                                                    onError={() => markImageBroken(product.id)}
                                                />
                                            ) : (
                                                <Package className="text-[#D9CBB8]" size={28} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[#2B1D14] truncate">{product.name}</p>
                                            <span className="text-[11px] uppercase tracking-wide text-[#F97316] font-semibold">
                                                {product.categoryName}
                                            </span>
                                            <p className={`text-xs mt-1 ${stockLabelClass(stock)}`}>{stockLabelText(stock)}</p>
                                        </div>

                                        <p className="text-lg font-bold text-[#2B1D14] shrink-0">${product.price}</p>

                                        {user && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => step(product.id, -1, stock)}
                                                    disabled={stock === 0}
                                                    className="w-10 h-7 bg-white hover:bg-[#2B1D14]/5 border border-[#2B1D14]/40 text-[#2B1D14] rounded flex items-center justify-center disabled:opacity-40 transition-colors"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    disabled={stock === 0}
                                                    value={getQuantity(product.id)}
                                                    onChange={(e) => handleQuantityInput(product.id, e.target.value, stock)}
                                                    onBlur={() => handleQuantityBlur(product.id, stock)}
                                                    className="w-14 border border-[#E4D5C1] rounded px-2 py-1 text-sm text-center text-[#2B1D14] bg-white disabled:bg-[#F6EEE2]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => step(product.id, 1, stock)}
                                                    disabled={stock === 0}
                                                    className="w-10 h-7 bg-white hover:bg-[#2B1D14]/5 border border-[#2B1D14]/40 text-[#2B1D14] rounded flex items-center justify-center disabled:opacity-40 transition-colors"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {user && (
                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                disabled={stock === 0}
                                                className="bg-[#F97316] hover:bg-[#EA580C] border border-[#C2410C] text-white p-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                                            >
                                                <ShoppingCart size={18} />
                                            </button>
                                        )}
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
                                className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg border-2 border-[#F97316]/40 bg-white text-[#2B1D14] hover:bg-[#F97316] hover:text-white hover:border-[#F97316] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2B1D14] disabled:hover:border-[#F97316]/40 transition-colors"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <span className="text-sm text-[#2B1D14] font-semibold">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg border-2 border-[#F97316]/40 bg-white text-[#2B1D14] hover:bg-[#F97316] hover:text-white hover:border-[#F97316] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#2B1D14] disabled:hover:border-[#F97316]/40 transition-colors"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    )
}

export default ProductsPage