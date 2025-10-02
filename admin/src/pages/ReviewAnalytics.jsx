import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../constants';
import { FaEdit, FaTrash, FaEye, FaCheck, FaTimes, FaStar, FaImage, FaDownload, FaFilter } from 'react-icons/fa';

const ReviewAnalytics = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [reportedFilter, setReportedFilter] = useState('');
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({
    rating: 0,
    comment: '',
    recommend: true,
    reported: false
  });
  const [cancellationData, setCancellationData] = useState(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  const fetchCancellationData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/order/analytics`, {
        headers: { token: localStorage.getItem('token') }
      });

      if (response.data.success) {
        setCancellationData(response.data.analytics);
      }
    } catch (error) {
      console.log('Error fetching cancellation data:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(search && { search }),
        ...(ratingFilter && { rating: ratingFilter }),
        ...(reportedFilter && { reported: reportedFilter })
      });

      const response = await axios.get(`${backendUrl}/api/product/all-reviews?${params}`, {
        headers: { token: localStorage.getItem('token') }
      });

      if (response.data.success) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
        setTotalPages(Math.ceil(response.data.totalReviews / 20));
      }
    } catch (error) {
      console.log('API Error:', error);
      // Use mock data for testing when API fails
      console.log('🔄 Using mock data for testing...');
      setReviews(mockReviews);
      setStats(mockStats);
      setTotalPages(1);
      toast.info('Using mock data - Database connection issue');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for testing
  const mockReviews = [
    {
      _id: '1',
      userId: { name: 'John Doe', email: 'john@example.com' },
      productId: { name: 'Wireless Headphones', category: 'Electronics' },
      rating: 5,
      comment: 'Excellent product! Great sound quality and battery life.',
      images: [],
      recommend: true,
      verified: true,
      reported: false,
      date: Date.now() - 86400000 // 1 day ago
    },
    {
      _id: '2',
      userId: { name: 'Jane Smith', email: 'jane@example.com' },
      productId: { name: 'Running Shoes', category: 'Sports' },
      rating: 4,
      comment: 'Good quality shoes, comfortable for long runs.',
      images: [],
      recommend: true,
      verified: true,
      reported: false,
      date: Date.now() - 172800000 // 2 days ago
    },
    {
      _id: '3',
      userId: { name: 'Bob Johnson', email: 'bob@example.com' },
      productId: { name: 'Coffee Maker', category: 'Appliances' },
      rating: 3,
      comment: 'Works okay but takes time to brew.',
      images: [],
      recommend: false,
      verified: false,
      reported: true,
      date: Date.now() - 259200000 // 3 days ago
    }
  ];

  const mockStats = {
    total: 156,
    verified: 89,
    reported: 12,
    ratingBreakdown: [
      { _id: 5, count: 67 },
      { _id: 4, count: 45 },
      { _id: 3, count: 23 },
      { _id: 2, count: 12 },
      { _id: 1, count: 9 }
    ]
  };

  useEffect(() => {
    fetchReviews();
    fetchCancellationData();
  }, [currentPage, search, ratingFilter, reportedFilter]);

  const handleEditReview = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${backendUrl}/api/product/admin-update-review`, {
        reviewId: editingReview._id,
        ...editForm
      }, {
        headers: { token: localStorage.getItem('token') }
      });

      if (response.data.success) {
        toast.success('Review updated successfully');
        setEditingReview(null);
        fetchReviews();
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to update review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await axios.post(`${backendUrl}/api/product/admin-delete-review`, {
        reviewId
      }, {
        headers: { token: localStorage.getItem('token') }
      });

      if (response.data.success) {
        toast.success('Review deleted successfully');
        fetchReviews();
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete review');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) {
      toast.error('Please select reviews to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedReviews.length} reviews?`)) {
      return;
    }

    try {
      const response = await axios.post(`${backendUrl}/api/product/admin-bulk-delete-reviews`, {
        reviewIds: selectedReviews
      }, {
        headers: { token: localStorage.getItem('token') }
      });

      if (response.data.success) {
        toast.success(`${response.data.deletedCount} reviews deleted successfully`);
        setSelectedReviews([]);
        fetchReviews();
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete reviews');
    }
  };

  const startEditing = (review) => {
    setEditingReview(review);
    setEditForm({
      rating: review.rating,
      comment: review.comment,
      recommend: review.recommend,
      reported: review.reported
    });
  };

  const toggleReviewSelection = (reviewId) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const selectAllReviews = () => {
    setSelectedReviews(reviews.map(review => review._id));
  };

  const clearSelection = () => {
    setSelectedReviews([]);
  };

  const handleViewAllCancellations = () => {
    setShowCancellationModal(true);
  };

  const handleGenerateReport = () => {
    try {
      // Generate CSV report
      const reportData = [];

      // Add header
      reportData.push(['Cancellation Report - Last 7 Days']);
      reportData.push(['Generated on:', new Date().toLocaleString()]);
      reportData.push(['']);
      reportData.push(['Order ID', 'Amount', 'Cancellation Reason', 'Date', 'Value Category']);

      // Add cancellation data
      if (cancellationData?.cancellationReasons) {
        cancellationData.cancellationReasons.forEach(item => {
          reportData.push([
            item.orderId || 'N/A',
            `₹${item.amount || 0}`,
            item.reason || 'No reason provided',
            new Date(item.date).toLocaleDateString(),
            (item.amount > 1000) ? 'High Value' : 'Standard'
          ]);
        });
      }

      // Add summary
      reportData.push(['']);
      reportData.push(['Summary']);
      reportData.push(['Total Cancellations:', cancellationData?.cancelledOrders || 0]);
      reportData.push(['High Value Cancellations:', cancellationData?.cancellationReasons?.filter(item => item.amount > 1000).length || 0]);
      reportData.push(['Total Value Lost:', `₹${cancellationData?.cancellationReasons?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0}`]);

      // Convert to CSV
      const csvContent = reportData.map(row =>
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `cancellation-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Cancellation report downloaded successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Analytics</h1>
        {selectedReviews.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Delete Selected ({selectedReviews.length})
          </button>
        )}
      </div>

      {/* Recent Cancellation Feedback */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-orange-900">Recent Cancellation Feedback</h2>
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
            Last 7 days
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded border">
            <div className="text-2xl font-bold text-orange-600">{cancellationData?.cancelledOrders || 0}</div>
            <div className="text-sm text-gray-600">Order Cancellations</div>
            <div className="text-xs text-orange-600 mt-1">Last 7 days</div>
          </div>
          <div className="bg-white p-4 rounded border">
            <div className="text-2xl font-bold text-red-600">
              {reviews.filter(review => review.rating <= 2).length}
            </div>
            <div className="text-sm text-gray-600">Low Rating Reviews</div>
            <div className="text-xs text-red-600 mt-1">1-2 star reviews</div>
          </div>
          <div className="bg-white p-4 rounded border">
            <div className="text-2xl font-bold text-blue-600">
              {cancellationData?.totalOrders > 0
                ? Math.round(((cancellationData.totalOrders - cancellationData.cancelledOrders) / cancellationData.totalOrders) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="text-xs text-blue-600 mt-1">Orders completed</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Recent User Cancellation Feedback:</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cancellationData?.cancellationReasons && cancellationData.cancellationReasons.length > 0 ? (
              cancellationData.cancellationReasons.slice(0, 5).map((item, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4 py-3 bg-white rounded border">
                  <p className="text-sm text-gray-700 font-medium mb-1">&ldquo;{item.reason}&rdquo;</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Order #{item.orderId ? item.orderId.slice(-6) : 'N/A'}</span>
                    <span>₹{item.amount || 0} • {new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Cancellation Reason</span>
                    {item.amount > 1000 && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">High Value</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No recent cancellation feedback available</p>
                <p className="text-xs mt-1">User feedback will appear here when orders are cancelled</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleViewAllCancellations}
            className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700"
          >
            View All Cancellations
          </button>
          <button
            onClick={handleGenerateReport}
            className="border border-orange-300 text-orange-700 px-4 py-2 rounded text-sm hover:bg-orange-50"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Total Reviews</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Verified Reviews</h3>
          <p className="text-3xl font-bold text-green-600">{stats.verified || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Reported Reviews</h3>
          <p className="text-3xl font-bold text-red-600">{stats.reported || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Average Rating</h3>
          <p className="text-3xl font-bold text-yellow-600">4.8★</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {stats.ratingBreakdown?.map((item) => (
            <div key={item._id} className="flex items-center gap-4">
              <span className="w-8 text-sm font-medium">{item._id}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-400 h-3 rounded-full"
                  style={{
                    width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%`
                  }}
                ></div>
              </div>
              <span className="w-8 text-sm text-gray-600">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={reportedFilter}
              onChange={(e) => setReportedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Reviews</option>
              <option value="true">Reported Only</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={selectAllReviews}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                    onChange={selectedReviews.length === reviews.length ? clearSelection : selectAllReviews}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(review._id)}
                      onChange={() => toggleReviewSelection(review._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{review.userId?.name}</div>
                      <div className="text-sm text-gray-500">{review.userId?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{review.productId?.name}</div>
                    <div className="text-sm text-gray-500">{review.productId?.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{review.rating}★</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{review.comment}</div>
                    {review.images && review.images.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        📷 {review.images.length} image{review.images.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {review.verified && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Verified
                        </span>
                      )}
                      {review.reported && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Reported
                        </span>
                      )}
                      {review.recommend && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(review.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(review)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        title="Edit Review"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete Review"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviews Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white rounded-lg shadow border p-3">
            <div className="flex items-start gap-3 mb-3">
              <input
                type="checkbox"
                checked={selectedReviews.includes(review._id)}
                onChange={() => toggleReviewSelection(review._id)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{review.userId?.name}</div>
                    <div className="text-xs text-gray-500 truncate">{review.userId?.email}</div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => startEditing(review)}
                      className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                      title="Edit Review"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete Review"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">{review.productId?.name}</span>
                <span className="text-sm text-gray-900 flex-shrink-0">{review.rating}★</span>
              </div>
              <div className="text-xs text-gray-500 truncate">{review.productId?.category}</div>
            </div>

            <div className="mb-2">
              <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">{review.comment}</p>
              {review.images && review.images.length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  📷 {review.images.length} image{review.images.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                {review.verified && (
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Verified
                  </span>
                )}
                {review.reported && (
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Reported
                  </span>
                )}
                {review.recommend && (
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {new Date(review.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination - Desktop */}
      <div className="hidden md:block mt-4">
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ‹
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ›
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Pagination */}
      <div className="md:hidden mt-4">
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg">
          <div className="flex-1 flex justify-between">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="ml-4 text-sm text-gray-700">
            {currentPage} / {totalPages}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 mx-auto p-4 sm:p-6 border w-full max-w-lg sm:max-w-2xl shadow-lg rounded-lg bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-medium text-gray-900">Edit Review</h3>
              <button
                onClick={() => setEditingReview(null)}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditReview}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <select
                    value={editForm.rating}
                    onChange={(e) => setEditForm({...editForm, rating: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  >
                    <option value={1}>1 Star</option>
                    <option value={2}>2 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={5}>5 Stars</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    value={editForm.comment}
                    onChange={(e) => setEditForm({...editForm, comment: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-vertical"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.recommend}
                      onChange={(e) => setEditForm({...editForm, recommend: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Recommended</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.reported}
                      onChange={(e) => setEditForm({...editForm, reported: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Reported</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
                >
                  Update Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancellationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">All Cancellation Feedback</h3>
              <button
                onClick={() => setShowCancellationModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-orange-50 p-4 rounded border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{cancellationData?.cancelledOrders || 0}</div>
                <div className="text-sm text-gray-600">Total Cancellations</div>
              </div>
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {cancellationData?.cancellationReasons?.filter(item => item.amount > 1000).length || 0}
                </div>
                <div className="text-sm text-gray-600">High Value Orders</div>
              </div>
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{cancellationData?.cancellationReasons?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total Value Lost</div>
              </div>
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {cancellationData?.totalOrders > 0
                    ? Math.round(((cancellationData.totalOrders - cancellationData.cancelledOrders) / cancellationData.totalOrders) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </div>

            {/* All Cancellation Feedback */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Detailed Cancellation Feedback:</h4>
              {cancellationData?.cancellationReasons && cancellationData.cancellationReasons.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cancellationData.cancellationReasons.map((item, index) => (
                    <div key={index} className="border-l-4 border-red-500 pl-4 py-4 bg-gray-50 rounded border">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-gray-800 font-medium flex-1">
                          &ldquo;{item.reason}&rdquo;
                        </p>
                        <div className="flex gap-2 ml-4">
                          {item.amount > 1000 && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded whitespace-nowrap">
                              High Value
                            </span>
                          )}
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded whitespace-nowrap">
                            Cancelled
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>Order #{item.orderId ? item.orderId.slice(-6) : 'N/A'}</span>
                          <span>₹{item.amount || 0}</span>
                        </div>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No cancellation feedback available</p>
                  <p className="text-xs mt-1">Cancellation feedback will appear here when users cancel orders</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={handleGenerateReport}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
              >
                Generate Report
              </button>
              <button
                onClick={() => setShowCancellationModal(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewAnalytics;
