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
    const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
    const [pendingFiles, setPendingFiles] = useState<File[]>([])
    const [pendingPreviews, setPendingPreviews] = useState<string[]>([])
    const [brokenImageIds, setBrokenImageIds] = useState<Set<number>>(new Set())

    useEffect(() => {
        loadCategories()
    }, [])

    useEffect(() => {
        loadProducts()
    }, [page])

    useEffect(() => {
        const urls = pendingFiles.map((file) => URL.createObjectURL(file))
        setPendingPreviews(urls)
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [pendingFiles])

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

    function markImageBroken(productId: number) {
        setBrokenImageIds((prev) => new Set(prev).add(productId))
    }

    function openCreateModal() {
        setEditingProduct(null)
        setForm(emptyForm)
        setFormError(null)
        setImageError(null)
        setPendingFiles([])
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
        setPendingFiles([])
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingProduct(null)
        setForm(emptyForm)
        setFormError(null)
        setImageError(null)
        setPendingFiles([])
    }

    function updateField(field: keyof ProductFormState, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    function handlePendingFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return
        const selected = Array.from(files)
        e.target.value = ''
        setPendingFiles((prev) => [...prev, ...selected])
    }

    function removePendingFile(index: number) {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index))
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

    async function handleDeleteImage(imageId: number) {
        if (!editingProduct) return
        setImageError(null)
        setDeletingImageId(imageId)
        try {
            const response = await api.delete<Product>(`/Product/${editingProduct.id}/image/${imageId}`)
            setEditingProduct(response.data)
            setProducts((prev) => prev.map((p) => (p.id === response.data.id ? response.data : p)))
        } catch (err) {
            console.error(err)
            setImageError('Failed to delete image')
        } finally {
            setDeletingImageId(null)
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
                const createResponse = await api.post<Product>('/Product', payload)
                const newProductId = createResponse.data.id

                for (const file of pendingFiles) {
                    const formData = new FormData()
                    formData.append('file', file)
                    await api.post(`/Product/${newProductId}/image`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    })
                }
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

    if (error) return <p className="p-8 text-[#B5402E] bg-[#F6F1E7] min-h-screen">{error}</p>

    return (
        <div className="min-h-screen bg-[#F6F1E7] p-6 lg:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
                .heading-font { font-family: 'Space Grotesk', sans-serif; }
            `}</style>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#262019] heading-font">
                    Manage products
                </h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-[#B5402E] hover:bg-[#8F2F21] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                    <Plus size={16} />
                    New product
                </button>
            </div>

            {loading ? (
                <p className="text-[#756B5A] text-sm">Loading products...</p>
            ) : products.length === 0 ? (
                <p className="text-[#756B5A] text-sm">No products yet.</p>
            ) : (
                <div
                    className="bg-white rounded-2xl border border-[#E6DCC8] overflow-hidden"
                    style={{ boxShadow: '0 6px 16px -10px rgba(38,32,25,0.15)' }}
                >
                    <table className="w-full text-sm">
                        <thead className="bg-[#FBF8F2] text-[#756B5A] text-xs font-medium">
                        <tr>
                            <th className="text-left px-4 py-3">Name</th>
                            <th className="text-left px-4 py-3">Category</th>
                            <th className="text-right px-4 py-3">Price</th>
                            <th className="text-right px-4 py-3">Stock</th>
                            <th className="text-right px-4 py-3">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {products.map((product) => {
                            const showImage = product.imageUrl && !brokenImageIds.has(product.id)
                            return (
                                <tr key={product.id} className="border-t border-[#E6DCC8] hover:bg-[#FBF8F2]/60 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#FBF8F2] border border-[#E6DCC8] flex items-center justify-center overflow-hidden shrink-0">
                                                {showImage ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                        onError={() => markImageBroken(product.id)}
                                                    />
                                                ) : (
                                                    <Package className="text-[#D8CBAE]" size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#262019]">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-[#A79B85] line-clamp-1">{product.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[#1F5C50] text-xs font-medium">{product.categoryName}</td>
                                    <td className="px-4 py-3 text-right text-[#262019] font-medium">${product.price}</td>
                                    <td className="px-4 py-3 text-right text-[#756B5A]">{product.stockQuantity}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="p-1.5 rounded-lg border border-[#E6DCC8] hover:bg-[#FBF8F2] text-[#756B5A] transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                className="p-1.5 rounded-lg border border-[#B5402E]/30 hover:bg-[#B5402E]/10 text-[#B5402E] transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            {totalCount > 0 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="text-sm font-semibold px-4 py-2 rounded-full border border-[#E6DCC8] bg-white text-[#262019] hover:bg-[#1F5C50] hover:text-white hover:border-[#1F5C50] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#262019] disabled:hover:border-[#E6DCC8] transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-[#756B5A] font-medium">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="text-sm font-semibold px-4 py-2 rounded-full border border-[#E6DCC8] bg-white text-[#262019] hover:bg-[#1F5C50] hover:text-white hover:border-[#1F5C50] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#262019] disabled:hover:border-[#E6DCC8] transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 bg-[#262019]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div
                        className="bg-white rounded-2xl border border-[#E6DCC8] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
                        style={{ boxShadow: '0 30px 70px -20px rgba(38,32,25,0.35)' }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[#262019] heading-font">
                                {editingProduct ? 'Edit product' : 'New product'}
                            </h2>
                            <button onClick={closeModal} className="text-[#A79B85] hover:text-[#262019]">
                                <X size={20} />
                            </button>
                        </div>

                        {editingProduct && (
                            <div className="mb-4">
                                {editingProduct.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {editingProduct.images
                                            .slice()
                                            .sort((a, b) => a.displayOrder - b.displayOrder)
                                            .map((image) => (
                                                <div
                                                    key={image.id}
                                                    className="relative w-14 h-14 rounded-lg bg-[#FBF8F2] border border-[#E6DCC8] overflow-hidden"
                                                >
                                                    <img src={image.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteImage(image.id)}
                                                        disabled={deletingImageId === image.id}
                                                        className="absolute top-0 right-0 bg-[#262019]/70 text-white rounded-bl p-0.5 disabled:opacity-50"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                <label className="flex items-center gap-2 text-xs font-medium text-[#1F5C50] hover:text-[#163F37] cursor-pointer w-fit">
                                    <Upload size={14} />
                                    {imageUploading ? 'Uploading...' : 'Add image'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={imageUploading}
                                        className="hidden"
                                    />
                                </label>
                                {imageError && <p className="text-[#B5402E] text-xs mt-1">{imageError}</p>}
                            </div>
                        )}

                        {!editingProduct && (
                            <div className="mb-4">
                                <label className="flex items-center gap-2 text-xs font-medium text-[#1F5C50] hover:text-[#163F37] cursor-pointer w-fit">
                                    <Upload size={14} />
                                    Add images
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePendingFilesSelected}
                                        className="hidden"
                                    />
                                </label>

                                <p className="text-xs text-[#A79B85] mt-1">Pending files: {pendingFiles.length}</p>

                                {pendingFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {pendingFiles.map((file, index) => (
                                            <div key={index} className="relative w-14 h-14 rounded-lg bg-[#FBF8F2] border border-[#E6DCC8] overflow-hidden">
                                                <img
                                                    src={pendingPreviews[index]}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePendingFile(index)}
                                                    className="absolute top-0 right-0 bg-[#262019]/70 text-white rounded-bl p-0.5"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-[#756B5A] mb-1">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className="w-full border border-[#E6DCC8] rounded-xl px-3 py-2 text-sm text-[#262019] bg-[#FBF8F2] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30 focus:border-[#1F5C50]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#756B5A] mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    rows={2}
                                    className="w-full border border-[#E6DCC8] rounded-xl px-3 py-2 text-sm text-[#262019] bg-[#FBF8F2] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30 focus:border-[#1F5C50]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[#756B5A] mb-1">Price</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={form.price}
                                        onChange={(e) => updateField('price', e.target.value)}
                                        className="w-full border border-[#E6DCC8] rounded-xl px-3 py-2 text-sm text-[#262019] bg-[#FBF8F2] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30 focus:border-[#1F5C50]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#756B5A] mb-1">Stock</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={form.stockQuantity}
                                        onChange={(e) => updateField('stockQuantity', e.target.value)}
                                        className="w-full border border-[#E6DCC8] rounded-xl px-3 py-2 text-sm text-[#262019] bg-[#FBF8F2] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30 focus:border-[#1F5C50]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#756B5A] mb-1">Category</label>
                                <select
                                    value={form.categoryId}
                                    onChange={(e) => updateField('categoryId', e.target.value)}
                                    className="w-full border border-[#E6DCC8] rounded-xl px-3 py-2 text-sm bg-[#FBF8F2] text-[#262019] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30 focus:border-[#1F5C50]"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formError && <p className="text-[#B5402E] text-xs">{formError}</p>}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium rounded-xl border border-[#E6DCC8] text-[#756B5A] hover:bg-[#FBF8F2] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#B5402E] hover:bg-[#8F2F21] text-white disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? 'Saving...' : editingProduct ? 'Save changes' : 'Create product'}
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