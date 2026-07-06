import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory mock database for watch later
let watchLaterDB = [];
let nextWatchLaterId = 1;

// Helper to get a video by ID
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
      views: 500,
      createdAt: stats.birthtime.toISOString()
    };
  } catch (e) {
    return null;
  }
};

export const handlewatchlater = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  
  try {
    const existingIndex = watchLaterDB.findIndex(w => w.viewer === userId && w.videoid === videoId);
    
    if (existingIndex !== -1) {
      // Remove from watch later
      watchLaterDB.splice(existingIndex, 1);
      return res.status(200).json({ watchlater: false });
    } else {
      // Add to watch later
      watchLaterDB.push({
        _id: `watchlater-${nextWatchLaterId++}`,
        viewer: userId,
        videoid: videoId,
        likedon: new Date()
      });
      return res.status(200).json({ watchlater: true });
    }
  } catch (error) {
    console.error("Watch later handle error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallwatchlater = async (req, res) => {
  const { userId } = req.params;
  try {
    const userWatchLater = watchLaterDB.filter(w => w.viewer === userId);
    
    const populatedWL = userWatchLater.map(w => {
      const videoData = getVideoById(w.videoid);
      return {
        ...w,
        videoid: videoData || { _id: w.videoid, videotitle: "Deleted Video" } 
      };
    }).filter(w => w.videoid);

    return res.status(200).json(populatedWL);
  } catch (error) {
    console.error("Get watch later error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
