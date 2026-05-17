import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Rss, Users, Zap, Newspaper, BarChart2, LogOut, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api';
import styles from './Sidebar.module.css';

const superuserNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/topics', icon: Rss, label: 'Topics' },
  { to: '/recipients', icon: Users, label: 'Recipients' },
  { to: '/kafka', icon: Zap, label: 'Kafka' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
];

const subscriberNav = [
  { to: '/', icon: Users, label: 'Alert Settings' },
];

interface SidebarProps {
  username: string;
  isSuperuser: boolean;
  onLogout: () => void;
}

export default function Sidebar({ username, isSuperuser, onLogout }: SidebarProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logo}><Newspaper size={18} /></div>
          <span className={styles.brandName}>Newron</span>
        </div>
        <nav className={styles.nav}>
          {(isSuperuser ? superuserNav : subscriberNav).map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{username[0].toUpperCase()}</div>
            <div className={styles.userDetails}>
              <div className={styles.username}>{username}</div>
              <div className={styles.role}>Active Session</div>
            </div>
          </div>
          <div className={styles.userActions}>
            <button className={styles.userBtn} onClick={() => setShowModal(true)} title="Change Password">
              <Key size={16} />
            </button>
            <button className={`${styles.userBtn} ${styles.logout}`} onClick={onLogout} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerVersion}>v1.0.0</div>
          <div className={styles.footerLabel}>AI News Platform</div>
        </div>
      </aside>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Change Password</h2>
            <form onSubmit={handleChangePassword} className={styles.modalForm}>
              <div className={styles.field}>
                <label>Current Password</label>
                <input 
                  type="password" 
                  required 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.field}>
                <label>New Password</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.field}>
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className={styles.modalError}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className={styles.modalSuccess}>
                  <CheckCircle2 size={14} />
                  <span>{success}</span>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => { setShowModal(false); setError(''); setSuccess(''); }} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSave} disabled={loading}>
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
