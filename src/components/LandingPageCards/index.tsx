'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import styles from './styles.module.css';
import { landingPageCardsData } from '@/utils/landingPageCardsData';
import { useAuth } from '@/hooks/useAuth';
import { supplementsApi } from '@/lib/api/supplements';
import { ROUTES } from '@/utils/routesConstants';
import { ITEM_TYPE } from '@/lib/constants/enums';
import type { Supplement } from '@/types/supplement.types';

const Cards = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [supplements, setSupplements] = useState<Supplement[]>([]);

  useEffect(() => {
    const fetchSupps = async () => {
      try {
        const res = await supplementsApi.getAll();
        if (res.success) setSupplements(res.data || []);
      } catch {}
    };
    fetchSupps();
  }, []);

  const handleAddToCart = useCallback(
    (title: string) => {
      if (!isAuthenticated) {
        router.push(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/')}`);
        return;
      }

      if (title === 'Deep Rest') {
        router.push(`/cart?addItemId=drift-off-session&itemType=${ITEM_TYPE.DRIFT_OFF}`);
      } else if (title === 'Sleep Essentials') {
        if (supplements.length === 0) {
          toast.error('There are no supplements');
          return;
        }
        if (supplements.length === 1) {
          router.push(`/cart?addItemId=${supplements[0]._id}&itemType=${ITEM_TYPE.SUPPLEMENT}`);
        } else {
          router.push('/sleep-supplements');
        }
      } else {
        router.push('/therapy-corner');
      }
    },
    [isAuthenticated, router, supplements],
  );

  return (
    <section className={styles.cardsSection}>
      <h2 className={styles.sectionTitle}>Explore our sleep solutions</h2>
      <ul className={styles.cardsContainer}>
        {landingPageCardsData.map((card) => (
          <li key={card.id} className={styles.card}>
            <div className={styles.cardImageWrapper}>
              <Image
                src={card.image}
                alt={card.title}
                fill
                className={styles.cardImage}
                priority={card.id === 1}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDescription}>{card.description}</p>
              <div className={styles.cardActions}>
                <Link href={card.primaryCta.href} className={styles.primaryButton}>
                  {card.primaryCta.text}
                </Link>
                {card.secondaryCta.text === 'Add to Cart' ? (
                  <button onClick={() => handleAddToCart(card.title)} className={styles.secondaryButton} type="button">
                    {card.secondaryCta.text}
                  </button>
                ) : (
                  <Link href={card.secondaryCta.href} className={styles.secondaryButton}>
                    {card.secondaryCta.text}
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Cards;
