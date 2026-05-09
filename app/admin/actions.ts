"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearAdminSession,
  createAdminSession,
  hasAdminCredentialsConfigured,
  isAdminAuthenticated,
  validateAdminCredentials,
} from "@/lib/admin-auth";
import {
  getDefaultAccordStrength,
  type FragranceMoment,
  type FragranceSeason,
} from "@/data/men-catalog-details";
import {
  findCustomBottlePublicPathForSlug,
  getBottleAbsolutePathFromPublicPath,
  getBottleDirectory,
  isSupportedBottleExtension,
  normalizeBottlePublicPath,
} from "@/lib/catalog-bottle";
import { prisma, type PrismaTransactionClient } from "@/lib/prisma";

import {
  emptyFragranceFormState,
  type FragranceFormFieldName,
  type FragranceFormState,
} from "./fragrance-form-state";

const MAX_BOTTLE_IMAGE_BYTES = 8 * 1024 * 1024;
const VALID_MOMENTS = new Set<FragranceMoment>(["day", "night"]);
const VALID_SEASONS = new Set<FragranceSeason>([
  "spring",
  "summer",
  "fall",
  "winter",
]);
const VALID_STATUSES = new Set(["ACTIVE", "COMING_SOON"]);

type ParsedSize = {
  price: string;
  sizeMl: number;
  sortOrder: number;
};

type FragrancePayload = {
  accordNames: string[];
  accordStrengths: number[];
  baseNotes: string[];
  fullName: string;
  middleNotes: string[];
  moments: FragranceMoment[];
  rawText: string | null;
  seasons: FragranceSeason[];
  sizes: ParsedSize[];
  slug: string;
  sourcePage: number;
  status: "ACTIVE" | "COMING_SOON";
  summary: string | null;
  topNotes: string[];
};

export async function signInAdmin(formData: FormData) {
  if (!hasAdminCredentialsConfigured()) {
    redirect("/admin?error=config");
  }

  const username = readFormValue(formData, "username");
  const password = readFormValue(formData, "password");

  if (!validateAdminCredentials(username, password)) {
    redirect("/admin?error=invalid-credentials");
  }

  await createAdminSession();
  redirect("/admin");
}

export async function signOutAdmin() {
  await clearAdminSession();
  redirect("/admin");
}

export async function createFragrance(
  _prevState: FragranceFormState,
  formData: FormData,
): Promise<FragranceFormState> {
  await assertAdminAuthenticated();
  const redirectContext = readAdminListRedirectContext(formData);

  const payload = parseFragrancePayload(formData);

  if ("error" in payload) {
    return buildFragranceFormState(payload.error);
  }

  const conflicts = await findConflicts({
    slug: payload.slug,
    sourcePage: payload.sourcePage,
  });

  if (conflicts.slugTaken) {
    return buildFragranceFormState("duplicate-slug");
  }

  if (conflicts.sourcePageTaken) {
    return buildFragranceFormState("duplicate-source-page");
  }

  const imageChange = await prepareBottleImageChange({
    nextSlug: payload.slug,
    uploadedFile: readFileField(formData, "bottleImage"),
  });

  if ("error" in imageChange) {
    return buildFragranceFormState(imageChange.error);
  }

  try {
    await prisma.fragrance.create({
      data: {
        accordNames: payload.accordNames,
        accordStrengths: payload.accordStrengths,
        baseNotes: payload.baseNotes,
        catalog: "MEN",
        detailsCustomized: true,
        fullName: payload.fullName,
        imagePath: imageChange.nextImagePath,
        middleNotes: payload.middleNotes,
        momentTags: payload.moments,
        rawText: payload.rawText,
        seasonTags: payload.seasons,
        slug: payload.slug,
        sourcePage: payload.sourcePage,
        status: payload.status,
        summary: payload.summary,
        topNotes: payload.topNotes,
        sizes: {
          create: payload.sizes,
        },
      },
    });
  } catch (error) {
    console.error("createFragrance failed", error);
    await cleanupBottlePublicPath(imageChange.uploadedImagePath);
    redirect(buildAdminRedirect({ error: "save-failed", ...redirectContext }));
  }

  await cleanupBottlePublicPath(imageChange.obsoleteImagePath);

  revalidateCatalogPaths(payload.slug);
  redirect(
    buildAdminRedirect({
      focus: payload.slug,
      notice: "created",
      ...redirectContext,
    }),
  );
}

