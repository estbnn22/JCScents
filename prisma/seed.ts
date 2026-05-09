import "dotenv/config";

import { resolveMenCatalogDetails } from "../data/men-catalog-details";
import menCatalog from "../data/men-catalog.json";
import { prisma } from "../lib/prisma";

type SeedFragrance = {
  sourcePage: number;
  fullName: string;
  slug: string;
  rawText: string;
  status: "ACTIVE" | "COMING_SOON";
  sizes: Array<{
    sizeMl: number;
    price: string;
    sortOrder: number;
  }>;
};

async function main() {
  const fragrances = menCatalog as SeedFragrance[];

  await prisma.fragrance.deleteMany({
    where: {
      catalog: "MEN",
    },
  });

  for (const fragrance of fragrances) {
    const details = resolveMenCatalogDetails(fragrance);

    await prisma.fragrance.create({
      data: {
        accordNames: details.accords?.map((accord) => accord.name) ?? [],
        accordStrengths: details.accords?.map((accord) => accord.strength) ?? [],
        baseNotes: details.notes?.base ?? [],
        catalog: "MEN",
        detailsCustomized: true,
        fullName: fragrance.fullName,
        middleNotes: details.notes?.middle ?? [],
        momentTags: details.moments ?? [],
        slug: fragrance.slug,
        rawText: fragrance.rawText,
        seasonTags: details.seasons ?? [],
        sourcePage: fragrance.sourcePage,
        status: fragrance.status,
        summary: details.summary ?? null,
        topNotes: details.notes?.top ?? [],
        sizes: {
          create: fragrance.sizes.map((size) => ({
            sizeMl: size.sizeMl,
            price: size.price,
            sortOrder: size.sortOrder,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${fragrances.length} men's fragrances.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
