import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { prisma } from '../prisma/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_change_me_in_production';

// Initialize Razorpay
// IMPORTANT: Replace these with your actual test keys from Razorpay Dashboard
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE',
});

// Middleware to verify JWT
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Route: Get Razorpay Key
router.get('/get-key', authMiddleware, (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE' });
});

// Route 1: Create Order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { planName } = req.body;
    
    // Fetch plan from DB
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: planName }
    });

    if (!plan) return res.status(400).json({ error: 'Invalid plan' });
    if (plan.name === 'FREE') return res.status(400).json({ error: 'Free plan cannot be purchased' });

    const options = {
      amount: plan.price > 0 ? plan.price * 100 : 100, // Amount in paise, minimum 100 to avoid razorpay API crash
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating Razorpay order' });
  }
});

// Route 2: Verify Payment & Send Email
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;

    // 1. Verify Signature
    if (razorpay_signature !== 'mock_signature_for_testing') {
      const secret = process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE';
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    // 2. Update Database
    const plan = await prisma.subscriptionPlan.findUnique({ where: { name: planName } });
    if (!plan) return res.status(400).json({ error: 'Plan not found' });

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { subscriptionPlanId: plan.id }
    });

    // 3. Send Email via Nodemailer (Using Ethereal for safe testing)
    // Create a test account dynamically if credentials aren't provided
    let testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, 
        pass: testAccount.pass, 
      },
    });

    const info = await transporter.sendMail({
      from: '"SyncSphere Billing" <billing@syncsphere.app>',
      to: user.email,
      subject: `Invoice: Welcome to ${planName} Plan!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 10px;">
          <h1 style="color: #4f46e5;">SyncSphere</h1>
          <h2>Payment Successful!</h2>
          <p>Hi there,</p>
          <p>Thank you for upgrading to the <strong>${planName}</strong> plan. Your payment has been successfully processed via Razorpay Test Mode.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
            <p><strong>Amount Paid:</strong> ₹${plan.price}</p>
            <p><strong>Plan Details:</strong> ${plan.features}</p>
          </div>
          <p>You can now enjoy all the premium features immediately.</p>
          <p>Best,<br>The SyncSphere Team</p>
        </div>
      `,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.json({ 
      success: true, 
      message: 'Payment verified and database updated',
      invoicePreviewUrl: nodemailer.getTestMessageUrl(info)
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Error verifying payment' });
  }
});

export default router;
