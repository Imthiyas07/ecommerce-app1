import { createContext, useEffect, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { currency as currencyConstant } from '../../../admin/src/constants'

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = currencyConstant;
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:4000'
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('')
    const [wishlistItems, setWishlistItems] = useState([]);
    const navigate = useNavigate();


    const addToCart = async (itemId, size) => {

        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        // Check stock availability
        const product = products.find(p => p._id === itemId);
        if (!product) {
            toast.error('Product not found');
            return;
        }

        // Calculate current cart quantity for this specific size
        const currentSizeQuantity = cartItems[itemId]?.[size] || 0;

        // Check if adding one more would exceed available stock for this size
        // sizeStock is stored as a Map in MongoDB, so we need to access it properly
        const sizeStock = product.sizeStock?.[size] || product.sizeStock?.get?.(size) || 0;
        if (currentSizeQuantity + 1 > sizeStock) {
            toast.error(`Only ${sizeStock} items available in stock for size ${size}`);
            return;
        }

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            }
            else {
                cartData[itemId][size] = 1;
            }
        }
        else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);

        if (token) {
            try {

                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } })

            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }

    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {
                    // Handle error silently or log if needed
                }
            }
        }
        return totalCount;
    }

    const updateQuantity = async (itemId, size, quantity) => {

        if (quantity < 0) return;

        // Check stock availability for the new quantity
        const product = products.find(p => p._id === itemId);
        if (!product) {
            toast.error('Product not found');
            return;
        }

        // Check if new quantity would exceed available stock for this size
        // sizeStock is stored as a Map in MongoDB, so we need to access it properly
        const sizeStock = product.sizeStock?.[size] || product.sizeStock?.get?.(size) || 0;
        if (quantity > sizeStock) {
            toast.error(`Only ${sizeStock} items available in stock for size ${size}`);
            return;
        }

        let cartData = structuredClone(cartItems);

        cartData[itemId][size] = quantity;

        setCartItems(cartData)

        if (token) {
            try {

                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { token } })

            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        }

    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                } catch (error) {
                    // Handle error silently or log if needed
                }
            }
        }
        return totalAmount;
    }

    const getProductsData = useCallback(async () => {
        try {

            const response = await axios.get(backendUrl + '/api/product/list')
            if (response.data.success) {
                setProducts(response.data.products.reverse())
            } else {
                toast.error(response.data.message || 'Failed to load products')
            }

        } catch (error) {
            console.error('Error loading products:', error)
            if (error.code === 'ECONNABORTED') {
                toast.error('Request timed out while loading products. Please refresh the page.')
            } else if (error.response) {
                toast.error(error.response.data?.message || 'Server error while loading products')
            } else if (error.request) {
                toast.error('Network error. Please check your connection.')
            } else {
                toast.error('An unexpected error occurred while loading products')
            }
        }
    }, [backendUrl])

    const getUserCart = useCallback(async (token) => {
        try {

            const response = await axios.post(backendUrl + '/api/cart/get',{},{headers:{token}})
            if (response.data.success) {
                setCartItems(response.data.cartData)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }, [backendUrl])

    const addToWishlist = async (itemId) => {
        try {
            // Add to local state first for immediate UI update
            const product = products.find(p => p._id === itemId);
            if (product && !wishlistItems.some(item => item._id === itemId)) {
                setWishlistItems(prev => [...prev, product]);
            }

            if (token) {
                await axios.post(backendUrl + '/api/wishlist/add', { itemId }, { headers: { token } })
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            // Revert local state on error
            setWishlistItems(prev => prev.filter(item => item._id !== itemId));
        }
    }

    const removeFromWishlist = async (itemId) => {
        try {
            // Remove from local state first for immediate UI update
            setWishlistItems(prev => prev.filter(item => item._id !== itemId));

            if (token) {
                await axios.post(backendUrl + '/api/wishlist/remove', { itemId }, { headers: { token } })
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            // Revert local state on error - add back the item
            const product = products.find(p => p._id === itemId);
            if (product) {
                setWishlistItems(prev => [...prev, product]);
            }
        }
    }

    const getUserWishlist = useCallback(async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/get', {}, { headers: { token } })
            if (response.data.success) {
                setWishlistItems(response.data.wishlistData)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }, [backendUrl])

    useEffect(() => {
        getProductsData()
    }, [getProductsData])

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
            getUserWishlist(localStorage.getItem('token'))
        }
        if (token) {
            getUserCart(token)
            getUserWishlist(token)
        }
    }, [token, getUserCart, getUserWishlist])

    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart,setCartItems,
        getCartCount, updateQuantity,
        getCartAmount, navigate, backendUrl,
        setToken, token, wishlistItems,
        addToWishlist, removeFromWishlist
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )

}

ShopContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ShopContextProvider;
