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
    0: 'bg-yellow-100 text-yellow-700',
    1: 'bg-green-100 text-green-700',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-indigo-100 text-indigo-700',
    4: 'bg-gray-200 text-gray-600',
    5: 'bg-red-100 text-red-700',
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

    if (error) return <p className="p-8 text-red-600">{error}</p>

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Orders</h1>

            <div className="flex flex-wrap gap-3 mb-4">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setPage(1)
                        setStatusFilter(e.target.value)
                    }}
                    className="border rounded px-3 py-2 text-sm bg-white"
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
                    className="border rounded px-3 py-2 text-sm w-64"
                />
            </div>

            {actionError && <p className="mb-4 text-red-600 text-sm">{actionError}</p>}

            {loading ? (
                <p className="text-gray-500 text-sm">Loading orders...</p>
            ) : orders.length === 0 ? (
                <p className="text-gray-500 text-sm">No orders match this filter.</p>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const nextStatuses: OrderStatus[] = validTransitions[order.status]
                        const isRefundable = refundableStatuses.includes(order.status)
                        const isRestockable = order.status === OrderStatus.Refunded && !order.isRestocked
                        const busy = busyOrderId === order.id

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-gray-800">Order #{order.id}</p>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status]}`}>
                                        {orderStatusLabels[order.status]}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-400 mb-3">
                                    {order.userFullName} &middot; {order.userEmail} &middot; {new Date(order.createdAt).toLocaleString()}
                                </p>

                                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                                    {order.items.map((item) => (
                                        <li key={item.productId} className="flex justify-between">
                                            <span>{item.productName} &times; {item.quantity}</span>
                                            <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-gray-900">${order.totalPrice.toFixed(2)}</p>

                                    <div className="flex gap-2">
                                        {nextStatuses.map((status) => (
                                            <button
                                                key={status}
                                                disabled={busy}
                                                onClick={() => updateStatus(order.id, status)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Mark {orderStatusLabels[status]}
                                            </button>
                                        ))}
                                        {isRefundable && (
                                            <button
                                                disabled={busy}
                                                onClick={() => refundOrder(order.id)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                                            >
                                                Refund
                                            </button>
                                        )}
                                        {isRestockable && (
                                            <button
                                                disabled={busy}
                                                onClick={() => restockOrder(order.id)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                                            >
                                                Mark Returned & Restock
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
        </div>
    )
}

export default AdminOrdersPage