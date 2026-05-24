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

type TabType = 'settings' | 'orders' | 'sessions';

export default function AccountPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [profileName, setProfileName] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    if (!user) return;
    if (profileName.trim().length < 2) {
      setProfileError('Name must be at least 2 characters');
      return;
    }
    setProfileLoading(true);
    try {
      const res = (await api.patch('/users/profile', { name: profileName.trim() })) as {
        success?: boolean;
        data?: { user?: { name: string } };
        message?: string;
      };
      if (res?.success && res?.data?.user) {
        updateUser(res.data.user);
        setProfileSuccess('Profile updated successfully.');
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
                <label className={styles.label} htmlFor="account-phone">
                  <Icon icon={ICON_MAIL} className={styles.icon} /> WhatsApp Number
                </label>
                <input
                  id="account-phone"
                  type="tel"
                  value={user?.phone ?? ''}
                  readOnly
                  className={styles.input}
                  disabled
                />
                <span className={styles.hint}>Your WhatsApp number cannot be changed.</span>
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
    </Sidebar>
  );
}