export async function updateFragrance(
  fragranceId: string,
  _prevState: FragranceFormState,
  formData: FormData,
): Promise<FragranceFormState> {
  await assertAdminAuthenticated();
  const redirectContext = readAdminListRedirectContext(formData);

  const payload = parseFragrancePayload(formData);

  if ("error" in payload) {
    return buildFragranceFormState(payload.error);
  }

  const existingFragrance = await prisma.fragrance.findUnique({
    where: {
      id: fragranceId,
    },
    select: {
      id: true,
      imagePath: true,
      slug: true,
    },
  });

  if (!existingFragrance) {
    redirect(buildAdminRedirect({ error: "not-found", ...redirectContext }));
  }

  const conflicts = await findConflicts({
    excludeId: fragranceId,
    slug: payload.slug,
    sourcePage: payload.sourcePage,
  });

  if (conflicts.slugTaken) {
    return buildFragranceFormState("duplicate-slug");
  }

  if (conflicts.sourcePageTaken) {
    return buildFragranceFormState("duplicate-source-page");
  }

  const imageChange = await prepareBottleImageChange({
    existingImagePath:
      existingFragrance.imagePath ??
      (await findCustomBottlePublicPathForSlug(existingFragrance.slug)),
    nextSlug: payload.slug,
    removeCurrentImage: readCheckboxValue(formData, "removeBottleImage"),
    uploadedFile: readFileField(formData, "bottleImage"),
  });

  if ("error" in imageChange) {
    return buildFragranceFormState(imageChange.error);
  }

  try {
    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      await tx.fragrance.update({
        where: {
          id: fragranceId,
        },
        data: {
          accordNames: {
            set: payload.accordNames,
          },
          accordStrengths: {
            set: payload.accordStrengths,
          },
          baseNotes: {
            set: payload.baseNotes,
          },
          detailsCustomized: true,
          fullName: payload.fullName,
          imagePath: imageChange.nextImagePath,
          middleNotes: {
            set: payload.middleNotes,
          },
          momentTags: {
            set: payload.moments,
          },
          rawText: payload.rawText,
          seasonTags: {
            set: payload.seasons,
          },
          slug: payload.slug,
          sourcePage: payload.sourcePage,
          status: payload.status,
          summary: payload.summary,
          topNotes: {
            set: payload.topNotes,
          },
        },
      });

      await tx.fragranceSize.deleteMany({
        where: {
          fragranceId,
        },
      });

      await tx.fragranceSize.createMany({
        data: payload.sizes.map((size) => ({
          ...size,
          fragranceId,
        })),
      });
    });
  } catch (error) {
    console.error("updateFragrance failed", error);
    await cleanupBottlePublicPath(imageChange.uploadedImagePath);
    redirect(
      buildAdminRedirect({
        error: "save-failed",
        focus: payload.slug,
        ...redirectContext,
      }),
    );
  }

  await cleanupBottlePublicPath(imageChange.obsoleteImagePath);

  revalidateCatalogPaths(existingFragrance.slug);
  revalidateCatalogPaths(payload.slug);
  redirect(
    buildAdminRedirect({
      focus: payload.slug,
      notice: "updated",
      ...redirectContext,
    }),
  );
}

export async function deleteFragrance(fragranceId: string, formData: FormData) {
  await assertAdminAuthenticated();
  const redirectContext = readAdminListRedirectContext(formData);

  const existingFragrance = await prisma.fragrance.findUnique({
    where: {
      id: fragranceId,
    },
    select: {
      imagePath: true,
      slug: true,
    },
  });

  if (!existingFragrance) {
    redirect(buildAdminRedirect({ error: "not-found", ...redirectContext }));
  }

  try {
    await prisma.fragrance.delete({
      where: {
        id: fragranceId,
      },
    });
  } catch (error) {
    console.error("deleteFragrance failed", error);
    redirect(buildAdminRedirect({ error: "delete-failed", ...redirectContext }));
  }

  await cleanupBottlePublicPath(
    existingFragrance.imagePath ??
      (await findCustomBottlePublicPathForSlug(existingFragrance.slug)),
  );

  revalidateCatalogPaths(existingFragrance.slug);
  redirect(buildAdminRedirect({ notice: "deleted", ...redirectContext }));
}

