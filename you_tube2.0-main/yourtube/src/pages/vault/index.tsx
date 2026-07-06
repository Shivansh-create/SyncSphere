import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { DownloadCloud, Video, Trash2, Edit, Play } from 'lucide-react';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Vault() {
  const { user } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axiosInstance.get('/video/getallvideo');
        setVideos(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-7xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-3">
              <DownloadCloud className="text-blue-500" size={40} />
              Video Vault
            </h1>
            <p className="text-gray-500 mt-2">Manage your uploaded media and storage quota.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Storage Used</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{videos.length * 15}</span>
                <span className="text-gray-500 mb-1">MB</span>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-800"></div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Plan Limit</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-blue-500">100</span>
                <span className="text-gray-500 mb-1">MB</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Media</h2>
              <Button onClick={() => alert("Upload feature is coming soon!")} className="bg-blue-600 hover:bg-blue-700 text-white">Upload New Video</Button>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {videos.length === 0 && (
                <div className="p-10 text-center text-gray-500">No videos uploaded yet.</div>
              )}
              {videos.map((vid: any) => (
                <div key={vid._id} className="p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-48 aspect-video bg-black rounded-lg overflow-hidden shrink-0 relative group">
                    <video src={`http://localhost:3001/video/stream/${vid._id}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="text-white" size={32} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate mb-1">{vid.videotitle}</h3>
                    <p className="text-sm text-gray-500 mb-3">{new Date(vid.createdAt).toLocaleDateString()} • {vid.views} views</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">MP4</span>
                      <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Ready</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/watch/${vid._id}`}>
                      <Button variant="outline" size="sm" className="hidden md:flex">Watch</Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-500">
                      <Edit size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-500">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
