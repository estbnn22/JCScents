import { readdir } from "node:fs/promises";
import path from "node:path";

const BOTTLE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif"] as const;
const BOTTLE_DIRECTORY = path.join(process.cwd(), "public", "bottles");
const BOTTLE_PUBLIC_PREFIX = "/bottles/";

export type BottleImageAsset = {
  kind: "custom" | "pdf";
  src: string;
};

export async function resolveBottleImageAsset(
  slug: string,
  sourcePage: number,
  preferredPath?: string | null,
): Promise<BottleImageAsset> {
  const normalizedPreferredPath = normalizeBottlePublicPath(preferredPath);

  if (normalizedPreferredPath) {
    return {
      kind: "custom",
      src: normalizedPreferredPath,
    };
  }

  const legacyPath = await findCustomBottlePublicPathForSlug(slug);

  if (legacyPath) {
    return {
      kind: "custom",
      src: legacyPath,
    };
  }

  return {
    kind: "pdf",
    src: `/catalog-pages/${sourcePage}`,
  };
}

export async function findCustomBottlePublicPathForSlug(slug: string) {
  const entries = await findCustomBottleEntriesBySlug(slug);
  const [firstEntry] = entries;

  return firstEntry ? `${BOTTLE_PUBLIC_PREFIX}${firstEntry}` : null;
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

  const filename = trimmedPath.slice(BOTTLE_PUBLIC_PREFIX.length);

  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return null;
  }

  const extension = path.extname(filename).toLowerCase();

  if (!isSupportedBottleExtension(extension)) {
    return null;
  }

  return `${BOTTLE_PUBLIC_PREFIX}${filename}`;
}

async function findCustomBottleEntriesBySlug(slug: string) {
  try {
    const entries = await readdir(BOTTLE_DIRECTORY);

    return entries.filter((entry) => entryMatchesSlug(entry, slug));
  } catch {
    return [];
  }
}

function entryMatchesSlug(entry: string, slug: string) {
  let normalizedName = entry.toLowerCase();

  while (true) {
    const extension = path.extname(normalizedName).toLowerCase();

    if (!BOTTLE_EXTENSIONS.includes(extension as (typeof BOTTLE_EXTENSIONS)[number])) {
      break;
    }

    normalizedName = normalizedName.slice(0, -extension.length);
  }

  return normalizedName === slug.toLowerCase();
}
