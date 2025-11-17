 FTUK Checkout - Vite React App

 Included serverless function (Vercel)

 -------------------------------------

 This project contains a Vercel serverless function at `/api/send-receipt` that uses SendGrid to send email receipts.


 Steps to deploy on Vercel:


 1. Create a SendGrid account and obtain an API key.
2. In your Vercel project settings, add the following environment variables:
    - SENDGRID_API_KEY = <your sendgrid api key>
    - SENDER_EMAIL = no-reply@yourdomain.com (the verified sender email in SendGrid)
3. Push this repo to GitHub.
4. Import the repo into Vercel and deploy. Vercel will expose the function at `https://<your-deploy>/api/send-receipt`.

 Local testing note:
 - Serverless functions won't run with `vite dev`. Use Vercel CLI (`vercel dev`) or deploy to Vercel to test the function.

 Fallback behavior:
 - If the function fails, the frontend falls back to opening the user's mail client via a mailto: link.


API: send-receipt now attaches a PDF receipt when the request includes `attachPdf: true`.
Serverless function uses PDFKit to generate a simple PDF and SendGrid to send it as an attachment.

Required environment variables (Vercel):
- SENDGRID_API_KEY
- SENDER_EMAIL (the verified sender email in SendGrid)

The frontend POSTs { to, subject, html, attachPdf: true, fullName, amount } to /api/send-receipt.
If SendGrid fails, the frontend still falls back to a mailto: link.
