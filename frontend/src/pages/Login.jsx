import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaGoogle, FaPhone } from 'react-icons/fa';

const Login = () => {

  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

  const [name,setName] = useState('')
  const [password,setPassword] = useState('')
  const [email,setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone,setPhone] = useState('')
  const [otp,setOtp] = useState('')
  const [showOTP, setShowOTP] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const onSubmitHandler = async (event) => {
      event.preventDefault();
      try {
        if (showOTP) {
          // Handle OTP verification
          const response = await axios.post(backendUrl + '/api/user/verify-phone-otp', {phone, otp})
          if (response.data.success) {
            setToken(response.data.token)
            localStorage.setItem('token',response.data.token)
            toast.success('Login successful!')
          } else {
            toast.error(response.data.message)
          }
        } else if (currentState === 'Sign Up') {

          const response = await axios.post(backendUrl + '/api/user/register',{name,email,password})
          if (response.data.success) {
            setToken(response.data.token)
            localStorage.setItem('token',response.data.token)
          } else {
            toast.error(response.data.message)
          }

        } else {

          const response = await axios.post(backendUrl + '/api/user/login', {email,password})
          if (response.data.success) {
            setToken(response.data.token)
            localStorage.setItem('token',response.data.token)
          } else {
            // Check if user is blocked
            if (response.data.message === "Your account has been blocked by admin") {
              navigate('/blocked')
            } else {
              toast.error(response.data.message)
            }
          }

        }


      } catch (error) {
        console.log(error)
        toast.error(error.message)
      }
  }

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${backendUrl}/api/user/auth/google`
  }

  const handlePhoneLogin = () => {
    setShowOTP(true)
  }

  const sendOTP = async () => {
    if (!phone) {
      toast.error('Please enter phone number')
      return
    }
    try {
      const response = await axios.post(backendUrl + '/api/user/send-phone-otp', {phone})
      if (response.data.success) {
        setOtpSent(true)
        toast.success('OTP sent to your phone!')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error('Failed to send OTP')
    }
  }

  useEffect(()=>{
    if (token) {
      navigate('/')
    }
  },[token, navigate])

  return (
    <div className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      {!showOTP ? (
        <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-full gap-4'>
          <div className='inline-flex items-center gap-2 mb-2 mt-10'>
              <p className='prata-regular text-3xl'>{currentState}</p>
              <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
          </div>
          {currentState === 'Login' ? '' : <input onChange={(e)=>setName(e.target.value)} value={name} type="text" className='w-full px-3 py-2 border border-gray-800' placeholder='Name' required/>}
          <input onChange={(e)=>setEmail(e.target.value)} value={email} type="email" className='w-full px-3 py-2 border border-gray-800' placeholder='Email' required/>
          <div className='relative w-full'>
            <input
              onChange={(e)=>setPassword(e.target.value)}
              value={password}
              type={showPassword ? "text" : "password"}
              className='w-full px-3 py-2 pr-10 border border-gray-800'
              placeholder='Password'
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
          <div className='w-full flex justify-between text-sm mt-[-8px]'>
              <p onClick={() => navigate('/forgot-password')} className='cursor-pointer text-blue-600 hover:text-blue-800'>Forgot your password?</p>
              {
                currentState === 'Login'
                ? <p onClick={()=>setCurrentState('Sign Up')} className=' cursor-pointer'>Create account</p>
                : <p onClick={()=>setCurrentState('Login')} className=' cursor-pointer'>Login Here</p>
              }
          </div>
          <button className='bg-black text-white font-light px-8 py-2 mt-4 w-full'>{currentState === 'Login' ? 'Sign In' : 'Sign Up'}</button>

          {/* Social Login Options */}
          <div className='w-full mt-4'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-gray-500'>Or continue with</span>
              </div>
            </div>

            <div className='mt-4 grid grid-cols-2 gap-3'>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className='w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50'
              >
                <FaGoogle className='text-red-500 mr-2' />
                Google
              </button>

              <button
                type="button"
                onClick={handlePhoneLogin}
                className='w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50'
              >
                <FaPhone className='text-green-500 mr-2' />
                Phone
              </button>
            </div>
          </div>
        </form>
      ) : (
        // Phone OTP Form
        <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-full gap-4'>
          <div className='inline-flex items-center gap-2 mb-2 mt-10'>
              <p className='prata-regular text-3xl'>Phone Login</p>
              <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
          </div>

          <div className='relative w-full'>
            <input
              onChange={(e)=>setPhone(e.target.value)}
              value={phone}
              type="tel"
              className='w-full px-3 py-2 pr-20 border border-gray-800'
              placeholder='Enter phone number'
              required
            />
            <button
              type="button"
              onClick={sendOTP}
              disabled={otpSent}
              className='absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 text-sm'
            >
              {otpSent ? 'Sent' : 'Send OTP'}
            </button>
          </div>

          {otpSent && (
            <input
              onChange={(e)=>setOtp(e.target.value)}
              value={otp}
              type="text"
              className='w-full px-3 py-2 border border-gray-800'
              placeholder='Enter 6-digit OTP'
              maxLength="6"
              required
            />
          )}

          <div className='w-full flex justify-between text-sm'>
            <p onClick={() => {setShowOTP(false); setOtpSent(false); setPhone(''); setOtp('')}} className='cursor-pointer text-blue-600 hover:text-blue-800'>Back to login</p>
          </div>

          <button
            type="submit"
            disabled={!otpSent}
            className='bg-black text-white font-light px-8 py-2 mt-4 w-full disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            Verify & Login
          </button>
        </form>
      )}
    </div>
  )
}

export default Login
