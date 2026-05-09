import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT =
  "/Users/estebanmachuca/Library/Mobile Documents/com~apple~CloudDocs/Downloads/JCScents Men Catalogo.pdf";
const DEFAULT_OUTPUT = path.resolve("data/men-catalog.json");

const args = process.argv.slice(2);
const input = getArgValue("--input") ?? process.env.CATALOG_PDF_PATH ?? DEFAULT_INPUT;
const output = getArgValue("--output") ?? process.env.CATALOG_JSON_PATH ?? DEFAULT_OUTPUT;

if (!fs.existsSync(input)) {
  console.error(`Catalog PDF not found at "${input}".`);
  console.error("Pass a custom path with --input or set CATALOG_PDF_PATH.");
  process.exit(1);
}

const rawPages = execFileSync(
  "swift",
  [
    "-e",
    `
import PDFKit
import Foundation

let url = URL(fileURLWithPath: "${escapeSwiftString(input)}")
guard let document = PDFDocument(url: url) else {
  fatalError("Unable to open catalog PDF.")
}

for index in 0..<document.pageCount {
  let text = (document.page(at: index)?.string ?? "")
    .replacingOccurrences(of: "\\n", with: " | ")
  print("PAGE=\\(index + 1) TEXT=\\(text)")
}
    `.trim(),
  ],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      CLANG_MODULE_CACHE_PATH: "/private/tmp/clang-module-cache",
    },
    maxBuffer: 1024 * 1024 * 32,
  },
);

const fragrances = parseCatalog(rawPages);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(fragrances, null, 2)}\n`);

console.log(`Extracted ${fragrances.length} fragrances to ${output}`);

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

function escapeSwiftString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function parseCatalog(rawPagesText) {
  const slugCounts = new Map();

  return rawPagesText
    .split(/\r?\n/)
    .map((line) => parseLine(line, slugCounts))
    .filter(Boolean);
}

function parseLine(line, slugCounts) {
  const match = line.match(/^PAGE=(\d+)\s+TEXT=(.*)$/);
  if (!match) {
    return null;
  }

  const sourcePage = Number(match[1]);
  const rawText = match[2].trim();
  const prices = [...rawText.matchAll(/\$\s*(\d+\.\d{2})/g)]
    .map((match) => match[1])
    .filter((price) => Number(price) <= 100);
  const status = /coming soon/i.test(rawText) ? "COMING_SOON" : "ACTIVE";
  const fullName = extractName(rawText);

  if (!fullName || prices.length === 0) {
    return null;
  }

  const sizeMlOrder = inferSizeOrder(rawText, prices.length);
  const sizes = prices.map((price, index) => ({
    sizeMl: sizeMlOrder[index] ?? Math.max(1, prices.length - index),
    price,
    sortOrder: index + 1,
  }));

  const baseSlug = slugify(fullName);
  const slugCount = slugCounts.get(baseSlug) ?? 0;
  slugCounts.set(baseSlug, slugCount + 1);
  const slug = slugCount === 0 ? baseSlug : `${baseSlug}-${sourcePage}`;

  return {
    sourcePage,
    fullName,
    slug,
    rawText,
    status,
    sizes,
  };
}

function extractName(rawText) {
  const segments = rawText
    .split("|")
    .map((segment) => cleanSegment(segment))
    .filter(Boolean);

  return segments[0] ?? "";
}

function cleanSegment(segment) {
  const cleaned = segment
    .replace(/Day Night Sprint Summer Fall Winter/gi, " ")
    .replace(/Coming Soon/gi, " ")
    .replace(/\b10ML\b/gi, " ")
    .replace(/\b5ML\b/gi, " ")
    .replace(/\b3ML\b/gi, " ")
    .replace(/\$\s*\d+\.\d{2}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function inferSizeOrder(rawText, priceCount) {
  const labels = [...rawText.matchAll(/(\d+)ML/gi)].map((match) => Number(match[1]));
  const uniqueLabels = [...new Set(labels)];

  if (uniqueLabels.length === priceCount && uniqueLabels.length > 0) {
    return uniqueLabels;
  }

  if (priceCount === 3) {
    return [10, 5, 3];
  }

  if (priceCount === 2) {
    if (uniqueLabels.includes(5) && !uniqueLabels.includes(10) && !uniqueLabels.includes(3)) {
      return [5, 3];
    }

    if (uniqueLabels.includes(5) && uniqueLabels.includes(3)) {
      return [5, 3];
    }

    return [10, 5];
  }

  if (priceCount === 1) {
    if (uniqueLabels.includes(5) && !uniqueLabels.includes(10)) {
      return [5];
    }

    if (uniqueLabels.includes(3) && !uniqueLabels.includes(5)) {
      return [3];
    }

    return [10];
  }

  return Array.from({ length: priceCount }, (_, index) => priceCount - index);
}

function slugify(value) {
  const normalized = value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/gi, "oe")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return normalized.replaceAll(" ", "-");
}
