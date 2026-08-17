import { useEffect, useState } from 'react'
import { api } from './api/client'
import type { Product } from './types/Product'

function App() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        api.get('/Product')
            .then((response) => {
                console.log(response.data)
                setProducts(response.data.items)
            })
            .catch((err) => {
                console.error(err)
                setError('Failed to load products')
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    if (loading) return <p className="p-8">Loading products...</p>
    if (error) return <p className="p-8 text-red-600">{error}</p>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Products</h1>
            <ul className="space-y-2">
                {products.map((product) => (
                    <li key={product.id} className="bg-white p-4 rounded shadow">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-gray-600">${product.price}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default App