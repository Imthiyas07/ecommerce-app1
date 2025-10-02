import { sendOTPEmail } from './config/email.js';

// Test email functionality
const testEmail = async () => {
    console.log('🧪 Testing email configuration...');

    try {
        const result = await sendOTPEmail('test@example.com', '123456');

        if (result.success) {
            console.log('✅ Email sent successfully!');
            console.log('📧 Message ID:', result.messageId);
        } else {
            console.log('❌ Email failed to send');
            console.log('🔍 Error:', result.error);
        }
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
    }
};

// Run the test
testEmail();
