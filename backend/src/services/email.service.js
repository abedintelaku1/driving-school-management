const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

const initializeTransporter = () => {
    if (transporter) {
        return transporter;
    }

    // Check if SMTP credentials are configured
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    
    if (hasSmtpConfig) {
        // Use SMTP configuration (production or development with SMTP)
        console.log('📧 Initializing SMTP transporter...');
        console.log('   Host:', process.env.SMTP_HOST);
        console.log('   Port:', process.env.SMTP_PORT || '587');
        console.log('   User:', process.env.SMTP_USER);
        console.log('   Secure:', process.env.SMTP_SECURE === 'true');
        
        // Check if using Gmail
        const isGmail = process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail.com');
        if (isGmail) {
            console.log('   ⚠️  Gmail detected. Make sure you are using an App Password, not your regular password.');
            console.log('   To create an App Password:');
            console.log('   1. Go to your Google Account settings');
            console.log('   2. Security > 2-Step Verification > App passwords');
            console.log('   3. Generate a new app password for "Mail"');
        }
        
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            // For Gmail and other services, might need tls
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates (for development)
            }
        });
        
        console.log('✅ SMTP transporter initialized successfully');
    } else if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
        // Use Ethereal Email for testing
        console.log('📧 Initializing Ethereal Email transporter...');
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.ETHEREAL_USER,
                pass: process.env.ETHEREAL_PASS
            }
        });
        console.log('✅ Ethereal Email transporter initialized');
    } else {
        // No email configuration - use mock
        console.warn('⚠️  Email service: No SMTP credentials found. Emails will be logged but not sent.');
        console.warn('   To enable email sending:');
        console.warn('   Configure SMTP settings in .env (SMTP_HOST, SMTP_USER, SMTP_PASS, etc.)');
        console.warn('   Or use Ethereal Email for testing (ETHEREAL_USER, ETHEREAL_PASS)');
        
        transporter = {
            sendMail: async (options) => {
                console.log('📧 [MOCK EMAIL] Would send email:', {
                    to: options.to,
                    subject: options.subject,
                    from: options.from
                });
                return {
                    messageId: 'mock-' + Date.now(),
                    accepted: [options.to],
                    rejected: []
                };
            }
        };
    }

    return transporter;
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 * @returns {Promise<Object>} - Result with success status and message info
 */
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const mailTransporter = initializeTransporter();

        if (!to || !subject || !html) {
            throw new Error('To, subject, and html are required');
        }

        // For Gmail, 'from' must be the authenticated user's email or a verified alias
        // Gmail doesn't allow sending from unverified addresses
        const isGmail = process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail.com');
        let fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.ETHEREAL_USER || 'noreply@autoshkolla.com';
        
        // If using Gmail and SMTP_FROM is different from SMTP_USER, use SMTP_USER
        if (isGmail && process.env.SMTP_FROM && process.env.SMTP_FROM !== process.env.SMTP_USER) {
            console.warn('⚠️  Gmail detected: Using SMTP_USER as from address instead of SMTP_FROM');
            console.warn('   Gmail requires the "from" address to match the authenticated user or be a verified alias');
            fromEmail = process.env.SMTP_USER;
        }
        
        const mailOptions = {
            from: fromEmail,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for plain text
        };

        console.log('📧 Attempting to send email:', {
            to,
            subject,
            from: mailOptions.from,
            host: process.env.SMTP_HOST
        });

        const info = await mailTransporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully:', {
            messageId: info.messageId,
            to,
            subject,
            accepted: info.accepted,
            rejected: info.rejected
        });

        // In development with Ethereal, log the preview URL
        if (process.env.NODE_ENV === 'development' && info.messageId && !info.messageId.startsWith('mock-')) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('📧 Email preview URL:', previewUrl);
            }
        }

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info)
        };
    } catch (error) {
        console.error('❌ Error sending email:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
            to,
            subject
        });
        
        // More detailed error logging
        if (error.code === 'EAUTH') {
            console.error('   Authentication failed. Check SMTP_USER and SMTP_PASS.');
            console.error('   For Gmail, you may need to use an App Password instead of your regular password.');
        } else if (error.code === 'ECONNECTION') {
            console.error('   Connection failed. Check SMTP_HOST and SMTP_PORT.');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('   Connection timeout. Check your network and SMTP settings.');
        }
        
        throw error;
    }
};

