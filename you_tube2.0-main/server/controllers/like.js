import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory mock database for likes
let likesDB = [];
let nextLikeId = 1;

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

export const handlelike = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  
  try {
    const existingIndex = likesDB.findIndex(l => l.viewer === userId && l.videoid === videoId);
    
    if (existingIndex !== -1) {
      // Unlike
      likesDB.splice(existingIndex, 1);
      return res.status(200).json({ liked: false });
    } else {
      // Like
      likesDB.push({
        _id: `like-${nextLikeId++}`,
        viewer: userId,
        videoid: videoId,
        likedon: new Date()
      });
      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error("Like handle error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const userLikes = likesDB.filter(l => l.viewer === userId);
    
    const populatedLikes = userLikes.map(l => {
      const videoData = getVideoById(l.videoid);
      return {
        ...l,
        videoid: videoData || { _id: l.videoid, videotitle: "Deleted Video" } 
      };
    }).filter(l => l.videoid);

    return res.status(200).json(populatedLikes);
  } catch (error) {
    console.error("Get likes error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
