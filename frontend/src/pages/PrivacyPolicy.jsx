const PrivacyPolicy = () => {
  return (
    <div className='max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-2xl mt-10'>
      <h2 className='text-3xl font-semibold text-center mb-6 text-gray-800'>Privacy Policy</h2>

      <p className='text-gray-600 mb-4'>
        Welcome to Shop-from-Home. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
      </p>

      <h3 className='text-xl font-semibold text-gray-700 mt-6'>1. Information We Collect</h3>
      <p className='text-gray-600'>We collect personal information such as your name, email, phone number, and address when you register or place an order.</p>

      <h3 className='text-xl font-semibold text-gray-700 mt-6'>2. How We Use Your Information</h3>
      <ul className='list-disc pl-6 text-gray-600'>
        <li>To provide and manage our services.</li>
        <li>To improve our website and user experience.</li>
        <li>To communicate with you about your orders.</li>
        <li>For marketing and promotional purposes.</li>
      </ul>

      <h3 className='text-xl font-semibold text-gray-700 mt-6'>3. Sharing Your Information</h3>
      <p className='text-gray-600'>We do not sell or rent your personal data. We may share your information with third-party services only for order processing and website improvement.</p>

      <h3 className='text-xl font-semibold text-gray-700 mt-6'>4. Data Security</h3>
      <p className='text-gray-600'>We implement strict security measures to protect your data from unauthorized access, disclosure, or destruction.</p>

      <h3 className='text-xl font-semibold text-gray-700 mt-6'>5. Your Rights</h3>
      <p className='text-gray-600'>You have the right to access, update, or delete your personal information. Contact us at <a href='/contact' className='text-blue-500'>contact@shopfromhome.com</a>.</p>

      <h3 className='text-xl font-semibold text-gray-700 mt-6'>6. Cookies</h3>
      <p className='text-gray-600'>We use cookies to improve your browsing experience. You can disable cookies in your browser settings.</p>

      <h3 className='text-xl font-semibold text-gray-700 mt-6'>7. Changes to This Policy</h3>
      <p className='text-gray-600'>We may update this policy from time to time. Changes will be posted on this page.</p>

      <h3 className='text-xl font-semibold text-gray-700 mt-6'>8. Contact Us</h3>
      <p className='text-gray-600'>If you have any questions, please contact us at <a href='/contact' className='text-blue-500'>contact@shopfromhome.com</a>.</p>

      <div className='text-center mt-6'>
        <a href='/'>
          <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500 rounded-md'>
            Back to Home
          </button>
        </a>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
