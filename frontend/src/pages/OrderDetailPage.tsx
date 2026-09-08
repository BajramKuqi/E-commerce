import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Package, XCircle } from 'lucide-react'
import { api } from '../api/client'
import { orderStatusLabels, OrderStatus } from '../types/Order'
import type { OrderDto } from '../types/Order'

const statusColors: Record<number, string> = {
    0: 'bg-[#C97A2B]/10 text-[#8A551B]',
    1: 'bg-[#1F5C50]/10 text-[#1F5C50]',
    2: 'bg-[#1F5C50]/10 text-[#1F5C50]',
    3: 'bg-[#3F7D5C]/10 text-[#2E5C44]',
    4: 'bg-[#E6DCC8] text-[#756B5A]',
    5: 'bg-[#B5402E]/10 text-[#8F2F21]',
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

    if (loading) return <p className="p-8 text-[#756B5A] bg-[#F6F1E7] min-h-screen">Loading order...</p>
    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center p-8">
                <p className="text-[#B5402E]">{error ?? 'Order not found'}</p>
            </div>
        )
    }

    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <div className="min-h-screen bg-[#F6F1E7] p-6 lg:p-10 flex justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
                .heading-font { font-family: 'Space Grotesk', sans-serif; }
            `}</style>

            <div className="w-full max-w-lg">
                <div
                    className="bg-white rounded-2xl border border-[#E6DCC8] overflow-hidden"
                    style={{ boxShadow: '0 20px 50px -20px rgba(38,32,25,0.2)' }}
                >
                    <div className="p-6 border-b border-[#E6DCC8] flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[#1F5C50]/10 flex items-center justify-center shrink-0">
                                <Package size={20} className="text-[#1F5C50]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[#262019] heading-font">Order #{order.id}</h1>
                                <p className="text-xs text-[#A79B85] mt-0.5">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full shrink-0 ${statusColors[order.status]}`}>
                            {orderStatusLabels[order.status]}
                        </span>
                    </div>

                    <div className="p-6">
                        <ul className="text-sm text-[#262019] divide-y divide-[#F1EADA]">
                            {order.items.map((item) => (
                                <li key={item.productId} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                    <div className="min-w-0 pr-3">
                                        <p className="truncate">{item.productName}</p>
                                        <p className="text-xs text-[#A79B85]">Qty {item.quantity} · ${item.unitPrice} each</p>
                                    </div>
                                    <span className="font-medium shrink-0">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex items-center justify-between border-t border-[#E6DCC8] mt-4 pt-4">
                            <span className="font-semibold text-[#262019]">Total</span>
                            <span className="font-bold text-2xl text-[#B5402E] heading-font">${order.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="p-6 pt-0">
                        {cancelError && (
                            <p className="text-[#8F2F21] text-sm bg-[#B5402E]/10 rounded-lg px-3 py-2 mb-3">{cancelError}</p>
                        )}
                        {order.status === OrderStatus.Pending && (
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="w-full flex items-center justify-center gap-2 border border-[#B5402E]/30 text-[#B5402E] hover:bg-[#B5402E]/5 font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors"
                            >
                                <XCircle size={16} />
                                {cancelling ? 'Cancelling...' : 'Cancel order'}
                            </button>
                        )}
                    </div>
                </div>

                <Link
                    to="/orders"
                    className="block text-center bg-[#1F5C50] hover:bg-[#163F37] text-white font-semibold py-3 rounded-xl mt-4 transition-colors"
                >
                    Back to orders
                </Link>
            </div>
        </div>
    )
}

export default OrderDetailPage