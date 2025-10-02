import { NavLink, useLocation } from 'react-router-dom'
import { MdOutlineAdd, MdOutlineList, MdOutlineShoppingCart, MdOutlineAnalytics, MdOutlineStar, MdOutlinePeople } from 'react-icons/md'

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className='w-[18%] min-h-screen border-r-2'>
        <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>

            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/add">
                <MdOutlineAdd className='w-5 h-5' />
                <p className='hidden md:block'>Add Items</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/list">
                <MdOutlineList className='w-5 h-5' />
                <p className='hidden md:block'>List Items</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/orders">
                <MdOutlineShoppingCart className='w-5 h-5' />
                <p className='hidden md:block'>Orders</p>
            </NavLink>

            <NavLink className={({ isActive }) => `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${isActive || location.pathname === '/' ? 'bg-gray-100' : ''}`} to="/analytics">
                <MdOutlineAnalytics className='w-5 h-5' />
                <p className='hidden md:block'>Analytics</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/reviews">
                <MdOutlineStar className='w-5 h-5' />
                <p className='hidden md:block'>Reviews</p>
            </NavLink>

            <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to="/users">
                <MdOutlinePeople className='w-5 h-5' />
                <p className='hidden md:block'>Users</p>
            </NavLink>

        </div>

    </div>
  )
}

export default Sidebar
