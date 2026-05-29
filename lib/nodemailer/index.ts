import nodemailer from 'nodemailer';
import {WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE, STOCK_ALERT_LOWER_EMAIL_TEMPLATE, STOCK_ALERT_UPPER_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Signalist" <signalist@jsmastery.pro>`,
        to: email,
        subject: `Welcome to Signalist - your stock market toolkit is ready!`,
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Signalist News" <signalist@jsmastery.pro>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from Signalist`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendStockAlertEmail = async ({
    email,
    symbol,
    targetPrice,
    currentPrice,
    condition
}: {
    email: string;
    symbol: string;
    targetPrice: number;
    currentPrice: number;
    condition: 'ABOVE' | 'BELOW';
}) => {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'long', timeStyle: 'short' }) + ' EST';
    
    // Choose template based on condition
    let htmlTemplate = condition === 'ABOVE' ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;
    
    // Replace variables
    htmlTemplate = htmlTemplate
        .replace(/{{symbol}}/g, symbol)
        .replace(/{{company}}/g, symbol) // Can be updated if company name is available
        .replace(/{{currentPrice}}/g, '$' + currentPrice.toFixed(2))
        .replace(/{{targetPrice}}/g, '$' + targetPrice.toFixed(2))
        .replace(/{{timestamp}}/g, timestamp);

    const mailOptions = {
        from: `"FinNext Alerts" <signalist@jsmastery.pro>`,
        to: email,
        subject: `🔔 Alert Triggered: ${symbol} is ${condition.toLowerCase()} $${targetPrice.toFixed(2)}`,
        text: `Your price alert for ${symbol} has been triggered. Current price: $${currentPrice.toFixed(2)}`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};
