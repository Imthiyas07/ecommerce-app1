import { assets } from '../assets/assets'

const Footer = () => {
  return (
    
    <div>
      
      <div className='flex flex-col sm:grid grid-cols-[2fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
            <img src={assets.logo} className='mb-5 w-32' alt="" />
            <p className='w-full md:w-2/3 text-gray-600'>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About us</a></li>
                <li><a href="/privacy-policy">Privacy policy</a></li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>Tel: (415) 789-555-0132</li>
                <li><a href="/contact">contact@shopfromhome.com</a></li>
            </ul>
        </div>

      </div>

        <div>
            <hr />
            <p className='py-5 text-sm text-center'>Copyright 2025@ shopfromhome.com - All Right Reserved.</p>
        </div>

    </div>
  )
}

export default Footer
