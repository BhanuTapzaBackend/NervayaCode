'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import PageHeader from '@/components/PageHeader/PageHeader';
import { MySessions } from '@/components/Account/MySessions';
import { MyOrders } from '@/components/Account/MyOrders';
import containerStyles from '@/app/(customer)/dashboard/styles.module.css';
import styles from './styles.module.css';
import { Icon } from '@iconify/react';
import { ICON_USER, ICON_MAIL, ICON_SAVE } from '@/constants/icons';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/utils/apiError.util';
import { PhoneCollectionModal } from '@/components/PhoneCollectionModal';

type TabType = 'settings' | 'orders' | 'sessions';

export default function AccountPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email ?? '');
      // Field holds the 10 national digits; +91 is shown as a fixed prefix.
      setProfilePhone((user.phone ?? '').replace(/\D/g, '').slice(-10));
    }
  }, [user]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    if (!user) return;
    if (profileName.trim().length < 2) {
      setProfileError('Name must be at least 2 characters');
      return;
    }
    if (profileEmail.trim() && !/^\S{1,64}@\S{1,255}\.\S{1,63}$/.test(profileEmail.trim())) {
      setProfileError('Please enter a valid email address');
      return;
    }
    // Phone is not part of this form any more: changing it requires proving
    // ownership by OTP, which PhoneCollectionModal handles.
    void saveProfile();
  };

  const saveProfile = async () => {
    const email = profileEmail.trim();
    setProfileLoading(true);
    try {
      const res = (await api.patch('/users/profile', { name: profileName.trim(), email })) as {
        success?: boolean;
        data?: { user?: { name: string; email?: string; phone?: string } };
        message?: string;
      };
      if (res?.success && res?.data?.user) {
        // Clearing the email drops the key from the response, so carry the
        // submitted value through rather than reading it back.
        updateUser({ ...res.data.user, email: email || undefined });
        setProfileSuccess(
          email ? 'Profile updated. Receipts and invoices will go to this address.' : 'Profile updated successfully.',
        );
      } else {
        setProfileError(res?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError(getApiErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <Sidebar>
      <div className={containerStyles.container}>
        <div className={styles.mobileHidden}>
          <PageHeader title="My Account" />
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            My Orders
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'sessions' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            My Sessions
          </button>
        </div>

        {activeTab === 'settings' && (
          <div className={styles.card}>
            <form onSubmit={handleProfileSubmit} className={styles.profileFormCol}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="account-name">
                  <Icon icon={ICON_USER} className={styles.icon} /> Full Name
                </label>
                <input
                  id="account-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={styles.input}
                  disabled={!user}
                  aria-describedby={profileError ? 'profile-error' : undefined}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="account-email">
                  <Icon icon={ICON_MAIL} className={styles.icon} /> Email address
                </label>
                <input
                  id="account-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className={styles.input}
                  aria-describedby="account-email-hint"
                />
                <span id="account-email-hint" className={styles.hint}>
                  Optional. Add it and we&apos;ll email your order confirmations and invoices here too. Leave it blank
                  and we&apos;ll only send them on WhatsApp.
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="account-phone">
                  <Icon icon={ICON_MAIL} className={styles.icon} /> WhatsApp Number
                </label>
                <div className={styles.phoneField}>
                  <span className={styles.phonePrefix} aria-hidden="true">
                    +91
                  </span>
                  <input
                    id="account-phone"
                    type="tel"
                    readOnly
                    value={profilePhone}
                    placeholder="Not added yet"
                    className={`${styles.input} ${styles.phoneInput}`}
                    aria-describedby="account-phone-hint"
                  />
                </div>
                <button type="button" className={styles.linkBtn} onClick={() => setPhoneModalOpen(true)}>
                  {profilePhone ? 'Change WhatsApp number' : 'Add WhatsApp number'}
                </button>
                <span id="account-phone-hint" className={styles.hint}>
                  {profilePhone
                    ? 'This is how you log in and where session links are sent. Changing it needs a code sent to the new number.'
                    : 'Optional, but required to book a session or place an order — that is where we send your links and updates.'}
                </span>
              </div>

              {profileError && (
                <p id="profile-error" className={styles.errorMessage} role="alert">
                  {profileError}
                </p>
              )}
              {profileSuccess && (
                <p className={styles.successMessage} role="status">
                  {profileSuccess}
                </p>
              )}
              <button type="submit" className={styles.saveBtn} disabled={profileLoading || !user}>
                <Icon icon={ICON_SAVE} /> {profileLoading ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'orders' && <MyOrders />}
        {activeTab === 'sessions' && <MySessions />}
      </div>

      <PhoneCollectionModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onVerified={() => {
          setPhoneModalOpen(false);
          setProfileSuccess('WhatsApp number verified.');
        }}
        initialPhone={profilePhone}
        reason="We'll send a 6-digit code to this number to confirm it's yours."
      />
    </Sidebar>
  );
}
