import { useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { backendUrl, currency } from '../constants'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import jsPDF from 'jspdf'

const Orders = ({ token }) => {

  const [orders, setOrders] = useState([])

  const fetchAllOrders = useCallback(async () => {

    if (!token) {
      return null;
    }

    try {

      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (response.data.success) {
        setOrders(response.data.orders.reverse())
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }


  }, [token])

  const statusHandler = async ( event, orderId ) => {
    try {
      const response = await axios.post(backendUrl + '/api/order/status' , {orderId, status:event.target.value}, { headers: {token}})
      if (response.data.success) {
        await fetchAllOrders()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
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

  useEffect(() => {
    fetchAllOrders();
  }, [token, fetchAllOrders])

  return (
    <div>
      <h3>Order Page</h3>
      <div>
        {
          orders.map((order, index) => (
            <div className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700' key={index}>
              <img className='w-12' src={assets.parcel_icon} alt="" />
              <div>
                <div>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span> </p>
                    }
                    else {
                      return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span> ,</p>
                    }
                  })}
                </div>
                <p className='mt-3 mb-2 font-medium'>{order.address.firstName + " " + order.address.lastName}</p>
                <div>
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p>{order.address.phone}</p>
              </div>
              <div>
                <p className='text-sm sm:text-[15px]'>Items : {order.items.length}</p>
                <p className='mt-3'>Method : {order.paymentMethod}</p>
                <p>Payment : { order.payment ? 'Done' : 'Pending' }</p>
                <p>Date : {new Date(order.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className='text-sm sm:text-[15px]'>{currency}{order.amount}</p>
                <button onClick={() => downloadInvoice(order)} className='mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600'>
                  Download Invoice
                </button>
              </div>
              <select onChange={(event)=>statusHandler(event,order._id)} value={order.status} className='p-2 font-semibold'>
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
          ))
        }
      </div>
    </div>
  )
}

Orders.propTypes = {
  token: PropTypes.string.isRequired,
}

export default Orders
