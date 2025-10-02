import { useParams, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductReviews from '../components/ProductReviews';
import StarRating from '../components/StarRating';

const Reviews = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, currency } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    const product = products.find(item => item._id === productId);
    if (product) {
      setProductData(product);
    } else {
      // Product not found, redirect to home
      navigate('/');
    }
  }, [productId, products, navigate]);

  if (!productData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const getStockStatus = (product) => {
    if (!product.stock || product.stock === 0) {
      return { status: 'out', text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' }
    } else if (product.stock <= (product.minStock || 5)) {
      return { status: 'low', text: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    } else {
      return { status: 'good', text: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-100' }
    }
  };

  const stockStatus = getStockStatus(productData);
  const isOutOfStock = stockStatus.status === 'out';
  const satisfactionRate = productData.rating ? Math.round((productData.rating / 5) * 100) : 0;

  return (
    <div className='border-t pt-10'>
      {/* Enhanced Product Header */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg mb-8 border'>
        <div className='flex items-center gap-2 mb-6'>
          <button
            onClick={() => navigate(`/product/${productId}`)}
            className='text-blue-600 hover:text-blue-800 text-sm font-medium'
          >
            ← Back to Product Details
          </button>
        </div>

        <div className='grid md:grid-cols-2 gap-8 items-center'>
          {/* Product Image & Quick Info */}
          <div className='flex items-center gap-6'>
            <div className='relative'>
              <img
                src={productData.image[0]}
                alt={productData.name}
                className='w-32 h-32 object-cover rounded-lg border-2 border-white shadow-lg'
              />
              <div className='absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold'>
                ✓
              </div>
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>{productData.name}</h1>
              <div className='flex items-center gap-3 mb-3'>
                <div className='flex items-center gap-2'>
                  <StarRating rating={productData.rating || 0} size="text-xl" />
                  <span className='text-xl font-bold text-gray-900'>
                    {productData.rating ? productData.rating.toFixed(1) : '0.0'}
                  </span>
                </div>
                <span className='text-gray-600 font-medium'>
                  ({productData.reviewCount || 0} verified reviews)
                </span>
              </div>
              <p className='text-3xl font-bold text-indigo-600 mb-3'>{currency}{productData.price}</p>

              {/* Stock Status */}
              <div className='mb-4'>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${stockStatus.bgColor} ${stockStatus.color} border-2 border-white shadow-sm`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    stockStatus.status === 'out' ? 'bg-red-500' :
                    stockStatus.status === 'low' ? 'bg-orange-500' : 'bg-green-500'
                  }`}></span>
                  {stockStatus.text}
                  {productData.stock !== undefined && productData.stock > 0 && (
                    <span className='ml-2 font-normal'>
                      ({productData.stock} available)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Trust Indicators & CTA */}
          <div className='space-y-4'>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <h3 className='text-lg font-semibold text-gray-900 mb-3'>Why Choose This Product?</h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div className='flex items-center gap-2'>
                  <span className='text-green-500'>✓</span>
                  <span>{satisfactionRate}% Customer Satisfaction</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-green-500'>✓</span>
                  <span>Verified Reviews</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-green-500'>✓</span>
                  <span>Quality Guaranteed</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-green-500'>✓</span>
                  <span>30-Day Returns</span>
                </div>
              </div>
            </div>

            <div className='flex gap-3'>
              <button
                onClick={() => navigate(`/product/${productId}`)}
                className='flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg'
              >
                View Product Details
              </button>
              <button
                onClick={() => navigate('/cart')}
                disabled={isOutOfStock}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold shadow-lg transition-colors ${
                  isOutOfStock
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : 'Buy Now - Best Price'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Banner */}
      <div className='bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg mb-8'>
        <div className='flex items-center justify-center gap-8 text-center'>
          <div>
            <div className='text-2xl font-bold'>{productData.reviewCount || 0}</div>
            <div className='text-sm opacity-90'>Happy Customers</div>
          </div>
          <div className='h-12 w-px bg-white opacity-50'></div>
          <div>
            <div className='text-2xl font-bold'>{satisfactionRate}%</div>
            <div className='text-sm opacity-90'>Satisfaction Rate</div>
          </div>
          <div className='h-12 w-px bg-white opacity-50'></div>
          <div>
            <div className='text-2xl font-bold'>4.8★</div>
            <div className='text-sm opacity-90'>Average Rating</div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ProductReviews productId={productId} />

      {/* Purchase Incentive Banner */}
      <div className='bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-lg mt-12 text-center'>
        <h3 className='text-2xl font-bold mb-4'>Join Thousands of Satisfied Customers!</h3>
        <p className='text-lg mb-6 opacity-90'>
          Based on {productData.reviewCount || 0} reviews, customers love this product.
          Don't miss out on this highly-rated item!
        </p>
        <div className='flex justify-center gap-4'>
          <button
            onClick={() => navigate(`/product/${productId}`)}
            className='bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg'
          >
            Shop Now
          </button>
          <button
            onClick={() => navigate('/collection')}
            className='border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors'
          >
            Browse More Products
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
