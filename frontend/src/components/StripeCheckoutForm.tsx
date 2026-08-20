import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

interface StripeCheckoutFormProps {
  orderId: number
  onPaymentSuccess: () => void
}

function StripeCheckoutForm({ orderId, onPaymentSuccess }: StripeCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setSubmitting(false)
      return
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess()
      navigate(`/orders/${orderId}`)
    } else {
      setSubmitting(false)
    }
  }

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
            type="submit"
            disabled={!stripe || submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded disabled:opacity-50"
        >
          {submitting ? 'Processing...' : 'Pay now'}
        </button>
      </form>
  )
}

export default StripeCheckoutForm