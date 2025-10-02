import { useState } from 'react'
import PropTypes from 'prop-types'
import {assets} from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../constants'
import { toast } from 'react-toastify'

const Add = ({token}) => {

  const [image1,setImage1] = useState(false)
  const [image2,setImage2] = useState(false)
  const [image3,setImage3] = useState(false)
  const [image4,setImage4] = useState(false)

   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [price, setPrice] = useState("");
   const [category, setCategory] = useState("Men");
   const [subCategory, setSubCategory] = useState("Topwear");
   const [bestseller, setBestseller] = useState(false);
   const [sizes, setSizes] = useState([]);
   const [sizeStock, setSizeStock] = useState({});
   const [minStock, setMinStock] = useState("5");
   const [sku, setSku] = useState("");

   const handleSizeStockChange = (size, value) => {
     setSizeStock(prev => ({
       ...prev,
       [size]: parseInt(value) || 0
     }));
   };

   const handleSizeToggle = (size) => {
     setSizes(prev => {
       const newSizes = prev.includes(size)
         ? prev.filter(item => item !== size)
         : [...prev, size];

       // Initialize stock for new size
       if (!prev.includes(size)) {
         setSizeStock(prevStock => ({
           ...prevStock,
           [size]: 0
         }));
       } else {
         // Remove stock for deselected size
         setSizeStock(prevStock => {
           const newStock = { ...prevStock };
           delete newStock[size];
           return newStock;
         });
       }

       return newSizes;
     });
   };

   const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {

      const formData = new FormData()

      formData.append("name",name)
      formData.append("description",description)
      formData.append("price",price)
      formData.append("category",category)
      formData.append("subCategory",subCategory)
      formData.append("bestseller",bestseller)
      formData.append("sizes",JSON.stringify(sizes))
      formData.append("sizeStock",JSON.stringify(sizeStock))
      formData.append("minStock",minStock)
      formData.append("sku",sku)

      image1 && formData.append("image1",image1)
      image2 && formData.append("image2",image2)
      image3 && formData.append("image3",image3)
      image4 && formData.append("image4",image4)

      const response = await axios.post(backendUrl + "/api/product/add",formData,{headers:{token}})

      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
        setPrice('')
        setSizes([])
        setSizeStock({})
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
   }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
        <div>
          <p className='mb-2'>Upload Image</p>

          <div className='flex gap-2'>
            <label htmlFor="image1">
              <img className='w-20' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
              <input onChange={(e)=>setImage1(e.target.files[0])} type="file" id="image1" hidden/>
            </label>
            <label htmlFor="image2">
              <img className='w-20' src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
              <input onChange={(e)=>setImage2(e.target.files[0])} type="file" id="image2" hidden/>
            </label>
            <label htmlFor="image3">
              <img className='w-20' src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
              <input onChange={(e)=>setImage3(e.target.files[0])} type="file" id="image3" hidden/>
            </label>
            <label htmlFor="image4">
              <img className='w-20' src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
              <input onChange={(e)=>setImage4(e.target.files[0])} type="file" id="image4" hidden/>
            </label>
          </div>
        </div>

        <div className='w-full'>
          <p className='mb-2'>Product name</p>
          <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Type here' required/>
        </div>

        <div className='w-full'>
          <p className='mb-2'>Product description</p>
          <textarea onChange={(e)=>setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Write content here' required/>
        </div>

        <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>

            <div>
              <p className='mb-2'>Product category</p>
              <select onChange={(e) => setCategory(e.target.value)} className='w-full px-3 py-2'>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
              </select>
            </div>

            <div>
              <p className='mb-2'>Sub category</p>
              <select onChange={(e) => setSubCategory(e.target.value)} className='w-full px-3 py-2'>
                  <option value="Topwear">Topwear</option>
                  <option value="Bottomwear">Bottomwear</option>
                  <option value="Winterwear">Winterwear</option>
              </select>
            </div>

            <div>
              <p className='mb-2'>Product Price</p>
              <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 sm:w-[120px]' type="Number" placeholder='25' />
            </div>

        </div>

        <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>

            <div>
              <p className='mb-2'>Minimum Stock Level</p>
              <input onChange={(e) => setMinStock(e.target.value)} value={minStock} className='w-full px-3 py-2 sm:w-[120px]' type="number" placeholder='5' min="0" />
            </div>

            <div>
              <p className='mb-2'>SKU</p>
              <input onChange={(e) => setSku(e.target.value)} value={sku} className='w-full px-3 py-2 sm:w-[120px]' type="text" placeholder='PROD-001' />
            </div>

        </div>

        <div>
          <p className='mb-2'>Product Sizes</p>
          <div className='flex gap-3'>
            <div onClick={()=>handleSizeToggle("S")}>
              <p className={`${sizes.includes("S") ? "bg-pink-100" : "bg-slate-200" } px-3 py-1 cursor-pointer`}>S</p>
            </div>

            <div onClick={()=>handleSizeToggle("M")}>
              <p className={`${sizes.includes("M") ? "bg-pink-100" : "bg-slate-200" } px-3 py-1 cursor-pointer`}>M</p>
            </div>

            <div onClick={()=>handleSizeToggle("L")}>
              <p className={`${sizes.includes("L") ? "bg-pink-100" : "bg-slate-200" } px-3 py-1 cursor-pointer`}>L</p>
            </div>

            <div onClick={()=>handleSizeToggle("XL")}>
              <p className={`${sizes.includes("XL") ? "bg-pink-100" : "bg-slate-200" } px-3 py-1 cursor-pointer`}>XL</p>
            </div>

            <div onClick={()=>handleSizeToggle("XXL")}>
              <p className={`${sizes.includes("XXL") ? "bg-pink-100" : "bg-slate-200" } px-3 py-1 cursor-pointer`}>XXL</p>
            </div>
          </div>
        </div>

        {sizes.length > 0 && (
          <div>
            <p className='mb-2'>Stock by Size</p>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
              {sizes.map(size => (
                <div key={size} className='flex flex-col'>
                  <label className='text-sm mb-1'>Size {size}</label>
                  <input
                    type="number"
                    min="0"
                    value={sizeStock[size] || 0}
                    onChange={(e) => handleSizeStockChange(size, e.target.value)}
                    className='px-2 py-1 border border-gray-300 rounded text-center'
                    placeholder='0'
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='flex gap-2 mt-2'>
          <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller' />
          <label className='cursor-pointer' htmlFor="bestseller">Add to bestseller</label>
        </div>

        <button type="submit" className='w-28 py-3 mt-4 bg-black text-white'>ADD</button>

    </form>
  )
}

Add.propTypes = {
  token: PropTypes.string.isRequired,
}

export default Add
