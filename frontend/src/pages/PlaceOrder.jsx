import { useContext, useState, useEffect } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOrder = () => {

    const [method, setMethod] = useState('cod');
    const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);

    useEffect(() => {
        if (!token) {
            navigate('/login')
        }
    }, [token, navigate])
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        phone: ''
    })

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setFormData(data => ({ ...data, [name]: value }))
    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name:'Order Payment',
            description:'Order Payment',
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                console.log(response)
                try {
                    
                    const { data } = await axios.post(backendUrl + '/api/order/verifyRazorpay',response,{headers:{token}})
                    if (data.success) {
                        navigate('/orders')
                        setCartItems({})
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error)
                }
            }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        // Validate products are loaded
        if (products.length === 0) {
            toast.error('Products are still loading. Please wait and try again.')
            return
        }

        // Validate cart is not empty
        if (Object.keys(cartItems).length === 0) {
            toast.error('Your cart is empty')
            return
        }

        // Validate form data
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.street ||
            !formData.city || !formData.zipcode || !formData.country || !formData.phone) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            let orderItems = []

            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        const itemInfo = structuredClone(products.find(product => product._id === items))
                        if (itemInfo) {
                            itemInfo.size = item
                            itemInfo.quantity = cartItems[items][item]
                            orderItems.push(itemInfo)
                        }
                    }
                }
            }

            if (orderItems.length === 0) {
                toast.error('No valid items in cart')
                return
            }

            let orderData = {
                address: formData,
                items: orderItems,
                amount: getCartAmount() + delivery_fee
            }

            console.log('Submitting order:', orderData)

            switch (method) {
                case 'cod': {
                    const response = await axios.post(backendUrl + '/api/order/place', orderData, {
                        headers: { token },
                        timeout: 30000 // 30 second timeout
                    })
                    console.log('COD response:', response.data)
                    if (response.data.success) {
                        setCartItems({})
                        toast.success('Order placed successfully!')
                        navigate('/orders')
                    } else {
                        toast.error(response.data.message || 'Failed to place order')
                    }
                    break;
                }

                case 'stripe': {
                    const responseStripe = await axios.post(backendUrl + '/api/order/stripe', orderData, {
                        headers: { token },
                        timeout: 30000
                    })
                    console.log('Stripe response:', responseStripe.data)
                    if (responseStripe.data.success) {
                        const { session_url } = responseStripe.data
                        window.location.replace(session_url)
                    } else {
                        toast.error(responseStripe.data.message || 'Failed to create payment session')
                    }
                    break;
                }

                case 'razorpay':
                case 'gpay': {
                    const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay', orderData, {
                        headers: { token },
                        timeout: 30000
                    })
                    console.log('Razorpay response:', responseRazorpay.data)
                    if (responseRazorpay.data.success) {
                        initPay(responseRazorpay.data.order)
                    } else {
                        toast.error(responseRazorpay.data.message || 'Failed to create payment order')
                    }
                    break;
                }

                default:
                    toast.error('Invalid payment method')
                    break;
            }

        } catch (error) {
            console.error('Order submission error:', error)
            if (error.code === 'ECONNABORTED') {
                toast.error('Request timed out. Please try again.')
            } else if (error.response) {
                toast.error(error.response.data?.message || 'Server error occurred')
            } else if (error.request) {
                toast.error('Network error. Please check your connection.')
            } else {
                toast.error('An unexpected error occurred')
            }
        }
    }


    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
            {/* ------------- Left Side ---------------- */}
            <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>

                <div className='text-xl sm:text-2xl my-3'>
                    <Title text1={'DELIVERY'} text2={'INFORMATION'} />
                </div>
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='First name' />
                    <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Last name' />
                </div>
                <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="email" placeholder='Email address' />
                <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Street' />
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='City' />
                    <input onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='State' />
                </div>
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Zipcode' />
                    <input required onChange={onChangeHandler} name='country' value={formData.country} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Country' />
                </div>
                <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Phone' />
            </div>

            {/* ------------- Right Side ------------------ */}
            <div className='mt-8'>

                <div className='mt-8 min-w-80'>
                    <CartTotal />
                </div>

                <div className='mt-12'>
                    <Title text1={'PAYMENT'} text2={'METHOD'} />
                    {/* --------------- Payment Method Selection ------------- */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
                        {/* Stripe */}
                        <div
                            onClick={() => setMethod('stripe')}
                            className={`flex items-center justify-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md min-h-[60px] ${
                                method === 'stripe'
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                                method === 'stripe' ? 'border-blue-500' : 'border-gray-300'
                            }`}>
                                {method === 'stripe' && (
                                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                                )}
                            </div>
                            <img className='h-8 w-auto object-contain' src={assets.stripe_logo} alt="Stripe" />
                        </div>

                        {/* Razorpay */}
                        <div
                            onClick={() => setMethod('razorpay')}
                            className={`flex items-center justify-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md min-h-[60px] ${
                                method === 'razorpay'
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                                method === 'razorpay' ? 'border-blue-500' : 'border-gray-300'
                            }`}>
                                {method === 'razorpay' && (
                                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                                )}
                            </div>
                            <img className='h-8 w-auto object-contain' src={assets.razorpay_logo} alt="Razorpay" />
                        </div>

                        {/* Google Pay */}
                        <div
                            onClick={() => setMethod('gpay')}
                            className={`flex items-center justify-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md min-h-[60px] ${
                                method === 'gpay'
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                                method === 'gpay' ? 'border-blue-500' : 'border-gray-300'
                            }`}>
                                {method === 'gpay' && (
                                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                                )}
                            </div>
                            <img className='h-8 w-8 object-contain' src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png" alt="Google Pay" />
                        </div>



                        {/* Cash on Delivery - Full Width */}
                        <div
                            onClick={() => setMethod('cod')}
                            className={`flex items-center justify-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md min-h-[60px] col-span-1 sm:col-span-2 lg:col-span-3 ${
                                method === 'cod'
                                    ? 'border-green-500 bg-green-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                                method === 'cod' ? 'border-green-500' : 'border-gray-300'
                            }`}>
                                {method === 'cod' && (
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                )}
                            </div>
                            <div className='w-8 h-8 bg-green-600 rounded-full flex items-center justify-center'>
                                <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                                    <path d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z'/>
                                </svg>
                            </div>
                            <span className='text-gray-700 text-sm font-medium'>Cash on Delivery</span>
                        </div>
                    </div>

                    <div className='w-full text-end mt-8'>
                        <button type='submit' className='bg-black text-white px-16 py-3 text-sm'>PLACE ORDER</button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default PlaceOrder
