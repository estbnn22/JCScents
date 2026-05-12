import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  type CatalogType,
  getCatalogLabel,
  getCatalogPdfPath,
  getCatalogRouteSegment,
} from "@/lib/catalog-config";

const BOTTLE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif"] as const;
const BOTTLE_DIRECTORY = path.join(process.cwd(), "public", "bottles");
const BOTTLE_PUBLIC_PREFIX = "/bottles/";
const INLINE_BOTTLE_IMAGE_PREFIX = "data:image/";

export type BottleImageAsset = {
  kind: "custom" | "pdf" | "placeholder";
  src: string;
};

export async function resolveBottleImageAsset(
  catalog: CatalogType,
  slug: string,
  sourcePage: number,
  preferredPath?: string | null,
): Promise<BottleImageAsset> {
  const normalizedPreferredPath = normalizeStoredBottleImagePath(preferredPath);

  if (normalizedPreferredPath) {
    return {
      kind: "custom",
      src: normalizedPreferredPath,
    };
  }

  const legacyPath = await findCustomBottlePublicPathForSlug(catalog, slug);

  if (legacyPath) {
    return {
      kind: "custom",
      src: legacyPath,
    };
  }

  if (getCatalogPdfPath(catalog) && sourcePage > 0) {
    return {
      kind: "pdf",
      src: `/catalog-pages/${getCatalogRouteSegment(catalog)}/${sourcePage}`,
    };
  }

  return {
    kind: "placeholder",
    src: buildPlaceholderImageSrc(catalog),
  };
}

export async function findCustomBottlePublicPathForSlug(
  catalog: CatalogType,
  slug: string,
) {
  const entries = await findCustomBottleEntriesBySlug(catalog, slug);
  const [firstEntry] = entries;

  return firstEntry ? `${BOTTLE_PUBLIC_PREFIX}${firstEntry}` : null;
}

export function buildBottleImagePublicPath(
  catalog: CatalogType,
  slug: string,
  extension: string,
) {
  return `${BOTTLE_PUBLIC_PREFIX}${getCatalogRouteSegment(catalog)}/${slug}${extension}`;
}

export function getBottleAbsolutePathFromPublicPath(publicPath: string) {
  const normalizedPath = normalizeBottlePublicPath(publicPath);

  if (!normalizedPath) {
    return null;
  }

  return path.join(BOTTLE_DIRECTORY, normalizedPath.slice(BOTTLE_PUBLIC_PREFIX.length));
}

export function getBottleDirectory() {
  return BOTTLE_DIRECTORY;
}

export function getSupportedBottleExtensions() {
  return [...BOTTLE_EXTENSIONS];
}

export function isSupportedBottleExtension(extension: string) {
  return BOTTLE_EXTENSIONS.includes(extension.toLowerCase() as (typeof BOTTLE_EXTENSIONS)[number]);
}

export function normalizeBottlePublicPath(publicPath: string | null | undefined) {
  if (!publicPath) {
    return null;
  }

  const trimmedPath = publicPath.trim();

  if (!trimmedPath.startsWith(BOTTLE_PUBLIC_PREFIX)) {
    return null;
  }

  const relativePath = trimmedPath.slice(BOTTLE_PUBLIC_PREFIX.length);
  const segments = relativePath.split("/").filter(Boolean);

  if (segments.length === 0 || segments.length > 2) {
    return null;
  }

  if (segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }

  const filename = segments[segments.length - 1];

  if (!filename || filename.includes("\\") || filename.includes("/")) {
    return null;
  }

  const extension = path.extname(filename).toLowerCase();

  if (!isSupportedBottleExtension(extension)) {
    return null;
  }

  if (
    segments.length === 2 &&
    segments[0] !== "men" &&
    segments[0] !== "women"
  ) {
    return null;
  }

  return `${BOTTLE_PUBLIC_PREFIX}${segments.join("/")}`;
}

export function normalizeStoredBottleImagePath(
  value: string | null | undefined,
) {
  const normalizedPublicPath = normalizeBottlePublicPath(value);

  if (normalizedPublicPath) {
    return normalizedPublicPath;
  }

  return normalizeInlineBottleImageDataUrl(value);
}

function normalizeInlineBottleImageDataUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith(INLINE_BOTTLE_IMAGE_PREFIX)) {
    return null;
  }

  const metadataSeparatorIndex = trimmedValue.indexOf(",");

  if (metadataSeparatorIndex <= INLINE_BOTTLE_IMAGE_PREFIX.length) {
    return null;
  }

  const metadata = trimmedValue.slice(0, metadataSeparatorIndex).toLowerCase();

  if (!metadata.endsWith(";base64")) {
    return null;
  }

  const mimeType = metadata.slice("data:".length, metadata.length - ";base64".length);

  switch (mimeType) {
    case "image/avif":
    case "image/jpeg":
    case "image/png":
    case "image/webp":
      return trimmedValue;
    default:
      return null;
  }
}

async function findCustomBottleEntriesBySlug(catalog: CatalogType, slug: string) {
  const scopedEntries = await readBottleDirectoryEntries(getCatalogRouteSegment(catalog));
  const scopedMatches = scopedEntries
    .filter((entry) => entryMatchesSlug(entry, slug))
    .map((entry) => `${getCatalogRouteSegment(catalog)}/${entry}`);

  if (scopedMatches.length > 0) {
    return scopedMatches;
  }

  const legacyEntries = await readBottleDirectoryEntries();

  return legacyEntries.filter((entry) => entryMatchesSlug(entry, slug));
}

async function readBottleDirectoryEntries(relativeDirectory?: string) {
  const directory = relativeDirectory
    ? path.join(BOTTLE_DIRECTORY, relativeDirectory)
    : BOTTLE_DIRECTORY;

  try {
    return await readdir(directory);
  } catch {
    return [];
  }
}

function entryMatchesSlug(entry: string, slug: string | null | undefined) {
  if (typeof slug !== "string") {
    return false;
  }

  let normalizedName = entry.toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();

  while (true) {
    const extension = path.extname(normalizedName).toLowerCase();

    if (!BOTTLE_EXTENSIONS.includes(extension as (typeof BOTTLE_EXTENSIONS)[number])) {
      break;
    }

    normalizedName = normalizedName.slice(0, -extension.length);
  }

  return normalizedName === normalizedSlug;
}

function buildPlaceholderImageSrc(catalog: CatalogType) {
  const label = getCatalogLabel(catalog);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 900">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff7ee" />
      <stop offset="100%" stop-color="#ead7c0" />
    </linearGradient>
    <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.94" />
      <stop offset="100%" stop-color="#f2d8b2" stop-opacity="0.72" />
    </linearGradient>
  </defs>
  <rect width="720" height="900" rx="54" fill="url(#bg)" />
  <circle cx="560" cy="180" r="130" fill="#ffffff" fill-opacity="0.35" />
  <rect x="250" y="132" width="220" height="110" rx="28" fill="#3f224f" fill-opacity="0.92" />
  <rect x="195" y="220" width="330" height="470" rx="84" fill="url(#glass)" stroke="#7f5360" stroke-opacity="0.26" stroke-width="14" />
  <rect x="240" y="272" width="240" height="88" rx="24" fill="#ffffff" fill-opacity="0.8" />
  <text x="360" y="328" text-anchor="middle" font-family="Georgia, serif" font-size="46" fill="#4d2f3a">JC</text>
  <text x="360" y="768" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" letter-spacing="6" fill="#5d3a46">${label.toUpperCase()}</text>
  <text x="360" y="815" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" letter-spacing="4" fill="#7a5a52">IMAGE COMING SOON</text>
</svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
