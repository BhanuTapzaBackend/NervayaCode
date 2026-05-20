'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import PageHeader from '@/components/PageHeader/PageHeader';
import { MySessions } from '@/components/Account/MySessions';
import { MyOrders } from '@/components/Account/MyOrders';
import containerStyles from '@/app/(customer)/dashboard/styles.module.css';
import styles from './styles.module.css';
import { Icon } from '@iconify/react';
import { ICON_USER, ICON_MAIL, ICON_SAVE, ICON_LOCK } from '@/constants/icons';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { AUTH_API } from '@/lib/constants/api.constants';
import { getApiErrorMessage } from '@/lib/utils/apiError.util';
import { validatePassword } from '@/lib/utils/validation.util';

type TabType = 'settings' | 'orders' | 'sessions';

export default function AccountPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [profileName, setProfileName] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});

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
        data?: { user?: { name: string; email: string } };
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordFieldErrors({});

    const errors: { current?: string; new?: string; confirm?: string } = {};
    if (!currentPassword.trim()) errors.current = 'Current password is required.';
    if (!newPassword.trim()) errors.new = 'New password is required.';
    else {
      const validation = validatePassword(newPassword);
      if (!validation.valid) errors.new = validation.message;
    }
    if (newPassword !== confirmPassword) errors.confirm = 'Passwords do not match.';

    if (Object.keys(errors).length > 0) {
      setPasswordFieldErrors(errors);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = (await api.post(AUTH_API.CHANGE_PASSWORD, {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      })) as { success?: boolean; message?: string };
      if (res?.success) {
        setPasswordSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res?.message || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, 'Failed to update password.'));
    } finally {
      setPasswordLoading(false);
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
            <div className={styles.settingsGrid}>
              <div className={styles.settingsCol}>
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

                <h2 className={styles.sectionTitle}>
                  <Icon icon={ICON_LOCK} className={styles.icon} /> Change password
                </h2>
                <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="current-password">
                      Current password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`${styles.input} ${passwordFieldErrors.current ? styles.inputError : ''}`}
                      autoComplete="current-password"
                      aria-invalid={!!passwordFieldErrors.current}
                      aria-describedby={passwordFieldErrors.current ? 'current-pw-error' : undefined}
                    />
                    {passwordFieldErrors.current && (
                      <span id="current-pw-error" className={styles.fieldError}>
                        {passwordFieldErrors.current}
                      </span>
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="new-password">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${styles.input} ${passwordFieldErrors.new ? styles.inputError : ''}`}
                      autoComplete="new-password"
                      aria-invalid={!!passwordFieldErrors.new}
                      aria-describedby={passwordFieldErrors.new ? 'new-pw-error' : undefined}
                    />
                    {passwordFieldErrors.new && (
                      <span id="new-pw-error" className={styles.fieldError}>
                        {passwordFieldErrors.new}
                      </span>
                    )}
                    <span className={styles.hint}>Min 8 chars, 1 upper, 1 lower, 1 number, 1 special.</span>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="confirm-password">
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${styles.input} ${passwordFieldErrors.confirm ? styles.inputError : ''}`}
                      autoComplete="new-password"
                      aria-invalid={!!passwordFieldErrors.confirm}
                      aria-describedby={passwordFieldErrors.confirm ? 'confirm-pw-error' : undefined}
                    />
                    {passwordFieldErrors.confirm && (
                      <span id="confirm-pw-error" className={styles.fieldError}>
                        {passwordFieldErrors.confirm}
                      </span>
                    )}
                  </div>
                  {passwordError && (
                    <p className={styles.errorMessage} role="alert">
                      {passwordError}
                    </p>
                  )}
                  {passwordSuccess && (
                    <p className={styles.successMessage} role="status">
                      {passwordSuccess}
                    </p>
                  )}
                  <button type="submit" className={styles.passwordBtn} disabled={passwordLoading}>
                    <Icon icon={ICON_LOCK} /> {passwordLoading ? 'Updating…' : 'Change password'}
                  </button>
                </form>
              </div>

              <div className={styles.settingsCol}>
                <form onSubmit={handleProfileSubmit} className={styles.profileFormCol}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="account-email">
                      <Icon icon={ICON_MAIL} className={styles.icon} /> Email Address
                    </label>
                    <input
                      id="account-email"
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      className={styles.input}
                      disabled
                    />
                    <span className={styles.hint}>Email cannot be changed.</span>
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
            </div>
          </div>
        )}

        {activeTab === 'orders' && <MyOrders />}
        {activeTab === 'sessions' && <MySessions />}
      </div>
    </Sidebar>
  );
}
