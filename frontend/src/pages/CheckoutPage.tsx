import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Elements } from '@stripe/react-stripe-js'
import { Lock, ShieldCheck, Package } from 'lucide-react'
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

    if (loading) {
        return <p className="p-8 text-[#756B5A] bg-[#F6F1E7] min-h-screen">Preparing your order...</p>
    }
    if (error) {
        return <p className="p-8 text-[#B5402E] bg-[#F6F1E7] min-h-screen">{error}</p>
    }
    if (!order || !order.clientSecret) {
        return <p className="p-8 text-[#756B5A] bg-[#F6F1E7] min-h-screen">Unable to start checkout.</p>
    }

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
                    <div className="p-6 border-b border-[#E6DCC8] flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#1F5C50]/10 flex items-center justify-center shrink-0">
                            <Package size={20} className="text-[#1F5C50]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[#262019] heading-font">Checkout</h1>
                            <p className="text-xs text-[#A79B85] mt-0.5">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        <ul className="text-sm text-[#262019] divide-y divide-[#F1EADA] mb-4">
                            {order.items.map((item) => (
                                <li key={item.productId} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                    <span className="truncate pr-3">{item.productName} × {item.quantity}</span>
                                    <span className="font-medium shrink-0">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex items-center justify-between border-t border-[#E6DCC8] pt-4 mb-6">
                            <span className="font-semibold text-[#262019]">Total</span>
                            <span className="font-bold text-2xl text-[#B5402E] heading-font">${order.totalAmount.toFixed(2)}</span>
                        </div>

                        <Elements stripe={stripePromise} options={{ clientSecret: order.clientSecret }}>
                            <StripeCheckoutForm orderId={order.id} onPaymentSuccess={handlePaymentSuccess} />
                        </Elements>

                        <p className="flex items-center justify-center gap-1.5 text-xs text-[#A79B85] mt-4">
                            <ShieldCheck size={13} className="text-[#1F5C50]" />
                            Secure checkout
                        </p>

                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="w-full mt-3 flex items-center justify-center gap-2 border border-[#E6DCC8] text-[#756B5A] hover:bg-[#FBF8F2] font-medium py-2.5 rounded-xl disabled:opacity-50 transition-colors"
                        >
                            {cancelling ? 'Cancelling...' : 'Cancel and return to cart'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CheckoutPage