import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { ThumbsUp, ThumbsDown, Flag, Globe, MapPin, AlertTriangle } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  location?: string;
  isLocationPublic?: boolean;
  likes?: string[];
  dislikes?: string[];
  reports?: string[];
  isFlagged?: boolean;
}

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [location, setLocation] = useState("");
  const [isLocationPublic, setIsLocationPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.channelname || user.name || "Anonymous",
        location: location.trim(),
        isLocationPublic
      });
      if (res.data.comment) {
        loadComments(); // Reload to get fresh DB object with empty arrays
      }
      setNewComment("");
      setLocation("");
      setIsLocationPublic(false);
    } catch (error: any) {
      if (error.response?.status === 400) {
        setErrorMsg(error.response.data.error || "Comment blocked by moderation system.");
      } else {
        console.error("Error adding comment:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev: Comment[]) =>
          prev.map((c: Comment) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.status === 200) {
        setComments((prev: Comment[]) => prev.filter((c: Comment) => c._id !== id));
      }
    } catch (error) {
      console.log("Delete failed:", error);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/${id}/like`, { userId: user._id });
      setComments(comments.map((c: Comment) => c._id === id ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes } : c));
    } catch(e) { console.log(e); }
  };

  const handleDislike = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/${id}/dislike`, { userId: user._id });
      setComments(comments.map((c: Comment) => c._id === id ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes } : c));
    } catch(e) { console.log(e); }
  };

  const handleReport = async (id: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/${id}/report`, { userId: user._id });
      setComments(comments.map((c: Comment) => c._id === id ? { ...c, reports: res.data.reports, isFlagged: res.data.isFlagged } : c));
    } catch(e) { console.log(e); }
  };

  const handleTranslate = async (id: string, text: string) => {
    setTranslatingId(id);
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      const translatedText = data[0].map((item: any) => item[0]).join('');
      
      setComments(comments.map((c: Comment) => 
        c._id === id ? { ...c, commentbody: `[Translated]: ${translatedText}` } : c
      ));
    } catch (error) {
      console.error("Translation failed", error);
      alert("Translation failed. Please try again.");
    } finally {
      setTranslatingId(null);
    }
  };

  return (
    <div id="comments-section" className="space-y-6 pt-4">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 border-gray-200 dark:border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gray-900 dark:focus-visible:border-white bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md flex items-center gap-2">
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border border-gray-200 dark:border-white/10 rounded-md px-2 py-1">
                  <MapPin size={16} className="text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Location (Optional)" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-32 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                {location.trim().length > 0 && (
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isLocationPublic}
                      onChange={(e) => setIsLocationPublic(e.target.checked)}
                    />
                    Make Public
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => { setNewComment(""); setLocation(""); setErrorMsg(""); }}
                  disabled={!newComment.trim()}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>{comment.usercommented?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {comment.usercommented}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                  {comment.isLocationPublic && comment.location && (
                    <span className="text-xs text-blue-500 flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      <MapPin size={10} /> {comment.location}
                    </span>
                  )}
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="bg-transparent text-gray-900 dark:text-white border-gray-300 dark:border-white/20 focus-visible:ring-indigo-500"
                      />
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={handleUpdateComment}
                        disabled={!editText.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={`text-sm text-gray-800 dark:text-gray-200 ${comment.isFlagged ? 'blur-sm text-red-500 font-semibold' : ''}`}>
                      {comment.isFlagged ? 'This comment has been flagged for review.' : comment.commentbody}
                    </p>
                    
                    {/* Engagement & Action Row */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <button 
                        onClick={() => handleLike(comment._id)} 
                        className={`flex items-center gap-1 hover:text-blue-500 ${user && comment.likes?.includes(user._id) ? 'text-blue-500' : ''}`}
                      >
                        <ThumbsUp size={14} /> {comment.likes?.length || 0}
                      </button>
                      <button 
                        onClick={() => handleDislike(comment._id)} 
                        className={`flex items-center gap-1 hover:text-red-500 ${user && comment.dislikes?.includes(user._id) ? 'text-red-500' : ''}`}
                      >
                        <ThumbsDown size={14} />
                      </button>
                      <button 
                        onClick={() => handleTranslate(comment._id, comment.commentbody)}
                        disabled={translatingId === comment._id || comment.isFlagged}
                        className="flex items-center gap-1 hover:text-green-500"
                      >
                        <Globe size={14} /> {translatingId === comment._id ? 'Translating...' : 'Translate'}
                      </button>
                      
                      {!comment.isFlagged && (
                        <button 
                          onClick={() => handleReport(comment._id)}
                          className={`flex items-center gap-1 hover:text-orange-500 ml-2 ${user && comment.reports?.includes(user._id) ? 'text-orange-500' : ''}`}
                          title="Report Spam/Abuse"
                        >
                          <Flag size={14} />
                        </button>
                      )}

                      {comment.userid === user?._id && (
                        <div className="flex gap-2 ml-auto">
                          <button onClick={() => handleEdit(comment)} className="hover:text-blue-400">Edit</button>
                          <button onClick={() => handleDelete(comment._id)} className="hover:text-red-400">Delete</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
