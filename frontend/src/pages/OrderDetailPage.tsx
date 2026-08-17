import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { api } from '../api/client'
import { orderStatusLabels, OrderStatus } from '../types/Order'
import type { OrderDto } from '../types/Order'

const statusColors: Record<number, string> = {
    0: 'bg-yellow-100 text-yellow-700',
    1: 'bg-green-100 text-green-700',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-indigo-100 text-indigo-700',
    4: 'bg-gray-200 text-gray-600',
    5: 'bg-red-100 text-red-700',
}

function OrderDetailPage() {
    const { id } = useParams()
    const [order, setOrder] = useState<OrderDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cancelling, setCancelling] = useState(false)
    const [cancelError, setCancelError] = useState<string | null>(null)

    function fetchOrder() {
        api.get<OrderDto>(`/Order/${id}`)
            .then((response) => setOrder(response.data))
            .catch((err) => {
                console.error(err)
                setError('Order not found')
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchOrder()
    }, [id])

    async function handleCancel() {
        if (!order) return
        setCancelling(true)
        setCancelError(null)

        try {
            await api.post(`/Order/${order.id}/cancel`)
            fetchOrder()
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                setCancelError('Only pending orders can be cancelled')
            } else {
                setCancelError('Could not cancel order')
            }
        } finally {
            setCancelling(false)
        }
    }

    if (loading) return <p className="p-8">Loading order...</p>
    if (error || !order) return <p className="p-8 text-red-600">{error ?? 'Order not found'}</p>

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Order #{order.id}</h1>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status]}`}>
            {orderStatusLabels[order.status]}
          </span>
                </div>

                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    {order.items.map((item) => (
                        <li key={item.productId} className="flex justify-between">
                            <span>{item.productName} × {item.quantity}</span>
                            <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>

                <p className="text-right font-bold text-gray-900 mb-6">${order.totalAmount.toFixed(2)}</p>

                {cancelError && <p className="text-red-600 text-sm mb-3">{cancelError}</p>}

                {order.status === OrderStatus.Pending && (
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="w-full mb-3 border border-red-300 text-red-600 hover:bg-red-50 py-2 rounded-lg disabled:opacity-50"
                    >
                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                )}

                <Link
                    to="/orders"
                    className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg"
                >
                    Back to Orders
                </Link>
            </div>
        </div>
    )
}

export default OrderDetailPage