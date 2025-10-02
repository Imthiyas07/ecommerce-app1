import { useState } from 'react';
import { toast } from 'react-toastify';

const NewsletterBox = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Thank you for subscribing to Shop-from-Home! and Soon you get 20% offer!');
    setEmail('');
  };

  return (
    <div className='text-center'>
      <p className='text-2xl font-medium text-gray-800'>Subscribe now & get 20% off</p>
      <p className='text-gray-400 mt-3'>Stay updated with Shop-from-Home latest offers and trends.</p>
      <form className='w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3' onSubmit={handleSubscribe}>
        <input className='w-full sm:flex-1 outline-none' type='email' placeholder='Enter your email' value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className='bg-black text-white text-xs px-10 py-4' type='submit'>SUBSCRIBE</button>
      </form>
    </div>
  );
};

export default NewsletterBox;
