import { useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { backendUrl, currency } from '../constants'
import { toast } from 'react-toastify'
import jsPDF from 'jspdf'
import { FaEdit, FaEye, FaTrash, FaDownload } from 'react-icons/fa'

const UserManagement = ({ token }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    newPassword: '',
    isBlocked: false
  })
  const usersPerPage = 10

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(backendUrl + '/api/user/list', {
        headers: { token }
      })

      if (response.data.success) {
        setUsers(response.data.users)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleEditUser = async (userId, updatedData) => {
    try {
      const response = await axios.put(backendUrl + '/api/user/update/' + userId, updatedData, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success('User updated successfully')
        setEditingUser(null)
        fetchUsers()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await axios.delete(backendUrl + '/api/user/delete/' + userId, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }



  const handleEditSubmit = async () => {
    try {
      const updates = {}

      // Update name and email if changed
      if (editForm.name !== selectedUser.name) {
        updates.name = editForm.name
      }
      if (editForm.email !== selectedUser.email) {
        updates.email = editForm.email
      }

      // Update user info if there are changes
      if (Object.keys(updates).length > 0) {
        const response = await axios.put(backendUrl + '/api/user/update/' + selectedUser._id, updates, {
          headers: { token }
        })
        if (!response.data.success) {
          toast.error(response.data.message)
          return
        }
      }

      // Change password if provided
      if (editForm.newPassword) {
        if (editForm.newPassword.length < 8) {
          toast.error('Password must be at least 8 characters long')
          return
        }
        const response = await axios.put(backendUrl + '/api/user/change-password/' + selectedUser._id, {
          newPassword: editForm.newPassword
        }, {
          headers: { token }
        })
        if (!response.data.success) {
          toast.error(response.data.message)
          return
        }
      }

      // Update block status if changed
      if (editForm.isBlocked !== selectedUser.isBlocked) {
        const response = await axios.put(backendUrl + '/api/user/toggle-block/' + selectedUser._id, {
          isBlocked: editForm.isBlocked
        }, {
          headers: { token }
        })
        if (!response.data.success) {
          toast.error(response.data.message)
          return
        }
      }

      toast.success('User updated successfully')
      setShowEditModal(false)
      setSelectedUser(null)
      setEditForm({ name: '', email: '', newPassword: '', isBlocked: false })
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      newPassword: '',
      isBlocked: user.isBlocked
    })
    setShowEditModal(true)
  }

  const handleViewDetails = async (user) => {
    setSelectedUser(user)
    try {
      const response = await axios.get(backendUrl + '/api/user/details/' + user._id, {
        headers: { token }
      })

      if (response.data.success) {
        setUserDetails(response.data)
        setShowDetailsModal(true)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      toast.error('Failed to load user details')
    }
  }



  const exportUserData = () => {
    if (!userDetails) {
      toast.error('No user data available to export')
      return
    }

    try {
      const doc = new jsPDF()
      const { user, orders, totalOrders, totalSpent } = userDetails

      // Simple, clean header
      doc.setFillColor(0, 123, 255)
      doc.rect(0, 0, 210, 30, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('E-COMMERCE CUSTOMER REPORT', 20, 18)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 26)

      // Customer info section
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('CUSTOMER INFORMATION', 20, 50)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Name: ${user.name}`, 20, 65)
      doc.text(`Email: ${user.email}`, 20, 75)
      doc.text(`Status: ${user.isBlocked ? 'Blocked' : 'Active'}`, 20, 85)
      const memberSince = user.createdAt
        ? (() => {
            const date = new Date(user.createdAt)
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
          })()
        : 'N/A'
      doc.text(`Member Since: ${memberSince}`, 20, 95)

      // Summary section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('ORDER SUMMARY', 20, 115)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Orders: ${totalOrders}`, 20, 130)
      doc.text(`Total Amount Spent: INR ${totalSpent.toLocaleString()}`, 20, 140)

      // Orders table
      if (orders && orders.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('ORDER HISTORY', 20, 160)

        // Table headers
        doc.setFillColor(240, 240, 240)
        doc.rect(20, 170, 170, 10, 'F')

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text('Order ID', 25, 177)
        doc.text('Date', 70, 177)
        doc.text('Amount', 120, 177)
        doc.text('Status', 150, 177)

        // Table data
        doc.setFont('helvetica', 'normal')
        let yPos = 185

        orders.slice(0, 10).forEach((order, index) => {
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(20, yPos - 3, 170, 8, 'F')
          }

          doc.setFontSize(8)
          doc.text(order._id.slice(-8), 25, yPos + 2)
          const date = new Date(order.date)
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
          doc.text(formattedDate, 70, yPos + 2)
          doc.text(`${currency}${order.amount}`, 120, yPos + 2)
          doc.text(order.status || 'Processing', 150, yPos + 2)

          yPos += 8
        })

        if (orders.length > 10) {
          doc.setFontSize(8)
          doc.setTextColor(100, 100, 100)
          doc.text(`... and ${orders.length - 10} more orders`, 20, yPos + 5)
        }
      }

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('This is a computer generated report.', 20, 285)
      doc.text('E-Commerce Admin Panel', 150, 285)

      // Save
      const timestamp = new Date().toISOString().split('T')[0]
      const cleanName = user.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
      doc.save(`Customer_Report_${cleanName}_${timestamp}.pdf`)

      toast.success('Customer report exported successfully!')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('Failed to generate report. Please try again.')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )

  useEffect(() => {
    fetchUsers()
  }, [token, fetchUsers])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* Search and Stats */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="text-sm text-gray-600">
          Total Users: {users.length} | Showing: {paginatedUsers.length}
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user._id ? (
                      <input
                        type="text"
                        defaultValue={user.name}
                        onBlur={(e) => {
                          const newName = e.target.value.trim()
                          if (newName && newName !== user.name) {
                            handleEditUser(user._id, { name: newName })
                          } else {
                            setEditingUser(null)
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') e.target.blur()
                          if (e.key === 'Escape') setEditingUser(null)
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                        title="Edit User"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="text-green-600 hover:text-green-900 p-2 rounded-full hover:bg-green-50 transition-colors"
                        title="View Details"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete User"
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

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {paginatedUsers.map((user) => (
          <div key={user._id} className="bg-white rounded-lg shadow border p-3">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingUser === user._id ? (
                      <input
                        type="text"
                        defaultValue={user.name}
                        onBlur={(e) => {
                          const newName = e.target.value.trim()
                          if (newName && newName !== user.name) {
                            handleEditUser(user._id, { name: newName })
                          } else {
                            setEditingUser(null)
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') e.target.blur()
                          if (e.key === 'Escape') setEditingUser(null)
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                      title="Edit User"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="text-green-600 hover:text-green-900 p-1.5 rounded-full hover:bg-green-50 transition-colors"
                      title="View Details"
                    >
                      <FaEye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete User"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="truncate flex-1 mr-2">
                Joined: {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'N/A'
                }
              </span>
              <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${
                user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {user.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {paginatedUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No users found matching your search.' : 'No users found.'}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Edit User: {selectedUser.name}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setEditForm({ name: '', email: '', newPassword: '', isBlocked: false })
                }}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.isBlocked}
                    onChange={(e) => setEditForm({ ...editForm, isBlocked: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Block User</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setEditForm({ name: '', email: '', newPassword: '', isBlocked: false })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && userDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-lg sm:text-xl font-bold">User Details: {userDetails.user.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={exportUserData}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm sm:text-base"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setUserDetails(null)
                    setSelectedUser(null)
                  }}
                  className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-sm sm:text-base">User Information</h4>
                <div className="space-y-2 text-sm sm:text-base">
                  <p><span className="font-medium">Name:</span> {userDetails.user.name}</p>
                  <p><span className="font-medium">Email:</span> {userDetails.user.email}</p>
                  <p><span className="font-medium">Joined:</span> {new Date(userDetails.user.createdAt).toLocaleDateString()}</p>
                  <p><span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${userDetails.user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {userDetails.user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-sm sm:text-base">Order Summary</h4>
                <div className="space-y-2 text-sm sm:text-base">
                  <p><span className="font-medium">Total Orders:</span> {userDetails.totalOrders}</p>
                  <p><span className="font-medium">Total Spent:</span> Rs. {userDetails.totalSpent.toLocaleString()}</p>
                  <p><span className="font-medium">Average Order:</span> Rs. {userDetails.totalOrders > 0 ? (userDetails.totalSpent / userDetails.totalOrders).toFixed(2) : '0.00'}</p>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Order History</h4>
              {userDetails.orders && userDetails.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Order ID</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetails.orders.map((order) => (
                        <tr key={order._id} className="border-b">
                          <td className="py-2">{order._id.slice(-8)}</td>
                          <td className="py-2">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="py-2">Rs. {order.amount}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.payment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {order.payment ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm sm:text-base">No orders found for this user.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

UserManagement.propTypes = {
  token: PropTypes.string.isRequired,
}

export default UserManagement