async function assertAdminAuthenticated() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin?error=unauthorized");
  }
}

function buildAdminRedirect(params: {
  error?: string;
  focus?: string;
  notice?: string;
  page?: number;
  query?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.focus) {
    searchParams.set("focus", params.focus);
  }

  if (params.notice) {
    searchParams.set("notice", params.notice);
  }

  if (params.query) {
    searchParams.set("q", params.query);
  }

  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();

  return query ? `/admin?${query}` : "/admin";
}

function readAdminListRedirectContext(formData: FormData) {
  const query = readOptionalValue(formData, "redirectQuery");
  const page = parsePositiveInteger(readOptionalValue(formData, "redirectPage"));

  return {
    page: page && page > 1 ? page : undefined,
    query: query ?? undefined,
  };
}

async function findConflicts(input: {
  excludeId?: string;
  slug: string;
  sourcePage: number;
}) {
  const [slugMatch, sourcePageMatch] = await Promise.all([
    prisma.fragrance.findFirst({
      where: {
        id: input.excludeId ? { not: input.excludeId } : undefined,
        slug: input.slug,
      },
      select: {
        id: true,
      },
    }),
    prisma.fragrance.findFirst({
      where: {
        id: input.excludeId ? { not: input.excludeId } : undefined,
        sourcePage: input.sourcePage,
      },
      select: {
        id: true,
      },
    }),
  ]);

  return {
    slugTaken: Boolean(slugMatch),
    sourcePageTaken: Boolean(sourcePageMatch),
  };
}

function parseFragrancePayload(formData: FormData): FragrancePayload | { error: string } {
  const fullName = readFormValue(formData, "fullName");
  const slug = slugify(readFormValue(formData, "slug"));
  const rawSourcePage = readFormValue(formData, "sourcePage");
  const rawStatus = readFormValue(formData, "status");
  const summary = readOptionalValue(formData, "summary");
  const rawText = readOptionalValue(formData, "rawText");
  const accords = parseAccordsField(formData);
  const moments = parseEnumCheckboxGroup(
    formData,
    "moments",
    VALID_MOMENTS,
  );
  const topNotes = parseListField(readFormValue(formData, "topNotes"));
  const middleNotes = parseListField(readFormValue(formData, "middleNotes"));
  const baseNotes = parseListField(readFormValue(formData, "baseNotes"));
  const seasons = parseEnumCheckboxGroup(
    formData,
    "seasons",
    VALID_SEASONS,
  );
  const sizes = parseSizesField(readFormValue(formData, "sizes"));

  if (!fullName) {
    return { error: "missing-name" };
  }

  if (!slug) {
    return { error: "missing-slug" };
  }

  const sourcePage = Number.parseInt(rawSourcePage, 10);

  if (!Number.isInteger(sourcePage) || sourcePage <= 0) {
    return { error: "invalid-source-page" };
  }

  if (!VALID_STATUSES.has(rawStatus)) {
    return { error: "invalid-status" };
  }

  if (!accords) {
    return { error: "invalid-accords" };
  }

  if (!sizes.length) {
    return { error: "missing-sizes" };
  }

  if (!moments) {
    return { error: "invalid-moments" };
  }

  if (!seasons) {
    return { error: "invalid-seasons" };
  }

  return {
    accordNames: accords.names,
    accordStrengths: accords.strengths,
    baseNotes,
    fullName,
    middleNotes,
    moments,
    rawText,
    seasons,
    sizes,
    slug,
    sourcePage,
    status: rawStatus as FragrancePayload["status"],
    summary,
    topNotes,
  };
}

function parseListField(value: string) {
  const items = value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return Array.from(new Set(items));
}

