import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  resolveBottleImageAsset,
  type BottleImageAsset,
} from "@/lib/catalog-bottle";
import {
  type CatalogItem,
  getMenCatalogItems,
  getWomenCatalogItems,
} from "@/lib/catalog";
import {
  hasAdminCredentialsConfigured,
  isAdminAuthenticated,
} from "@/lib/admin-auth";
import {
  getCatalogLabel,
  parseCatalogType,
  type CatalogType,
} from "@/lib/catalog-config";

import { FragranceForm } from "./fragrance-form";
import {
  createFragrance,
  deleteFragrance,
  signInAdmin,
  signOutAdmin,
  updateFragrance,
} from "./actions";

export const dynamic = "force-dynamic";

const ADMIN_PAGE_SIZE = 12;

type AdminCatalogItem = CatalogItem & {
  bottleAsset: BottleImageAsset;
};

type AdminPageProps = {
  searchParams: Promise<{
    catalog?: string | string[];
    error?: string | string[];
    focus?: string | string[];
    notice?: string | string[];
    page?: string | string[];
    q?: string | string[];
  }>;
};

type AdminCatalogFilter = CatalogType | "ALL";

type AdminListState = {
  catalog: AdminCatalogFilter;
  page: number;
  query: string;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [{ catalog, error, focus, notice, page, q }, isAuthenticated] =
    await Promise.all([searchParams, isAdminAuthenticated()]);
  const isConfigured = hasAdminCredentialsConfigured();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <section className="panel-soft w-full overflow-hidden rounded-[2rem]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-[linear-gradient(180deg,rgba(61,20,95,0.96)_0%,rgba(37,8,53,0.98)_100%)] px-6 py-10 text-white sm:px-8 sm:py-12">
              <p className="section-label text-[var(--color-gold-soft)]">
                Admin
              </p>
              <h1 className="mt-4 font-display text-4xl leading-none sm:text-[3.4rem]">
                Acceso administrativo
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/74 sm:text-base">
                Valida tus credenciales antes de entrar al panel. La sesión se
                guarda en una cookie segura del servidor.
              </p>
            </div>

            <div className="bg-[rgba(255,252,248,0.94)] px-6 py-10 sm:px-8 sm:py-12">
              <div className="max-w-md">
                <h2 className="font-display text-3xl text-[var(--color-plum-900)]">
                  Iniciar sesión
                </h2>

                {!isConfigured ? (
                  <div className="mt-6 rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm leading-7 text-red-700">
                    El acceso admin no está configurado todavía. Agrega
                    `username` y `password` en tu `.env`.
                  </div>
                ) : null}

                {resolveErrorMessage(error) ? (
                  <div className="mt-6 rounded-[1.6rem] border border-[rgba(220,176,103,0.32)] bg-[rgba(220,176,103,0.1)] px-5 py-4 text-sm leading-7 text-[var(--color-plum-900)]">
                    {resolveErrorMessage(error)}
                  </div>
                ) : null}

                <form action={signInAdmin} className="mt-8 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--color-plum-900)]">
                      Username
                    </span>
                    <div className="input-shell">
                      <input
                        required
                        name="username"
                        type="text"
                        autoComplete="username"
                        className="w-full border-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
                        placeholder="admin"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--color-plum-900)]">
                      Password
                    </span>
                    <div className="input-shell">
                      <input
                        required
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        className="w-full border-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
                        placeholder="••••••••"
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={!isConfigured}
                    className="inline-flex min-h-[3.35rem] w-full items-center justify-center rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-plum-950)] shadow-[0_12px_30px_rgba(20,6,33,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--color-gold-soft)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                  >
                    Entrar al admin
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  let items: CatalogItem[] = [];
  let adminItems: AdminCatalogItem[] = [];
  let loadError: string | null = null;

  try {
    const [menItems, womenItems] = await Promise.all([
      getMenCatalogItems(),
      getWomenCatalogItems(),
    ]);
    items = [...menItems, ...womenItems].sort(compareAdminItems);
    adminItems = await Promise.all(
      items.map(async (item) => ({
        ...item,
        bottleAsset: await resolveBottleImageAsset(
          item.catalog,
          item.slug,
          item.sourcePage,
          item.imagePath,
        ),
      })),
    );
  } catch (catalogError) {
    loadError =
      catalogError instanceof Error
        ? catalogError.message
        : "No se pudo cargar el catálogo desde Prisma.";
  }

  const currentCatalogFilter =
    parseCatalogType(normalizeSearchParam(catalog)) ?? "ALL";
  const availableCount = items.filter(
    (item) =>
      item.status === "ACTIVE" &&
      matchesCatalogFilter(item.catalog, currentCatalogFilter),
  ).length;
  const detailedCount = items.filter(
    (item) =>
      matchesCatalogFilter(item.catalog, currentCatalogFilter) &&
      hasManagedDetails(item),
  ).length;
  const normalizedFocus = normalizeSearchParam(focus);
  const normalizedNotice = normalizeSearchParam(notice);
  const currentQuery = normalizeSearchParam(q)?.trim() ?? "";
  const catalogScopedItems = items.filter((item) =>
    matchesCatalogFilter(item.catalog, currentCatalogFilter),
  );
  const catalogScopedAdminItems = adminItems.filter((item) =>
    matchesCatalogFilter(item.catalog, currentCatalogFilter),
  );
  const filteredAdminItems = filterAdminItems(
    catalogScopedAdminItems,
    currentQuery,
  );
  const totalFilteredItems = filteredAdminItems.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredItems / ADMIN_PAGE_SIZE),
  );
  const currentPage = Math.min(
    parsePositiveInteger(normalizeSearchParam(page)) ?? 1,
    totalPages,
  );
  const currentListState: AdminListState = {
    catalog: currentCatalogFilter,
    page: currentPage,
    query: currentQuery,
  };
  const sliceStart =
    totalFilteredItems === 0 ? 0 : (currentPage - 1) * ADMIN_PAGE_SIZE;
  const paginatedAdminItems = filteredAdminItems.slice(
    sliceStart,
    sliceStart + ADMIN_PAGE_SIZE,
  );
  const resultsStart = totalFilteredItems === 0 ? 0 : sliceStart + 1;
  const resultsEnd = Math.min(totalFilteredItems, sliceStart + ADMIN_PAGE_SIZE);
  const visiblePageNumbers = getVisiblePageNumbers(currentPage, totalPages);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
      <section className="panel-soft overflow-hidden rounded-[2rem]">
        <div className="flex flex-col gap-6 border-b border-[rgba(82,33,117,0.12)] px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[rgba(82,33,117,0.14)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-plum-900)] transition hover:-translate-y-0.5 hover:border-[rgba(220,176,103,0.58)] hover:text-[var(--color-gold-deep)]"
            >
              Volver al catálogo
            </Link>
            <p className="section-label">Admin</p>
            <h1 className="font-display text-4xl text-[var(--color-plum-900)] sm:text-[3.4rem]">
              Panel administrativo
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[var(--color-ink-soft)] sm:text-base">
              Administra fragancias completas desde Prisma: nombre, slug, orden,
              precios, notas, accords y resumen, sin salir del panel.
            </p>
          </div>

          <form action={signOutAdmin}>
            <button
              type="submit"
              className="inline-flex min-h-[3.2rem] items-center justify-center rounded-full border border-[rgba(82,33,117,0.16)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-plum-900)] transition hover:-translate-y-0.5 hover:border-[rgba(220,176,103,0.58)] hover:text-[var(--color-gold-deep)]"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="grid gap-4 px-6 py-8 sm:grid-cols-3 sm:px-8">
          <StatCard
            label="Total"
            value={String(catalogScopedItems.length)}
            description="Fragancias cargadas actualmente en la base de datos."
          />
          <StatCard
            label="Disponibles"
            value={String(availableCount)}
            description="Productos activos hoy dentro del catálogo."
          />
          <StatCard
            label="Con detalle"
            value={String(detailedCount)}
            description="Entradas con resumen, notes o accords editables."
          />
        </div>

        {resolveErrorMessage(error) ? (
          <div className="px-6 pb-2 sm:px-8">
            <MessagePanel tone="warning">
              {resolveErrorMessage(error)}
            </MessagePanel>
          </div>
        ) : null}

        {resolveNoticeMessage(normalizedNotice) ? (
          <div className="px-6 pb-2 sm:px-8">
            <MessagePanel tone="success">
              {resolveNoticeMessage(normalizedNotice)}
            </MessagePanel>
          </div>
        ) : null}

        {loadError ? (
          <div className="px-6 pb-2 sm:px-8">
            <MessagePanel tone="warning">{loadError}</MessagePanel>
          </div>
        ) : null}

        <div className="px-6 pb-8 pt-4 sm:px-8">
          {loadError ? (
            <div className="panel-card rounded-[1.75rem] p-6 text-sm leading-7 text-[var(--color-ink-soft)]">
              El panel de edición queda desactivado hasta que Prisma vuelva a
              responder correctamente.
            </div>
          ) : (
            <>
              <details
                className="expandable-panel panel-card overflow-hidden rounded-[1.75rem]"
                open={normalizedFocus === "create"}
              >
                <summary className="expandable-panel-summary cursor-pointer list-none px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="section-label">Nuevo cologne</p>
                      <h2 className="mt-3 font-display text-3xl text-[var(--color-plum-900)]">
                        Agregar fragancia
                      </h2>
                    </div>
                    <ExpandIndicator label="Toca o haz click para abrir" />
                  </div>
                </summary>

                <div className="border-t border-[rgba(82,33,117,0.08)] px-5 py-5 sm:px-6">
                  <FragranceForm
                    action={createFragrance}
                    defaultCatalog={
                      currentCatalogFilter === "ALL"
                        ? "MEN"
                        : currentCatalogFilter
                    }
                    formId="create-fragrance"
                    listState={currentListState}
                    submitLabel="Guardar nueva fragancia"
                  />
                </div>
              </details>

              <section className="mt-8 space-y-4">
                <div className="panel-card rounded-[1.75rem] p-5 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                      <p className="section-label">Inventario</p>
                      <h2 className="font-display text-3xl text-[var(--color-plum-900)]">
                        Editar fragancias existentes
                      </h2>
                      <p className="text-sm leading-7 text-[var(--color-ink-soft)]">
                        {totalFilteredItems === 0
                          ? currentQuery
                            ? `No hay coincidencias para "${currentQuery}".`
                            : getEmptyCatalogMessage(currentCatalogFilter)
                          : `Mostrando ${resultsStart}-${resultsEnd} de ${totalFilteredItems} fragancia${
                              totalFilteredItems === 1 ? "" : "s"
                            }.`}
                      </p>
                    </div>

                    <Form
                      action="/admin"
                      replace
                      scroll={false}
                      className="flex w-full max-w-4xl flex-col gap-3"
                    >
                      <div className="flex flex-wrap gap-2">
                        {buildCatalogFilterOptions(
                          currentCatalogFilter,
                          currentQuery,
                        ).map((option) => (
                          <Link
                            key={option.label}
                            href={option.href}
                            className={`inline-flex min-h-[3rem] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                              option.isActive
                                ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-plum-950)]"
                                : "border-[rgba(82,33,117,0.14)] bg-white text-[var(--color-plum-900)] hover:-translate-y-0.5 hover:border-[rgba(220,176,103,0.58)] hover:text-[var(--color-gold-deep)]"
                            }`}
                          >
                            {option.label}
                          </Link>
                        ))}
                      </div>

                      {currentCatalogFilter !== "ALL" ? (
                        <input
                          type="hidden"
                          name="catalog"
                          value={currentCatalogFilter}
                        />
                      ) : null}

                      <div className="flex w-full flex-col gap-3 sm:flex-row">
                        <label className="flex-1">
                          <span className="sr-only">Buscar fragancia</span>
                          <div className="input-shell">
                            <input
                              name="q"
                              type="search"
                              defaultValue={currentQuery}
                              className="w-full border-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
                              placeholder="Buscar por nombre, slug o resumen"
                            />
                          </div>
                        </label>
                        <button
                          type="submit"
                          className="inline-flex min-h-[3.2rem] items-center justify-center rounded-full bg-[var(--color-gold)] px-5 py-3 text-sm font-semibold text-[var(--color-plum-950)] transition hover:-translate-y-0.5 hover:bg-[var(--color-gold-soft)]"
                        >
                          Buscar
                        </button>
                        {currentQuery ? (
                          <Link
                            href={buildAdminPageHref({
                              catalog: currentCatalogFilter,
                              page: 1,
                              query: "",
                            })}
                            className="inline-flex min-h-[3.2rem] items-center justify-center rounded-full border border-[rgba(82,33,117,0.16)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-plum-900)] transition hover:-translate-y-0.5 hover:border-[rgba(220,176,103,0.58)] hover:text-[var(--color-gold-deep)]"
                          >
                            Limpiar
                          </Link>
                        ) : null}
                      </div>
                    </Form>
                  </div>
                </div>

                {catalogScopedItems.length === 0 ? (
                  <div className="panel-card rounded-[1.75rem] p-6 text-sm leading-7 text-[var(--color-ink-soft)]">
                    {getEmptyCatalogMessage(currentCatalogFilter)} Puedes crear
                    la primera desde el formulario de arriba.
                  </div>
                ) : totalFilteredItems === 0 ? (
                  <div className="panel-card rounded-[1.75rem] p-6 text-sm leading-7 text-[var(--color-ink-soft)]">
                    No encontramos fragancias que coincidan con tu búsqueda.
                    Prueba otro nombre, slug o parte del resumen.
                  </div>
                ) : (
                  paginatedAdminItems.map((item) => {
                    const updateAction = updateFragrance.bind(null, item.id);
                    const deleteAction = deleteFragrance.bind(null, item.id);
                    const noteCount =
                      item.notes.top.length +
                      item.notes.middle.length +
                      item.notes.base.length;

                    return (
                      <details
                        key={item.id}
                        className="expandable-panel panel-card overflow-hidden rounded-[1.75rem]"
                        open={normalizedFocus === buildAdminFocusValue(item)}
                      >
                        <summary className="expandable-panel-summary cursor-pointer list-none px-5 py-5 sm:px-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                              <BottleSnapshot
                                asset={item.bottleAsset}
                                name={item.fullName}
                              />

                              <div className="min-w-0">
                                <div className="flex flex-wrap gap-2.5">
                                  <span className="detail-chip w-fit bg-[rgba(220,176,103,0.14)] text-[var(--color-plum-900)]">
                                    {getCatalogLabel(item.catalog)}
                                  </span>
                                  <span className="detail-chip w-fit">
                                    {item.status === "ACTIVE"
                                      ? "Activo"
                                      : "Coming soon"}
                                  </span>
                                  <span className="detail-chip w-fit bg-white">
                                    /{item.slug}
                                  </span>
                                </div>

                                <h3 className="mt-4 font-display text-3xl text-[var(--color-plum-900)]">
                                  {item.fullName}
                                </h3>
                                <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">
                                  Orden {item.sourcePage} · {item.sizes.length}{" "}
                                  tamaño
                                  {item.sizes.length === 1 ? "" : "s"} ·{" "}
                                  {item.accords.length} accord
                                  {item.accords.length === 1 ? "" : "s"} ·{" "}
                                  {noteCount} note
                                  {noteCount === 1 ? "" : "s"} · imagen{" "}
                                  {resolveBottleAssetLabel(item.bottleAsset)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4 lg:items-end">
                              <div className="max-w-2xl text-sm leading-7 text-[var(--color-ink-soft)] lg:text-right">
                                {formatPriceSummary(item)}
                              </div>
                              <ExpandIndicator label="Toca o haz click para ver detalles" />
                            </div>
                          </div>
                        </summary>

                        <div className="border-t border-[rgba(82,33,117,0.08)] px-5 py-5 sm:px-6">
                          <FragranceForm
                            action={updateAction}
                            deleteAction={deleteAction}
                            formId={`edit-${item.id}`}
                            item={item}
                            listState={currentListState}
                            submitLabel="Guardar cambios"
                          />
                        </div>
                      </details>
                    );
                  })
                )}

                {totalPages > 1 ? (
                  <nav
                    aria-label="Paginación del inventario"
                    className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="text-sm leading-7 text-[var(--color-ink-soft)]">
                      Página {currentPage} de {totalPages}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={buildAdminPageHref({
                          catalog: currentCatalogFilter,
                          page: currentPage - 1,
                          query: currentQuery,
                        })}
                        aria-disabled={currentPage === 1}
                        className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full border border-[rgba(82,33,117,0.14)] bg-white px-4 text-sm font-semibold text-[var(--color-plum-900)] transition hover:-translate-y-0.5 hover:border-[rgba(220,176,103,0.58)] hover:text-[var(--color-gold-deep)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                      >
                        Anterior
                      </Link>

                      {visiblePageNumbers.map((pageNumber, index) =>
                        typeof pageNumber === "number" ? (
                          <Link
                            key={`page-${pageNumber}`}
                            href={buildAdminPageHref({
                              catalog: currentCatalogFilter,
                              page: pageNumber,
                              query: currentQuery,
                            })}
                            aria-current={
                              pageNumber === currentPage ? "page" : undefined
                            }
                            className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition ${
                              pageNumber === currentPage
                                ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-plum-950)]"
                                : "border-[rgba(82,33,117,0.14)] bg-white text-[var(--color-plum-900)] hover:-translate-y-0.5 hover:border-[rgba(220,176,103,0.58)] hover:text-[var(--color-gold-deep)]"
                            }`}
                          >
                            {pageNumber}
                          </Link>
                        ) : (
                          <span
                            key={`ellipsis-${index}`}
                            className="inline-flex h-11 min-w-11 items-center justify-center text-sm font-semibold text-[var(--color-ink-soft)]"
                          >
                            ...
                          </span>
                        ),
                      )}

                      <Link
                        href={buildAdminPageHref({
                          catalog: currentCatalogFilter,
                          page: currentPage + 1,
                          query: currentQuery,
                        })}
                        aria-disabled={currentPage === totalPages}
                        className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full border border-[rgba(82,33,117,0.14)] bg-white px-4 text-sm font-semibold text-[var(--color-plum-900)] transition hover:-translate-y-0.5 hover:border-[rgba(220,176,103,0.58)] hover:text-[var(--color-gold-deep)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                      >
                        Siguiente
                      </Link>
                    </div>
                  </nav>
                ) : null}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function MessagePanel({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "warning";
}) {
  if (tone === "success") {
    return (
      <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-800">
        {children}
      </div>
    );
  }

  return (
    <div className="rounded-[1.6rem] border border-[rgba(220,176,103,0.32)] bg-[rgba(220,176,103,0.1)] px-5 py-4 text-sm leading-7 text-[var(--color-plum-900)]">
      {children}
    </div>
  );
}

function ExpandIndicator({ label }: { label: string }) {
  return (
    <div className="pointer-events-none inline-flex items-center gap-3 self-start rounded-full border border-[rgba(82,33,117,0.12)] bg-white/88 px-3 py-2 text-left text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-plum-900)] shadow-[0_12px_30px_rgba(61,20,95,0.08)] lg:self-auto">
      <span>{label}</span>
      <span
        aria-hidden="true"
        className="expandable-panel-chevron inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(220,176,103,0.18)] text-[var(--color-plum-900)]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </span>
    </div>
  );
}

function BottleSnapshot({
  asset,
  name,
}: {
  asset: BottleImageAsset;
  name: string;
}) {
  return (
    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[1.35rem] border border-[rgba(220,176,103,0.24)] bg-[linear-gradient(180deg,rgba(255,252,248,0.98)_0%,rgba(246,235,222,0.96)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_36px_rgba(61,20,95,0.09)] sm:h-28 sm:w-24">
      <div
        aria-hidden="true"
        className="absolute inset-[12%] rounded-[1rem] bg-[radial-gradient(circle_at_40%_24%,rgba(255,255,255,0.92),rgba(255,255,255,0.12)_58%,transparent_78%)]"
      />
      <Image
        src={asset.src}
        alt={`Botella de ${name}`}
        fill
        unoptimized
        className={`relative object-contain p-2.5 ${
          asset.kind === "custom"
            ? "object-center"
            : "object-left [transform:translateX(10%)_scale(1.18)]"
        }`}
      />
    </div>
  );
}

function StatCard({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <article className="panel-card stat-card rounded-[1.75rem] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-gold-deep)]">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl text-[var(--color-plum-900)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">
        {description}
      </p>
    </article>
  );
}

function formatPriceSummary(item: CatalogItem) {
  return item.sizes
    .map((size) => `${size.sizeMl}ml - $${size.price.toFixed(2)}`)
    .join(" · ");
}

function compareAdminItems(left: CatalogItem, right: CatalogItem) {
  if (left.catalog !== right.catalog) {
    return left.catalog.localeCompare(right.catalog);
  }

  if (left.sourcePage !== right.sourcePage) {
    return left.sourcePage - right.sourcePage;
  }

  return left.fullName.localeCompare(right.fullName);
}

function filterAdminItems(items: AdminCatalogItem[], query: string) {
  if (!query) {
    return items;
  }

  const normalizedQuery = query.toLocaleLowerCase();

  return items.filter((item) => matchesAdminSearch(item, normalizedQuery));
}

function hasManagedDetails(item: CatalogItem) {
  return Boolean(
    item.summary ||
    item.accords.length ||
    item.moments.length ||
    item.notes.top.length ||
    item.notes.middle.length ||
    item.notes.base.length ||
    item.seasons.length,
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function matchesAdminSearch(item: AdminCatalogItem, normalizedQuery: string) {
  const searchableValues = [
    getCatalogLabel(item.catalog),
    item.fullName,
    item.slug,
    item.summary ?? "",
    item.rawText ?? "",
    String(item.sourcePage),
  ];

  return searchableValues.some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function buildAdminPageHref({
  catalog,
  page,
  query,
}: {
  catalog: AdminCatalogFilter;
  page: number;
  query: string;
}) {
  const searchParams = new URLSearchParams();

  if (catalog !== "ALL") {
    searchParams.set("catalog", catalog);
  }

  if (query) {
    searchParams.set("q", query);
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const queryString = searchParams.toString();

  return queryString ? `/admin?${queryString}` : "/admin";
}

function buildCatalogFilterOptions(
  currentCatalogFilter: AdminCatalogFilter,
  query: string,
) {
  return [
    {
      catalog: "ALL" as const,
      label: "Todos",
    },
    {
      catalog: "MEN" as const,
      label: "Caballeros",
    },
    {
      catalog: "WOMEN" as const,
      label: "Damas",
    },
  ].map((option) => ({
    ...option,
    href: buildAdminPageHref({
      catalog: option.catalog,
      page: 1,
      query,
    }),
    isActive: currentCatalogFilter === option.catalog,
  }));
}

function matchesCatalogFilter(
  catalog: CatalogType,
  filter: AdminCatalogFilter,
) {
  return filter === "ALL" || catalog === filter;
}

function buildAdminFocusValue(item: Pick<CatalogItem, "catalog" | "slug">) {
  return `${item.catalog}:${item.slug}`;
}

function resolveBottleAssetLabel(asset: BottleImageAsset) {
  switch (asset.kind) {
    case "custom":
      return "personalizada";
    case "pdf":
      return "PDF";
    case "placeholder":
      return "placeholder";
  }
}

function getEmptyCatalogMessage(filter: AdminCatalogFilter) {
  if (filter === "ALL") {
    return "No hay fragancias guardadas todavía en Prisma.";
  }

  return `No hay fragancias guardadas todavía en ${getCatalogLabel(filter).toLowerCase()}.`;
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ] as const;
}

function resolveErrorMessage(error: string | string[] | undefined) {
  const normalizedError = normalizeSearchParam(error);

  switch (normalizedError) {
    case "config":
      return "No se encontraron las credenciales del admin en el servidor.";
    case "duplicate-slug":
      return "Ese slug ya existe. Usa uno diferente para evitar conflictos en la ruta.";
    case "duplicate-source-page":
      return "Ese número de orden/source page ya está ocupado por otra fragancia.";
    case "invalid-credentials":
      return "Las credenciales no coinciden. Inténtalo de nuevo.";
    case "invalid-source-page":
      return "El campo de orden/source page debe ser un número entero mayor a cero.";
    case "invalid-status":
      return "El estado enviado no es válido.";
    case "invalid-image-file":
      return "La imagen seleccionada no se pudo leer correctamente.";
    case "invalid-moments":
      return "Los momentos enviados no son válidos.";
    case "invalid-seasons":
      return "Las temporadas enviadas no son válidas.";
    case "image-too-large":
      return "La imagen pesa demasiado. Usa un archivo de hasta 8MB.";
    case "missing-name":
      return "La fragancia necesita un nombre antes de guardarse.";
    case "missing-sizes":
      return "Agrega al menos un tamaño válido con su precio, por ejemplo `100|85`.";
    case "missing-slug":
      return "La fragancia necesita un slug válido.";
    case "not-found":
      return "La fragancia que intentaste editar ya no existe en la base de datos.";
    case "delete-failed":
      return "No se pudo eliminar la fragancia en Prisma. Revisa la conexión y vuelve a intentar.";
    case "save-failed":
      return "No se pudieron guardar los cambios en Prisma. Revisa la conexión y vuelve a intentar.";
    case "unsupported-image-type":
      return "El archivo de imagen debe ser PNG, JPG, WEBP o AVIF.";
    case "unauthorized":
      return "La sesión del admin ya no es válida. Inicia sesión de nuevo.";
    default:
      return null;
  }
}

function resolveNoticeMessage(notice: string | undefined) {
  switch (notice) {
    case "created":
      return "La nueva fragancia se guardó correctamente en Prisma.";
    case "deleted":
      return "La fragancia se eliminó correctamente.";
    case "updated":
      return "Los cambios de la fragancia se guardaron correctamente.";
    default:
      return null;
  }
}
