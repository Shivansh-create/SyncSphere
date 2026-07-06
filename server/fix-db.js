import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const officialVideos = [
  { filename: 'Video 1.mp4', title: 'Official Video 1', thumbnail: 'https://images.unsplash.com/photo-1535016120720-40c746765275?w=600&auto=format&fit=crop&q=60' },
  { filename: 'Video 2.mp4', title: 'Official Video 2', thumbnail: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=60' },
  { filename: 'Video 3.mp4', title: 'Official Video 3', thumbnail: 'https://images.unsplash.com/photo-1578022761797-b8636ac1773c?w=600&auto=format&fit=crop&q=60' },
  { filename: 'Video 4.mp4', title: 'Official Video 4', thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=60' },
  { filename: 'Video 5.mp4', title: 'Official Video 5', thumbnail: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=600&auto=format&fit=crop&q=60' },
];

async function main() {
  console.log('Starting DB fix...');
  
  // Clean up all history to give them a fresh dashboard for their presentation
  await prisma.downloadHistory.deleteMany({});
  console.log('Cleared corrupted download history snapshots.');
  
  // Reset all quotas to 0 so they can test fresh
  await prisma.user.updateMany({
    data: {
      downloadsToday: 0
    }
  });
  console.log('Reset user quotas.');

  // Update existing Video tables if they exist with Unknown Video
  for (const v of officialVideos) {
    const matchingVideos = await prisma.video.findMany({
      where: {
        sourceUrl: {
          contains: v.filename
        }
      }
    });

    for (const match of matchingVideos) {
      await prisma.video.update({
        where: { id: match.id },
        data: {
          title: v.title,
          thumbnail: v.thumbnail
        }
      });
    }
  }
  
  console.log('DB fix complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
