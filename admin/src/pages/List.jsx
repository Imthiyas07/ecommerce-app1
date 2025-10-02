import axios from 'axios'
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { backendUrl } from '../constants'
import { toast } from 'react-toastify'


const List = ({ token }) => {

  const [list, setList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subCategory: '',
    sizes: [],
    sizeStock: {},
    bestseller: false,
    minStock: '',
    sku: '',
    isActive: true
  })
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [bulkForm, setBulkForm] = useState({
    stock: '',
    minStock: '',
    isActive: null
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')

  const fetchList = async () => {
    try {

      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setList(response.data.products.reverse());
      }
      else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {

      const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const openEditModal = (product) => {
    // Convert sizeStock Map to plain object for form handling
    const sizeStockObj = {};
    if (product.sizeStock) {
      if (typeof product.sizeStock === 'object' && product.sizeStock.constructor.name === 'Map') {
        // Handle MongoDB Map object
        for (const [size, stock] of product.sizeStock) {
          sizeStockObj[size] = stock;
        }
      } else {
        // Handle plain object
        Object.assign(sizeStockObj, product.sizeStock);
      }
    }

    setEditingProduct(product)
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || 'Men',
      subCategory: product.subCategory || 'Topwear',
      sizes: product.sizes || [],
      sizeStock: sizeStockObj,
      bestseller: product.bestseller || false,
      minStock: product.minStock || 5,
      sku: product.sku || '',
      isActive: product.isActive !== false
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingProduct(null)
    setEditForm({
      name: '',
      description: '',
      price: '',
      category: '',
      subCategory: '',
      sizes: [],
      sizeStock: {},
      bestseller: false,
      minStock: '',
      sku: '',
      isActive: true
    })
  }

  const handleSizeStockChange = (size, value) => {
    setEditForm(prev => ({
      ...prev,
      sizeStock: {
        ...prev.sizeStock,
        [size]: parseInt(value) || 0
      }
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append("productId", editingProduct._id)
      formData.append("name", editForm.name)
      formData.append("description", editForm.description)
      formData.append("price", editForm.price)
      formData.append("category", editForm.category)
      formData.append("subCategory", editForm.subCategory)
      formData.append("sizes", JSON.stringify(editForm.sizes))
      formData.append("sizeStock", JSON.stringify(editForm.sizeStock))
      formData.append("bestseller", editForm.bestseller)
      formData.append("minStock", editForm.minStock)
      formData.append("sku", editForm.sku)
      formData.append("isActive", editForm.isActive)

      const response = await axios.post(backendUrl + '/api/product/update', formData, { headers: { token } })

      if (response.data.success) {
        toast.success('Product updated successfully')
        await fetchList()
        closeEditModal()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const getStockStatus = (product) => {
    if (product.stock === 0) {
      return { status: 'out', icon: 'EMPTY', text: 'Out of Stock' }
    } else if (product.stock <= product.minStock) {
      return { status: 'low', icon: 'LOW', text: 'Low Stock' }
    } else {
      return { status: 'good', icon: 'IN', text: 'In Stock' }
    }
  }

  // Filter and search logic
  useEffect(() => {
    let filtered = list

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Stock status filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = getStockStatus(item)
        return status.status === stockFilter
      })
    }

    setFilteredList(filtered)
  }, [list, searchTerm, stockFilter])

  // Bulk operations
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredList.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredList.map(item => item._id))
    }
  }

  const openBulkModal = () => {
    if (selectedProducts.length === 0) {
      toast.warning('Please select products to edit')
      return
    }
    setShowBulkModal(true)
  }

  const closeBulkModal = () => {
    setShowBulkModal(false)
    setBulkForm({
      stock: '',
      minStock: '',
      isActive: null
    })
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    try {
      const updates = selectedProducts.map(productId => ({
        productId,
        stock: bulkForm.stock || undefined,
        minStock: bulkForm.minStock || undefined,
        isActive: bulkForm.isActive
      }))

      const response = await axios.post(backendUrl + '/api/product/bulk-update-inventory', { updates }, { headers: { token } })

      if (response.data.success) {
        toast.success(`Updated ${response.data.results.length} products successfully`)
        await fetchList()
        setSelectedProducts([])
        closeBulkModal()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <>
      <div className='flex justify-between items-center mb-4'>
        <p className='text-lg font-medium'>Inventory Management</p>
        {selectedProducts.length > 0 && (
          <button
            onClick={openBulkModal}
            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
          >
            Bulk Edit ({selectedProducts.length})
          </button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className='flex flex-col sm:flex-row gap-4 mb-4'>
        <div className='flex-1'>
          <input
            type='text'
            placeholder='Search by name or SKU...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full p-2 border rounded'
          />
        </div>
        <div className='sm:w-48'>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className='w-full p-2 border rounded'
          >
            <option value='all'>All Stock Status</option>
            <option value='good'>In Stock</option>
            <option value='low'>Low Stock</option>
            <option value='out'>Out of Stock</option>
          </select>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        {/* ------- List Table Title ---------- */}
        <div className='hidden md:grid grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <input
            type='checkbox'
            checked={selectedProducts.length === filteredList.length && filteredList.length > 0}
            onChange={handleSelectAll}
            className='w-4 h-4'
          />
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Stock</b>
          <b>SKU</b>
          <b>Status</b>
          <b className='text-center'>Actions</b>
        </div>

        {/* ------ Product List ------ */}
        {filteredList.length === 0 ? (
          <p className='text-center py-8 text-gray-500'>No products found</p>
        ) : (
          filteredList.map((item, index) => {
            const stockStatus = getStockStatus(item)
            const isSelected = selectedProducts.includes(item._id)
            return (
              <div className={`grid grid-cols-[0.5fr_1fr_2fr_1fr] md:grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm ${isSelected ? 'bg-blue-50' : ''}`} key={index}>
                <input
                  type='checkbox'
                  checked={isSelected}
                  onChange={() => handleSelectProduct(item._id)}
                  className='w-4 h-4'
                />
                <img className='w-12' src={item.image[0]} alt="" />
                <p>{item.name}</p>
                <p>{item.category}</p>
                <p className={`font-medium ${stockStatus.status === 'low' ? 'text-orange-600' : stockStatus.status === 'out' ? 'text-red-600' : 'text-green-600'}`}>
                  {item.stock || 0}
                </p>
                <p className='text-xs text-gray-600'>{item.sku || 'N/A'}</p>
                <div className='flex items-center gap-1'>
                  <span className={`px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-2 whitespace-nowrap ${
                    stockStatus.status === 'low'
                      ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-2 border-orange-300 shadow-sm'
                      : stockStatus.status === 'out'
                      ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-2 border-red-300 shadow-sm'
                      : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-300 shadow-sm'
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      stockStatus.status === 'low' ? 'bg-orange-500' :
                      stockStatus.status === 'out' ? 'bg-red-500' : 'bg-green-500'
                    }`}></span>
                    {stockStatus.status === 'low' ? 'Low Stock' : stockStatus.status === 'out' ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
                <div className='flex items-center justify-center gap-2'>
                  <button
                    onClick={() => openEditModal(item)}
                    className='text-blue-600 hover:text-blue-800 px-2 py-1 text-xs border border-blue-600 rounded hover:bg-blue-50'
                    title="Edit Product"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => removeProduct(item._id)}
                    className='text-red-600 hover:text-red-800 p-1'
                    title="Remove Product"
                  >
                    X
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            <h2 className='text-xl font-bold mb-4'>Edit Product - {editingProduct.name}</h2>
            <form onSubmit={handleEditSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Product Name</label>
                  <input
                    type='text'
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className='w-full p-2 border rounded'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Price</label>
                  <input
                    type='number'
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                    className='w-full p-2 border rounded'
                    min='0'
                    step='0.01'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className='w-full p-2 border rounded'
                  rows='3'
                  required
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className='w-full p-2 border rounded'
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Sub Category</label>
                  <select
                    value={editForm.subCategory}
                    onChange={(e) => setEditForm({...editForm, subCategory: e.target.value})}
                    className='w-full p-2 border rounded'
                  >
                    <option value="Topwear">Topwear</option>
                    <option value="Bottomwear">Bottomwear</option>
                    <option value="Winterwear">Winterwear</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Minimum Stock Level</label>
                  <input
                    type='number'
                    value={editForm.minStock}
                    onChange={(e) => setEditForm({...editForm, minStock: e.target.value})}
                    className='w-full p-2 border rounded'
                    min='0'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>SKU</label>
                  <input
                    type='text'
                    value={editForm.sku}
                    onChange={(e) => setEditForm({...editForm, sku: e.target.value})}
                    className='w-full p-2 border rounded'
                    placeholder='Enter SKU'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>Sizes</label>
                <div className='flex gap-3 flex-wrap'>
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <div key={size} onClick={() => {
                      const isSelected = editForm.sizes.includes(size);
                      setEditForm(prev => {
                        const newSizes = isSelected
                          ? prev.sizes.filter(s => s !== size)
                          : [...prev.sizes, size];

                        // Update sizeStock when size is added/removed
                        const newSizeStock = { ...prev.sizeStock };
                        if (isSelected) {
                          // Remove size from stock
                          delete newSizeStock[size];
                        } else {
                          // Add size to stock with default value
                          newSizeStock[size] = newSizeStock[size] || 0;
                        }

                        return {
                          ...prev,
                          sizes: newSizes,
                          sizeStock: newSizeStock
                        };
                      });
                    }}>
                      <p className={`${editForm.sizes.includes(size) ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer`}>
                        {size}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {editForm.sizes.length > 0 && (
                <div>
                  <label className='block text-sm font-medium mb-2'>Stock by Size</label>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
                    {editForm.sizes.map(size => (
                      <div key={size} className='flex flex-col'>
                        <label className='text-sm mb-1'>Size {size}</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.sizeStock[size] || 0}
                          onChange={(e) => handleSizeStockChange(size, e.target.value)}
                          className='px-2 py-1 border border-gray-300 rounded text-center'
                          placeholder='0'
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className='flex gap-4'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='bestseller'
                    checked={editForm.bestseller}
                    onChange={(e) => setEditForm({...editForm, bestseller: e.target.checked})}
                    className='mr-2'
                  />
                  <label htmlFor='bestseller' className='text-sm'>Add to bestseller</label>
                </div>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='isActive'
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                    className='mr-2'
                  />
                  <label htmlFor='isActive' className='text-sm'>Product is Active</label>
                </div>
              </div>

              <div className='flex gap-2 pt-4'>
                <button
                  type='submit'
                  className='flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700'
                >
                  Update Product
                </button>
                <button
                  type='button'
                  onClick={closeEditModal}
                  className='flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg w-full max-w-md'>
            <h2 className='text-xl font-bold mb-4'>Bulk Edit Inventory ({selectedProducts.length} products)</h2>
            <form onSubmit={handleBulkSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>Stock Quantity (leave empty to keep current)</label>
                <input
                  type='number'
                  value={bulkForm.stock}
                  onChange={(e) => setBulkForm({...bulkForm, stock: e.target.value})}
                  className='w-full p-2 border rounded'
                  min='0'
                  placeholder='New stock quantity'
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>Minimum Stock Level (leave empty to keep current)</label>
                <input
                  type='number'
                  value={bulkForm.minStock}
                  onChange={(e) => setBulkForm({...bulkForm, minStock: e.target.value})}
                  className='w-full p-2 border rounded'
                  min='0'
                  placeholder='New minimum stock level'
                />
              </div>
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='bulkIsActive'
                  checked={bulkForm.isActive === true}
                  onChange={(e) => setBulkForm({...bulkForm, isActive: e.target.checked ? true : null})}
                  className='mr-2'
                />
                <label htmlFor='bulkIsActive' className='text-sm'>Set all products as Active</label>
              </div>
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='bulkIsInactive'
                  checked={bulkForm.isActive === false}
                  onChange={(e) => setBulkForm({...bulkForm, isActive: e.target.checked ? false : null})}
                  className='mr-2'
                />
                <label htmlFor='bulkIsInactive' className='text-sm'>Set all products as Inactive</label>
              </div>
              <div className='flex gap-2 pt-4'>
                <button
                  type='submit'
                  className='flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700'
                >
                  Update All Selected
                </button>
                <button
                  type='button'
                  onClick={closeBulkModal}
                  className='flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

List.propTypes = {
  token: PropTypes.string.isRequired,
}

export default List
