import { useContext, useEffect, useState, useCallback } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf'

const Orders = () => {

  const { backendUrl, token , currency, navigate} = useContext(ShopContext);

  const [orderData,setorderData] = useState([])
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [token, navigate])

  const loadOrderData = useCallback(async () => {
    try {
      if (!token) {
        return null
      }

      const response = await axios.post(backendUrl + '/api/order/userorders',{},{headers:{token}})
      if (response.data.success) {
        setorderData(response.data.orders.reverse())
      } else {
        toast.error(response.data.message || 'Failed to load orders')
      }

    } catch (error) {
      console.error('Error loading orders:', error)
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.')
      } else if (error.response) {
        toast.error(error.response.data?.message || 'Server error occurred')
      } else if (error.request) {
        toast.error('Network error. Please check your connection.')
      } else {
        toast.error('An unexpected error occurred while loading orders')
      }
    }
  }, [backendUrl, token])

  const cancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }

    try {
      const response = await axios.post(backendUrl + '/api/order/cancel', {
        orderId: selectedOrder._id,
        cancelReason
      }, { headers: { token } })

      if (response.data.success) {
        toast.success('Order cancelled successfully')
        setShowCancelModal(false)
        setSelectedOrder(null)
        setCancelReason('')
        loadOrderData()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const downloadInvoice = (order) => {
    try {
      const doc = new jsPDF()

      // Professional Header
      doc.setFillColor(41, 128, 185)
      doc.rect(0, 0, 210, 35, 'F')

      doc.setDrawColor(52, 152, 219)
      doc.setLineWidth(0.5)
      doc.rect(0, 0, 210, 35)

      // Company branding
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('E-COMMERCE', 20, 18)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text('INVOICE', 20, 28)

      // Invoice number badge
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(150, 10, 45, 15, 2, 2, 'F')
      doc.setTextColor(41, 128, 185)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`INV-${order._id.slice(-8).toUpperCase()}`, 155, 19)

      // Invoice title
      doc.setTextColor(33, 37, 41)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('TAX INVOICE', 20, 55)

      let yPosition = 70

      // Invoice details box
      doc.setFillColor(248, 249, 250)
      doc.setDrawColor(222, 226, 230)
      doc.setLineWidth(0.3)
      doc.roundedRect(15, yPosition, 180, 30, 3, 3, 'FD')

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(33, 37, 41)
      doc.text('Invoice Details', 22, yPosition + 8)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(52, 58, 64)
      const invoiceDate = new Date()
      const invoiceDateFormatted = `${invoiceDate.getDate().toString().padStart(2, '0')}/${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}/${invoiceDate.getFullYear()}`
      const orderDate = new Date(order.date)
      const orderDateFormatted = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}/${orderDate.getFullYear()}`
      doc.text(`Invoice Date: ${invoiceDateFormatted}`, 22, yPosition + 18)
      doc.text(`Order Date: ${orderDateFormatted}`, 22, yPosition + 25)
      doc.text(`Payment Method: ${order.paymentMethod}`, 120, yPosition + 18)
      doc.text(`Payment Status: ${order.payment ? 'Paid' : 'Pending'}`, 120, yPosition + 25)

      yPosition += 40

      // Billing & Shipping information
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(0, 123, 255)
      doc.setLineWidth(0.8)
      doc.roundedRect(15, yPosition, 85, 35, 4, 4, 'S')

      doc.setFillColor(0, 123, 255)
      doc.rect(15, yPosition, 85, 10, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('BILL TO', 22, yPosition + 7)

      doc.setTextColor(33, 37, 41)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      if (order.address) {
        doc.text(`${order.address.firstName} ${order.address.lastName}`, 22, yPosition + 17)
        doc.text(order.address.street || '', 22, yPosition + 23)
        doc.text(`${order.address.city || ''}, ${order.address.state || ''} ${order.address.zipcode || ''}`, 22, yPosition + 29)
        doc.text(`Phone: ${order.address.phone || 'N/A'}`, 22, yPosition + 35)
      }

      // Shipping info
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(40, 167, 69)
      doc.setLineWidth(0.8)
      doc.roundedRect(110, yPosition, 85, 35, 4, 4, 'S')

      doc.setFillColor(40, 167, 69)
      doc.rect(110, yPosition, 85, 10, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('SHIP TO', 117, yPosition + 7)

      doc.setTextColor(33, 37, 41)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      if (order.address) {
        doc.text(`${order.address.firstName} ${order.address.lastName}`, 117, yPosition + 17)
        doc.text(order.address.street || '', 117, yPosition + 23)
        doc.text(`${order.address.city || ''}, ${order.address.state || ''} ${order.address.zipcode || ''}`, 117, yPosition + 29)
        doc.text(`Phone: ${order.address.phone || 'N/A'}`, 117, yPosition + 35)
      }

      yPosition += 50

      // Order items table
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(33, 37, 41)
      doc.text('ORDER ITEMS', 20, yPosition)
      yPosition += 10

      // Table headers
      doc.setFillColor(52, 58, 64)
      doc.rect(15, yPosition - 2, 180, 10, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('Item Description', 20, yPosition + 4)
      doc.text('Size', 100, yPosition + 4)
      doc.text('Qty', 125, yPosition + 4)
      doc.text('Rate', 145, yPosition + 4)
      doc.text('Amount', 170, yPosition + 4)

      yPosition += 12

      // Table items
      doc.setTextColor(33, 37, 41)
      doc.setFont('helvetica', 'normal')

      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          if (yPosition > 220) {
            doc.addPage()
            doc.setFillColor(41, 128, 185)
            doc.rect(0, 0, 210, 20, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text(`E-COMMERCE INVOICE - ${order._id.slice(-8).toUpperCase()} - Continued`, 20, 12)
            doc.setTextColor(33, 37, 41)
            yPosition = 30
          }

          // Alternate row background
          if (index % 2 === 0) {
            doc.setFillColor(248, 249, 250)
            doc.rect(15, yPosition - 2, 180, 8, 'F')
          }

          doc.setFontSize(7)
          const itemName = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name
          doc.text(itemName, 20, yPosition + 3)
          doc.text(item.size || 'N/A', 100, yPosition + 3)
          doc.text(item.quantity.toString(), 130, yPosition + 3)
          doc.text(`${currency}${item.price}`, 145, yPosition + 3)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(40, 167, 69)
          doc.text(`${currency}${(item.price * item.quantity)}`, 170, yPosition + 3)
          doc.setTextColor(33, 37, 41)
          doc.setFont('helvetica', 'normal')

          yPosition += 8
        })
      }

      // Total section
      yPosition += 10
      doc.setDrawColor(222, 226, 230)
      doc.setLineWidth(0.3)
      doc.line(140, yPosition, 195, yPosition)

      yPosition += 8
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Subtotal:', 140, yPosition)
      doc.setTextColor(40, 167, 69)
      doc.text(`${currency}${order.amount - 10}`, 175, yPosition)

      yPosition += 6
      doc.setTextColor(33, 37, 41)
      doc.setFontSize(9)
      doc.text('Delivery Charge:', 140, yPosition)
      doc.text(`${currency}10`, 175, yPosition)

      yPosition += 8
      doc.setDrawColor(52, 58, 64)
      doc.setLineWidth(0.5)
      doc.line(140, yPosition, 195, yPosition)

      yPosition += 8
      doc.setFontSize(12)
      doc.setTextColor(220, 53, 69)
      doc.text('TOTAL AMOUNT:', 140, yPosition)
      doc.setTextColor(40, 167, 69)
      doc.setFontSize(14)
      doc.text(`${currency}${order.amount}`, 175, yPosition)

      // Order status
      yPosition += 15
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(33, 37, 41)
      doc.text('Order Status:', 20, yPosition)

      const statusColors = {
        'Delivered': [40, 167, 69],
        'Shipped': [0, 123, 255],
        'Processing': [255, 193, 7],
        'Order Placed': [108, 117, 125]
      }
      const statusColor = statusColors[order.status] || [108, 117, 125]
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
      doc.setFont('helvetica', 'bold')
      doc.text(order.status || 'Processing', 60, yPosition)

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Footer line
        doc.setDrawColor(222, 226, 230)
        doc.setLineWidth(0.3)
        doc.line(15, 275, 195, 275)

        // Footer content
        doc.setFontSize(7)
        doc.setTextColor(108, 117, 125)
        doc.setFont('helvetica', 'normal')
        doc.text('Thank you for shopping with E-Commerce! | This is a computer generated invoice.', 20, 282)
        doc.text('For support: contact@ecommerce.com | Website: www.ecommerce.com', 20, 287)

        // Page number
        doc.text(`Page ${i} of ${pageCount}`, 175, 287)
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `Invoice_${order._id.slice(-8)}_${timestamp}.pdf`

      // Save the PDF
      doc.save(filename)
      toast.success('Invoice generated successfully!')
    } catch (error) {
      console.error('Invoice generation error:', error)
      toast.error('Failed to generate invoice. Please try again.')
    }
  }

  const canCancelOrder = (order) => {
    return !order.cancelled &&
           order.status !== 'Shipped' &&
           order.status !== 'Out for delivery' &&
           order.status !== 'Delivered'
  }

  useEffect(()=>{
    loadOrderData()
  },[token, loadOrderData])

  return (
    <div className='border-t pt-16 px-4 sm:px-6 lg:px-8'>

        <div className='text-2xl mb-8'>
            <Title text1={'MY'} text2={'ORDERS'}/>
        </div>

        <div className='space-y-6'>
            {
              orderData.map((order,index) => (
                <div key={index} className='bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm'>
                    {/* Order Header - Mobile First */}
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-gray-100'>
                        <div className='flex items-center gap-3'>
                            <div className={`w-3 h-3 rounded-full ${order.cancelled ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <div>
                                <p className='font-medium text-gray-900'>Order #{order._id.slice(-8).toUpperCase()}</p>
                                <p className='text-sm text-gray-500'>{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.cancelled
                                    ? 'bg-red-100 text-red-800'
                                    : order.status === 'Delivered'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                            }`}>
                                {order.status}
                            </span>
                            <p className='font-semibold text-lg text-gray-900'>{currency}{order.amount}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className='space-y-4 mb-6'>
                        {order.items.map((item, itemIndex) => (
                            <div key={itemIndex} className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
                                <img className='w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md' src={item.image[0]} alt={item.name} />
                                <div className='flex-1 min-w-0'>
                                    <h4 className='font-medium text-gray-900 text-sm sm:text-base line-clamp-2'>{item.name}</h4>
                                    <div className='flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600'>
                                        <span>{currency}{item.price}</span>
                                        <span>•</span>
                                        <span>Qty: {item.quantity}</span>
                                        <span>•</span>
                                        <span>Size: {item.size}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Details */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg'>
                        <div>
                            <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Order Date</p>
                            <p className='text-sm text-gray-900 mt-1'>{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Payment Method</p>
                            <p className='text-sm text-gray-900 mt-1'>{order.paymentMethod}</p>
                        </div>
                        <div>
                            <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Payment Status</p>
                            <p className={`text-sm mt-1 ${order.payment ? 'text-green-600' : 'text-orange-600'}`}>
                                {order.payment ? 'Paid' : 'Pending'}
                            </p>
                        </div>
                        <div>
                            <p className='text-xs font-medium text-gray-500 uppercase tracking-wide'>Items</p>
                            <p className='text-sm text-gray-900 mt-1'>{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    {/* Order Tracking - Responsive */}
                    <div className='mb-6'>
                        <h4 className='font-medium text-gray-900 mb-3'>Order Tracking</h4>
                        <div className='hidden sm:block'>
                            {/* Desktop Tracking */}
                            <div className='flex items-center justify-between'>
                                {[
                                    { status: 'Order Placed', label: 'Ordered' },
                                    { status: 'Packing', label: 'Packing' },
                                    { status: 'Shipped', label: 'Shipped' },
                                    { status: 'Out for delivery', label: 'Out for delivery' },
                                    { status: 'Delivered', label: 'Delivered' }
                                ].map((step, stepIndex) => {
                                    const isActive = ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered'].indexOf(order.status) >= stepIndex;
                                    const isCurrent = order.status === step.status;

                                    return (
                                        <div key={stepIndex} className='flex flex-col items-center flex-1'>
                                            <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            <p className={`text-xs mt-2 text-center ${isCurrent ? 'text-green-600 font-medium' : isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                                                {step.label}
                                            </p>
                                            {stepIndex < 4 && (
                                                <div className={`flex-1 h-0.5 mt-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className='sm:hidden'>
                            {/* Mobile Tracking - Vertical */}
                            <div className='space-y-3'>
                                {[
                                    { status: 'Order Placed', label: 'Ordered', desc: 'Order confirmed' },
                                    { status: 'Packing', label: 'Packing', desc: 'Preparing your items' },
                                    { status: 'Shipped', label: 'Shipped', desc: 'On the way' },
                                    { status: 'Out for delivery', label: 'Out for delivery', desc: 'Arriving soon' },
                                    { status: 'Delivered', label: 'Delivered', desc: 'Order completed' }
                                ].map((step, stepIndex) => {
                                    const isActive = ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered'].indexOf(order.status) >= stepIndex;
                                    const isCurrent = order.status === step.status;

                                    return (
                                        <div key={stepIndex} className='flex items-center gap-3'>
                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            <div className='flex-1'>
                                                <p className={`text-sm font-medium ${isCurrent ? 'text-green-600' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                                <p className='text-xs text-gray-500'>{step.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Cancellation Notice */}
                    {order.cancelled && (
                        <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                            <p className='text-sm text-red-800'>
                                <span className='font-medium'>Order Cancelled:</span> {order.cancelReason}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons - Responsive */}
                    <div className='flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100'>
                        <button
                            onClick={() => downloadInvoice(order)}
                            className='flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors'
                        >
                            Download Invoice
                        </button>
                        {canCancelOrder(order) && (
                            <button
                                onClick={() => {
                                    setSelectedOrder(order)
                                    setShowCancelModal(true)
                                }}
                                className='flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors'
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>
              ))
            }
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
              <h3 className='text-lg font-semibold mb-4'>Cancel Order</h3>
              <p className='text-sm text-gray-600 mb-4'>
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Reason for cancellation:
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  rows={3}
                  placeholder='Please provide a reason for cancellation...'
                />
              </div>
              <div className='flex gap-3 justify-end'>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedOrder(null)
                    setCancelReason('')
                  }}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                >
                  Cancel
                </button>
                <button
                  onClick={cancelOrder}
                  className='px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600'
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default Orders
