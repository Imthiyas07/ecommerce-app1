import { useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ShopContext } from '../context/ShopContext'
import {Link} from 'react-router-dom'
import { toast } from 'react-toastify'

const ProductItem = ({id,image,name,price}) => {

    const {currency, addToWishlist, removeFromWishlist, wishlistItems} = useContext(ShopContext);
    const [isWishlisted, setIsWishlisted] = useState(wishlistItems?.some(item => item._id === id) || false);

    // Update wishlist status when wishlistItems changes
    useEffect(() => {
        setIsWishlisted(wishlistItems?.some(item => item._id === id) || false);
    }, [wishlistItems, id]);

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (isWishlisted) {
                await removeFromWishlist(id);
                setIsWishlisted(false);
                toast.success(`${name} removed from wishlist!`);
            } else {
                await addToWishlist(id);
                setIsWishlisted(true);
                toast.success(`${name} added to wishlist!`);
            }
        } catch (error) {
            console.error('Wishlist error:', error);
            toast.error('Failed to update wishlist');
        }
    };



  return (
    <div className='relative text-gray-700 cursor-pointer'>
      <Link onClick={()=>scrollTo(0,0)} className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
        <div className='overflow-hidden relative'>
          <img className='hover:scale-110 transition ease-in-out' src={image[0]} alt="" />
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-200 ${
              isWishlisted
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-red-500'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              className="w-4 h-4"
              fill={isWishlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
        <p className='pt-3 pb-1 text-sm'>{name}</p>
        <p className=' text-sm font-medium'>{currency}{price}</p>
      </Link>
    </div>
  )
}

ProductItem.propTypes = {
  id: PropTypes.string.isRequired,
  image: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
}

export default ProductItem
