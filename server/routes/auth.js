import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/index.js';
import axios from 'axios';
import nodemailer from 'nodemailer';

const router = express.Router();

const parseUserAgent = (ua) => {
  if (!ua) return 'Unknown Device';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') || ua.includes('CriOS')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('like Mac')) os = 'iOS';

  return `${browser} on ${os}`;
};

const sendOtpEmail = async (email, otp) => {
  let transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Professional Mode: Real SMTP Server
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: Ethereal (Dev Mode)
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
  }

  const info = await transporter.sendMail({
    from: `"SyncSphere Security" <${process.env.SMTP_USER || 'security@syncsphere.app'}>`,
    to: email,
    subject: "SyncSphere Login OTP",
    html: `
      <h2>New Device/Location Detected</h2>
      <p>We noticed a login attempt from a new device or location.</p>
      <p>Your authorization code is: <strong><span style="font-size: 24px;">${otp}</span></strong></p>
      <p>This code expires in 10 minutes.</p>
    `
  });

  if (!process.env.SMTP_USER) {
    console.log('----------------------------------------------------');
    console.log(`[OTP GENERATED] Click here to view OTP Email: ${nodemailer.getTestMessageUrl(info)}`);
    console.log('----------------------------------------------------');
    return nodemailer.getTestMessageUrl(info);
  }

  console.log(`[OTP SENT] Professional Email delivered to ${email}`);
  return null;
};

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_change_me_in_production';

// Ensure FREE plan exists for new users
const getOrCreateFreePlan = async () => {
  let freePlan = await prisma.subscriptionPlan.findUnique({ where: { name: 'FREE' } });
  if (!freePlan) {
    freePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'FREE',
        dailyDownloadLimit: 1,
        isUnlimited: false,
        features: 'Daily Limit: 1 Video'
      }
    });
  }
  return freePlan;
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const freePlan = await getOrCreateFreePlan();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        subscriptionPlanId: freePlan.id
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: freePlan.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Standard Login (Task 1-4)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { subscriptionPlan: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.subscriptionPlan.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Secure Register Demo (Task 5)
router.post('/register-secure', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const freePlan = await getOrCreateFreePlan();
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60000);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        subscriptionPlanId: freePlan.id,
        otpCode,
        otpExpiresAt
      }
    });

    // Geolocation & Device Fingerprinting
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp && (clientIp === '::1' || clientIp.includes('127.0.0.1'))) {
      clientIp = '127.0.0.1';
    }

    let city = 'Local City';
    let state = 'Local State';
    
    if (clientIp !== '127.0.0.1') {
      try {
        const geo = await axios.get(`http://ip-api.com/json/${clientIp}`);
        if (geo.data && geo.data.status === 'success') {
          city = geo.data.city;
          state = geo.data.regionName;
        }
      } catch (e) {
        console.error('Geo IP failed:', e.message);
      }
    }

    const osBrowser = parseUserAgent(req.headers['user-agent']);
    const currentFingerprint = `${clientIp}-${city}-${state}-${osBrowser}`;

    // Send Email async
    let previewUrl = null;
    try {
      previewUrl = await sendOtpEmail(user.email, otpCode);
    } catch (e) { console.error(e); }

    return res.json({ 
      requireOtp: true, 
      email: user.email, 
      fingerprint: currentFingerprint,
      previewUrl,
      message: 'Account created. Please verify your email with the OTP.'
    });
  } catch (error) {
    console.error('Secure Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Secure Login Demo (Task 5)
router.post('/login-secure', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { subscriptionPlan: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Geolocation & Device Fingerprinting
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // Strip IPv6 localhost prefix
    if (clientIp && (clientIp === '::1' || clientIp.includes('127.0.0.1'))) {
      clientIp = '127.0.0.1';
    }

    let city = 'Local City';
    let state = 'Local State';
    
    if (clientIp !== '127.0.0.1') {
      try {
        const geo = await axios.get(`http://ip-api.com/json/${clientIp}`);
        if (geo.data && geo.data.status === 'success') {
          city = geo.data.city;
          state = geo.data.regionName;
        }
      } catch (e) {
        console.error('Geo IP failed:', e.message);
      }
    }

    const osBrowser = parseUserAgent(req.headers['user-agent']);
    const currentFingerprint = `${clientIp}-${city}-${state}-${osBrowser}`;
    
    let trustedDevices = [];
    if (user.trustedDevices) {
      try {
        trustedDevices = JSON.parse(user.trustedDevices);
      } catch (e) { trustedDevices = []; }
    }

    const isTrusted = trustedDevices.some(d => d.fingerprint === currentFingerprint);

    if (!isTrusted) {
      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60000);

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt }
      });

      // Send Email async
      let previewUrl = null;
      try {
        previewUrl = await sendOtpEmail(user.email, otpCode);
      } catch (e) { console.error(e); }

      return res.json({ 
        requireOtp: true, 
        email: user.email, 
        fingerprint: currentFingerprint,
        previewUrl,
        message: 'New device detected. Please verify OTP.'
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.subscriptionPlan.name,
        theme: user.theme || 'auto'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, fingerprint } = req.body;
    
    if (!email || !otp || !fingerprint) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { subscriptionPlan: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.otpCode !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Add device to trusted list
    let trustedDevices = [];
    if (user.trustedDevices) {
      try {
        trustedDevices = JSON.parse(user.trustedDevices);
      } catch (e) { trustedDevices = []; }
    }

    trustedDevices.push({ fingerprint, verifiedAt: new Date() });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        trustedDevices: JSON.stringify(trustedDevices),
        otpCode: null,
        otpExpiresAt: null
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.subscriptionPlan.name,
        theme: user.theme || 'auto'
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Theme Toggle Update
router.patch('/theme', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { theme } = req.body;
    if (!['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { theme }
    });

    res.json({ success: true, theme });
  } catch (error) {
    console.error('Theme update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate Token (Get Current User)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { subscriptionPlan: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.subscriptionPlan.name
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Upgrade to Premium (Internship Free Version)
router.post('/upgrade', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get or Create Premium Plan
    let premiumPlan = await prisma.subscriptionPlan.findUnique({ where: { name: 'PREMIUM_UNLIMITED' } });
    if (!premiumPlan) {
      premiumPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'PREMIUM_UNLIMITED',
          dailyDownloadLimit: 999999,
          isUnlimited: true,
          features: 'Unlimited Downloads'
        }
      });
    }

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { subscriptionPlanId: premiumPlan.id },
      include: { subscriptionPlan: true }
    });

    res.json({
      message: 'Successfully upgraded to Premium',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        plan: updatedUser.subscriptionPlan.name
      }
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Failed to upgrade account' });
  }
});

export default router;
