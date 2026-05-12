import Form from "next/form";
import Image from "next/image";
import Link from "next/link";

import type { BottleImageAsset } from "@/lib/catalog-bottle";
import type { CatalogType } from "@/lib/catalog-config";
import {
  buildCatalogCollectionHref,
  buildCatalogItemHref,
} from "@/lib/catalog-links";
import type { CatalogItem } from "@/lib/catalog";

export type StatusFilter = "all" | "ACTIVE" | "COMING_SOON";
type CatalogBrowserItem = CatalogItem & {
  bottleAsset: BottleImageAsset;
};
type PageToken = number | "ellipsis";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const statusFilters: Array<{
  value: StatusFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "ACTIVE", label: "Disponibles" },
  { value: "COMING_SOON", label: "Coming soon" },
];

export const ITEMS_PER_PAGE = 12;

function getPaginationTokens(
  currentPage: number,
  totalPages: number,
): PageToken[] {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

export function CatalogBrowser({
  catalog,
  items,
  currentPage,
  query,
  status,
  totalPages,
  totalVisibleItems,
}: {
  catalog: CatalogType;
  items: CatalogBrowserItem[];
  currentPage: number;
  query: string;
  status: StatusFilter;
  totalPages: number;
  totalVisibleItems: number;
}) {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + items.length;
  const paginationTokens = getPaginationTokens(currentPage, totalPages);

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="panel-soft rounded-[2rem] p-5 sm:rounded-[2.4rem] sm:p-6 lg:p-7">
        <Form
          action="/#catalogo"
          scroll={false}
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5"
        >
          {catalog !== "MEN" ? (
            <input type="hidden" name="catalog" value={catalog} />
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-1">
            <label className="input-shell flex-1">
              <span className="sr-only">Buscar fragancia</span>
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Buscar por nombre, línea o perfume..."
                className="w-full border-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
              />
            </label>

            {status !== "all" ? (
              <input type="hidden" name="status" value={status} />
            ) : null}

            <button type="submit" className="filter-pill w-full sm:w-auto">
              Buscar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
            {statusFilters.map((filter) => {
              const isActive = filter.value === status;

              return (
                <Link
                  key={filter.value}
                  href={buildCatalogCollectionHref({
                    catalog,
                    page: 1,
                    query,
                    status: filter.value,
                  })}
                  scroll={false}
                  className={`filter-pill ${
                    filter.value === "COMING_SOON"
                      ? "col-span-2 sm:col-span-1"
                      : ""
                  } ${isActive ? "filter-pill-active" : ""}`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </Form>

        <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
          {totalVisibleItems > 0
            ? `Mostrando ${startIndex + 1}-${Math.min(endIndex, totalVisibleItems)} de ${totalVisibleItems} fragancias.`
            : "Mostrando 0 fragancias."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-7 xl:grid-cols-3">
        {items.map((item) => {
          const usesNaturalBottleLayout = item.bottleAsset.kind !== "pdf";
          const startingPrice = Math.min(
            ...item.sizes.map((size) => size.price),
          );
          const extraSizeCount = Math.max(item.sizes.length - 1, 0);

          return (
            <Link
              key={item.id}
              href={buildCatalogItemHref(item.slug, catalog)}
              className="group block h-full"
            >
              <article
                className={`catalog-card relative flex h-full flex-col overflow-hidden rounded-[2.25rem] p-[1.125rem] transition duration-200 group-hover:-translate-y-1.5 group-hover:shadow-[0_32px_80px_rgba(43,18,62,0.16)] sm:rounded-[2.8rem] sm:p-6 lg:p-7 ${
                  item.status === "COMING_SOON" ? "catalog-card-soon" : ""
                }`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)]"
                />

                <div className="catalog-card-media mb-6 flex items-center justify-center rounded-[1.95rem] px-4 py-6 sm:mb-8 sm:rounded-[2.25rem] sm:px-6 sm:py-7">
                  <div className="catalog-card-bottle-shell relative overflow-hidden rounded-full">
                    <div
                      aria-hidden="true"
                      className="catalog-card-bottle-halo absolute inset-[10%] rounded-full"
                    />
                    <div className="catalog-card-bottle-stage absolute inset-[15%] sm:inset-[16%]">
                      <Image
                        src={item.bottleAsset.src}
                        alt={`Botella de ${item.fullName}`}
                        width={640}
                        height={640}
                        unoptimized
                        className={`catalog-card-bottle-image ${
                          usesNaturalBottleLayout
                            ? "catalog-card-bottle-image-custom"
                            : ""
                        }`}
                        style={
                          usesNaturalBottleLayout
                            ? undefined
                            : {
                                transform: `translate(calc(${item.bottleTranslateX} + 24%), ${item.bottleTranslateY}) scale(${item.bottleScale})`,
                              }
                        }
                        sizes="(min-width: 1280px) 16rem, (min-width: 640px) 14rem, 8rem"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 sm:space-y-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] sm:px-3.5 sm:text-[11px] sm:tracking-[0.24em] ${
                        item.status === "COMING_SOON"
                          ? "bg-[rgba(220,176,103,0.16)] text-[var(--color-gold-deep)]"
                          : "bg-[rgba(61,20,95,0.08)] text-[var(--color-plum-900)]"
                      }`}
                    >
                      {item.status === "COMING_SOON"
                        ? "Coming Soon"
                        : "Disponible"}
                    </span>
                    <h3 className="catalog-card-title font-display text-lg leading-[1.05] text-[var(--color-plum-900)] sm:text-2xl lg:text-3xl">
                      {item.fullName}
                    </h3>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.65rem] border border-[rgba(82,33,117,0.08)] bg-[rgba(247,240,231,0.72)] p-[1.125rem] sm:hidden">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
                    Desde
                  </p>
                  <p className="mt-1 font-display text-xl text-[var(--color-plum-900)]">
                    {currencyFormatter.format(startingPrice)}
                  </p>
                  {extraSizeCount > 0 ? (
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                      +{extraSizeCount} tamaños más
                    </p>
                  ) : null}
                </div>

                <div className="mt-7 hidden gap-3 sm:grid sm:grid-cols-3">
                  {item.sizes.map((size) => (
                    <div
                      key={`${item.id}-${size.sizeMl}`}
                      className="price-pill rounded-[1.7rem] p-[1.125rem]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
                        {size.sizeMl}ml
                      </p>
                      <p className="mt-2 font-display text-2xl text-[var(--color-plum-900)]">
                        {currencyFormatter.format(size.price)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6 sm:pt-8">
                  <div className="h-px bg-[linear-gradient(90deg,rgba(82,33,117,0.06),rgba(82,33,117,0.18),rgba(82,33,117,0.06))]" />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-plum-900)] sm:mt-5 sm:text-sm sm:normal-case sm:tracking-normal">
                  <span className="hidden sm:inline">Ver detalles</span>
                  <span className="sm:hidden">Abrir</span>
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    &rarr;
                  </span>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {totalVisibleItems === 0 ? (
        <div className="panel-card rounded-[2rem] p-8 text-center text-[var(--color-ink-soft)]">
          No encontramos fragancias con esos filtros. Intenta con otro nombre o
          cambia el estado.
        </div>
      ) : null}

      {totalVisibleItems > 0 && totalPages > 1 ? (
        <div className="panel-soft flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[2.3rem] sm:p-6">
          <p className="text-sm text-[var(--color-ink-soft)]">
            Pág. {currentPage} de {totalPages}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {currentPage === 1 ? (
              <span
                aria-disabled="true"
                className="filter-pill cursor-not-allowed opacity-45"
              >
                Anterior
              </span>
            ) : (
              <Link
                href={buildCatalogCollectionHref({
                  catalog,
                  page: currentPage - 1,
                  query,
                  status,
                })}
                scroll={false}
                className="filter-pill"
              >
                Anterior
              </Link>
            )}

            {paginationTokens.map((token, index) => {
              if (token === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    aria-hidden="true"
                    className="px-1 text-sm font-semibold tracking-[0.18em] text-[var(--color-ink-soft)]"
                  >
                    ...
                  </span>
                );
              }

              const isActive = token === currentPage;

              return (
                <Link
                  key={token}
                  href={buildCatalogCollectionHref({
                    catalog,
                    page: token,
                    query,
                    status,
                  })}
                  scroll={false}
                  aria-current={isActive ? "page" : undefined}
                  className={`filter-pill inline-flex min-w-10 items-center justify-center sm:min-w-12 ${
                    isActive ? "filter-pill-active" : ""
                  }`}
                >
                  {token}
                </Link>
              );
            })}

            {currentPage === totalPages ? (
              <span
                aria-disabled="true"
                className="filter-pill cursor-not-allowed opacity-45"
              >
                Siguiente
              </span>
            ) : (
              <Link
                href={buildCatalogCollectionHref({
                  catalog,
                  page: currentPage + 1,
                  query,
                  status,
                })}
                scroll={false}
                className="filter-pill"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
