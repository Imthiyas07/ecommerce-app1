import { useEffect, useContext, useCallback } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'

const Verify = () => {

    const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext)
    const [searchParams] = useSearchParams()
    
    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')

    const verifyPayment = useCallback(async () => {
        try {

            if (!token) {
                return null
            }

            const response = await axios.post(backendUrl + '/api/order/verifyStripe', { success, orderId }, { headers: { token } })

            if (response.data.success) {
                setCartItems({})
                navigate('/orders')
            } else {
                navigate('/cart')
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }, [token, backendUrl, success, orderId, setCartItems, navigate])

    useEffect(() => {
        verifyPayment()
    }, [token, verifyPayment])

    return (
        <div>

        </div>
    )
}

export default Verify
