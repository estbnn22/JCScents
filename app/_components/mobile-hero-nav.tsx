"use client";

import Link from "next/link";
import { useState } from "react";

import {
  useCatalogControls,
} from "@/app/_components/catalog-controls-provider";
import { CatalogLiveSearch } from "@/app/_components/catalog-live-search";
import {
  getCatalogLabel,
  type CatalogType,
} from "@/lib/catalog-config";
import { buildCatalogCollectionHref } from "@/lib/catalog-links";
import { siteContactLinks } from "@/lib/site-contact-links";

export function MobileHeroNav({
  selectedCatalog,
}: {
  selectedCatalog: CatalogType;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { query, setQuery } = useCatalogControls();

  return (
    <div
      className="mobile-nav group sm:hidden"
      data-open={isOpen ? "true" : "false"}
    >
      <button
        type="button"
        aria-controls="mobile-hero-nav-drawer"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Cerrar menu de navegacion" : "Abrir menu de navegacion"}
        className="mobile-nav-button flex w-full items-center justify-between gap-3 rounded-[1.7rem] border border-white/12 bg-white/8 px-4 py-3.5 text-left shadow-[0_18px_44px_rgba(20,6,33,0.18)] backdrop-blur-[8px]"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.85rem] leading-none tracking-[0.08em] text-[var(--color-gold-soft)]">
            JC Scents
          </span>
          <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.24em] text-white/62">
            Catalogo de fragancias
          </span>
        </span>
        <span className="mobile-nav-trigger shrink-0" aria-hidden="true">
          <span className="mobile-nav-trigger-label">Menu</span>
          <span className="mobile-nav-icon">
            <span className="mobile-nav-line" />
            <span className="mobile-nav-line" />
            <span className="mobile-nav-line" />
          </span>
        </span>
      </button>

      {isOpen ? (
        <div
          id="mobile-hero-nav-drawer"
          className="mobile-nav-drawer mt-3 rounded-[1.9rem] border border-white/12 bg-[linear-gradient(180deg,rgba(34,10,48,0.9)_0%,rgba(29,9,41,0.96)_100%)] p-4 shadow-[0_28px_60px_rgba(20,6,33,0.28)] backdrop-blur-[14px]"
        >
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <p className="font-display text-[2.15rem] leading-none tracking-[0.08em] text-[var(--color-gold-soft)]">
                JC Scents
              </p>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/62">
                Menu de navegacion
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-white/12 bg-white/7 p-4 shadow-[0_18px_44px_rgba(20,6,33,0.18)]">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2">
                  {([
                    { value: "MEN" },
                    { value: "WOMEN" },
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
                        onClick={() => setIsOpen(false)}
                      >
                        {getCatalogLabel(option.value)}
                      </Link>
                    );
                  })}
                </div>

                <CatalogLiveSearch
                  query={query}
                  onQueryChange={setQuery}
                  placeholder="Buscar perfumes, colognes o marcas..."
                  srLabel="Buscar perfumes o colognes"
                  formClassName="flex flex-col gap-3"
                  labelClassName="flex-1 rounded-full border border-white/12 bg-white/9 px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                  inputClassName="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/52"
                  buttonClassName="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-plum-950)] shadow-[0_14px_32px_rgba(20,6,33,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--color-gold-soft)]"
                  buttonText="Search"
                  onSubmitComplete={() => setIsOpen(false)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <ul className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
                {siteContactLinks.map((link) => (
                  <li key={link.label}>
                    {"href" in link ? (
                      <a
                        href={link.href}
                        className="footer-link"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span className="footer-link">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
