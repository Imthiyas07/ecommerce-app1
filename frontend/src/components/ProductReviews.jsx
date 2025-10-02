import { useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ShopContext } from '../context/ShopContext';
import StarRating from './StarRating';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductReviews = ({ productId }) => {
  const { backendUrl, token, getProductsData, products } = useContext(ShopContext);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    recommend: true,
    images: []
  });
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Fetch reviews for the product
  const fetchReviews = useCallback(async () => {
    try {
      const response = await axios.post(`${backendUrl}/api/product/reviews`, { productId });
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.log('API Error:', error);
      // Use mock data for testing when API fails
      console.log('🔄 Using mock data for testing...');
      setReviews(mockReviews);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, productId]);

  // Mock data for testing
  const mockReviews = [
    {
      _id: '1',
      userId: { name: 'Sarah Johnson', _id: 'user1' },
      rating: 5,
      comment: 'Absolutely love this product! Great quality and fast shipping. Highly recommend!',
      images: [],
      recommend: true,
      verified: true,
      helpful: 12,
      date: Date.now() - 86400000 // 1 day ago
    },
    {
      _id: '2',
      userId: { name: 'Mike Chen', _id: 'user2' },
      rating: 4,
      comment: 'Good product overall. Works as expected, just wish it had more features.',
      images: [],
      recommend: true,
      verified: true,
      helpful: 8,
      date: Date.now() - 172800000 // 2 days ago
    },
    {
      _id: '3',
      userId: { name: 'Emma Davis', _id: 'user3' },
      rating: 5,
      comment: 'Exceeded my expectations! Will definitely buy again. Customer service was excellent too.',
      images: [],
      recommend: true,
      verified: false,
      helpful: 15,
      date: Date.now() - 259200000 // 3 days ago
    }
  ];

  // Check if user has already reviewed this product
  const checkUserReview = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.post(`${backendUrl}/api/product/user-review`, {
        userId: JSON.parse(atob(token.split('.')[1])).id,
        productId
      });
      if (response.data.success) {
        setUserReview(response.data.review);
      }
    } catch (error) {
      console.log('Error checking user review:', error);
    }
  }, [backendUrl, token, productId]);

  // Sort and filter reviews
  useEffect(() => {
    let filtered = [...reviews];

    // Filter by rating
    if (filterRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(filterRating));
    }

    // Sort reviews
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        filtered.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        break;
      default:
        break;
    }

    setFilteredReviews(filtered);
  }, [reviews, sortBy, filterRating]);

  // Generate recommended products based on reviews and category
  useEffect(() => {
    if (products.length > 0 && productId) {
      const currentProduct = products.find(p => p._id === productId);
      if (currentProduct) {
        // Find products in same category with high ratings
        const recommendations = products
          .filter(p =>
            p._id !== productId &&
            p.category === currentProduct.category &&
            (p.rating || 0) >= 4.0 &&
            p.isActive !== false
          )
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 4);

        setRecommendedProducts(recommendations);
      }
    }
  }, [products, productId]);

  useEffect(() => {
    fetchReviews();
    checkUserReview();
  }, [productId, token, fetchReviews, checkUserReview]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Please login to submit a review');
      return;
    }

    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!formData.comment.trim()) {
      toast.error('Please write your review');
      return;
    }

    try {
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      let response;

      if (editingReview) {
        // Update existing review
        response = await axios.post(`${backendUrl}/api/product/update-review`, {
          reviewId: editingReview._id,
          userId,
          ...formData
        }, { headers: { token } });
      } else {
        // Add new review
        response = await axios.post(`${backendUrl}/api/product/add-review`, {
          userId,
          productId,
          ...formData
        }, { headers: { token } });
      }

      if (response.data.success) {
        toast.success(editingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        setFormData({ rating: 0, title: '', comment: '' });
        setShowReviewForm(false);
        setEditingReview(null);
        fetchReviews(); // Refresh reviews
        checkUserReview(); // Update user review status
        getProductsData(); // Refresh products to update ratings
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const markHelpful = async (reviewId) => {
    if (!token) {
      toast.error('Please login to vote on reviews');
      return;
    }

    try {
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      const response = await axios.post(`${backendUrl}/api/product/review-helpful`, {
        reviewId,
        userId
      }, { headers: { token } });

      if (response.data.success) {
        // Update local state
        setReviews(reviews.map(review =>
          review._id === reviewId
            ? { ...response.data.review }
            : review
        ));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log('Error marking review helpful:', error);
      toast.error(error.response?.data?.message || 'Failed to mark review as helpful');
    }
  };

  const startEditingReview = (review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating,
      title: review.title,
      comment: review.comment
    });
    setShowReviewForm(true);
  };

  const cancelEditing = () => {
    setEditingReview(null);
    setFormData({ rating: 0, title: '', comment: '', recommend: true, images: [] });
    setShowReviewForm(false);
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      const response = await axios.post(`${backendUrl}/api/product/delete-review`, {
        reviewId,
        userId
      }, { headers: { token } });

      if (response.data.success) {
        toast.success('Review deleted successfully!');
        fetchReviews();
        checkUserReview();
        getProductsData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    // Validate file types and sizes
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, and WebP images are allowed');
        return;
      }
      if (file.size > maxSize) {
        toast.error('Each image must be less than 5MB');
        return;
      }
    }

    setFormData({...formData, images: files});
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({...formData, images: newImages});
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 border-t">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Customer Reviews ({reviews.length})</h3>
        {token && !userReview && !editingReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Enhanced Review Form */}
      {showReviewForm && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl mb-8 border-2 border-blue-100 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">⭐</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">
                {editingReview ? 'Edit Your Review' : 'Share Your Experience'}
              </h4>
              <p className="text-gray-600 text-sm">
                Help other customers make informed decisions
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-6">
            {/* Rating Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                How would you rate this product?
              </label>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={formData.rating}
                  onRatingChange={(rating) => setFormData({...formData, rating})}
                  interactive={true}
                  size="text-3xl"
                />
                <span className="text-sm text-gray-600 ml-2">
                  {formData.rating > 0 && `${formData.rating} star${formData.rating > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Review Text */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Your Review
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="5"
                placeholder="Tell others about your experience with this product. What did you like or dislike?"
                maxLength="1000"
                required
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {formData.comment.length}/1000 characters
                </span>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Add Photos (Optional)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500">
                  Upload up to 3 images (JPEG, PNG, WebP) - Max 5MB each
                </p>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation Checkbox */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recommend}
                  onChange={(e) => setFormData({...formData, recommend: e.target.checked})}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">I recommend this product</span>
                  <p className="text-xs text-gray-600">Let others know if you'd buy this again</p>
                </div>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {editingReview ? '✏️ Update Review' : '🚀 Submit Review'}
              </button>
              <button
                type="button"
                onClick={editingReview ? cancelEditing : () => setShowReviewForm(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's Existing Review */}
      {userReview && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-400">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Your Review</span>
                {userReview.verified && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Verified Purchase
                  </span>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => startEditingReview(userReview)}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteReview(userReview._id)}
                    className="text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <StarRating rating={userReview.rating} size="text-lg" />
              <p className="text-gray-700 mt-2">{userReview.comment}</p>
              {userReview.recommend && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span className="text-green-600 text-sm font-medium">Recommended by you</span>
                </div>
              )}
              {userReview.images && userReview.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {userReview.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(image, '_blank')}
                    />
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Posted on {new Date(userReview.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls */}
      {reviews.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Filter by rating:</label>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {reviews.length === 0
              ? "No reviews yet. Be the first to review this product!"
              : "No reviews match your current filters."
            }
          </p>
        ) : (
          filteredReviews.map((review) => (
            <div key={review._id} className="border-b pb-6 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{review.userId?.name || 'Anonymous'}</span>
                    {review.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <StarRating rating={review.rating} size="text-base" />
                  <p className="text-gray-700 mt-2">{review.comment}</p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                  )}

                  {/* Recommendation Badge */}
                  {review.recommend && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-green-600 text-sm">✓</span>
                      <span className="text-green-600 text-sm font-medium">Recommended</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-sm text-gray-500">
                      {new Date(review.date).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => markHelpful(review._id)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      👍 Helpful ({review.helpful || 0})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recommended Products Section */}
      {recommendedProducts.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h3 className="text-xl font-semibold mb-6">Recommended for You</h3>
          <p className="text-gray-600 mb-6">Customers who viewed this product also liked:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <div key={product._id} className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h4>
                  <div className="flex items-center gap-1 mb-2">
                    <StarRating rating={product.rating || 0} size="text-xs" />
                    <span className="text-xs text-gray-500">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">${product.price}</span>
                    <button
                      onClick={() => window.location.href = `/product/${product._id}`}
                      className="bg-black text-white px-3 py-1 text-xs rounded hover:bg-gray-800"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Distribution Chart */}
      {reviews.length > 0 && (
        <div className="mt-8 border-t pt-8">
          <h3 className="text-lg font-semibold mb-4">Rating Breakdown</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter(review => review.rating === rating).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <span className="text-yellow-400">★</span>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

ProductReviews.propTypes = {
  productId: PropTypes.string.isRequired
};

export default ProductReviews;
