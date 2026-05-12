import { getStaticCatalogItems } from "@/lib/catalog";
import { parseCatalogTypeFromRouteSegment } from "@/lib/catalog-config";
import { getCatalogPageImageBuffer } from "@/lib/catalog-page-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validCatalogPagesByCatalog = {
  MEN: new Set(getStaticCatalogItems("MEN").map((item) => item.sourcePage)),
  WOMEN: new Set(getStaticCatalogItems("WOMEN").map((item) => item.sourcePage)),
} as const;

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      catalog: string;
      page: string;
    }>;
  },
) {
  const { catalog: catalogSegment, page } = await context.params;
  const catalog = parseCatalogTypeFromRouteSegment(catalogSegment);

  if (!catalog) {
    return new Response("Catalog not found.", { status: 404 });
  }

  const pageNumber = Number(page);

  if (
    !Number.isInteger(pageNumber) ||
    !validCatalogPagesByCatalog[catalog].has(pageNumber)
  ) {
    return new Response("Page not found.", { status: 404 });
  }

  try {
    const imageBuffer = await getCatalogPageImageBuffer(catalog, pageNumber);

    return new Response(imageBuffer, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": "image/jpeg",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo renderizar la página del catálogo.";

    return new Response(message, { status: 500 });
  }
}
