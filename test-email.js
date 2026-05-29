const nodemailer = require('nodemailer');
require('dotenv').config({ path: 'd:/kantik/finnext/.env' });

async function run() {
    console.log("Checking email:", process.env.NODEMAILER_EMAIL);
    if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
        console.error("Missing NODEMAILER_EMAIL or NODEMAILER_PASSWORD in .env");
        process.exit(1);
    }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASSWORD,
        }
    });

    try {
        await transporter.verify();
        console.log("Server is ready to take our messages");
        
        await transporter.sendMail({
            from: `"Signalist" <signalist@jsmastery.pro>`,
            to: process.env.NODEMAILER_EMAIL, // Send to self
            subject: "Test Alert",
            text: "This is a test from FinNext"
        });
        console.log("Email sent successfully!");
    } catch (e) {
        console.error("Failed to send email:", e);
    }
}
run();
