const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// attachments follows nodemailer's format, e.g.:
// [{ filename: 'ticket-qr.png', content: buffer, cid: 'qrcode' }]
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
            attachments,
        });
        return true;
    } catch (err) {
        // Don't let a failed email crash the booking flow — log it and let the
        // caller decide whether to surface a warning to the user.
        console.error('[email] failed to send:', err.message);
        return false;
    }
};

module.exports = sendEmail;