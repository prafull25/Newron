import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Rss, Users, Zap, Newspaper } from 'lucide-react';
import styles from './Sidebar.module.css';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/topics', icon: Rss, label: 'Topics' },
  { to: '/recipients', icon: Users, label: 'Recipients' },
  { to: '/kafka', icon: Zap, label: 'Kafka' },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}><Newspaper size={18} /></div>
        <span className={styles.brandName}>Newron</span>
      </div>
      <nav className={styles.nav}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={styles.footer}>
        <div className={styles.footerVersion}>v1.0.0</div>
        <div className={styles.footerLabel}>AI News Platform</div>
      </div>
    </aside>
  );
}
