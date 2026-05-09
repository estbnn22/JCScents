import catalogSeed from "@/data/men-catalog.json";
import {
  buildAccords,
  type FragranceAccord,
  type FragranceMoment,
  type FragranceSeason,
  resolveMenCatalogDetails,
} from "@/data/men-catalog-details";

const DEFAULT_MEN_CATALOG_PDF_PATH =
  "/Users/estebanmachuca/Library/Mobile Documents/com~apple~CloudDocs/Downloads/JCScents Men Catalogo.pdf";

type SeedFragrance = {
  sourcePage: number;
  fullName: string;
  slug: string;
  rawText?: string;
  status: "ACTIVE" | "COMING_SOON";
  sizes: Array<{
    sizeMl: number;
    price: string;
  }>;
};

export type CatalogItem = {
  bottleScale: number;
  bottleTranslateX: string;
  bottleTranslateY: string;
  detailsReady: boolean;
  id: string;
  fullName: string;
  imagePath: string | null;
  moments: FragranceMoment[];
  notes: {
    base: string[];
    middle: string[];
    top: string[];
  };
  accords: FragranceAccord[];
  seasons: FragranceSeason[];
  slug: string;
  sourcePage: number;
  rawText?: string;
  status: "ACTIVE" | "COMING_SOON";
  summary: string | null;
  sizes: Array<{
    sizeMl: number;
    price: number;
  }>;
};

type DetailOverrides = {
  accordNames?: string[];
  accordStrengths?: number[];
  baseNotes?: string[];
  enabled?: boolean;
  moments?: FragranceMoment[];
  middleNotes?: string[];
  seasons?: FragranceSeason[];
  summary?: string | null;
  topNotes?: string[];
};

export const menCatalogPdfPath =
  process.env.CATALOG_PDF_PATH ?? DEFAULT_MEN_CATALOG_PDF_PATH;

const staticCatalog: CatalogItem[] = (catalogSeed as SeedFragrance[]).map((item) => ({
  id: item.slug,
  fullName: item.fullName,
  imagePath: null,
  slug: item.slug,
  sourcePage: item.sourcePage,
  rawText: item.rawText,
  status: item.status,
  sizes: item.sizes.map((size) => ({
    sizeMl: size.sizeMl,
    price: Number(size.price),
  })),
  ...resolveCatalogDetails(item),
}));

export function getStaticMenCatalogItems(): CatalogItem[] {
  return staticCatalog;
}

export async function getMenCatalogItems(): Promise<CatalogItem[]> {
  const { prisma } = await import("@/lib/prisma");
  const fragrances = await prisma.fragrance.findMany({
    where: {
      catalog: "MEN",
    },
    include: {
      sizes: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      sourcePage: "asc",
    },
  });

  type FragranceRecord = (typeof fragrances)[number];
  type SizeRecord = FragranceRecord["sizes"][number];

  return fragrances.map((fragrance: FragranceRecord) => ({
    id: fragrance.id,
    fullName: fragrance.fullName,
    imagePath: fragrance.imagePath ?? null,
    slug: fragrance.slug,
    sourcePage: fragrance.sourcePage,
    rawText: fragrance.rawText ?? undefined,
    status: fragrance.status,
    sizes: fragrance.sizes.map((size: SizeRecord) => ({
      sizeMl: size.sizeMl,
      price: Number(size.price),
    })),
    ...resolveCatalogDetails({
      detailOverrides: {
        accordNames: fragrance.accordNames,
        accordStrengths: fragrance.accordStrengths,
        baseNotes: fragrance.baseNotes,
        enabled: fragrance.detailsCustomized,
        moments: fragrance.momentTags as FragranceMoment[],
        middleNotes: fragrance.middleNotes,
        seasons: fragrance.seasonTags as FragranceSeason[],
        summary: fragrance.summary,
        topNotes: fragrance.topNotes,
      },
      slug: fragrance.slug,
      fullName: fragrance.fullName,
      rawText: fragrance.rawText ?? undefined,
    }),
  }));
}

export async function loadMenCatalogItems() {
  let items = getStaticMenCatalogItems();
  let dataSource: "database" | "pdf" = "pdf";
  let loadError: string | null = null;

  try {
    const databaseItems = await getMenCatalogItems();
    if (databaseItems.length > 0) {
      items = databaseItems;
      dataSource = "database";
    }
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "No se pudo cargar el catálogo desde Prisma.";
  }

  return {
    items,
    dataSource,
    loadError,
  };
}

export async function getMenCatalogItemBySlug(slug: string) {
  const { items, dataSource, loadError } = await loadMenCatalogItems();
  const itemIndex = items.findIndex((entry) => entry.slug === slug);
  const item = itemIndex >= 0 ? items[itemIndex] : null;

  return {
    item,
    nextItem: itemIndex >= 0 ? items[itemIndex + 1] ?? null : null,
    previousItem: itemIndex > 0 ? items[itemIndex - 1] : null,
    dataSource,
    loadError,
  };
}

function resolveCatalogDetails(input: {
  detailOverrides?: DetailOverrides;
  slug: string;
  fullName?: string;
  rawText?: string;
}) {
  const entry = resolveMenCatalogDetails(input);
  const hasCustomDetails = input.detailOverrides?.enabled ?? false;
  const hasDatabaseDetails = Boolean(input.detailOverrides);
  const summary = hasCustomDetails
    ? input.detailOverrides?.summary ?? null
    : entry.summary ?? null;
  const accordNames = hasCustomDetails
    ? input.detailOverrides?.accordNames ?? []
    : entry.accords?.map((accord) => accord.name) ?? [];
  const accordStrengths = hasCustomDetails
    ? input.detailOverrides?.accordStrengths ?? []
    : entry.accords?.map((accord) => accord.strength) ?? [];
  const topNotes = hasCustomDetails
    ? input.detailOverrides?.topNotes ?? []
    : entry.notes?.top ?? [];
  const middleNotes = hasCustomDetails
    ? input.detailOverrides?.middleNotes ?? []
    : entry.notes?.middle ?? [];
  const baseNotes = hasCustomDetails
    ? input.detailOverrides?.baseNotes ?? []
    : entry.notes?.base ?? [];
  const moments = hasDatabaseDetails
    ? input.detailOverrides?.moments ?? []
    : entry.moments ?? [];
  const seasons = hasDatabaseDetails
    ? input.detailOverrides?.seasons ?? []
    : entry.seasons ?? [];

  return {
    accords: buildAccords(accordNames, accordStrengths),
    bottleScale: entry.bottleScale ?? 1.56,
    bottleTranslateX: entry.bottleTranslateX ?? "-22%",
    bottleTranslateY: entry.bottleTranslateY ?? "10%",
    detailsReady: Boolean(
      summary ||
        accordNames.length ||
        topNotes.length ||
        middleNotes.length ||
        baseNotes.length ||
        moments.length ||
        seasons.length,
    ),
    moments,
    notes: {
      base: baseNotes,
      middle: middleNotes,
      top: topNotes,
    },
    seasons,
    summary,
  };
}