/**
 * Send welcome email to a new candidate
 * @param {Object} candidate - Candidate object
 * @returns {Promise<Object>}
 */
const sendWelcomeEmail = async (candidate) => {
    const { firstName, lastName, email, uniqueClientNumber } = candidate;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .info-box { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2563eb; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Mirë se vini në AutoShkolla!</h1>
                </div>
                <div class="content">
                    <p>Përshëndetje <strong>${firstName} ${lastName}</strong>,</p>
                    <p>Ju falënderojmë që zgjodhët AutoShkolla për trajnimin tuaj të drejtimit!</p>
                    
                    <div class="info-box">
                        <p><strong>Numri juaj i klientit:</strong> ${uniqueClientNumber}</p>
                        <p><strong>Email:</strong> ${email}</p>
                    </div>

                    <p>Ne do t'ju mbështesim gjatë gjithë procesit të trajnimit. Nëse keni ndonjë pyetje, mos hezitoni të na kontaktoni.</p>
                    
                    <p>Me respekt,<br>Ekipi i AutoShkolla</p>
                </div>
                <div class="footer">
                    <p>Ky është një email automatik. Ju lutemi mos u përgjigjni këtij email-i.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: 'Mirë se vini në AutoShkolla!',
        html
    });
};

/**
 * Send appointment reminder email
 * @param {Object} appointment - Appointment object
 * @param {Object} candidate - Candidate object
 * @returns {Promise<Object>}
 */
const sendAppointmentReminder = async (appointment, candidate) => {
    const { firstName, lastName, email } = candidate;
    const appointmentDate = new Date(appointment.date).toLocaleString('sq-AL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .info-box { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #10b981; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kujtesë për Takim</h1>
                </div>
                <div class="content">
                    <p>Përshëndetje <strong>${firstName} ${lastName}</strong>,</p>
                    <p>Kjo është një kujtesë për takimin tuaj të ardhshëm:</p>
                    
                    <div class="info-box">
                        <p><strong>Data dhe ora:</strong> ${appointmentDate}</p>
                        ${appointment.instructorId ? '<p><strong>Instruktor:</strong> ' + appointment.instructorId.firstName + ' ' + appointment.instructorId.lastName + '</p>' : ''}
                        ${appointment.carId ? '<p><strong>Makinë:</strong> ' + appointment.carId + '</p>' : ''}
                    </div>

                    <p>Ju lutemi të jeni në kohë për takimin tuaj.</p>
                    
                    <p>Me respekt,<br>Ekipi i AutoShkolla</p>
                </div>
                <div class="footer">
                    <p>Ky është një email automatik. Ju lutemi mos u përgjigjni këtij email-i.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: 'Kujtesë për Takim - AutoShkolla',
        html
    });
};

/**
 * Send email to instructor when a candidate is assigned to them
 * @param {Object} instructor - Instructor object with populated user
 * @param {Object} candidate - Candidate object
 * @returns {Promise<Object>}
 */
