import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProducts from '../components/RelatedProducts';
import StarRating from '../components/StarRating';

const Product = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    const product = products.find(item => item._id === productId);
    if (product) {
      setProductData(product);
      setImage(product.image[0]);
    }
  }, [productId, products]);

  const handleBuyNow = () => {
    navigate('/cart', { state: { product: productData, size } });
  };

  const getStockStatus = (product) => {
    if (!product.stock || product.stock === 0) {
      return { status: 'out', text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' }
    } else if (product.stock <= (product.minStock || 5)) {
      return { status: 'low', text: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    } else {
      return { status: 'good', text: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-100' }
    }
  };

  const stockStatus = productData ? getStockStatus(productData) : null;
  const isOutOfStock = stockStatus?.status === 'out';

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
            {productData.image.map((item, index) => (
              <img key={index} onClick={() => setImage(item)} src={item} className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer' alt='' />
            ))}
          </div>
          <div className='w-full sm:w-[80%]'>
            <img className='w-full h-auto' src={image} alt='' />
          </div>
        </div>
        <div className='flex-1'>
          <h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>
          <div className='flex items-center gap-2 mt-2'>
            <StarRating rating={productData.rating || 0} size="text-lg" />
            <p className='text-sm text-gray-600' onClick={() => navigate(`/reviews/${productId}`)}>
            Reviews ({productData.reviewCount || 0})
            </p>
          </div>
          <p className='mt-5 text-3xl font-medium'>{currency}{productData.price}</p>

          {/* Stock Status Display */}
          <div className='mt-4'>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.bgColor} ${stockStatus.color} border`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                stockStatus.status === 'out' ? 'bg-red-500' :
                stockStatus.status === 'low' ? 'bg-orange-500' : 'bg-green-500'
              }`}></span>
              {stockStatus.text}
              {productData.stock !== undefined && (
                <span className='ml-2 font-normal'>
                  ({productData.stock} available)
                </span>
              )}
            </span>
          </div>

          <p className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>
          <div className='flex flex-col gap-4 my-8'>
            <p>Select Size</p>
            <div className='flex gap-2'>
              {productData.sizes.map((item, index) => (
                <button key={index} onClick={() => setSize(item)} className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-orange-500' : ''}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className='flex gap-4'>
            <button
              onClick={() => addToCart(productData._id, size)}
              disabled={isOutOfStock}
              className={`px-8 py-3 text-sm ${
                isOutOfStock
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-black text-white active:bg-gray-700 hover:bg-gray-800'
              }`}
            >
              {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`px-8 py-3 text-sm ${
                isOutOfStock
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-pink-500 text-white active:bg-pink-700 hover:bg-pink-600'
              }`}
            >
              {isOutOfStock ? 'UNAVAILABLE' : 'BUY NOW'}
            </button>
          </div>
          <hr className='mt-8 sm:w-4/5' />
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>
      
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : (<div className='opacity-0'></div>);
};

export default Product;
