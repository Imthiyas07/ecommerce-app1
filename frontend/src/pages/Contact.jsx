import Title from '../components/Title';
import { assets } from '../assets/assets';
import NewsletterBox from '../components/NewsletterBox';

const Contact = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 border-t'>
        <Title text1={'CONTACT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 px-6'>
        <img className='w-full md:max-w-[480px] rounded-lg shadow-lg' src={assets.contact_img} alt='' />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-gray-700'>Our Store</p>
          <p className='text-gray-600'>22st ,Nehru Nagar,<br/> Phase 2, Sathuvachari,<br/> Vellore, Tamil Nadu 632009</p>
          <p className='text-gray-600'>Tel: (415) 789-555-0132 <br /> Email: shopfromhome@gmail.com</p>
          <p className='font-semibold text-xl text-gray-700'>Careers at Shop-from-Home</p>
          <p className='text-gray-600'>Learn more about our teams and job openings.<br/>Have any questions or concerns? Reach out to us via email.</p>
          <a href="mailto:imthiyasr142@gmail.com"><button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500 rounded-md'>
          📩 Send Us an Email
          </button></a>
        </div>
      </div>
      <br/>

      {/* Google Maps Embed */}
      <div className='flex justify-center mb-10'>
        <iframe
          title='Google Maps'
          className='w-full md:w-3/4 h-80 rounded-xl shadow-md border'
          src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.83543450937!2d144.9630578156162!3d-37.81627944202139!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d4823f7c1f5%3A0x508a36b496a813f!2sMelbourne%2C%20VIC%2C%20Australia!5e0!3m2!1sen!2sus!4v1649491164320!5m2!1sen!2sus'
          allowFullScreen=''
          loading='lazy'>
        </iframe>
      </div>

      {/* Click-to-Navigate Button */}
      <div className='text-center mb-10'>
        <a href='https://maps.app.goo.gl/N1b1n9dpgjE3575AA' target='_blank' rel='noopener noreferrer'>
          <button className='bg-black text-white px-6 py-3 text-sm rounded-md hover:bg-gray-800 transition-all duration-500'>
            Get Directions
          </button>
        </a>
      </div>

      {/* Live Chat Button */}
      <div className='fixed bottom-6 right-6'>
        <button className='bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition'>
          💬 Chat
        </button>
      </div>

      <NewsletterBox />
    </div>
  );
};

export default Contact;
