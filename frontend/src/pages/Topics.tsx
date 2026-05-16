import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ToggleLeft, ToggleRight, Rss, Clock, Edit2 } from 'lucide-react';
import { topicsApi } from '../api';
import styles from './Topics.module.css';

interface Topic {
  id: number; name: string; display_name: string; sources: string[];
  schedule: string; breaking_keywords: string[]; is_active: boolean; created_at: string;
}

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', display_name: '', frequency: '5', active_from: '0', active_until: '23', breaking_keywords: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try { const res = await topicsApi.list(); setTopics(res.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (topic: Topic) => {
    await topicsApi.update(topic.name, { is_active: !topic.is_active });
    load();
  };

  const del = async (name: string) => {
    if (!confirm(`Delete topic "${name}"?`)) return;
    await topicsApi.delete(name);
    load();
  };

  const parseSchedule = (cron: string) => {
    let freq = '5';
    let from = '0';
    let until = '23';

    if (cron === '0 0 * * *') {
      return { freq: '1440', from: '0', until: '23' };
    }
    if (cron === '0 */6 * * *') {
      return { freq: '360', from: '0', until: '23' };
    }
    if (cron === '0 * * * *') {
      return { freq: '60', from: '0', until: '23' };
    }

    const parts = cron.split(' ');
    if (parts.length === 5) {
      if (parts[0] === '0') freq = '60';
      else if (parts[0].startsWith('*/')) freq = parts[0].substring(2);

      if (parts[1].includes('-')) {
        const hours = parts[1].split('-');
        from = hours[0];
        until = hours[1];
      } else if (parts[1] !== '*') {
        from = parts[1];
        until = parts[1];
      }
    }
    return { freq, from, until };
  };

  const edit = (t: Topic) => {
    const s = parseSchedule(t.schedule);
    setForm({
      name: t.name,
      display_name: t.display_name,
      frequency: s.freq,
      active_from: s.from,
      active_until: s.until,
      breaking_keywords: t.breaking_keywords.join(', ')
    });
    setEditingName(t.name);
    setShowForm(true);
  };

  const openNewForm = () => {
    setForm({ name: '', display_name: '', frequency: '5', active_from: '0', active_until: '23', breaking_keywords: '' });
    setEditingName(null);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let minuteStr = `*/${form.frequency}`;
      let hourStr = '*';

      if (form.frequency === '60') minuteStr = '0';
      if (form.frequency === '360') { minuteStr = '0'; hourStr = '*/6'; }
      if (form.frequency === '1440') { minuteStr = '0'; hourStr = '0'; }

      if (form.frequency !== '1440' && form.frequency !== '360') {
        if (form.active_from !== '0' || form.active_until !== '23') {
          hourStr = `${form.active_from}-${form.active_until}`;
        }
      }

      const cronStr = `${minuteStr} ${hourStr} * * *`;
      const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(form.display_name)}&hl=en-IN&gl=IN&ceid=IN:en`;

      const payload = {
        name: form.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: form.display_name,
        sources: [googleNewsUrl],
        schedule: cronStr,
        breaking_keywords: form.breaking_keywords.split(',').map(k => k.trim()).filter(Boolean),
      };
      
      if (editingName) {
        await topicsApi.update(editingName, payload);
      } else {
        await topicsApi.create(payload);
      }
      
      setShowForm(false);
      load();
    } finally { setSubmitting(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Topics</h1>
          <p className={styles.subtitle}>Manage news categories and auto-generated sources</p>
        </div>
        <button className={styles.btnPrimary} onClick={openNewForm}>
          <Plus size={16} /> Add Topic
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form className={styles.form} onSubmit={submit}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Slug</label>
                <input required placeholder="e.g. crypto" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={editingName !== null} />
              </div>
              <div className={styles.field}>
                <label>Display Name</label>
                <input required placeholder="e.g. Cryptocurrency" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Repeat Every</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="360">6 hours</option>
                  <option value="1440">24 hours</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Active From (Hour)</label>
                <select value={form.active_from} onChange={e => setForm(f => ({ ...f, active_from: e.target.value }))} disabled={form.frequency === '1440' || form.frequency === '360'}>
                  {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Active Until (Hour)</label>
                <select value={form.active_until} onChange={e => setForm(f => ({ ...f, active_until: e.target.value }))} disabled={form.frequency === '1440' || form.frequency === '360'}>
                  {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label>Breaking Keywords (comma-separated)</label>
                <input placeholder="crash, breaking, urgent" value={form.breaking_keywords} onChange={e => setForm(f => ({ ...f, breaking_keywords: e.target.value }))} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Saving…' : (editingName ? 'Save Changes' : 'Create Topic')}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className={styles.empty}>Loading topics…</div>
      ) : topics.length === 0 ? (
        <div className={styles.empty}><Rss size={32} /><p>No topics yet. Add one above.</p></div>
      ) : (
        <div className={styles.grid}>
          {topics.map((topic, i) => (
            <motion.div key={topic.id} className={`${styles.card} ${!topic.is_active ? styles.inactive : ''}`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={styles.cardTop}>
                <div className={styles.cardTitle}>
                  <span className={styles.displayName}>{topic.display_name}</span>
                  <span className={styles.slug}>{topic.name}</span>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.iconBtn} onClick={() => toggle(topic)} title="Toggle active">
                    {topic.is_active ? <ToggleRight size={22} color="var(--success)" /> : <ToggleLeft size={22} color="var(--text-muted)" />}
                  </button>
                  <button className={styles.iconBtn} onClick={() => edit(topic)} title="Edit Topic"><Edit2 size={16} /></button>
                  <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => del(topic.name)} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className={styles.cardMeta}>
                <Clock size={12} /><span>{topic.schedule}</span>
                <span className={styles.dot}>·</span>
                <Rss size={12} /><span>Auto-Generated Feed</span>
              </div>
              <div className={styles.keywords}>
                {topic.breaking_keywords.slice(0, 5).map(kw => (
                  <span key={kw} className={styles.kw}>{kw}</span>
                ))}
                {topic.breaking_keywords.length > 5 && <span className={styles.kwMore}>+{topic.breaking_keywords.length - 5}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
