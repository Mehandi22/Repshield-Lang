export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_pjsczcu7X63dQu'

export const PLANS = [
  {
    id:       'starter',
    name:     'Starter',
    price:    699,
    display:  '₹699',
    period:   '/month',
    badge:    null,
    features: [
      'QR feedback funnel',
      'Customer feedback inbox',
      'Dashboard & analytics',
      'WhatsApp complaint alerts',
      'Up to 1 location',
    ],
  },
  {
    id:       'growth',
    name:     'Growth',
    price:    1199,
    display:  '₹1,199',
    period:   '/month',
    badge:    'Most Popular',
    features: [
      'Everything in Starter',
      'AI-powered review replies',
      'Telugu & Hindi language support',
      'Complaint clustering & insights',
      'Up to 3 locations',
      'Priority support',
    ],
  },
]

/**
 * Opens Razorpay checkout and resolves with payment details on success.
 * Rejects on failure or dismissal.
 */
export function openRazorpayCheckout({ plan, prefill = {} }) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK not loaded'))
      return
    }

    const options = {
      key:         RAZORPAY_KEY_ID,
      amount:      plan.price * 100, // paise
      currency:    'INR',
      name:        'RepShield AI',
      description: `${plan.name} Plan — Monthly Subscription`,
      image:       '/logo192.png',
      prefill: {
        name:    prefill.name  || '',
        email:   prefill.email || '',
        contact: prefill.phone || '',
      },
      theme: { color: '#1D9E75' },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
      handler: (response) => {
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          plan_id:             plan.id,
        })
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'))
    })
    rzp.open()
  })
}
