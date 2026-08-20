import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Elements } from '@stripe/react-stripe-js'
import { api } from '../api/client'
import { stripePromise } from '../stripe'
import StripeCheckoutForm from '../components/StripeCheckoutForm'
import type { OrderDto } from '../types/Order'

interface CheckoutLocationState {
    productIds?: number[]
}

function CheckoutPage() {
    const [order, setOrder] = useState<OrderDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cancelling, setCancelling] = useState(false)
    const hasStarted = useRef(false)
    const orderIdRef = useRef<number | null>(null)
    const paidRef = useRef(false)
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (hasStarted.current) return
        hasStarted.current = true
        const state = location.state as CheckoutLocationState | null
        const productIds = state?.productIds
        const body = productIds && productIds.length > 0 ? { productIds } : undefined
        api.post<OrderDto>('/Order/checkout', body)
            .then((response) => {
                setOrder(response.data)
                orderIdRef.current = response.data.id
            })
            .catch((err) => {
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 400) {
                        setError(String(err.response.data) || 'Your cart is empty')
                    } else if (err.response?.status === 409) {
                        setError(String(err.response.data) || 'Some items are no longer available')
                    } else {
                        setError('Checkout failed. Please try again.')
                    }
                } else {
                    setError('Checkout failed. Please try again.')
                }
            })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        return () => {
            if (orderIdRef.current && !paidRef.current) {
                api.post(`/Order/${orderIdRef.current}/cancel`).catch(() => {})
            }
        }
    }, [])

    function handlePaymentSuccess() {
        paidRef.current = true
    }

    async function handleCancel() {
        if (!orderIdRef.current) return
        setCancelling(true)
        try {
            await api.post(`/Order/${orderIdRef.current}/cancel`)
            paidRef.current = true
            navigate('/cart')
        } catch (err) {
            setCancelling(false)
        }
    }

    if (loading) return <p className="p-8">Preparing your order...</p>
    if (error) return <p className="p-8 text-red-600">{error}</p>
    if (!order || !order.clientSecret) return <p className="p-8">Unable to start checkout.</p>

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Checkout</h1>
                <ul className="space-y-1 mb-4 text-sm text-gray-600">
                    {order.items.map((item) => (
                        <li key={item.productId} className="flex justify-between">
                            <span>{item.productName} x {item.quantity}</span>
                            <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <p className="font-bold text-right mb-6">Total: ${order.totalAmount.toFixed(2)}</p>
                <Elements stripe={stripePromise} options={{ clientSecret: order.clientSecret }}>
                    <StripeCheckoutForm orderId={order.id} onPaymentSuccess={handlePaymentSuccess} />
                </Elements>
                <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full mt-3 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded disabled:opacity-50"
                >
                    {cancelling ? 'Cancelling...' : 'Cancel and return to cart'}
                </button>
            </div>
        </div>
    )
}

export default CheckoutPage