function parseAccordsField(formData: FormData) {
  const accordNames = formData
    .getAll("accordNames")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const accordStrengthValues = formData
    .getAll("accordStrengths")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  if (accordNames.length === 0 && accordStrengthValues.length === 0) {
    const fallbackAccordNames = parseListField(readFormValue(formData, "accordNames"));

    return {
      names: fallbackAccordNames,
      strengths: fallbackAccordNames.map((_, index) => getDefaultAccordStrength(index)),
    };
  }

  if (accordNames.length > 10 || accordNames.length !== accordStrengthValues.length) {
    return null;
  }

  const uniqueNames = new Set<string>();
  const strengths: number[] = [];

  for (const [index, accordName] of accordNames.entries()) {
    if (!accordName || uniqueNames.has(accordName)) {
      return null;
    }

    const strength = Number.parseInt(accordStrengthValues[index], 10);

    if (!Number.isInteger(strength) || strength < 0 || strength > 100) {
      return null;
    }

    uniqueNames.add(accordName);
    strengths.push(strength);
  }

  return {
    names: accordNames,
    strengths,
  };
}

function parseEnumCheckboxGroup<T extends string>(
  formData: FormData,
  fieldName: string,
  validValues: Set<T>,
) {
  const values = formData
    .getAll(fieldName)
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  if (values.some((value) => !validValues.has(value as T))) {
    return null;
  }

  return Array.from(new Set(values)) as T[];
}

function parseSizesField(value: string): ParsedSize[] {
  const lines = value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const sizes: ParsedSize[] = [];

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^(\d+)\s*(?:ml)?\s*[\|,:-]\s*\$?\s*(\d+(?:\.\d{1,2})?)$/i);

    if (!match) {
      return [];
    }

    const sizeMl = Number.parseInt(match[1], 10);
    const price = Number.parseFloat(match[2]);

    if (!Number.isInteger(sizeMl) || sizeMl <= 0 || Number.isNaN(price) || price <= 0) {
      return [];
    }

    sizes.push({
      price: price.toFixed(2),
      sizeMl,
      sortOrder: index,
    });
  }

  const uniqueSizeCount = new Set(sizes.map((size) => size.sizeMl)).size;

  if (uniqueSizeCount !== sizes.length) {
    return [];
  }

  return sizes;
}

async function prepareBottleImageChange(input: {
  existingImagePath?: string | null;
  nextSlug: string;
  removeCurrentImage?: boolean;
  uploadedFile?: File | null;
}):
  Promise<
    | {
        nextImagePath: string | null;
        obsoleteImagePath: string | null;
        uploadedImagePath: string | null;
      }
    | { error: string }
  > {
  const normalizedExistingPath = normalizeBottlePublicPath(input.existingImagePath);
  const uploadedFile = input.uploadedFile;

  if (uploadedFile && uploadedFile.size > 0) {
    const persistedUpload = await persistBottleImageUpload(uploadedFile, input.nextSlug);

    if ("error" in persistedUpload) {
      return persistedUpload;
    }

    return {
      nextImagePath: persistedUpload.imagePath,
      obsoleteImagePath:
        normalizedExistingPath && normalizedExistingPath !== persistedUpload.imagePath
          ? normalizedExistingPath
          : null,
      uploadedImagePath: persistedUpload.imagePath,
    };
  }

  if (input.removeCurrentImage) {
    return {
      nextImagePath: null,
      obsoleteImagePath: normalizedExistingPath,
      uploadedImagePath: null,
    };
  }

  return {
    nextImagePath: normalizedExistingPath,
    obsoleteImagePath: null,
    uploadedImagePath: null,
  };
}

async function persistBottleImageUpload(
  uploadedFile: File,
  slug: string,
): Promise<{ imagePath: string } | { error: string }> {
  if (uploadedFile.size <= 0) {
    return { error: "invalid-image-file" };
  }

  if (uploadedFile.size > MAX_BOTTLE_IMAGE_BYTES) {
    return { error: "image-too-large" };
  }

  const extension = resolveBottleFileExtension(uploadedFile);

  if (!extension) {
    return { error: "unsupported-image-type" };
  }

  const imageFilename = `${slug}${extension}`;
  const imagePath = `/bottles/${imageFilename}`;
  const absolutePath = getBottleAbsolutePathFromPublicPath(imagePath);

  if (!absolutePath) {
    return { error: "unsupported-image-type" };
  }

  await mkdir(getBottleDirectory(), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await uploadedFile.arrayBuffer()));

  return {
    imagePath,
  };
}

