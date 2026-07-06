import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_change_me_in_production';

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// Apply auth middleware to all download routes
router.use(authenticateToken);

// Helper to check and reset daily quota based on timezone/date
const getUpdatedQuota = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscriptionPlan: true }
  });

  if (!user) throw new Error('User not found');

  const now = new Date();
  const lastDownload = user.lastDownloadDate ? new Date(user.lastDownloadDate) : new Date(0);

  // If the last download was on a different calendar day, reset quota
  if (now.toDateString() !== lastDownload.toDateString()) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        downloadsToday: 0,
        lastDownloadDate: now
      },
      include: { subscriptionPlan: true }
    });
  }
  return user;
};

// GET /api/downloads/quota
router.get('/quota', async (req, res) => {
  try {
    const user = await getUpdatedQuota(req.userId);
    
    // Calculate reset time (midnight of next day)
    const nextReset = new Date();
    nextReset.setHours(24, 0, 0, 0);

    res.json({
      currentPlan: user.subscriptionPlan.name,
      downloadsUsedToday: user.downloadsToday,
      dailyLimit: user.subscriptionPlan.dailyDownloadLimit,
      isUnlimited: user.subscriptionPlan.isUnlimited,
      remainingDownloads: user.subscriptionPlan.isUnlimited 
        ? 'Unlimited' 
        : Math.max(0, user.subscriptionPlan.dailyDownloadLimit - user.downloadsToday),
      nextQuotaReset: nextReset.toISOString()
    });
  } catch (error) {
    console.error('Error fetching quota:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/downloads/history
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const history = await prisma.downloadHistory.findMany({
      where: { userId: req.userId },
      orderBy: { downloadedAt: 'desc' },
      skip,
      take: limit,
      include: { video: true }
    });

    const total = await prisma.downloadHistory.count({
      where: { userId: req.userId }
    });

    res.json({
      data: history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: Ensure a video exists in our DB before creating history
const getOrCreateVideo = async (videoUrl, title, thumbnailUrl) => {
  let video = await prisma.video.findFirst({ where: { sourceUrl: videoUrl } });
  
  if (!video) {
    video = await prisma.video.create({
      data: {
        sourceUrl: videoUrl,
        title: title || 'Unknown Video',
        thumbnail: thumbnailUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60'
      }
    });
  } else if (thumbnailUrl && video.thumbnail !== thumbnailUrl) {
    // Always sync the database with the latest accurate dynamic thumbnail and title
    video = await prisma.video.update({
      where: { id: video.id },
      data: {
        title: title || video.title,
        thumbnail: thumbnailUrl
      }
    });
  }
  return video;
};

// In-memory lock to prevent concurrent bypass attacks
const downloadLocks = new Set();

// POST /api/downloads/request
router.post('/request', async (req, res) => {
  const { videoUrl, videoTitle, thumbnailUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  // Prevent concurrent requests for the same user
  if (downloadLocks.has(req.userId)) {
    return res.status(429).json({ error: 'A download request is already in progress. Please wait.' });
  }
  
  downloadLocks.add(req.userId);

  try {
    // 1. Quota Validation
    const user = await getUpdatedQuota(req.userId);
    const plan = user.subscriptionPlan;

    if (!plan.isUnlimited && user.downloadsToday >= plan.dailyDownloadLimit) {
      return res.status(403).json({ 
        error: 'Daily download quota exceeded.',
        limit: plan.dailyDownloadLimit 
      });
    }

    // 2. Fetch or Create Video Metadata
    const video = await getOrCreateVideo(videoUrl, videoTitle, thumbnailUrl);

    // 3. Process Download (Increment quota, log history in a transaction)
    await prisma.$transaction(async (tx) => {
      // Increment usage
      await tx.user.update({
        where: { id: req.userId },
        data: {
          downloadsToday: { increment: 1 },
          lastDownloadDate: new Date()
        }
      });

      // Log history
      await tx.downloadHistory.create({
        data: {
          userId: req.userId,
          videoId: video.id,
          videoUrl: video.sourceUrl,
          title: video.title,
          thumbnail: video.thumbnail,
          planAtTime: plan.name,
          status: 'COMPLETED'
        }
      });
    });

    // 4. Serve Secure File Stream / Signed URL abstraction
    // For this implementation, we return the direct URL but in a real enterprise app,
    // this would be an S3 Signed URL generated via AWS SDK.
    const signedUrl = videoUrl; // Abstracted

    res.json({
      message: 'Download authorized successfully',
      downloadUrl: signedUrl
    });

  } catch (error) {
    console.error('Download request error:', error);
    res.status(500).json({ error: 'Internal server error while processing download' });
  } finally {
    // Release lock
    downloadLocks.delete(req.userId);
  }
});

export default router;
