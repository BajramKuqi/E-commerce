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
            setMessage('Added to cart')
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
            ? 'All categories'
            : categories.find((c) => c.id === selectedCategoryId)?.name ?? 'All categories'

    if (error) return <p className="p-8 text-[#B5402E] bg-[#F6F1E7] min-h-screen font-medium">{error}</p>

    return (
        <div className="min-h-screen bg-[#F6F1E7]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
                .heading-font { font-family: 'Space Grotesk', sans-serif; }

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
                    background: #1F5C50;
                    border: 2px solid #F6F1E7;
                    box-shadow: 0 1px 3px rgba(38,32,25,0.3);
                    cursor: pointer;
                    margin-top: -6px;
                }
                .dual-range input[type='range']::-moz-range-thumb {
                    pointer-events: auto;
                    width: 16px;
                    height: 16px;
                    border-radius: 9999px;
                    background: #1F5C50;
                    border: 2px solid #F6F1E7;
                    box-shadow: 0 1px 3px rgba(38,32,25,0.3);
                    cursor: pointer;
                }
                .dual-range input[type='range']::-webkit-slider-runnable-track {
                    height: 4px;
                    background: #E6DCC8;
                    border-radius: 2px;
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="flex">
                <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-[#E6DCC8] bg-white p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    <div className="relative mb-6">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A79B85]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6DCC8] rounded-xl bg-[#FBF8F2] text-[#262019] placeholder-[#A79B85] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30 focus:border-[#1F5C50]"
                        />
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-[#262019] mb-3 heading-font">
                            Categories
                        </h3>

                        <button
                            onClick={() => setCategoryDropdownOpen((v) => !v)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                                categoryDropdownOpen
                                    ? 'bg-[#1F5C50]/10 text-[#1F5C50] border-[#1F5C50]/40'
                                    : 'text-[#262019] border-[#E6DCC8] hover:bg-[#FBF8F2]'
                            }`}
                        >
                            <span>{selectedCategoryName}</span>
                            <ChevronDown
                                size={16}
                                className={`transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {categoryDropdownOpen && (
                            <div className="flex flex-col gap-1 mt-2 border border-[#E6DCC8] rounded-xl p-2 bg-[#FBF8F2]">
                                <button
                                    onClick={() => selectCategory(null)}
                                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedCategoryId === null
                                            ? 'bg-[#1F5C50]/10 text-[#1F5C50]'
                                            : 'text-[#756B5A] hover:bg-white'
                                    }`}
                                >
                                    All categories
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => selectCategory(category.id)}
                                        className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            selectedCategoryId === category.id
                                                ? 'bg-[#1F5C50]/10 text-[#1F5C50]'
                                                : 'text-[#756B5A] hover:bg-white'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-[#262019] mb-3 heading-font">
                            Price range
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(sanitizeDigits(e.target.value))}
                                className="w-1/2 px-2 py-1.5 text-sm border border-[#E6DCC8] rounded-lg bg-[#FBF8F2] text-[#262019] font-semibold placeholder-[#A79B85] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30"
                            />
                            <span className="text-[#A79B85] font-semibold">–</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(sanitizeDigits(e.target.value))}
                                className="w-1/2 px-2 py-1.5 text-sm border border-[#E6DCC8] rounded-lg bg-[#FBF8F2] text-[#262019] font-semibold placeholder-[#A79B85] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30"
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
                        <div className="flex justify-between text-xs text-[#A79B85] mt-2">
                            <span>$0</span>
                            <span>${PRICE_CEILING}+</span>
                        </div>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="mt-auto text-sm font-semibold text-[#262019] border border-[#E6DCC8] rounded-xl py-2.5 hover:bg-[#FBF8F2] hover:border-[#1F5C50]/40 transition-colors"
                    >
                        Clear filters
                    </button>
                </aside>

                <main className="flex-1 p-6 lg:p-8 bg-[#F6F1E7]">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[#262019] heading-font">
                                Shop the collection
                            </h1>
                            <p className="text-sm text-[#756B5A] mt-1">Browse everything we've got in stock.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={14} className="text-[#756B5A]" />
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    className="text-sm border border-[#E6DCC8] rounded-lg px-3 py-2 bg-white text-[#262019] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30"
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="price-asc">Price: low to high</option>
                                    <option value="price-desc">Price: high to low</option>
                                    <option value="name-asc">Name: A to Z</option>
                                </select>
                            </div>

                            <div className="flex items-center border border-[#E6DCC8] rounded-lg overflow-hidden bg-white">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-[#1F5C50] text-white' : 'text-[#756B5A] hover:bg-[#FBF8F2]'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-[#1F5C50] text-white' : 'text-[#756B5A] hover:bg-[#FBF8F2]'}`}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:hidden mb-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A79B85]" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E6DCC8] rounded-xl bg-white text-[#262019] placeholder-[#A79B85] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30"
                                />
                            </div>
                            <button
                                onClick={() => setMobileFiltersOpen((v) => !v)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border ${
                                    mobileFiltersOpen
                                        ? 'bg-[#1F5C50] text-white border-[#1F5C50]'
                                        : 'bg-white text-[#756B5A] border-[#E6DCC8]'
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
                                        ? 'bg-[#1F5C50] text-white border-[#1F5C50]'
                                        : 'bg-white border-[#E6DCC8] text-[#756B5A]'
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
                                            ? 'bg-[#1F5C50] text-white border-[#1F5C50]'
                                            : 'bg-white border-[#E6DCC8] text-[#756B5A]'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        {mobileFiltersOpen && (
                            <div className="bg-white border border-[#E6DCC8] rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-[#262019] mb-3 heading-font">
                                    Price range
                                </h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(sanitizeDigits(e.target.value))}
                                        className="w-1/2 px-2 py-1.5 text-sm border border-[#E6DCC8] rounded-lg bg-[#FBF8F2] text-[#262019] font-semibold placeholder-[#A79B85] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30"
                                    />
                                    <span className="text-[#A79B85] font-semibold">–</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(sanitizeDigits(e.target.value))}
                                        className="w-1/2 px-2 py-1.5 text-sm border border-[#E6DCC8] rounded-lg bg-[#FBF8F2] text-[#262019] font-semibold placeholder-[#A79B85] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30"
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
                                <div className="flex justify-between text-xs text-[#A79B85] mt-2 mb-4">
                                    <span>$0</span>
                                    <span>${PRICE_CEILING}+</span>
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="w-full text-sm font-semibold text-[#262019] border border-[#E6DCC8] rounded-xl py-2.5 hover:bg-[#FBF8F2] hover:border-[#1F5C50]/40 transition-colors"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>

                    {message && (
                        <p className="mb-4 text-[#1F5C50] font-medium text-sm bg-[#1F5C50]/10 rounded-lg px-3 py-2 inline-block">
                            {message}
                        </p>
                    )}

                    {loading ? (
                        <p className="text-[#756B5A] text-sm">Loading products...</p>
                    ) : visibleProducts.length === 0 ? (
                        <p className="text-[#756B5A] text-sm">No products match your filters. Try widening your price range or search term.</p>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                            {visibleProducts.map((product) => {
                                const stock = availableStock(product)
                                const showImage = product.imageUrl && !brokenImageIds.has(product.id)
                                return (
                                    <div
                                        key={product.id}
                                        className="bg-white border border-[#E6DCC8] rounded-2xl overflow-hidden flex flex-col hover:border-[#1F5C50]/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                                        style={{ boxShadow: '0 6px 16px -10px rgba(38,32,25,0.25)' }}
                                    >
                                        <div
                                            className="h-36 bg-[#FBF8F2] border-b border-[#E6DCC8] p-2 flex items-center justify-center overflow-hidden cursor-pointer"
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
                                                <Package className="text-[#D8CBAE]" size={40} />
                                            )}
                                        </div>

                                        <div className="p-4 flex flex-col flex-1">
                                            <p className="font-semibold text-[#262019] line-clamp-1">{product.name}</p>
                                            <p className="text-lg font-bold text-[#B5402E] mt-1 heading-font">${product.price}</p>
                                            <div className="mt-1.5">
                                                <StockPill stock={stock} />
                                            </div>

                                            {user && (
                                                <div className="flex items-center gap-2 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => step(product.id, -1, stock)}
                                                        disabled={stock === 0}
                                                        className="w-9 h-8 bg-[#FBF8F2] hover:bg-[#F1EADA] border border-[#E6DCC8] text-[#262019] rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors"
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
                                                        className="w-full border border-[#E6DCC8] rounded-lg px-2 py-1 text-sm text-center text-[#262019] bg-white disabled:bg-[#FBF8F2]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => step(product.id, 1, stock)}
                                                        disabled={stock === 0}
                                                        className="w-9 h-8 bg-[#FBF8F2] hover:bg-[#F1EADA] border border-[#E6DCC8] text-[#262019] rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                disabled={!user || stock === 0}
                                                className="mt-3 w-full bg-[#B5402E] hover:bg-[#8F2F21] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
                                        className="bg-white rounded-2xl border border-[#E6DCC8] p-4 flex items-center gap-4 hover:border-[#1F5C50]/40 hover:shadow-md transition-all"
                                        style={{ boxShadow: '0 6px 16px -10px rgba(38,32,25,0.2)' }}
                                    >
                                        <div
                                            className="w-20 h-20 shrink-0 bg-[#FBF8F2] border border-[#E6DCC8] rounded-xl flex items-center justify-center overflow-hidden cursor-pointer"
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
                                                <Package className="text-[#D8CBAE]" size={28} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[#262019] truncate">{product.name}</p>
                                            <span className="text-xs text-[#1F5C50] font-medium">
                                                {product.categoryName}
                                            </span>
                                            <div className="mt-1.5">
                                                <StockPill stock={stock} />
                                            </div>
                                        </div>

                                        <p className="text-lg font-bold text-[#B5402E] shrink-0 heading-font">${product.price}</p>

                                        {user && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => step(product.id, -1, stock)}
                                                    disabled={stock === 0}
                                                    className="w-9 h-8 bg-[#FBF8F2] hover:bg-[#F1EADA] border border-[#E6DCC8] text-[#262019] rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors"
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
                                                    className="w-14 border border-[#E6DCC8] rounded-lg px-2 py-1 text-sm text-center text-[#262019] bg-white disabled:bg-[#FBF8F2]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => step(product.id, 1, stock)}
                                                    disabled={stock === 0}
                                                    className="w-9 h-8 bg-[#FBF8F2] hover:bg-[#F1EADA] border border-[#E6DCC8] text-[#262019] rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {user && (
                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                disabled={stock === 0}
                                                className="bg-[#B5402E] hover:bg-[#8F2F21] text-white p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
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
                                className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-full border border-[#E6DCC8] bg-white text-[#262019] hover:bg-[#1F5C50] hover:text-white hover:border-[#1F5C50] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#262019] disabled:hover:border-[#E6DCC8] transition-colors"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <span className="text-sm text-[#756B5A] font-medium">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-full border border-[#E6DCC8] bg-white text-[#262019] hover:bg-[#1F5C50] hover:text-white hover:border-[#1F5C50] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#262019] disabled:hover:border-[#E6DCC8] transition-colors"
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