import { getStaticMenCatalogItems } from "@/lib/catalog";
import { getCatalogPageImageBuffer } from "@/lib/catalog-page-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validCatalogPages = new Set(
  getStaticMenCatalogItems().map((item) => item.sourcePage),
);

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      page: string;
    }>;
  },
) {
  const { page } = await context.params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || !validCatalogPages.has(pageNumber)) {
    return new Response("Page not found.", { status: 404 });
  }

  try {
    const imageBuffer = await getCatalogPageImageBuffer(pageNumber);

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
