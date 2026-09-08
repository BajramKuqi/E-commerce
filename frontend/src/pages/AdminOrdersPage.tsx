import { useEffect, useState } from 'react'
import axios from 'axios'
import { api } from '../api/client'
import {
    OrderStatus,
    orderStatusLabels,
    validTransitions,
} from '../types/Order'
import type { AdminOrderDto, PagedResult } from '../types/Order'

const statusColors: Record<number, string> = {
    0: 'bg-[#C97A2B]/10 text-[#8A551B]',
    1: 'bg-[#1F5C50]/10 text-[#1F5C50]',
    2: 'bg-[#1F5C50]/10 text-[#1F5C50]',
    3: 'bg-[#3F7D5C]/10 text-[#2E5C44]',
    4: 'bg-[#E6DCC8] text-[#756B5A]',
    5: 'bg-[#B5402E]/10 text-[#8F2F21]',
}

const statusFilterOptions = [
    { label: 'All statuses', value: '' },
    ...Object.entries(orderStatusLabels).map(([value, label]) => ({ label, value })),
]

const refundableStatuses: OrderStatus[] = [OrderStatus.Paid, OrderStatus.Shipped, OrderStatus.Delivered]

function AdminOrdersPage() {
    const [orders, setOrders] = useState<AdminOrderDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [busyOrderId, setBusyOrderId] = useState<number | null>(null)

    const [statusFilter, setStatusFilter] = useState('')
    const [emailFilter, setEmailFilter] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 20
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        loadOrders()
    }, [statusFilter, emailFilter, page])

    function loadOrders() {
        setLoading(true)
        api
            .get<PagedResult<AdminOrderDto>>('/Order/admin', {
                params: {
                    status: statusFilter === '' ? undefined : statusFilter,
                    email: emailFilter.trim() === '' ? undefined : emailFilter.trim(),
                    page,
                    pageSize,
                },
            })
            .then((response) => {
                setOrders(response.data.items)
                setTotalCount(response.data.totalCount)
            })
            .catch((err) => {
                console.error(err)
                setError('Failed to load orders')
            })
            .finally(() => setLoading(false))
    }

    async function updateStatus(orderId: number, newStatus: OrderStatus) {
        setActionError(null)
        setBusyOrderId(orderId)
        try {
            await api.patch(`/Order/${orderId}/status`, { newStatus })
            loadOrders()
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                setActionError(`Order #${orderId}: invalid status transition`)
            } else {
                setActionError(`Order #${orderId}: failed to update status`)
            }
        } finally {
            setBusyOrderId(null)
        }
    }

    async function refundOrder(orderId: number) {
        if (!window.confirm(`Refund order #${orderId}? This charges back the customer via Stripe.`)) return

        setActionError(null)
        setBusyOrderId(orderId)
        try {
            await api.post(`/Order/${orderId}/refund`)
            loadOrders()
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 409) {
                    setActionError(`Order #${orderId}: not eligible for refund`)
                } else if (err.response?.status === 502) {
                    setActionError(`Order #${orderId}: refund failed with payment provider`)
                } else {
                    setActionError(`Order #${orderId}: failed to refund`)
                }
            } else {
                setActionError(`Order #${orderId}: failed to refund`)
            }
        } finally {
            setBusyOrderId(null)
        }
    }

    async function restockOrder(orderId: number) {
        setActionError(null)
        setBusyOrderId(orderId)
        try {
            await api.post(`/Order/${orderId}/restock`)
            loadOrders()
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                setActionError(`Order #${orderId}: ${err.response?.data ?? 'cannot be restocked'}`)
            } else {
                setActionError(`Order #${orderId}: failed to restock`)
            }
        } finally {
            setBusyOrderId(null)
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

            <h1 className="text-2xl font-bold text-[#262019] mb-6 heading-font">Manage orders</h1>

            <div className="flex flex-wrap gap-3 mb-4">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setPage(1)
                        setStatusFilter(e.target.value)
                    }}
                    className="border border-[#E6DCC8] rounded-xl px-3 py-2 text-sm bg-white text-[#262019] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30"
                >
                    {statusFilterOptions.map((option) => (
                        <option key={option.label} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Filter by email..."
                    value={emailFilter}
                    onChange={(e) => {
                        setPage(1)
                        setEmailFilter(e.target.value)
                    }}
                    className="border border-[#E6DCC8] rounded-xl px-3 py-2 text-sm w-64 bg-white text-[#262019] placeholder-[#A79B85] focus:outline-none focus:ring-2 focus:ring-[#1F5C50]/30"
                />
            </div>

            {actionError && (
                <p className="mb-4 text-sm text-[#8F2F21] bg-[#B5402E]/10 rounded-lg px-3 py-2 inline-block">{actionError}</p>
            )}

            {loading ? (
                <p className="text-[#756B5A] text-sm">Loading orders...</p>
            ) : orders.length === 0 ? (
                <p className="text-[#756B5A] text-sm">No orders match this filter.</p>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {orders.map((order) => {
                        const nextStatuses: OrderStatus[] = validTransitions[order.status]
                        const isRefundable = refundableStatuses.includes(order.status)
                        const isRestockable = order.status === OrderStatus.Refunded && !order.isRestocked
                        const busy = busyOrderId === order.id

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-[#E6DCC8] p-5 flex flex-col"
                                style={{ boxShadow: '0 6px 16px -10px rgba(38,32,25,0.15)' }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-[#262019]">Order #{order.id}</p>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status]}`}>
                                        {orderStatusLabels[order.status]}
                                    </span>
                                </div>

                                <p className="text-xs text-[#A79B85] mb-3">
                                    {order.userFullName} · {order.userEmail} · {new Date(order.createdAt).toLocaleString()}
                                </p>

                                <ul className="text-sm text-[#756B5A] space-y-1 mb-3 flex-1">
                                    {order.items.map((item) => (
                                        <li key={item.productId} className="flex justify-between">
                                            <span>{item.productName} × {item.quantity}</span>
                                            <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-[#E6DCC8]">
                                    <p className="font-bold text-[#B5402E] heading-font">${order.totalPrice.toFixed(2)}</p>

                                    <div className="flex gap-2 flex-wrap justify-end">
                                        {nextStatuses.map((status) => (
                                            <button
                                                key={status}
                                                disabled={busy}
                                                onClick={() => updateStatus(order.id, status)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E6DCC8] text-[#262019] hover:bg-[#FBF8F2] disabled:opacity-50 transition-colors"
                                            >
                                                Mark {orderStatusLabels[status]}
                                            </button>
                                        ))}
                                        {isRefundable && (
                                            <button
                                                disabled={busy}
                                                onClick={() => refundOrder(order.id)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#B5402E]/10 text-[#B5402E] hover:bg-[#B5402E]/20 disabled:opacity-50 transition-colors"
                                            >
                                                Refund
                                            </button>
                                        )}
                                        {isRestockable && (
                                            <button
                                                disabled={busy}
                                                onClick={() => restockOrder(order.id)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#3F7D5C]/10 text-[#2E5C44] hover:bg-[#3F7D5C]/20 disabled:opacity-50 transition-colors"
                                            >
                                                Mark returned & restock
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
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
        </div>
    )
}

export default AdminOrdersPage