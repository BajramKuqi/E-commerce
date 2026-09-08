import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ArrowRight } from 'lucide-react'
import { api } from '../api/client'
import { orderStatusLabels } from '../types/Order'
import type { OrderDto } from '../types/Order'

const statusColors: Record<number, string> = {
    0: 'bg-[#C97A2B]/10 text-[#8A551B]',
    1: 'bg-[#1F5C50]/10 text-[#1F5C50]',
    2: 'bg-[#1F5C50]/10 text-[#1F5C50]',
    3: 'bg-[#3F7D5C]/10 text-[#2E5C44]',
    4: 'bg-[#E6DCC8] text-[#756B5A]',
    5: 'bg-[#B5402E]/10 text-[#8F2F21]',
}

const PREVIEW_ITEM_COUNT = 3

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

    if (loading) return <p className="p-8 text-[#756B5A] bg-[#F6F1E7] min-h-screen">Loading orders...</p>
    if (error) return <p className="p-8 text-[#B5402E] bg-[#F6F1E7] min-h-screen">{error}</p>
    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-[#F6F1E7] p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
                    .heading-font { font-family: 'Space Grotesk', sans-serif; }
                `}</style>
                <h1 className="text-2xl font-bold text-[#262019] mb-6 heading-font">Your orders</h1>
                <div className="bg-white border border-[#E6DCC8] rounded-2xl p-10 flex flex-col items-center text-center gap-3">
                    <Package className="text-[#D8CBAE]" size={40} />
                    <p className="text-[#756B5A] text-sm">You have no orders yet.</p>
                    <Link
                        to="/"
                        className="mt-2 text-sm font-semibold bg-[#B5402E] hover:bg-[#8F2F21] text-white px-4 py-2 rounded-xl transition-colors"
                    >
                        Start shopping
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F6F1E7] p-6 lg:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
                .heading-font { font-family: 'Space Grotesk', sans-serif; }
            `}</style>
            <h1 className="text-2xl font-bold text-[#262019] mb-6 heading-font">Your orders</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {orders.map((order) => {
                    const hiddenCount = order.items.length - PREVIEW_ITEM_COUNT
                    const previewItems = order.items.slice(0, PREVIEW_ITEM_COUNT)
                    return (
                        <Link
                            key={order.id}
                            to={`/orders/${order.id}`}
                            className="h-64 bg-white rounded-2xl border border-[#E6DCC8] p-5 hover:border-[#1F5C50]/40 hover:shadow-md transition-all flex flex-col"
                            style={{ boxShadow: '0 6px 16px -10px rgba(38,32,25,0.15)' }}
                        >
                            <div className="flex items-center justify-between mb-3 shrink-0">
                                <p className="font-semibold text-[#262019]">Order #{order.id}</p>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status]}`}>
                                    {orderStatusLabels[order.status]}
                                </span>
                            </div>

                            <ul className="text-sm text-[#756B5A] space-y-1 flex-1">
                                {previewItems.map((item) => (
                                    <li key={item.productId} className="flex justify-between">
                                        <span className="truncate pr-2">{item.productName} × {item.quantity}</span>
                                        <span className="shrink-0">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                                {hiddenCount > 0 && (
                                    <li className="text-xs text-[#A79B85] pt-1">+{hiddenCount} more item{hiddenCount > 1 ? 's' : ''}</li>
                                )}
                            </ul>

                            <div className="shrink-0">
                                <div className="flex items-center justify-between border-t border-[#E6DCC8] pt-3">
                                    <p className="font-bold text-[#B5402E] heading-font">${order.totalAmount.toFixed(2)}</p>
                                    <span className="flex items-center gap-1 text-xs font-medium text-[#1F5C50]">
                                        View details
                                        <ArrowRight size={12} />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default OrdersPage