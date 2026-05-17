import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, AlertTriangle, HelpCircle, Bell, Clock, RefreshCw } from 'lucide-react';
import { recipientsApi, topicsApi } from '../api';
import styles from './SubscriberConfig.module.css';

interface Topic {
  id: number;
  name: string;
  display_name: string;
}

export default function SubscriberConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  const [chatId, setChatId] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [receiveBreaking, setReceiveBreaking] = useState(true);
  const [receiveDigest, setReceiveDigest] = useState(true);
  const [isActive, setIsActive] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch topics and user recipient config
  useEffect(() => {
    async function loadData() {
      try {
        const [topicsRes, configRes] = await Promise.all([
          topicsApi.list(),
          recipientsApi.myConfig()
        ]);
        
        setTopics(topicsRes.data);
        
        const config = configRes.data;
        setChatId(config.telegram_chat_id || '');
        setSelectedTopics(config.subscribed_topics || []);
        setReceiveBreaking(config.receive_breaking ?? true);
        setReceiveDigest(config.receive_digest ?? true);
        setIsActive(config.is_active ?? true);
      } catch (err: any) {
        setError('Failed to load alert configuration.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTopicToggle = (topicName: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicName)
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await recipientsApi.updateMyConfig({
        telegram_chat_id: chatId,
        subscribed_topics: selectedTopics,
        receive_breaking: receiveBreaking,
        receive_digest: receiveDigest,
        is_active: isActive
      });
      setSuccess('Alert settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update alert settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner} />
        <p>Loading personal alert settings…</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title}>Alert Settings</h1>
        <p className={styles.subtitle}>Configure how you receive automated real-time Telegram intelligence bulletins</p>
      </motion.div>

      <div className={styles.grid}>
        <motion.form 
          onSubmit={handleSave}
          className={styles.card}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className={styles.cardTitle}>Telegram Destination</h2>
          
          <div className={styles.field}>
            <label className={styles.label}>Telegram Chat ID</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. 123456789"
                value={chatId}
                onChange={e => setChatId(e.target.value)}
                required
              />
            </div>
            <div className={styles.tipBlock}>
              <HelpCircle size={14} />
              <span>To get your Chat ID, message <strong>@userinfobot</strong> or our bot on Telegram.</span>
            </div>
          </div>

          <hr className={styles.divider} />

          <h2 className={styles.cardTitle}>Topic Subscriptions</h2>
          <p className={styles.cardDesc}>Select the feed channels you would like to automatically filter and consume:</p>
          
          <div className={styles.topicsGrid}>
            {topics.map(topic => {
              const isChecked = selectedTopics.includes(topic.name);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleTopicToggle(topic.name)}
                  className={`${styles.topicButton} ${isChecked ? styles.topicSelected : ''}`}
                >
                  <span className={styles.checkboxRound}>
                    {isChecked && <span className={styles.checkedDot} />}
                  </span>
                  <span className={styles.topicLabel}>{topic.display_name}</span>
                </button>
              );
            })}
          </div>

          <hr className={styles.divider} />

          <h2 className={styles.cardTitle}>Preferences & Schedules</h2>
          
          <div className={styles.switchRow}>
            <div className={styles.switchInfo}>
              <div className={styles.switchLabel}>
                <Bell size={16} color="var(--accent)" />
                <span>Instant Alerts (Breaking News)</span>
              </div>
              <div className={styles.switchDesc}>Receive instant Telegram broadcasts when highly critical AI classification events trigger.</div>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={receiveBreaking}
                onChange={e => setReceiveBreaking(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchInfo}>
              <div className={styles.switchLabel}>
                <Clock size={16} color="var(--accent)" />
                <span>Scheduled Digests</span>
              </div>
              <div className={styles.switchDesc}>Receive summarized periodic bulletins of RSS feeds compiled directly by our backend AI models.</div>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={receiveDigest}
                onChange={e => setReceiveDigest(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchInfo}>
              <div className={styles.switchLabel}>
                <RefreshCw size={16} color={isActive ? "#34d399" : "#f87171"} />
                <span>Subscription Status</span>
              </div>
              <div className={styles.switchDesc}>Temporarily mute or unmute all system notifications with a single click.</div>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.successBanner}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            className={styles.saveBtn}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className={styles.inlineSpinner} />
                Saving Changes…
              </>
            ) : (
              <>
                <Send size={16} />
                Save Settings
              </>
            )}
          </button>
        </motion.form>

        <motion.div 
          className={styles.infoPanel}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.infoCard}>
            <h3>How it works</h3>
            <p>Our platform runs continuous machine-learning tasks on top of designated Kafka ingestion channels. When key publications are detected, the system passes articles to our classification models.</p>
            <p>If they hit your targeted interests, we compile premium briefings and deliver them seamlessly to your private Telegram client!</p>
          </div>
          <div className={styles.statusBox}>
            <div className={styles.statusDot} />
            <div>
              <h4>Gateway Connection Online</h4>
              <p>Delivery node is actively processing background tasks.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
