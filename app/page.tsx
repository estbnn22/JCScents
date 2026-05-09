import Image from "next/image";

import {
  CatalogBrowser,
  ITEMS_PER_PAGE,
  type StatusFilter,
} from "@/app/_components/catalog-browser";
import { resolveBottleImageAsset } from "@/lib/catalog-bottle";
import { loadMenCatalogItems } from "@/lib/catalog";
import { siteContactLinks } from "@/lib/site-contact-links";
import heroImage from "@/public/jcHero.png";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    status?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { page, q, status } = await searchParams;
  const { items } = await loadMenCatalogItems();
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
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#2c0b43_0%,#4d2171_45%,#f7f0e7_100%)]">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-22"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,6,33,0.6)_0%,rgba(20,6,33,0.76)_45%,rgba(20,6,33,0.86)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(241,213,148,0.14),transparent_32%),linear-gradient(145deg,rgba(44,11,67,0.9)_0%,rgba(77,33,113,0.74)_45%,rgba(247,240,231,0.08)_100%)]" />
        <div className="hero-aura absolute left-[-7rem] top-[-4rem] h-72 w-72 rounded-full" />
        <div className="hero-aura absolute bottom-[-8rem] right-[-4rem] h-96 w-96 rounded-full [animation-delay:1.3s]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent_0%,rgba(247,240,231,0.9)_100%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-12 lg:px-10 lg:py-16">
          <nav className="fade-in-up flex w-full max-w-5xl flex-col items-center gap-6 border-b border-white/12 pb-8 sm:pb-10">
            <div className="space-y-3">
              <p className="font-display text-[2.8rem] tracking-[0.14em] text-[var(--color-gold-soft)] sm:text-[3.85rem] lg:text-[4.65rem]">
                JC Scents
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/62 sm:text-sm sm:tracking-[0.34em]">
                Catálogo para caballeros
              </p>
              <ul className="grid grid-cols-2 gap-3 pt-2 sm:flex sm:flex-wrap sm:justify-center">
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
          </nav>

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
              Catálogo de caballeros
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <CatalogBrowser
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
