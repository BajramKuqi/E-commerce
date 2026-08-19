import { useEffect, useState } from 'react'
import axios from 'axios'
import { Pencil, Trash2, Plus, X, Package, Upload } from 'lucide-react'
import { api } from '../api/client'
import type { Product } from '../types/Product'
import type { Category } from '../types/Category'

interface ProductFormState {
    name: string
    description: string
    price: string
    stockQuantity: string
    categoryId: string
}

const emptyForm: ProductFormState = {
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    categoryId: '',
}

function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [page, setPage] = useState(1)
    const pageSize = 10
    const [totalCount, setTotalCount] = useState(0)

    const [modalOpen, setModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [form, setForm] = useState<ProductFormState>(emptyForm)
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [imageUploading, setImageUploading] = useState(false)
    const [imageError, setImageError] = useState<string | null>(null)

    useEffect(() => {
        loadCategories()
    }, [])

    useEffect(() => {
        loadProducts()
    }, [page])

    function loadCategories() {
        api.get('/Category')
            .then((response) => setCategories(response.data))
            .catch((err) => console.error(err))
    }

    function loadProducts() {
        setLoading(true)
        api.get('/Product', { params: { page, pageSize } })
            .then((response) => {
                setProducts(response.data.items)
                setTotalCount(response.data.totalCount)
            })
            .catch((err) => {
                console.error(err)
                setError('Failed to load products')
            })
            .finally(() => setLoading(false))
    }

    function openCreateModal() {
        setEditingProduct(null)
        setForm(emptyForm)
        setFormError(null)
        setImageError(null)
        setModalOpen(true)
    }

    function openEditModal(product: Product) {
        setEditingProduct(product)
        setForm({
            name: product.name,
            description: product.description ?? '',
            price: String(product.price),
            stockQuantity: String(product.stockQuantity),
            categoryId: String(product.categoryId),
        })
        setFormError(null)
        setImageError(null)
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingProduct(null)
        setForm(emptyForm)
        setFormError(null)
        setImageError(null)
    }

    function updateField(field: keyof ProductFormState, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!editingProduct) return
        const file = e.target.files?.[0]
        if (!file) return

        setImageError(null)
        setImageUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await api.post<Product>(`/Product/${editingProduct.id}/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            setEditingProduct(response.data)
            setProducts((prev) => prev.map((p) => (p.id === response.data.id ? response.data : p)))
        } catch (err) {
            console.error(err)
            setImageError('Failed to upload image')
        } finally {
            setImageUploading(false)
            e.target.value = ''
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFormError(null)

        if (!form.name.trim()) {
            setFormError('Name is required')
            return
        }
        if (!form.categoryId) {
            setFormError('Category is required')
            return
        }
        const price = parseFloat(form.price)
        const stockQuantity = parseInt(form.stockQuantity, 10)
        if (isNaN(price) || price < 0) {
            setFormError('Enter a valid price')
            return
        }
        if (isNaN(stockQuantity) || stockQuantity < 0) {
            setFormError('Enter a valid stock quantity')
            return
        }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price,
            stockQuantity,
            categoryId: parseInt(form.categoryId, 10),
        }

        setSubmitting(true)
        try {
            if (editingProduct) {
                await api.put(`/Product/${editingProduct.id}`, {
                    ...payload,
                    rowVersion: editingProduct.rowVersion,
                })
            } else {
                await api.post('/Product', payload)
            }
            closeModal()
            loadProducts()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 409) {
                    setFormError('This product was modified by someone else. Close and try again.')
                } else {
                    setFormError(String(err.response?.data ?? 'Something went wrong'))
                }
            } else {
                setFormError('Something went wrong')
            }
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(product: Product) {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return

        try {
            await api.delete(`/Product/${product.id}`)
            if (products.length === 1 && page > 1) {
                setPage((p) => p - 1)
            } else {
                loadProducts()
            }
        } catch (err) {
            console.error(err)
            alert('Failed to delete product')
        }
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    if (error) return <p className="p-8 text-red-600">{error}</p>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Products</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    New Product
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500 text-sm">Loading products...</p>
            ) : products.length === 0 ? (
                <p className="text-gray-500 text-sm">No products yet.</p>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="text-left px-4 py-3">Name</th>
                            <th className="text-left px-4 py-3">Category</th>
                            <th className="text-right px-4 py-3">Price</th>
                            <th className="text-right px-4 py-3">Stock</th>
                            <th className="text-right px-4 py-3">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className="border-t border-gray-100">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="text-gray-300" size={18} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{product.name}</p>
                                            {product.description && (
                                                <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{product.categoryName}</td>
                                <td className="px-4 py-3 text-right text-gray-800">${product.price}</td>
                                <td className="px-4 py-3 text-right text-gray-600">{product.stockQuantity}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product)}
                                            className="p-1.5 rounded hover:bg-red-50 text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalCount > 0 && (
                <div className="flex items-center justify-center gap-4 mt-6">
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

            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {editingProduct ? 'Edit Product' : 'New Product'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {editingProduct && (
                            <div className="mb-4 flex items-center gap-3">
                                <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                    {editingProduct.imageUrl ? (
                                        <img src={editingProduct.imageUrl} alt={editingProduct.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="text-gray-300" size={24} />
                                    )}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer">
                                        <Upload size={14} />
                                        {imageUploading ? 'Uploading...' : 'Upload Image'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={imageUploading}
                                            className="hidden"
                                        />
                                    </label>
                                    {imageError && <p className="text-red-600 text-xs mt-1">{imageError}</p>}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    rows={2}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={form.price}
                                        onChange={(e) => updateField('price', e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={form.stockQuantity}
                                        onChange={(e) => updateField('stockQuantity', e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                                <select
                                    value={form.categoryId}
                                    onChange={(e) => updateField('categoryId', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm bg-white"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formError && <p className="text-red-600 text-xs">{formError}</p>}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminProductsPage