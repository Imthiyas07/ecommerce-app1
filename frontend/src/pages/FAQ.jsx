import { useState } from 'react'
import { FaChevronDown, FaChevronUp, FaQuestionCircle } from 'react-icons/fa'

const FAQ = () => {
  const [openItems, setOpenItems] = useState(new Set([0])) // First FAQ open by default

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "To place an order, browse our collection, add items to your cart, and proceed to checkout. You'll need to create an account or login, then enter your shipping details and payment information. Orders are processed within 1-2 business days."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, UPI, net banking, and cash on delivery (COD) for eligible orders. All payments are processed securely through Razorpay."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard delivery takes 3-5 business days within India. Express delivery (1-2 days) is available for select locations. International shipping takes 7-14 days depending on the destination."
    },
    {
      question: "What is your return policy?",
      answer: "We offer 30-day return policy for unused items in original condition with tags attached. Return shipping is free for defective items. Custom orders are not eligible for returns."
    },
    {
      question: "Do you offer size exchanges?",
      answer: "Yes, we offer free size exchanges within 30 days of delivery. Simply contact our customer service team, and we'll send you the correct size at no additional cost."
    },
    {
      question: "How do I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email and SMS. You can also track your order status by logging into your account and visiting the 'My Orders' section."
    },
    {
      question: "Are your products authentic?",
      answer: "Yes, all our products are 100% authentic and sourced directly from authorized manufacturers and designers. We guarantee authenticity on all items."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes, we ship to select international destinations. International shipping rates and delivery times vary by location. Contact our customer service for specific shipping quotes."
    },
    {
      question: "How do I care for my clothes?",
      answer: "Check the care label on each garment for specific instructions. Generally, machine wash in cold water, hang dry, and iron on low heat. For delicate items, dry cleaning is recommended."
    },
    {
      question: "Can I cancel my order?",
      answer: "Orders can be cancelled within 2 hours of placement if not yet processed. Contact our customer service team immediately if you need to cancel an order."
    }
  ]

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='flex justify-center mb-4'>
            <FaQuestionCircle className='text-6xl text-blue-600' />
          </div>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Frequently Asked Questions
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Find answers to common questions about shopping, shipping, returns, and more.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
          {faqs.map((faq, index) => (
            <div key={index} className='border-b border-gray-200 last:border-b-0'>
              <button
                onClick={() => toggleItem(index)}
                className='w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors'
              >
                <span className='text-lg font-medium text-gray-900 pr-4'>
                  {faq.question}
                </span>
                {openItems.has(index) ? (
                  <FaChevronUp className='text-gray-500 flex-shrink-0' />
                ) : (
                  <FaChevronDown className='text-gray-500 flex-shrink-0' />
                )}
              </button>

              {openItems.has(index) && (
                <div className='px-6 pb-4'>
                  <p className='text-gray-700 leading-relaxed'>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className='mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center'>
          <h3 className='text-2xl font-bold mb-4'>Still have questions?</h3>
          <p className='text-blue-100 mb-6 max-w-2xl mx-auto'>
            Can't find the answer you're looking for? Our customer support team is here to help.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <a
              href="mailto:support@shopfromhome.com"
              className='bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors'
            >
              Email Support
            </a>
            <a
              href="tel:+919876543210"
              className='bg-blue-500 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-400 transition-colors'
            >
              Call Us: +91 98765 43210
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className='mt-12 grid md:grid-cols-3 gap-6'>
          <div className='bg-white p-6 rounded-lg shadow-md text-center'>
            <h4 className='text-lg font-semibold mb-2'>Size Guide</h4>
            <p className='text-gray-600 mb-4'>Find your perfect fit with our comprehensive size guide.</p>
            <a href="/size-guide" className='text-blue-600 hover:text-blue-800 font-medium'>
              View Size Guide →
            </a>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-md text-center'>
            <h4 className='text-lg font-semibold mb-2'>Shipping Info</h4>
            <p className='text-gray-600 mb-4'>Learn about our shipping rates and delivery times.</p>
            <a href="/shipping" className='text-blue-600 hover:text-blue-800 font-medium'>
              Shipping Details →
            </a>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-md text-center'>
            <h4 className='text-lg font-semibold mb-2'>Return Policy</h4>
            <p className='text-gray-600 mb-4'>Easy returns and exchanges within 30 days.</p>
            <a href="/returns" className='text-blue-600 hover:text-blue-800 font-medium'>
              Return Policy →
            </a>
          </div>
        </div>
      </div>

      {/* Structured Data */}
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq, index) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      })}
      </script>
    </div>
  )
}

export default FAQ
