"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ITEMS_PER_PAGE,
  type StatusFilter,
} from "@/app/_components/catalog-browser-config";
import type { BottleImageAsset } from "@/lib/catalog-bottle";
import type { CatalogType } from "@/lib/catalog-config";
import type { CatalogItem } from "@/lib/catalog";
import { buildCatalogCollectionHref } from "@/lib/catalog-links";

export type CatalogBrowserItem = CatalogItem & {
  bottleAsset: BottleImageAsset;
};

type CatalogControlsContextValue = {
  catalog: CatalogType;
  currentPage: number;
  items: CatalogBrowserItem[];
  query: string;
  setCurrentPage: (page: number) => void;
  setQuery: (query: string) => void;
  setStatus: (status: StatusFilter) => void;
  status: StatusFilter;
  totalPages: number;
  totalVisibleItems: number;
};

const CatalogControlsContext = createContext<CatalogControlsContextValue | null>(
  null,
);

export function CatalogControlsProvider({
  catalog,
  children,
  initialPage,
  initialQuery,
  initialStatus,
  items,
}: {
  catalog: CatalogType;
  children: ReactNode;
  initialPage: number;
  initialQuery: string;
  initialStatus: StatusFilter;
  items: CatalogBrowserItem[];
}) {
  const [query, setQueryState] = useState(initialQuery);
  const [status, setStatusState] = useState<StatusFilter>(initialStatus);
  const [requestedPage, setRequestedPage] = useState(initialPage);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.fullName.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "all" || item.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [items, query, status]);

  const totalVisibleItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalVisibleItems / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const setQuery = useCallback((nextQuery: string) => {
    setQueryState(nextQuery);
    setRequestedPage(1);
  }, []);

  const setStatus = useCallback((nextStatus: StatusFilter) => {
    setStatusState(nextStatus);
    setRequestedPage(1);
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setRequestedPage(page);
  }, []);

  useEffect(() => {
    const href = buildCatalogCollectionHref({
      catalog,
      page: currentPage,
      query,
      status,
    });

    window.history.replaceState(window.history.state, "", href);
  }, [catalog, currentPage, query, status]);

  return (
    <CatalogControlsContext.Provider
      value={{
        catalog,
        currentPage,
        items: paginatedItems,
        query,
        setCurrentPage,
        setQuery,
        setStatus,
        status,
        totalPages,
        totalVisibleItems,
      }}
    >
      {children}
    </CatalogControlsContext.Provider>
  );
}

export function useCatalogControls() {
  const context = useContext(CatalogControlsContext);

  if (!context) {
    throw new Error("useCatalogControls must be used within CatalogControlsProvider.");
  }

  return context;
}
