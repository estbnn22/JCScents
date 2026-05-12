"use client";

import { CatalogLiveSearch } from "@/app/_components/catalog-live-search";
import { useCatalogControls } from "@/app/_components/catalog-controls-provider";

export function CatalogHeroSearchForm({ mobile = false }: { mobile?: boolean }) {
  const { query, setQuery } = useCatalogControls();

  return (
    <CatalogLiveSearch
      query={query}
      onQueryChange={setQuery}
      placeholder="Buscar perfumes, colognes o marcas..."
      srLabel="Buscar perfumes o colognes"
      formClassName={`flex flex-col gap-3 ${mobile ? "" : "sm:flex-row sm:items-center"}`}
      labelClassName="flex-1 rounded-full border border-white/12 bg-white/9 px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
      inputClassName="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/52"
      buttonClassName={`inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-plum-950)] shadow-[0_14px_32px_rgba(20,6,33,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--color-gold-soft)] ${
        mobile ? "w-full" : ""
      }`}
      buttonText="Search"
    />
  );
}