const sendCandidateAssignedEmail = async (instructor, candidate) => {
    const instructorUser = instructor.user;
    if (!instructorUser || !instructorUser.email) {
        throw new Error('Instructor user email not found');
    }

    const { firstName: instructorFirstName, lastName: instructorLastName, email: instructorEmail } = instructorUser;
    const { firstName: candidateFirstName, lastName: candidateLastName, email: candidateEmail, phone: candidatePhone, uniqueClientNumber } = candidate;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .info-box { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #10b981; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Kandidat i ri u caktua</h1>
                </div>
                <div class="content">
                    <p>Përshëndetje <strong>${instructorFirstName} ${instructorLastName}</strong>,</p>
                    <p>Një kandidat i ri u caktua për ju në sistemin e AutoShkolla:</p>
                    
                    <div class="info-box">
                        <p><strong>Emri:</strong> ${candidateFirstName} ${candidateLastName}</p>
                        <p><strong>Numri i klientit:</strong> ${uniqueClientNumber}</p>
                        <p><strong>Email:</strong> ${candidateEmail}</p>
                        <p><strong>Telefon:</strong> ${candidatePhone}</p>
                    </div>

                    <p>Ju lutemi të kontaktoni kandidatin për të planifikuar mësimet e para.</p>
                    
                    <p>Me respekt,<br>Ekipi i AutoShkolla</p>
                </div>
                <div class="footer">
                    <p>Ky është një email automatik. Ju lutemi mos u përgjigjni këtij email-i.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: instructorEmail,
        subject: 'Kandidat i ri u caktua - AutoShkolla',
        html
    });
};

/**
 * Send welcome email to a new instructor
 * @param {Object} instructor - Instructor object with populated user
 * @returns {Promise<Object>}
 */
const sendInstructorWelcomeEmail = async (instructor) => {
    const instructorUser = instructor.user;
    if (!instructorUser || !instructorUser.email) {
        throw new Error('Instructor user email not found');
    }

    const { firstName, lastName, email } = instructorUser;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .info-box { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #10b981; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Mirë se vini në AutoShkolla!</h1>
                </div>
                <div class="content">
                    <p>Përshëndetje <strong>${firstName} ${lastName}</strong>,</p>
                    <p>Ju falënderojmë që u bëtë pjesë e ekipit të AutoShkolla si instruktor!</p>
                    
                    <div class="info-box">
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Roli:</strong> Instruktor</p>
                    </div>

                    <p>Ju mund të hyni në sistemin tuaj dhe të filloni të menaxhoni kandidatët tuaj. Nëse keni ndonjë pyetje, mos hezitoni të na kontaktoni.</p>
                    
                    <p>Me respekt,<br>Ekipi i AutoShkolla</p>
                </div>
                <div class="footer">
                    <p>Ky është një email automatik. Ju lutemi mos u përgjigjni këtij email-i.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: 'Mirë se vini në AutoShkolla - Instruktor',
        html
    });
};

/**
 * Send payment confirmation email
 * @param {Object} payment - Payment object
 * @param {Object} candidate - Candidate object
 * @returns {Promise<Object>}
 */
const sendPaymentConfirmation = async (payment, candidate) => {
    const { firstName, lastName, email } = candidate;
    const paymentDate = new Date(payment.date).toLocaleDateString('sq-AL');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .info-box { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #059669; }
                .amount { font-size: 24px; font-weight: bold; color: #059669; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Konfirmim Pagese</h1>
                </div>
                <div class="content">
                    <p>Përshëndetje <strong>${firstName} ${lastName}</strong>,</p>
                    <p>Pagesa juaj është konfirmuar me sukses:</p>
                    
                    <div class="info-box">
                        <p><strong>Shuma:</strong> <span class="amount">${payment.amount} ALL</span></p>
                        <p><strong>Metoda:</strong> ${payment.method === 'bank' ? 'Bankë' : 'Cash'}</p>
                        <p><strong>Data:</strong> ${paymentDate}</p>
                        ${payment.notes ? '<p><strong>Shënime:</strong> ' + payment.notes + '</p>' : ''}
                    </div>

                    <p>Faleminderit për pagesën tuaj!</p>
                    
                    <p>Me respekt,<br>Ekipi i AutoShkolla</p>
                </div>
                <div class="footer">
                    <p>Ky është një email automatik. Ju lutemi mos u përgjigjni këtij email-i.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: email,
        subject: 'Konfirmim Pagese - AutoShkolla',
        html
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendCandidateAssignedEmail,
    sendInstructorWelcomeEmail,
    sendAppointmentReminder,
    sendPaymentConfirmation
};

