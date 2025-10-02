import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
    // Gmail configuration
    if (process.env.EMAIL_SERVICE === 'gmail' || !process.env.EMAIL_SERVICE) {
        return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD // Use app password for Gmail
            },
            debug: true,
            logger: true
        });
    }

    // Outlook/Hotmail configuration
    if (process.env.EMAIL_SERVICE === 'outlook') {
        return nodemailer.createTransporter({
            service: 'outlook',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            },
            debug: true,
            logger: true
        });
    }

    // Yahoo configuration
    if (process.env.EMAIL_SERVICE === 'yahoo') {
        return nodemailer.createTransporter({
            service: 'yahoo',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            },
            debug: true,
            logger: true
        });
    }

    // Custom SMTP configuration (for services like SendGrid, Mailgun, etc.)
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        },
        debug: true,
        logger: true
    });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Ecommerce App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - Ecommerce App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5;">
                        You have requested to reset your password for your Ecommerce App account.
                    </p>
                    <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h3 style="color: #333; margin: 0; font-size: 24px; letter-spacing: 3px;">${otp}</h3>
                        <p style="color: #666; margin: 10px 0 0 0;">Your One-Time Password (OTP)</p>
                    </div>
                    <p style="color: #666; font-size: 14px; line-height: 1.5;">
                        This OTP is valid for 10 minutes. Please do not share this code with anyone.
                    </p>
                    <p style="color: #666; font-size: 14px; line-height: 1.5;">
                        If you didn't request this password reset, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This is an automated message from Ecommerce App. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return { success: false, error: error.message };
    }
};

export { sendOTPEmail };
