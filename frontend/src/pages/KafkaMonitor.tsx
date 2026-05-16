import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, Server, BarChart2 } from 'lucide-react';
import { kafkaApi } from '../api';
import styles from './KafkaMonitor.module.css';

export default function KafkaMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [setting, setSetting] = useState(false);

  const load = async () => {
    try { const res = await kafkaApi.stats(); setStats(res.data); }
    catch { setStats(null); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const refresh = () => { setRefreshing(true); load(); };

  const setupTopics = async () => {
    setSetting(true);
    try { await kafkaApi.setup(); await load(); }
    finally { setSetting(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kafka Monitor</h1>
          <p className={styles.subtitle}>Live cluster metrics and topic management</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={refresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? styles.spinning : ''} /> Refresh
          </button>
          <button className={styles.btnPrimary} onClick={setupTopics} disabled={setting}>
            <Zap size={15} /> {setting ? 'Setting up…' : 'Ensure Topics'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.empty}>Connecting to Kafka…</div>
      ) : !stats ? (
        <div className={styles.empty}><Zap size={32} /><p>Cannot reach Kafka broker.</p></div>
      ) : (
        <>
          <div className={styles.metaRow}>
            <div className={styles.metaCard}>
              <Server size={16} color="var(--accent2)" />
              <div>
                <div className={styles.metaVal}>{stats.broker_count}</div>
                <div className={styles.metaLabel}>Brokers</div>
              </div>
            </div>
            <div className={styles.metaCard}>
              <BarChart2 size={16} color="var(--accent)" />
              <div>
                <div className={styles.metaVal}>{stats.topics?.length ?? 0}</div>
                <div className={styles.metaLabel}>Topics</div>
              </div>
            </div>
            <div className={styles.metaCard}>
              <Zap size={16} color="var(--accent3)" />
              <div>
                <div className={styles.metaVal}>{stats.topics?.reduce((a: number, t: any) => a + t.partitions, 0) ?? 0}</div>
                <div className={styles.metaLabel}>Total Partitions</div>
              </div>
            </div>
          </div>

          {stats.brokers?.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><Server size={15} />Brokers</h2>
              <div className={styles.brokerList}>
                {stats.brokers.map((b: any) => (
                  <div key={b.id} className={styles.brokerChip}>
                    <span className={styles.brokerId}>#{b.id}</span>
                    <span>{b.host}:{b.port}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><BarChart2 size={15} />Topics</h2>
            <div className={styles.topicTable}>
              <div className={styles.tableHeader}>
                <span>Topic Name</span>
                <span>Partitions</span>
                <span>Replication</span>
                <span>Type</span>
              </div>
              {stats.topics?.map((t: any, i: number) => (
                <motion.div key={t.topic} className={styles.tableRow}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <span className={styles.topicName}>{t.topic}</span>
                  <span>{t.partitions}</span>
                  <span>{t.replication_factor}</span>
                  <span className={t.is_newron_topic ? styles.newronBadge : styles.extBadge}>
                    {t.is_newron_topic ? 'Newron' : 'External'}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
