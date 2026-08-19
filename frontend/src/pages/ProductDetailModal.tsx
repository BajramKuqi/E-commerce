import { useEffect, useState } from 'react'
import { X, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from '../types/Product'

interface ProductDetailModalProps {
    product: Product
    onClose: () => void
}

function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        setCurrentIndex(0)
    }, [product.id])

    const images = product.images.length > 0
        ? product.images.slice().sort((a, b) => a.displayOrder - b.displayOrder)
        : product.imageUrl
            ? [{ id: -1, imageUrl: product.imageUrl, isPrimary: true, displayOrder: 0 }]
            : []

    function goPrev() {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }

    function goNext() {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative h-72 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {images.length > 0 ? (
                        <img
                            src={images[currentIndex].imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <Package className="text-gray-300" size={64} />
                    )}

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={goPrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={goNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {images.map((image, index) => (
                                    <span
                                        key={image.id}
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            index === currentIndex ? 'bg-indigo-600' : 'bg-white/70'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-5">
                    <span className="text-[11px] uppercase tracking-wide text-indigo-600 font-semibold">
                        {product.categoryName}
                    </span>
                    {product.description && (
                        <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-2xl font-bold text-gray-900">${product.price}</p>
                        <p className="text-sm text-gray-400">{product.stockQuantity} in stock</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetailModal