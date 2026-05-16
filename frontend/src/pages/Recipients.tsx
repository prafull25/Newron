import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ToggleLeft, ToggleRight, Users, Bell, BookOpen, Edit2 } from 'lucide-react';
import { recipientsApi, topicsApi } from '../api';
import styles from './Recipients.module.css';

interface Recipient {
  id: number; name: string; telegram_chat_id: string; subscribed_topics: string[];
  receive_breaking: boolean; receive_digest: boolean; is_active: boolean; created_at: string;
}

export default function Recipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', telegram_chat_id: '', subscribed_topics: [] as string[], receive_breaking: true, receive_digest: true });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [rec, top] = await Promise.all([recipientsApi.list(), topicsApi.list()]);
      setRecipients(rec.data); setAllTopics(top.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (r: Recipient) => {
    await recipientsApi.update(r.id, { is_active: !r.is_active }); load();
  };
  
  const del = async (id: number) => {
    if (!confirm('Delete this recipient?')) return;
    await recipientsApi.delete(id); load();
  };
  
  const edit = (r: Recipient) => {
    setForm({
      name: r.name,
      telegram_chat_id: r.telegram_chat_id,
      subscribed_topics: [...r.subscribed_topics],
      receive_breaking: r.receive_breaking,
      receive_digest: r.receive_digest
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const openNewForm = () => {
    setForm({ name: '', telegram_chat_id: '', subscribed_topics: [], receive_breaking: true, receive_digest: true });
    setEditingId(null);
    setShowForm(true);
  };

  const toggleTopic = (name: string) => {
    setForm(f => ({
      ...f,
      subscribed_topics: f.subscribed_topics.includes(name)
        ? f.subscribed_topics.filter(t => t !== name)
        : [...f.subscribed_topics, name]
    }));
  };
  
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editingId) {
        await recipientsApi.update(editingId, form);
      } else {
        await recipientsApi.create(form);
      }
      setShowForm(false);
      load();
    } finally { setSubmitting(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Recipients</h1>
          <p className={styles.subtitle}>Manage Telegram notification subscribers</p>
        </div>
        <button className={styles.btnPrimary} onClick={openNewForm}>
          <Plus size={16} /> Add Recipient
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form className={styles.form} onSubmit={submit}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Name</label>
                <input required placeholder="e.g. Prafull" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Telegram Chat ID</label>
                <input required placeholder="e.g. 123456789" value={form.telegram_chat_id} onChange={e => setForm(f => ({ ...f, telegram_chat_id: e.target.value }))} disabled={editingId !== null} />
              </div>
            </div>
            <div className={styles.field}>
              <label>Subscribed Topics</label>
              <div className={styles.topicPicker}>
                {allTopics.map(t => (
                  <button type="button" key={t.name}
                    className={`${styles.topicBtn} ${form.subscribed_topics.includes(t.name) ? styles.selected : ''}`}
                    onClick={() => toggleTopic(t.name)}>
                    {t.display_name}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.checkRow}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.receive_breaking} onChange={e => setForm(f => ({ ...f, receive_breaking: e.target.checked }))} />
                <Bell size={14} /> Breaking News
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.receive_digest} onChange={e => setForm(f => ({ ...f, receive_digest: e.target.checked }))} />
                <BookOpen size={14} /> Daily Digest
              </label>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Recipient')}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className={styles.empty}>Loading…</div>
      ) : recipients.length === 0 ? (
        <div className={styles.empty}><Users size={32} /><p>No recipients yet.</p></div>
      ) : (
        <div className={styles.list}>
          {recipients.map((r, i) => (
            <motion.div key={r.id} className={`${styles.card} ${!r.is_active ? styles.inactive : ''}`}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={styles.avatar}>{r.name[0].toUpperCase()}</div>
              <div className={styles.info}>
                <div className={styles.name}>{r.name}</div>
                <div className={styles.meta}>Chat ID: {r.telegram_chat_id}</div>
                <div className={styles.tags}>
                  {r.subscribed_topics.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                  {r.receive_breaking && <span className={`${styles.tag} ${styles.breaking}`}><Bell size={10} />Breaking</span>}
                  {r.receive_digest && <span className={`${styles.tag} ${styles.digest}`}><BookOpen size={10} />Digest</span>}
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn} onClick={() => toggle(r)}>
                  {r.is_active ? <ToggleRight size={22} color="var(--success)" /> : <ToggleLeft size={22} color="var(--text-muted)" />}
                </button>
                <button className={styles.iconBtn} onClick={() => edit(r)}><Edit2 size={16} /></button>
                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => del(r.id)}><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
