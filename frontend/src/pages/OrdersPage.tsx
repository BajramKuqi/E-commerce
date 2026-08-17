import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { orderStatusLabels } from '../types/Order'
import type { OrderDto } from '../types/Order'

const statusColors: Record<number, string> = {
    0: 'bg-yellow-100 text-yellow-700',
    1: 'bg-green-100 text-green-700',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-indigo-100 text-indigo-700',
    4: 'bg-gray-200 text-gray-600',
    5: 'bg-red-100 text-red-700',
}

function OrdersPage() {
    const [orders, setOrders] = useState<OrderDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        api.get<OrderDto[]>('/Order')
            .then((response) => setOrders(response.data))
            .catch((err) => {
                console.error(err)
                setError('Failed to load orders')
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <p className="p-8">Loading orders...</p>
    if (error) return <p className="p-8 text-red-600">{error}</p>
    if (orders.length === 0) return <p className="p-8">You have no orders yet.</p>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Orders</h1>
            <div className="space-y-4">
                {orders.map((order) => (
                    <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-gray-800">Order #{order.id}</p>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status]}`}>
                {orderStatusLabels[order.status]}
              </span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1 mb-3">
                            {order.items.map((item) => (
                                <li key={item.productId} className="flex justify-between">
                                    <span>{item.productName} × {item.quantity}</span>
                                    <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-right font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default OrdersPage