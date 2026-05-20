import { redirect } from 'next/navigation';
import { getActiveSupplements } from '@/lib/services/supplement.service';
import type { Supplement } from '@/types/supplement.types';
import SupplementsClient from './SupplementsClient';

export const dynamic = 'force-dynamic';

/**
 * Active implementation: fetches supplements on the server. When exactly one
 * supplement exists, we redirect to its detail page before any client render
 * happens (so the user never sees a catalog flash). With 0 or 2+ supplements,
 * the catalog renders via <SupplementsClient>. This already scales to the
 * multi-supplement future without further code changes.
 */
export default async function SupplementsPage() {
  let supplements: Supplement[] = [];
  let serverError: string | null = null;

  try {
    const result = await getActiveSupplements();
    supplements = JSON.parse(JSON.stringify(result)) as Supplement[];
  } catch (err) {
    serverError = err instanceof Error ? err.message : 'Failed to load supplements';
  }

  if (supplements.length === 1) {
    redirect(`/sleep-supplements/${supplements[0]._id}`);
  }

  return <SupplementsClient supplements={supplements} serverError={serverError} />;
}

/* ---------------------------------------------------------------------------
 * LEGACY — client-side fetch + redirect approach (kept for reference).
 *
 * This is the original implementation that ran entirely in the browser:
 * it rendered the catalog skeleton, fetched supplements via the HTTP API,
 * and called `router.replace` when only one result came back. It works,
 * but the user briefly sees the listing skeleton before the redirect,
 * which was the reason we moved to the server-component approach above.
 *
 * If you ever need a purely client-side catalog (e.g. because you want
 * optimistic UI or cache-first loading), replace the server component
 * above with the code below and turn this back into a 'use client' file.
 *
 * 'use client';
 *
 * import { useState, useEffect, useCallback } from 'react';
 * import Link from 'next/link';
 * import { useRouter } from 'next/navigation';
 * import Sidebar from '@/components/Sidebar/LazySidebar';
 * import PageHeader from '@/components/PageHeader/PageHeader';
 * import { StatusState, type BreadcrumbItem } from '@/components/common';
 * import SupplementCatalog from '@/components/Supplements/SupplementCatalog';
 * import { Supplement } from '@/types/supplement.types';
 * import { supplementsApi } from '@/lib/api/supplements';
 * import { cartApi } from '@/lib/api/cart';
 * import { useAuth } from '@/hooks/useAuth';
 * import { useCart } from '@/context/CartContext';
 * import { ROUTES } from '@/utils/routesConstants';
 * import styles from './styles.module.css';
 *
 * export default function SupplementsPage() {
 *   const router = useRouter();
 *   const { isAuthenticated } = useAuth();
 *   const { refreshCart } = useCart();
 *   const [supplements, setSupplements] = useState<Supplement[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const handleAddToCart = useCallback(
 *     async (supplementId: string, quantity: number) => {
 *       if (!isAuthenticated) {
 *         router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/supplements')}`);
 *         return;
 *       }
 *       const response = await cartApi.add(supplementId, quantity);
 *       if (response.success) {
 *         await refreshCart();
 *       } else {
 *         throw new Error('Failed to add to cart');
 *       }
 *     },
 *     [isAuthenticated, router, refreshCart],
 *   );
 *
 *   const fetchSupplements = useCallback(async () => {
 *     try {
 *       setLoading(true);
 *       setError(null);
 *       const response = await supplementsApi.getAll();
 *       if (response.success && response.data) {
 *         setSupplements(response.data);
 *       } else {
 *         setSupplements([]);
 *       }
 *     } catch (err) {
 *       setError(err instanceof Error ? err.message : 'Failed to load supplements');
 *       setSupplements([]);
 *     } finally {
 *       setLoading(false);
 *     }
 *   }, []);
 *
 *   useEffect(() => {
 *     fetchSupplements();
 *   }, [fetchSupplements]);
 *
 *   const shouldRedirectToSingleSupplement = !loading && !error && supplements.length === 1;
 *
 *   useEffect(() => {
 *     if (shouldRedirectToSingleSupplement) {
 *       router.replace(`/supplements/${supplements[0]._id}`);
 *     }
 *   }, [supplements, shouldRedirectToSingleSupplement, router]);
 *
 *   const showFailure = !loading && error != null;
 *   const showEmpty = !loading && !error && supplements.length === 0;
 *
 *   const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/dashboard' }, { label: 'Supplements' }];
 *
 *   if (shouldRedirectToSingleSupplement) {
 *     return (
 *       <Sidebar hideGlobalBreadcrumbs>
 *         <div className={styles.wrapper}>
 *           <div className={styles.container}>
 *             <PageHeader
 *               title="Supplements"
 *               subtitle="Discover our range of health supplements"
 *               breadcrumbs={breadcrumbs}
 *             />
 *           </div>
 *         </div>
 *       </Sidebar>
 *     );
 *   }
 *
 *   return (
 *     <Sidebar hideGlobalBreadcrumbs>
 *       <div className={styles.wrapper}>
 *         <div className={styles.container}>
 *           <PageHeader
 *             title="Supplements"
 *             subtitle="Discover our range of health supplements"
 *             breadcrumbs={breadcrumbs}
 *           />
 *           {error && !showFailure && <div className={styles.error}>{error}</div>}
 *           {showFailure && (
 *             <StatusState
 *               type="error"
 *               variant="minimal"
 *               title="Failed to load supplements"
 *               message={error ?? 'Something went wrong'}
 *               action={
 *                 <button type="button" onClick={fetchSupplements} className={styles.retryButton}>
 *                   Try again
 *                 </button>
 *               }
 *             />
 *           )}
 *           {showEmpty && (
 *             <StatusState
 *               type="empty"
 *               variant="minimal"
 *               title="No supplements available"
 *               message="There are no supplements to display at the moment."
 *               action={
 *                 <Link href="/sleep-supplements" className={styles.browseLink}>
 *                   Browse supplements
 *                 </Link>
 *               }
 *             />
 *           )}
 *           {!showFailure && !showEmpty && (
 *             <SupplementCatalog supplements={supplements} loading={loading} onAddToCart={handleAddToCart} />
 *           )}
 *         </div>
 *       </div>
 *     </Sidebar>
 *   );
 * }
 * ------------------------------------------------------------------------- */
