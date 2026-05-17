import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Topics from './pages/Topics';
import Recipients from './pages/Recipients';
import KafkaMonitor from './pages/KafkaMonitor';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import SubscriberConfig from './pages/SubscriberConfig';
import './index.css';
import styles from './App.module.css';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [isSuperuser, setIsSuperuser] = useState<boolean>(localStorage.getItem('is_superuser') === 'true');

  const handleLoginSuccess = (userToken: string, userLogin: string, superadmin: boolean) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('username', userLogin);
    localStorage.setItem('is_superuser', String(superadmin));
    setToken(userToken);
    setUsername(userLogin);
    setIsSuperuser(superadmin);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('is_superuser');
    setToken(null);
    setUsername(null);
    setIsSuperuser(false);
  };

  if (!token || !username) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Sidebar username={username} isSuperuser={isSuperuser} onLogout={handleLogout} />
        <main className={styles.main}>
          <Routes>
            {isSuperuser ? (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/topics" element={<Topics />} />
                <Route path="/recipients" element={<Recipients />} />
                <Route path="/kafka" element={<KafkaMonitor />} />
                <Route path="/analytics" element={<Analytics />} />
              </>
            ) : (
              <Route path="/" element={<SubscriberConfig />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
