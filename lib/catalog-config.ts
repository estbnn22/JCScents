export const catalogTypes = ["MEN", "WOMEN"] as const;

export type CatalogType = (typeof catalogTypes)[number];

export const defaultCatalogType: CatalogType = "MEN";

const DEFAULT_MEN_CATALOG_PDF_PATH =
  "/Users/estebanmachuca/Library/Mobile Documents/com~apple~CloudDocs/Downloads/JCScents Men Catalogo.pdf";

const catalogRouteSegments: Record<CatalogType, string> = {
  MEN: "men",
  WOMEN: "women",
};

const routeSegmentToCatalog: Record<string, CatalogType> = {
  men: "MEN",
  women: "WOMEN",
};

const catalogLabels: Record<CatalogType, string> = {
  MEN: "Caballeros",
  WOMEN: "Damas",
};

export function getCatalogLabel(catalog: CatalogType) {
  return catalogLabels[catalog];
}

export function getCatalogRouteSegment(catalog: CatalogType) {
  return catalogRouteSegments[catalog];
}

export function parseCatalogType(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toUpperCase();

  return catalogTypes.includes(normalizedValue as CatalogType)
    ? (normalizedValue as CatalogType)
    : null;
}

export function parseCatalogTypeFromRouteSegment(
  value: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  return routeSegmentToCatalog[value.trim().toLowerCase()] ?? null;
}

export function getCatalogPdfPath(catalog: CatalogType) {
  switch (catalog) {
    case "MEN":
      return process.env.MEN_CATALOG_PDF_PATH ??
        process.env.CATALOG_PDF_PATH ??
        DEFAULT_MEN_CATALOG_PDF_PATH;
    case "WOMEN":
      return process.env.WOMEN_CATALOG_PDF_PATH ?? null;
  }
}
