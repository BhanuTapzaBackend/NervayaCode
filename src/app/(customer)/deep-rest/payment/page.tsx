'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/LazySidebar';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import Button from '@/components/common/Button';
import DriftOffPaymentHandler from '@/components/DeepRest/DriftOffPaymentHandler';
import { PaymentSuccessScreen, type PaymentSuccessDetails } from '@/components/DeepRest/PaymentSuccessScreen';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import { cartApi } from '@/lib/api/cart';
import { useCart } from '@/context/CartContext';
import { useDeepRestPayment } from './useDeepRestPayment';
import { useDeepRestPaymentInit } from '@/queries/deepRest/useDeepRestPaymentInit';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/routesConstants';
import { toast } from 'sonner';
import styles from './styles.module.css';

const BENEFITS = [
  '25-min personalized Deep Rest audio session',
  'Curated by certified sleep & wellness specialists',
  'Targets your specific mental and sleep needs',
  'Access your session anytime via your dashboard',
  'Expert support included',
] as const;

export default function DriftOffPaymentPage() {
  const router = useRouter();
  const { isAuthenticated, initializing: authLoading } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccessDetails | null>(null);
  const { refreshCart } = useCart();

  const {
    deepRestOrderId,
    razorpayOrderId,
    razorpayKeyId,
    isCreating,
    isVerifying,
    error,
    showPaymentHandler,
    bypassSuccess,
    initiatePayment,
    handleVerifyStart,
    handleVerifyComplete,
    handlePaymentError,
  } = useDeepRestPayment();

  // Test customer: the order settled without Razorpay, so show the success
  // screen the payment handler would normally have triggered.
  useEffect(() => {
    if (bypassSuccess) setPaymentSuccess(bypassSuccess);
  }, [bypassSuccess]);

  const {
    isLoading: isChecking,
    error: initError,
    dynamicPrice,
  } = useDeepRestPaymentInit(!authLoading && isAuthenticated);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/deep-rest/payment')}`);
      return;
    }

    setIsAdding(true);
    try {
      const response = await cartApi.add(
        'drift-off-session',
        1,
        'DriftOff',
        'Deep Rest Session',
        dynamicPrice,
        DRIFT_OFF_SESSION_IMAGE,
      );
      if (response.success) {
        refreshCart();
        toast.success('Added to cart successfully!');
        router.push('/cart');
      } else {
        toast.error(`Failed to add: ${response.message}`);
      }
    } catch (_err) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handlePaymentSuccess = (details: PaymentSuccessDetails) => {
    handleVerifyComplete();
    setPaymentSuccess(details);
  };

  if (paymentSuccess) {
    return (
      <>
        <Sidebar>
          <div className={styles.wrapper} />
        </Sidebar>
        <PaymentSuccessScreen
          {...paymentSuccess}
          onComplete={() => router.replace(`/deep-rest/questionnaire?orderId=${paymentSuccess.orderId}`)}
        />
      </>
    );
  }

  if (isVerifying || isChecking || authLoading || isCreating) {
    let message = 'Checking status...';
    if (isVerifying) message = 'Verifying your payment...';
    if (isCreating) message = 'Preparing your session...';

    return (
      <Sidebar>
        <div className={styles.wrapper}>
          <GlobalLoader label={message} />
        </div>
      </Sidebar>
    );
  }

  return (
    <>
      <Sidebar>
        <div className={styles.wrapper}>
          <div className={styles.container}>
            <div className={styles.card}>
              <div className={styles.cardLeft}>
                <span className={styles.badge}>Deep Rest Session</span>
                <h1 className={styles.title}>Your Custom Sleep Session</h1>
                <p className={styles.subtitle}>
                  A 25-minute personalized audio session curated specifically for your sleep patterns and mental needs
                  by our specialists.
                </p>
                <ul className={styles.benefits}>
                  {BENEFITS.map((benefit) => (
                    <li key={benefit} className={styles.benefitItem}>
                      <span className={styles.checkIcon}>✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.cardRight}>
                <div className={styles.priceCard}>
                  <p className={styles.priceLabel}>Session Price</p>
                  <p className={styles.price}>₹{dynamicPrice}</p>
                  <p className={styles.priceNote}>One-time payment · Personalized for you</p>

                  {initError && (
                    <div className={styles.error} role="alert">
                      {initError}
                    </div>
                  )}
                  {error && !initError && (
                    <div className={styles.error} role="alert">
                      {error}
                    </div>
                  )}

                  {!initError && (
                    <div className={styles.actionStack}>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={initiatePayment}
                        disabled={isCreating || showPaymentHandler || isVerifying || isAdding}
                      >
                        Pay Now
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleAddToCart}
                        disabled={isCreating || showPaymentHandler || isVerifying || isAdding}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  )}

                  {showPaymentHandler && deepRestOrderId && razorpayOrderId && razorpayKeyId && (
                    <DriftOffPaymentHandler
                      driftOffOrderId={deepRestOrderId}
                      amount={dynamicPrice}
                      razorpayOrderId={razorpayOrderId}
                      razorpayKeyId={razorpayKeyId}
                      onVerifyStart={handleVerifyStart}
                      onPaymentSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
    </>
  );
}
