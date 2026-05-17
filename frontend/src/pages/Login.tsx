import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, User, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { authApi } from '../api';
import styles from './Login.module.css';

interface LoginProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      try {
        await authApi.signup({ username, password });
        setSuccess('Account created! You can now log in.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Sign up failed. Username might be taken.');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await authApi.login({ username, password });
        const { access_token, username: loggedUser } = res.data;
        onLoginSuccess(access_token, loggedUser);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Invalid username or password');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGlow} />
      
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Sparkles size={28} color="var(--accent)" />
          </div>
          <h1 className={styles.title}>Newron AI</h1>
          <p className={styles.subtitle}>Real-time News Alerts & Analytics Pipeline</p>
        </div>

        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tab} ${!isSignUp ? styles.activeTab : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
          >
            Sign In
          </button>
          <button 
            className={`${styles.tab} ${isSignUp ? styles.activeTab : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.icon} />
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Enter username" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <KeyRound size={18} className={styles.icon} />
              <input 
                type="password" 
                className={styles.input} 
                placeholder="Enter password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <AnimatePresence>
            {isSignUp && (
              <motion.div 
                className={styles.inputGroup}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <KeyRound size={18} className={styles.icon} />
                  <input 
                    type="password" 
                    className={styles.input} 
                    placeholder="Confirm password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div 
                className={styles.errorAlert}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div 
                className={styles.successAlert}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Sparkles size={16} />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : isSignUp ? (
              <>
                <UserPlus size={18} /> Sign Up
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
