import { Icon } from '@iconify/react';
import { ICON_CHECK_SIMPLE } from '@/constants/icons';
import { formatCurrency } from '@/utils/currencyConstants';
import styles from './styles.module.css';

interface PlanPricingPanelProps {
  originalPrice: number;
  discountedPrice: number;
  savingsAmount: number;
  discountPct: number;
  itemCount: number;
  onStartPlan: () => void;
  onAddPlanToCart: () => void;
  isStarting: boolean;
  isAdding: boolean;
  disabled: boolean;
}

const BENEFITS = ['Personalized from your assessment', 'One-time payment, full access', 'Guided support throughout'];

export function PlanPricingPanel({
  originalPrice,
  discountedPrice,
  savingsAmount,
  discountPct,
  itemCount,
  onStartPlan,
  onAddPlanToCart,
  isStarting,
  isAdding,
  disabled,
}: Readonly<PlanPricingPanelProps>) {
  const hasDiscount = savingsAmount > 0 && discountPct > 0;
  return (
    <div className={styles.panel}>
      <p className={styles.includes}>
        Includes {itemCount} core support{itemCount === 1 ? '' : 's'}
      </p>

      <div className={styles.priceRow}>
        {hasDiscount && <span className={styles.original}>{formatCurrency(originalPrice)}</span>}
        <span className={styles.discounted}>{formatCurrency(discountedPrice)}</span>
        {hasDiscount && <span className={styles.saveBadge}>Save {discountPct}%</span>}
      </div>

      <ul className={styles.benefits}>
        {BENEFITS.map((b) => (
          <li key={b}>
            <Icon icon={ICON_CHECK_SIMPLE} aria-hidden className={styles.checkIcon} />
            {b}
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onStartPlan} disabled={disabled || isStarting}>
          {isStarting ? 'Starting...' : 'Start My Sleep Plan'}
        </button>
        <button type="button" className={styles.secondary} onClick={onAddPlanToCart} disabled={disabled || isAdding}>
          {isAdding ? 'Adding...' : 'Add Plan to Cart'}
        </button>
      </div>
    </div>
  );
}
