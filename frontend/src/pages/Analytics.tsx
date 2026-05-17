import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Send, FileText, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { analyticsApi } from '../api';
import styles from './Analytics.module.css';

interface Overview {
  total_articles: number;
  total_notifications: number;
  notifications_sent: number;
  notifications_failed: number;
}

interface TopicCount { topic: string; count: number; }
interface HourCount { hour: string; count: number; }
interface NotifRow { topic: string; status: string; count: number; }

const COLORS = ['var(--accent)', 'var(--accent2)', 'var(--accent3)', '#a78bfa', '#f472b6', '#34d399'];

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className={styles.barTrack}>
      <motion.div
        className={styles.barFill}
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

function Sparkline({ data, color }: { data: HourCount[]; color: string }) {
  if (!data.length) return <div className={styles.emptySparkline}>No data yet</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className={styles.sparklineWrap}>
      {data.map((d, i) => (
        <div key={i} className={styles.sparklineCol} title={`${d.hour.slice(11, 16)}: ${d.count}`}>
          <motion.div
            className={styles.sparklineBar}
            style={{ background: color }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: d.count / max }}
            transition={{ delay: i * 0.02 }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [articlesByTopic, setArticlesByTopic] = useState<TopicCount[]>([]);
  const [articlesTime, setArticlesTime] = useState<HourCount[]>([]);
  const [notifsByTopic, setNotifsByTopic] = useState<NotifRow[]>([]);
  const [notifsTime, setNotifsTime] = useState<HourCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, abt, at, nbt, nt] = await Promise.all([
        analyticsApi.overview(),
        analyticsApi.articlesByTopic(),
        analyticsApi.articlesOverTime(),
        analyticsApi.notificationsByTopic(),
        analyticsApi.notificationsOverTime(),
      ]);
      setOverview(ov.data);
      setArticlesByTopic(abt.data);
      setArticlesTime(at.data);
      setNotifsByTopic(nbt.data);
      setNotifsTime(nt.data);
    } catch {
      setError('ClickHouse not reachable — analytics data unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const maxArticles = Math.max(...articlesByTopic.map(r => r.count), 1);

  // Group notifs by topic
  const notifTopics = [...new Set(notifsByTopic.map(r => r.topic))];
  const notifMap: Record<string, { sent: number; failed: number }> = {};
  for (const row of notifsByTopic) {
    if (!notifMap[row.topic]) notifMap[row.topic] = { sent: 0, failed: 0 };
    if (row.status === 'sent') notifMap[row.topic].sent += row.count;
    else notifMap[row.topic].failed += row.count;
  }

  const statCards = overview ? [
    { label: 'Articles Scraped', value: overview.total_articles, icon: FileText, color: 'var(--accent)' },
    { label: 'Notifications Sent', value: overview.notifications_sent, icon: CheckCircle, color: 'var(--success)' },
    { label: 'Notifications Failed', value: overview.notifications_failed, icon: XCircle, color: 'var(--danger)' },
    { label: 'Total Deliveries', value: overview.total_notifications, icon: Send, color: 'var(--accent2)' },
  ] : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>ClickHouse-powered pipeline insights</p>
        </div>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? styles.spin : ''} />
          Refresh
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Overview Cards */}
      <div className={styles.statsGrid}>
        {loading
          ? [1, 2, 3, 4].map(i => <div key={i} className={`${styles.statCard} ${styles.skeleton}`} />)
          : statCards.map((card, i) => (
            <motion.div key={card.label} className={styles.statCard}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}>
              <div className={styles.statIcon} style={{ background: `${card.color}18`, color: card.color }}>
                <card.icon size={20} />
              </div>
              <div>
                <div className={styles.statValue} style={{ color: card.color }}>{card.value.toLocaleString()}</div>
                <div className={styles.statLabel}>{card.label}</div>
              </div>
            </motion.div>
          ))
        }
      </div>

      <div className={styles.grid2}>
        {/* Articles by Topic */}
        <motion.div className={styles.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className={styles.cardHeader}>
            <BarChart2 size={16} />
            <h2>Articles by Topic</h2>
          </div>
          {articlesByTopic.length === 0 && !loading
            ? <p className={styles.empty}>No articles tracked yet.</p>
            : articlesByTopic.map((row, i) => (
              <div key={row.topic} className={styles.barRow}>
                <div className={styles.barLabel}>{row.topic}</div>
                <Bar value={row.count} max={maxArticles} color={COLORS[i % COLORS.length]} />
                <div className={styles.barCount}>{row.count.toLocaleString()}</div>
              </div>
            ))
          }
        </motion.div>

        {/* Notifications by Topic */}
        <motion.div className={styles.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <div className={styles.cardHeader}>
            <Send size={16} />
            <h2>Notifications by Topic</h2>
          </div>
          {notifTopics.length === 0 && !loading
            ? <p className={styles.empty}>No notifications tracked yet.</p>
            : notifTopics.map((topic, i) => {
              const { sent, failed } = notifMap[topic];
              const total = sent + failed;
              return (
                <div key={topic} className={styles.notifRow}>
                  <div className={styles.notifTopic}>{topic}</div>
                  <div className={styles.notifBadges}>
                    <span className={styles.sentBadge}><CheckCircle size={11} /> {sent} sent</span>
                    {failed > 0 && <span className={styles.failBadge}><XCircle size={11} /> {failed} failed</span>}
                  </div>
                  <Bar value={sent} max={total} color={COLORS[i % COLORS.length]} />
                </div>
              );
            })
          }
        </motion.div>
      </div>

      {/* Sparkline — Articles over time */}
      <motion.div className={styles.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className={styles.cardHeader}>
          <BarChart2 size={16} />
          <h2>Articles Scraped (last 24h)</h2>
          <span className={styles.pill}>{articlesTime.reduce((s, d) => s + d.count, 0)} total</span>
        </div>
        <Sparkline data={articlesTime} color="var(--accent)" />
      </motion.div>

      {/* Sparkline — Notifications over time */}
      <motion.div className={styles.card} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
        <div className={styles.cardHeader}>
          <Send size={16} />
          <h2>Notifications Sent (last 24h)</h2>
          <span className={styles.pill}>{notifsTime.reduce((s, d) => s + d.count, 0)} total</span>
        </div>
        <Sparkline data={notifsTime} color="var(--success)" />
      </motion.div>
    </div>
  );
}
