import { execFile } from "node:child_process";
import { access, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
  type CatalogType,
  getCatalogPdfPath,
  getCatalogRouteSegment,
} from "@/lib/catalog-config";

const execFileAsync = promisify(execFile);

const CACHE_DIRECTORY = "/private/tmp/jcscents-catalog-pages";
const CLANG_CACHE_DIRECTORY = "/private/tmp/clang-module-cache";
const IMAGE_WIDTH = 1400;
const JPEG_QUALITY = 0.72;

export async function getCatalogPageImageBuffer(
  catalog: CatalogType,
  pageNumber: number,
) {
  const imagePath = path.join(
    CACHE_DIRECTORY,
    `${getCatalogRouteSegment(catalog)}-page-${pageNumber}.jpg`,
  );

  await mkdir(CACHE_DIRECTORY, { recursive: true });
  await mkdir(CLANG_CACHE_DIRECTORY, { recursive: true });

  try {
    await access(imagePath);
  } catch {
    await renderCatalogPageImage(catalog, pageNumber, imagePath);
  }

  return readFile(imagePath);
}

export async function getMenCatalogPageImageBuffer(pageNumber: number) {
  return getCatalogPageImageBuffer("MEN", pageNumber);
}

async function renderCatalogPageImage(
  catalog: CatalogType,
  pageNumber: number,
  outputPath: string,
) {
  const pdfPath = getCatalogPdfPath(catalog);

  if (!pdfPath) {
    throw new Error(`No PDF path is configured for the ${catalog} catalog.`);
  }

  await access(pdfPath);

  const swiftScript = `
import Foundation
import PDFKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let pdfPath = "${escapeSwiftString(pdfPath)}"
let outputPath = "${escapeSwiftString(outputPath)}"
let targetPage = ${pageNumber}
let maxWidth: CGFloat = ${IMAGE_WIDTH}
let quality: CGFloat = ${JPEG_QUALITY}

guard let document = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else {
  fatalError("Unable to open catalog PDF.")
}

guard let page = document.page(at: targetPage - 1) else {
  fatalError("Unable to read catalog page.")
}

let mediaBox = page.bounds(for: .mediaBox)
let scale = maxWidth / mediaBox.width
let width = Int(mediaBox.width * scale)
let height = Int(mediaBox.height * scale)

let colorSpace = CGColorSpaceCreateDeviceRGB()
guard let context = CGContext(
  data: nil,
  width: width,
  height: height,
  bitsPerComponent: 8,
  bytesPerRow: 0,
  space: colorSpace,
  bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else {
  fatalError("Unable to create render context.")
}

context.setFillColor(gray: 1, alpha: 1)
context.fill(CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)))
context.saveGState()
context.scaleBy(x: scale, y: scale)
page.draw(with: .mediaBox, to: context)
context.restoreGState()

guard let image = context.makeImage() else {
  fatalError("Unable to finalize rendered page.")
}

let outputURL = URL(fileURLWithPath: outputPath) as CFURL
guard let destination = CGImageDestinationCreateWithURL(
  outputURL,
  UTType.jpeg.identifier as CFString,
  1,
  nil
) else {
  fatalError("Unable to create image destination.")
}

let options = [kCGImageDestinationLossyCompressionQuality: quality] as CFDictionary
CGImageDestinationAddImage(destination, image, options)

if !CGImageDestinationFinalize(destination) {
  fatalError("Unable to write rendered page image.")
}
  `.trim();

  await execFileAsync("swift", ["-e", swiftScript], {
    env: {
      ...process.env,
      CLANG_MODULE_CACHE_PATH: CLANG_CACHE_DIRECTORY,
    },
    maxBuffer: 1024 * 1024 * 32,
  });
}

function escapeSwiftString(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
