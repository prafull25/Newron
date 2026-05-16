import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Users, Rss, Server, TrendingUp } from 'lucide-react';
import { healthApi, topicsApi, recipientsApi, kafkaApi } from '../api';
import styles from './Dashboard.module.css';

interface Stats { topics: number; recipients: number; kafkaTopics: number; healthy: boolean; }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ topics: 0, recipients: 0, kafkaTopics: 0, healthy: false });
  const [kafkaStats, setKafkaStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [health, topics, recipients, kafka] = await Promise.allSettled([
          healthApi.check(), topicsApi.list(), recipientsApi.list(), kafkaApi.stats()
        ]);
        setStats({
          healthy: health.status === 'fulfilled',
          topics: topics.status === 'fulfilled' ? topics.value.data.length : 0,
          recipients: recipients.status === 'fulfilled' ? recipients.value.data.length : 0,
          kafkaTopics: kafka.status === 'fulfilled' ? kafka.value.data.topics?.length ?? 0 : 0,
        });
        if (kafka.status === 'fulfilled') setKafkaStats(kafka.value.data);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const cards = [
    { label: 'API Status', value: stats.healthy ? 'Healthy' : 'Offline', icon: Activity, color: stats.healthy ? 'var(--success)' : 'var(--danger)', numeric: false },
    { label: 'Active Topics', value: stats.topics, icon: Rss, color: 'var(--accent)', numeric: true },
    { label: 'Recipients', value: stats.recipients, icon: Users, color: 'var(--accent2)', numeric: true },
    { label: 'Kafka Topics', value: stats.kafkaTopics, icon: Zap, color: 'var(--accent3)', numeric: true },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Platform overview & live system status</p>
        </div>
        <div className={`${styles.statusBadge} ${stats.healthy ? styles.healthy : styles.offline}`}>
          <span className={styles.statusDot} />
          {stats.healthy ? 'All Systems Operational' : 'Checking…'}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {cards.map((card, i) => (
          <motion.div key={card.label} className={styles.statCard}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}>
            <div className={styles.statIcon} style={{ background: `${card.color}18`, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: card.color }}>
                {loading ? '—' : card.value}
              </div>
              <div className={styles.statLabel}>{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {kafkaStats && (
        <motion.div className={styles.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className={styles.sectionHeader}>
            <Server size={16} />
            <h2>Kafka Cluster</h2>
            <span className={styles.pill}>{kafkaStats.broker_count} broker{kafkaStats.broker_count !== 1 ? 's' : ''}</span>
          </div>
          <div className={styles.topicGrid}>
            {kafkaStats.topics?.map((t: any) => (
              <div key={t.topic} className={`${styles.topicChip} ${t.is_newron_topic ? styles.newron : ''}`}>
                <TrendingUp size={12} />
                <span>{t.topic}</span>
                <span className={styles.partBadge}>{t.partitions}p</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div className={styles.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className={styles.sectionHeader}>
          <Activity size={16} />
          <h2>Pipeline Flow</h2>
        </div>
        <div className={styles.pipeline}>
          {['Scrapers', 'news.raw.*', 'Classifier', 'news.breaking / news.digest', 'AI Engine', 'news.notifications', 'Telegram'].map((step, i, arr) => (
            <div key={step} className={styles.pipelineRow}>
              <div className={styles.pipelineStep}>{step}</div>
              {i < arr.length - 1 && <div className={styles.pipelineArrow}>→</div>}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
