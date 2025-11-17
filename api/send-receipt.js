// Vercel serverless function: api/send-receipt.js
// Generates a PDF receipt (PDFKit) and sends it with SendGrid as an attachment.
// Required env vars: SENDGRID_API_KEY, SENDER_EMAIL
const PDFDocument = require('pdfkit');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function generateReceiptPdfBuffer({ fullName, amount, transactionId, date }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20).text('FTUK', { align: 'left' });
      doc.moveDown();
      doc.fontSize(14).text('Payment Receipt', { underline: true });
      doc.moveDown();

      // Recipient & meta
      doc.fontSize(12).text(`Name: ${fullName}`);
      doc.text(`Amount: $${amount}`);
      doc.text(`Transaction ID: ${transactionId}`);
      doc.text(`Date: ${date}`);
      doc.moveDown();

      // Footer / thanks
      doc.text('Thank you for your payment.', { align: 'left' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { to, subject, html, attachPdf } = req.body || {};
    if (!to || !subject || !html) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const transactionId = 'FTUK-' + Math.random().toString(36).slice(2, 9).toUpperCase();
    const date = new Date().toLocaleString();

    const msg = {
      to,
      from: process.env.SENDER_EMAIL,
      subject,
      html,
    };

    if (attachPdf) {
      // generate PDF
      const pdfBuffer = await generateReceiptPdfBuffer({ fullName: req.body.fullName || 'Customer', amount: req.body.amount || '0', transactionId, date });
      const attachment = pdfBuffer.toString('base64');
      msg.attachments = [
        {
          content: attachment,
          filename: 'ftuk-receipt.pdf',
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ];
    }

    await sgMail.send(msg);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-receipt error', err && err.toString());
    res.status(500).json({ error: 'Send failed' });
  }
};
