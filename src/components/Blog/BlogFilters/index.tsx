'use client';

import { Icon } from '@iconify/react';
import { ICON_MAGNIFYING_GLASS } from '@/constants/icons';
import { MultiSelect } from '@/components/common';
import styles from './styles.module.css';

interface BlogFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  allTags: string[];
  selectedTags: string[];
  onFilterChange: (values: string[]) => void;
}

export default function BlogFilters({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  allTags,
  selectedTags,
  onFilterChange,
}: BlogFiltersProps) {
  return (
    <div className={styles.filtersRow}>
      <div className={styles.searchWrapper}>
        <label htmlFor="blog-search" className={styles.filterLabel}>
          Search
        </label>
        <form onSubmit={onSearchSubmit} className={styles.searchForm}>
          <Icon icon={ICON_MAGNIFYING_GLASS} className={styles.searchIcon} aria-hidden />
          <input
            id="blog-search"
            type="search"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search by title, author..."
            className={styles.searchInput}
            aria-label="Search blogs"
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>
      </div>
      {allTags.length > 0 && (
        <div className={styles.filterSelectWrapper}>
          <label htmlFor="blog-filter" className={styles.filterLabel}>
            Filter by topic
          </label>
          <MultiSelect
            id="blog-filter"
            options={allTags.map((tag) => ({ value: tag, label: tag }))}
            values={selectedTags}
            onChange={onFilterChange}
            ariaLabel="Filter by topic"
            className={styles.filterSelect}
            placeholder="Select topics..."
          />
        </div>
      )}
    </div>
  );
}
