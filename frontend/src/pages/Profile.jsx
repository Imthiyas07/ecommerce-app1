import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { MdOutlineShoppingBag, MdOutlineShoppingCart } from 'react-icons/md'
import { BsCurrencyDollar, BsBarChart } from 'react-icons/bs'
import { AiOutlineHeart } from 'react-icons/ai'

const Profile = () => {
  const { token, backendUrl, navigate, wishlistItems, removeFromWishlist } = useContext(ShopContext)
  const [userData, setUserData] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  })

  const fetchUserProfile = async () => {
    try {
      const response = await axios.post(backendUrl + '/api/user/profile', {}, { headers: { token } })
      if (response.data.success) {
        setUserData(response.data.user)
        setFormData({
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          phone: response.data.user.phone || '',
          location: response.data.user.address?.[0]?.city || ''
        })
      } else {
        toast.error(response.data.message || 'Failed to load profile')
      }
    } catch (error) {
      toast.error('Failed to load profile data')
    }
  }

  const fetchUserOrders = async () => {
    try {
      if (!token) return
      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } })
      if (response.data.success) {
        setOrders(response.data.orders.reverse())
      } else {
        toast.error(response.data.message || 'Failed to load orders')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      const response = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })
      if (response.data.success) {
        toast.success('Profile updated successfully!')
        setEditMode(false)
        fetchUserProfile()
      }
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRemoveFromWishlist = async (item) => {
    try {
      await removeFromWishlist(item._id)
      toast.success(`${item.name} removed from wishlist!`)
    } catch (error) {
      toast.error('Failed to remove item from wishlist')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  useEffect(() => {
    if (token) {
      fetchUserProfile()
      fetchUserOrders()
    } else {
      navigate('/login')
    }
  }, [token, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{userData?.name || 'User'}</h1>
                <p className="text-gray-600 mt-1">{userData?.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Member since 2024
                  </span>
                  <span className="text-sm text-gray-500">
                    {orders?.length || 0} orders • {formatCurrency(orders?.reduce((sum, order) => sum + order.amount, 0) || 0)} spent
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-colors ${
                editMode
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {editMode ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MdOutlineShoppingBag className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(orders?.reduce((sum, order) => sum + order.amount, 0) || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BsCurrencyDollar className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wishlist Items</p>
                <p className="text-2xl font-bold text-gray-900">{wishlistItems?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AiOutlineHeart className="text-2xl text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8">
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: <BsBarChart className="text-lg" /> },
              { id: 'orders', label: 'Orders', icon: <MdOutlineShoppingCart className="text-lg" /> },
              { id: 'wishlist', label: 'Wishlist', icon: <AiOutlineHeart className="text-lg" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Overview</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userData?.name || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900">{userData?.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, State/Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.location || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={updateProfile}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>

              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 10).map((order, index) => (
                    <div key={order._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-medium text-gray-900">Order #{order._id?.slice(-8) || `ORD${index + 1}`}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || 'Processing'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items?.slice(0, 3).map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                              <img
                                src={item.image || '/placeholder-image.png'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.src = '/placeholder-image.png'}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-sm text-gray-600">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdOutlineShoppingCart className="text-2xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-4">Start shopping to see your order history here</p>
                  <button
                    onClick={() => navigate('/collection')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>

              {wishlistItems && wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {wishlistItems.map((item, index) => (
                    <div key={item._id || index} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 h-full">
                      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                        <img
                          src={item.image?.[0] || '/placeholder-image.png'}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => e.target.src = '/placeholder-image.png'}
                        />
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm md:text-base">{item.name}</h3>
                        <p className="text-lg font-bold text-gray-900 mb-3">{formatCurrency(item.price)}</p>

                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={() => navigate(`/product/${item._id}`)}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleRemoveFromWishlist(item)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            title="Remove from wishlist"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AiOutlineHeart className="text-2xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                  <p className="text-gray-600 mb-4">Save items you love for later</p>
                  <button
                    onClick={() => navigate('/collection')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Browse Products
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
