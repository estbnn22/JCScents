import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { resolveBottleImageAsset } from "@/lib/catalog-bottle";
import { getMenCatalogItemBySlug, getStaticMenCatalogItems } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const momentLabels = {
  day: "Day",
  night: "Night",
} as const;

const seasonLabels = {
  fall: "Fall",
  spring: "Spring",
  summer: "Summer",
  winter: "Winter",
} as const;

const sizeExampleAssets = {
  3: {
    src: "/eg/3ML.png",
    width: 320,
    height: 320,
  },
  5: {
    src: "/eg/5ML.png",
    width: 320,
    height: 320,
  },
  10: {
    src: "/eg/10ML.png",
    width: 320,
    height: 320,
  },
} as const;

export async function generateStaticParams() {
  return getStaticMenCatalogItems().map((item) => ({
    slug: item.slug,
  }));
}

export default async function CatalogDetailPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  const { item, previousItem, nextItem } = await getMenCatalogItemBySlug(slug);

  if (!item) {
    notFound();
  }

  const bottleAsset = await resolveBottleImageAsset(
    item.slug,
    item.sourcePage,
    item.imagePath,
  );
  const isCustomBottle = bottleAsset.kind === "custom";

  return (
    <main className="bg-[var(--color-ivory)] text-[var(--color-ink)]">
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#2c0b43_0%,#4d2171_45%,#f7f0e7_100%)]">
        <div className="hero-aura absolute left-[-8rem] top-[-4rem] h-72 w-72 rounded-full" />
        <div className="hero-aura absolute bottom-[-10rem] right-[-5rem] h-96 w-96 rounded-full [animation-delay:1.4s]" />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6 lg:gap-6 lg:px-8 lg:py-7">
          <div className="fade-in-up flex flex-col gap-3 border-b border-white/12 pb-3 text-white/78 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pb-4">
            <Link
              href="/#catalogo"
              className="inline-flex items-center rounded-full border border-white/18 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition hover:border-[var(--color-gold)] hover:text-white sm:text-xs"
            >
              Volver al catálogo
            </Link>

            <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 text-[0.68rem] uppercase tracking-[0.22em] sm:mx-0 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:px-0 sm:pb-0 sm:text-xs sm:tracking-[0.24em]">
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-2">
                {item.status === "COMING_SOON" ? "Coming Soon" : "Disponible"}
              </span>
              <span className="rounded-full border border-white/12 bg-white/6 px-3 py-2">
                {item.sizes.map((size) => `${size.sizeMl}ML`).join(" / ")}
              </span>
            </div>
          </div>

          <div className="fade-in-up flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="font-display text-3xl leading-[0.95] text-white sm:text-[2.9rem] lg:text-[3.6rem]">
                {item.fullName}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/76 sm:text-[0.96rem] sm:leading-7 lg:text-base">
                {item.summary ??
                  "Una fragancia con presencia elegante y una ficha clara para revisar tamanos, precios y detalles de un vistazo."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start">
              <CatalogPagerArrow
                direction="previous"
                item={previousItem}
              />
              <CatalogPagerArrow
                direction="next"
                item={nextItem}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.84fr)_minmax(0,1.16fr)] lg:items-start lg:gap-5">
            <div className="fade-in-up space-y-4 sm:grid sm:items-start sm:gap-4 sm:[grid-template-columns:minmax(0,0.92fr)_minmax(0,1.08fr)] lg:block lg:space-y-4">
              <div className="catalog-bottle-frame relative overflow-hidden rounded-[1.35rem] border border-white/10 sm:rounded-[1.6rem]">
                <Image
                  src={bottleAsset.src}
                  alt={`Botella de ${item.fullName}`}
                  fill
                  unoptimized
                  priority
                  className={`catalog-bottle-art ${isCustomBottle ? "catalog-bottle-art-custom" : ""}`}
                  style={
                    isCustomBottle
                      ? undefined
                      : {
                          transform: `translate(calc(${item.bottleTranslateX} + 24%), ${item.bottleTranslateY}) scale(${item.bottleScale})`,
                        }
                  }
                />
              </div>

              <div className="panel-dark rounded-[1.35rem] p-3.5 text-[var(--color-cream)] sm:rounded-[1.6rem] sm:p-4">
                <p className="section-label text-[var(--color-gold-soft)]">
                  Precios por tamaño
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
                  {item.sizes.map((size) => {
                    const exampleAsset =
                      sizeExampleAssets[size.sizeMl as keyof typeof sizeExampleAssets];

                    return (
                      <div
                        key={`${item.id}-${size.sizeMl}`}
                        className="flex flex-col items-center rounded-[1rem] border border-white/10 bg-white/6 p-2.5 text-center sm:rounded-[1.15rem] sm:p-3"
                      >
                        {exampleAsset ? (
                          <Image
                            src={exampleAsset.src}
                            alt={`Ejemplo del frasco de ${size.sizeMl}ml`}
                            width={exampleAsset.width}
                            height={exampleAsset.height}
                            className="h-auto w-full max-w-[6.2rem] object-contain sm:max-w-[7rem] lg:max-w-[7.1rem]"
                          />
                        ) : (
                          <div className="flex h-24 w-full max-w-[6.2rem] items-center justify-center rounded-[0.9rem] border border-dashed border-white/18 bg-white/4 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/62 sm:h-28 sm:max-w-[7rem] lg:h-28 lg:max-w-[7.1rem]">
                            {size.sizeMl}ML
                          </div>
                        )}

                        <p className="mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/62 sm:text-[0.68rem] sm:tracking-[0.2em]">
                          {size.sizeMl}ml
                        </p>
                        <p className="mt-1 font-display text-lg text-white sm:text-[1.55rem] lg:text-2xl xl:text-lg">
                          {currencyFormatter.format(size.price)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="fade-in-up fade-delay-1 space-y-4">
              <div className="panel-card rounded-[1.35rem] p-4 sm:rounded-[1.6rem] sm:p-5">
                <p className="section-label">Momentos y temporadas</p>

                <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-2.5">
                  {item.moments.map((moment) => (
                    <span key={moment} className="detail-chip detail-chip-active">
                      {momentLabels[moment]}
                    </span>
                  ))}
                  {item.seasons.map((season) => (
                    <span key={season} className="detail-chip">
                      {seasonLabels[season]}
                    </span>
                  ))}
                  {item.moments.length === 0 && item.seasons.length === 0 ? (
                    <span className="detail-empty">
                      Aun no hay momentos o temporadas guardados para esta fragancia.
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="panel-card rounded-[1.35rem] p-4 sm:rounded-[1.6rem] sm:p-5">
                <p className="section-label">Main Accords</p>
                <div className="mt-3 space-y-2.5 sm:mt-4">
                  {item.accords.length > 0 ? (
                    item.accords.map((accord, index) => (
                      <div key={accord.name} className="accord-row">
                        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[var(--color-plum-900)]">
                          <span>{accord.name}</span>
                          <span className="text-[var(--color-ink-soft)]">{accord.strength}%</span>
                        </div>
                        <div className="accord-track">
                          <div
                            className="accord-fill"
                            style={{
                              "--accord-color": accord.color,
                              "--accord-delay": `${index * 90}ms`,
                              "--accord-width": `${accord.strength}%`,
                            } as CSSProperties}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="detail-empty">
                      Todavía no hay accords estructurados para esta fragancia.
                    </p>
                  )}
                </div>
              </div>

              <NotesPanel item={item} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function NotesPanel({
  item,
}: {
  item: NonNullable<Awaited<ReturnType<typeof getMenCatalogItemBySlug>>["item"]>;
}) {
  return (
    <section className="panel-soft rounded-[1.35rem] p-4 sm:rounded-[1.6rem] sm:p-5">
      <p className="section-label">Notes</p>
      <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-3">
        <NoteGroupSection title="Top Notes" notes={item.notes.top} />
        <NoteGroupSection title="Middle Notes" notes={item.notes.middle} />
        <NoteGroupSection title="Base Notes" notes={item.notes.base} />
      </div>
    </section>
  );
}

function NoteGroupSection({ notes, title }: { notes: string[]; title: string }) {
  return (
    <section className="rounded-[1.1rem] border border-[rgba(82,33,117,0.1)] bg-white/50 p-3.5 sm:rounded-[1.2rem] sm:p-4">
      <p className="section-label">{title}</p>
      {notes.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-2 sm:gap-2.5">
          {notes.map((note) => (
            <span key={note} className="note-chip">
              {note}
            </span>
          ))}
        </div>
      ) : (
        <p className="detail-empty mt-3">Aun no hay datos cargados para esta sección.</p>
      )}
    </section>
  );
}

function CatalogPagerArrow({
  direction,
  item,
}: {
  direction: "previous" | "next";
  item: Awaited<ReturnType<typeof getMenCatalogItemBySlug>>["item"];
}) {
  const arrow = direction === "previous" ? "\u2190" : "\u2192";
  const label = direction === "previous" ? "Fragancia anterior" : "Siguiente fragancia";

  if (!item) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-lg text-white/28 sm:h-11 sm:w-11 sm:text-xl"
        title={label}
      >
        {arrow}
      </span>
    );
  }

  return (
    <Link
      href={`/catalog/${item.slug}`}
      aria-label={`${label}: ${item.fullName}`}
      title={`${label}: ${item.fullName}`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/16 bg-white/8 text-lg text-white transition hover:-translate-y-0.5 hover:border-[var(--color-gold)] hover:text-[var(--color-gold-soft)] sm:h-11 sm:w-11 sm:text-xl"
    >
      {arrow}
    </Link>
  );
}
