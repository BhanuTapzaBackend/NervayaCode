'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Supplement } from '@/types/supplement.types';
import SupplementToolbar, { type ViewMode, type SortOption } from '../SupplementToolbar';
import SupplementProductGrid from '../SupplementProductGrid';
import { Pagination, GlobalLoader } from '@/components/common';
import { PAGE_SIZE_5 } from '@/lib/constants/pagination.constants';
import type { PriceRange } from '../SupplementFilters';
import styles from './SupplementCatalog.module.css';

interface SupplementCatalogProps {
  supplements: Supplement[];
  loading?: boolean;
  onAddToCart?: (supplementId: string, quantity: number) => Promise<void> | void;
}

const SupplementCatalog: React.FC<SupplementCatalogProps> = ({ supplements, loading = false, onAddToCart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: undefined });
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);

  // We no longer use global showLoader() here to keep it 'inside the page'

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((s: SortOption) => {
    setSortBy(s);
    setPage(1);
  }, []);

  const priceBounds = useMemo(() => {
    if (supplements.length === 0) return { min: 0, max: 0 };
    const prices = supplements.map((s) => s.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [supplements]);

  const filteredAndSorted = useMemo(() => {
    let result = [...supplements];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.shortDescription && s.shortDescription.toLowerCase().includes(q)),
      );
    }

    if (priceRange.min > 0) {
      result = result.filter((s) => s.price >= priceRange.min);
    }
    if (priceRange.max != null && priceRange.max > 0) {
      const maxPrice = priceRange.max;
      result = result.filter((s) => s.price <= maxPrice);
    }

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        break;
    }

    return result;
  }, [supplements, searchQuery, priceRange, sortBy]);

  const limit = PAGE_SIZE_5;
  const total = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedSupplements = useMemo(
    () => filteredAndSorted.slice((page - 1) * limit, page * limit),
    [filteredAndSorted, page, limit],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePriceChange = useCallback((range: PriceRange) => {
    setPriceRange(range);
    setPage(1);
  }, []);

  if (loading) {
    return (
      <div className={styles.catalog}>
        <GlobalLoader label="Loading supplement catalog..." />
      </div>
    );
  }

  return (
    <div className={styles.catalog}>
      <SupplementToolbar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        priceRange={priceRange}
        onPriceChange={handlePriceChange}
        priceBounds={priceBounds}
      />
      <div className={styles.main}>
        <SupplementProductGrid supplements={paginatedSupplements} viewMode={viewMode} onAddToCart={onAddToCart} />
      </div>
      {total > 0 && (
        <div className={styles.paginationWrap}>
          <Pagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            ariaLabel="Supplements pagination"
          />
        </div>
      )}
    </div>
  );
};

export default SupplementCatalog;
