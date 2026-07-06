import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  { name: 'FREE', dailyDownloadLimit: 1, isUnlimited: false, price: 0, features: '1 Download/Day, Standard Access' },
  { name: 'BRONZE', dailyDownloadLimit: 5, isUnlimited: false, price: 0, features: '5 Downloads/Day, Ad-Free' },
  { name: 'SILVER', dailyDownloadLimit: 20, isUnlimited: false, price: 0, features: '20 Downloads/Day, Premium Support' },
  { name: 'GOLD', dailyDownloadLimit: 9999, isUnlimited: true, price: 0, features: 'Unlimited Downloads, All Features' },
];

async function main() {
  console.log('Seeding Subscription Plans...');
  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {
        dailyDownloadLimit: plan.dailyDownloadLimit,
        isUnlimited: plan.isUnlimited,
        price: plan.price,
        features: plan.features
      },
      create: plan,
    });
    console.log(`Upserted ${plan.name} plan`);
  }
  console.log('Seed complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
