import Form from "next/form";
import Image from "next/image";
import Link from "next/link";

import {
  CatalogBrowser,
  ITEMS_PER_PAGE,
  type StatusFilter,
} from "@/app/_components/catalog-browser";
import { MobileHeroNav } from "@/app/_components/mobile-hero-nav";
import { resolveBottleImageAsset } from "@/lib/catalog-bottle";
import {
  type CatalogType,
  defaultCatalogType,
  parseCatalogType,
} from "@/lib/catalog-config";
import { buildCatalogCollectionHref } from "@/lib/catalog-links";
import { loadCatalogItems } from "@/lib/catalog";
import { siteContactLinks } from "@/lib/site-contact-links";
import heroImage from "@/public/jcHero.png";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    catalog?: string | string[];
    page?: string | string[];
    q?: string | string[];
    status?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { catalog, page, q, status } = await searchParams;
  const selectedCatalog =
    parseCatalogType(normalizeSearchParam(catalog)) ?? defaultCatalogType;
  const { items } = await loadCatalogItems(selectedCatalog);
  const currentQuery = normalizeSearchParam(q).trim();
  const currentStatus = normalizeStatusFilter(normalizeSearchParam(status));
  const filteredItems = items.filter((item) => {
    const matchesQuery =
      currentQuery.length === 0 ||
      item.fullName.toLowerCase().includes(currentQuery.toLowerCase());
    const matchesStatus = currentStatus === "all" || item.status === currentStatus;

    return matchesQuery && matchesStatus;
  });
  const totalFilteredItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(
    parsePositiveInteger(normalizeSearchParam(page)) ?? 1,
    totalPages,
  );
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const itemsWithBottleAssets = await Promise.all(
    paginatedItems.map(async (item) => ({
      ...item,
      bottleAsset: await resolveBottleImageAsset(
        item.catalog,
        item.slug,
        item.sourcePage,
        item.imagePath,
      ),
    })),
  );

  const activeItems = items.filter((item) => item.status === "ACTIVE");
  const availableCount = activeItems.length;
  const comingSoonCount = items.length - availableCount;
  const averageStartingPrice =
    activeItems.length > 0
      ? activeItems.reduce((total, item) => {
          const startingPrice = Math.min(
            ...item.sizes.map((size) => size.price),
          );

          return total + startingPrice;
        }, 0) / activeItems.length
      : 0;

  return (
    <main className="bg-[var(--color-ivory)] text-[var(--color-ink)]">
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#2c0b43_0%,#4d2171_42%,#250835_100%)]">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-22"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,6,33,0.6)_0%,rgba(20,6,33,0.76)_45%,rgba(20,6,33,0.86)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(241,213,148,0.14),transparent_32%),linear-gradient(145deg,rgba(44,11,67,0.9)_0%,rgba(77,33,113,0.74)_45%,rgba(37,8,53,0.22)_100%)]" />
        <div className="hero-aura absolute left-[-7rem] top-[-4rem] h-72 w-72 rounded-full" />
        <div className="hero-aura absolute bottom-[-8rem] right-[-4rem] h-96 w-96 rounded-full [animation-delay:1.3s]" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-12 lg:px-10 lg:py-16">
          <div className="fade-in-up flex w-full max-w-6xl flex-col gap-6 border-b border-white/12 pb-8 text-left sm:pb-10">
            <MobileHeroNav
              currentQuery={currentQuery}
              currentStatus={currentStatus}
              selectedCatalog={selectedCatalog}
            />

            <nav className="hidden flex-col gap-6 sm:flex">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3 text-center lg:text-left">
                  <p className="font-display text-[2.8rem] tracking-[0.14em] text-[var(--color-gold-soft)] sm:text-[3.85rem] lg:text-[4.65rem]">
                    JC Scents
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/62 sm:text-sm sm:tracking-[0.34em]">
                    Catálogo de fragancias
                  </p>
                </div>

                <div className="w-full max-w-3xl rounded-[1.9rem] border border-white/12 bg-white/8 p-4 shadow-[0_22px_60px_rgba(20,6,33,0.22)] backdrop-blur-[8px] sm:p-5">
                  <div className="flex flex-col gap-4">
                    <CatalogToggleLinks selectedCatalog={selectedCatalog} />
                    <CatalogSearchForm
                      currentQuery={currentQuery}
                      currentStatus={currentStatus}
                      selectedCatalog={selectedCatalog}
                    />
                  </div>
                </div>
              </div>

              <ContactLinkList />
            </nav>
          </div>

          <div className="mt-10 flex w-full max-w-5xl flex-col items-center gap-8 sm:mt-14 sm:gap-10 lg:mt-[4.5rem]">
            <div className="fade-in-up space-y-6 rounded-[2rem] border border-white/10 bg-white/7 px-4 py-6 shadow-[0_26px_70px_rgba(20,6,33,0.2)] backdrop-blur-[6px] sm:rounded-[2.5rem] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <p className="section-label mx-auto w-fit text-[var(--color-gold-soft)]">
                La elegancia hecha catálogo
              </p>
              <h1 className="mx-auto max-w-4xl font-display text-[3.35rem] leading-[0.9] text-white sm:text-[4rem] lg:text-[4rem]">
                La fragancia de tus sueños, ahora al alcance de tus manos.
              </h1>
              <p className="mx-auto max-w-3xl px-2 text-base leading-7 text-white/78 sm:px-0 sm:text-xl sm:leading-9">
                En JC Scents acercamos el lujo a tus manos y te permitimos
                explorar perfumes exclusivos a un precio accesible.
              </p>
            </div>

            <div className="fade-in-up fade-delay-1 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <a
                href="#catalogo"
                className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[var(--color-gold)] px-8 py-4 text-sm font-semibold text-[var(--color-plum-950)] shadow-[0_14px_32px_rgba(20,6,33,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--color-gold-soft)] sm:w-auto"
              >
                Explorar fragancias
              </a>
            </div>

            <div className="fade-in-up fade-delay-2 grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
              <article className="rounded-[2rem] border border-white/12 bg-white/10 p-5 text-center shadow-[0_24px_70px_rgba(20,6,33,0.22)] backdrop-blur sm:rounded-[2.3rem] sm:p-6">
                <p className="font-display text-3xl text-[var(--color-gold-soft)] sm:text-4xl">
                  {items.length}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/76 sm:mt-3 sm:text-sm sm:leading-6">
                  fragancias en el catálogo actual.
                </p>
              </article>
              <article className="rounded-[2rem] border border-white/12 bg-white/10 p-5 text-center shadow-[0_24px_70px_rgba(20,6,33,0.22)] backdrop-blur sm:rounded-[2.3rem] sm:p-6">
                <p className="font-display text-4xl text-[var(--color-gold-soft)]">
                  {availableCount}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/76 sm:mt-3 sm:text-sm sm:leading-6">
                  disponibles hoy.
                </p>
              </article>
              <article className="rounded-[2rem] border border-white/12 bg-white/10 p-5 text-center shadow-[0_24px_70px_rgba(20,6,33,0.22)] backdrop-blur sm:rounded-[2.3rem] sm:p-6">
                <p className="font-display text-3xl text-[var(--color-gold-soft)] sm:text-4xl">
                  ${averageStartingPrice.toFixed(0)}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/76 sm:mt-3 sm:text-sm sm:leading-6">
                  precio promedio de entrada.{" "}
                  <span className="inline">
                    Hay {comingSoonCount} fragancias próximamente.
                  </span>
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section
        id="catalogo"
        className="catalog-shell mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24"
      >
        <div className="catalog-intro-panel flex flex-col gap-6 rounded-[2rem] px-5 py-6 sm:rounded-[2.6rem] sm:px-7 sm:py-8 lg:flex-row lg:items-end lg:justify-between lg:px-9">
          <div className="max-w-3xl space-y-3">
            <p className="section-label">Colección</p>
            <h2 className="font-display text-3xl leading-tight text-[var(--color-plum-900)] sm:text-4xl lg:text-5xl">
              Catálogo de fragancias
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <CatalogBrowser
            catalog={selectedCatalog}
            items={itemsWithBottleAssets}
            currentPage={currentPage}
            query={currentQuery}
            status={currentStatus}
            totalPages={totalPages}
            totalVisibleItems={totalFilteredItems}
          />
        </div>
      </section>
    </main>
  );
}

