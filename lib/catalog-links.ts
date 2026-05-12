import {
  defaultCatalogType,
  type CatalogType,
} from "@/lib/catalog-config";

export function buildCatalogCollectionHref(params?: {
  catalog?: CatalogType;
  page?: number;
  query?: string;
  status?: "all" | "ACTIVE" | "COMING_SOON";
}) {
  const searchParams = new URLSearchParams();
  const catalog = params?.catalog ?? defaultCatalogType;
  const normalizedQuery = params?.query?.trim() ?? "";
  const page = params?.page ?? 1;
  const status = params?.status ?? "all";

  if (catalog !== defaultCatalogType) {
    searchParams.set("catalog", catalog);
  }

  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  if (status !== "all") {
    searchParams.set("status", status);
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const queryString = searchParams.toString();

  return queryString ? `/?${queryString}#catalogo` : "/#catalogo";
}

export function buildCatalogItemHref(
  slug: string,
  catalog: CatalogType = defaultCatalogType,
) {
  const searchParams = new URLSearchParams();

  if (catalog !== defaultCatalogType) {
    searchParams.set("catalog", catalog);
  }

  const queryString = searchParams.toString();

  return queryString ? `/catalog/${slug}?${queryString}` : `/catalog/${slug}`;
}
