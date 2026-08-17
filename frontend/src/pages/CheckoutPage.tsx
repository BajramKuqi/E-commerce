import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Elements } from '@stripe/react-stripe-js'
import { api } from '../api/client'
import { stripePromise } from '../stripe'
import StripeCheckoutForm from '../components/StripeCheckoutForm'
import type { OrderDto } from '../types/Order'

function CheckoutPage() {
    const [order, setOrder] = useState<OrderDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const hasStarted = useRef(false)

    useEffect(() => {
        if (hasStarted.current) return
        hasStarted.current = true

        api.post<OrderDto>('/Order/checkout')
            .then((response) => {
                setOrder(response.data)
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
                            <span>{item.productName} × {item.quantity}</span>
                            <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <p className="font-bold text-right mb-6">Total: ${order.totalAmount.toFixed(2)}</p>

                <Elements stripe={stripePromise} options={{ clientSecret: order.clientSecret }}>
                    <StripeCheckoutForm orderId={order.id} />
                </Elements>
            </div>
        </div>
    )
}

export default CheckoutPage