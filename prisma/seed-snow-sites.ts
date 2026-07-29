import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get distinct site names from existing imported data
  const existing = await prisma.snowSiteService.findMany({
    select: { siteName: true },
    distinct: ["siteName"],
    orderBy: { siteName: "asc" },
  });

  const siteNames = [...new Set(existing.map((s) => s.siteName))];
  console.log(`Found ${siteNames.length} distinct site names`);

  let created = 0;
  for (const name of siteNames) {
    await prisma.snowSite.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    created++;
  }

  console.log(`Upserted ${created} snow sites`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