type HeroNavProps = {
  currentQuery: string;
  currentStatus: StatusFilter;
  selectedCatalog: CatalogType;
};

function CatalogToggleLinks({
  selectedCatalog,
  mobile = false,
}: {
  selectedCatalog: CatalogType;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile
          ? "grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2"
          : "flex flex-wrap gap-2.5"
      }
    >
      {([
        { value: "MEN", label: "Men Catalog" },
        { value: "WOMEN", label: "Women Catalog" },
      ] as const).map((option) => {
        const isActive = option.value === selectedCatalog;

        return (
          <Link
            key={option.value}
            href={buildCatalogCollectionHref({
              catalog: option.value,
              page: 1,
              query: "",
              status: "all",
            })}
            scroll={false}
            className={`inline-flex min-h-[3rem] items-center justify-center rounded-full border px-5 py-3 text-center text-sm font-semibold transition ${
              isActive
                ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-plum-950)]"
                : "border-white/14 bg-white/7 text-white hover:-translate-y-0.5 hover:border-[var(--color-gold-soft)] hover:text-[var(--color-gold-soft)]"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

function CatalogSearchForm({
  currentQuery,
  currentStatus,
  selectedCatalog,
  mobile = false,
}: HeroNavProps & {
  mobile?: boolean;
}) {
  return (
    <Form
      action="/#catalogo"
      scroll={false}
      className={`flex flex-col gap-3 ${mobile ? "" : "sm:flex-row sm:items-center"}`}
    >
      {selectedCatalog !== defaultCatalogType ? (
        <input type="hidden" name="catalog" value={selectedCatalog} />
      ) : null}
      {currentStatus !== "all" ? (
        <input type="hidden" name="status" value={currentStatus} />
      ) : null}
      <label className="flex-1 rounded-full border border-white/12 bg-white/9 px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <span className="sr-only">Buscar perfumes o colognes</span>
        <input
          type="search"
          name="q"
          defaultValue={currentQuery}
          placeholder="Buscar perfumes, colognes o marcas..."
          className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/52"
        />
      </label>
      <button
        type="submit"
        className={`inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-plum-950)] shadow-[0_14px_32px_rgba(20,6,33,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--color-gold-soft)] ${
          mobile ? "w-full" : ""
        }`}
      >
        Search
      </button>
    </Form>
  );
}

function ContactLinkList({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? "space-y-3" : "space-y-3 text-center"}>
      <ul
        className={
          mobile
            ? "grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2"
            : "grid grid-cols-2 gap-3 pt-2 sm:flex sm:flex-wrap sm:justify-center"
        }
      >
        {siteContactLinks.map((link) => (
          <li key={link.label}>
            {"href" in link ? (
              <a href={link.href} className="footer-link">
                {link.label}
              </a>
            ) : (
              <span className="footer-link">{link.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function normalizeSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizeStatusFilter(value: string): StatusFilter {
  return value === "ACTIVE" || value === "COMING_SOON" ? value : "all";
}

function parsePositiveInteger(value: string) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}
