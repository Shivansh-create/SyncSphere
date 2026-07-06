import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory mock database for history
let historyDB = [];
let nextHistoryId = 1;

// Helper to get a video by ID (matching the mock logic in video.js)
const getVideoById = (id) => {
  try {
    const videoDir = path.resolve(__dirname, "../../../server/public/videos");
    if (!fs.existsSync(videoDir)) return null;
    
    const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
    const index = parseInt(id.split('-')[1]);
    
    if (isNaN(index) || !files[index]) return null;

    const file = files[index];
    const stats = fs.statSync(path.join(videoDir, file));
    
    return {
      _id: id,
      videotitle: file.replace('.mp4', ''),
      filename: file,
      filepath: path.join(videoDir, file),
      filetype: 'video/mp4',
      filesize: stats.size,
      videochanel: 'SyncSphere Vault',
      uploader: 'system',
      views: 500, // mock view count
      createdAt: stats.birthtime.toISOString()
    };
  } catch (e) {
    return null;
  }
};

export const handlehistory = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  
  try {
    // Only add if it doesn't already exist for this user + video
    const exists = historyDB.find(h => h.viewer === userId && h.videoid === videoId);
    if (!exists) {
      historyDB.push({
        _id: `history-${nextHistoryId++}`,
        viewer: userId,
        videoid: videoId,
        likedon: new Date()
      });
    }
    
    return res.status(200).json({ history: true });
  } catch (error) {
    console.error("History handle error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const handleview = async (req, res) => {
  const { videoId } = req.params;
  try {
    // We mock view increments since we don't have a real DB
    return res.status(200).json({ view: true });
  } catch (error) {
    console.error("View handle error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallhistoryVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    // Find history records for this user
    const userHistory = historyDB.filter(h => h.viewer === userId);
    
    // "Populate" the video object
    const populatedHistory = userHistory.map(h => {
      const videoData = getVideoById(h.videoid);
      return {
        ...h,
        videoid: videoData || { _id: h.videoid, videotitle: "Deleted Video" } 
      };
    }).filter(h => h.videoid); // ensure video exists

    return res.status(200).json(populatedHistory);
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
