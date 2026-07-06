import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";

const Videogrid = () => {
  const [videos, setvideo] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        if (res.data && res.data.length > 0) {
          setvideo(res.data);
          return;
        }
      } catch (error) {
        console.log("API failed, using fallback data", error);
      } finally {
        setloading(false);
      }
      
      // Fallback if backend is not available (e.g. on Vercel without a deployed backend)
      setvideo([
        {
          _id: "static-0",
          videotitle: "Amazing Nature Documentary",
          filename: "nature-doc.mp4",
          filetype: "video/mp4",
          filepath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          filesize: "500MB",
          videochanel: "Nature Channel",
          Like: 1250,
          views: 45000,
          uploader: "nature_lover",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "static-1",
          videotitle: "Cooking Tutorial: Perfect Pasta",
          filename: "pasta-tutorial.mp4",
          filetype: "video/mp4",
          filepath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          filesize: "300MB",
          videochanel: "Chef's Kitchen",
          Like: 890,
          views: 23000,
          uploader: "chef_master",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          _id: "static-2",
          videotitle: "Tech Review: Latest Smartphone",
          filename: "tech-review.mp4",
          filetype: "video/mp4",
          filepath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          filesize: "400MB",
          videochanel: "Tech Guru",
          Like: 3200,
          views: 120000,
          uploader: "tech_guru",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          _id: "static-3",
          videotitle: "Travel Vlog: Exploring Japan",
          filename: "japan-vlog.mp4",
          filetype: "video/mp4",
          filepath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          filesize: "800MB",
          videochanel: "Wanderlust",
          Like: 5400,
          views: 210000,
          uploader: "wanderlust",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        }
      ]);
    };
    fetchvideo();
  }, []);

  // const videos = [
  //   {
  //     _id: "1",
  //     videotitle: "Amazing Nature Documentary",
  //     filename: "nature-doc.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/nature-doc.mp4",
  //     filesize: "500MB",
  //     videochanel: "Nature Channel",
  //     Like: 1250,
  //     views: 45000,
  //     uploader: "nature_lover",
  //     createdAt: new Date().toISOString(),
  //   },
  //   {
  //     _id: "2",
  //     videotitle: "Cooking Tutorial: Perfect Pasta",
  //     filename: "pasta-tutorial.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/pasta-tutorial.mp4",
  //     filesize: "300MB",
  //     videochanel: "Chef's Kitchen",
  //     Like: 890,
  //     views: 23000,
  //     uploader: "chef_master",
  //     createdAt: new Date(Date.now() - 86400000).toISOString(),
  //   },
  // ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 animate-pulse">
            <div className="aspect-video rounded-xl bg-gray-200 dark:bg-white/10" />
            <div className="flex gap-3 px-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2 mt-1">
                <div className="h-4 bg-gray-200 dark:bg-white/10 rounded-md w-full" />
                <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-md w-2/3" />
              </div>
            </div>
          </div>
        ))
      ) : (
        videos.map((video: any) => <Videocard key={video._id} video={video} />)
      )}
    </div>
  );
};

export default Videogrid;