async function cleanupBottlePublicPath(publicPath: string | null) {
  const absolutePath = getBottleAbsolutePathFromPublicPath(publicPath ?? "");

  if (!absolutePath) {
    return;
  }

  try {
    await unlink(absolutePath);
  } catch {
    // Ignore missing files during cleanup.
  }
}

function readFormValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value.trim() : "";
}

function readCheckboxValue(formData: FormData, fieldName: string) {
  return readFormValue(formData, fieldName) === "on";
}

function readFileField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return value instanceof File ? value : null;
}

function readOptionalValue(formData: FormData, fieldName: string) {
  const value = readFormValue(formData, fieldName);

  return value || null;
}

function parsePositiveInteger(value: string | null) {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function buildFragranceFormState(error: string): FragranceFormState {
  const fieldError = resolveFragranceFieldError(error);

  if (fieldError) {
    return {
      ...emptyFragranceFormState,
      fieldErrors: {
        [fieldError.field]: fieldError.message,
      },
    };
  }

  return {
    ...emptyFragranceFormState,
    formError: resolveFragranceFormErrorMessage(error),
  };
}

function resolveFragranceFieldError(error: string): {
  field: FragranceFormFieldName;
  message: string;
} | null {
  switch (error) {
    case "duplicate-slug":
      return {
        field: "slug",
        message:
          "Ese slug ya existe. Usa uno diferente para evitar conflictos en la ruta.",
      };
    case "duplicate-source-page":
      return {
        field: "sourcePage",
        message:
          "Ese numero de orden/source page ya esta ocupado por otra fragancia.",
      };
    case "invalid-image-file":
      return {
        field: "bottleImage",
        message: "La imagen seleccionada no se pudo leer correctamente.",
      };
    case "invalid-accords":
      return {
        field: "accordNames",
        message:
          "Revisa los accords seleccionados y sus porcentajes. Cada uno debe tener un porcentaje entre 0 y 100.",
      };
    case "invalid-moments":
      return {
        field: "moments",
        message: "Los momentos enviados no son validos.",
      };
    case "invalid-seasons":
      return {
        field: "seasons",
        message: "Las temporadas enviadas no son validas.",
      };
    case "image-too-large":
      return {
        field: "bottleImage",
        message: "La imagen pesa demasiado. Usa un archivo de hasta 8MB.",
      };
    case "invalid-source-page":
      return {
        field: "sourcePage",
        message:
          "El campo de orden/source page debe ser un numero entero mayor a cero.",
      };
    case "invalid-status":
      return {
        field: "status",
        message: "El estado enviado no es valido.",
      };
    case "missing-name":
      return {
        field: "fullName",
        message: "La fragancia necesita un nombre antes de guardarse.",
      };
    case "missing-sizes":
      return {
        field: "sizes",
        message:
          "Agrega al menos un tamano valido con su precio, por ejemplo `100|85`.",
      };
    case "missing-slug":
      return {
        field: "slug",
        message: "La fragancia necesita un slug valido.",
      };
    case "unsupported-image-type":
      return {
        field: "bottleImage",
        message: "El archivo de imagen debe ser PNG, JPG, WEBP o AVIF.",
      };
    default:
      return null;
  }
}

function resolveFragranceFormErrorMessage(error: string) {
  switch (error) {
    case "save-failed":
      return "No se pudieron guardar los cambios en Prisma. Revisa la conexion y vuelve a intentar.";
    default:
      return "No se pudo procesar la fragancia. Revisa los campos e intenta de nuevo.";
  }
}

function revalidateCatalogPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/catalog/${slug}`);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveBottleFileExtension(file: File) {
  const fileNameExtension = path.extname(file.name).toLowerCase();

  if (isSupportedBottleExtension(fileNameExtension)) {
    return fileNameExtension;
  }

  const mimeTypeToExtension: Record<string, string> = {
    "image/avif": ".avif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  const mimeTypeExtension = mimeTypeToExtension[file.type];

  return mimeTypeExtension && isSupportedBottleExtension(mimeTypeExtension)
    ? mimeTypeExtension
    : null;
}
