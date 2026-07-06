import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadvideo = async (req, res) => {
  if (req.file === undefined) {
    return res
      .status(404)
      .json({ message: "plz upload a mp4 video file only" });
  } else {
    try {
      const file = new video({
        videotitle: req.body.videotitle,
        filename: req.file.originalname,
        filepath: req.file.path,
        filetype: req.file.mimetype,
        filesize: req.file.size,
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
export const getallvideo = async (req, res) => {
  try {
    const videoDir = path.resolve(__dirname, "../../../server/public/videos");
    if (!fs.existsSync(videoDir)) return res.status(200).send([]);
    
    const files = fs.readdirSync(videoDir);
    const videoList = files.filter(f => f.endsWith('.mp4')).map((file, i) => {
      const stats = fs.statSync(path.join(videoDir, file));
      return {
        _id: `static-${i}`,
        videotitle: file.replace('.mp4', ''),
        filename: file,
        filepath: path.join(videoDir, file),
        filetype: 'video/mp4',
        filesize: stats.size,
        videochanel: 'SyncSphere Vault',
        uploader: 'system',
        views: Math.floor(Math.random() * 1000),
        createdAt: stats.birthtime.toISOString()
      };
    });
    
    return res.status(200).send(videoList);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const streamvideo = async (req, res) => {
  try {
    const videoDir = path.resolve(__dirname, "../../../server/public/videos");
    const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
    
    const id = req.params.id;
    const index = parseInt(id.split('-')[1]);
    
    if (isNaN(index) || !files[index]) return res.status(404).send("Video not found");

    const videoPath = path.join(videoDir, files[index]);
    if (!fs.existsSync(videoPath)) return res.status(404).send("File missing");

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    res.status(500).send("Error streaming video");
  }
};
