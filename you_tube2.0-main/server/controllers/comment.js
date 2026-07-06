let commentsDB = [];
let nextId = 1;

export const postcomment = async (req, res) => {
  const commentdata = req.body;
  const { commentbody } = commentdata;

  // Moderation System
  if (commentbody) {
    const text = commentbody.toLowerCase();
    const abusiveWords = ['fuck', 'bitch', 'shit', 'asshole', 'whore', 'bastard'];
    const hasAbuse = abusiveWords.some(word => text.includes(word));
    
    const isSpam = /(http|https):\/\/[^\s]+/.test(text);
    const hasSpecialChars = /([!@#$%^&*()_+={}\[\]:;"'<>,.?/])\1{4,}/.test(text);
    
    if (hasAbuse || isSpam || hasSpecialChars) {
      return res.status(400).json({ error: "Comment blocked by moderation system due to abusive language, spam, or repeated special characters." });
    }
  }

  const newComment = {
    ...commentdata,
    _id: `comment-${nextId++}`,
    commentedon: new Date(),
    likes: [],
    dislikes: [],
    reports: [],
    isFlagged: false
  };
  
  commentsDB.push(newComment);
  return res.status(200).json({ comment: true });
};
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  const commentvideo = commentsDB.filter(c => c.videoid === videoid);
  return res.status(200).json(commentvideo);
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  commentsDB = commentsDB.filter(c => c._id !== _id);
  return res.status(200).send("comment deleted successfully");
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  const index = commentsDB.findIndex(c => c._id === _id);
  if (index !== -1) {
    commentsDB[index].commentbody = commentbody;
  }
  return res.status(200).send("comment updated successfully");
};

export const likeComment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  const index = commentsDB.findIndex(c => c._id === _id);
  if (index !== -1) {
    const com = commentsDB[index];
    if (!com.likes) com.likes = [];
    if (!com.dislikes) com.dislikes = [];
    
    com.dislikes = com.dislikes.filter(id => id !== userid);
    if (!com.likes.includes(userid)) {
      com.likes.push(userid);
    } else {
      com.likes = com.likes.filter(id => id !== userid);
    }
  }
  return res.status(200).json({ message: "Liked" });
};

export const dislikeComment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  const index = commentsDB.findIndex(c => c._id === _id);
  if (index !== -1) {
    const com = commentsDB[index];
    if (!com.likes) com.likes = [];
    if (!com.dislikes) com.dislikes = [];
    
    com.likes = com.likes.filter(id => id !== userid);
    if (!com.dislikes.includes(userid)) {
      com.dislikes.push(userid);
    } else {
      com.dislikes = com.dislikes.filter(id => id !== userid);
    }
  }
  return res.status(200).json({ message: "Disliked" });
};

export const reportComment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const index = commentsDB.findIndex(c => c._id === id);
    if (index === -1) return res.status(404).json({ error: "Comment not found" });
    
    const c = commentsDB[index];
    if (!c.reports) c.reports = [];
    
    if (!c.reports.includes(userId)) {
      c.reports.push(userId);
    }
    
    // Auto-flag after 3 reports
    if (c.reports.length >= 3) {
      c.isFlagged = true;
    }
    
    return res.status(200).json(c);
  } catch (error) {
    return res.status(500).json({ message: "Error reporting comment" });
  }
};
