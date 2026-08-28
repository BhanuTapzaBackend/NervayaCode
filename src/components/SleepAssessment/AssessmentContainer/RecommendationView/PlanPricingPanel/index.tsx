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
}

const BENEFITS = ['Personalized from your assessment', 'One-time payment, full access', 'Guided support throughout'];

export function PlanPricingPanel({
  originalPrice,
  discountedPrice,
  savingsAmount,
  discountPct,
  itemCount,
}: Readonly<PlanPricingPanelProps>) {
  const hasDiscount = savingsAmount > 0 && discountPct > 0;
  return (
    <div className={styles.panel}>
      <div className={styles.priceBlock}>
        <p className={styles.includes}>
          Includes {itemCount} core support{itemCount === 1 ? '' : 's'}
        </p>
        <div className={styles.priceRow}>
          {hasDiscount && <span className={styles.original}>{formatCurrency(originalPrice)}</span>}
          <span className={styles.discounted}>{formatCurrency(discountedPrice)}</span>
          {hasDiscount && <span className={styles.saveBadge}>Save {discountPct}%</span>}
        </div>
      </div>

      <ul className={styles.benefits}>
        {BENEFITS.map((b) => (
          <li key={b}>
            <Icon icon={ICON_CHECK_SIMPLE} aria-hidden className={styles.checkIcon} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PlanPricingActionsProps {
  onStartPlan: () => void;
  onAddPlanToCart: () => void;
  isStarting: boolean;
  isAdding: boolean;
  disabled: boolean;
  /** When the plan includes a therapy session, the cart route is not offered. */
  hasTherapy: boolean;
}

export function PlanPricingActions({
  onStartPlan,
  onAddPlanToCart,
  isStarting,
  isAdding,
  disabled,
  hasTherapy,
}: Readonly<PlanPricingActionsProps>) {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.primary} onClick={onStartPlan} disabled={disabled || isStarting}>
        {isStarting ? 'Starting...' : 'Start My Sleep Plan'}
      </button>

      {/* No cart route for a plan containing therapy.
          Two reasons, both real. The session needs a therapist and a held slot,
          which a cart line cannot express; and cart orders are priced per item
          — `createOrder` receives `promoDiscount` from its caller and cannot
          derive the bundle discount — so this button charged MORE than the plan
          price while looking like the cheaper, more casual option, and settled
          the session in a second payment. */}
      {!hasTherapy && (
        <button type="button" className={styles.secondary} onClick={onAddPlanToCart} disabled={disabled || isAdding}>
          {isAdding ? 'Adding...' : 'Add Plan to Cart'}
        </button>
      )}
    </div>
  );
}
