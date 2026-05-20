'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ICON_GRID, ICON_LIST, ICON_FILTER, ICON_X, ICON_WHATSAPP } from '@/constants/icons';
import { Dropdown } from '@/components/common';
import SupplementFilters, { type PriceRange } from '../SupplementFilters';
import { trackSearch } from '@/utils/analytics';
import styles from './SupplementToolbar.module.css';

export type ViewMode = 'grid' | 'list';
export type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';

const SORT_OPTIONS = [
  { value: 'featured' as SortOption, label: 'Featured Items' },
  { value: 'price-low' as SortOption, label: 'Price: Low to High' },
  { value: 'price-high' as SortOption, label: 'Price: High to Low' },
  { value: 'rating' as SortOption, label: 'Rating' },
  { value: 'newest' as SortOption, label: 'Newest' },
];

interface SupplementToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortChange: (option: SortOption) => void;
  priceRange: PriceRange;
  onPriceChange: (range: PriceRange) => void;
  priceBounds: { min: number; max: number };
}

const SupplementToolbar: React.FC<SupplementToolbarProps> = ({
  searchValue,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceChange,
  priceBounds,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const filterWrapperRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeFilter = () => setPopoverOpen(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverOpen && filterWrapperRef.current && !filterWrapperRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopoverOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [popoverOpen]);

  return (
    <div className={styles.toolbar} ref={filterWrapperRef}>
      <input
        type="text"
        value={searchValue}
        onChange={(e) => {
          const value = e.target.value;
          onSearchChange(value);
          if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
          if (value.trim().length > 1) {
            searchDebounceRef.current = setTimeout(() => {
              trackSearch(value.trim());
            }, 800);
          }
        }}
        placeholder="Filter products by name, SKU, att."
        className={styles.searchInput}
        aria-label="Filter products"
      />
      <div className={styles.controls}>
        <div className={styles.filterWrapper}>
          <button
            type="button"
            onClick={() => setPopoverOpen((o) => !o)}
            className={`${styles.filterButton} ${popoverOpen ? styles.active : ''}`}
            aria-label={popoverOpen ? 'Close filters' : 'Open filters'}
            aria-expanded={popoverOpen}
            aria-haspopup="dialog"
          >
            <Icon icon={ICON_FILTER} width={16} height={16} aria-hidden />
            <span>Filters</span>
          </button>
          {popoverOpen && (
            <div className={styles.popover} role="dialog" aria-label="Price filter">
              <SupplementFilters priceBounds={priceBounds} value={priceRange} onChange={onPriceChange} />
            </div>
          )}
        </div>
        <div className={styles.viewToggle} role="group" aria-label="View mode">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <Icon icon={ICON_GRID} width={16} height={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <Icon icon={ICON_LIST} width={16} height={16} aria-hidden />
          </button>
        </div>
        <div className={styles.sortGroup}>
          <span className={styles.sortLabel}>SORT BY:</span>
          <Dropdown
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(v) => onSortChange(v as SortOption)}
            ariaLabel="Sort products"
          />
        </div>
      </div>
      {popoverOpen && (
        <div className={styles.filterInline} role="dialog" aria-label="Price filter">
          <div className={styles.filterHeader}>
            <span className={styles.filterTitle}>Shop by price</span>
            <button type="button" className={styles.filterClose} onClick={closeFilter} aria-label="Close filter">
              <Icon icon={ICON_X} width={16} height={16} aria-hidden />
            </button>
          </div>
          <SupplementFilters priceBounds={priceBounds} value={priceRange} onChange={onPriceChange} />
          <button type="button" className={styles.filterDone} onClick={closeFilter} aria-label="Close price filter">
            <Icon icon={ICON_WHATSAPP} width={20} height={20} className={styles.buttonIcon} />
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default SupplementToolbar;
